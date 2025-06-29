import { badgeMap } from "../config/badgeMap.js";
import { categoryMap } from "../config/defaults.js";
import { slugify } from "../utils/slugify.js";
import { sortAlphaNumeric } from "../utils/sortAlphaNumeric.js";

/**
 * Génère la liste détaillée des projets
 * @param {Object[]} projects
 * @returns {string}
 */
export const generateDetails = (projects) => {
  const grouped = {};

  // Regrouper par clé de categoryMap ou dans "unknown"
  projects.forEach((project) => {
    const categoryKey = Object.keys(categoryMap).find(
      (key) => categoryMap[key] === project.categoryManual
    );

    const prefix = categoryKey || "unknown";

    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(project);
  });

  const orderedKeys = [...Object.keys(categoryMap), "unknown"];

  return orderedKeys
    .filter((key) => grouped[key]?.length)
    .flatMap((key) => {
      const repos = grouped[key];
      const emoji =
        key === "unknown" ? "❓" : categoryMap[key]?.slice(0, 2) || "📁";

      const sortedRepos = [...repos].sort(sortAlphaNumeric);

      return sortedRepos.map(
        ({
          name,
          description,
          stackManual,
          url,
          websiteUrl,
          previewUrl,
          visibility,
          archived,
        }) => {
          const cleanName = name.replace(/^([A-Z]+)_/, "");
          const slug = slugify(cleanName);
          const finalLink = websiteUrl || previewUrl || "";
          const linkBlock = websiteUrl
            ? `🔗 [Voir le site](${websiteUrl})`
            : previewUrl
            ? `🔗 [Voir la preview](${previewUrl})`
            : "";

          const badges =
            stackManual?.map((tech) => badgeMap[tech] || tech).join(" ") ||
            "_Stack inconnue_";

          const icons = [
            visibility === "private" ? "🔒" : "",
            archived ? "📦" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return `
<a id="${slug}"></a>
### ${emoji} [${cleanName}](${url}) ${icons}
${description || "_Aucune description disponible_"}

${linkBlock ? `${linkBlock}\n` : ""}
${badges}
\`\`\`bash
git clone ${url}.git
\`\`\``;
        }
      );
    })
    .join("\n---\n");
};
