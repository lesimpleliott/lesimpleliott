const generateDetails = (groupedProjects) => {
  return Object.values(groupedProjects)
    .flat()
    .map(
      ({ repoName, description, stack, url }) => `
### 📁 [${repoName}](${url})
${stack || "_Stack inconnue_"}
${description || "_Aucune description disponible_"}

🔗 [Voir Preview](${url})

\`\`\`bash
git clone ${url}.git
\`\`\`
`
    )
    .join("\n---\n");
};

module.exports = generateDetails;
