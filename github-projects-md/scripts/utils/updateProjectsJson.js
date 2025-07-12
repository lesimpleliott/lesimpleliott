import fsSync from "fs";
import fs from "fs/promises";
import ora from "ora";

import { categoryMap } from "../config/defaults.js";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { detectStackFromPackageJson } from "./detectStack.js";

/**
 * Met à jour le fichier projects.json avec les repos analysés
 */
export const updateProjectsJson = async (repos = []) => {
  let projects = [];

  // Lecture de l'existant
  if (fsSync.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    projects = JSON.parse(raw);
  }

  for (const repo of repos) {
    const { name, html_url, description, visibility, archived, full_name } =
      repo;

    const spinner = ora(`${name} → analyse package.json...`).start();

    try {
      const stack = await detectStackFromPackageJson(repo);

      const prefix = name.match(/^([A-Z]+)_/)?.[1] || "default";
      const category = categoryMap[prefix] || categoryMap.default;

      const index = projects.findIndex((p) => p.name === name);
      const existing = projects[index];

      const projectData = {
        name,
        url: html_url,
        description: description || "",
        visibility,
        archived,
        stack,
        stackManual: existing?.stackManual || [...stack],
        category,
        categoryManual: existing?.categoryManual || category,
        previewUrl: existing?.previewUrl || "",
        websiteUrl: existing?.websiteUrl || "",
      };

      if (index !== -1) {
        projects[index] = { ...projects[index], ...projectData };
        spinner.succeed(`Mis à jour : ${name}`);
      } else {
        projects.push(projectData);
        spinner.succeed(`Ajouté : ${name}`);
      }
    } catch (err) {
      spinner.fail(`${name} : ${err.message}`);
    }
  }

  await fs.writeFile(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf8"
  );
  return projects;
};
