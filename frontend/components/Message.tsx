"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, FileText, Volume2 } from "lucide-react";
import { speak } from "@/lib/api";
import { T } from "@/lib/i18n";
import { Msg } from "@/lib/types";

export default function Message({ m, t, streaming }: { m: Msg; t: T; streaming: boolean }) {
  const [copied, setCopied] = useState(false);

  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        {m.files && m.files.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {m.files.map((f, i) => (
              <span key={i} className="flex max-w-[16rem] items-center gap-1.5 rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                <FileText size={13} aria-hidden /> <span className="truncate">{f}</span>
              </span>
            ))}
          </div>
        )}
        {m.content && (
          <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-bubble px-4 py-2.5 leading-relaxed text-white">
            {m.content}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[46rem]">
      {m.content ? (
        <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
      ) : (
        <div className="flex gap-1 py-2" aria-label="…">
          {[0, 1, 2].map((i) => <span key={i} className="dot h-2 w-2 rounded-full bg-brand" style={{ animationDelay: `${i * 0.18}s` }} />)}
        </div>
      )}
      {m.content && !streaming && (
        <div className="mt-2 flex gap-1 text-muted">
          <button
            onClick={() => { navigator.clipboard.writeText(m.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-line/60 hover:text-ink"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t.copied : t.copy}
          </button>
          <button onClick={() => speak(m.content).catch(() => {})} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-line/60 hover:text-ink">
            <Volume2 size={14} /> {t.listen}
          </button>
        </div>
      )}
    </div>
  );
}
