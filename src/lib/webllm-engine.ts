import type { InitProgressReport } from "@mlc-ai/web-llm";

export async function createBrowserEngine(
  model: string,
  indexedDB: boolean,
  onProgress: (report: InitProgressReport) => void,
) {
  const webllm = await import("@mlc-ai/web-llm");
  return webllm.CreateMLCEngine(
    model,
    {
      appConfig: { ...webllm.prebuiltAppConfig, cacheBackend: indexedDB ? "indexeddb" : "cache" },
      initProgressCallback: onProgress,
    },
    { context_window_size: 2048, sliding_window_size: -1 },
  );
}