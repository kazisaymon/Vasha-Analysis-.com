"use client";
import { MessageSquare, Languages, Moon, Plus, Sun, Trash2, X } from "lucide-react";
import { UI_LANGS, T } from "@/lib/i18n";
import { Conv, Mode } from "@/lib/types";

type Props = {
  t: T; convs: Conv[]; activeId: string; mode: Mode; theme: string; ui: string; open: boolean;
  onMode: (m: Mode) => void; onNew: () => void; onPick: (id: string) => void; onDelete: (id: string) => void;
  onTheme: () => void; onUi: (c: string) => void; onClose: () => void;
};

export default function Sidebar(p: Props) {
  const { t } = p;
  const tab = (m: Mode, Icon: typeof Languages, text: string) => (
    <button
      onClick={() => p.onMode(m)}
      aria-current={p.mode === m}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        p.mode === m ? "bg-brand text-onbrand" : "text-muted hover:bg-line/60"}`}
    >
      <Icon size={16} aria-hidden /> {text}
    </button>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-line bg-panel pt-[env(safe-area-inset-top)] transition-transform md:static md:translate-x-0 ${
        p.open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold leading-none text-brand">ভাষা</span>
          <span className="font-display text-lg font-semibold tracking-tight">Bhasha</span>
        </div>
        <button onClick={p.onClose} className="rounded-lg p-2 text-muted hover:bg-line/60 md:hidden" aria-label={t.menu}>
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 px-4">{tab("chat", MessageSquare, t.chat)}{tab("translate", Languages, t.translate)}</div>

      <div className="px-4 pt-4">
        <button
          onClick={p.onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-brand hover:text-brand"
        >
          <Plus size={16} aria-hidden /> {t.newChat}
        </button>
      </div>

      <p className="px-5 pb-1 pt-5 text-xs font-medium text-muted">{t.history}</p>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {p.convs.length === 0 && <p className="px-2 py-3 text-sm text-muted">{t.noChats}</p>}
        {p.convs.map((c) => (
          <div key={c.id} className={`group flex items-center rounded-lg ${c.id === p.activeId && p.mode === "chat" ? "bg-line/70" : "hover:bg-line/40"}`}>
            <button onClick={() => p.onPick(c.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">
              {c.title || t.newBadge}
            </button>
            <button
              onClick={() => p.onDelete(c.id)}
              className="mr-1 rounded p-1.5 text-muted opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={t.remove}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <select
          value={p.ui}
          onChange={(e) => p.onUi(e.target.value)}
          aria-label={t.uiLang}
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-2 py-2 text-sm"
        >
          {UI_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <button onClick={p.onTheme} className="rounded-lg border border-line p-2 text-muted hover:text-ink" aria-label={t.theme}>
          {p.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </aside>
  );
}
