const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 5 : Display et Flexbox
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch5-quizz   : Quizz théorique (axes, justify-content, align-items, wrap)
//   web-ch5-ex1     : Exercice de code (barre de navigation flexbox)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH5 — Display et Flexbox";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch5-quizz",
        titre: "Quizz — Flexbox",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Quelle propriété active Flexbox sur un conteneur ?",
                options: ["flex: true;", "display: flex;", "position: flex;", "layout: flex;"],
                correctAnswer: 1,
                successMessage: "✅ display: flex; transforme le conteneur et tous ses enfants directs en contexte flexible."
            },
            {
                question: "En flex-direction: row (la valeur par défaut), quel est l'axe PRINCIPAL ?",
                options: ["Vertical", "Horizontal", "Diagonal", "Cela dépend du contenu"],
                correctAnswer: 1,
                successMessage: "✅ Avec row, l'axe principal est horizontal — les éléments s'alignent de gauche à droite."
            },
            {
                question: "Quelle propriété contrôle la répartition des éléments sur l'axe PRINCIPAL ?",
                options: ["align-items", "justify-content", "flex-wrap", "gap"],
                correctAnswer: 1,
                successMessage: "✅ justify-content gère la répartition sur l'axe principal — flex-start, center, space-between..."
            },
            {
                question: "Quelle propriété contrôle l'alignement sur l'axe SECONDAIRE (perpendiculaire) ?",
                options: ["justify-content", "align-items", "flex-direction", "order"],
                correctAnswer: 1,
                successMessage: "✅ align-items aligne sur l'axe secondaire — par exemple verticalement quand la direction est row."
            },
            {
                question: "Tu passes flex-direction de row à column. Que se passe-t-il pour justify-content et align-items ?",
                options: [
                    "Rien ne change",
                    "Ils échangent leurs rôles, car l'axe principal devient vertical",
                    "align-items devient inutile",
                    "Il faut utiliser grid à la place"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! En column, l'axe principal devient vertical — justify-content gère alors le haut/bas, align-items le gauche/droite."
            },
            {
                question: "Quelle propriété permet d'espacer les éléments flex SANS toucher aux bords extérieurs du conteneur ?",
                options: ["margin", "padding", "gap", "border-spacing"],
                correctAnswer: 2,
                successMessage: "✅ gap espace uniquement ENTRE les éléments, contrairement à margin qui affecterait aussi les bords."
            },
            {
                question: "Par défaut (sans flex-wrap), que se passe-t-il si trop d'éléments flex ne rentrent pas sur une ligne ?",
                options: [
                    "Ils passent automatiquement à la ligne suivante",
                    "Ils sont rétrécis pour tous rentrer sur la même ligne",
                    "Une scrollbar apparaît automatiquement",
                    "Une erreur CSS est levée"
                ],
                correctAnswer: 1,
                successMessage: "✅ Par défaut (flex-wrap: nowrap), Flexbox essaie de tout faire rentrer sur une seule ligne, même en rétrécissant les éléments."
            },
            {
                question: "Quelle est la différence entre display: none et visibility: hidden ?",
                options: [
                    "Aucune différence, ce sont des synonymes",
                    "display: none supprime l'espace réservé, visibility: hidden le conserve",
                    "visibility: hidden supprime l'espace réservé, display: none le conserve",
                    "display: none ne fonctionne que sur les images"
                ],
                correctAnswer: 1,
                successMessage: "✅ display: none retire complètement l'élément (aucun espace), visibility: hidden le rend juste invisible mais garde sa place."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch5-ex1-navbar-flexbox",
        titre: "Construire une barre de navigation",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🧭 Construis une vraie barre de navigation avec Flexbox

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ma barre de navigation</title>
</head>
<body>

    <nav class="navbar">
        <div class="logo">MonSite</div>
        <div class="liens">
            <a href="#">Accueil</a>
            <a href="#">Projets</a>
            <a href="#">Contact</a>
        </div>
    </nav>

</body>
</html>
\`\`\`

C'est LE cas d'usage le plus courant de Flexbox sur le web entier — presque
chaque site a une barre de navigation construite exactement comme celle-ci.

### 📝 Consignes

**Sur \`.navbar\` :**
1. Active Flexbox (\`display: flex\`).
2. Place le logo à gauche et les liens à droite, avec un maximum d'espace
   entre les deux (\`justify-content\`).
3. Centre verticalement le logo et les liens l'un par rapport à l'autre
   (\`align-items\`).
4. Ajoute un \`padding\` confortable et une couleur de fond.

**Sur \`.liens\` (oui, un DEUXIÈME conteneur flex, imbriqué dans le premier !) :**
5. Active Flexbox également sur \`.liens\` pour aligner les 3 liens en ligne.
6. Utilise \`gap\` pour espacer les liens entre eux, sans toucher aux bords.

**Sur les \`<a>\` à l'intérieur de \`.liens\` :**
7. Retire le souligné par défaut (\`text-decoration: none\`).
8. Donne-leur une couleur qui contraste bien avec le fond de la navbar.

> 💡 Un conteneur flex peut très bien contenir un autre conteneur flex à
> l'intérieur — c'est exactement ce qui se passe ici : \`.navbar\` ET \`.liens\`
> sont chacun des contextes flex séparés, avec leurs propres réglages.
        `.trim(),

        theorie_md: `
### Flexbox imbriqué (deux conteneurs flex distincts)

\`\`\`css
.navbar {
    display: flex;
    justify-content: space-between;   /* logo à gauche, liens à droite */
    align-items: center;              /* alignés verticalement */
    padding: 16px 24px;
    background-color: #1a1a2e;
}

.liens {
    display: flex;       /* .liens devient AUSSI un conteneur flex */
    gap: 20px;            /* espace entre chaque lien */
}
\`\`\`

---

### Styliser les liens à l'intérieur

\`\`\`css
.liens a {
    color: white;
    text-decoration: none;
}
\`\`\`

---

### Rappel — justify-content: space-between

\`\`\`
┌────────────────────────────────────────┐
│[Logo]                    [Liens]       │
└────────────────────────────────────────┘
\`\`\`

Les deux éléments sont poussés chacun vers un bord, l'espace au milieu
se répartit automatiquement.
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Les deux conteneurs flex**

\`\`\`css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: #1a1a2e;
}

.liens {
    display: flex;
    gap: 20px;
}

.liens a {
    color: white;
    text-decoration: none;
}
\`\`\`

Vérifie bien que tu as appliqué \`display: flex\` à **deux endroits différents** :
\`.navbar\` ET \`.liens\`.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de navbar Flexbox imbriquée en CSS : .navbar (display:flex, justify-content:space-between, align-items:center, padding, background-color) ET .liens (display:flex, gap), plus .liens a (text-decoration:none, color contrastée).
Le code reçu combine HTML+CSS — analyse uniquement le CSS, en relation avec le HTML donné (.navbar contient .logo et .liens, .liens contient 3 <a>).
Erreur fréquente à surveiller : l'élève applique display:flex uniquement sur .navbar et oublie que .liens a aussi besoin de son propre display:flex pour que gap fonctionne entre les liens. Une autre erreur fréquente : confondre justify-content et align-items entre eux.
Si .liens n'a pas display:flex, pose une question qui aide l'élève à comprendre que gap seul ne suffit pas sans activer flex sur ce conteneur précis, sans donner directement la solution.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: #1a1a2e;
}

.logo {
    color: white;
    font-weight: bold;
    font-size: 1.3rem;
}

.liens {
    display: flex;
    gap: 20px;
}

.liens a {
    color: white;
    text-decoration: none;
}

.liens a:hover {
    text-decoration: underline;
}
\`\`\`

**Remarque :** \`.liens a:hover\` n'était pas demandé explicitement, mais c'est
une petite touche qui rend la navbar plus agréable à utiliser — le visiteur
sait qu'il survole bien un lien cliquable.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 5 : Display et Flexbox...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 5 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch5-quizz                  (type: quizz — 8 questions flexbox)");
    console.log("  - web-ch5-ex1-navbar-flexbox     (type: code — flexbox imbriqué, navbar réelle)");
}

seed();
