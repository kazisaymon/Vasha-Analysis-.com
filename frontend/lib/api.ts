const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function fail(r: Response): Promise<never> {
  let msg = `Request failed (${r.status})`;
  try {
    const j = await r.clone().json();
    if (j.detail) msg = typeof j.detail === "string" ? j.detail : msg;
  } catch {
    const t = await r.text().catch(() => "");
    if (t) msg = t.slice(0, 200);
  }
  throw new Error(msg);
}

export async function streamChat(o: {
  message: string; history: { role: string; content: string }[]; replyLang: string;
  files: File[]; signal: AbortSignal; onToken: (t: string) => void;
}) {
  const fd = new FormData();
  fd.append("message", o.message);
  fd.append("history", JSON.stringify(o.history));
  fd.append("reply_lang", o.replyLang);
  o.files.forEach((f) => fd.append("attachments", f));
  const r = await fetch(`${API}/api/chat`, { method: "POST", body: fd, signal: o.signal });
  if (!r.ok || !r.body) return fail(r);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    o.onToken(dec.decode(value, { stream: true }));
  }
}

export async function translate(text: string, source: string, target: string): Promise<string> {
  const r = await fetch(`${API}/api/translate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, source, target }),
  });
  if (!r.ok) return fail(r);
  return (await r.json()).translation;
}

export async function transcribe(blob: Blob, lang: string): Promise<string> {
  const fd = new FormData();
  fd.append("audio", blob, blob.type.includes("mp4") ? "voice.mp4" : "voice.webm");
  fd.append("lang", lang);
  const r = await fetch(`${API}/api/transcribe`, { method: "POST", body: fd });
  if (!r.ok) return fail(r);
  return (await r.json()).text;
}

let current: HTMLAudioElement | null = null;

/** Speak text via the backend voice; falls back to the browser's built-in speech. */
export async function speak(text: string, lang?: string) {
  current?.pause();
  window.speechSynthesis?.cancel();
  try {
    const r = await fetch(`${API}/api/tts`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang }),
    });
    if (!r.ok) throw new Error("tts");
    current = new Audio(URL.createObjectURL(await r.blob()));
    await current.play();
  } catch {
    if (!window.speechSynthesis) throw new Error("Speech is not available on this device.");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = ({ ctg: "bn-BD", bn: "bn-BD", en: "en-US", hi: "hi-IN", zh: "zh-CN" } as Record<string, string>)[lang || ""] || "";
    window.speechSynthesis.speak(u);
  }
}
