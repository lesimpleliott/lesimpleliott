## 2025-07-12 - refactor(core): centralize GitHub logic and refactor stack detection

Refonte complète de la gestion GitHub via un module unique centralisé.

- **Fusion de modules**
  - Suppression de : `core/fetchRepos.js` `core/gitApi.js` `core/updateRepoData.js`
  - Nouvelle centralisation dans `utils/githubClient.js`
- **Détection stack simplifiée**
  - Nouveau système `detectStackFromPackageJson`
  - Récupère et analyse `package.json` via l’API GitHub
  - Plus besoin de `git clone`, détection basée sur les dépendances
- **Mise à jour `projects.json`**
  - Nouveau module `utils/updateProjectsJson.js` pour gérer la logique de mise à jour
  - Préserve les champs manuels (`stackManual`, `categoryManual`)
- **Nettoyage des scénarios**
  - `scenarioEdit.js` :
    - appelle `fetchRepo` / `fetchAllRepos`
    - utilise `updateProjectsJson`
  - `scenarioRename.js` :
    - appelle `updateRepoData`
- **Amélioration de la gestion des droits**
  - Gère proprement les erreurs `403` / `404`, seuls les repos accessibles sont traités
  - Désarchivage temporaire des repos avant renommage, puis réarchivage

## 2025-06-29 - feat(rename): update GitHub repos from JSON with smart patching

Ajout de la commande `npm run rename` permettant de **synchroniser les dépôts GitHub** avec les données locales du `projects.json`.

- 🧠 Mise à jour intelligente des dépôts
  - Le script lit `projects.json` et met à jour chaque dépôt GitHub uniquement si :
    - le nom a changé (`name`)
    - la description a changé (`description`)
    - le statut `archived` a changé
  - Si le repo est archivé, il est automatiquement **désarchivé**, modifié, puis **réarchivé** si besoin.
  - L’URL du dépôt est automatiquement mise à jour si le nom a été modifié sur GitHub.
- 🔁 Mise à jour bidirectionnelle
  - Les changements appliqués sur GitHub sont **reflétés localement dans `projects.json`** :
    - mise à jour de l’URL (`url`)
    - confirmation du statut `archived`
- ✅ Console améliorée
  - Ajout de `ora` pour un affichage dynamique :
    - 🔒 Ignoré si non propriétaire
    - ✔ Mis à jour avec succès
    - ℹ Aucune modification
    - ❌ Erreur ou accès refusé
- 📦 Refactorisation
  - Création de `updateRepoData.js` pour centraliser la logique API GitHub
  - `scenarioRename.js` devient un orchestrateur propre, maintenable
- 🧩 Détection stack améliorée
  - Priorisation intelligente des technologies :
    - `Next JS` > `React`
    - `TypeScript` > `JavaScript`
    - `SASS` > `SCSS` > `CSS`
    - `Tailwind CSS` et `Styled Components` prioritaires sur tous les préprocesseurs CSS
- 🔠 Tri alphanumérique cohérent
  Facteur c ommun extrait dans `utils/sortAlphaNumeric.js`
- Utilisé da ns `generateSummary` et `generateDetails` pour un tri plus humain (1, 2, …, 10 au lieu de 1, 10, 2…)
- 📍 Amélioration UX terminal
  Affichage cliquable du chemin vers le `README.md` généré

## 2025-06-29 - feat(core): improve summary and details generation

Création des fonctions `generateSummary` et `generateDetails`

- **🔄 Summary (Sommaire)**
  - Ajout d’un regroupement par `categoryManual`, avec fallback vers une catégorie inconnue.
  - Respect de l’ordre défini dans `categoryMap`.
  - Tri alphabétique des projets à l’intérieur de chaque groupe.
  - Fusion de la colonne "Statut" directement dans le titre du projet :
    - 🔒 si privé
    - 📦 si archivé
  - Lien du sommaire vers l’ancre du bloc correspondant dans la liste détaillée (`#category-slug-project-slug`).
  - Ajout d’une légende en bas de sommaire pour les icônes utilisées.
- **📋 Détails**
  - Génération d’ancre HTML (`<a id="...">`) pour chaque projet, utilisée dans les liens du sommaire.
  - Ajout conditionnel des icônes 🔒 (privé) et 📦 (archivé) dans le titre.
  - Badge de stack basé sur `stackManual` en utilisant `badgeMap` :
    - Affichage d’un badge si la techno est connue
    - Affichage en texte brut sinon
  - Ajout d’un lien vers le site (`websiteUrl`) ou une preview (`previewUrl`) selon les données disponibles.
  - Ajout d’une icône 📋 dans la console bash pour faciliter le copier/coller.

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
