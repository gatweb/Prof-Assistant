const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 4 : Le Département Image
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch4-quizz    : Quizz théorique (ingrédients prompt, itération, outils)
//   studio-ch4-mission  : Mission créative (logo ou bannière personnelle)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 4 : Le Département Image";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch4-quizz",
        titre: "Validation du Niveau 4",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Parmi les 5 ingrédients d'un bon prompt image, lequel décrit l'atmosphère générale (chaleureuse, sombre, mystérieuse...) ?",
                options: ["Le sujet", "Le style", "L'ambiance", "La composition"],
                correctAnswer: 2,
                successMessage: "Exact ! L'ambiance donne le ton émotionnel de l'image, en plus du sujet et du style visuel."
            },
            {
                question: "Tu obtiens un résultat presque parfait mais pas tout à fait. Que fais-tu ?",
                options: [
                    "Tu abandonnes et tu gardes le résultat imparfait",
                    "Tu changes complètement de prompt en repartant de zéro",
                    "Tu ajustes un ou deux détails précis, puis tu régénères",
                    "Tu changes d'outil immédiatement"
                ],
                correctAnswer: 2,
                successMessage: "Parfait réflexe ! Itérer petit à petit permet de savoir précisément ce qui améliore le résultat."
            },
            {
                question: "Tu veux créer un logo avec ton nom écrit clairement et lisiblement. Quel outil est le plus adapté ?",
                options: ["Gemini", "Ideogram", "Aucune importance, tous se valent", "Aucun outil ne peut faire ça"],
                correctAnswer: 1,
                successMessage: "Exact ! Ideogram est spécifiquement entraîné pour bien rendre le texte lisible à l'intérieur d'une image."
            },
            {
                question: "Pourquoi est-il important de préciser le FORMAT dans un prompt (carré, vertical, horizontal) ?",
                options: [
                    "Ce n'est jamais nécessaire, l'IA choisit toujours le meilleur format",
                    "Pour adapter l'image à son usage prévu (profil, story, bannière...)",
                    "Le format ne concerne que les vidéos, pas les images",
                    "Cela ralentit la génération si on le précise"
                ],
                correctAnswer: 1,
                successMessage: "Exactement ! Le bon format dépend de où tu vas utiliser l'image."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch4-mission-logo",
        titre: "Le logo ou la bannière de ton agence",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🏷️ Mission : crée ton identité visuelle

1. Choisis : un **logo simple**, ou une **bannière** avec ton nom ou pseudo.
2. Si tu as besoin de texte lisible dans le visuel, utilise **Ideogram**.
   Sinon, **Gemini** ou **ChatGPT** suffisent.
3. Construis ton prompt avec les 5 ingrédients (sujet, style, ambiance,
   composition, couleurs) — et précise le format voulu.
4. Génère, observe, **ajuste au moins un détail**, puis régénère.
5. Dépose le lien ou l'image finale, ainsi que ton **prompt final** (celui
   qui a donné le résultat que tu as choisi).

> 💡 Cette pièce rejoindra ton Showreel au Niveau 8 — prends le temps de
> la soigner.
        `.trim(),

        theorie_md: `
### Rappel — les 5 ingrédients

\`\`\`
Sujet + Style + Ambiance + Composition + Couleurs
\`\`\`

**Exemple de prompt complet pour un logo :**
\`\`\`
Un logo minimaliste représentant les initiales "AM", style moderne et
épuré, lignes géométriques simples, couleurs turquoise et blanc,
fond transparent, format carré.
\`\`\`

**Exemple de prompt pour une bannière avec texte :**
\`\`\`
Une bannière horizontale avec le texte "Studio Alex" en grandes lettres
élégantes, fond dégradé violet et bleu nuit, style moderne, format large.
(→ à générer avec Ideogram pour un texte bien lisible)
\`\`\`

---

### Checklist avant de soumettre

- [ ] As-tu précisé un style clair ?
- [ ] As-tu précisé le format voulu ?
- [ ] As-tu itéré au moins une fois ?
- [ ] Le résultat te plaît-il vraiment, pas juste "ça pourrait aller" ?
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Gemini", "url": "https://gemini.google.com" },
            { "name": "ChatGPT", "url": "https://chatgpt.com" },
            { "name": "Ideogram", "url": "https://ideogram.ai" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas par où commencer**

Pars simple : choisis juste 2-3 couleurs qui te plaisent, et une forme
ou une idée simple (tes initiales, un objet qui te représente, une forme
géométrique). Tu peux toujours complexifier après la première tentative.
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et crée son premier visuel d'identité (logo ou bannière) avec Gemini/ChatGPT/Ideogram, en appliquant les 5 ingrédients de prompt (sujet/style/ambiance/composition/couleurs) et en itérant au moins une fois.
S'il bloque sur le choix de l'outil, rappelle-lui la règle simple : texte lisible nécessaire → Ideogram ; sinon Gemini ou ChatGPT. S'il bloque sur le prompt, aide-le/la à identifier quel ingrédient manque dans sa description actuelle, sans réécrire le prompt à sa place.
Reste dans l'esprit du systemPrompt du cours : encourageant, langage simple, valorise chaque itération même si le résultat n'est pas encore parfait.`,

            niveau_3_md: `
🛠️ **Exemple complet, à adapter :**

\`\`\`
Tentative 1 : "Un logo simple pour mon studio créatif."
→ Trop vague, résultat générique.

Tentative 2 : "Un logo minimaliste avec les initiales 'JL', style
géométrique moderne, couleurs orange et bleu marine, fond transparent,
format carré."
→ Bien mieux ! Précis sur le sujet, le style, les couleurs et le format.
\`\`\`

Adapte avec tes propres initiales, couleurs et style préférés —
l'objectif est que ce logo te ressemble vraiment.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 4 : Le Département Image...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 4 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch4-quizz             (type: quizz — 4 questions ingrédients/itération/outils)");
    console.log("  - studio-ch4-mission-logo      (type: creative — submission_type: both)");
}

seed();
