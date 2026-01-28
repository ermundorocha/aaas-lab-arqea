# AaaS Lab (Architecture as a Service) — MVP

Este repositório entrega um MVP de **Arquitetura como Serviço (AaaS)**: uma plataforma que transforma prompts em **artefatos arquiteturais versionados**, com pipeline assíncrono, **GitOps**, **workspaces (multi-tenant leve)** e **publicação do UI via GitHub Pages**.

> MVP orientado a stakeholders: demonstra valor com governança mínima viável, mantendo um caminho claro de evolução para produção.

---

## Visão Executiva

**Problema**
- Times precisam gerar e manter documentação arquitetural de forma consistente, rastreável e com baixo atrito.
- Documentos costumam se perder em pastas, versões divergentes e sem governança.

**Solução**
- Um UI web (OnePage) aciona um backend seguro para gerar artefatos (ADR/Blueprint/Docs),
- salva em estrutura padronizada por workspace,
- versiona via GitOps (commit automático),
- e oferece abertura/consulta dos artefatos via API.

**Benefícios**
- **Padronização** e repetibilidade de documentação.
- **Auditabilidade** (jobs, steps e resultados).
- **Recuperabilidade** (retry por step / resume automático).
- **Evolução gradual**: do MVP local para VPS/Node/IIS e integração corporativa (OIDC, Vault, observabilidade).

---
## Componentes e Responsabilidades

**UI (OnePage)**

- Publicado via GitHub Pages a partir de public/.

**Funções**

- configurar Backend URL, workspace, token
- carregar catálogo (GET /api/catalog)
- gerar job (POST /api/mvp1/generate)
- acompanhar job (GET /api/jobs/:id)
- abrir artefatos via link assinado (GET /api/file-link → abre /api/public/file)

**Tecnologias**

- HTML5, CSS3 responsivo, JS vanilla
- Modo dark
- Renderizador de documentação “Arquitetura” via Markdown + Mermaid

**Backend (API Seguro)**

- Node.js + Express (ESM)
- Workspaces via header:
- x-aaas-workspace: <ws>
- x-aaas-token: <token>
- Pipeline assíncrono com steps, persistência de job e recuperação por step:
- retry explícito (ex.: STEP_DRAWIO)
- resume automático (retoma o que falta)
- Técnicas-chave
- Event-driven pipeline (bus interno)
- Idempotência prática (evitar duplicar arquivos drawio em retries)
- Segregação por workspace (multi-tenant leve)
- GitOps para versionamento dos artefatos

**Gerador de Artefatos**

- Constrói arquivos .md e metadados.
- Padrões sugeridos:
- ADR (Architecture Decision Records)
- Blueprints de solução
- Catálogo (index.json) por workspace

**Draw.io Generator**

- Gera .drawio (XML) automaticamente para diagramas básicos.
- Evolui naturalmente para templates corporativos e bibliotecas (Draw.io libs).

**GitOps (simple-git)**

- git add docs/workspaces/**
- git commit com mensagem padronizada
- Mantém rastreabilidade de mudanças arquiteturais.

**Entrega de Artefatos via Backend (link assinado)**

- UI não expõe docs/ direto.
  
***Para abrir arquivo:***
-- UI pede /api/file-link?path=... (autenticado)
-- backend retorna URL temporária assinada
-- UI abre /api/public/file?... (sem headers)

***Neste MVP, TTL/log/rate-limit podem ser adicionados depois como hardening.***

- Padrões e Princípios Aplicados
- Arquitetura e Governança
- Separação de responsabilidades (UI / API / Artefatos / Versionamento)
- Evolução incremental (MVP → produção)
- Estrutura padronizada para artefatos (workspaces)
- Integração e Pipeline
- Event-driven steps (JOB_START → PREVIEW → ARTIFACTS → DRAWIO → WRITE → GITOPS)
- Recoverability: retry por step e resume automático

***Segurança (MVP)***

- Token por workspace (header-based)
- Entrega de arquivos por URL assinada (evita header em download direto)
- CORS controlado (allowlist por env)
- Roadmap de segurança: OIDC/JWT, Vault, políticas por papel (RBAC), auditoria completa.

***Estrutura de Diretórios***

- public/ — site publicado no GitHub Pages (UI)
- frontend/ — fonte do UI (quando houver)
- backend/ — API Node/Express + pipeline
- docs/workspaces/<ws>/ — artefatos versionados por workspace
- .github/workflows/pages.yml — pipeline de publicação do Pages

****Como Rodar Localmente****

**1) Backend "backend/.env (exemplo)"**

- MULTI_TENANT=true
- WORKSPACE_TOKENS=default:ermundo-aaas-123;arqea:arqea-456;lab:lab-789
- ENABLE_GITOPS=true
- ENABLE_DRAWIO=true
- MOCK_AI=true
- FILE_LINK_SECRET=troque-por-um-segredo-grande
- FILE_LINK_TTL_SECONDS=300
- CORS_ORIGINS=http://localhost:3000

**2) Executar:**

- cd backend
- npm install
- npm run dev

**3) UI local**

- npx serve public -p 3000

**4) Como Demonstrar via GitHub Pages (sem depender de localhost)**

Para demo remota, o backend local pode ser exposto temporariamente via túnel HTTPS (ex.: cloudflared quick tunnel).
Nesse caso:

- UI (Pages) roda em HTTPS público
- Backend ganha uma URL HTTPS temporária para o campo “Backend URL” no UI

***API (principais endpoints)***

- GET /api/whoami
- GET /api/catalog
- POST /api/mvp1/generate
- GET /api/jobs/:id
- POST /api/jobs/:id/retry (com { from: "STEP_..." } ou resume sem from)
- GET /api/file-link?path=...
- GET /api/public/file?... (assinada)

***Roadmap (próximas evoluções)***

**Produção**

- Backend em VPS/Windows Server (Node/IIS reverse proxy)
- HTTPS real + domínio próprio
- Observabilidade (logs estruturados, métricas, tracing)

**Segurança**

- OIDC/JWT (Azure AD/Keycloak)
- Vault para segredos
- RBAC por papéis e auditoria de download

**Artefatos**

- Templates corporativos (ADR, C4, ArchiMate)
- Geração de PDF e pacote (zip)
- Catálogo com metadados e assinatura de integridade
