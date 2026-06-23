const admin = require('firebase-admin');

// ════════════════════════════════════════════════════════════════════
// FIX PROJET : cible explicitement le projet de production pour éviter
// que les credentials par défaut ne pointent vers le mauvais projet GCP
// (ex: "gatgent" au lieu de "profassistant-61fde") — API Firestore
// désactivée sinon. Adapte le projectId si besoin.
// ════════════════════════════════════════════════════════════════════
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 2 : Arborescence et navigation
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch2-quizz   : Quizz théorique (lecture de chemins, relatif/absolu)
//   web-ch2-ex1     : Exercice de code (menu de navigation multi-pages)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH2 — Arborescence et navigation";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch2-quizz",
        titre: "Quizz — Lire une arborescence",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question:
`Voici l'arborescence d'un site :

site/
  index.html
  style.css
  images/
    photo.jpg
  pages/
    apropos.html
    contact.html

Depuis index.html, quel est le chemin correct pour lier vers apropos.html ?`,
                options: ["apropos.html", "pages/apropos.html", "../pages/apropos.html", "/pages/apropos.html"],
                correctAnswer: 1,
                successMessage: "✅ Exact ! apropos.html est dans le sous-dossier pages/, donc on descend : pages/apropos.html."
            },
            {
                question:
`Même arborescence que précédemment.

Depuis pages/apropos.html, quel est le chemin correct pour revenir à index.html ?`,
                options: ["index.html", "../index.html", "pages/index.html", "../../index.html"],
                correctAnswer: 1,
                successMessage: "✅ Correct ! On est dans pages/, il faut remonter d'un niveau avec ../ pour atteindre la racine."
            },
            {
                question:
`Même arborescence que précédemment.

Depuis index.html, quel est le chemin correct pour afficher l'image photo.jpg ?`,
                options: ["photo.jpg", "images/photo.jpg", "../images/photo.jpg", "image/photo.jpg"],
                correctAnswer: 1,
                successMessage: "✅ Oui ! On descend simplement dans le sous-dossier images/ depuis la racine."
            },
            {
                question:
`Même arborescence que précédemment.

Depuis pages/contact.html, quel est le chemin correct pour afficher l'image photo.jpg ?`,
                options: ["images/photo.jpg", "../images/photo.jpg", "photo.jpg", "../photo.jpg"],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Il faut d'abord remonter à la racine (../) avant de redescendre dans images/."
            },
            {
                question:
`Même arborescence que précédemment.

Depuis pages/apropos.html, quel est le chemin correct pour lier vers contact.html (qui se trouve dans le MÊME dossier) ?`,
                options: ["contact.html", "pages/contact.html", "../contact.html", "../pages/contact.html"],
                correctAnswer: 0,
                successMessage: "✅ Parfait ! Même dossier = pas besoin de chemin, juste le nom du fichier."
            },
            {
                question: "Quelle affirmation décrit correctement un lien ABSOLU ?",
                options: [
                    "Il est utilisé uniquement pour les liens internes au site",
                    "Il donne l'adresse complète depuis la racine d'Internet — utilisé pour les sites externes",
                    "Il commence toujours par ../",
                    "Il ne fonctionne pas avec la balise <a>"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Un lien absolu (https://...) pointe vers une ressource externe à ton site."
            },
            {
                question: "Quel attribut de la balise <a> permet d'ouvrir le lien dans un nouvel onglet ?",
                options: ['newtab="true"', 'target="_blank"', 'open="new"', 'href="_blank"'],
                correctAnswer: 1,
                successMessage: '✅ target="_blank" ouvre le lien dans un nouvel onglet, sans faire quitter ton site au visiteur.'
            },
            {
                question: "Quel préfixe utiliser dans href pour qu'un lien ouvre directement le logiciel de messagerie ?",
                options: ["tel:", "mailto:", "email:", "href:"],
                correctAnswer: 1,
                successMessage: "✅ mailto: déclenche l'ouverture du client email par défaut avec l'adresse pré-remplie."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer / Transférer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch2-ex1-menu-navigation",
        titre: "Construire un menu de navigation",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🧭 Construis le menu de navigation de ton portfolio

Imagine que tu construis un portfolio avec l'arborescence suivante :

\`\`\`
mon-portfolio/
├── index.html        ← le fichier sur lequel tu travailles dans cet exercice
├── style.css
├── images/
│   └── avatar.png
└── pages/
    ├── projets.html
    └── contact.html
\`\`\`

Tu travailles dans \`index.html\`, **à la racine**. Travaille dans l'**onglet HTML**.

### 📝 Consignes

1. Crée un squelette HTML valide complet (DOCTYPE, html, head avec meta charset UTF-8
   et title, body).
2. Dans le \`<body>\`, ajoute un élément \`<nav>\` contenant :
   - Un lien vers \`projets.html\` (dans le dossier \`pages/\`)
   - Un lien vers \`contact.html\` (dans le dossier \`pages/\`)
   - Un lien **externe** vers un site d'inspiration de ton choix (ex: behance.net,
     dribbble.com...), qui s'ouvre dans un **nouvel onglet**
3. Affiche l'image \`avatar.png\` (dans le dossier \`images/\`) avec la balise \`<img>\`
   — n'oublie pas l'attribut \`alt\`.
4. Ajoute un lien \`mailto:\` vers une adresse email de ton choix.
5. Vérifie bien que **chaque chemin correspond exactement** à la position réelle
   du fichier dans l'arborescence donnée — c'est le cœur de l'exercice.

> 💡 Comme tu travailles dans \`index.html\` à la racine, les chemins vers \`pages/\`
> et \`images/\` se font simplement en **descendant** — aucun \`../\` n'est nécessaire ici.
        `.trim(),

        theorie_md: `
### Chemins relatifs depuis la racine

Si ton fichier actuel est à la racine du projet (comme \`index.html\` ici),
pour atteindre un fichier dans un sous-dossier, on écrit simplement :

\`\`\`html
<a href="pages/contact.html">Contact</a>
<img src="images/avatar.png" alt="Mon avatar">
\`\`\`

Pas besoin de \`../\` puisqu'on ne fait que descendre dans l'arborescence.

---

### Lien externe avec nouvel onglet

\`\`\`html
<a href="https://www.behance.net" target="_blank">Mon inspiration</a>
\`\`\`

Un lien externe utilise toujours un **chemin absolu** (l'URL complète),
jamais un chemin relatif.

---

### Lien mailto

\`\`\`html
<a href="mailto:moi@exemple.com">Me contacter</a>
\`\`\`

---

### La balise nav

\`<nav>\` est une balise sémantique HTML5 qui regroupe les liens de navigation
principaux d'une page. On la détaillera davantage dans un chapitre ultérieur,
mais tu peux déjà l'utiliser dès maintenant comme conteneur de menu.
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure du nav**

\`\`\`html
<nav>
    <a href="pages/projets.html">Mes projets</a>
    <a href="pages/contact.html">Contact</a>
    <a href="https://www.behance.net" target="_blank">Inspiration</a>
</nav>
\`\`\`

Pour l'image et le mailto, suis le même principe : chemin relatif pour
les ressources internes, syntaxe spéciale pour mailto.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de navigation HTML : construire un menu <nav> dans index.html (à la racine d'une arborescence donnée), avec des liens relatifs corrects vers pages/projets.html et pages/contact.html, un lien externe absolu avec target="_blank", une image avec chemin relatif vers images/avatar.png et un attribut alt, et un lien mailto:.
L'arborescence de référence : mon-portfolio/ contient index.html, style.css, images/avatar.png, pages/projets.html, pages/contact.html. Le fichier travaillé est index.html à la racine.
Analyse le code HTML soumis. Vérifie : les chemins relatifs vers pages/ sont corrects (pas de ../ inutile puisqu'on est à la racine), le lien externe est une URL absolue complète avec target="_blank", l'image a un chemin correct vers images/ et un attribut alt non vide, le mailto: est bien formé.
Si une erreur de chemin est présente, pose une question qui aide l'élève à retracer mentalement l'arborescence, sans donner directement la correction.`,

            niveau_3_md: `
🛠️ **Exemple de solution complète :**

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Portfolio</title>
</head>
<body>

    <nav>
        <a href="pages/projets.html">Mes projets</a>
        <a href="pages/contact.html">Contact</a>
        <a href="https://www.behance.net" target="_blank">Mon inspiration</a>
    </nav>

    <img src="images/avatar.png" alt="Photo de profil">

    <a href="mailto:moi@exemple.com">Me contacter par email</a>

</body>
</html>
\`\`\`

Remarque que tous les chemins internes (\`pages/...\`, \`images/...\`) ne contiennent
aucun \`../\` — logique, puisqu'on part de la racine et qu'on ne fait que descendre.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 2 : Arborescence et navigation...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 2 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch2-quizz                  (type: quizz — 8 questions sur les chemins)");
    console.log("  - web-ch2-ex1-menu-navigation    (type: code — nav, liens relatifs/absolus, mailto)");
}

seed();
