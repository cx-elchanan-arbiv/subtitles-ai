# Known Issues and Limitations

This document outlines known limitations and issues in SubsTranslator, along with explanations and workarounds where applicable.

## YouTube Download Quality Limitation

### Issue Description

When downloading videos from YouTube, the application may download at 360p (standard definition) instead of HD quality (720p or 1080p).

**Example log output:**
```
WARNING: [youtube] android client https formats require a GVS PO Token
[info] VIDEO_ID: Downloading 1 format(s): 18
'width': 640, 'height': 360, 'fps': 30
```

### Root Cause

YouTube introduced Proof of Origin (PO Token) requirements in 2024 for accessing high-quality video formats. These tokens are anti-bot measures that require:
- Browser-based authentication
- Complex client emulation
- Periodic token refresh

This is a YouTube platform limitation, not a bug in SubsTranslator.

### Why We Don't Include a Fix

While there are workarounds available (like `bgutil-ytdlp-pot-provider`), we intentionally do not include them in SubsTranslator for these reasons:

1. **Complexity**: PO Token solutions require Node.js runtime, additional services, and complex configuration
2. **Maintenance burden**: Token mechanisms change frequently, requiring constant updates
3. **Unreliable**: Even with PO Token providers, quality is not guaranteed due to YouTube's evolving restrictions
4. **Against YouTube ToS**: Some workarounds may violate YouTube's Terms of Service
5. **Open Source Philosophy**: We keep dependencies minimal and maintainable

### Impact

- Transcription quality: 360p video provides sufficient audio quality for accurate transcription
- Subtitle creation: Not affected - subtitles are generated from audio, which remains high quality
- Final video quality: If you need HD output, see workarounds below

### Recommended Approach

**For most users (recommended):**
- Use 360p downloads - audio quality is sufficient for transcription
- If you need HD final output, download the HD video separately using `yt-dlp` directly, then use SubsTranslator's subtitle embedding feature

**For advanced users who need HD downloads:**

<details>
<summary>Click to expand advanced workaround</summary>

### Manual HD Download Workaround

If you absolutely need HD quality, you can:

1. **Download video manually first using `yt-dlp` with authentication:**
   ```bash
   # Install yt-dlp locally
   pip install yt-dlp

   # Download with cookies from your browser (where you're logged into YouTube)
   yt-dlp --cookies-from-browser chrome \
          --format "bestvideo[height<=1080]+bestaudio/best" \
          -o "video.mp4" \
          "https://www.youtube.com/watch?v=VIDEO_ID"
   ```

2. **Upload the downloaded video to SubsTranslator** instead of using the YouTube URL feature

3. **Process normally** - SubsTranslator will work with your HD video file

### Alternative: Use POT Provider (Advanced)

If you're comfortable with Docker and Node.js, you can run a PO Token provider:

```bash
# Run POT provider in separate container
docker run -d -p 4416:4416 brainicism/bgutil-ytdlp-pot-provider

# Modify tasks.py to use the provider (you'll need to fork the project)
# This is not officially supported
```

**Note:** This approach requires code modifications and is not officially supported. See [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp#youtube) for details.

</details>

### Status

This is a **known limitation** - not a bug. We track YouTube platform changes and will reevaluate if:
- A lightweight, reliable solution emerges
- YouTube provides official API access for high-quality downloads
- yt-dlp develops a built-in, zero-dependency solution

---

## Other Known Issues

### Gemini API Transcription (Experimental)

The Gemini API transcription feature is currently experimental and may have:
- Limited language support compared to Whisper
- Timeout issues with videos longer than 15 minutes
- Occasional API rate limiting

**Status:** Under development. Use Whisper models for production workloads.

### Large Video Files

Videos larger than 500MB may experience:
- Slower upload times
- Increased memory usage
- Potential timeouts on constrained hosting

**Workaround:** Consider using Whisper `tiny` or `base` models for large files, or split videos into smaller segments.

---

## Reporting New Issues

If you encounter an issue not listed here:

1. Check the [TESTING_TROUBLESHOOTING.md](TESTING_TROUBLESHOOTING.md) guide
2. Search [existing GitHub issues](https://github.com/YOUR_USERNAME/SubsTranslator/issues)
3. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs
   - Environment details

---

*Last updated: November 2024*
