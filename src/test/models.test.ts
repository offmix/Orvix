import { describe, expect, it } from "vitest";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";
import { MODELS } from "@/lib/models";

describe("Requested browser models", () => {
  it.each([
    ["Gemma 3 1B", "gemma3-1b-it-q4f16_1-MLC"],
    ["Phi-3.5-mini-instruct", "Phi-3.5-mini-instruct-q4f16_1-MLC"],
    ["SmolLM2 1.7B", "SmolLM2-1.7B-Instruct-q4f16_1-MLC"],
  ])("offers a supported %s model", (_name, id) => {
    expect(MODELS.map((model) => model.id)).toContain(id);
    expect(prebuiltAppConfig.model_list.map((model) => model.model_id)).toContain(id);
  });
});