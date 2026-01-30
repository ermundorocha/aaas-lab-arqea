
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { authWorkspace } from "./authz.js";
import { registerPipeline } from "./pipeline.js";

import { clearError, 
         setStatus, 
         createJob, 
         readJob, 
         addStep, 
         setError, 
         listJobs } from "./jobStore.js";
import { emit } from "./bus.js";

import { buildDrawio } from "./drawio.js";
import { buildArtifacts } from "./artifacts.js";
import { writeFilesToDocs, updateCatalog } from "./store.js";
import { generatePreview } from "./ai.js";

import { makeSignedUrl, verifySignedUrl } from "./fileLinks.js";

const app = express();

registerPipeline();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: true }));

// --- Config ---
const PORT = process.env.PORT || 8080;
const BASIC_TOKEN = process.env.BASIC_TOKEN || "change-me";
const ALLOWED_KINDS = new Set(["blueprint", "adr", "drawio"]);

// --- Auth simples (por header) ---
function auth(req, res, next) {
  const token = req.headers["x-aaas-token"];
  if (!token || token !== BASIC_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

app.get("/api/jobs", authWorkspace, (req, res) => {
  const status = req.query.status;
  const limit = Number(req.query.limit || 20);
  res.json({ ok: true, jobs: listJobs({ status, limit }) });
});

const ALLOWED_STEPS = new Set([
  "STEP_PREVIEW",
  "STEP_BUILD_ARTIFACTS",
  "STEP_DRAWIO",
  "STEP_WRITE_FILES",
  "STEP_GITOPS"
]);

app.post("/api/jobs/:id/retry", authWorkspace, (req, res) => {
  const jobId = req.params.id;

  // 1) lê job
  const job = readJob(jobId);
  if (!job) return res.status(404).json({ error: "job_not_found" });

  // (opcional) bloquear retry se já está rodando
  if (job.status === "RUNNING" || job.status === "QUEUED") {
    return res.status(409).json({ error: "job_busy", status: job.status });
  }

  // 2) decide 'from'
  let from = req.body?.from || req.query?.from;

  // 2.1) se não veio 'from', escolhe o próximo pendente
  if (!from) {
    from = pickNextStep(job);
    if (!from) {
      return res.status(409).json({
        error: "nothing_to_resume",
        msg: "Nenhum step pendente. Se quiser reprocessar, informe body.from explicitamente."
      });
    }
  }

  if (!ALLOWED_STEPS.has(from)) {
    return res.status(400).json({
      error: "invalid_step",
      allowed: Array.from(ALLOWED_STEPS)
    });
  }

  // 3) prepara e dispara
  clearError(jobId);
  setStatus(jobId, "RUNNING");
  addStep(jobId, { level: "warn", event: "RETRY", msg: `retry/resume from ${from}` });

  emit(from, { jobId, retry: true });

  res.json({ ok: true, jobId, from, mode: req.body?.from ? "retry" : "resume" });
});

app.get("/api/whoami", authWorkspace, (req, res) => {
  res.json({ ok: true, workspace: req.workspace, actor: req.actor });
});

// --- Status do Job ---
app.get("/api/jobs/:id", authWorkspace, (req, res) => {
  const job = readJob(req.params.id);
  if (!job) return res.status(404).json({ error: "job_not_found" });
  res.json(job);
});

// --- Healthcheck (público) ---
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "aaas-backend", ts: new Date().toISOString() });
});

// --- Ping protegido (teste de segurança) ---
app.get("/api/ping", authWorkspace, (req, res) => {
  res.json({ ok: true, msg: "pong", ts: new Date().toISOString() });
});

app.post("/api/mvp1/preview", authWorkspace, async (req, res) => {
  try {
    const { prompt, kind, systemContext } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const out = await generatePreview({ prompt, kind, systemContext });

    res.json({
      ok: true,
      kind: kind || "blueprint",
      preview_markdown: out
    });
  } catch (e) {
    res.status(500).json({ error: "preview_failed", detail: String(e?.message || e) });
  }
});

