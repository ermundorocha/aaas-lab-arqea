import fs from "fs";
import path from "path";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function writeFilesToDocs({ workspace = "default", files }) {
  const docsRoot = path.resolve("../docs/workspaces", workspace);

  for (const f of files) {
    const full = path.join(docsRoot, f.path);
    ensureDir(path.dirname(full));
    fs.writeFileSync(full, f.content, "utf-8");
  }
}

export function updateCatalog({ workspace = "default", newFiles }) {
  const docsRoot = path.resolve("../docs/workspaces", workspace);
  const catalogPath = path.join(docsRoot, "index.json");

  let catalog = { files: [] };

  if (fs.existsSync(catalogPath)) {
    const raw = fs.readFileSync(catalogPath, "utf-8");
    catalog = JSON.parse(raw || '{"files":[]}');
    if (!Array.isArray(catalog.files)) catalog.files = [];
  }

  for (const nf of newFiles) {
    if (!catalog.files.includes(nf)) catalog.files.push(nf);
  }

  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf-8");
}
// export function writeFilesToDocs({ files }) {
//   const docsRoot = path.resolve("../docs");

//   for (const f of files) {
//     const full = path.join(docsRoot, f.path);
//     ensureDir(path.dirname(full));
//     fs.writeFileSync(full, f.content, "utf-8");
//   }
// }

// export function updateCatalog({ newFiles }) {
//   const docsRoot = path.resolve("../docs");
//   const catalogPath = path.join(docsRoot, "index.json");

//   let catalog = { files: [] };

//   if (fs.existsSync(catalogPath)) {
//     const raw = fs.readFileSync(catalogPath, "utf-8");
//     catalog = JSON.parse(raw || '{"files":[]}');
//     if (!Array.isArray(catalog.files)) catalog.files = [];
//   }

//   // adiciona sem duplicar
//   for (const nf of newFiles) {
//     if (!catalog.files.includes(nf)) catalog.files.push(nf);
//   }

//   fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf-8");
// }
