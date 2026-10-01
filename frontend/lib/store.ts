import { Conv } from "./types";

const KEY = "bhasha:v1";
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const newConv = (): Conv => ({ id: uid(), title: "", messages: [], updatedAt: Date.now() });

export function load(): { convs: Conv[]; theme: "light" | "dark"; ui: string } {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { convs: s.convs || [], theme: s.theme || "light", ui: s.ui || "en" };
  } catch {
    return { convs: [], theme: "light", ui: "en" };
  }
}
export function save(convs: Conv[], theme: string, ui: string) {
  try { localStorage.setItem(KEY, JSON.stringify({ convs: convs.slice(0, 50), theme, ui })); } catch {}
}
