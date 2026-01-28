import path from "path";
import simpleGit from "simple-git";

export async function gitCommitDocs({ message }) {
  const repoRoot = path.resolve(".."); // backend -> aaas-lab
  const git = simpleGit(repoRoot);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error("Git repo não inicializado na raiz aaas-lab");

  //await git.add(["docs/**"]);
  await git.add([`docs/workspaces/**`]);

  const status = await git.status();
  const hasDocsChanges =
    status.files?.some(f => f.path.startsWith("docs/") || f.path.startsWith("docs\\")) || false;

  if (!hasDocsChanges) {
    return { committed: false, reason: "no_changes" };
  }

  await git.commit(message || "AaaS: update docs artifacts");
  const log = await git.log({ maxCount: 1 });

  return { committed: true, lastCommit: log.latest };
}
