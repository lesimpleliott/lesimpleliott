const fs = require("fs");
const path = require("path");
const categories = require("./getCategories");
const { getAllFiles, detectStack } = require("./utils");
const generateSummary = require("./generateSummary");
const generateDetails = require("./generateDetails");

const reposPath = "/Users/lesimpleliott/Desktop/gitClean/fullRepo";
const outputFile = path.resolve(__dirname, "../output/projects.md");

const projects = [];

fs.readdirSync(reposPath).forEach((repoName) => {
  const repoDir = path.join(reposPath, repoName);
  if (!fs.statSync(repoDir).isDirectory()) return;

  const pkgPath = path.join(repoDir, "package.json");
  const readmePath = path.join(repoDir, "README.md");

  let description = "";
  let stack = "";
  let url = `https://github.com/lesimpleliott/${repoName}`;

  try {
    const pkg = fs.existsSync(pkgPath)
      ? JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      : {};

    description =
      pkg.description ||
      (fs.existsSync(readmePath)
        ? fs.readFileSync(readmePath, "utf8").split("\n")[1]?.trim() || ""
        : "");

    const files = getAllFiles(repoDir);
    stack = detectStack(pkg, files);
  } catch (e) {
    console.warn(`⚠️ Erreur dans ${repoName} :`, e.message);
  }

  const prefix =
    Object.keys(categories).find((p) => repoName.startsWith(p + "_")) ||
    "default";

  projects.push({ repoName, description, stack, url, prefix });
});

const grouped = Object.keys(categories).reduce((acc, key) => {
  acc[key] = [];
  return acc;
}, {});

projects.forEach((p) => {
  grouped[p.prefix].push(p);
});

const content = `${generateSummary(
  grouped
)}\n\n---\n## 🚀 Liste détaillée des projets\n\n${generateDetails(grouped)}`;

fs.writeFileSync(outputFile, content);
console.log(`✅ Fichier Markdown généré : ${outputFile}`);
