import fs from "fs";
import path from "path";

/**
 * Récupère toutes les extensions de fichiers dans un dossier (non récursif)
 * @param {string} dir - Dossier à analyser
 * @returns {string[]} Liste des extensions trouvées (ex: ['.js', '.ts'])
 */
export const getAllFiles = (dir) => {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.extname(entry.name).toLowerCase());
};
