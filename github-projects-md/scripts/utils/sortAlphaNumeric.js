/**
 * Trie deux objets par leur propriété `name` avec tri alphanumérique naturel.
 * Ex : "Projet 2" < "Projet 10"
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
export const sortAlphaNumeric = (a, b) => {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};
