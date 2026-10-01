export type Msg = { id: string; role: "user" | "assistant"; content: string; files?: string[] };
export type Conv = { id: string; title: string; messages: Msg[]; updatedAt: number };
export type Mode = "chat" | "translate";
