import { buildMockProvider } from "./providers/mock.js";
import { buildGeminiProvider } from "./providers/gemini.js";

export function getAIProvider() {
  const p = (process.env.AI_PROVIDER || "mock").toLowerCase();

  if (p === "gemini") return buildGeminiProvider();
  if (p === "mock") return buildMockProvider();

  // fallback seguro
  return buildMockProvider();
}