app.post("/api/mvp1/generate", authWorkspace, async (req, res, next) => {
    try {
      const workspace = req.workspace;
      const { kind, prompt } = req.body || {};

      if (!workspace) return res.status(400).json({ error: "workspace_required" });

      const ALLOWED = new Set(["blueprint","adr","drawio"]);
      if (!ALLOWED.has(kind)) return res.status(400).json({ error: "invalid_kind", allowed: [...ALLOWED] });

      const job = createJob({ workspace, kind, prompt });
      enqueueJob(job.id);
      res.json({ jobId: job.id });
    } catch (e) {
      next(e); 
    }
  
  // const { prompt, kind } = req.body || {};
  // if (!prompt) return res.status(400).json({ error: "prompt required" });

  // const job = createJob({ kind: kind || "blueprint", 
  //                         prompt,
  //                         workspace: req.workspace || "default",
  //                         createdBy: req.workspace || "default" });

  // // dispara assíncrono
  // try {
  //   emit("JOB_START", { jobId: job.id });
  //   addStep(job.id, { level: "info", event: "ENQUEUED", msg: "job queued" });
  // } catch (e) {
  //   setError(job.id, String(e?.message || e));
  // }

  // // resposta imediata (não bloqueia)
  // res.status(202).json({
  //   ok: true,
  //   jobId: job.id,
  //   statusUrl: `/api/jobs/${job.id}`
  // });
});

// --- Catálogo (lê docs/index.json) ---
app.get("/api/catalog", authWorkspace, (req, res) => {
  try {
    const ws = req.workspace || "default";
    const catalogPath = path.resolve(`../docs/workspaces/${ws}/index.json`);

    // backend está em aaas-lab/backend, então docs fica em ../docs
    // const catalogPath = path.resolve("../docs/index.json");
    const raw = fs.readFileSync(catalogPath, "utf-8");
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: "catalog_read_failed", detail: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AaaS backend rodando em http://localhost:${PORT}`);
  console.log(`🔎 Health: http://localhost:${PORT}/health`);
});

// --- gera link assinado com auth ---
app.get("/api/file-link", authWorkspace, (req, res) => {
  const rel = safeRelPath(req.query.path);
  if (!rel) return res.status(400).json({ error: "invalid_path" });

  const ws = req.workspace || "default";
  const url = makeSignedUrl({ workspace: ws, relPath: rel });

  res.json({ ok: true, url });
});

// --- entrega o arquivo sem header, valida assinatura + expiração e entrega o arquivo ---
app.get("/api/public/file", (req, res) => {
  const ws = (req.query.ws || "default").toString();
  const rel = safeRelPath(req.query.path);
  const exp = req.query.exp;
  const sig = (req.query.sig || "").toString();

  if (!rel) return res.status(400).json({ error: "invalid_path" });

  const v = verifySignedUrl({ workspace: ws, relPath: rel, exp, sig });
  if (!v.ok) return res.status(403).json({ error: "forbidden", reason: v.reason });

  const full = resolveWorkspaceFile(ws, rel);
  if (!full) return res.status(403).json({ error: "forbidden" });
  if (!fs.existsSync(full)) return res.status(404).json({ error: "not_found" });

  // cache privado curto (é conteúdo sensível / workspace)
  res.setHeader("Cache-Control", "private, max-age=60");

  // express setará content-type por extensão via res.sendFile
  res.sendFile(full);
});

app.use((err, req, res, next) => {
  console.error("API_ERROR:", err);
  res.status(500).json({
    error: "internal_error",
    message: err.message
  });
});

function pickNextStep(job) {
  // 1) preview
  if (!job?.ctx?.preview) return "STEP_PREVIEW";

  // 2) artifacts
  if (!job?.ctx?.artifacts) return "STEP_BUILD_ARTIFACTS";

  // 3) drawio pendente
  if (process.env.ENABLE_DRAWIO === "true") {
    const artifacts = job.ctx.artifacts;
    const diagramPath = artifacts?.meta?.diagramPath;
    const hasDiagram = artifacts?.files?.some(f => f.path === diagramPath);
    if (diagramPath && !hasDiagram) return "STEP_DRAWIO";
  }

  // 4) arquivos não gravados/catalogados
  if (!job?.result?.written || job.result.written.length === 0) return "STEP_WRITE_FILES";

  // 5) gitops pendente
  if (process.env.ENABLE_GITOPS === "true") {
    const g = job?.result?.gitops;
    // committed true = ok; no_changes também é ok (não há nada pra commitar)
    const ok = g?.committed === true || g?.reason === "no_changes";
    if (!ok) return "STEP_GITOPS";
  }

  return null; // nada pendente
}

function safeRelPath(p) {
  const raw = decodeURIComponent(p || "").replace(/\\/g, "/");
  const norm = path.posix.normalize(raw);

  // bloqueia path traversal
  if (!norm || norm.startsWith("..") || norm.includes("/../") || norm.includes("\0")) {
    return null;
  }
  // remove leading slash
  return norm.replace(/^\/+/, "");
}

function resolveWorkspaceFile(workspace, relPath) {
  const base = path.resolve("../docs/workspaces", workspace);
  const full = path.resolve(base, relPath);
  // garante que full está dentro de base
  if (!full.startsWith(base)) return null;
  return full;
}

