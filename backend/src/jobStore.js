import fs from "fs";
import path from "path";
import crypto from "crypto";

const JOBS_DIR = path.resolve(process.env.JOBS_DIR || "./jobs");

function ensureDir() {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}
export function createJob({ workspace, kind, kindai, prompt, createdBy = "anonymous" }) {
  const job = {
    id: crypto.randomUUID().slice(0, 12),
    workspace,
    createdBy,
    kind,     // Kind - Artefato
    kindai: String(kindai).trim().toLowerCase(), // ✅ Kind – IA aparece no .json
    prompt,
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: { meta: {} },
    steps: [],
    ctx: {}
  };
  writeJob(job);
  return job;
}

// export function createJob({ kind, prompt, workspace = "default", createdBy = "unknown" }) {
//   ensureDir();
//   const id = crypto.randomUUID().slice(0, 12);
//   const job = {
//     id,
//     workspace,
//     createdBy,
//     kind: kind || "blueprint",
//     prompt,
//     status: "QUEUED",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//     steps: [],
//     result: null,
//     error: null
//   };
//   writeJob(job);
//   return job;
// }

export function writeJob(job) {
  ensureDir();
  job.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2), "utf-8");
}

export function readJob(id) {
  ensureDir();
  const p = path.join(JOBS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function addStep(id, step) {
  const job = readJob(id);
  if (!job) return null;
  job.steps.push({ ts: new Date().toISOString(), ...step });
  writeJob(job);
  return job;
}

export function setStatus(id, status) {
  const job = readJob(id);
  if (!job) return null;
  job.status = status;
  writeJob(job);
  return job;
}

export function setResult(id, result) {
  const job = readJob(id);
  if (!job) return null;
  job.result = result;
  writeJob(job);
  return job;
}

export function setError(id, error) {
  const job = readJob(id);
  if (!job) return null;
  job.error = error;
  job.status = "FAILED";
  writeJob(job);
  return job;
}

export function setCtx(jobId, patch) {
  const job = readJob(jobId);
  if (!job) throw new Error("job not found");

  job.ctx = job.ctx || {};
  Object.assign(job.ctx, patch || {});
  job.updatedAt = new Date().toISOString();

  writeJob(job);
  return job;
}

export function mergeResult(id, patch) {
  const job = readJob(id);
  if (!job) return null;
  job.result = { ...(job.result || {}), ...(patch || {}) };
  writeJob(job);
  return job;
}

export function clearError(id) {
  const job = readJob(id);
  if (!job) return null;
  job.error = null;
  writeJob(job);
  return job;
}

export function listJobs({ status, limit = 20 } = {}) {
  ensureDir();
  const files = fs.readdirSync(JOBS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => path.join(JOBS_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs); // mais recentes primeiro

  const out = [];
  for (const f of files) {
    if (out.length >= limit) break;
    const job = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (status && job.status !== status) continue;
    out.push({
      id: job.id,
      status: job.status,
      kind: job.kind,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error
    });
  }
  return out;
}