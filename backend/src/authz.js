function parseWorkspaceTokens(raw) {
  const map = new Map();
  (raw || "")
    .split(";")
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(pair => {
      const [ws, token] = pair.split(":").map(x => (x || "").trim());
      if (ws && token) map.set(ws, token);
    });
  return map;
}

const TOKENS = parseWorkspaceTokens(process.env.WORKSPACE_TOKENS);

export function authWorkspace(req, res, next) {
  const token = req.headers["x-aaas-token"];
  const workspace = (req.headers["x-aaas-workspace"] || "default").toString().trim();

  if (!token) return res.status(401).json({ error: "unauthorized" });

  // single-tenant fallback
  if (process.env.MULTI_TENANT !== "true") {
    const basic = process.env.BASIC_TOKEN || token;
    if (token !== basic) return res.status(401).json({ error: "unauthorized" });
    req.workspace = "default";
    req.actor = { tokenHint: "basic" };
    return next();
  }

  const expected = TOKENS.get(workspace);
  if (!expected || token !== expected) {
    return res.status(403).json({ error: "forbidden", msg: "invalid token for workspace" });
  }

  req.workspace = workspace;
  req.actor = { workspace };
  next();
}
