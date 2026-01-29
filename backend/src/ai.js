import { buildMockProvider } from "./ai/providers/mock.js";
import { buildGeminiProvider } from "./ai/providers/gemini.js";

// no futuro:
// import { buildOpenAIProvider } from "./ai/providers/openai.js";
// import { buildAzureOpenAIProvider } from "./ai/providers/azureOpenAI.js";

function resolveProviderName() {
  // Compatibilidade: se MOCK_AI=true, força mock
  if ((process.env.MOCK_AI || "").toLowerCase() === "true") return "mock";

  // Novo padrão: escolher provider
  return (process.env.AI_PROVIDER || "mock").toLowerCase();
}

function buildProvider(name) {
  if (name === "gemini") return buildGeminiProvider();
  if (name === "mock") return buildMockProvider();

  // fallback seguro
  return buildMockProvider();
}

/**
 * Função usada pelo pipeline.
 * Mantém a mesma assinatura/uso atual.
 */
export async function generatePreview(job) {
  const providerName = resolveProviderName();
  const provider = buildProvider(providerName);

  // padrão de log simples (você pode jogar isso nos steps depois)
  // console.log(`[AI] provider=${provider.name} job=${job.id}`);

  return provider.generatePreview({ job });
}