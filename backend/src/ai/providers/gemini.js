import { GoogleGenAI } from "@google/genai";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

const ArtifactPlanSchema = {
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
          contentType: { type: "string", enum: ["text/markdown", "application/json"] },
          content: { type: "string", minLength: 1 }
        }
      }
    }
  }
};

function validateOrThrow(obj) {
  const validate = ajv.compile(ArtifactPlanSchema);
  const ok = validate(obj);
  if (!ok) {
    const msg = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join("; ");
    throw new Error(`Gemini output invalid: ${msg}`);
  }
  return obj;
}

export function buildGeminiProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenAI({ apiKey });

  return {
    name: "gemini",
    async generatePreview({ job }) {
      const system = [
        "Você é um Arquiteto Enterprise Sênior.",
        "Gere um plano de artefatos para AaaS (MVP).",
        "Responda SOMENTE em JSON."
      ].join("\n");

      const prompt = `
Workspace: ${job.workspace}
Kind: ${job.kind}
Pedido: ${job.prompt}

Gere:
- title
- summary (executivo)
- artifacts[] com path/contentType/content
`.trim();

      const res = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${system}\n\n${prompt}` }] }],
        generationConfig: { responseMimeType: "application/json" },
        responseSchema: ArtifactPlanSchema
      });

      const text =
        res?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
        res?.text ??
        "";

      if (!text) throw new Error("Gemini returned empty response");

      let obj;
      try { obj = JSON.parse(text); }
      catch { throw new Error("Gemini did not return valid JSON"); }

      return validateOrThrow(obj);
    }
  };
}