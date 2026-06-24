const admin = require('firebase-admin');

// Fix projet — cible explicitement le projet de production
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// STUDIO CRÉATIF — Chapitre 8 : Le Showreel Final
// course_id : "studio-creatif"
//
// 2 exercices :
//   studio-ch8-quizz    : Quizz récapitulatif (1 question par département)
//   studio-ch8-mission  : Mission créative finale (Showreel + réflexion)
// ============================================================

const COURSE_ID = "studio-creatif";
const CHAPITRE  = "Niveau 8 : Le Showreel Final";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — récapitulatif transversal de tout le cours
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch8-quizz",
        titre: "Le Grand Récapitulatif",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Quand l'IA invente une information fausse avec assurance, on appelle ça...",
                options: ["Un bug", "Une hallucination", "Une mise à jour", "Un crash"],
                correctAnswer: 1,
                successMessage: "Toujours bon de s'en souvenir avant de quitter le Studio !"
            },
            {
                question: "Quelle est la bonne méthode pour écrire avec l'IA, vue au Département Écriture ?",
                options: [
                    "Copier-coller sans rien changer",
                    "Donner ses idées en vrac, puis relire et personnaliser",
                    "Ne jamais utiliser l'IA pour écrire",
                    "Laisser l'IA inventer entièrement le contenu"
                ],
                correctAnswer: 1,
                successMessage: "Exact ! Tes idées + l'aide de l'IA + ta relecture = le bon équilibre."
            },
            {
                question: "Pour un logo avec du texte bien lisible, quel outil du Département Image est le plus adapté ?",
                options: ["Gemini", "Ideogram", "Suno", "Google Vids"],
                correctAnswer: 1,
                successMessage: "Ideogram reste la référence pour le texte lisible dans une image générée."
            },
            {
                question: "Quelle option du Département Vidéo permet de présenter sans te filmer toi-même ?",
                options: ["Le téléprompteur", "Un avatar IA", "Les sous-titres automatiques", "Le mode personnalisé"],
                correctAnswer: 1,
                successMessage: "Exact ! L'avatar IA peut lire ton script à ta place, sans aucune caméra braquée sur toi."
            },
            {
                question: "Quel est le point commun entre un bon prompt d'image, de présentation, de musique et de vidéo ?",
                options: [
                    "Il faut toujours utiliser le même outil pour tout",
                    "Plus la description est précise (sujet, style, ambiance...), meilleur est le résultat",
                    "Il n'y a aucun point commun, chaque outil fonctionne différemment",
                    "Un bon prompt doit toujours faire au moins 200 mots"
                ],
                correctAnswer: 1,
                successMessage: "Exactement ! C'est LA compétence transversale que tu gardes après ce cours : décrire précisément ce que tu veux."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // MISSION CRÉATIVE FINALE — Workspace Créatif
    // ────────────────────────────────────────────────────────────────
    {
        id: "studio-ch8-mission-showreel",
        titre: "Ton Showreel Final",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "creative",

        enonce_md: `
### 🎓 Mission finale : assemble ton Showreel

1. Reprends ta présentation du Niveau 5 (ou crée-en une nouvelle) et
   enrichis-la avec :
   - Ton logo (Niveau 4)
   - Le lien vers ta vidéo de présentation (Niveau 7)
   - Le lien vers ton jingle (Niveau 6)
2. Ajoute une slide "Mon parcours" avec ta réflexion finale :
   - Quel département t'a le plus surpris·e ?
   - Quelle création préfères-tu, et pourquoi ?
   - Qu'est-ce que tu garderas après ce cours ?
3. Dépose le lien de ton Showreel final, et colle ta réflexion en texte
   dans le champ ci-dessous.

> 🏆 Une fois cette mission soumise, tu es officiellement diplômé·e du
> Studio Créatif !
        `.trim(),

        theorie_md: `
### Structure suggérée du Showreel

\`\`\`
1. Titre (nom + logo)
2. Qui je suis (texte du Niveau 3)
3. Ma vidéo de présentation (lien Niveau 7)
4. Mon identité sonore (lien jingle Niveau 6)
5. Mon parcours dans le Studio Créatif (réflexion)
6. Merci / Contact
\`\`\`

---

### Pas besoin de repartir de zéro

Le Showreel n'est pas un nouveau projet — c'est l'**enrichissement** de
ta présentation du Niveau 5. Ouvre-la, ajoute les slides manquantes,
et voilà.
        `.trim(),

        submission_type: "both",

        external_tools: [
            { "name": "Google Slides", "url": "https://slides.google.com" }
        ],

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Si tu ne sais pas par où commencer**

Ouvre directement ta présentation du Niveau 5. Ajoute simplement 2 nouvelles
slides à la fin : une avec tes liens (vidéo + jingle), une avec ta réflexion.
Pas besoin de redesigner tout le reste.
            `.trim(),

            niveau_2_prompt: `L'élève termine le cours Studio Créatif et assemble son Showreel final, qui réunit toutes ses créations précédentes (texte CH3, logo CH4, présentation CH5, jingle CH6, vidéo CH7) plus une réflexion personnelle sur son parcours.
Si l'élève bloque, rappelle-lui qu'il n'a pas besoin de tout recréer — juste d'enrichir sa présentation du Niveau 5 avec les liens vers ses créations plus récentes. Encourage une vraie réflexion personnelle plutôt qu'une réponse générique aux 3 questions de la mission 3.
Reste dans l'esprit du systemPrompt du cours, mais avec une touche supplémentaire de fierté et de célébration — c'est la toute dernière mission du parcours, le ton doit refléter l'aboutissement.`,

            niveau_3_md: `
🛠️ **Exemple de réflexion finale, à titre indicatif :**

"Le département qui m'a le plus surpris·e, c'est la musique — je ne
pensais vraiment pas pouvoir 'composer' quoi que ce soit un jour, et
pourtant j'ai un jingle qui me représente vraiment. Ma création préférée
reste mon logo, parce que je le retrouve maintenant sur toutes mes
autres créations. Ce que je garderai après ce cours, c'est le réflexe
de toujours vérifier les informations importantes données par une IA,
et de ne jamais juste accepter le premier résultat — toujours itérer
un peu pour que ça me ressemble vraiment."

Ta réflexion sera différente — et c'est exactement le but : qu'elle
te ressemble, à toi, et à ton parcours.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 8 : Le Showreel Final...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("\n✨ ════════════════════════════════════════");
    console.log("   STUDIO CRÉATIF : COURS COMPLET TERMINÉ");
    console.log("   8 niveaux | 8 quizz | 7 missions créatives");
    console.log("   ════════════════════════════════════════");
    console.log("\nExercices CH8 créés :");
    console.log("  - studio-ch8-quizz                (type: quizz — 5 questions récap transversal)");
    console.log("  - studio-ch8-mission-showreel      (type: creative — submission_type: both, mission finale)");
}

seed();
