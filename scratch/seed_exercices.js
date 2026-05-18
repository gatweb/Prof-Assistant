const admin = require('firebase-admin');

// Initialisation
admin.initializeApp();
const db = admin.firestore();

const EXERCICES = [
    {
        id: "boucle-for-js",
        titre: "La Grande Boucle (JS)",
        enonce_md: `
### 🎯 Objectif
Ton but est de créer une boucle \`for\` qui affiche les nombres de **1 à 10** dans la console.

### 📝 Consignes
1. Initialise ta boucle à 1.
2. Arrête-toi quand le compteur atteint 10 (inclus).
3. Affiche chaque valeur avec \`console.log()\`.
        `.trim(),
        code_depart: "// Écris ta boucle for ici\n\n",
        theorie_md: `
### Rappel Théorique : La Boucle For en JS
La boucle for se compose de trois parties essentielles :
1. **Initialisation** : \`let i = 1;\`
2. **Condition de maintien** : \`i <= 10;\` (tant que c'est vrai, on continue)
3. **Incrémentation** : \`i++\` (on ajoute 1 à chaque tour)

**Exemple :**
\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`
        `.trim(),
        lien_cours_complet: "https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Loops_and_iteration#la_déclaration_for",
        indices: {
            niveau_1_md: "💡 **Indice Théorique** : Rappelle-toi de la structure : \`for (init; condition; increment) { ... }\`. Pour commencer à 1, ton initialisation doit être \`let i = 1\`.",
            niveau_2_prompt: "Analyse le code de l'élève pour l'exercice de la boucle for (1 à 10). Trouve l'erreur logique ou de syntaxe et explique-la de manière socratique sans donner le code corrigé.",
            niveau_3_md: `
🛠️ **Structure à trous** :
\`\`\`javascript
for (let i = ___; i <= ___; i++) {
    console.log(___);
}
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Début du seeding des exercices...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ Exercice '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding terminé !");
}

seed();
