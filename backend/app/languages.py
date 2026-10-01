import re

# code -> English name (used inside prompts)
LANGS = {
    "ctg": "Chittagonian (Chatgaiya, written in Bengali script)",
    "bn": "Bengali", "en": "English", "hi": "Hindi", "ur": "Urdu", "ar": "Arabic",
    "zh": "Chinese (Simplified)", "ja": "Japanese", "ko": "Korean", "fr": "French",
    "es": "Spanish", "de": "German", "ru": "Russian", "tr": "Turkish",
}

_BN = re.compile(r"[\u0980-\u09FF]")
_DEVA = re.compile(r"[\u0900-\u097F]")
_CJK = re.compile(r"[\u4e00-\u9fff]")
_AR = re.compile(r"[\u0600-\u06FF]")
_JA = re.compile(r"[\u3040-\u30ff]")
_KO = re.compile(r"[\uac00-\ud7af]")


def has_bengali_script(text: str) -> bool:
    return bool(_BN.search(text))


def detect_lang(text: str) -> str:
    """Cheap script-based guess, used for picking a TTS voice."""
    for rx, code in ((_BN, "bn"), (_DEVA, "hi"), (_JA, "ja"), (_KO, "ko"), (_CJK, "zh"), (_AR, "ar")):
        if rx.search(text):
            return code
    return "en"
