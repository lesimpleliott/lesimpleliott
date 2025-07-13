import "dotenv/config";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { fetchAllRepos, fetchRepo } from "../github/githubClient.js";
import { updateProjectsJson } from "../github/updateProjectsJson.js";
import { openInEditor } from "../utils/openInEditor.js";
import { askYesNo } from "../utils/promptYesNo.js";

const args = process.argv.slice(2);
const target = args[0];

if (!target) {
  console.error(
    "❌ Merci d’indiquer un compte ou un repo GitHub (ex: user ou user/repo)"
  );
  process.exit(1);
}

try {
  let repos = [];

  if (target.includes("/")) {
    const repo = await fetchRepo(target);
    if (repo) repos.push(repo);
  } else {
    repos = await fetchAllRepos(target);
  }

  if (!repos.length) {
    console.log("❌ Aucun dépôt trouvé.");
    process.exit(1);
  }

  const projects = await updateProjectsJson(repos);

  console.log(`\n📦 projects.json mis à jour avec ${projects.length} entrées.`);

  const edit = await askYesNo(
    "Souhaitez-vous éditer les données maintenant ? (O/N)"
  );
  if (edit) {
    openInEditor(PROJECTS_JSON_PATH);
  } else {
    console.log(
      "✅ Terminé. Vous pouvez éditer manuellement le fichier plus tard."
    );
  }
} catch (err) {
  console.error(`❌ Erreur : ${err.message}`);
  process.exit(1);
}
