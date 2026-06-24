const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 3 : Le Département Écriture
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch3-quizz    : Quizz théorique (aide vs substitution, relecture)
//   studio-ch3-mission  : Mission créative (texte de présentation personnel)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 3 : Le Département Écriture";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch3-quizz",
        titre: "Validation du Niveau 3",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Quelle est la meilleure façon d'utiliser l'IA pour écrire un texte personnel ?",
                options: [
                    "Lui demander d'écrire le texte entier et copier-coller sans rien changer",
                    "Lui donner tes idées en vrac, puis relire et personnaliser le résultat",
                    "Ne jamais l'utiliser, ça enlève toute authenticité",
                    "Copier un texte trouvé sur Internet et le faire reformuler"
                ],
                correctAnswer: 1,
                successMessage: "Exactement ! L'IA structure tes idées, mais c'est toi qui gardes le contrôle final sur ce qui te ressemble vraiment."
            },
            {
                question: "Pourquoi la dernière étape de relecture est-elle si importante ?",
                options: [
                    "Ce n'est pas vraiment important, l'IA a toujours raison",
                    "Pour vérifier que le texte sonne comme toi et corriger ce qui ne te ressemble pas",
                    "Uniquement pour corriger les fautes d'orthographe",
                    "C'est une étape optionnelle réservée aux experts"
                ],
                correctAnswer: 1,
                successMessage: "Parfait ! La relecture, c'est le moment où le texte redevient vraiment le tien."
            },
            {
                question: "Quel type de demande donne généralement le MEILLEUR résultat avec l'IA ?",
                options: [
                    "\"Écris ma présentation\" (très court, sans détails)",
                    "Donner tes idées concrètes en vrac, puis demander de l'aide pour structurer",
                    "Ne donner aucune information et voir ce qu'elle invente",
                    "Copier la présentation de quelqu'un d'autre"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Plus tu donnes de vraies informations sur toi, plus le résultat te ressemblera."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch3-mission-presentation",
        titre: "Ton texte de présentation personnel",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### ✍️ Mission : rédige ton texte de présentation

1. Dans **Google Docs**, note en vrac : 3 choses que tu sais bien faire,
   1 chose que tu apprends actuellement, et ce que tu aimerais faire plus tard.
2. Demande à **Gemini** de transformer ces notes en un texte clair de 4-5 phrases,
   naturel et pas trop formel.
3. Colle le résultat dans ton Doc, puis **relis-le entièrement** :
   corrige tout ce qui ne te ressemble pas ou qui semble inexact.
4. Dépose le lien de ton document ci-dessous, ainsi que le prompt que tu as
   utilisé pour demander l'aide à Gemini.

> 💡 Garde précieusement ce texte — il reviendra dans ton Showreel final !
        `.trim(),

        theorie_md: `
### Un bon prompt pour structurer un texte

\`\`\`
Voici des notes en vrac sur moi : [tes notes]
Aide-moi à en faire un texte de présentation clair et naturel,
en 4-5 phrases, sans le rendre trop formel ni robotique.
\`\`\`

---

### La checklist de relecture

Avant de considérer ton texte terminé, vérifie :
- [ ] Est-ce que chaque phrase sonne comme **toi** et pas comme un robot ?
- [ ] Toutes les informations sont-elles **exactes** ?
- [ ] As-tu retiré les tournures trop formelles ou bizarres ?
- [ ] Te sentirais-tu à l'aise de partager ce texte avec quelqu'un ?

Si tu réponds "oui" aux 4 questions, ton texte est prêt.
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Google Docs", "url": "https://docs.google.com" },
            { "name": "Gemini", "url": "https://gemini.google.com" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas par où commencer**

Pas besoin de grandes phrases pour les notes en vrac. Des mots-clés suffisent :

\`\`\`
- bon en : dessin, jeux vidéo, aider les autres
- j'apprends : à utiliser l'IA, l'informatique
- plus tard : j'aimerais travailler dans le graphisme
\`\`\`

Donne ça à Gemini tel quel, il saura en faire des phrases.
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et rédige son premier texte de présentation personnel avec l'aide de Gemini, dans Google Docs.
S'il pose une question libre, aide-le/la à distinguer "faire écrire l'IA" (copier-coller sans relecture) de "se faire aider" (donner ses propres idées puis personnaliser le résultat). S'il bloque sur la formulation du prompt, encourage-le/la à donner des informations CONCRÈTES sur lui/elle plutôt qu'une demande vague.
Reste dans l'esprit du systemPrompt du cours : ton chaleureux, phrases courtes, valorise chaque petite avancée.`,

            niveau_3_md: `
🛠️ **Exemple de transformation, à titre indicatif :**

**Notes brutes :**
\`\`\`
bon en : dessin, jeux vidéo, aider les autres
j'apprends : informatique et IA
plus tard : graphisme
\`\`\`

**Résultat possible après aide de Gemini, puis relecture personnelle :**
\`\`\`
Je suis quelqu'un de créatif et patient — j'aime dessiner et aider les
autres à résoudre leurs petits problèmes du quotidien. Je suis en train
d'apprendre à utiliser l'informatique et l'intelligence artificielle,
deux outils qui m'ouvrent plein de portes. Plus tard, j'aimerais
travailler dans le graphisme, pour combiner ma créativité avec ce que
j'apprends aujourd'hui.
\`\`\`

Le tien sera différent — et c'est exactement le but.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 3 : Le Département Écriture...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 3 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch3-quizz                  (type: quizz — 3 questions aide vs substitution)");
    console.log("  - studio-ch3-mission-presentation    (type: creative — submission_type: both)");
}

seed();
