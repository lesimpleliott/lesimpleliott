import "dotenv/config";
import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { PROJECTS_JSON_PATH } from "../config/paths.js";
import { generateDetails } from "./generateDetails.js";
import { generateSummary } from "./generateSummary.js";

// Définition des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.resolve(__dirname, "../../");
const BASE_TEMPLATE = path.join(ROOT, "templates", "base.md");
const FINAL_README = path.join(ROOT, "..", "README.md");

const writeReadme = async () => {
  try {
    // console.log("📄 Lecture des projets...");
    const raw = await fs.readFile(PROJECTS_JSON_PATH, "utf8");
    const projects = JSON.parse(raw);

    if (!Array.isArray(projects)) {
      throw new Error("Le fichier projects.json doit contenir un tableau.");
    }

    console.log(`📁 ${projects.length} projets détectés`);
    const summary = generateSummary(projects);
    const details = generateDetails(projects);

    // console.log("🧩 Lecture du template...");
    let base = await fs.readFile(BASE_TEMPLATE, "utf8");

    base = base
      .replace("<!-- SOMMAIRE -->", summary)
      .replace("<!-- DETAILS -->", details);

    await fs.writeFile(FINAL_README, base, "utf8");
    console.log(`✅ README.md généré → file://${FINAL_README}`);
  } catch (err) {
    console.error("❌ Erreur lors de la génération du README :", err.message);
  }
};

await writeReadme();
