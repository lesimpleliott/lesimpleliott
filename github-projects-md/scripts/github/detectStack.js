import dotenv from "dotenv";
import fs from "fs/promises";
import fetch from "node-fetch";
dotenv.config();

const token = process.env.GITHUB_TOKEN;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
};

let stackRules;
const loadStackRules = async () => {
  if (!stackRules) {
    const raw = await fs.readFile("scripts/config/stackRules.json", "utf8");
    stackRules = JSON.parse(raw);
  }
  return stackRules;
};

const applyStackRules = async (deps) => {
  const { primaryStacks, secondaryStacks } = await loadStackRules();
  const detected = Object.keys(deps).map((d) => d.toLowerCase());

  const primary = [];
  const matched = new Set();
  const ignored = new Set();

  // Appliquer les règles primaires
  for (const rule of primaryStacks) {
    const isMatch = rule.match.some((term) => detected.includes(term));
    if (isMatch) {
      primary.push(rule.label);
      rule.match.forEach((m) => matched.add(m.toLowerCase()));
      rule.ignore.forEach((i) => ignored.add(i.toLowerCase()));
    }
  }

  // Supprimer tous les deps ignorés ou déjà matchés
  const remaining = detected.filter(
    (dep) => !ignored.has(dep) && !matched.has(dep)
  );

  const secondary = [];
  for (const [_, depsList] of Object.entries(secondaryStacks)) {
    for (const dep of depsList) {
      if (remaining.includes(dep.toLowerCase())) {
        secondary.push(dep);
      }
    }
  }

  return { primary, secondary };
};

/**
 * Détermine une stack approximative à partir de tous les package.json d'un repo
 */
export const detectStackFromPackageJson = async (repo) => {
  const { full_name, default_branch } = repo;
  const treeUrl = `https://api.github.com/repos/${full_name}/git/trees/${default_branch}?recursive=1`;

  try {
    const treeRes = await fetch(treeUrl, { headers });
    if (!treeRes.ok)
      throw new Error(`Erreur chargement arbre Git (${treeRes.status})`);

    const treeData = await treeRes.json();
    const pkgFiles = treeData.tree.filter(
      (item) =>
        item.path.endsWith("package.json") &&
        item.type === "blob" &&
        !item.path.includes("node_modules/")
    );

    const hasPackageJson = pkgFiles.length > 0;
    // console.log(
    //   "📁 Fichiers package.json trouvés :",
    //   pkgFiles.map((f) => f.path)
    // );

    if (!hasPackageJson)
      return {
        stack: [],
        stackRaw: [],
        fullStack: { primary: [], secondary: [] },
        hasPackageJson: false,
      };

    const deps = {};

    for (const file of pkgFiles) {
      const blobUrl = `https://api.github.com/repos/${full_name}/git/blobs/${file.sha}`;
      const blobRes = await fetch(blobUrl, { headers });
      if (!blobRes.ok) continue;

      const blob = await blobRes.json();
      const decoded = Buffer.from(blob.content, "base64").toString("utf8");

      // console.log(`📄 Contenu de ${file.path} :\n`, decoded);

      try {
        const pkg = JSON.parse(decoded);
        Object.assign(deps, pkg.dependencies || {}, pkg.devDependencies || {});
      } catch (e) {
        console.warn(`❌ Erreur de parsing package.json (${file.path})`);
      }
    }

    const { primary, secondary } = await applyStackRules(deps);
    const fullRawDeps = Object.keys(deps);
    // console.log(
    //   `📆 Stack détectée pour ${repo.name} : ${[...primary, ...secondary].join(
    //     ", "
    //   )}`
    // );

    return {
      stack: fullRawDeps, // toute la stack trouvée, brute
      stackRaw: fullRawDeps,
      fullStack: { primary, secondary },
      hasPackageJson: true,
    };
  } catch (err) {
    console.warn(
      `⚠️ ${repo.name} : impossible d’analyser les package.json → ${err.message}`
    );
    return {
      stack: [],
      stackRaw: [],
      fullStack: { primary: [], secondary: [] },
      hasPackageJson: false,
    };
  }
};
