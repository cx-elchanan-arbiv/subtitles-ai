# fix-youtube-quality

Diagnose and fix YouTube download quality regression in SubsTranslator.

YouTube periodically changes which player clients return full-resolution DASH formats.
When they force SABR streaming on the current client, all downloads fall back to 360p.
This skill detects that, finds a working client, updates config, and verifies the fix.

## What this skill does

Run this skill when:
- Downloads come out at low quality / small file size
- Users report "360p" or "blocked" errors
- yt-dlp logs show "SABR streaming" warnings

## Steps

### 1. Diagnose — is there actually a quality problem?

Run this inside the worker container to see what the current config downloads:

```bash
docker exec substranslator-worker-1 python -c "
import yt_dlp
from config import get_config
c = get_config()
print('Current extractor_args:', c.YTDLP_EXTRACTOR_ARGS)
opts = {'format': c.YTDLP_OPTIMIZED_FORMAT, 'extractor_args': c.YTDLP_EXTRACTOR_ARGS, 'quiet': True, 'no_warnings': True}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ', download=False)
    rf = info.get('requested_formats') or [info]
    h = max((f.get('height') or 0) for f in rf)
    print('SELECTED resolution:', h, 'p  format_id:', info.get('format_id'))
    print('STATUS:', 'GOOD (>=1080p)' if h >= 1080 else 'BAD - only', h, 'p')
" 2>&1 | grep -vE "Warning|warn|Deprecated"
```

If result is `GOOD` — no action needed. If `BAD` — continue to step 2.

### 2. Check yt-dlp version — update if outdated

```bash
docker exec substranslator-worker-1 pip show yt-dlp | grep Version
# Check latest: https://github.com/yt-dlp/yt-dlp/releases
# If outdated, update requirements.txt and rebuild:
# docker compose build worker backend && docker compose up -d worker backend
```

Also check GitHub for new SABR/player_client issues:
Search: `site:github.com/yt-dlp/yt-dlp "player_client" "SABR" 2026`

### 3. Find a working player client

Test each candidate client. A working client = returns formats above 360p AND actually downloads:

```bash
cd /tmp
YT="docker exec substranslator-worker-1 yt-dlp"
TEST_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

for CLIENT in android_vr tv ios web_safari mweb default; do
  echo -n "Testing $CLIENT: "
  RESULT=$($YT --extractor-args "youtube:player_client=$CLIENT" \
    -F --quiet --no-warnings "$TEST_URL" 2>&1 | grep -c "1080\|1440\|2160")
  if [ "$RESULT" -gt 0 ]; then
    echo "✅ returns HD formats ($RESULT entries)"
  else
    echo "❌ only low-res or blocked"
  fi
done
```

Then do a real partial download with the best candidate:

```bash
CLIENT="<best_from_above>"
docker exec substranslator-worker-1 bash -c "
  yt-dlp --extractor-args 'youtube:player_client=$CLIENT' \
    -f 'bestvideo[height<=1080]+bestaudio/best' --merge-output-format mp4 \
    --download-sections '*0-3' -o '/tmp/test_quality.%(ext)s' \
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 2>&1 | tail -5
  ffprobe -v error -show_entries stream=height -of csv=p=0 /tmp/test_quality.mp4 2>/dev/null
  rm -f /tmp/test_quality.mp4
"
```

### 4. Update config.py

Edit `backend/config.py` — find the `YTDLP_PLAYER_CLIENT` line and update the default:

```python
# Current (example):
YTDLP_PLAYER_CLIENT = [
    c.strip()
    for c in os.getenv("YTDLP_PLAYER_CLIENT", "android_vr").split(",")
    if c.strip()
]
```

Change `"android_vr"` to the new working client found in step 3.
You can also set multiple clients as comma-separated fallback: `"new_client,android_vr"`.

Alternatively, set it without code change via environment variable in `docker-compose.yml`:
```yaml
environment:
  - YTDLP_PLAYER_CLIENT=new_client,fallback_client
```

### 5. Restart containers and verify

```bash
docker compose restart worker backend beat
sleep 5

# Verify new config is loaded
docker exec substranslator-worker-1 python -c "
from config import get_config; print(get_config().YTDLP_EXTRACTOR_ARGS)
" 2>&1 | grep -v Warning

# Verify resolution
docker exec substranslator-worker-1 python -c "
import yt_dlp
from config import get_config
c = get_config()
opts = {'format': c.YTDLP_OPTIMIZED_FORMAT, 'extractor_args': c.YTDLP_EXTRACTOR_ARGS, 'quiet': True, 'no_warnings': True}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ', download=False)
    rf = info.get('requested_formats') or [info]
    h = max((f.get('height') or 0) for f in rf)
    print('RESOLUTION:', h, 'p -', 'GOOD' if h >= 1080 else 'BAD')
" 2>&1 | grep -vE "Warning|warn|Deprecated"
```

### 6. Commit and push

```bash
git add backend/config.py
git commit -m "fix(youtube): update player_client to <new_client> — SABR workaround

YouTube forced SABR streaming on <old_client>, dropping downloads to 360p.
<new_client> returns full DASH ladder. Verified: <height>p downloaded end-to-end.

See https://github.com/yt-dlp/yt-dlp/issues/12482
"
git push origin main
```

## Background: why this happens

YouTube uses "SABR" (Streaming ABR) — a server-side format that strips downloadable DASH URLs
from certain player clients. When a client gets SABR'd, yt-dlp only sees format 18 (360p).
YouTube rolls this out client-by-client over time. The fix is always the same: find a client
that hasn't been SABR'd yet and update `YTDLP_PLAYER_CLIENT` in config.

**History of client changes in this project:**
- Pre-2025: `web` worked fine
- Oct 2025: switched to `android,web` (403 fix)  
- Jun 2026: switched to `android_vr` (SABR fix — android and web got SABR'd)
- Future: check GitHub issues for the next working client

## Useful links

- yt-dlp SABR issue: https://github.com/yt-dlp/yt-dlp/issues/12482
- yt-dlp releases: https://github.com/yt-dlp/yt-dlp/releases
- PO Token guide (heavy alternative): https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide
