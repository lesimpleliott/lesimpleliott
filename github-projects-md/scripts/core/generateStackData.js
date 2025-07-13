import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { detectFromPackageJson } from "../github/detectFromPackageJson.js";
import { detectFromRepoFiles } from "../github/detectFromRepoFiles.js";
import { fetchRepo } from "../github/githubClient.js";

let stackRules = null;

/**
 * Charge stackRules.json une seule fois
 */
const loadStackRules = async () => {
  if (stackRules) return stackRules;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rulesPath = path.join(__dirname, "../config/stackRules.json");
  const raw = await fs.readFile(rulesPath, "utf8");
  stackRules = JSON.parse(raw);
  return stackRules;
};

/**
 * Applique les stackRules sur un tableau de termes (dépendances ou extensions)
 * @param {string[]} rawStack
 * @returns {{ full: string[], mainStack: string[], secondaryStack: string[] }}
 */
const analyzeStack = async (rawStack) => {
  const { primaryStacks, secondaryStacks } = await loadStackRules();

  const detected = rawStack.map((s) => s.toLowerCase());
  const matchedLabels = new Set();
  const matchedTerms = new Set();
  const ignoredTerms = new Set();

  // === Analyse Primary ===
  for (const rule of primaryStacks) {
    const matchTerms = [...(rule.match || []), ...(rule.matchExt || [])];
    const hasMatch = matchTerms.some((term) =>
      detected.some((detectedTerm) => detectedTerm.includes(term))
    );

    if (hasMatch) {
      matchedLabels.add(rule.label);
      matchTerms.forEach((term) => matchedTerms.add(term.toLowerCase()));
      (rule.ignore || []).forEach((term) =>
        ignoredTerms.add(term.toLowerCase())
      );
    }
  }

  for (const rule of primaryStacks) {
    const matchTerms = [...(rule.match || []), ...(rule.matchExt || [])];
    const hasMatch = matchTerms.some((term) => matchedTerms.has(term));
    if (!hasMatch) continue;

    for (const ignored of rule.ignore || []) {
      const ignoredRule = primaryStacks.find((r) =>
        [...(r.match || []), ...(r.matchExt || [])].includes(ignored)
      );
      if (ignoredRule) {
        matchedLabels.delete(ignoredRule.label);
      }
    }
  }

  // === Analyse Secondary ===
  const remainingTerms = detected.filter(
    (term) => !matchedTerms.has(term) && !ignoredTerms.has(term)
  );

  const secondaryOrderedLabels = [];

  for (const group of Object.values(secondaryStacks)) {
    for (const rule of group) {
      const hasMatch = (rule.match || []).some((term) =>
        remainingTerms.some((detectedTerm) => detectedTerm.includes(term))
      );
      if (hasMatch) {
        secondaryOrderedLabels.push(rule.label);
      }
    }
  }

  return {
    full: detected,
    mainStack: [...matchedLabels].sort((a, b) => {
      const order = primaryStacks.map((r) => r.label);
      return order.indexOf(a) - order.indexOf(b);
    }),
    secondaryStack: secondaryOrderedLabels,
  };
};

/**
 * Construit le profil de stack pour un repo
 * @param {string} fullName - ex: "user/repo"
 * @returns {{
 *   deps: string[],
 *   exts: string[],
 *   full: string[],
 *   mainStack: string[],
 *   secondaryStack: string[],
 *   hasPackageJson: boolean
 * }}
 */
export const buildStackProfile = async (fullName) => {
  const repo = await fetchRepo(fullName);
  if (!repo?.full_name || !repo?.default_branch) {
    throw new Error(`Réponse GitHub invalide pour ${fullName}`);
  }

  const deps = await detectFromPackageJson(repo);
  const exts = await detectFromRepoFiles(repo);
  const combined = [...new Set([...deps, ...exts])];

  const { full, mainStack, secondaryStack } = await analyzeStack(combined);

  return {
    deps,
    exts,
    full,
    mainStack,
    secondaryStack,
    hasPackageJson: deps.length > 0,
  };
};
