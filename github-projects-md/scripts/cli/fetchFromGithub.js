import "dotenv/config";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { generateProjectsJson } from "../core/generateProjectsJson.js";
import { fetchAllRepos, fetchRepo } from "../github/githubClient.js";
import { blue, formatStatus, grey, red } from "../utils/cliCommon.js";
import { openInEditor } from "../utils/openInEditor.js";
import { askYesNo } from "../utils/promptYesNo.js";

// === Paramètres CLI
const args = process.argv.slice(2);
const target = args[0];

if (!target) {
  console.error(
    red(
      "❌ Merci d’indiquer un compte ou un repo GitHub (ex: user ou user/repo)"
    )
  );
  process.exit(1);
}

try {
  let repos = [];

  if (target.includes("/")) {
    // Repo unique
    const repo = await fetchRepo(target);
    if (repo) repos.push(repo);
  } else {
    // Tous les repos d’un utilisateur
    repos = await fetchAllRepos(target);
  }

  if (!repos.length) {
    console.log(red("❌ Aucun dépôt trouvé."));
    process.exit(1);
  }

  // Fonction de log utilisée dans generateProjectsJson
  const logStatus = (name, status) => console.log(formatStatus(name, status));

  const count = await generateProjectsJson(repos, logStatus);
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
