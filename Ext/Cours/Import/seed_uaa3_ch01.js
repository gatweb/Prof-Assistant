const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 1 : Introduction au HTML
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch1-quizz   : Quizz théorique (vocabulaire + codes de caractères)
//   web-ch1-ex1     : Exercice de code (carte de présentation HTML)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH1 — Introduction au HTML";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch1-quizz",
        titre: "Quizz — Les bases du HTML",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Qu'est-ce qu'une balise orpheline (self-closing) ?",
                options: [
                    "Une balise qui n'a pas d'attribut",
                    "Une balise qui n'a pas de balise fermante, comme <br> ou <img>",
                    "Une balise qui ne peut contenir aucun texte",
                    "Une balise réservée au <head>"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! <br>, <img>, <meta> n'ont pas de contenu à fermer, donc pas de balise fermante."
            },
            {
                question: "Où se place un attribut dans une balise ?",
                options: [
                    "Entre la balise ouvrante et la balise fermante",
                    "Après la balise fermante",
                    "Dans la balise ouvrante uniquement",
                    "N'importe où dans le document"
                ],
                correctAnswer: 2,
                successMessage: "✅ Correct ! Un attribut se place toujours dans la balise OUVRANTE, sous la forme nom=\"valeur\"."
            },
            {
                question: "Quel élément contient le contenu VISIBLE d'une page HTML ?",
                options: ["<head>", "<title>", "<meta>", "<body>"],
                correctAnswer: 3,
                successMessage: "✅ Oui ! <body> contient tout ce que l'utilisateur voit. <head> contient les infos invisibles."
            },
            {
                question: "Pourquoi faut-il toujours déclarer <meta charset=\"UTF-8\"> ?",
                options: [
                    "Pour accélérer le chargement de la page",
                    "Pour que le navigateur sache comment interpréter les caractères (accents, emojis...)",
                    "C'est obligatoire pour le CSS",
                    "Pour activer le mode responsive"
                ],
                correctAnswer: 1,
                successMessage: "✅ Parfait ! Sans encodage correct, les caractères spéciaux s'affichent mal (mojibake)."
            },
            {
                question: "Combien de caractères l'encodage ASCII permet-il de représenter ?",
                options: ["56", "128", "256", "65536"],
                correctAnswer: 1,
                successMessage: "✅ 128 caractères — suffisant pour l'anglais de base, mais aucun accent ni emoji."
            },
            {
                question: "Quel encodage permet de représenter N'IMPORTE QUEL caractère (tous les alphabets, emojis...) ?",
                options: ["ASCII", "ISO 8859-1", "ISO 8859-15", "UTF-8"],
                correctAnswer: 3,
                successMessage: "✅ UTF-8 est le standard universel actuel — c'est celui à utiliser systématiquement."
            },
            {
                question: "Que se passe-t-il si on écrit un paragraphe avec plusieurs espaces ou retours à la ligne dans le code HTML ?",
                options: [
                    "Le navigateur affiche fidèlement tous les espaces et retours à la ligne",
                    "Le navigateur réduit les espaces multiples à un seul et ignore les retours à la ligne",
                    "Le navigateur affiche une erreur",
                    "Cela dépend du navigateur utilisé"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Pour forcer un saut de ligne visible, il faut utiliser la balise <br>."
            },
            {
                question: "Combien de fois peut-on utiliser <h1> sur une même page ?",
                options: [
                    "Autant de fois qu'on veut",
                    "Une seule fois (par page ou par section)",
                    "Maximum 6 fois",
                    "Jamais, h1 est obsolète"
                ],
                correctAnswer: 1,
                successMessage: "✅ Une seule fois ! C'est le titre le plus important de la page, les moteurs de recherche s'en servent."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch1-ex1-carte-presentation",
        titre: "Ma carte de présentation",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🪪 Crée ta carte de présentation

Construis une page HTML simple qui te présente. Travaille dans l'**onglet HTML**
(le CSS n'est pas nécessaire pour cet exercice — on l'aborde au chapitre 3).

### 📝 Consignes

1. Commence par un squelette HTML valide complet : \`<!DOCTYPE html>\`, \`<html lang="fr">\`,
   \`<head>\` avec \`<meta charset="UTF-8">\` et un \`<title>\`, puis \`<body>\`.
2. Dans le \`<body>\`, ajoute :
   - Un titre principal \`<h1>\` avec ton prénom
   - Un sous-titre \`<h2>\` du type "À propos de moi"
   - Au moins **2 paragraphes** \`<p>\` qui te présentent (tes passions, ce que tu apprends...)
   - Un troisième niveau de titre \`<h3>\` "Mes centres d'intérêt"
   - Une **liste** de tes centres d'intérêt (on n'a pas encore vu les listes en détail,
     mais essaie avec \`<ul>\` et \`<li>\` — cherche un exemple si besoin !)
3. Ajoute **au moins un commentaire** HTML pour expliquer une section de ton code.
4. **Indente correctement** tout ton code (chaque élément imbriqué décalé vers la droite).
5. Vérifie que tu n'utilises \`<h1>\` qu'**une seule fois**.

> 💡 Si tu veux inclure un caractère spécial (é, €, emoji...), vérifie que ton
> \`<meta charset="UTF-8">\` est bien présent — sinon, mauvaise surprise à l'affichage !
        `.trim(),

        theorie_md: `
### Le squelette HTML de base

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Titre de la page</title>
</head>
<body>

    <!-- Contenu ici -->

</body>
</html>
\`\`\`

---

### Titres et paragraphes

\`\`\`html
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<h3>Sous-sous-titre</h3>
<p>Un paragraphe de texte.</p>
\`\`\`

---

### Une liste à puces (préview du chapitre 9... mais utile dès maintenant !)

\`\`\`html
<ul>
    <li>Premier élément</li>
    <li>Deuxième élément</li>
    <li>Troisième élément</li>
</ul>
\`\`\`

---

### Codes de caractères

\`<meta charset="UTF-8">\` doit toujours être présent dans le \`<head>\` —
c'est ce qui permet d'afficher correctement les accents, le symbole €,
et tous les caractères spéciaux.

---

### Commentaires et indentation

\`\`\`html
<!-- Ceci est un commentaire, invisible sur la page -->
<body>
    <h1>Bien indenté</h1>
    <p>Chaque niveau d'imbrication est décalé.</p>
</body>
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de départ**

Commence toujours par le squelette complet avant d'ajouter du contenu :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ma carte de présentation</title>
</head>
<body>

    <h1>Ton prénom ici</h1>

</body>
</html>
\`\`\`

Ajoute ensuite les autres éléments un par un, à l'intérieur du \`<body>\`.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice HTML de base : construire une carte de présentation personnelle avec un squelette HTML valide complet.
Éléments attendus : DOCTYPE, html lang="fr", head avec meta charset UTF-8 et title, body contenant un seul h1 (prénom), un h2 (à propos), au moins 2 paragraphes, un h3 (centres d'intérêt), une liste ul/li, au moins un commentaire HTML, et une indentation cohérente.
Analyse le code HTML soumis par l'élève. Vérifie chaque point de la checklist. Si quelque chose manque ou est mal structuré (balise non fermée, h1 utilisé plusieurs fois, mauvaise imbrication, meta charset absent...), pose une question ciblée qui l'aide à identifier le problème lui-même, sans donner directement la correction. Reste encourageant, c'est un des premiers exercices HTML de l'élève.`,

            niveau_3_md: `
🛠️ **Exemple de structure complète :**

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Carte de présentation</title>
</head>
<body>

    <!-- Présentation principale -->
    <h1>Alex</h1>
    <h2>À propos de moi</h2>

    <p>Je suis élève en 3e année technique de transition informatique.</p>
    <p>J'aime le code, les jeux vidéo et la musique.</p>

    <!-- Centres d'intérêt -->
    <h3>Mes centres d'intérêt</h3>
    <ul>
        <li>Programmation</li>
        <li>Jeux vidéo</li>
        <li>Musique électronique</li>
    </ul>

</body>
</html>
\`\`\`

Adapte le contenu avec tes propres informations !
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 1 : Introduction au HTML...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 1 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch1-quizz                  (type: quizz — 8 questions théoriques)");
    console.log("  - web-ch1-ex1-carte-presentation (type: code — structure HTML complète)");
}

seed();
