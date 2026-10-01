"use client";
import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { getT } from "@/lib/i18n";
import { load, newConv, save } from "@/lib/store";
import { Conv, Mode, Msg } from "@/lib/types";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import Translate from "./Translate";

export default function App() {
  const [ready, setReady] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<Mode>("chat");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ui, setUi] = useState("en");
  const [open, setOpen] = useState(false);
  const t = getT(ui);

  useEffect(() => {
    const s = load();
    const first = s.convs[0] || newConv();
    setConvs(s.convs.length ? s.convs : [first]);
    setActiveId(first.id);
    setTheme(s.theme);
    setUi(s.ui);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = ui;
    save(convs, theme, ui);
  }, [ready, convs, theme, ui]);

  const active = convs.find((c) => c.id === activeId) || convs[0];

  const update = useCallback((id: string, messages: Msg[]) => {
    setConvs((all) => all.map((c) => {
      if (c.id !== id) return c;
      const firstUser = messages.find((m) => m.role === "user");
      const title = c.title || (firstUser ? (firstUser.content || firstUser.files?.[0] || "").slice(0, 40) : "");
      return { ...c, messages, title, updatedAt: Date.now() };
    }).sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  const create = () => {
    const blank = convs.find((c) => c.messages.length === 0);
    const c = blank || newConv();
    if (!blank) setConvs((x) => [c, ...x]);
    setActiveId(c.id); setMode("chat"); setOpen(false);
  };
  const remove = (id: string) => {
    const rest = convs.filter((c) => c.id !== id);
    const next = rest.length ? rest : [newConv()];
    setConvs(next);
    if (id === activeId) setActiveId(next[0].id);
  };

  if (!ready || !active) return <div className="h-dvh bg-bg" />;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        t={t} convs={convs.filter((c) => c.messages.length)} activeId={active.id} mode={mode} theme={theme} ui={ui} open={open}
        onMode={(m) => { setMode(m); setOpen(false); }} onNew={create}
        onPick={(id) => { setActiveId(id); setMode("chat"); setOpen(false); }} onDelete={remove}
        onTheme={() => setTheme((x) => (x === "dark" ? "light" : "dark"))} onUi={setUi} onClose={() => setOpen(false)}
      />
      {open && <button className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-label={t.menu} />}

      <main className="flex min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)]">
        <header className="flex items-center gap-2 border-b border-line px-3 py-2 md:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted hover:bg-line/60" aria-label={t.menu}><Menu size={20} /></button>
          <span className="font-display font-semibold">Bhasha</span>
        </header>
        {mode === "chat"
          ? <Chat key={active.id} conv={active} t={t} onUpdate={(m) => update(active.id, m)} />
          : <Translate t={t} />}
      </main>
    </div>
  );
}
