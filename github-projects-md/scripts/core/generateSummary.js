import { categoryMap } from "../config/defaults.js";
import { slugify } from "../utils/slugify.js";

/**
 * Génère le sommaire des projets sous forme de table Markdown
 * @param {Array} projects - Liste plate des projets
 * @returns {string}
 */
export const generateSummary = (projects) => {
  const grouped = {};
  const unknownCategoryLabel = "❓ Projets sans catégorie connue";

  // Initialisation des groupes
  Object.values(categoryMap).forEach((label) => {
    grouped[label] = [];
  });
  grouped[unknownCategoryLabel] = [];

  // Répartition des projets
  projects.forEach((project) => {
    const category = project.categoryManual || "default";
    const label = Object.values(categoryMap).includes(category)
      ? category
      : unknownCategoryLabel;

    grouped[label].push(project);
  });

  const rows = [];
  const orderedLabels = [...Object.values(categoryMap), unknownCategoryLabel];

  orderedLabels.forEach((label) => {
    const repos = grouped[label];
    if (!repos || repos.length === 0) return;

    if (rows.length > 0) {
      rows.push(
        `| ······················································································|   |`
      );
    }

    rows.push(`| **${label}** |   |`);

    const sortedRepos = [...repos].sort((a, b) => a.name.localeCompare(b.name));

    sortedRepos.forEach(
      ({ name, url, previewUrl, websiteUrl, visibility, archived }) => {
        const cleanName = name.replace(/^([A-Z]+)_/, "");
        const anchor = slugify(cleanName);
        const statusIcons = [
          visibility === "private" ? "🔒" : "",
          archived ? "📦" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const titleLink =
          `[\`${cleanName}\`](#${anchor}) ${statusIcons}`.trim();

        const icons = [
          `[![GitHub](https://img.shields.io/badge/-GitHub-000?style=flat&logo=github)](${url})`,
          websiteUrl &&
            `[![Website](https://img.shields.io/badge/-Website-0A66C2?style=flat&logo=google-chrome&logoColor=white)](${websiteUrl})`,
          !websiteUrl &&
            previewUrl &&
            `[![Preview](https://img.shields.io/badge/-Preview-blue?style=flat&logo=vercel)](${previewUrl})`,
        ]
          .filter(Boolean)
          .join(" ");

        rows.push(`| ${titleLink} | ${icons} |`);
      }
    );
  });

  return [
    "",
    "| Projet | Liens |",
    "|--------|-------|",
    ...rows,
    "",
    "**Légende** : 🔒 projet privé — 📦 projet archivé",
  ].join("\n");
};
