import logging
import os

import yt_dlp

from celery_worker import celery_app

# Configuration
DOWNLOADS_FOLDER = "/app/downloads"

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def download_highest_quality_video_task(self, url):
    """Download YouTube video at highest quality (best video + best audio merged)."""
    try:
        self.update_state(
            state="PROGRESS", meta={"status": "Downloading highest quality video..."}
        )

        logger.info(f"⬇️ Downloading highest quality video from: {url}")

        # Use the best video and best audio, then merge them
        ydl_opts = {
            "format": "bestvideo[height<=1080][vcodec*=avc1]+bestaudio[acodec*=mp4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
            "outtmpl": os.path.join(DOWNLOADS_FOLDER, "%(title).120B_HQ.%(ext)s"),
            "noplaylist": True,
            "restrict_filenames": True,
            "merge_output_format": "mp4",  # Ensure output is always MP4
            "retries": 10,  # Retry overall download
            "fragment_retries": 10,  # Retry failed fragments
            "continue_dl": True,
            "postprocessor_args": {
                "ffmpeg": [
                    "-c:v",
                    "libx264",
                    "-profile:v",
                    "high",
                    "-level",
                    "4.1",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-movflags",
                    "+faststart",
                ]
            },
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            self.update_state(
                state="PROGRESS", meta={"status": "Extracting video info..."}
            )
            info_dict = ydl.extract_info(url, download=False)  # Get info first
            title = info_dict.get("title", "video")
            duration = info_dict.get("duration", 0)

            self.update_state(
                state="PROGRESS", meta={"status": f"Downloading: {title[:50]}..."}
            )

            # Now download with merge
            info_dict = ydl.extract_info(url, download=True)
            downloaded_filepath = ydl.prepare_filename(info_dict)

            # Ensure the file has HQ suffix and is MP4
            base, ext = os.path.splitext(downloaded_filepath)
            if not base.endswith("_HQ"):
                final_filename = f"{base}_HQ.mp4"
            else:
                final_filename = f"{base}.mp4"

            # If the downloaded file has a different name, rename it
            if downloaded_filepath != final_filename and os.path.exists(
                downloaded_filepath
            ):
                os.rename(downloaded_filepath, final_filename)
                downloaded_filepath = final_filename
            elif not os.path.exists(final_filename):
                # Find the actual downloaded file (yt-dlp might have changed the name)
                download_dir = os.path.dirname(final_filename)
                base_name = os.path.basename(base)
                for file in os.listdir(download_dir):
                    if base_name in file and file.endswith(".mp4"):
                        actual_file = os.path.join(download_dir, file)
                        os.rename(actual_file, final_filename)
                        downloaded_filepath = final_filename
                        break

            logger.info(
                f"✅ Highest quality video downloaded: {os.path.basename(final_filename)}"
            )

            # Get file size for info
            file_size = os.path.getsize(final_filename) / (1024 * 1024)  # MB

            return {
                "status": "SUCCESS",
                "title": title,
                "filename": os.path.basename(final_filename),
                "file_size_mb": round(file_size, 1),
                "duration": duration,
                "download_url": f"/download/{os.path.basename(final_filename)}",
                "message": f"Video downloaded successfully! Size: {round(file_size, 1)}MB",
            }

    except Exception as e:
        import traceback

        error_msg = f"Video download failed: {str(e)}"
        traceback_msg = traceback.format_exc()
        logger.error(f"{error_msg}\n{traceback_msg}")
        # Don't use update_state with FAILURE - causes issues with newer Celery versions
        return {"status": "FAILURE", "error": error_msg, "traceback": traceback_msg}
