const { slugify } = require("./utils");
const categories = require("./getCategories");

const generateSummary = (groupedProjects) => {
  const rows = [];

  Object.entries(groupedProjects).forEach(([prefix, repos], i) => {
    if (repos.length === 0) return;

    const title = categories[prefix];

    if (i !== 0) {
      rows.push(`| ********************************************************** |   |`);
    }

    rows.push(`| **${title}** |   |`);

    repos.forEach(({ repoName, url }) => {
      const anchor = slugify(repoName);
      const titleLink = `[\`${repoName}\`](#📁-${anchor})`;
      const icons = [
        `[![GitHub](https://img.shields.io/badge/-GitHub-000?style=flat&logo=github)](${url})`,
        `[![Preview](https://img.shields.io/badge/-Preview-blue?style=flat&logo=vercel)](${url})`,
        `[![Website](https://img.shields.io/badge/-Website-0A66C2?style=flat&logo=google-chrome&logoColor=white)](${url})`,
      ].join(" ");
      rows.push(`| ${titleLink} | ${icons} |`);
    });
  });

  return [
    "## 📚 Sommaire",
    "",
    "| Projet | Liens |",
    "|--------|-------|",
    ...rows,
  ].join("\n");
};

module.exports = generateSummary;
