import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserEngine } from "@/lib/webllm-engine";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: create,
  prebuiltAppConfig: { model_list: [] },
}));

describe("Browser engine context", () => {
  beforeEach(() => create.mockReset());

  it.each([false, true])("limits the context to 2048 tokens with indexedDB=%s", async (indexedDB) => {
    await createBrowserEngine("local-model", indexedDB, vi.fn());
    expect(create).toHaveBeenCalledWith(
      "local-model",
      expect.objectContaining({
        appConfig: expect.objectContaining({ cacheBackend: indexedDB ? "indexeddb" : "cache" }),
      }),
      { context_window_size: 2048, sliding_window_size: -1 },
    );
  });
});
