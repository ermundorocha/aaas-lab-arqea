import { on, emit } from "./bus.js";
import { generatePreview } from "./ai.js";
import { buildArtifacts } from "./artifacts.js";
import { writeFilesToDocs, updateCatalog } from "./store.js";
import { gitCommitDocs } from "./gitops.js";
import { buildDrawio } from "./drawio.js";

import { addStep, setStatus, setError, readJob, setCtx, mergeResult } from "./jobStore.js";

export function registerPipeline() {

  on("JOB_START", async ({ jobId }) => {
    const job = readJob(jobId);
    addStep(jobId, { level: "info", event: "AUDIT", msg: `workspace=${job.workspace} createdBy=${job.createdBy}` });

    setStatus(jobId, "RUNNING");
    addStep(jobId, { level: "info", event: "JOB_START", msg: "job running" });
    emit("STEP_PREVIEW", { jobId });
  });

  on("STEP_PREVIEW", async ({ jobId }) => {
    const job = readJob(jobId);
    if (!job) throw new Error("job not found");

    addStep(jobId, { level: "info", event: "STEP_PREVIEW", msg: "generating preview" });

    const preview = await generatePreview({ prompt: job.prompt, kind: job.kind });

    setCtx(jobId, { preview });
    emit("STEP_BUILD_ARTIFACTS", { jobId });
  });

  on("STEP_BUILD_ARTIFACTS", async ({ jobId }) => {
    const job = readJob(jobId);
    if (!job) throw new Error("job not found");

    const preview = job?.ctx?.preview;
    if (!preview) {
      // pré-requisito faltando → volta um step
      addStep(jobId, { level: "warn", event: "STEP_BUILD_ARTIFACTS", msg: "missing preview, re-running preview" });
      return emit("STEP_PREVIEW", { jobId });
    }

    addStep(jobId, { level: "info", event: "STEP_BUILD_ARTIFACTS", msg: "building artifacts" });

    const artifacts = buildArtifacts({
      kind: job.kind,
      prompt: job.prompt,
      previewMarkdown: preview
    });

    setCtx(jobId, { artifacts });
    mergeResult(jobId, { meta: artifacts.meta }); // não sobrescreve o resto

    emit("STEP_DRAWIO", { jobId });
  });

  on("STEP_DRAWIO", async ({ jobId }) => {
    const job = readJob(jobId);
    if (!job) throw new Error("job not found");

    const artifacts = job?.ctx?.artifacts;
    if (!artifacts) {
      addStep(jobId, { level: "warn", event: "STEP_DRAWIO", msg: "missing artifacts, rebuilding" });
      return emit("STEP_BUILD_ARTIFACTS", { jobId });
    }

    if (process.env.ENABLE_DRAWIO !== "true") {
      addStep(jobId, { level: "info", event: "STEP_DRAWIO", msg: "disabled, skipping" });
      return emit("STEP_WRITE_FILES", { jobId });
    }

    addStep(jobId, { level: "info", event: "STEP_DRAWIO", msg: "building drawio xml" });

    const xml = buildDrawio({ title: artifacts.meta.title, nodes: artifacts.nodes });

    // evita duplicar o mesmo arquivo em retries
    const has = artifacts.files.some(f => f.path === artifacts.meta.diagramPath);
    if (!has) artifacts.files.push({ path: artifacts.meta.diagramPath, content: xml });

    setCtx(jobId, { artifacts }); // atualiza ctx com o drawio incluso
    emit("STEP_WRITE_FILES", { jobId });
  });

  on("STEP_WRITE_FILES", async ({ jobId }) => {
    const job = readJob(jobId);
    if (!job) throw new Error("job not found");

    const artifacts = job?.ctx?.artifacts;
    if (!artifacts) {
      addStep(jobId, { level: "warn", event: "STEP_WRITE_FILES", msg: "missing artifacts, rebuilding" });
      return emit("STEP_BUILD_ARTIFACTS", { jobId });
    }

    addStep(jobId, { level: "info", event: "STEP_WRITE_FILES", msg: "writing docs files + catalog" });

    //writeFilesToDocs({ files: artifacts.files });
    //updateCatalog({ newFiles: artifacts.files.map(f => f.path) });

    writeFilesToDocs({ workspace: job.workspace, files: artifacts.files });
    updateCatalog({ workspace: job.workspace, newFiles: artifacts.files.map(f => f.path) });

    mergeResult(jobId, { written: artifacts.files.map(f => f.path) });

    emit("STEP_GITOPS", { jobId });
  });

  on("STEP_GITOPS", async ({ jobId }) => {
    const job = readJob(jobId);
    if (!job) throw new Error("job not found");

    let gitops = { enabled: process.env.ENABLE_GITOPS === "true" };

    if (process.env.FAIL_GITOPS === "true") {
      throw new Error("Falha simulada em GitOps (FAIL_GITOPS=true)");
    }

    if (process.env.ENABLE_GITOPS === "true") {
      const artifacts = job?.ctx?.artifacts;
      const msg = artifacts?.meta ? `AaaS: ${artifacts.meta.kind} ${artifacts.meta.slug}` : `AaaS: update docs`;
      addStep(jobId, { level: "info", event: "STEP_GITOPS", msg: "committing docs" });
      gitops = await gitCommitDocs({ message: msg });
    }

    mergeResult(jobId, { gitops });

    setStatus(jobId, "DONE");
    addStep(jobId, { level: "info", event: "DONE", msg: "job completed" });
  });

}