// scripts/core/gitApi.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN manquant dans .env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

/**
 * Met à jour un dépôt GitHub (nom, description, archived)
 */
export const updateRepo = async (project) => {
  const match = project.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return;

  const [_, owner, oldName] = match;
  const { name: newName, description, archived: archivedFromJSON } = project;

  if (owner !== "lesimpleliott") {
    return "ignored";
  }

  const repoUrl = `https://api.github.com/repos/${owner}/${oldName}`;
  const currentRes = await fetch(repoUrl, { headers });
  if (!currentRes.ok) return "error";

  const currentData = await currentRes.json();
  const wasArchived = currentData.archived;

  // 1. Désarchiver temporairement si besoin
  if (
    wasArchived &&
    (newName !== oldName || description || archivedFromJSON !== wasArchived)
  ) {
    await fetch(repoUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: false }),
    });
  }

  // 2. Mise à jour
  const patchPayload = { name: newName, description };
  if (
    typeof archivedFromJSON === "boolean" &&
    archivedFromJSON !== wasArchived
  ) {
    patchPayload.archived = archivedFromJSON;
  }

  const patchRes = await fetch(repoUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchPayload),
  });

  if (!patchRes.ok) return "error";
  const updated = await patchRes.json();

  // 3. Si renommé → mise à jour de l'URL
  if (newName !== oldName) {
    project.url = `https://github.com/${owner}/${newName}`;
  }

  // 4. Met à jour archived dans le JSON local
  if (
    typeof archivedFromJSON !== "boolean" ||
    archivedFromJSON !== updated.archived
  ) {
    project.archived = updated.archived;
  }

  return "updated";
};
