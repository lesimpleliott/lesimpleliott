import fs from "fs";
import fsPromises from "fs/promises";
import ora from "ora";
import os from "os";
import path from "path";
import simpleGit from "simple-git";
import { categoryMap } from "../config/defaults.js";
import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { detectStack } from "../utils/detectStack.js";

const token = process.env.GITHUB_TOKEN;
const headers = {
  Authorization: `Bearer ${token}`,
  "User-Agent": "github-projects-md",
};

/**
 * Requête à l'API GitHub
 */
const fetchFromGitHub = async (url) => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
};

/**
 * Récupère les repos accessibles (si `target` est un user)
 */
const fetchUserRepos = async (user) => {
  // On récupère tous les repos accessibles par le token
  const url = `https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member`;
  const allRepos = await fetchFromGitHub(url);

  // On filtre ceux appartenant à l’utilisateur demandé
  return allRepos.filter(
    (repo) => repo.owner?.login?.toLowerCase() === user.toLowerCase()
  );
};

/**
 * Récupère un seul repo (si `target` est un user/repo)
 */
const fetchSingleRepo = async (fullName) => {
  const url = `https://api.github.com/repos/${fullName}`;
  return fetchFromGitHub(url);
};

/**
 * Clone un repo dans un dossier temporaire et détecte sa stack
 */
const cloneAndDetectStack = async (html_url, name) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `repo-${name}-`));
  const git = simpleGit();
  await git.clone(html_url, tmpDir, ["--depth", "1"]);
  return detectStack(tmpDir);
};

/**
 * Met à jour le fichier projects.json avec les repos analysés
 */
const updateProjectsJson = async (repos) => {
  let projects = [];

  if (fs.existsSync(PROJECTS_JSON_PATH)) {
    const raw = await fsPromises.readFile(PROJECTS_JSON_PATH, "utf8");
    projects = JSON.parse(raw);
  }

  for (const repo of repos) {
    const { name, html_url, description, visibility, archived } = repo;
    const spinner = ora(`${name} → analyse en cours...`).start();

    try {
      const stackBadges = await cloneAndDetectStack(html_url, name);
      const stackKeys =
        [
          ...new Set(
            stackBadges
              .match(/\[(.*?)\]/g)
              ?.map((s) => s.replace(/[\[\]]/g, ""))
          ),
        ] || [];

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
        stack: stackKeys,
        stackManual: existing?.stackManual || [...stackKeys], // ⚠️ NE PAS RÉÉCRASER
        category,
        categoryManual: existing?.categoryManual || category, // ⚠️ NE PAS RÉÉCRASER
        previewUrl: existing?.previewUrl || "",
        websiteUrl: existing?.websiteUrl || "",
      };

      if (index !== -1) {
        projects[index] = { ...projects[index], ...projectData };
        spinner.succeed(`🔄 Mis à jour : ${name}`);
      } else {
        projects.push(projectData);
        spinner.succeed(`✅ Ajouté : ${name}`);
      }
    } catch (err) {
      spinner.fail(`❌ ${name} : ${err.message}`);
    }
  }

  await fsPromises.writeFile(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2)
  );
  console.log(`\n📦 projects.json mis à jour avec ${repos.length} entrées.`);
};

/**
 * Entrée principale
 * @param {Object} options
 * @param {string} options.target - "user" ou "user/repo"
 */
export const fetchRepos = async ({ target }) => {
  if (!target) throw new Error("❌ Aucun utilisateur ou repo spécifié");

  let repos = [];

  if (target.includes("/")) {
    const repo = await fetchSingleRepo(target);
    repos.push(repo);
  } else {
    repos = await fetchUserRepos(target);
  }

  await updateProjectsJson(repos);
};
