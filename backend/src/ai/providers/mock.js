export function buildMockProvider() {
  return {
    name: "mock",
    async generatePreview({ job }) {
      // exatamente sua lógica mocado atual (pode copiar/colar do ai.js antigo)
      return {
        title: `Preview (MOCK) — ${job.kind || "blueprint"}`,
        summary: "Preview mocado para validar pipeline e UI sem custo de IA.",
        artifacts: [
          {
            path: `blueprints/${job.workspace || "default"}/onepage.md`,
            contentType: "text/markdown",
            content:
`# OnePage (MOCK)
Workspace: ${job.workspace}
Pedido: ${job.prompt}

- Este é um preview mocado.
- Próximo passo: trocar AI_PROVIDER para gemini/openai.
`
          }
        ]
      };
    }
  };
}