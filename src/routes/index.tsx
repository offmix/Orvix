import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { createBrowserEngine } from "@/lib/webllm-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orvix" },
      { name: "description", content: "Orvix — private AI chat running in your browser." },
      { property: "og:title", content: "Orvix" },
      { property: "og:description", content: "Private AI chat running in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODELS = [
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Llama-3.2-3B-Instruct-q4f16_1-MLC",
];

type Msg = { role: "user" | "assistant"; content: string };

function Index() {
  const engine = useRef<MLCEngineInterface | null>(null);
  const [model, setModel] = useState<string>(MODELS[0] ?? "Qwen2.5-0.5B-Instruct-q4f16_1-MLC");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  async function load() {
    setError("");
    if (!("gpu" in navigator)) return setError("WebGPU未対応のブラウザです（Chrome / Edge 推奨）");
    setBusy(true);
    const create = (idb: boolean) =>
      createBrowserEngine(model, idb, (p) => setProgress(Math.round(p.progress * 100)));
    try {
      await engine.current?.unload();
      try {
        engine.current = await create(false);
      } catch {
        engine.current = await create(true);
      }
      setLoaded(model);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    }
    setProgress(null);
    setBusy(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !engine.current || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const stream = await engine.current.chat.completions.create({ messages: next, stream: true, temperature: 0.3 });
      let out = "";
      for await (const c of stream) {
        out += c.choices[0]?.delta?.content ?? "";
        setMsgs([...next, { role: "assistant", content: out }]);
      }
    } catch (err) {
      setMsgs([...next, { role: "assistant", content: String(err) }]);
    }
    setBusy(false);
  }

  const ready = loaded === model;
  const empty = msgs.length === 0;

  const composer = (
    <form onSubmit={send} className="mx-auto w-full max-w-3xl">
      <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 focus-within:border-ring">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
          }}
          rows={1}
          disabled={!ready}
          placeholder={ready ? "Message Orvix" : "Load a model first"}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 outline-none placeholder:text-muted-foreground disabled:opacity-40"
        />
        <button
          disabled={!ready || busy || !input.trim()}
          aria-label="Send"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30"
        >
          ↑
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex h-screen flex-col text-sm">
      <header className="flex items-center gap-2 px-4 py-2">
        <span className="mr-auto font-bold tracking-widest">ORVIX</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={busy}
          className="rounded-lg border border-border bg-card px-2 py-1 outline-none"
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>{m.replace("-MLC", "")}</option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={busy || ready}
          className="rounded-lg border border-border px-3 py-1 hover:bg-accent disabled:opacity-40"
        >
          {progress !== null ? `${progress}%` : ready ? "●" : "Load"}
        </button>
        <button
          onClick={() => setMsgs([])}
          disabled={busy || empty}
          className="rounded-lg border border-border px-3 py-1 hover:bg-accent disabled:opacity-40"
        >
          New
        </button>
      </header>
      {progress !== null && (
        <div>
          <div className="h-0.5 bg-secondary">
            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (
        <div className="break-all border-b border-destructive px-4 py-2 text-destructive">{error}</div>
      )}

      {empty ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
          <h1 className="text-2xl font-bold tracking-widest">ORVIX</h1>
          {composer}
        </main>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="w-fit max-w-[85%] whitespace-pre-wrap rounded-lg bg-secondary px-3 py-2">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">
                    {m.content || "▍"}
                  </div>
                ),
              )}
              <div ref={end} />
            </div>
          </main>
          <div className="px-4 pb-4">{composer}</div>
        </>
      )}
    </div>
  );
}
