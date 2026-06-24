const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 2 : Ton Assistant, Pas Ton Remplaçant
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch2-quizz    : Quizz théorique (hallucinations, confidentialité)
//   studio-ch2-mission  : Mission créative (Le Test du Détective)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 2 : Ton Assistant, Pas Ton Remplaçant";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch2-quizz",
        titre: "Validation du Niveau 2",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Qu'est-ce qu'une 'hallucination' de l'IA ?",
                options: [
                    "Un bug qui empêche l'IA de répondre",
                    "Quand l'IA invente une information fausse, mais la présente avec assurance",
                    "Un message d'erreur affiché à l'écran",
                    "Une fonctionnalité qu'on doit activer manuellement"
                ],
                correctAnswer: 1,
                successMessage: "Exactement ! Le piège, c'est que l'IA ne 'sonne' pas différemment quand elle invente — d'où l'importance de vérifier."
            },
            {
                question: "Tu demandes à l'IA une date historique précise. Que dois-tu faire ?",
                options: [
                    "Lui faire confiance les yeux fermés, elle a toujours raison",
                    "Vérifier cette information ailleurs avant de t'en servir sérieusement",
                    "Ne jamais poser ce type de question à une IA",
                    "Demander deux fois la même question à la même IA"
                ],
                correctAnswer: 1,
                successMessage: "Parfait réflexe ! Les faits précis (dates, chiffres, sources) se vérifient toujours ailleurs."
            },
            {
                question: "Que ne dois-tu JAMAIS taper dans une conversation avec une IA ?",
                options: [
                    "Une idée pour un projet créatif",
                    "Ton mot de passe ou ton numéro de carte bancaire",
                    "Une question sur un sujet que tu ne connais pas",
                    "Une demande de reformulation d'un texte"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Une IA n'est pas un coffre-fort — ne partage jamais d'informations sensibles avec elle."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif (réflexion, pas de production)
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch2-mission-detective",
        titre: "Le Test du Détective",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🕵️ Mission : piège l'IA et observe sa réaction

1. Ouvre **Gemini** ou **ChatGPT**.
2. Pose-lui une question sur quelque chose qui **n'existe pas** — par exemple,
   demande-lui de te parler d'une personne, d'un livre ou d'un événement
   totalement inventé (donne-lui un nom qui sonne crédible mais que tu as
   inventé de toutes pièces).
3. Observe attentivement sa réponse.
4. Dans le champ ci-dessous, raconte en quelques phrases ce qui s'est passé :
   - Est-ce que l'IA a inventé une réponse détaillée, comme si c'était vrai ?
   - Ou a-t-elle reconnu qu'elle ne connaissait pas ce sujet ?
   - Qu'est-ce que ça t'apprend sur la confiance à accorder à une IA ?

> 💡 Aucune création à produire cette fois — cette mission est une expérience
> à vivre et à raconter, pas un livrable à soigner visuellement.
        `.trim(),

        theorie_md: `
### Comment fabriquer un bon piège

Le meilleur piège invente un nom **crédible** mais **complètement faux** :

\`\`\`
"Parle-moi de Karim Vandersteen, l'inventeur belge du vélo solaire en 1987."
\`\`\`

Aucune de ces informations n'existe — mais le nom sonne réel, la date est
plausible, le sujet est crédible. C'est exactement ce type de question qui
révèle le mieux le comportement d'une IA face à l'inconnu.

---

### Ce qu'on observe généralement

La plupart des IA généralistes vont **inventer une réponse plausible**
plutôt que d'admettre directement ne pas connaître le sujet — c'est
précisément le phénomène d'hallucination expliqué dans la leçon.

Certaines IA plus récentes sont entraînées à dire "je ne trouve pas
d'information fiable sur ce sujet" — c'est un bon signe si tu observes
ça, mais ce n'est pas garanti à 100%.
        `.trim(),

        submission_type: "text",

        external_tools: [
            { "name": "Gemini", "url": "https://gemini.google.com" },
            { "name": "ChatGPT", "url": "https://chatgpt.com" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas quoi inventer**

Combine un prénom + nom courants de ta région avec un métier ou une
invention improbable mais plausible :
- "Sophie Lambert, la première femme à avoir traversé l'Atlantique à la nage en 1932"
- "le restaurant 'Chez Mariette' à Mouscron, fondé en 1850"

L'objectif : que ça sonne vrai, sans l'être du tout.
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et réalise une mission de réflexion sur les hallucinations de l'IA : il/elle doit inventer un nom/événement fictif crédible, le soumettre à une IA, observer la réponse, et décrire ce qu'il/elle a observé.
Si l'élève pose une question libre pendant cette mission, aide-le/la à analyser ce qu'il/elle a observé : la réponse de l'IA semblait-elle confiante ? A-t-elle inventé des détails précis (dates, lieux) ? A-t-elle exprimé un doute ?
Reste dans l'esprit du systemPrompt du cours (ton de mentor bienveillant, langage simple). N'oublie jamais que l'objectif pédagogique est de construire un réflexe de vérification, pas de faire peur à l'élève vis-à-vis de l'IA.`,

            niveau_3_md: `
🛠️ **Exemple de récit attendu (à titre indicatif) :**

"J'ai demandé à Gemini de me parler de 'Karim Vandersteen, inventeur du
vélo solaire en 1987'. L'IA m'a répondu avec plusieurs détails précis —
un parcours, une ville, même une anecdote — comme si cette personne
avait réellement existé. Elle n'a à aucun moment dit qu'elle n'était pas
sûre. Ça m'a fait comprendre qu'il faut toujours vérifier les informations
importantes ailleurs, même quand l'IA semble très sûre d'elle."

Ton récit n'a pas besoin d'être identique — l'essentiel est d'avoir
vraiment observé et réfléchi à ce qui s'est passé.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 2 : Ton Assistant, Pas Ton Remplaçant...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 2 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch2-quizz                (type: quizz — 3 questions hallucinations/confidentialité)");
    console.log("  - studio-ch2-mission-detective    (mission créative — submission_type: text)");
}

seed();
