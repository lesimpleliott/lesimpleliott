// scripts/core/updateRepoData.js
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export const updateRepo = async (project) => {
  const match = project.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return "ignored";

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

  const hasNameChanged = newName !== currentData.name;
  const hasDescriptionChanged = description !== currentData.description;
  const hasArchivedChanged =
    typeof archivedFromJSON === "boolean" &&
    archivedFromJSON !== currentData.archived;

  const requiresUpdate =
    hasNameChanged || hasDescriptionChanged || hasArchivedChanged;

  if (!requiresUpdate) {
    return "unchanged";
  }

  // 1. Si archivé → désarchiver TEMPORAIREMENT
  if (wasArchived) {
    await fetch(repoUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: false }),
    });
  }

  // 2. Appliquer les modifs (sauf archived si archivé au départ)
  const patchPayload = {
    name: newName,
    description,
  };

  // On n’applique archived SEULEMENT si le repo n’était pas archivé
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

  // 3. Si renommé → mise à jour de l'URL
  if (hasNameChanged) {
    project.url = `https://github.com/${owner}/${newName}`;
  }

  // 4. Mettre à jour le champ archived localement si modifié (même si forcé à true)
  if (
    typeof archivedFromJSON !== "boolean" ||
    archivedFromJSON !== updated.archived
  ) {
    project.archived = updated.archived;
  }

  // 5. Si archivé au départ → réarchiver
  if (wasArchived) {
    await fetch(repoUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
    });

    // on synchronise la valeur locale car forcée
    project.archived = true;
  }

  return "updated";
};
