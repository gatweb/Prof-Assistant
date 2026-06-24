const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 6 : Le Département Musique
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch6-quizz    : Quizz théorique (modes Suno, ingrédients, actions)
//   studio-ch6-mission  : Mission créative (jingle du Studio)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 6 : Le Département Musique";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch6-quizz",
        titre: "Validation du Niveau 6",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "En mode SIMPLE sur Suno, qui écrit les paroles de la chanson ?",
                options: ["Toi uniquement", "L'IA invente aussi les paroles", "Il n'y a jamais de paroles en mode simple", "Un autre utilisateur de Suno"],
                correctAnswer: 1,
                successMessage: "Exact ! En mode simple, Suno génère à la fois la musique ET les paroles à partir de ta description."
            },
            {
                question: "Parmi les 5 ingrédients d'un prompt musical, lequel précise 'voix féminine douce' ou 'voix masculine grave' ?",
                options: ["Le genre", "L'ambiance", "La voix", "Le tempo"],
                correctAnswer: 2,
                successMessage: "Exact ! Préciser le style vocal influence énormément le rendu final."
            },
            {
                question: "Tu aimes le début d'une chanson générée mais elle s'arrête trop court. Que fais-tu ?",
                options: [
                    "Tu recommences entièrement de zéro",
                    "Tu utilises la fonction 'Étendre' pour continuer dans la même direction",
                    "Rien n'est possible, il faut accepter la durée proposée",
                    "Tu changes complètement de genre musical"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! 'Étendre' permet de prolonger une création que tu aimes déjà, sans tout recommencer."
            },
            {
                question: "Qu'est-ce qu'un 'jingle' ?",
                options: [
                    "Une chanson complète de 4 minutes minimum",
                    "Une courte musique d'identité, mémorable et reconnaissable",
                    "Un terme réservé à la radio uniquement",
                    "Un type de microphone utilisé en studio"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Un jingle est court (15-30 secondes généralement) et sert à créer une identité sonore reconnaissable."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch6-mission-jingle",
        titre: "Le jingle de ton Studio",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🎵 Mission : crée le jingle de ton agence

1. Réfléchis à l'identité sonore de ton Studio : énergique, posée, rêveuse,
   futuriste ?
2. Construis ton prompt avec les 5 ingrédients (genre, ambiance,
   instruments, voix, tempo).
3. Génère sur **Suno**, écoute les deux versions proposées.
4. Régénère ou ajuste un détail si besoin, puis choisis ta version préférée.
5. Dépose le lien de partage Suno et ton prompt final.

> 💡 Garde ce jingle — il accompagnera ta vidéo finale et ton Showreel !
        `.trim(),

        theorie_md: `
### Exemple de prompt complet

\`\`\`
Pop électronique courte et entraînante, ambiance fraîche et confiante,
synthés brillants, légère touche de batterie énergique, voix féminine
douce en fond, parfait comme intro de podcast créatif.
\`\`\`

---

### Mode simple vs personnalisé — rappel

- **Mode simple** : tu décris l'ambiance, Suno invente tout (musique + paroles).
- **Mode personnalisé** : tu écris toi-même les paroles, Suno compose autour.

Pour un premier jingle, le mode simple est largement suffisant.

---

### Checklist avant de soumettre

- [ ] As-tu précisé un genre et une ambiance clairs ?
- [ ] As-tu écouté les deux versions proposées avant de choisir ?
- [ ] Le résultat correspond-il à l'identité de TON Studio, pas un hasard générique ?
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Suno", "url": "https://suno.com" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas par où commencer**

Pense à 3 adjectifs qui te représentent (ex: "énergique, créatif, accessible")
et transforme-les directement en ambiance musicale :

\`\`\`
Musique courte et énergique, ambiance créative et accessible,
instruments modernes, parfaite comme intro de présentation.
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et crée son premier jingle avec Suno, en appliquant les 5 ingrédients de prompt musical (genre/ambiance/instruments/voix/tempo) et en comparant les versions proposées avant de choisir.
S'il bloque sur le prompt, aide-le/la à transformer une émotion ou une ambiance vague ("je veux que ça sonne cool") en ingrédients concrets (quel genre ? quels instruments ? quel tempo ?). S'il hésite entre deux versions générées, encourage-le/la à les réécouter en se demandant laquelle représente le mieux SON identité, pas juste laquelle "sonne mieux" dans l'absolu.
Reste dans l'esprit du systemPrompt du cours : encourageant, langage simple, valorise toute tentative même imparfaite.`,

            niveau_3_md: `
🛠️ **Exemple de prompt complet, à adapter :**

\`\`\`
Jingle court et dynamique, style pop électro moderne, ambiance positive
et confiante, synthés légers et percussions énergiques, sans paroles
ou avec un simple "ah-ah" vocal en fond, parfait pour ouvrir une
présentation créative.
\`\`\`

Adapte le style musical à TA personnalité — il n'y a pas de bonne
réponse universelle, seulement celle qui te représente le mieux.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 6 : Le Département Musique...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 6 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch6-quizz             (type: quizz — 4 questions modes/ingrédients/actions)");
    console.log("  - studio-ch6-mission-jingle    (type: creative — submission_type: both)");
}

seed();
