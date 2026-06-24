const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 5 : Le Département Slides
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch5-quizz    : Quizz théorique (ingrédients prompt, Slides vs Gamma)
//   studio-ch5-mission  : Mission créative (présentation personnelle 5-8 slides)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 5 : Le Département Slides";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch5-quizz",
        titre: "Validation du Niveau 5",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Parmi les 4 ingrédients d'un bon prompt de présentation, lequel précise 'professionnel', 'fun', 'dynamique'... ?",
                options: ["Le sujet", "Le nombre de diapositives", "Le ton", "La structure"],
                correctAnswer: 2,
                successMessage: "Exact ! Le ton oriente tout le style d'écriture et de design de la présentation générée."
            },
            {
                question: "Quel est l'avantage principal de Google Slides + Gemini par rapport à Gamma ?",
                options: [
                    "Le résultat est toujours plus joli visuellement",
                    "Tu restes dans l'écosystème Google, facile à partager et collaborer",
                    "C'est le seul outil qui exporte en PDF",
                    "C'est totalement gratuit et illimité, contrairement à Gamma"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Slides + Gemini garde tout dans ton compte Google habituel, pratique pour le partage et la collaboration."
            },
            {
                question: "Pourquoi faut-il utiliser les crédits gratuits de Gamma avec discernement ?",
                options: [
                    "Ils expirent après 24h",
                    "Sur le plan gratuit, ils ne se renouvellent pas automatiquement chaque mois",
                    "Chaque génération coûte de l'argent réel immédiatement",
                    "Il n'y a aucune limite, cette question n'a pas de sens"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Le crédit de départ gratuit est à utiliser pour de vrais essais réfléchis, pas pour générer au hasard."
            },
            {
                question: "Pourquoi est-il utile de réutiliser ton texte de présentation (Niveau 3) et ton logo (Niveau 4) dans tes slides ?",
                options: [
                    "Ce n'est pas vraiment utile, mieux vaut tout refaire",
                    "Ça donne de la cohérence à ton portfolio et fait gagner du temps",
                    "C'est obligatoire techniquement, sinon Slides ne fonctionne pas",
                    "Seul Gamma permet de réutiliser du contenu"
                ],
                correctAnswer: 1,
                successMessage: "Exactement ! Construire chaque pièce sur les précédentes, c'est tout l'esprit du Showreel final."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch5-mission-presentation",
        titre: "Ta présentation personnelle",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🎬 Mission : construis ta présentation de 5 à 8 slides

1. Choisis ton outil : **Google Slides + Gemini** ou **Gamma**.
2. Construis ton prompt avec les 4 ingrédients (sujet, nombre de slides,
   ton, structure).
3. Génère une première version, puis ajuste ce qui ne te convainc pas.
4. **Réutilise** ton texte de présentation du Niveau 3 et ton logo du
   Niveau 4 directement dans tes slides.
5. Dépose le lien de ta présentation (ou le PDF exporté), ainsi que ton
   prompt final.

> 💡 Structure suggérée : slide de titre → qui je suis → mes compétences →
> un projet/une réussite → mes objectifs → conclusion.
        `.trim(),

        theorie_md: `
### Exemple de prompt complet

\`\`\`
Crée une présentation de 7 slides pour me présenter : une slide de titre
avec mon nom, une slide "qui je suis", mes compétences, un projet que
j'ai réalisé (mon premier visuel généré par IA), mes objectifs pour
l'année, et une conclusion. Ton chaleureux et professionnel.
\`\`\`

---

### Checklist avant de soumettre

- [ ] As-tu précisé les 4 ingrédients dans ton prompt ?
- [ ] As-tu intégré ton texte de présentation et ton logo précédents ?
- [ ] As-tu relu chaque slide pour vérifier que ça te ressemble ?
- [ ] Le nombre de slides est-il bien entre 5 et 8 ?
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Google Slides", "url": "https://slides.google.com" },
            { "name": "Gamma", "url": "https://gamma.app" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas comment structurer**

Utilise cette trame simple, elle fonctionne presque toujours :
1. Titre (ton nom + une accroche courte)
2. Qui je suis (réutilise ton texte du Niveau 3)
3. Mes compétences
4. Un projet ou une réussite (ton logo du Niveau 4 peut illustrer ici)
5. Mes objectifs
6. Conclusion / contact
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et construit sa première présentation personnelle (5-8 slides) avec Google Slides+Gemini ou Gamma, en réutilisant son texte de présentation (CH3) et son logo (CH4).
S'il bloque sur le choix de l'outil, rappelle la règle simple : Slides+Gemini pour rester dans l'écosystème Google et collaborer facilement ; Gamma pour un résultat rapide et visuellement abouti. S'il bloque sur le prompt, vérifie que les 4 ingrédients (sujet, nombre de slides, ton, structure) sont présents et aide-le/la à identifier celui qui manque.
Reste dans l'esprit du systemPrompt du cours : encourageant, langage simple, valorise la cohérence avec les créations précédentes du portfolio.`,

            niveau_3_md: `
🛠️ **Exemple de structure finalisée, à adapter :**

\`\`\`
Slide 1 — Titre : "Alex M." + accroche "Créatif, curieux, en pleine montée en compétences"
Slide 2 — Qui je suis : (texte du Niveau 3, éventuellement raccourci)
Slide 3 — Mes compétences : 3-4 points clés
Slide 4 — Un projet : capture du logo créé au Niveau 4 + explication courte
Slide 5 — Mes objectifs : 2-3 phrases sur ce que tu vises
Slide 6 — Conclusion : un mot de remerciement + comment te contacter
\`\`\`

Adapte selon ton propre contenu — l'important est la cohérence avec
ce que tu as déjà construit dans les niveaux précédents.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 5 : Le Département Slides...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 5 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch5-quizz                   (type: quizz — 4 questions prompt/outils)");
    console.log("  - studio-ch5-mission-presentation     (type: creative — submission_type: both)");
}

seed();
