import fs from "fs";
import path from "path";
import { badgeMap } from "../config/badgeMap.js";
import { getAllFiles } from "./getAllFiles.js";

const stackOrder = Object.keys(badgeMap);

/**
 * Détecte les technos utilisées dans un repo local avec priorités :
 * - Next JS > React
 * - TypeScript > JavaScript
 * - Tailwind CSS > Styled Components > SASS > SCSS > CSS
 * @param {string} repoPath
 * @returns {string} badges markdown
 */
export const detectStack = (repoPath) => {
  const detected = new Set();
  const files = getAllFiles(repoPath);

  const pkgPath = path.join(repoPath, "package.json");
  const pkg =
    fs.existsSync(pkgPath) && fs.statSync(pkgPath).isFile()
      ? JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      : {};

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const depKeys = Object.keys(deps || {}).map((d) => d.toLowerCase());

  // --- Frameworks JS ---
  const hasNext = depKeys.includes("next");
  const hasReact = depKeys.includes("react");

  if (hasNext) detected.add("Next JS");
  else if (hasReact) detected.add("React");

  // --- Langages ---
  const hasTS = files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const hasJS = files.some((f) => f.endsWith(".js") || f.endsWith(".jsx"));

  if (hasTS) detected.add("TypeScript");
  else if (hasJS) detected.add("JavaScript");

  // --- CSS / Preprocessors ---
  if (depKeys.includes("tailwindcss")) {
    detected.add("Tailwind CSS");
  } else if (depKeys.includes("styled-components")) {
    detected.add("Styled Components");
  } else if (files.some((f) => f.endsWith(".sass"))) {
    detected.add("SASS");
  } else if (files.some((f) => f.endsWith(".scss"))) {
    detected.add("SCSS");
  } else if (files.some((f) => f.endsWith(".css"))) {
    detected.add("CSS");
  }

  // --- Autres technos définies dans badgeMap ---
  stackOrder.forEach((key) => {
    if (
      [
        "Next JS",
        "React",
        "TypeScript",
        "JavaScript",
        "Tailwind CSS",
        "Styled Components",
        "SASS",
        "SCSS",
        "CSS",
      ].includes(key)
    )
      return;

    const normalizedKey = key.toLowerCase().replace(/ /g, "");
    if (depKeys.some((d) => d.includes(normalizedKey))) {
      detected.add(key);
    }
  });

  return stackOrder
    .filter((key) => detected.has(key))
    .map((key) => badgeMap[key])
    .join(" ");
};
