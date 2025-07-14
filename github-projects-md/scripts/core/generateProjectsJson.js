// scripts/core/generateProjectsJson.js
import fsSync from "fs";
import fs from "fs/promises";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { fetchLastCommitDate } from "../github/githubClient.js";
import { buildStackProfile } from "./generateStackData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const categoryMapPath = path.join(__dirname, "../config/categoryMap.json");
const rawCategoryMap = await fs.readFile(categoryMapPath, "utf8");
const categoryMap = JSON.parse(rawCategoryMap);

/**
 * Charge les projets existants (si le fichier existe)
 */
const getExistingProjects = async () => {
  if (fsSync.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    return JSON.parse(raw);
  }
  return [];
};

/**
 * Détecte automatiquement la catégorie à partir du préfixe ou du propriétaire
 */
const resolveCategory = (repo) => {
  const prefix = repo.name.match(/^([A-Z]+)_/)?.[1] || "default";
  const prefixMatch = categoryMap.find((c) => c.prefix === prefix);
  let category = prefixMatch?.id;

  if (!category) {
    const isSameUser = repo.owner?.login === process.env.GITHUB_USERNAME;
    if (isSameUser) {
      category = "perso";
    } else if (repo.owner?.login) {
      category = "pro";
    } else {
      category = "default";
    }
  }

  return category;
};

/**
 * Construit le tableau stack à partir du repo GitHub (main + secondary)
 */
const resolveStack = async (repoFullName) => {
  const { mainStack, secondaryStack } = await buildStackProfile(repoFullName);
  return [...mainStack, ...secondaryStack];
};

/**
 * Retourne une ligne de log colorée en fonction du statut
 */
const formatLogStatus = (name, status) => {
  const green = (txt) => `\u001b[32m${txt}\u001b[0m`;
  const blue = (txt) => `\u001b[36m${txt}\u001b[0m`;
  const orange = (txt) => `\u001b[33m${txt}\u001b[0m`;

  if (status === "new") return green(`✔ Ajouté : ${name}`);
  if (status === "updated") return orange(`✔ Mise à jour : ${name}`);
  return blue(`ℹ Inchangé : ${name}`);
};

/**
 * Génère un fichier projects.json enrichi à partir d'une liste de repos GitHub
 */
export const generateProjectsJson = async (repos = []) => {
  let projects = await getExistingProjects();
  let updatedCount = 0;

  for (const repo of repos) {
    const spinner = ora(`${repo.name} → analyse stack...`).start();

    try {
      const fullStack = await resolveStack(repo.full_name);
      const index = projects.findIndex((p) => p.name === repo.name);
      const existing = projects[index];
      const category = resolveCategory(repo);

      const newData = {
        name: repo.name,
        url: repo.html_url,
        description: repo.description || "",
        lastUpdate: await fetchLastCommitDate(repo.full_name),
        visibility: repo.visibility,
        archived: repo.archived,
        stack: fullStack,
        stackManual: existing?.stackManual || [""],
        category,
        categoryManual: existing?.categoryManual || category,
        previewUrl: existing?.previewUrl || "",
        websiteUrl: existing?.websiteUrl || "",
      };

      let status = "new";
      if (existing) {
        const oldData = JSON.stringify(existing, null, 2);
        const newMerged = JSON.stringify({ ...existing, ...newData }, null, 2);
        if (oldData === newMerged) {
          status = "unchanged";
        } else {
          projects[index] = { ...existing, ...newData };
          status = "updated";
        }
      } else {
        projects.push(newData);
      }

      updatedCount++;
      spinner.stop();
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(formatLogStatus(repo.name, status));
    } catch (err) {
      spinner.fail(`❌ ${repo.name} : erreur d’analyse → ${err.message}`);
    }
  }

  await fs.writeFile(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf8"
  );

  return updatedCount;
};
