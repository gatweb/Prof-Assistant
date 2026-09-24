/**
 * 🎓 Configuration des Enseignants Autorisés & des Classes
 * 
 * Ajoutez facilement vos collègues dans le tableau ALLOWED_TEACHERS ci-dessous.
 * Ils pourront se connecter avec leur compte Google sur ProfAssistant V2.
 */

export const ALLOWED_TEACHERS = [
  {
    email: "gatweb@gmail.com",
    nom: "Professeur Admin (Fondateur)",
    classes: ["1A", "1B", "1C", "1D"],
    role: "admin"
  },
  // 👉 Ajoutez ici les adresses Google de vos collègues pour samedi :
  {
    email: "collegue1@ecole.be",
    nom: "Professeur Collègue 1",
    classes: ["1A", "1B"],
    role: "enseignant"
  },
  {
    email: "collegue2@ecole.be",
    nom: "Professeur Collègue 2",
    classes: ["1C", "1D"],
    role: "enseignant"
  }
];

/**
 * Classes disponibles pour le niveau 1re FMTTN
 */
export const AVAILABLE_CLASSES = ["1A", "1B", "1C", "1D", "1E", "1F"];

/**
 * Vérifie si une adresse email fait partie des enseignants autorisés
 * @param {string} email 
 * @returns {boolean}
 */
export function isTeacherEmailAllowed(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  
  // 1. Vérification dans la liste blanche explicite
  const found = ALLOWED_TEACHERS.some(t => t.email.toLowerCase() === cleanEmail);
  if (found) return true;
  
  // 2. Autorisation automatique des comptes académiques / école si applicable
  if (cleanEmail.endsWith("@ecole.be") || cleanEmail.endsWith("@enseignement.be")) {
    return true;
  }
  
  return false;
}

/**
 * Récupère le profil enseignant associé à une adresse email
 * @param {string} email 
 * @returns {object}
 */
export function getTeacherProfile(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const found = ALLOWED_TEACHERS.find(t => t.email.toLowerCase() === cleanEmail);
  if (found) return found;

  return {
    email: cleanEmail,
    nom: cleanEmail.split('@')[0],
    classes: AVAILABLE_CLASSES,
    role: "enseignant"
  };
}
