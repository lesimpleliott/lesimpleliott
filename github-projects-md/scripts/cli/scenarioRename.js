// scripts/scenario/scenarioRename.js
import dotenv from "dotenv";
import fs from "fs";
import ora from "ora";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { updateRepoData } from "../github/githubClient.js";

dotenv.config();

const raw = fs.readFileSync(PROJECTS_JSON_PATH, "utf-8");
const projects = JSON.parse(raw);

const run = async () => {
  for (const project of projects) {
    if (!project.url || !project.name) continue;

    const spinner = ora(`${project.name} : mise à jour en cours...`).start();

    try {
      const status = await updateRepoData(project);

      switch (status) {
        case "ignored":
          spinner.info(`🔒 ${project.name} : accès refusé ou repo privé.`);
          break;
        case "unchanged":
          spinner.info(`${project.name} : aucune modification.`);
          break;
        case "updated":
          spinner.succeed(`${project.name} : mis à jour avec succès.`);
          break;
        case "error":
        default:
          spinner.fail(`${project.name} : erreur inconnue ou accès refusé.`);
      }
    } catch (err) {
      spinner.fail(`${project.name} : ${err.message}`);
    }
  }

  fs.writeFileSync(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf-8"
  );
  console.log("💾 Github mis à jour.");
};

run();
