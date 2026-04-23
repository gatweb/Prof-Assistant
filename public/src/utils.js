/**
 * Formate une date provenant soit d'une chaîne ISO, soit d'un Timestamp Firestore
 * @param {any} dateField - Le champ date à formater
 * @returns {string} - La date formatée de manière lisible
 */
export function formatDate(dateField) {
    if (!dateField) return "Date inconnue";
    
    let date;
    
    // Cas 1 : C'est un Timestamp Firestore (objet avec .seconds ou .toDate)
    if (typeof dateField.toDate === 'function') {
        date = dateField.toDate();
    } 
    // Cas 2 : C'est un objet Date
    else if (dateField instanceof Date) {
        date = dateField;
    }
    // Cas 3 : C'est une chaîne de caractères (ISO ou autre) ou un nombre (timestamp ms)
    else {
        date = new Date(dateField);
    }
    
    // Vérification de la validité
    if (isNaN(date.getTime())) {
        return "Date invalide";
    }
    
    return date.toLocaleDateString('fr-FR') + " à " + 
           date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
}
