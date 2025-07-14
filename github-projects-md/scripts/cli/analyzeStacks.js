import { buildStackProfile } from "../core/generateStackData.js";
import { blue, bold, red } from "../utils/cliCommon.js";

const [, , repoArg] = process.argv;

if (!repoArg || !repoArg.includes("/")) {
  console.error(
    red("❌ Merci d’indiquer un repo GitHub : npm run stack <user/repo>")
  );
  process.exit(1);
}

try {
  const result = await buildStackProfile(repoArg);

  console.log(bold("📁 Extensions détectées :"));
  console.log(blue(result.exts.join(", ")));

  console.log(bold("\n📚 Dépendances détectées :"));
  console.log(blue(result.deps.join(", ")));

  console.log("\n" + "-".repeat(40));

  console.log(bold("✅ Stack détectée selon config/stackRules.json :"));
  if (result.mainStack.length) {
    console.log(blue("(Primary) " + result.mainStack.join(", ")));
  }
  if (result.secondaryStack.length) {
    console.log(blue("(Secondary) " + result.secondaryStack.join(", ")));
  }

  console.log("\n" + "-".repeat(40));
} catch (err) {
  console.error("❌ Erreur lors de la détection :", err.message);
}
