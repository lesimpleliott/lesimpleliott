/**
 * Convertit un texte en slug URL-safe
 * @param {string} str
 * @returns {string}
 */
export const slugify = (str) =>
  str
    .toString()
    .normalize("NFD") // Remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
