const fs = require("fs");
const path = require("path");
const badgeMap = require("./getBadgeMap");

const stackOrder = Object.keys(badgeMap); // ordre unique ici

const getAllFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.extname(d.name).toLowerCase());

const detectStack = (pkg, files) => {
  const detected = new Set();
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const depKeys = Object.keys(deps || {}).map((d) => d.toLowerCase());

  // Extensions
  const hasTS = files.includes(".ts") || files.includes(".tsx");
  const hasJS = files.includes(".js") || files.includes(".jsx");
  const hasSASS = files.includes(".sass");
  const hasSCSS = files.includes(".scss");
  const hasCSS = files.includes(".css");

  // Détection spécifiques
  const hasNext = depKeys.some((d) => d.includes("next"));
  const hasReact = depKeys.some((d) => d.includes("react"));

  if (hasNext) detected.add("next");
  else if (hasReact) detected.add("react");

  if (!hasNext && !hasReact && hasJS) detected.add("javascript");
  if (hasTS) detected.add("typescript");

  if (hasSASS) detected.add("sass");
  else if (hasSCSS) detected.add("scss");
  else if (hasCSS) detected.add("css");

  // Détection générique sur les autres stacks
  stackOrder.forEach((key) => {
    if (
      [
        "next",
        "react",
        "javascript",
        "typescript",
        "css",
        "scss",
        "sass",
      ].includes(key)
    )
      return;
    if (depKeys.some((d) => d.includes(key.toLowerCase()))) {
      detected.add(key);
    }
  });

  return stackOrder
    .filter((key) => detected.has(key))
    .map((key) => badgeMap[key])
    .join(" ");
};

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

module.exports = {
  getAllFiles,
  detectStack,
  slugify,
};
