const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 7 : Le Département Vidéo
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch7-quizz    : Quizz théorique (avatar, ingrédients, son/sous-titres)
//   studio-ch7-mission  : Mission créative (vidéo de présentation 60-90s)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 7 : Le Département Vidéo";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — validation de compréhension
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch7-quizz",
        titre: "Validation du Niveau 7",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Tu n'as pas envie de te filmer toi-même pour ta vidéo. Quelle option Google Vids propose ?",
                options: [
                    "Aucune solution, il faut obligatoirement se filmer",
                    "Un avatar IA qui peut lire ton script à ta place",
                    "Il faut demander à quelqu'un d'autre de le faire",
                    "Une vidéo sans aucune voix n'est pas possible"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Un avatar IA peut présenter ton script avec des expressions naturelles, sans que tu apparaisses."
            },
            {
                question: "Qu'est-ce qu'un téléprompteur, dans le contexte de Google Vids ?",
                options: [
                    "Un logiciel de montage avancé",
                    "Un outil qui fait défiler ton texte à l'écran pendant que tu t'enregistres",
                    "Une fonction qui traduit automatiquement la vidéo",
                    "Un type de musique de fond"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Plus besoin d'apprendre ton texte par cœur — il défile devant toi pendant l'enregistrement."
            },
            {
                question: "Pour la musique de fond de ta vidéo de présentation, quelle option est suggérée pour rester cohérent avec ton portfolio ?",
                options: [
                    "Toujours utiliser une musique trouvée au hasard sur Internet",
                    "Réutiliser le jingle créé avec Suno au Niveau 6",
                    "Ne jamais mettre de musique sur une vidéo de présentation",
                    "Utiliser uniquement le silence"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Réutiliser ton jingle renforce la cohérence de ton identité à travers tout ton portfolio."
            },
            {
                question: "Pourquoi activer les sous-titres automatiques sur ta vidéo ?",
                options: [
                    "Ce n'est jamais utile",
                    "Ça rend la vidéo plus accessible et plus professionnelle visuellement",
                    "C'est obligatoire légalement pour toute vidéo",
                    "Cela ralentit énormément la vidéo"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Accessibilité (malentendants, visionnage sans son) et look professionnel — un vrai double bénéfice."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch7-mission-video",
        titre: "Ta vidéo de présentation",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🎬 Mission : crée ta vidéo de présentation (60-90 secondes)

1. Choisis ton approche : toi-même avec le téléprompteur, ou un avatar IA.
2. Adapte ton texte de présentation du Niveau 3 en script oral (phrases
   courtes, naturelles à l'oral).
3. Ajoute ta musique de fond : ton jingle Suno (Niveau 6), ou une
   génération directe dans Vids.
4. Active les sous-titres automatiques.
5. Dépose le lien de partage de ta vidéo et le script/prompt utilisé.

> 💡 Vise 60 à 90 secondes — assez pour te présenter, pas trop long pour
> garder l'attention.
        `.trim(),

        theorie_md: `
### Adapter un texte écrit en script oral

Un texte écrit (Niveau 3) et un texte parlé ne sonnent pas pareil. Quelques ajustements :

\`\`\`
Écrit : "Je suis quelqu'un de créatif et patient, j'aime dessiner et
aider les autres à résoudre leurs petits problèmes du quotidien."

Oral  : "Salut, moi c'est [prénom]. Je suis quelqu'un de créatif.
J'aime dessiner. J'aime aussi aider les autres. C'est un peu mon truc."
\`\`\`

Des phrases plus courtes, plus naturelles à dire à voix haute.

---

### Checklist avant de soumettre

- [ ] As-tu choisi entre toi-même et un avatar IA ?
- [ ] Ton script est-il adapté à l'oral (phrases courtes) ?
- [ ] As-tu ajouté une musique de fond ?
- [ ] Les sous-titres sont-ils activés ?
- [ ] La durée est-elle entre 60 et 90 secondes ?
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Google Vids", "url": "https://vids.google.com" },
            { "name": "Suno", "url": "https://suno.com" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu hésites entre toi-même et un avatar**

Pose-toi juste cette question : *"Est-ce que ça me stresse de me filmer ?"*
Si oui, l'avatar IA est fait pour toi — il n'y a aucune honte à choisir
cette option, beaucoup de professionnels l'utilisent aussi.
            `.trim(),

            niveau_2_prompt: `L'élève débute en informatique et crée sa première vidéo de présentation (60-90s) avec Google Vids, en adaptant son texte du CH3 en script oral, ajoutant une musique de fond (idéalement son jingle Suno du CH6) et des sous-titres.
S'il bloque sur l'adaptation du texte écrit en oral, aide-le/la à raccourcir les phrases et à les rendre plus naturelles à dire à voix haute. S'il hésite entre se filmer et utiliser un avatar, rassure-le/la : aucun choix n'est meilleur que l'autre, l'important est son confort.
Reste dans l'esprit du systemPrompt du cours : encourageant, langage simple, valorise le courage de produire une vidéo même imparfaite.`,

            niveau_3_md: `
🛠️ **Exemple de script oral adapté, à ajuster :**

\`\`\`
Salut, moi c'est Alex !

Je suis créatif, curieux, et j'apprends vite. J'aime le dessin et
résoudre des petits problèmes du quotidien.

Depuis quelques semaines, j'apprends à utiliser l'informatique et
l'intelligence artificielle. Et honnêtement ? Je suis plutôt fier de
ce que j'ai déjà réussi à créer.

Plus tard, j'aimerais travailler dans le graphisme. Ce cours, c'est
ma première vraie étape vers ça.

Merci d'avoir regardé !
\`\`\`

Adapte avec tes propres mots — l'important est que ça sonne vraiment
comme toi quand tu le lis à voix haute.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 7 : Le Département Vidéo...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 7 (Studio Créatif) terminé !");
    console.log("\nExercices créés :");
    console.log("  - studio-ch7-quizz             (type: quizz — 4 questions avatar/ingrédients/son)");
    console.log("  - studio-ch7-mission-video     (type: creative — submission_type: both)");
}

seed();
