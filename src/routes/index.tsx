import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { createBrowserEngine } from "@/lib/webllm-engine";
import { MODELS } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { ArrowUp, Check, Download, LoaderCircle, PanelLeft, SquarePen } from "lucide-react";

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

type Msg = { role: "user" | "assistant"; content: string };

function Index() {
  const engine = useRef<MLCEngineInterface | null>(null);
  const [model, setModel] = useState<string>(MODELS[0]?.id ?? "Qwen2.5-0.5B-Instruct-q4f16_1-MLC");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    setProgress(0);
    setLoaded(null);
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
      <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-3 focus-within:border-ring">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
          }}
          rows={1}
          aria-label="Message Orvix"
          disabled={!ready}
          placeholder={ready ? "Message Orvix" : "Load a model first"}
          className="min-w-0 max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 outline-none placeholder:text-muted-foreground disabled:opacity-40"
        />
        <Button
          size="icon"
          disabled={!ready || busy || !input.trim()}
          aria-label="Send"
          className="size-9 shrink-0 rounded-lg disabled:opacity-30"
        >
          <ArrowUp />
        </Button>
      </div>
    </form>
  );

  return (
    <div className="flex h-dvh overflow-hidden text-sm">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-background/80 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`${sidebarOpen ? "flex" : "hidden md:flex"} fixed inset-y-0 left-0 z-30 w-60 shrink-0 flex-col bg-sidebar px-3 py-4 md:static`}>
        <div className="mb-5 flex items-center justify-between px-2">
          <span className="text-lg font-semibold">Orvix</span>
          <Button variant="ghost" size="icon" title="Close sidebar" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="md:hidden"><PanelLeft /></Button>
        </div>
        <Button variant="ghost" disabled={busy} onClick={() => { setMsgs([]); setSidebarOpen(false); }} className="justify-start rounded-lg"><SquarePen /> New chat</Button>
        {msgs.length > 0 && <div className="mt-8">
          <p className="mb-2 px-3 text-xs text-muted-foreground">Current chat</p>
          <div className="truncate rounded-lg bg-sidebar-accent px-3 py-2">{msgs[0]?.content}</div>
        </div>}
        <div className="mt-auto border-t border-sidebar-border px-2 pt-4 text-xs text-muted-foreground">{MODELS.find((m) => m.id === (loaded ?? model))?.name}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Open sidebar" title="Open sidebar" onClick={() => setSidebarOpen(true)} className="md:hidden"><PanelLeft /></Button>
        <span className="mr-auto text-lg font-semibold text-muted-foreground">Orvix</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={busy}
          aria-label="Model"
          className="h-9 min-w-0 max-w-[55%] rounded-lg bg-background px-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={busy || ready}
          className="min-w-20 rounded-lg"
        >
          {progress !== null ? <LoaderCircle className="animate-spin" /> : ready ? <Check /> : <Download />}
          {progress !== null ? `${progress}%` : ready ? "Ready" : "Load"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMsgs([])}
          disabled={busy || empty}
          aria-label="New chat"
          title="New chat"
          className="rounded-lg"
        >
          <SquarePen />
        </Button>
      </header>
      {progress !== null && (
        <div className="px-5 pb-3" role="status">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Loading {MODELS.find((m) => m.id === model)?.name}</span><span>{progress}%</span></div>
          <div role="progressbar" aria-label="Model loading" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1 overflow-hidden rounded-lg bg-secondary">
            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (
        <div className="break-all border-b border-destructive px-4 py-2 text-destructive">{error}</div>
      )}

      {empty ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-7 px-4 pb-20">
          <h1 className="text-3xl font-semibold">Orvix</h1>
          {composer}
        </main>
      ) : (
        <>
          <main className="min-h-0 flex-1 overflow-y-auto">
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
          <div className="px-4 pb-5 pt-3">{composer}</div>
        </>
      )}
      </div>
    </div>
  );
}
