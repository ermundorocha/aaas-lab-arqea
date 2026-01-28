const els = {
  apiBase: document.getElementById("apiBase"),
  workspace: document.getElementById("workspace"),
  token: document.getElementById("token"),
  btnLoad: document.getElementById("btnLoad"),
  status: document.getElementById("status"),
  list: document.getElementById("list"),
  count: document.getElementById("count"),

  prompt: document.getElementById("prompt"),
  kind: document.getElementById("kind"),
  btnGenerate: document.getElementById("btnGenerate"),
  jobId: document.getElementById("jobId"),
  jobStatus: document.getElementById("jobStatus"),
  btnPoll: document.getElementById("btnPoll"),

  btnTheme: document.getElementById("btnTheme"),
};

let lastJobId = null;
let pollTimer = null;

function getCfg() {
  const apiBase = (els.apiBase.value || "").trim().replace(/\/$/, "");
  const workspace = (els.workspace.value || "default").trim();
  const token = (els.token.value || "").trim();
  return { apiBase, workspace, token };
}

function headersAuth(cfg) {
  return {
    "x-aaas-token": cfg.token,
    "x-aaas-workspace": cfg.workspace,
  };
}

function setStatus(msg, ok = true) {
  els.status.textContent = msg || "";
  els.status.style.color = ok ? "" : "crimson";
}

function extOf(p) {
  const m = (p || "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

function badgeLabel(path) {
  const ext = extOf(path);
  if (ext === "md") return "Markdown";
  if (ext === "drawio") return "Draw.io";
  if (ext === "json") return "JSON";
  return ext ? ext.toUpperCase() : "FILE";
}

//function docsLink(cfg, relPath) {
//  // docs são servidos externamente (porta 3000). Aqui vamos gerar um link relativo para o servidor estático.
//  // Se você preferir abrir via backend, podemos trocar isso depois.
//  return `../docs/workspaces/${encodeURIComponent(cfg.workspace)}/${relPath}`;
//}
async function openArtifact(cfg, relPath) {
  try {
    const qs = new URLSearchParams({ path: relPath });
    const r = await fetch(`${cfg.apiBase}/api/file-link?${qs.toString()}`, {
      headers: headersAuth(cfg)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(`Falha ao gerar link: ${data.error || r.status}`, false);
      return;
    }
    window.open(cfg.apiBase + data.url, "_blank", "noopener,noreferrer");
  } catch (e) {
    setStatus(`Erro ao abrir: ${e.message}`, false);
  }
}

function renderList(cfg, files = []) {
  els.list.innerHTML = "";
  els.count.textContent = String(files.length);

  if (!files.length) {
    els.list.innerHTML = `<div class="status">Nenhum arquivo no catálogo.</div>`;
    return;
  }

  for (const p of files) {
    const div = document.createElement("div");
    div.className = "item";

    const left = document.createElement("div");
    left.className = "left";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = p.split("/").pop();

    const path = document.createElement("div");
    path.className = "path";
    path.textContent = p;

    left.appendChild(name);
    left.appendChild(path);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "10px";
    right.style.alignItems = "center";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = badgeLabel(p);

    //const a = document.createElement("a");
    //a.href = docsLink(cfg, p);
    //a.target = "_blank";
    //a.rel = "noreferrer";
    //a.textContent = "Abrir";
    //
    //right.appendChild(badge);
    //right.appendChild(a);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Abrir";
    btn.addEventListener("click", () => openArtifact(cfg, p));

    right.appendChild(badge);
    right.appendChild(btn);

    div.appendChild(left);
    div.appendChild(right);

    els.list.appendChild(div);
  }
}

async function loadCatalog() {
  const cfg = getCfg();
  if (!cfg.apiBase) return setStatus("Informe o Backend URL.", false);
  if (!cfg.token) return setStatus("Informe o token do workspace.", false);

  setStatus("Carregando catálogo...");
  try {
    const r = await fetch(`${cfg.apiBase}/api/catalog`, {
      headers: headersAuth(cfg),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(`Falha ao carregar catálogo: ${data.error || r.status}`, false);
      return;
    }

    renderList(cfg, data.files || []);
    setStatus(`Catálogo carregado: workspace=${cfg.workspace}`);
  } catch (e) {
    setStatus(`Erro de rede: ${e.message}`, false);
  }
}

async function generateJob() {
  const cfg = getCfg();
  if (!cfg.apiBase) return setStatus("Informe o Backend URL.", false);
  if (!cfg.token) return setStatus("Informe o token do workspace.", false);

  const prompt = (els.prompt.value || "").trim();
  const kind = els.kind.value;

  if (!prompt) return setStatus("Informe um prompt para gerar.", false);

  setStatus("Disparando job...");
  try {
    const r = await fetch(`${cfg.apiBase}/api/mvp1/generate`, {
      method: "POST",
      headers: {
        ...headersAuth(cfg),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind, prompt }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(`Falha ao disparar job: ${data.error || r.status}`, false);
      return;
    }

    lastJobId = data.jobId;
    els.jobId.textContent = lastJobId;
    els.jobStatus.textContent = "QUEUED";
    setStatus(`Job criado: ${lastJobId}. Clique em "Acompanhar" para ver o progresso.`);
  } catch (e) {
    setStatus(`Erro de rede: ${e.message}`, false);
  }
}

async function pollJobOnce() {
  const cfg = getCfg();
  if (!cfg.apiBase || !cfg.token || !lastJobId) return;

  try {
    const r = await fetch(`${cfg.apiBase}/api/jobs/${lastJobId}`, {
      headers: headersAuth(cfg),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      els.jobStatus.textContent = "—";
      setStatus(`Falha ao consultar job: ${data.error || r.status}`, false);
      return;
    }

    els.jobStatus.textContent = data.status;

    if (data.status === "DONE") {
      clearInterval(pollTimer);
      pollTimer = null;
      setStatus("Job concluído. Recarregando catálogo…");
      await loadCatalog();
      setStatus("Concluído. Catálogo atualizado.");
    }

    if (data.status === "FAILED") {
      clearInterval(pollTimer);
      pollTimer = null;
      setStatus(`Job falhou: ${data.error || "ver steps"}`, false);
    }
  } catch (e) {
    setStatus(`Erro de rede: ${e.message}`, false);
  }
}

function startPolling() {
  if (!lastJobId) return setStatus("Nenhum job para acompanhar.", false);
  if (pollTimer) return; // já está
  setStatus("Acompanhando job...");
  pollJobOnce();
  pollTimer = setInterval(pollJobOnce, 1200);
}

function loadTheme() {
  const t = localStorage.getItem("aaas_theme") || "light";
  document.documentElement.classList.toggle("dark", t === "dark");
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("aaas_theme", isDark ? "dark" : "light");
}

// bindings
els.btnLoad.addEventListener("click", loadCatalog);
els.btnGenerate.addEventListener("click", generateJob);
els.btnPoll.addEventListener("click", startPolling);
els.btnTheme.addEventListener("click", toggleTheme);

// init
loadTheme();
setStatus("Configure o workspace e token para carregar o catálogo.");
