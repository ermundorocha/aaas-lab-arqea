import { GoogleGenAI } from "@google/genai";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

// Schema simples (subset suportado) — bom para MVP.
// Evite schemas muito profundos/complexos para reduzir rejeição/instabilidade.
export const ArtifactPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "artifacts"],
  properties: {
    title: { type: "string", minLength: 3 },
    summary: { type: "string", minLength: 10 },
    artifacts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "contentType", "content"],
        properties: {
          path: { type: "string", minLength: 3 },
          contentType: {
            type: "string",
            enum: ["text/markdown", "application/json"],
          },
          content: { type: "string", minLength: 1 },
        },
      },
    },
  },
};

function validateOrThrow(obj) {
  const validate = ajv.compile(ArtifactPlanSchema);
  const ok = validate(obj);
  if (!ok) {
    const msg =
      validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("; ") ||
      "unknown";
    throw new Error(`Gemini output invalid (schema): ${msg}`);
  }
  return obj;
}

// Remove fences e tenta “recortar” o JSON mesmo se vier com texto.
function extractJson(text) {
  const t = (text || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return t.slice(a, b + 1);

  const c = t.indexOf("[");
  const d = t.lastIndexOf("]");
  if (c >= 0 && d > c) return t.slice(c, d + 1);

  return t;
}

async function callGeminiStructured({ client, model, prompt, schema }) {
  // IMPORTANTE: no GenAI SDK JS, o structured output vem via `config`
  // com `responseMimeType` e `responseJsonSchema`.  :contentReference[oaicite:3]{index=3}
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  });

  return response?.text || "";
}

// 1 tentativa extra de “repair” (ótimo para demo)
async function repairToJson({ client, model, badText, schema }) {
  const prompt = `
Corrija a saída abaixo para JSON VÁLIDO que respeite o schema.
Responda SOMENTE com JSON (sem markdown, sem comentários).

SAÍDA INVÁLIDA:
${badText}
`.trim();

  const fixed = await callGeminiStructured({ client, model, prompt, schema });
  return fixed;
}

export function buildGeminiProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenAI({ apiKey });

  return {
    name: "gemini",

    async generatePreview({ job }) {
      // Observação: gemini-2.5-flash suporta structured outputs. :contentReference[oaicite:4]{index=4}
      const system = [
        "Você é um Arquiteto Enterprise Sênior.",
        "Gere um plano de artefatos para AaaS (MVP).",
        "Responda SOMENTE em JSON de acordo com o schema.",
      ].join("\n");

      const prompt = `
SYSTEM:
${system}

CONTEXTO:
Workspace: ${job.workspace}
Kind: ${job.kind}
Pedido: ${job.prompt}

REGRAS:
- Retorne SOMENTE artefatos do kind solicitado: ${job.kind}
- paths devem ser RELATIVOS (não incluir docs/workspaces)
- blueprint -> apenas .md em blueprints/
- adr      -> apenas .md em adrs/
- drawio   -> apenas .drawio (XML) em drawio/
`.trim();

      // Chamada estruturada + parse defensivo + 1 repair
      let text = await callGeminiStructured({
        client,
        model,
        prompt,
        schema: ArtifactPlanSchema,
      });

      let jsonStr = extractJson(text);
      let obj;

      try {
        obj = JSON.parse(jsonStr);
      } catch {
        // tenta reparar uma vez
        const repaired = await repairToJson({
          client,
          model,
          badText: text,
          schema: ArtifactPlanSchema,
        });
        jsonStr = extractJson(repaired);
        obj = JSON.parse(jsonStr);
      }

      return validateOrThrow(obj);
    },
  };
}
