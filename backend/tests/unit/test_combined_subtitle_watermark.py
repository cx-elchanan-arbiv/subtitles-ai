"""
Unit tests for combined subtitle and watermark functionality
"""
import os
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock, call
import pytest

from services.subtitle_service import SubtitleService


class TestCombinedSubtitleWatermark:
    """Test the combined subtitle and watermark function."""
    
    def setup_method(self):
        """Setup test environment."""
        self.service = SubtitleService()
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test files
        self.video_path = os.path.join(self.temp_dir, "test_video.mp4")
        self.srt_path = os.path.join(self.temp_dir, "test.srt")
        self.watermark_path = os.path.join(self.temp_dir, "watermark.png")
        self.output_path = os.path.join(self.temp_dir, "output.mp4")
        
        # Create dummy files
        with open(self.video_path, 'wb') as f:
            f.write(b'dummy video content')
        
        with open(self.srt_path, 'w', encoding='utf-8') as f:
            f.write("""1
00:00:01,000 --> 00:00:03,000
Hello World

2
00:00:04,000 --> 00:00:06,000
Test subtitle
""")
        
        with open(self.watermark_path, 'wb') as f:
            f.write(b'dummy image content')
    
    def teardown_method(self):
        """Clean up test environment."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    @patch('services.subtitle_service.SubtitleService._run_ffmpeg_simple')
    def test_combined_function_single_ffmpeg_call(self, mock_run_ffmpeg):
        """Test that combined function uses single FFmpeg call."""
        # Setup mock to return success
        mock_run_ffmpeg.return_value = True
        
        # Create output file to simulate success
        with open(self.output_path, 'wb') as f:
            f.write(b'output video')
        
        # Mock subprocess.run for ffprobe
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                stdout='{"format": {"duration": "60.0"}}',
                returncode=0
            )
            
            # Call the combined function
            result = self.service.create_video_with_subtitles_and_watermark(
                self.video_path,
                self.srt_path,
                self.output_path,
                self.watermark_path,
                target_language="en",
                watermark_position=("right", "bottom"),
                watermark_opacity=0.4,
                watermark_size_height=80
            )
        
        # Verify success
        assert result is True
        
        # Verify FFmpeg was called only once
        assert mock_run_ffmpeg.call_count == 1
        
        # Get the command that was passed to _run_ffmpeg_simple
        ffmpeg_cmd = mock_run_ffmpeg.call_args[0][0]
        assert "ffmpeg" in ffmpeg_cmd
        assert "-filter_complex" in ffmpeg_cmd
        
        # Find filter_complex argument
        filter_idx = ffmpeg_cmd.index("-filter_complex") + 1
        filter_complex = ffmpeg_cmd[filter_idx]
        
        # Verify both subtitles and overlay are in the filter
        assert "subtitles=" in filter_complex
        assert "overlay=" in filter_complex
        assert "[vout]" in filter_complex
    
    @patch('services.subtitle_service.SubtitleService.create_video_with_subtitles')
    def test_fallback_when_watermark_missing(self, mock_create_video):
        """Test fallback to regular subtitle function when watermark is missing."""
        # Remove watermark file
        os.remove(self.watermark_path)
        
        # Setup mock
        mock_create_video.return_value = True
        
        # Call combined function
        result = self.service.create_video_with_subtitles_and_watermark(
            self.video_path,
            self.srt_path,
            self.output_path,
            self.watermark_path,
            target_language="en"
        )
        
        # Verify it fell back to regular function
        assert result is True
        mock_create_video.assert_called_once_with(
            self.video_path,
            self.srt_path,
            self.output_path,
            "en",
            None  # progress_callback
        )
    
    @patch('services.subtitle_service.SubtitleService._run_ffmpeg_simple')
    def test_rtl_language_support(self, mock_run_ffmpeg):
        """Test that RTL languages are handled properly."""
        # Create Hebrew SRT
        hebrew_srt = os.path.join(self.temp_dir, "hebrew.srt")
        with open(hebrew_srt, 'w', encoding='utf-8') as f:
            f.write("""1
00:00:01,000 --> 00:00:03,000
שלום עולם

2
00:00:04,000 --> 00:00:06,000
בדיקה בעברית
""")
        
        # Setup mock
        mock_run_ffmpeg.return_value = True
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                stdout='{"format": {"duration": "60.0"}}',
                returncode=0
            )
            
            # Create output file
            with open(self.output_path, 'wb') as f:
                f.write(b'output')
            
            # Call with Hebrew
            result = self.service.create_video_with_subtitles_and_watermark(
                self.video_path,
                hebrew_srt,
                self.output_path,
                self.watermark_path,
                target_language="he"
            )
            
            assert result is True
            
            # Verify RTL styling was applied
            ffmpeg_cmd = mock_run_ffmpeg.call_args[0][0]
            filter_idx = ffmpeg_cmd.index("-filter_complex") + 1
            filter_complex = ffmpeg_cmd[filter_idx]
            
            # Check for RTL-specific font settings
            assert "Noto Sans Hebrew" in filter_complex or "Hebrew" in filter_complex
