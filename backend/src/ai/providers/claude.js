import Anthropic from "@anthropic-ai/sdk";

function mustEnv(name) {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`${name} not set`);
  return v;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "artifact";
}

function extractJson(text) {
  const t = String(text || "").trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(t);
  } catch (_) {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("Claude did not return valid JSON");
  }
}

function textFromClaude(contentArr) {
  // Claude Messages API retorna content[] com blocos (type: "text", etc.)
  return (contentArr || [])
    .filter(x => x && x.type === "text" && typeof x.text === "string")
    .map(x => x.text)
    .join("\n")
    .trim();
}

function kindRules(kind) {
  if (kind === "blueprint") {
    return { dir: "blueprints/", ext: ".md", contentType: "text/markdown" };
  }
  if (kind === "adr") {
    return { dir: "decisions/", ext: ".md", contentType: "text/markdown" };
  }
  if (kind === "drawio") {
    return { dir: "diagrams/", ext: ".drawio", contentType: "application/xml" };
  }
  throw new Error(`unsupported kind: ${kind}`);
}

function validatePreview(preview, kind) {
  if (!preview || typeof preview !== "object") throw new Error("Claude preview is not an object");
  if (!Array.isArray(preview.artifacts)) throw new Error("Claude preview missing artifacts[]");

  const rules = kindRules(kind);

  const ok = preview.artifacts.some(a =>
    a &&
    typeof a.path === "string" &&
    typeof a.content === "string" &&
    typeof a.contentType === "string" &&
    a.path.startsWith(rules.dir) &&
    a.path.toLowerCase().endsWith(rules.ext) &&
    a.contentType === rules.contentType
  );

  if (!ok) {
    throw new Error(`Claude preview artifacts invalid for kind=${kind}`);
  }
}

export function buildClaudeProvider() {
  const apiKey = mustEnv("ANTHROPIC_API_KEY");
  const model = (process.env.CLAUDE_MODEL || "claude-sonnet-4-5").trim();
  const maxTokens = Number.parseInt(process.env.CLAUDE_MAX_TOKENS || "1200", 10);

  const client = new Anthropic({ apiKey });

  return {
    name: "claude",

    async generatePreview({ job }) {
      const kind = String(job?.kind || "").trim();
      const prompt = String(job?.prompt || "").trim();
      if (!kind) throw new Error("job.kind missing");
      if (!prompt) throw new Error("job.prompt missing");

      const rules = kindRules(kind);

      // Instrução: retornar JSON único, com 1 artefato do kind solicitado
      const system = [
        "Você é um gerador de artefatos AaaS.",
        "Responda APENAS com um único objeto JSON válido (sem markdown, sem comentários, sem ```).",
        "O JSON deve seguir este schema:",
        "{",
        '  "title": "string",',
        '  "summary": "string",',
        '  "artifacts": [',
        "    {",
        '      "path": "string",',
        '      "contentType": "string",',
        '      "content": "string"',
        "    }",
        "  ]",
        "}",
        "",
        "Regras obrigatórias:",
        `- Gere EXATAMENTE 1 artifact.`,
        `- O artifact deve ter contentType="${rules.contentType}".`,
        `- path deve iniciar com "${rules.dir}" e terminar com "${rules.ext}".`,
        `- NÃO inclua workspace no path (o backend aplica).`,
        `- NÃO gere outros kinds.`,
      ].join("\n");

      // Sugestão de path para reduzir variação
      const suggestedSlug = slugify(prompt.split("\n")[0]);
      const suggestedPath =
        kind === "adr"
          ? `${rules.dir}ADR-${suggestedSlug}${rules.ext}`
          : `${rules.dir}${suggestedSlug}${rules.ext}`;

      const user = [
        `KIND_ARTEFATO: ${kind}`,
        `PATH_SUGERIDO: ${suggestedPath}`,
        "",
        "PROMPT:",
        prompt,
      ].join("\n");

      // 1 tentativa + 1 retry “forçado” caso venha lixo
      for (let attempt = 1; attempt <= 2; attempt++) {
        const resp = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        });

        const text = textFromClaude(resp.content);
        const preview = extractJson(text);

        // normaliza defaults
        preview.title = preview.title || "AaaS Artifact";
        preview.summary = preview.summary || "";
        preview.artifacts = Array.isArray(preview.artifacts) ? preview.artifacts : [];

        try {
          validatePreview(preview, kind);
          return preview;
        } catch (e) {
          if (attempt === 2) throw e;
          // reforça a regra no segundo round
          // (sem conversa longa — só correção)
        }
      }

      throw new Error("Claude preview failed");
    },
  };
}