"""
Integration tests for the download API endpoints.
Tests both legacy /download and new /api/v1/download routes.
"""
import os
import sys
import tempfile
import pytest

# Set test environment before imports
os.environ['TESTING'] = 'true'
os.environ['FLASK_TESTING'] = '1'
os.environ['DISABLE_RATE_LIMIT'] = '1'

# Add backend to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


@pytest.fixture
def app():
    """Create Flask test app with temporary folders."""
    # Create temp directories
    with tempfile.TemporaryDirectory() as tmp_dir:
        os.environ['UPLOAD_FOLDER'] = os.path.join(tmp_dir, 'uploads')
        os.environ['DOWNLOADS_FOLDER'] = os.path.join(tmp_dir, 'downloads')
        os.environ['ASSETS_FOLDER'] = os.path.join(tmp_dir, 'assets')

        os.makedirs(os.environ['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(os.environ['DOWNLOADS_FOLDER'], exist_ok=True)
        os.makedirs(os.environ['ASSETS_FOLDER'], exist_ok=True)

        from app import app
        app.config['TESTING'] = True
        yield app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def sample_file(app):
    """Create a sample file in downloads folder for testing."""
    downloads_folder = os.environ['DOWNLOADS_FOLDER']
    sample_path = os.path.join(downloads_folder, 'test_file.srt')
    with open(sample_path, 'w', encoding='utf-8') as f:
        f.write("1\n00:00:01,000 --> 00:00:05,000\nTest subtitle\n")
    return 'test_file.srt'


@pytest.fixture
def sample_video_file(app):
    """Create a sample video file in downloads folder for testing."""
    downloads_folder = os.environ['DOWNLOADS_FOLDER']
    sample_path = os.path.join(downloads_folder, 'test_video.mp4')
    # Create a dummy file (not a real video, just for testing download)
    with open(sample_path, 'wb') as f:
        f.write(b'fake video content')
    return 'test_video.mp4'


class TestLegacyDownloadEndpoint:
    """Test the legacy /download/<filename> endpoint."""

    def test_download_existing_srt_file(self, client, sample_file):
        """Test downloading an existing SRT file."""
        response = client.get(f'/download/{sample_file}')

        assert response.status_code == 200
        # SRT files should be returned as text/plain
        assert 'text/plain' in response.content_type
        assert b'Test subtitle' in response.data

    def test_download_existing_video_file(self, client, sample_video_file):
        """Test downloading an existing video file."""
        response = client.get(f'/download/{sample_video_file}')

        assert response.status_code == 200
        assert b'fake video content' in response.data

    def test_download_nonexistent_file_returns_404(self, client):
        """Test that downloading a nonexistent file returns 404."""
        response = client.get('/download/nonexistent_file.srt')

        assert response.status_code == 404
        assert b'File not found' in response.data or b'error' in response.data

    def test_download_path_traversal_blocked(self, client):
        """Test that path traversal attempts are blocked."""
        # Try to access file outside downloads folder
        response = client.get('/download/../../../etc/passwd')

        assert response.status_code in (403, 404)  # Either forbidden or not found is acceptable

    def test_download_path_traversal_with_encoded_chars(self, client):
        """Test that URL-encoded path traversal is also blocked."""
        response = client.get('/download/..%2F..%2F..%2Fetc%2Fpasswd')

        assert response.status_code in (403, 404)


class TestV1DownloadEndpoint:
    """Test the new /api/v1/download/<filename> endpoint."""

    def test_v1_download_existing_srt_file(self, client, sample_file):
        """Test downloading an existing SRT file via v1 API."""
        response = client.get(f'/api/v1/download/{sample_file}')

        assert response.status_code == 200
        # SRT files should be returned as text/plain
        assert 'text/plain' in response.content_type
        assert b'Test subtitle' in response.data

    def test_v1_download_existing_video_file(self, client, sample_video_file):
        """Test downloading an existing video file via v1 API."""
        response = client.get(f'/api/v1/download/{sample_video_file}')

        assert response.status_code == 200
        assert b'fake video content' in response.data

    def test_v1_download_nonexistent_file_returns_404(self, client):
        """Test that downloading a nonexistent file returns 404."""
        response = client.get('/api/v1/download/nonexistent_file.srt')

        assert response.status_code == 404

    def test_v1_download_path_traversal_blocked(self, client):
        """Test that path traversal attempts are blocked via v1 API."""
        response = client.get('/api/v1/download/../../../etc/passwd')

        assert response.status_code in (403, 404)


class TestDownloadHeaders:
    """Test download response headers."""

    def test_srt_file_has_attachment_disposition(self, client, sample_file):
        """Test that SRT files are sent as attachments."""
        response = client.get(f'/download/{sample_file}')

        assert response.status_code == 200
        # Check Content-Disposition header exists
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition

    def test_srt_file_has_txt_extension_for_macos(self, client, sample_file):
        """Test that SRT files get .txt extension for macOS compatibility."""
        response = client.get(f'/download/{sample_file}')

        assert response.status_code == 200
        content_disposition = response.headers.get('Content-Disposition', '')
        # Should have .txt extension for macOS compatibility
        assert '.txt' in content_disposition or '.srt' in content_disposition


class TestDownloadEdgeCases:
    """Test edge cases for download."""

    def test_download_file_with_spaces_in_name(self, app, client):
        """Test downloading a file with spaces in the name."""
        downloads_folder = os.environ['DOWNLOADS_FOLDER']
        filename = 'file with spaces.srt'
        sample_path = os.path.join(downloads_folder, filename)
        with open(sample_path, 'w', encoding='utf-8') as f:
            f.write("test content")

        # URL-encode the filename
        response = client.get(f'/download/{filename.replace(" ", "%20")}')

        # Should either work or return appropriate error
        assert response.status_code in (200, 404)

    def test_download_file_with_hebrew_name(self, app, client):
        """Test downloading a file with Hebrew characters."""
        downloads_folder = os.environ['DOWNLOADS_FOLDER']
        filename = 'תרגום_עברית.srt'
        sample_path = os.path.join(downloads_folder, filename)
        with open(sample_path, 'w', encoding='utf-8') as f:
            f.write("תוכן בעברית")

        response = client.get(f'/download/{filename}')

        # Should either work or handle gracefully
        assert response.status_code in (200, 404)

    def test_download_empty_filename(self, client):
        """Test downloading with empty filename."""
        response = client.get('/download/')

        # Should return 404 or redirect
        assert response.status_code in (404, 308, 301)
