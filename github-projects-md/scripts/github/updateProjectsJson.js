import fsSync from "fs";
import fs from "fs/promises";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";

import { categoryMap } from "../config/categoryMap.js";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { detectStackFromPackageJson } from "../github/detectStack.js";

// Charger stackRules depuis JSON manuellement
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stackRulesPath = path.join(__dirname, "../config/stackRules.json");
const rawRules = await fs.readFile(stackRulesPath, "utf8");
const stackRules = JSON.parse(rawRules);
const primaryStacks = stackRules.primaryStacks;

/**
 * Met à jour le fichier projects.json avec les repos analysés.
 * - "stack" est toujours mis à jour avec la stack complète détectée (raw)
 * - "stackManual" est initialisé uniquement à l'ajout (basé sur stackRules)
 * - "stack" filtre les dépendances ignorées selon les règles primaires détectées
 */

export const updateProjectsJson = async (repos = []) => {
  let projects = [];

  // Lire l’existant
  if (fsSync.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    projects = JSON.parse(raw);
  }

  let updatedCount = 0;

  for (const repo of repos) {
    const { name, html_url, description, visibility, archived } = repo;

    const spinner = ora(`${name} → analyse stack...`).start();

    let stack = [];
    let stackManual = [];
    let warningNoPackage = false;

    try {
      const {
        stack: stackRaw,
        fullStack,
        hasPackageJson,
      } = await detectStackFromPackageJson(repo);

      const allIgnored = new Set();
      fullStack.primary.forEach((label) => {
        const rule = primaryStacks.find((r) => r.label === label);
        if (rule) rule.ignore.forEach((i) => allIgnored.add(i.toLowerCase()));
      });

      stack = stackRaw.filter((dep) => !allIgnored.has(dep.toLowerCase()));

      if (!hasPackageJson) warningNoPackage = true;

      const index = projects.findIndex((p) => p.name === name);
      const existing = projects[index];

      if (existing) {
        stackManual = existing.stackManual || [];
      } else {
        const labelsToIgnore = new Set();

        fullStack.primary.forEach((label) => {
          const rule = primaryStacks.find((r) => r.label === label);
          if (rule?.ignore) {
            rule.ignore.forEach((ignoredDep) => {
              const ignoredRule = primaryStacks.find((r) =>
                r.match.includes(ignoredDep)
              );
              if (ignoredRule) labelsToIgnore.add(ignoredRule.label);
            });
          }
        });

        stackManual = [
          ...fullStack.primary.filter((label) => !labelsToIgnore.has(label)),
          ...fullStack.secondary,
        ];
      }

      const prefix = name.match(/^([A-Z]+)_/)?.[1] || "default";
      const category = categoryMap[prefix] || categoryMap.default;

      const projectData = {
        name,
        url: html_url,
        description: description || "",
        visibility,
        archived,
        stack,
        stackManual,
        category,
        categoryManual: existing ? existing.categoryManual : category,
        previewUrl: existing?.previewUrl || "",
        websiteUrl: existing?.websiteUrl || "",
      };

      if (existing) {
        projects[index] = { ...projects[index], ...projectData };
      } else {
        projects.push(projectData);
      }

      updatedCount++;

      const baseMsg = `${existing ? "Mis à jour" : "Ajouté"} : ${name}`;
      let finalMsg = `✔ ${baseMsg}`;
      if (warningNoPackage) {
        finalMsg = `\u001b[33m⚠ ${baseMsg} / Infos : aucun package.json\u001b[0m`;
      } else if (!existing) {
        finalMsg = `\u001b[32m✔ ${baseMsg}\u001b[0m`; // Ajouté = vert
      }
      // Sinon, garder blanc par défaut (console.log gère bien ça)

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
