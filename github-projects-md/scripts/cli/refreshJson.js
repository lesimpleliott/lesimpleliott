// scripts/cli/refreshJson.js
import "dotenv/config";
import fs from "fs";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { generateProjectsJson } from "../core/generateProjectsJson.js";
import { fetchRepo } from "../github/githubClient.js";
import { blue, formatStatus, grey, red } from "../utils/cliCommon.js";
import { openInEditor } from "../utils/openInEditor.js";
import { askYesNo } from "../utils/promptYesNo.js";

const raw = fs.readFileSync(PROJECTS_JSON_PATH, "utf-8");
const projects = JSON.parse(raw);

// Extraire tous les user/repo à partir des URLs
const repoFullNames = projects
  .map((p) => {
    const match = p.url?.match(/github\.com\/([^/]+\/[^/]+)/);
    return match?.[1] || null;
  })
  .filter(Boolean);

if (!repoFullNames.length) {
  console.error(red("❌ Aucun dépôt valide trouvé dans projects.json."));
  process.exit(1);
}

// console.log("⏳ Mise à jour de tous les projets existants...\n");

try {
  const repos = [];

  for (const fullName of repoFullNames) {
    const repo = await fetchRepo(fullName);
    if (repo) repos.push(repo);
    else console.log(red(`❌ ${fullName} : introuvable ou inaccessible.`));
  }

  if (!repos.length) {
    console.log(red("❌ Aucun dépôt à mettre à jour."));
    process.exit(1);
  }

  const count = await generateProjectsJson(repos, (name, status) =>
    console.log(formatStatus(name, status))
  );

  console.log(blue(`\n📦 Fichier mis à jour avec ${count} projet(s).`));

  const edit = await askYesNo(
    "Souhaitez-vous éditer les données maintenant ? (O/N)"
  );
  if (edit) {
    openInEditor(PROJECTS_JSON_PATH);
  } else {
    console.log(
      grey("✅ Terminé. Vous pouvez éditer manuellement le fichier plus tard.")
    );
  }
} catch (err) {
  console.error(red(`❌ Erreur : ${err.message}`));
  process.exit(1);
}
