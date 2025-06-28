import fs from 'fs';
import path from 'path';
import { getAllFiles } from './getAllFiles.js';
import { badgeMap } from '../config/badgeMap.js';

const stackOrder = Object.keys(badgeMap);

/**
 * Détecte les technos utilisées dans un repo local (dépendances + extensions)
 * @param {string} repoPath - Chemin local du repo cloné
 * @returns {string} Badges Markdown concaténés
 */
export const detectStack = (repoPath) => {
  const detected = new Set();
  const files = getAllFiles(repoPath);

  const pkgPath = path.join(repoPath, 'package.json');
  const pkg =
    fs.existsSync(pkgPath) && fs.statSync(pkgPath).isFile()
      ? JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      : {};

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const depKeys = Object.keys(deps || {}).map((d) => d.toLowerCase());

  // Détection technos via dépendances
  const hasNext = depKeys.some((d) => d.includes('next'));
  const hasReact = depKeys.some((d) => d.includes('react'));

  if (hasNext) detected.add('next');
  else if (hasReact) detected.add('react');

  if (!hasNext && !hasReact && files.includes('.js')) detected.add('javascript');
  if (files.includes('.ts') || files.includes('.tsx')) detected.add('typescript');
  if (files.includes('.sass')) detected.add('sass');
  else if (files.includes('.scss')) detected.add('scss');
  else if (files.includes('.css')) detected.add('css');

  // Autres stacks
  stackOrder.forEach((key) => {
    if (['next', 'react', 'javascript', 'typescript', 'css', 'scss', 'sass'].includes(key)) return;
    if (depKeys.some((d) => d.includes(key.toLowerCase()))) {
      detected.add(key);
    }
  });

  return stackOrder
    .filter((key) => detected.has(key))
    .map((key) => badgeMap[key])
    .join(' ');
};
