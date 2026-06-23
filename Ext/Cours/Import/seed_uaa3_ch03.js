const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 3 : Introduction au CSS
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch3-quizz   : Quizz théorique (sélecteurs, méthodes, cascade)
//   web-ch3-ex1     : Exercice de code (styliser une carte de personnage)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH3 — Introduction au CSS";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch3-quizz",
        titre: "Quizz — Les bases du CSS",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Dans la règle CSS suivante, lequel est la PROPRIÉTÉ ?\n\np { color: blue; }",
                options: ["p", "color", "blue", "Le point-virgule"],
                correctAnswer: 1,
                successMessage: "✅ Exact ! color est la propriété — l'aspect qu'on modifie. blue est la valeur, p est le sélecteur."
            },
            {
                question: "Quel sélecteur cible TOUS les éléments <p> de la page, sans exception ?",
                options: [".p", "#p", "p", "*p"],
                correctAnswer: 2,
                successMessage: "✅ Un simple nom d'élément (sans point ni dièse) cible tous les éléments de ce type."
            },
            {
                question: "Comment écrit-on un sélecteur de CLASSE en CSS pour cibler class=\"alerte\" ?",
                options: ["alerte", "#alerte", ".alerte", "*alerte"],
                correctAnswer: 2,
                successMessage: "✅ Le point devant le nom indique un sélecteur de classe : .alerte"
            },
            {
                question: "Pourquoi privilégier les CLASSES plutôt que les ID dans la plupart des cas ?",
                options: [
                    "Les classes sont plus rapides à charger",
                    "Les classes peuvent être réutilisées sur plusieurs éléments, contrairement aux ID qui doivent être uniques",
                    "Les ID ne fonctionnent pas avec toutes les balises",
                    "Il n'y a aucune différence"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Un ID doit être unique sur la page, une classe peut s'appliquer à autant d'éléments que voulu."
            },
            {
                question: "Que fait ce sélecteur ? nav a { color: white; }",
                options: [
                    "Cible tous les liens <a> de la page",
                    "Cible uniquement les liens <a> qui se trouvent à l'intérieur d'un <nav>",
                    "Cible uniquement les <nav> qui contiennent un attribut a",
                    "Cette syntaxe est invalide"
                ],
                correctAnswer: 1,
                successMessage: "✅ L'espace entre deux sélecteurs crée un sélecteur DESCENDANT — il cible à l'intérieur, à toute profondeur."
            },
            {
                question: "Quelle est LA méthode recommandée pour lier du CSS à une page HTML ?",
                options: [
                    "L'attribut style en ligne sur chaque balise",
                    "La balise <style> dans le head",
                    "Un fichier .css externe lié avec <link>",
                    "Toutes ces méthodes sont équivalentes"
                ],
                correctAnswer: 2,
                successMessage: "✅ Un fichier externe permet de réutiliser le même style sur toutes les pages d'un site — c'est la bonne pratique."
            },
            {
                question: "Deux règles CSS ciblent le même élément avec la MÊME spécificité. Laquelle s'applique ?",
                options: [
                    "La première déclarée dans le fichier",
                    "La dernière déclarée dans le fichier",
                    "Les deux s'appliquent à parts égales",
                    "Le navigateur choisit au hasard"
                ],
                correctAnswer: 1,
                successMessage: "✅ À spécificité égale, c'est la cascade qui décide : la dernière règle déclarée gagne."
            },
            {
                question: "Entre p { color: blue; } et .important { color: red; }, lequel l'emporte sur <p class=\"important\">texte</p> ?",
                options: [
                    "p { color: blue; } car il est déclaré en premier",
                    ".important { color: red; } car un sélecteur de classe est plus spécifique qu'un sélecteur d'élément",
                    "Aucun des deux, le texte reste noir",
                    "Cela dépend du navigateur"
                ],
                correctAnswer: 1,
                successMessage: "✅ La spécificité prime sur l'ordre : un sélecteur de classe est toujours plus précis qu'un sélecteur d'élément seul."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch3-ex1-carte-personnage",
        titre: "Stylise ta carte de personnage",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🎨 Donne du style à une fiche de personnage

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Carte de personnage</title>
</head>
<body>

    <div class="carte">
        <h1 id="nom-perso">Kaelen</h1>
        <p class="info">Classe : Guerrier</p>
        <p class="info">Niveau : 12</p>
        <p class="citation">"La victoire appartient aux plus tenaces."</p>
    </div>

</body>
</html>
\`\`\`

Maintenant, écris le **CSS** dans l'onglet CSS pour styliser cette carte.

### 📝 Consignes

1. **Sélecteur d'élément** — Cible tous les \`<p>\` pour leur donner une couleur de
   texte gris foncé (\`#333\` par exemple).
2. **Sélecteur de classe** — Cible \`.info\` pour mettre ce texte en gras (\`font-weight: bold\`).
3. **Sélecteur d'id** — Cible \`#nom-perso\` pour lui donner une couleur différente
   et une taille de police plus grande que la normale.
4. **Sélecteur de classe** — Cible \`.citation\` pour le mettre en italique
   (\`font-style: italic\`).
5. **Sélecteur de classe** — Cible \`.carte\` (le conteneur) pour lui donner :
   - une couleur de fond
   - une bordure
   - un espace intérieur (\`padding\`)
6. **Sélecteur de groupe** — Utilise une seule règle groupée pour appliquer la
   **même police** (\`font-family\`) à la fois au \`h1\` et aux \`p\`.
7. Ajoute **au moins un commentaire CSS** pour expliquer une section de ton code.

> 💡 Rappelle-toi : \`.info\` cible une CLASSE (donc avec un point), \`#nom-perso\`
> cible un ID (donc avec un dièse).
        `.trim(),

        theorie_md: `
### Les 3 sélecteurs de base

\`\`\`css
p { color: #333; }              /* élément — tous les <p> */
.info { font-weight: bold; }    /* classe — réutilisable */
#nom-perso { color: purple; }   /* id — unique sur la page */
\`\`\`

---

### Sélecteur de groupe

\`\`\`css
h1, p {
    font-family: Georgia, serif;
}
\`\`\`

Applique la même règle à plusieurs sélecteurs sans les répéter.

---

### Styliser un conteneur

\`\`\`css
.carte {
    background-color: #f4f4f4;
    border: 2px solid #ccc;
    padding: 16px;
}
\`\`\`

---

### Commentaire CSS

\`\`\`css
/* Style du conteneur principal */
.carte {
    /* ... */
}
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Démarre par les sélecteurs simples**

\`\`\`css
p {
    color: #333;
}

.info {
    font-weight: bold;
}

#nom-perso {
    color: purple;
    font-size: 2em;
}
\`\`\`

Continue avec \`.citation\`, \`.carte\`, puis termine par le sélecteur de groupe
pour \`h1\` et \`p\`.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de sélecteurs CSS de base : styliser une fiche de personnage avec sélecteur d'élément (p), deux sélecteurs de classe (.info, .citation), un sélecteur d'id (#nom-perso), un style de conteneur (.carte avec fond/bordure/padding), et un sélecteur groupé (h1, p) pour une police commune.
Le code reçu combine HTML+CSS — analyse uniquement le CSS, en le mettant en relation avec le HTML donné dans l'énoncé (carte/nom-perso/info/citation).
Vérifie : tous les sélecteurs utilisent la bonne syntaxe (. pour classe, # pour id, rien pour élément), chaque consigne est remplie, le sélecteur groupé utilise bien une virgule, au moins un commentaire est présent.
Si quelque chose manque ou utilise le mauvais type de sélecteur (ex: #info au lieu de .info), pose une question ciblée qui aide l'élève à repérer l'erreur sans donner la solution.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
/* Sélecteur de groupe : même police pour les titres et le texte */
h1, p {
    font-family: Georgia, serif;
}

/* Sélecteur d'élément : tous les paragraphes */
p {
    color: #333;
}

/* Sélecteur de classe : les lignes d'info en gras */
.info {
    font-weight: bold;
}

/* Sélecteur d'id : style unique pour le nom du personnage */
#nom-perso {
    color: purple;
    font-size: 2em;
}

/* Sélecteur de classe : la citation en italique */
.citation {
    font-style: italic;
}

/* Sélecteur de classe : le conteneur principal */
.carte {
    background-color: #f4f4f4;
    border: 2px solid #ccc;
    padding: 16px;
}
\`\`\`

Remarque que le sélecteur de groupe \`h1, p\` est déclaré séparément du sélecteur
\`p { color: #333; }\` — les deux coexistent sans conflit, ils définissent des
propriétés différentes (\`font-family\` vs \`color\`).
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 3 : Introduction au CSS...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 3 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch3-quizz                  (type: quizz — 8 questions sur sélecteurs et cascade)");
    console.log("  - web-ch3-ex1-carte-personnage   (type: code — élément/classe/id/groupe)");
}

seed();
