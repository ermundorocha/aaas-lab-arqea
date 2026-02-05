//import { buildMockProvider } from "./ai/providers/mock.js";
import { buildGeminiProvider } from "./ai/providers/gemini.js";
import { buildClaudeProvider } from "./ai/providers/claude.js";

// function resolveProviderName() {
//   // Compatibilidade: se MOCK_AI=true, força mock
//   if ((process.env.MOCK_AI || "").toLowerCase() === "true") return "mock";

//   // Novo padrão: escolher provider
//   return (process.env.AI_PROVIDER || "mock").toLowerCase();
// }

function buildProvider(name) {
  const n = String(name || "").toLowerCase();

  if (n === "gemini") return buildGeminiProvider();
  if (n === "claude") return buildClaudeProvider();
  if (n === "mock") return buildMockProvider();

  // fallback seguro
  return buildMockProvider();
}

/**
 * Função usada pelo pipeline.
 * Mantém a mesma assinatura/uso atual.
 */
export async function generatePreview(job) {
  const forcedMock = (process.env.MOCK_AI || "").toLowerCase() === "true";

  // prioridade: job.ai → depois env → fallback
  const name =
    forcedMock ? "mock" :
    (job.ai || process.env.AI_PROVIDER || "mock").toLowerCase();

  const provider = buildProvider(name);
  return provider.generatePreview({ job });
}