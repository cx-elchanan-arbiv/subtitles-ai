"""
YouTube routes for SubsTranslator API v1.
Handles YouTube video processing and download-only functionality.
"""
from flask import Blueprint, jsonify, request

from config import get_config
from tasks import download_and_process_youtube_task, download_youtube_only_task
from logging_config import get_logger
from i18n.translations import t
from .helpers import validate_video_url, build_watermark_config_from_data

# Configuration
config = get_config()
logger = get_logger(__name__)

# Create blueprint
youtube_bp = Blueprint('youtube', __name__)


@youtube_bp.route("/youtube", methods=["POST"])
def process_youtube_async():
    """Process a YouTube URL asynchronously."""
    try:
        # Handle both JSON and FormData (for custom logo uploads)
        if request.content_type and "application/json" in request.content_type:
            data = request.get_json()
            if not data:
                return jsonify({"error": t("errors:validation.no_data")}), 400
        else:
            # FormData request - convert string values to proper types
            data = request.form.to_dict()
            # Convert boolean strings to actual booleans
            if "auto_create_video" in data:
                data["auto_create_video"] = data["auto_create_video"].lower() == "true"
            if "watermark_enabled" in data:
                data["watermark_enabled"] = data["watermark_enabled"].lower() == "true"

        url = data.get("url")
        if not url:
            return jsonify({"error": t("errors:validation.url_required")}), 400

        # Basic URL validation
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            return jsonify({"error": t("errors:validation.url_invalid_protocol")}), 400

        # Validate URL domain
        validation_error = validate_video_url(url)
        if validation_error:
            return validation_error

        source_lang = data.get("source_lang", config.DEFAULT_SOURCE_LANG)
        target_lang = data.get("target_lang", config.DEFAULT_TARGET_LANG)
        auto_create_video = data.get("auto_create_video", False)
        whisper_model = data.get("whisper_model", config.DEFAULT_WHISPER_MODEL)
        translation_service = data.get("translation_service", "google")

        # Handle watermark configuration
        watermark_enabled = data.get("watermark_enabled", False)
        watermark_config, watermark_error = build_watermark_config_from_data(watermark_enabled, data, request)
        if watermark_error:
            return jsonify({"error": watermark_error}), 400

        if not config.is_valid_whisper_model(whisper_model):
            return (
                jsonify(
                    {
                        "error": t(
                            "errors:validation.whisper_model_invalid",
                            models=list(config.AVAILABLE_WHISPER_MODELS),
                        )
                    }
                ),
                400,
            )

        task = download_and_process_youtube_task.apply_async(
            args=[
                url,
                source_lang,
                target_lang,
                auto_create_video,
                whisper_model,
                translation_service,
                watermark_config,
            ],
            queue="processing",
        )

        # Return 202 with unified schema as per spec
        return (
            jsonify(
                {
                    "task_id": task.id,
                    "state": "PENDING",
                    "user_choices": {
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                        "auto_create_video": auto_create_video,
                        "whisper_model": whisper_model,
                        "translation_service": translation_service,
                        "url": url,
                    },
                    "initial_request": {},
                    "video_metadata": None,
                    "progress": {"overall_percent": 0, "steps": []},
                    "result": None,
                    "error": None,
                }
            ),
            202,
        )

    except Exception as e:
        logger.error(f"Error processing YouTube link: {e}")
        return jsonify({"error": str(e)}), 500


@youtube_bp.route("/download-video-only", methods=["POST"])
def download_video_only():
    """Download YouTube video without processing (transcription/translation)."""
    try:
        data = request.get_json()
        url = data.get("url")
        if not url:
            return jsonify({"error": t("errors:validation.url_required")}), 400

        # Basic URL validation
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            return jsonify({"error": t("errors:validation.url_invalid_protocol")}), 400

        # Validate URL domain
        validation_error = validate_video_url(url)
        if validation_error:
            return validation_error

        logger.info(f"Starting download-only task for URL: {url}")

        # Use the new download-only task that doesn't do any processing
        task = download_youtube_only_task.apply_async(
            args=[url, "high"], queue="processing"  # URL and quality
        )

        # Return 202 with unified schema as per spec
        return (
            jsonify(
                {
                    "task_id": task.id,
                    "state": "PENDING",
                    "user_choices": {},
                    "initial_request": {
                        "url": url,
                        "quality": "high",
                        "type": "download_only",
                    },
                    "video_metadata": None,
                    "progress": {"overall_percent": 0, "steps": []},
                    "result": None,
                    "error": None,
                }
            ),
            202,
        )

    except Exception as e:
        logger.error(f"Download-only task failed: {e}")
        return jsonify({"error": str(e)}), 500
