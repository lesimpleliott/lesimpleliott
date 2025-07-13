// scripts/cli/scenarioDetectStack.js
import { buildStackProfile } from "../core/generateStackData.js";

const [, , repoArg] = process.argv;

if (!repoArg || !repoArg.includes("/")) {
  console.error("❌ Usage : npm run detectStack <user/repo>");
  process.exit(1);
}

console.log(`🔍 Analyse de la stack pour : ${repoArg} ...`);

try {
  const result = await buildStackProfile(repoArg);

  console.log("📁 Extensions :", result.exts);
  console.log("📚 Dépendances :", result.deps);
  console.log("📦 package.json détecté :", result.hasPackageJson);
  console.log("---------");
  console.log("📦 Stack complète :", result.full);
  console.log("✅ Stack filtrée :", result.filtered);
} catch (err) {
  console.error("❌ Erreur lors de la détection :", err.message);
}
