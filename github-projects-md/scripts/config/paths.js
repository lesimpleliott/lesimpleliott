import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Simule __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Racine du projet : /lesimpleliott/github-projects-md
const rootDir = path.resolve(__dirname, "../../");

// Chemin vers le fichier JSON de sortie
export const PROJECTS_JSON_PATH = path.join(rootDir, "data", "projects.json");
