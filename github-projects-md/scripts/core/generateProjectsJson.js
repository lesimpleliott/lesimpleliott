// scripts/core/generateProjectsJson.js
import fsSync from "fs";
import fs from "fs/promises";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";

import { categoryMap } from "../config/categoryMap.js";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { buildStackProfile } from "./generateStackData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Génère un fichier projects.json enrichi à partir d'une liste de repos GitHub
 * @param {Array<Object>} repos - Liste des repos GitHub à traiter
 * @returns {number} - Nombre d’entrées mises à jour ou ajoutées
 */
export const generateProjectsJson = async (repos = []) => {
  let projects = [];

  if (fsSync.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    projects = JSON.parse(raw);
  }

  let updatedCount = 0;

  for (const repo of repos) {
    const { name, html_url, description, visibility, archived } = repo;

    const spinner = ora(`${name} → analyse stack...`).start();

    try {
      const { mainStack, secondaryStack } = await buildStackProfile(
        repo.full_name
      );

      const fullStack = [...mainStack, ...secondaryStack].map((s) =>
        s.toLowerCase()
      );

      const index = projects.findIndex((p) => p.name === name);
      const existing = projects[index];
      const stackManual = existing?.stackManual || [""];

      const prefix = name.match(/^([A-Z]+)_/)?.[1] || "default";
      const category = categoryMap[prefix] || categoryMap.default;

      const newData = {
        name,
        url: html_url,
        description: description || "",
        lastUpdate: repo.updated_at?.slice(0, 10) || null,
        visibility,
        archived,
        stack: fullStack,
        stackManual,
        category,
        categoryManual: existing?.categoryManual || category,
        previewUrl: existing?.previewUrl || "",
        websiteUrl: existing?.websiteUrl || "",
      };

      let status = "new"; // "new", "updated", "unchanged"

      if (existing) {
        const stringifiedOld = JSON.stringify(existing, null, 2);
        const stringifiedNew = JSON.stringify(
          { ...existing, ...newData },
          null,
          2
        );

        if (stringifiedOld === stringifiedNew) {
          status = "unchanged";
        } else {
          projects[index] = { ...existing, ...newData };
          status = "updated";
        }
      } else {
        projects.push(newData);
      }

      updatedCount++;

      // === Couleurs console
      const green = (txt) => `\u001b[32m${txt}\u001b[0m`;
      const blue = (txt) => `\u001b[36m${txt}\u001b[0m`;
      const orange = (txt) => `\u001b[33m${txt}\u001b[0m`;

      let finalMsg = "";

      if (status === "new") {
        finalMsg = green(`✔ Ajouté : ${name}`);
      } else if (status === "updated") {
        finalMsg = orange(`✔ Mise à jour : ${name}`);
      } else {
        finalMsg = blue(`ℹ Inchangé : ${name}`);
      }

      spinner.stop();
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(finalMsg);
    } catch (err) {
      spinner.fail(`❌ ${name} : erreur d’analyse → ${err.message}`);
    }
  }

  await fs.writeFile(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf8"
  );

  return updatedCount;
};
