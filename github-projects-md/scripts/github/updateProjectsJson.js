import fsSync from "fs";
import fs from "fs/promises";
import ora from "ora";

import { categoryMap } from "../config/categoryMap.js";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { detectStackFromPackageJson } from "../github/detectStack.js";

/**
 * Met à jour le fichier projects.json avec les repos analysés.
 * - Préserve les champs manuels (`stackManual`, `categoryManual`, etc.)
 * - Affiche un message unique par repo : ✔ ou ⚠ selon présence de stack
 */
export const updateProjectsJson = async (repos = []) => {
  let projects = [];

  // Lire l’existant
  if (fsSync.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    projects = JSON.parse(raw);
  }

  for (const repo of repos) {
    const { name, html_url, description, visibility, archived } = repo;

    const spinner = ora(`${name} → analyse stack...`).start();

    let stack = [];
    let warningNoPackage = false;

    try {
      stack = await detectStackFromPackageJson(repo);
      if (!stack.length) warningNoPackage = true;
    } catch {
      warningNoPackage = true;
    }

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

    const message =
      (index !== -1 ? "Mis à jour" : "Ajouté") +
      ` : ${name}` +
      (warningNoPackage ? " / Infos : aucun package.json" : "");

    if (index !== -1) {
      projects[index] = { ...projects[index], ...projectData };
    } else {
      projects.push(projectData);
    }

    warningNoPackage ? spinner.warn(message) : spinner.succeed(message);
  }

  await fs.writeFile(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf8"
  );

  return projects;
};
