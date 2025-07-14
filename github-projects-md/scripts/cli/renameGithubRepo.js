import "dotenv/config";
import fs from "fs";
import ora from "ora";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { updateRepoData } from "../github/githubClient.js";
import {
  blue,
  green,
  grey,
  loadProjectsJson,
  red,
} from "../utils/cliCommon.js";

const args = process.argv.slice(2);
const target = args[0];

const formatRenameStatus = (name, status) => {
  switch (status) {
    case "ignored":
      return red(`🔒 ${name} : accès refusé ou repo privé.`);
    case "unchanged":
      return grey(`ℹ ${name} : aucune modification.`);
    case "updated":
      return green(`✔ ${name} : mis à jour avec succès.`);
    case "error":
    default:
      return red(`❌ ${name} : erreur inconnue ou accès refusé.`);
  }
};

const run = async () => {
  const allProjects = await loadProjectsJson();

  const projectsToProcess = target
    ? allProjects.filter((p) => p.url?.includes(target))
    : allProjects;

  if (!projectsToProcess.length) {
    console.log(red("❌ Aucun projet correspondant trouvé dans projects.json"));
    process.exit(1);
  }

  for (const project of projectsToProcess) {
    if (!project.url || !project.name) continue;

    const spinner = ora(`${project.name} : vérification...`).start();

    try {
      const status = await updateRepoData(project);

      spinner.stop();
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(formatRenameStatus(project.name, status));
    } catch (err) {
      spinner.stop();
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(red(`❌ ${project.name} : ${err.message}`));
    }
  }

  fs.writeFileSync(
    PROJECTS_JSON_PATH,
    JSON.stringify(allProjects, null, 2),
    "utf-8"
  );

  console.log(
    blue(`\n💾 Repo GitHub et projects.json mis à jour avec les nouveaux noms.`)
  );
};

run();
