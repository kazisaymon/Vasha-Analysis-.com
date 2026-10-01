"use client";
import { useState } from "react";
import { ArrowLeftRight, Check, Copy, Loader2, Mic, Square, Volume2 } from "lucide-react";
import { speak, transcribe, translate } from "@/lib/api";
import { LANGS, label } from "@/lib/langs";
import { T } from "@/lib/i18n";
import { useRecorder } from "@/hooks/useRecorder";

export default function Translate({ t }: { t: T }) {
  const [src, setSrc] = useState("auto");
  const [dst, setDst] = useState("en");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState<"" | "translate" | "voice">("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const rec = useRecorder(
    async (blob) => {
      setBusy("voice");
      try { setText(await transcribe(blob, src)); } catch (e: any) { setError(e.message); } finally { setBusy(""); }
    },
    () => setError(t.micDenied),
  );

  async function run() {
    if (!text.trim() || busy) return;
    setError(""); setBusy("translate");
    try { setOut(await translate(text, src, dst)); } catch (e: any) { setError(e.message); } finally { setBusy(""); }
  }
  function swap() {
    if (src === "auto") return;
    setSrc(dst); setDst(src); setText(out); setOut(text);
  }

  const select = (v: string, set: (s: string) => void, withAuto: boolean, aria: string) => (
    <select value={v} onChange={(e) => set(e.target.value)} aria-label={aria}
      className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium">
      {withAuto && <option value="auto">{t.detect}</option>}
      {LANGS.map((l) => <option key={l.code} value={l.code}>{label(l)}</option>)}
    </select>
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          {select(src, setSrc, true, t.from)}
          <button onClick={swap} disabled={src === "auto"} className="mx-auto rounded-lg border border-line p-2 text-muted hover:text-brand disabled:opacity-40" aria-label={t.swap}>
            <ArrowLeftRight size={18} />
          </button>
          {select(dst, setDst, false, t.to)}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="flex min-h-[16rem] flex-col rounded-2xl border border-line bg-panel p-3 focus-within:border-brand">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
              placeholder={t.transPlaceholder}
              className="min-h-[11rem] w-full flex-1 resize-none bg-transparent p-1 text-lg outline-none placeholder:text-muted"
            />
            <div className="flex items-center gap-1 pt-2">
              <button onClick={rec.recording ? rec.stop : rec.start} disabled={busy === "voice"}
                className={`rounded-lg p-2 ${rec.recording ? "bg-red-600 text-white" : "text-muted hover:bg-line/60 hover:text-ink"}`}
                aria-label={rec.recording ? t.stop : t.record}>
                {busy === "voice" ? <Loader2 size={19} className="animate-spin" /> : rec.recording ? <Square size={19} /> : <Mic size={19} />}
              </button>
              <div className="flex-1" />
              <button onClick={run} disabled={!text.trim() || !!busy}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-onbrand disabled:opacity-40">
                {busy === "translate" && <Loader2 size={16} className="animate-spin" />}
                {busy === "translate" ? t.translating : t.doTranslate}
              </button>
            </div>
          </section>

          <section className="flex min-h-[16rem] flex-col rounded-2xl border border-line bg-line/30 p-3">
            <p className={`min-h-[11rem] flex-1 whitespace-pre-wrap p-1 text-lg ${out ? "" : "text-muted"}`}>{out || t.result}</p>
            {out && (
              <div className="flex gap-1 pt-2 text-muted">
                <button onClick={() => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-line/60 hover:text-ink">
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t.copied : t.copy}
                </button>
                <button onClick={() => speak(out, dst).catch((e) => setError(e.message))}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-line/60 hover:text-ink">
                  <Volume2 size={14} /> {t.listen}
                </button>
              </div>
            )}
          </section>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {(src === "ctg" || src === "auto") && <p className="mt-3 text-xs text-muted">{t.ctgNote}</p>}
      </div>
    </div>
  );
}
