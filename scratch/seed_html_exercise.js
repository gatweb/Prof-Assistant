const admin = require('firebase-admin');

// Initialisation (pour émulateur)
admin.initializeApp({
  projectId: 'profassistant-61fde'
});

const db = admin.firestore();

async function seed() {
  console.log("🚀 Seeding exercice HTML/CSS...");

  const exId = "html-css-box-model";
  const exData = {
    titre: "Le Mystère du Box Model 📦",
    chapitre: "HTML & CSS",
    enonce_md: `
Ton objectif est de créer une **carte de profil** élégante.
1. Utilise une \`div\` avec la classe \`card\`.
2. Ajoute un titre \`h2\` pour le nom.
3. Applique un **padding** de 20px et une **border** de 2px solide bleue.
4. Ajoute une ombre portée (\`box-shadow\`).
`,
    theorie_md: `
### Le Box Model CSS
Chaque élément est une boîte composée de :
- **Content** : Le texte ou l'image.
- **Padding** : L'espace *intérieur* (entre le contenu et la bordure).
- **Border** : La ligne qui entoure le padding.
- **Margin** : L'espace *extérieur* (entre la bordure et les autres éléments).

\`\`\`css
.card {
  padding: 20px;
  border: 1px solid black;
  margin: 10px;
}
\`\`\`
`,
    lien_cours: "https://developer.mozilla.org/fr/docs/Learn/CSS/Building_blocks/The_box_model",
    code_depart: "// Pas de JS nécessaire pour cet exercice, concentre-toi sur HTML/CSS !",
    indices: {
      niveau_1_md: "Pense à utiliser `box-sizing: border-box;` pour que le padding ne change pas la taille totale de ta boîte.",
      niveau_2_prompt: "L'élève a créé une div .card mais a oublié l'ombre portée (box-shadow). Guide-le sans donner le code.",
      niveau_3_md: "Voici la structure : \n```html\n<div class='card'>\n  <h2>Mon Nom</h2>\n</div>\n```"
    },
    statut_aide: true
  };

  await db.collection('exercices').doc(exId).set(exData);
  console.log(`✅ Exercice '${exId}' ajouté.`);
  console.log("✨ Seeding terminé !");
}

seed().catch(console.error);
