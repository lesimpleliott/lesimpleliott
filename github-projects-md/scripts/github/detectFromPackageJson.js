import { fetchRepoBlob, fetchRepoTree } from "./githubClient.js";

/**
 * Récupère toutes les dépendances listées dans les fichiers package.json d’un repo
 * @param {object} repo - Objet repo GitHub avec `full_name`
 * @returns {Promise<string[]>}
 */
export async function detectFromPackageJson(repo) {
  const { tree } = await fetchRepoTree(repo.full_name, repo.default_branch);
  if (!tree) return [];

  const pkgFiles = tree.filter(
    (item) =>
      item.path.endsWith("package.json") &&
      item.type === "blob" &&
      !item.path.includes("node_modules/")
  );

  if (pkgFiles.length === 0) return [];

  const deps = [];

  for (const file of pkgFiles) {
    const blob = await fetchRepoBlob(repo.full_name, file.sha);
    if (!blob) continue;

    try {
      const content = JSON.parse(
        Buffer.from(blob.content, "base64").toString("utf8")
      );
      const fileDeps = Object.keys({
        ...(content.dependencies || {}),
        ...(content.devDependencies || {}),
      });
      deps.push(...fileDeps);
    } catch {
      continue;
    }
  }

  return [...new Set(deps)].sort();
}
