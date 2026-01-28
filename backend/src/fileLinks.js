import crypto from "crypto";

function b64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function signFileLink({ workspace, relPath, exp }) {
  const secret = process.env.FILE_LINK_SECRET || "";
  if (!secret) throw new Error("FILE_LINK_SECRET not set");

  const payload = `${workspace}\n${relPath}\n${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  return b64url(sig);
}

export function makeSignedUrl({ workspace, relPath }) {
  const ttl = Number(process.env.FILE_LINK_TTL_SECONDS || 300);
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = signFileLink({ workspace, relPath, exp });

  const qs = new URLSearchParams({
    ws: workspace,
    path: relPath,
    exp: String(exp),
    sig
  });

  // endpoint público (não precisa headers)
  return `/api/public/file?${qs.toString()}`;
}

export function verifySignedUrl({ workspace, relPath, exp, sig }) {
  const now = Math.floor(Date.now() / 1000);
  const expNum = Number(exp);

  if (!expNum || expNum < now) return { ok: false, reason: "expired" };
  if (!sig) return { ok: false, reason: "missing_sig" };

  const expected = signFileLink({ workspace, relPath, exp: expNum });
  if (!safeEqual(sig, expected)) return { ok: false, reason: "bad_sig" };

  return { ok: true };
}
