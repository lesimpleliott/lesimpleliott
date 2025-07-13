import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ GITHUB_TOKEN manquant dans .env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// =============================================
// FETCH TOOLS
// =============================================

/**
 * Wrapper générique pour appeler l’API GitHub
 */
const fetchFromGitHub = async (url) => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} (${url})`);
  return res.json();
};

/**
 * Récupère tous les repos accessibles appartenant à l'utilisateur
 */
export const fetchAllRepos = async (user) => {
  const url = `https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member`;
  const allRepos = await fetchFromGitHub(url);
  return allRepos.filter(
    (repo) => repo.owner?.login?.toLowerCase() === user.toLowerCase()
  );
};

/**
 * Récupère un seul repo (par nom complet "user/repo")
 */
export const fetchRepo = async (fullName) => {
  const url = `https://api.github.com/repos/${fullName}`;
  return fetchFromGitHub(url);
};

// =============================================
// UPDATE TOOLS
// =============================================

/**
 * Met à jour un dépôt GitHub (nom, description, archived)
 */
export const updateRepoData = async (project) => {
  const match = project.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return;

  const [_, owner, oldName] = match;
  const { name: newName, description, archived: archivedFromJSON } = project;

  const repoUrl = `https://api.github.com/repos/${owner}/${oldName}`;
  const currentRes = await fetch(repoUrl, { headers });

  if (!currentRes.ok) {
    if (currentRes.status === 403 || currentRes.status === 404)
      return "ignored";
    return "error";
  }

  const currentData = await currentRes.json();
  const wasArchived = currentData.archived;

  const hasNameChanged = newName !== currentData.name;
  const hasDescriptionChanged = description !== currentData.description;
  const hasArchivedChanged =
    typeof archivedFromJSON === "boolean" &&
    archivedFromJSON !== currentData.archived;

  const requiresUpdate =
    hasNameChanged || hasDescriptionChanged || hasArchivedChanged;

  if (!requiresUpdate) return "unchanged";

  // 1. Désarchiver temporairement si besoin
  if (wasArchived) {
    await fetch(repoUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: false }),
    });
  }

  // 2. Appliquer les modifications
  const patchPayload = {
    name: newName,
    description,
  };
  if (!wasArchived && hasArchivedChanged) {
    patchPayload.archived = archivedFromJSON;
  }

  const patchRes = await fetch(repoUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchPayload),
  });

  if (!patchRes.ok) return "error";

  const updated = await patchRes.json();

  // 3. Mettre à jour l'URL locale si renommé
  if (hasNameChanged) {
    project.url = `https://github.com/${owner}/${newName}`;
  }

  // 4. Mettre à jour le champ archived localement
  if (
    typeof archivedFromJSON !== "boolean" ||
    archivedFromJSON !== updated.archived
  ) {
    project.archived = updated.archived;
  }

  // 5. Réarchiver si nécessaire
  if (wasArchived) {
    await fetch(repoUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
    });

    project.archived = true;
  }

  return "updated";
};

/**
 * Récupère un arbre GitHub (tree) à partir du nom du repo et de la branche
 */
export const fetchRepoTree = async (fullName, branch) => {
  const url = `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`;
  return fetchFromGitHub(url);
};

/**
 * Récupère un blob GitHub (contenu d’un fichier brut, ex: package.json)
 */
export const fetchRepoBlob = async (fullName, sha) => {
  const url = `https://api.github.com/repos/${fullName}/git/blobs/${sha}`;
  return fetchFromGitHub(url);
};
