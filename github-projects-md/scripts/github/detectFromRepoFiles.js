import { fetchRepoTree } from "./githubClient.js";

/**
 * Récupère toutes les extensions de fichiers présentes dans un repo GitHub
 * @param {object} repo - Objet repo GitHub avec `full_name`
 * @returns {Promise<string[]>}
 */
export async function detectFromRepoFiles(repo) {
  const { tree } = await fetchRepoTree(repo.full_name, repo.default_branch);
  if (!tree) return [];

  const files = tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  const extensions = files
    .map((file) => {
      const extMatch = file.match(/\.([a-z0-9]+)$/i);
      return extMatch ? extMatch[1].toLowerCase() : null;
    })
    .filter(Boolean);

  return [...new Set(extensions)].sort();
}
