## 2025-06-28 - feat(core): implement fetch logic with manual field preservation

Implémentation complète de la commande `fetch` permettant d'extraire les dépôts GitHub d’un utilisateur (ou d’un repo précis) et de mettre à jour le fichier `projects.json`.

- Fonctions principales :
  - `fetchRepos.js` : gère les arguments (`user` ou `user/repo`), récupère les dépôts via l’API GitHub, clone les projets, détecte la stack, déduit la catégorie, et construit les entrées JSON.  
    → préserve les champs modifiables manuellement : `stackManual`, `categoryManual`, `previewUrl`, `websiteUrl`
  - `buildProjectObject()` : crée une entrée standardisée pour `projects.json` ; utilise les valeurs manuelles si existantes.
  - `cloneAndDetect()` : clone un repo temporairement, extrait les fichiers et le `package.json`, puis détecte la stack via `detectStack`.
  - `detectStack()` : identifie les technologies utilisées dans un projet à partir des dépendances et des extensions de fichiers ; renvoie les badges correspondants à `badgeMap`.
  - `getAllFiles()` : récupère les extensions de fichiers d’un dossier (utile pour `detectStack`).
  - `promptYesNo()` : pose une question en ligne de commande (Oui/Non).
  - `openInEditor()` : ouvre le fichier `projects.json` dans VSCode après fetch si l’utilisateur souhaite l’éditer manuellement.

Résultat : `projects.json` est mis à jour sans jamais écraser les champs manuels. Le système est prêt pour l’enrichissement progressif et la génération du README.

## 2025-06-28 - chore(structure): initial project setup and scaffolding

- **🆕 Ajouts**
  - Création de l’arborescence complète du projet `github-projects-md`
  - Initialisation du `package.json` avec les scripts `start`, `fetch` et `generate`
  - Ajout des fichiers vides avec commentaires pour :
    - les scénarios (`scenarioAuto`, `scenarioEdit`, `generateReadme`)
    - les modules cœur (`fetchRepos`, `parseRepos`, etc.)
    - les utilitaires (`githubClient`, `log`, `promptYesNo`, etc.)
    - les configurations (`paths`, `badgeMap`, `defaults`)
  - Mise en place du template de base `base.md` avec balises `<!-- SOMMAIRE -->` et `<!-- DETAILS -->`
  - Fichier `projects.json` vide prêt à être rempli
- **🗃 Structure**
  Le projet est contenu dans le dossier `github-projects-md`, placésous `/lesimpleliott`.
  Le README final sera généré à la racine (`/lesimpleliott/README.md`).
