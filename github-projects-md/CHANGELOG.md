## 2025-07-14 - refactor(core): migrate updateProjectsJson to generateProjectsJson CLI

- Suppression de `updateProjectsJson.js` au profit d’une nouvelle fonction modulaire `generateProjectsJson.js` (dossier `/core`)
- Nouvelle CLI `scenarioFetch.js` dans `/cli` pour gérer :
  - `npm run fetch user` → tous les dépôts d’un utilisateur
  - `npm run fetch user/repo` → un dépôt spécifique
- Amélioration de la logique d’analyse :
  - Comparaison intelligente (détection des projets inchangés)
  - Affichage console en couleur :
    - 🟢 Ajouté
    - 🟠 Mis à jour
    - 🔵 Inchangé
  - Intégration de la date `updated_at` de GitHub (champ `lastUpdate`)
  - Formatage propre et cohérent du fichier `projects.json`

## 2025-07-14 - feat(stack-detection): split main/secondary stack with improved match logic

- Ajout de `mainStack` et `secondaryStack` dans le profil de stack.
- Détection des stacks secondaires via clé `match` (ex: "emailjs" détecte "@emailjs/browser").
- Respect de l’ordre d’apparition dans le JSON pour le tri des stacks secondaires.
- Renommage de `filtered` → `mainStack` pour plus de clarté.
- `stackRules.secondaryStacks` passe d’un tableau de strings à un tableau d’objets `{ label, match }`.
- Mise à jour du script `scenarioDetectStack.js` :
  - Affiche `📦 Stack MAIN : [...]`
  - Affiche `📦 Stack SECOND : [...]`

## 2025-07-14 - refactor(stack): improve stack detection and primaryStack sorting

Cette mise à jour majeure améliore la robustesse et la précision du système de détection des technologies utilisées dans chaque repository GitHub.

- **Refactor global du système `detectStack`** :
  - Le fichier `detectStack.js` a été supprimé et remplacé par une architecture modulaire plus propre :
    - `generateStackData.js` : point d’entrée unique pour la détection
    - `detectFromPackageJson.js` : récupération des dépendances
    - `detectFromRepoFiles.js` : détection des extensions
  - Intégration dans un nouveau script CLI (`scenarioDetectStack.js`) pour tester facilement.
- **Nouvelle logique de tri `filtered`** :
  - La liste `filtered` respecte désormais **l’ordre défini dans `stackRules.primaryStacks`**
- **Fusion des dépendances et extensions dans une analyse unifiée** :
  - La fonction `analyzeStack` combine `deps` + `exts` pour extraire les technologies via leurs `match` et `matchExt`.
  - L’algorithme supprime proprement les technologies ignorées (`ignore`), même si elles sont présentes.
- Ajout des helpers GitHub :
  - `fetchRepoTree` : récupération des fichiers d’un repo.
  - `fetchRepoBlob` : lecture du contenu brut d’un fichier comme `package.json`.
- **Script CLI repensé** :
  `npm run detectStack <user/repo>` pour tester la détection de stack en local.

## 2025-07-13 - feat(stack): refactor stack detection with rules + clean output

Refonte de la détection de stack et amélioration de l’affichage console.

- Remplacé `badgeMap.js` par un fichier de configuration JSON : `stackRules.json`
- Support des stacks **primaires** avec priorités et règles d’ignorance (`ignore`)
- Support des **stacks secondaires** (librairies utilitaires, auth, backend, etc.)
- Génération auto de `stackManual` à l’ajout (labels + dépendances secondaires)
- Nettoyage de la console : spinner → message sur une seule ligne
  - `\u001b[32m✔ Ajouté : nomDuRepo\u001b[0m`
  - `✔ Mis à jour : nomDuRepo` (couleur par défaut)
  - `\u001b[33m⚠ Ajouté : nomDuRepo / Infos : aucun package.json\u001b[0m`
- Autres
  - `detectStackFromPackageJson` recherche **tous** les `package.json` (arbre Git complet)
  - Suppression de `badgeMap.js` (désormais géré via `stackRules.json`)
  - Le spinner `ora` est stoppé proprement avant affichage du résultat
- Résultat :
  - Une seule ligne par repo dans la console
  - Retour plus lisible, filtré, coloré et sans bruit inutile

## 2025-07-12 - refactor(structure): reorganize folders and test scripts with minor debug

Réorganisation complète de la **structure du projet** et **tests manuels approfondis** des scripts principaux.

- Réorganisation des dossiers
  - `scripts/scenario/` renommé en `scripts/cli/` (commandes principales)
  - `defaults.js` renommé en `categoryMap.js` (nom plus clair)
  - `detectStack.js` déplacé vers `scripts/github/`
  - `githubClient.js` déplacé vers `scripts/github/`
  - `updateProjectsJson.js` déplacé vers `scripts/github/` et refondu
  - Suppression de `getAllFiles.js` (obsolète)
- Refactorisation de `updateProjectsJson`
  - Affichage d'une alerte si `package.json` absent :
    - `⚠ Ajouté : NomDuRepo / Infos : aucun package.json`
    - `⚠ Mis à jour : NomDuRepo / Infos : aucun package.json`
  - Préservation des champs manuels (`stackManual`, `categoryManual`, etc.)
- Tests manuels des scripts CLI
  - `npm run fetch` :
    - ajout d’un repo avec stack
    - ajout d’un repo sans `package.json` → message d'alerte fonctionnel
    - mise à jour d’un repo existant → merge correct
  - `npm run rename` :
    - update conditionnel selon `projects.json` → test de renommage, description, archivage
    - test de repo déjà à jour → message informatif sans update
  - `npm run generate` :
    - génération du `README.md` sans erreur
    - liens d’ancre fonctionnels et légende affichée

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
