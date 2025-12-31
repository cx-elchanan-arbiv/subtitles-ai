"""
Transcription and translation service for SubsTranslator
Handles video transcription and subtitle translation with various AI models
"""
import json
import os
import subprocess
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np

from config import get_config
from logging_config import get_logger
from core.exceptions import (
    AudioExtractionError,
    FFmpegProcessError,
    FFmpegTimeoutError,
    TranslationServiceError,
)
from services.translation_services import get_translator
from services.whisper_smart import smart_whisper
from performance_monitor import performance_monitor

# Configuration
config = get_config()
logger = get_logger(__name__)


def transcribe_and_translate_streamed(
    video_path,
    target_language,
    source_lang="auto",
    quality="balanced",
    model_preference="large",
    translation_service="google",
    progress_callback=None,
    model_callback=None,
    youtube_url=None,  # NEW: For Gemini support
):
    """
    P1 Step 1: Pipeline overlap - transcribe and translate simultaneously.

    Streams segments from Whisper as they're transcribed and translates them
    in parallel batches, reducing total time from sequential (transcribe + translate)
    to overlapped (max(transcribe, translate/parallelism)).

    Args:
        video_path: Path to video file
        target_language: Target language for translation
        source_lang: Source language (auto-detect if "auto")
        quality: Transcription quality preference
        model_preference: Whisper model to use
        translation_service: Translation service ("google" or "openai")
        progress_callback: Optional callback for progress updates
        model_callback: Optional callback when model is loaded

    Returns:
        dict: {
            "segments": List of segments with both text and translated_text,
            "language": Detected language
        }
    """
    logger.info("🚀 === P1: Pipeline Overlap - Streaming Transcription + Concurrent Translation ===")

    # Get parallelism settings from environment
    parallelism = int(os.environ.get('TRANSLATION_PARALLELISM', '4'))
    batch_size = int(os.environ.get('TRANSLATION_BATCH_SIZE', '20'))

    logger.info(f"⚙️ Translation parallelism: {parallelism} workers, batch size: {batch_size} segments")

    try:
        # FAKE mode: return small deterministic segments
        if config.USE_FAKE_YTDLP:
            if progress_callback:
                progress_callback(25, "Starting FAKE transcription...", 85, "Step 1: FAKE Whisper", 5)
            fake_segments = [
                {"start": 0.0, "end": 2.0, "text": "Hello world", "translated_text": "Hello world"},
                {"start": 2.5, "end": 4.0, "text": "This is a test", "translated_text": "This is a test"},
            ]
            return {
                "segments": fake_segments,
                "language": (source_lang if source_lang != "auto" else "en"),
            }

        # === Phase 1: Audio Extraction (same as transcribe_video) ===
        logger.info("📹 Step 1/3: Extracting audio from video...")

        # Probe audio format
        ffprobe_cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_streams", "-select_streams", "a", video_path,
        ]
        try:
            probe_result = subprocess.run(
                ffprobe_cmd, capture_output=True, text=True,
                check=True, timeout=config.FFPROBE_TIMEOUT,
            )
            streams = probe_result.stdout
        except subprocess.TimeoutExpired:
            raise FFmpegTimeoutError("audio_probe", config.FFPROBE_TIMEOUT)
        except subprocess.CalledProcessError as e:
            raise FFmpegProcessError(
                "audio_probe", e.stderr.decode() if e.stderr else "Unknown error"
            )

        try:
            audio_streams = json.loads(streams).get("streams", [])
        except json.JSONDecodeError:
            audio_streams = []

        if not audio_streams:
            raise ValueError("No audio stream found in the video file")

        audio_info = audio_streams[0]
        codec = audio_info.get("codec_name")
        sample_rate = int(audio_info.get("sample_rate", 0))
        channels = int(audio_info.get("channels", 0))

        is_optimal_format = (
            codec == "pcm_s16le" and sample_rate == 16000 and channels == 1
        )

        if is_optimal_format:
            logger.info("✅ Audio already in optimal format")
            ffmpeg_cmd = [
                "ffmpeg", "-i", video_path, "-nostdin",
                "-f", "s16le", "-acodec", "copy", "-",
            ]
        else:
            logger.info(f"🔄 Re-encoding audio: {codec} @ {sample_rate}Hz, {channels}ch → 16kHz mono")
            ffmpeg_cmd = [
                "ffmpeg", "-i", video_path, "-nostdin",
                "-f", "s16le", "-ac", "1", "-ar", "16000", "-",
            ]

        if progress_callback:
            progress_callback(15, "Processing audio...", 60, "Step 1: Audio processing", 5)

        try:
            process = subprocess.Popen(
                ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            audio_buffer, stderr = process.communicate(timeout=config.FFMPEG_RUN_TIMEOUT)

            if process.returncode != 0:
                raise AudioExtractionError(video_path, stderr.decode())
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise FFmpegTimeoutError("audio_extraction", config.FFMPEG_RUN_TIMEOUT)

        if progress_callback:
            progress_callback(20, "Preparing audio data...", 75, "Step 1: Data preparation", 5)

        audio_np = (
            np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0
        )
        audio_duration = len(audio_np) / 16000  # 16kHz sample rate

        logger.info(f"📊 Audio extracted: {audio_duration:.1f}s duration")

        # === Phase 2: Transcription ===
        # Check if Gemini is requested - if so, use transcribe_smart() instead of manual streaming
        if model_preference == "gemini":
            logger.info("🎯 Gemini requested - using smart transcription path")

            if progress_callback:
                progress_callback(25, "Starting transcription with Gemini...", 25, "Step 1: Gemini AI", 5)

            if model_callback:
                model_callback()

            # Use transcribe_smart which handles Gemini
            result = smart_whisper.transcribe_smart(
                audio_np,
                language=source_lang,
                duration=audio_duration,
                quality_preference=quality,
                model_preference=model_preference,
                progress_callback=progress_callback,
                youtube_url=youtube_url,
            )

            segments = result["segments"]
            detected_language = result["language"]

            # Translate segments
            if progress_callback:
                progress_callback(75, "Translating transcription...", 75, "Step 2: Translation", 5)

            translator = get_translator(translation_service)

            # Collect all texts for batch translation
            texts_to_translate = [seg["text"] for seg in segments if seg.get("text")]

            # Translate in batch
            if texts_to_translate:
                translations = translator.translate_batch(
                    texts_to_translate,
                    target_language=target_language,
                    source_language=detected_language
                )

                # Map translations back to segments
                translation_idx = 0
                for segment in segments:
                    if segment.get("text"):
                        segment["translated_text"] = translations[translation_idx]
                        translation_idx += 1

            if progress_callback:
                progress_callback(100, "Completed!", 100, "Step 3: Complete", 5)

            return {
                "segments": segments,
                "language": detected_language,
            }

        # === Phase 2: Load Whisper Model (non-Gemini path) ===
        logger.info("🤖 Step 2/3: Loading Whisper model...")

        if progress_callback:
            progress_callback(25, "Starting transcription with Whisper...", 25, "Step 1: Whisper AI", 5)

        if model_callback:
            model_callback()

        # Choose and load model
        if model_preference and model_preference in ["tiny", "base", "medium", "large"]:
            model_name = model_preference
        else:
            model_name = "tiny"

        model = smart_whisper.load_model(model_name)

        # Transcription options
        options = {
            "word_timestamps": True,
            "beam_size": 2 if model_name in ["large", "medium"] else 5,
            "chunk_length": 30,
            "condition_on_previous_text": True,
        }

        if source_lang != "auto":
            options["language"] = source_lang

        logger.info(f"💾 Transcription settings: model={model_name}, beam_size={options['beam_size']}")

        # === Phase 3: P1 Concurrent Translation - Streaming + Parallel Batches ===
        logger.info(f"🔄 Step 3/3: Streaming transcription with {parallelism}x concurrent translation...")

        transcription_start = time.time()

        # Get translator
        translator = get_translator(translation_service)

        # Start transcription stream
        segments_iter, info = model.transcribe(audio_np, **options)
        detected_language = info.language

        logger.info(f"🌍 Detected language: {detected_language}")

        # Storage for results
        current_batch = []
        batch_futures = {}  # Maps future -> (batch_index, batch_segments)
        completed_segments = {}  # Maps global_index -> segment_with_translation
        next_segment_index = 0
        batch_index = 0

        # Create thread pool for parallel translation
        executor = ThreadPoolExecutor(max_workers=parallelism)

        def translate_batch_worker(batch_segments, batch_idx, service):
            """Worker function to translate a batch of segments"""
            thread_id = threading.get_ident()
            try:
                logger.info(f"🔄 [Thread-{thread_id}] Translating batch #{batch_idx}: {len(batch_segments)} segments")

                # Extract texts
                texts = [seg["text"] for seg in batch_segments]

                # Translate
                translated_texts = translator.translate_batch(
                    texts, target_language, source_language=detected_language
                )

                # Assign translations back
                for i, seg in enumerate(batch_segments):
                    seg["translated_text"] = translated_texts[i]

                logger.info(f"✅ [Thread-{thread_id}] Batch #{batch_idx} translated successfully")
                return batch_segments

            except Exception as e:
                logger.error(f"❌ [Thread-{thread_id}] Batch #{batch_idx} translation failed: {e}")
                # Return segments with original text as fallback
                for seg in batch_segments:
                    seg["translated_text"] = seg["text"]
                return batch_segments

        # Process segments as they arrive
        try:
            for segment in segments_iter:
                # Convert to dict format
                segment_dict = {
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text,
                    "index": next_segment_index,
                }

                current_batch.append(segment_dict)
                next_segment_index += 1

                # Update progress
                if progress_callback and audio_duration:
                    transcription_progress = (segment.end / audio_duration) * 100
                    step_progress = 30 + int(transcription_progress * 0.55)
                    progress_callback(
                        step_progress,
                        f"Transcription + Translation: {segment.end:.0f}s/{audio_duration:.0f}s",
                        step_progress,
                        "Step 1+2: Whisper + Translation",
                        5
                    )

                # When batch is full, submit for translation
                if len(current_batch) >= batch_size:
                    batch_to_translate = current_batch.copy()
                    logger.info(f"📤 Submitting batch #{batch_index} to thread pool (inflight={len(batch_futures)})")
                    future = executor.submit(
                        translate_batch_worker,
                        batch_to_translate,
                        batch_index,
                        translation_service
                    )
                    batch_futures[future] = (batch_index, batch_to_translate)
                    batch_index += 1
                    current_batch = []

            # Submit final partial batch if any
            if current_batch:
                logger.info(f"📤 Submitting final batch #{batch_index} to thread pool (inflight={len(batch_futures)})")
                future = executor.submit(
                    translate_batch_worker,
                    current_batch,
                    batch_index,
                    translation_service
                )
                batch_futures[future] = (batch_index, current_batch)

            logger.info(f"✅ Transcription complete: {next_segment_index} segments, {len(batch_futures)} batches")

            # Collect translation results as they complete
            logger.info(f"⏳ Waiting for {len(batch_futures)} translation batches to complete...")

            for future in as_completed(batch_futures):
                batch_idx, original_batch = batch_futures[future]
                try:
                    translated_batch = future.result()  # P1 FIX: Use .result() instead of .get()
                    # Store by index for ordering
                    for seg in translated_batch:
                        completed_segments[seg["index"]] = seg
                    logger.info(f"✅ Collected batch #{batch_idx} results")
                except Exception as e:
                    logger.error(f"❌ Failed to collect batch #{batch_idx}: {e}")
                    # Use original batch as fallback
                    for seg in original_batch:
                        seg["translated_text"] = seg["text"]
                        completed_segments[seg["index"]] = seg

            # Reconstruct segments in order
            all_segments = []
            for i in range(next_segment_index):
                if i in completed_segments:
                    seg = completed_segments[i]
                    # Remove index field before returning
                    del seg["index"]
                    all_segments.append(seg)

            logger.info(f"✅ All translations complete: {len(all_segments)} segments")

        finally:
            executor.shutdown(wait=True)

        transcription_duration = time.time() - transcription_start

        # Log performance
        performance_monitor.log_transcription_performance(
            audio_duration,
            transcription_duration,
            model_name,
            segments_count=len(all_segments)
        )

        logger.info(
            f"🎉 Pipeline overlap complete! Total time: {transcription_duration:.1f}s "
            f"for {audio_duration:.1f}s audio"
        )

        if progress_callback:
            progress_callback(90, "Transcription and translation completed", 90, "Step 1+2: Processing results", 5)

        return {
            "segments": all_segments,
            "language": detected_language,
        }

    except Exception as e:
        logger.error(f"Pipeline overlap failed: {e}")
        raise


def transcribe_video(
    video_path,
    source_lang="auto",
    quality="balanced",
    model_preference="large",
    progress_callback=None,
    model_callback=None,
    youtube_url=None,  # FIXED: Added missing parameter
):
    """
    Transcribe video using Whisper by streaming audio from FFmpeg directly.
    """
    try:
        # FAKE mode: return small deterministic segments without running Whisper
        if config.USE_FAKE_YTDLP:
            if progress_callback:
                progress_callback(
                    25, "Starting FAKE transcription...", 85, "Step 1: FAKE Whisper", 5
                )
            fake_segments = [
                {"start": 0.0, "end": 2.0, "text": "Hello world"},
                {"start": 2.5, "end": 4.0, "text": "This is a test"},
            ]
            return {
                "segments": fake_segments,
                "language": (source_lang if source_lang != "auto" else "en"),
            }

        ffprobe_cmd = [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_streams",
            "-select_streams",
            "a",
            video_path,
        ]
        try:
            probe_result = subprocess.run(
                ffprobe_cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=config.FFPROBE_TIMEOUT,
            )
            streams = probe_result.stdout
        except subprocess.TimeoutExpired:
            raise FFmpegTimeoutError("audio_probe", config.FFPROBE_TIMEOUT)
        except subprocess.CalledProcessError as e:
            raise FFmpegProcessError(
                "audio_probe", e.stderr.decode() if e.stderr else "Unknown error"
            )

        try:
            audio_streams = json.loads(streams).get("streams", [])
        except json.JSONDecodeError:
            audio_streams = []

        if not audio_streams:
            raise ValueError(
                "No audio stream found in the video file. The file may be corrupted or unsupported."
            )

        audio_info = audio_streams[0]
        codec = audio_info.get("codec_name")
        sample_rate = int(audio_info.get("sample_rate", 0))
        channels = int(audio_info.get("channels", 0))

        is_optimal_format = (
            codec == "pcm_s16le" and sample_rate == 16000 and channels == 1
        )

        if is_optimal_format:
            logger.info(
                "✅ Audio is already in the optimal format. Extracting without re-encoding."
            )
            ffmpeg_cmd = [
                "ffmpeg",
                "-i",
                video_path,
                "-nostdin",
                "-f",
                "s16le",
                "-acodec",
                "copy",
                "-",
            ]
        else:
            logger.info(
                f"Audio format is {codec} @ {sample_rate}Hz, {channels}ch. Re-encoding to 16kHz mono pcm_s16le."
            )
            ffmpeg_cmd = [
                "ffmpeg",
                "-i",
                video_path,
                "-nostdin",
                "-f",
                "s16le",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-",
            ]

        if progress_callback:
            progress_callback(15, "Processing audio...", 60, "Step 1: Audio processing", 5)

        try:
            process = subprocess.Popen(
                ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            audio_buffer, stderr = process.communicate(
                timeout=config.FFMPEG_RUN_TIMEOUT
            )

            if process.returncode != 0:
                raise AudioExtractionError(video_path, stderr.decode())
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise FFmpegTimeoutError("audio_extraction", config.FFMPEG_RUN_TIMEOUT)

        if progress_callback:
            progress_callback(20, "Preparing audio data...", 75, "Step 1: Data preparation", 5)

        audio_np = (
            np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0
        )

        if progress_callback:
            progress_callback(
                25, "Starting transcription with Whisper...", 25, "Step 1: Whisper AI", 5
            )

        if model_callback:
            model_callback()

        # Phase A: Enhanced transcription performance monitoring
        transcription_start = time.time()
        # Calculate duration for progress tracking
        audio_duration = len(audio_np) / 16000  # 16kHz sample rate

        result = smart_whisper.transcribe_smart(
            audio_np,
            language=source_lang,
            duration=audio_duration,
            quality_preference=quality,
            model_preference=model_preference,
            progress_callback=progress_callback,
            youtube_url=youtube_url,
        )
        transcription_duration = time.time() - transcription_start

        # Phase A: Log transcription performance
        segments_count = len(result.get("segments", [])) if isinstance(result, dict) else 0
        performance_monitor.log_transcription_performance(
            audio_duration,
            transcription_duration,
            model_preference or "auto",
            segments_count=segments_count
        )

        if progress_callback:
            progress_callback(90, "Transcription completed", 90, "Step 1: Processing results", 5)

        return result

    except (subprocess.CalledProcessError, ValueError, Exception) as e:
        logger.error(f"Transcription failed: {e}")
        raise


def translate_segments(
    segments, target_language, service="google", progress_callback=None
):
    """Translate segments using the specified translation service."""
    if not segments or not target_language:
        return segments

    try:
        # FAKE mode: produce deterministic translations locally (no network)
        if config.USE_FAKE_YTDLP:
            for segment in segments:
                base_text = segment.get("text", "")
                segment["translated_text"] = (
                    base_text if target_language == "en" else f"{base_text}"
                )
            return segments

        if progress_callback:
            progress_callback(52, "Preparing text for translation...", 30, "Step 2: Text preparation", 5)

        original_texts = [segment["text"] for segment in segments]

        if progress_callback:
            progress_callback(
                54,
                f"Connecting to {service.capitalize()}...",
                45,
                f"Step 2: Connecting to {service.capitalize()}",
                5,
            )

        translator = get_translator(service)

        if progress_callback:
            progress_callback(57, "Translating text...", 65, "Step 2: Active translation", 5)

        translated_texts = translator.translate_batch(original_texts, target_language)

        if progress_callback:
            progress_callback(62, "Processing translations...", 85, "Step 2: Processing results", 5)

        # Flexible validation: allow minor mismatches but handle them gracefully
        if not translated_texts:
            raise TranslationServiceError(
                service, "Translation service returned no results"
            )

        # Handle length mismatches gracefully
        if len(translated_texts) != len(original_texts):
            logger.warning(f"Translation count mismatch: expected {len(original_texts)}, got {len(translated_texts)}")

            if len(translated_texts) > len(original_texts):
                # Trim excess translations
                logger.warning(f"Trimming {len(translated_texts) - len(original_texts)} excess translations")
                translated_texts = translated_texts[:len(original_texts)]
            elif len(translated_texts) < len(original_texts):
                # Fill missing translations with original text
                missing_count = len(original_texts) - len(translated_texts)
                logger.warning(f"Filling {missing_count} missing translations with original text")
                for i in range(len(translated_texts), len(original_texts)):
                    translated_texts.append(original_texts[i])

        # Final sanity check
        if len(translated_texts) != len(original_texts):
            raise TranslationServiceError(
                service, f"Cannot reconcile translation count: expected {len(original_texts)}, final {len(translated_texts)}"
            )

        for i, segment in enumerate(segments):
            segment["translated_text"] = translated_texts[i]

        if progress_callback:
            progress_callback(64, "Translation completed successfully", 100, "Step 2: Saving results", 5)

        logger.info(
            f"✅ Translated {len(segments)} segments to {target_language} using {service}."
        )
        return segments

    except Exception as e:
        logger.error(
            f"Translation with {service} failed for language '{target_language}': {e}. Falling back to original text."
        )
        for segment in segments:
            segment["translated_text"] = segment["text"]
        return segments
