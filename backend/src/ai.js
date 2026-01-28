
export async function generatePreview({ prompt, kind = "blueprint", systemContext }) {

  if (process.env.MOCK_AI === "true") {
    return `# Preview de Arquitetura (Mock)

            ## Objetivo
            Validar o fluxo de Arquitetura como Serviço (AaaS) sem dependência externa.

            ## Escopo
            - Frontend estático
            - Backend seguro
            - Geração de artefatos arquiteturais

            ## Arquitetura (alto nível)
            Front → Backend → Artefatos → GitOps → Publicação

            ## NFRs
            - Segurança
            - Rastreabilidade
            - Recuperabilidade
            - Evolução incremental

            ## Próximos Passos
            - Persistir artefatos
            - Versionar em Git
            - Automatizar diagramas
            `;
  }
      
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) throw new Error("OPENAI_API_KEY ausente no .env");

  const system = systemContext || `
Você é um Arquiteto Corporativo (ARQEA). Responda em PT-BR.
Produza um preview de artefato arquitetural no formato Markdown.
Seja executivo, estruturado, com seções e itens acionáveis.
`;

  const user = `
Tipo: ${kind}
Pedido:
${prompt}

Entregue um Markdown enxuto (máx. 80 linhas), com:
- Objetivo
- Escopo
- Arquitetura (alto nível)
- NFRs
- Próximos passos
`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: user.trim() }
      ]
    })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${txt}`);
  }

  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}