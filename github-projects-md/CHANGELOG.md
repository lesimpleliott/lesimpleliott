## `2025-06-26 - feat(github-projects-md): initial script setup with dynamic stack detection and markdown generation`

- **Création du dossier** `github-projects-md/` pour isoler la logique de génération.
- Mise en place de la structure modulaire :
  - `scripts/generateMarkdown.js` – orchestrateur principal
  - `scripts/generateSummary.js` – génération du sommaire
  - `scripts/generateDetails.js` – génération de la liste détaillée
  - `scripts/utils.js` – fonctions utilitaires (slugify, detection de stack)
  - `scripts/getBadgeMap.js` – mapping des stacks vers des badges visuels
  - `scripts/getCategories.js` – regroupement des projets par catégories
- **Détection des stacks**
  - Système de priorité entre `next` > `react` > `javascript`
  - Priorité sur `typescript` > `javascript` selon les extensions présentes
  - Gestion CSS vs SCSS vs SASS avec priorité dégressive
  - Inclusion automatique de dépendances comme `zustand`, `redux`, `electron`, `i18next`, etc.
  - Ordre d’affichage 100% basé sur l’ordre des clés dans `getBadgeMap.js` (DRY)
