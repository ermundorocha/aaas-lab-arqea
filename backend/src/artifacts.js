import crypto from "crypto";

function slugify(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function buildArtifacts({ kind = "blueprint", prompt, previewMarkdown }) {
  const id = crypto.randomUUID().slice(0, 8);
  const date = new Date().toISOString().slice(0, 10);

  const title = `${kind.toUpperCase()} ${date} - ${id}`;
  const slug = slugify(`${kind}-${date}-${id}`);

  const blueprintPath = `blueprints/${slug}.md`;
  const adrPath = `decisions/ADR-${date}-${id}.md`;
  const diagramPath = `diagrams/${slug}.drawio`;

  const blueprint = `# ${title}

## Contexto do Pedido
${prompt}

## Preview Gerado
${previewMarkdown}
`;

  const adr = `# ADR ${date}-${id}: ${kind}

## Contexto
${prompt}

## Decisão
Adotar uma abordagem incremental orientada a eventos, com artefatos versionados.

## Consequências
- Padronização e rastreabilidade dos artefatos
- Facilidade de rollback (quando GitOps entrar)
- Evolução por módulos independentes
`;

const nodes = [
  { label: "Frontend (OnePage)" },
  { label: "Backend IA Seguro (API)" },
  { label: "Artefatos (docs/) + GitOps" }
];

return {
    meta: { id, date, kind, slug, title, diagramPath },
    nodes,
    files: [
      { path: blueprintPath, content: blueprint },
      { path: adrPath, content: adr }
    ]
  };
}
