export type Lang = { code: string; name: string; native: string };

export const LANGS: Lang[] = [
  { code: "ctg", name: "Chittagonian", native: "চাটগাঁইয়া" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "fr", name: "French", native: "Français" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
];

export const label = (l: Lang) => (l.name === l.native ? l.name : `${l.name} · ${l.native}`);
