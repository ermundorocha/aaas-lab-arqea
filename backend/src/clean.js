import fs from "node:fs/promises";
import path from "node:path";

function docsRoot() {
  return path.resolve(process.cwd(), "..", "docs");
}

async function rmSafe(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function clearWorkspaceDocs(workspace) {
  if (!workspace || !/^[a-z0-9-_]{2,32}$/i.test(workspace)) {
    throw new Error("invalid_workspace");
  }

  const root = docsRoot();
  const wsRoot = path.join(root, "workspaces", workspace);

  // remove tudo e recria
  await rmSafe(wsRoot);
  await ensureDir(wsRoot);

  // recria catálogo vazio
  const catalogPath = path.join(wsRoot, "index.json");
  const payload = { workspace, files: [] };
  await fs.writeFile(catalogPath, JSON.stringify(payload, null, 2), "utf-8");

  return {
    ok: true,
    workspace,
    cleared: [`docs/workspaces/${workspace}/*`]
  };
}
