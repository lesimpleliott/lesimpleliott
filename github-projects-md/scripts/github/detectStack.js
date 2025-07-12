import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

/**
 * Détermine une stack approximative à partir du fichier package.json
 */
const token = process.env.GITHUB_TOKEN;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
};

export const detectStackFromPackageJson = async (repo) => {
  const { full_name } = repo;
  const url = `https://api.github.com/repos/${full_name}/contents/package.json`;

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 404) return []; // Pas de package.json
      throw new Error(`Erreur API GitHub (${res.status})`);
    }

    const data = await res.json();

    const decoded = Buffer.from(data.content, "base64").toString("utf8");
    const pkg = JSON.parse(decoded);

    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const stack = [];

    for (const dep of Object.keys(deps)) {
      if (dep.includes("react")) stack.push("React");
      if (dep.includes("next")) stack.push("Next.js");
      if (dep.includes("tailwind")) stack.push("Tailwind CSS");
      if (dep.includes("vite")) stack.push("Vite");
      if (dep.includes("typescript")) stack.push("TypeScript");
      if (dep.includes("eslint")) stack.push("ESLint");
      if (dep.includes("jest")) stack.push("Jest");
      if (dep.includes("express")) stack.push("Express");
      if (dep.includes("electron")) stack.push("Electron");
    }

    return [...new Set(stack)];
  } catch (err) {
    console.warn(
      `⚠️ ${repo.name} : impossible d’analyser le package.json → ${err.message}`
    );
    return [];
  }
};
