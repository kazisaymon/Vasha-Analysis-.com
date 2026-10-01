"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Loader2, Mic, Paperclip, Square, X } from "lucide-react";
import { streamChat, transcribe } from "@/lib/api";
import { LANGS, label } from "@/lib/langs";
import { T } from "@/lib/i18n";
import { uid } from "@/lib/store";
import { Conv, Msg } from "@/lib/types";
import { useRecorder } from "@/hooks/useRecorder";
import Message from "./Message";

const ACCEPT = "image/*,.pdf,.docx,.csv,.xlsx,.xls,.txt,.md,.json,audio/*";

export default function Chat({ conv, t, onUpdate }: { conv: Conv; t: T; onUpdate: (m: Msg[]) => void }) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]); // stay in context for follow-up questions
  const [replyLang, setReplyLang] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [voiceState, setVoiceState] = useState<"" | "transcribing">("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = conv.messages;

  const recorder = useRecorder(
    async (blob) => {
      setVoiceState("transcribing");
      try {
        const text = await transcribe(blob, replyLang === "auto" ? "auto" : replyLang);
        setInput((v) => (v ? v + " " : "") + text);
        taRef.current?.focus();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setVoiceState("");
      }
    },
    () => setError(t.micDenied),
  );

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  useEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; }
  }, [input]);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 5));
  };

  async function send() {
    const text = input.trim();
    if ((!text && !files.length) || busy) return;
    setError("");
    const history = msgs.map((m) => ({
      role: m.role,
      content: m.content || (m.files?.length ? `[Attached: ${m.files.join(", ")}]` : ""),
    }));
    const user: Msg = { id: uid(), role: "user", content: text, files: files.map((f) => f.name) };
    const bot: Msg = { id: uid(), role: "assistant", content: "" };
    onUpdate([...msgs, user, bot]);
    setInput("");
    setBusy(true);
    const ctl = new AbortController();
    abort.current = ctl;
    let acc = "";
    try {
      await streamChat({
        message: text, history, replyLang, files, signal: ctl.signal,
        onToken: (tok) => { acc += tok; onUpdate([...msgs, user, { ...bot, content: acc }]); },
      });
    } catch (e: any) {
      if (e.name !== "AbortError") onUpdate([...msgs, user, { ...bot, content: acc || `⚠️ ${e.message}` }]);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  const starters: [string, () => void][] = [
    [t.s1, () => { setInput(t.s1Fill); taRef.current?.focus(); }],
    [t.s2, () => fileRef.current?.click()],
    [t.s3, () => fileRef.current?.click()],
    [t.s4, () => recorder.start()],
  ];

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDrag(false); }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
    >
      {drag && (
        <div className="absolute inset-3 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-bg/90 text-lg font-medium text-brand">
          {t.drop}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-start pt-[8vh]">
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{t.title}</h1>
              <p className="mt-4 max-w-xl text-lg text-muted">{t.sub}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {starters.map(([text, run]) => (
                  <button key={text} onClick={run} className="rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            msgs.map((m, i) => <Message key={m.id} m={m} t={t} streaming={busy && i === msgs.length - 1} />)
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-3xl">
          {error && <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">{t.inContext}:</span>
              {files.map((f, i) => (
                <span key={i} className="flex max-w-[14rem] items-center gap-1.5 rounded-md border border-line bg-panel py-1 pl-2 pr-1 text-xs">
                  <FileText size={13} aria-hidden /> <span className="truncate">{f.name}</span>
                  <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="rounded p-0.5 text-muted hover:text-ink" aria-label={t.removeFile}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-line bg-panel p-2 focus-within:border-brand">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={recorder.recording ? `● ${Math.floor(recorder.secs / 60)}:${String(recorder.secs % 60).padStart(2, "0")}` : t.placeholder}
              className="max-h-52 w-full resize-none bg-transparent px-2 py-1.5 outline-none placeholder:text-muted"
            />
            <div className="flex items-center gap-1 pt-1">
              <input ref={fileRef} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} className="rounded-lg p-2 text-muted hover:bg-line/60 hover:text-ink" aria-label={t.attach} title={t.attach}>
                <Paperclip size={19} />
              </button>
              <button
                onClick={recorder.recording ? recorder.stop : recorder.start}
                disabled={voiceState === "transcribing"}
                className={`rounded-lg p-2 ${recorder.recording ? "bg-red-600 text-white" : "text-muted hover:bg-line/60 hover:text-ink"}`}
                aria-label={recorder.recording ? t.stop : t.record}
                title={recorder.recording ? t.stop : t.record}
              >
                {voiceState === "transcribing" ? <Loader2 size={19} className="animate-spin" /> : recorder.recording ? <Square size={19} /> : <Mic size={19} />}
              </button>

              <select
                value={replyLang}
                onChange={(e) => setReplyLang(e.target.value)}
                aria-label={t.replyIn}
                title={t.replyIn}
                className="ml-1 max-w-[9.5rem] truncate rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-muted"
              >
                <option value="auto">{t.auto}</option>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{label(l)}</option>)}
              </select>

              <div className="flex-1" />
              {busy ? (
                <button onClick={() => abort.current?.abort()} className="rounded-xl bg-ink p-2.5 text-bg" aria-label={t.stop}><Square size={18} /></button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim() && !files.length}
                  className="rounded-xl bg-brand p-2.5 text-onbrand disabled:opacity-40"
                  aria-label={t.send}
                >
                  <ArrowUp size={18} />
                </button>
              )}
            </div>
          </div>
          {(replyLang === "ctg" || replyLang === "auto") && <p className="mt-2 text-xs text-muted">{t.ctgNote}</p>}
        </div>
      </div>
    </div>
  );
}
