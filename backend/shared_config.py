"""
Shared Language Configuration for SubsTranslator Backend
Single source of truth for all language-related settings
Mirrors the JavaScript configuration for consistency
"""

# Core supported languages with complete metadata
SUPPORTED_LANGUAGES = {
    "he": {
        "code": "he",
        "name": "Hebrew",
        "nativeName": "עברית",
        "flag": "🇮🇱",
        "dir": "rtl",
        "font": "Heebo",
        "rtl": True,
        "hasTranslations": True,
    },
    "en": {
        "code": "en",
        "name": "English",
        "nativeName": "English",
        "flag": "🇺🇸",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": True,
    },
    "es": {
        "code": "es",
        "name": "Spanish",
        "nativeName": "Español",
        "flag": "🇪🇸",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": True,
    },
    "ar": {
        "code": "ar",
        "name": "Arabic",
        "nativeName": "العربية",
        "flag": "🇸🇦",
        "dir": "rtl",
        "font": "Noto Sans Arabic",
        "rtl": True,
        "hasTranslations": True,
    },
}

# Extended languages for transcription/translation (without full UI translations)
TRANSCRIPTION_LANGUAGES = {
    **SUPPORTED_LANGUAGES,
    "fr": {
        "code": "fr",
        "name": "French",
        "nativeName": "Français",
        "flag": "🇫🇷",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "de": {
        "code": "de",
        "name": "German",
        "nativeName": "Deutsch",
        "flag": "🇩🇪",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "it": {
        "code": "it",
        "name": "Italian",
        "nativeName": "Italiano",
        "flag": "🇮🇹",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "pt": {
        "code": "pt",
        "name": "Portuguese",
        "nativeName": "Português",
        "flag": "🇵🇹",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "ru": {
        "code": "ru",
        "name": "Russian",
        "nativeName": "Русский",
        "flag": "🇷🇺",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "ja": {
        "code": "ja",
        "name": "Japanese",
        "nativeName": "日本語",
        "flag": "🇯🇵",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "ko": {
        "code": "ko",
        "name": "Korean",
        "nativeName": "한국어",
        "flag": "🇰🇷",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "zh": {
        "code": "zh",
        "name": "Chinese",
        "nativeName": "中文",
        "flag": "🇨🇳",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
    "tr": {
        "code": "tr",
        "name": "Turkish",
        "nativeName": "Türkçe",
        "flag": "🇹🇷",
        "dir": "ltr",
        "font": "Inter",
        "rtl": False,
        "hasTranslations": False,
    },
}

# Auto-detection option
AUTO_DETECT = {
    "code": "auto",
    "name": "Auto Detect",
    "nativeName": "Auto Detect",
    "flag": "🔍",
    "dir": "ltr",
    "font": "Inter",
    "rtl": False,
    "hasTranslations": False,
}

# Complete language list including auto-detect
ALL_LANGUAGES = {"auto": AUTO_DETECT, **TRANSCRIPTION_LANGUAGES}

# Default settings
DEFAULT_LANGUAGE = "en"
DEFAULT_TARGET_LANGUAGE = "he"

# UI languages (languages with full translation files)
UI_LANGUAGES = list(SUPPORTED_LANGUAGES.keys())

# Source languages (for transcription, includes auto)
SOURCE_LANGUAGES = list(ALL_LANGUAGES.keys())

# Target languages (for translation, excludes auto)
TARGET_LANGUAGES = list(TRANSCRIPTION_LANGUAGES.keys())


# Utility functions
def get_language_info(code):
    """Get language information by code"""
    return ALL_LANGUAGES.get(code, SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE])


def is_rtl(code):
    """Check if language is RTL"""
    return get_language_info(code).get("rtl", False)


def has_translations(code):
    """Check if language has full UI translations"""
    return get_language_info(code).get("hasTranslations", False)


def get_language_name(code):
    """Get native name of language"""
    return get_language_info(code).get("nativeName", code)


def get_language_direction(code):
    """Get text direction for language"""
    return get_language_info(code).get("dir", "ltr")


# Legacy compatibility mapping for old config.py
LEGACY_SUPPORTED_LANGUAGES = {
    code: info["nativeName"] for code, info in ALL_LANGUAGES.items()
}
