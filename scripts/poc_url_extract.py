#!/usr/bin/env python3
"""
POC: how far does yt-dlp's *generic* extractor get when you hand it a PAGE url
(not a direct video link)?  Probes only (download=False) and reports, per URL:
  - which extractor caught it  (Generic = scraped the page; anything else = had a
    dedicated extractor)
  - _type                      (video / playlist / multi_video  -> the "several
    videos on one page" question)
  - title / duration / #formats / best height
  - subtitles + auto-captions  (means we may skip Whisper entirely)
  - error, if any

Usage:
  python scripts/poc_url_extract.py                 # runs the default sample set
  python scripts/poc_url_extract.py URL1 URL2 ...   # test your own real pages
"""
import sys
import json

import yt_dlp

# Mirror the project's youtube extractor_args so YT behaves like production.
EXTRACTOR_ARGS = {"youtube": {"player_client": ["android_vr"]}}

# A deliberately mixed sample. Some have dedicated extractors, some force the
# generic path. Swap these for YOUR real target pages to get honest data.
DEFAULT_URLS = [
    # --- dedicated-extractor controls (should "just work") ---
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",          # YouTube (Big Buck Bunny)
    "https://vimeo.com/76979871",                            # Vimeo
    "https://www.ted.com/talks/ken_robinson_do_schools_kill_creativity",  # TED page, not direct
    "https://www.imdb.com/title/tt0111161/",                # IMDb title page (trailer)
    # --- generic-path candidates (arbitrary pages with embedded/own video) ---
    "https://web.dev/",                                      # site w/ embeds (may find nothing)
    "https://en.wikipedia.org/wiki/Wikipedia",              # self-hosted commons media?
    # --- the "several videos" case ---
    "https://www.youtube.com/playlist?list=PLbpi6ZahtOH4LF3qK1Hh3Pvr1zhcjGT8z",
]


def probe(url):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": False,          # let playlists/multi-video reveal themselves
        "extract_flat": "in_playlist",  # don't recurse into every playlist entry
        "socket_timeout": 30,
        "extractor_args": EXTRACTOR_ARGS,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:  # noqa: BLE001 - POC: report any failure verbatim
        return {"url": url, "ok": False, "error": f"{type(e).__name__}: {e}"}

    _type = info.get("_type", "video")
    entries = info.get("entries")
    n_videos = len(list(entries)) if entries is not None else 1

    formats = info.get("formats") or []
    heights = [f.get("height") for f in formats if f.get("height")]
    best_h = max(heights) if heights else None

    subs = list((info.get("subtitles") or {}).keys())
    auto = list((info.get("automatic_captions") or {}).keys())

    return {
        "url": url,
        "ok": True,
        "extractor": info.get("extractor_key") or info.get("extractor"),
        "is_generic": (info.get("extractor_key") or "").lower() == "generic",
        "type": _type,
        "n_videos": n_videos,
        "title": (info.get("title") or "")[:70],
        "duration_s": info.get("duration"),
        "n_formats": len(formats),
        "best_height": best_h,
        "subtitles": subs[:6],
        "auto_captions": len(auto),
    }


def main():
    urls = sys.argv[1:] or DEFAULT_URLS
    results = []
    for u in urls:
        print(f"\n→ probing: {u}", flush=True)
        r = probe(u)
        results.append(r)
        if not r["ok"]:
            print(f"   ✗ {r['error']}")
            continue
        flag = "GENERIC" if r["is_generic"] else r["extractor"]
        vids = f"{r['n_videos']} video(s)" if r["type"] != "video" else "1 video"
        subs = f"subs={r['subtitles']}" if r["subtitles"] else f"auto-cc={r['auto_captions']}"
        print(
            f"   ✓ [{flag}] {r['type']} · {vids} · "
            f"{r['best_height']}p · {r['n_formats']} fmts · {subs}\n"
            f"     “{r['title']}”  ({r['duration_s']}s)"
        )

    # machine-readable summary
    print("\n\n=== JSON SUMMARY ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))

    ok = [r for r in results if r["ok"]]
    gen = [r for r in ok if r.get("is_generic")]
    multi = [r for r in ok if r.get("type") != "video"]
    print(
        f"\n=== {len(ok)}/{len(results)} found a video · "
        f"{len(gen)} via GENERIC scrape · {len(multi)} were multi-video ==="
    )


if __name__ == "__main__":
    main()
