import fs from "fs";
import { PROJECTS_JSON_PATH } from "../config/paths.js";

// === Couleurs terminal unifiées
export const green = (txt) => `\u001b[32m${txt}\u001b[0m`;
export const blue = (txt) => `\u001b[36m${txt}\u001b[0m`;
export const orange = (txt) => `\u001b[33m${txt}\u001b[0m`;
export const grey = (txt) => `\u001b[90m${txt}\u001b[0m`;
export const red = (txt) => `\u001b[31m${txt}\u001b[0m`;
export const bold = (txt) => `\u001b[1m${txt}\u001b[0m`;

// === Parse un nom complet "user/repo"
export const parseFullName = (input) => {
  if (!input.includes("/")) throw new Error("Format attendu : user/repo");
  const [owner, repo] = input.split("/");
  if (!owner || !repo) throw new Error("Nom utilisateur ou repo manquant");
  return { owner, repo };
};

// === Charge projects.json
export function loadProjectsJson() {
  try {
    const raw = fs.readFileSync(PROJECTS_JSON_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(red("❌ Impossible de lire le fichier projects.json"));
    process.exit(1);
  }
}

// === Sauvegarde de projects.json
export function saveProjectsJson(projects) {
  fs.writeFileSync(
    PROJECTS_JSON_PATH,
    JSON.stringify(projects, null, 2),
    "utf8"
  );
  console.log(blue("💾 Fichier projects.json mis à jour."));
}

// === Nettoyage de ligne terminal (post-spinner)
export function clearLine() {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
}

// === Recherche d’un projet dans le JSON à partir d’un fullName
export const findProjectInJson = (projects, fullName) =>
  projects.find((p) => p.url?.includes(fullName));

// === Format de message standardisé
export const formatStatus = (name, status) => {
  switch (status) {
    case "new":
      return green(`✔ Ajouté : ${name}`);
    case "updated":
      return orange(`✔ Mis à jour : ${name}`);
    case "unchanged":
      return grey(`ℹ Inchangé : ${name}`);
    case "ignored":
      return red(`🔒 ${name} : Accès refusé`);
    default:
      return red(`❌ ${name} : Erreur`);
  }
};
