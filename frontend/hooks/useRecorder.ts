import { useEffect, useRef, useState } from "react";

export function useRecorder(onDone: (blob: Blob) => void, onError: (e: unknown) => void) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => () => { clearInterval(timer.current); rec.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        done.current(new Blob(chunks.current, { type: r.mimeType || "audio/webm" }));
      };
      r.start();
      rec.current = r;
      setRecording(true);
      setSecs(0);
      timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch (e) {
      onError(e);
    }
  }
  function stop() {
    clearInterval(timer.current);
    rec.current?.stop();
    setRecording(false);
  }
  return { recording, secs, start, stop };
}
