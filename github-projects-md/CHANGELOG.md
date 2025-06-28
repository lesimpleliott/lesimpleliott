## 2025-06-28 - chore(structure): initial project setup and scaffolding

**🆕 Ajouts**
- Création de l’arborescence complète du projet `github-projects-md`
- Initialisation du `package.json` avec les scripts `start`, `fetch` et `generate`
- Ajout des fichiers vides avec commentaires pour :
  - les scénarios (`scenarioAuto`, `scenarioEdit`, `generateReadme`)
  - les modules cœur (`fetchRepos`, `parseRepos`, etc.)
  - les utilitaires (`githubClient`, `log`, `promptYesNo`, etc.)
  - les configurations (`paths`, `badgeMap`, `defaults`)
- Mise en place du template de base `base.md` avec balises `<!-- SOMMAIRE -->` et `<!-- DETAILS -->`
- Fichier `projects.json` vide prêt à être rempli

**🗃 Structure**
Le projet est contenu dans le dossier `github-projects-md`, placé sous `/lesimpleliott`.
Le README final sera généré à la racine (`/lesimpleliott/README.md`).
