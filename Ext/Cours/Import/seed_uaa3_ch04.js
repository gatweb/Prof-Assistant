const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 4 : Le modèle de boîte
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch4-quizz   : Quizz théorique (couches, box-sizing, overflow, margin collapse)
//   web-ch4-ex1     : Exercice de code (notification "succès débloqué")
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH4 — Le modèle de boîte";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch4-quizz",
        titre: "Quizz — Le modèle de boîte",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Dans l'ordre, du plus intérieur au plus extérieur, quelles sont les 4 couches du modèle de boîte ?",
                options: [
                    "Margin → Border → Padding → Content",
                    "Content → Padding → Border → Margin",
                    "Content → Border → Padding → Margin",
                    "Padding → Content → Border → Margin"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Content au centre, puis Padding, puis Border, puis Margin tout autour."
            },
            {
                question: "Quelle couche du modèle de boîte prend la couleur de fond de l'élément ?",
                options: ["Margin uniquement", "Border uniquement", "Padding (avec le content)", "Aucune couche n'a de couleur"],
                correctAnswer: 2,
                successMessage: "✅ Le padding fait partie de la zone colorée par background-color — contrairement à la margin, toujours transparente."
            },
            {
                question: "Un élément a width: 300px, padding: 20px et border: 5px solid black, en box-sizing: content-box (défaut). Quelle est sa largeur RÉELLE affichée ?",
                options: ["300px", "320px", "330px", "350px"],
                correctAnswer: 3,
                successMessage: "✅ 300 + 20 + 20 (padding deux côtés) + 5 + 5 (border deux côtés) = 350px. C'est le piège classique du content-box !"
            },
            {
                question: "Avec box-sizing: border-box, qu'est-ce qui change ?",
                options: [
                    "width et height incluent désormais le padding et la bordure",
                    "Le padding disparaît",
                    "La bordure devient invisible",
                    "Rien, c'est juste un nom différent pour la même chose"
                ],
                correctAnswer: 0,
                successMessage: "✅ Avec border-box, la largeur totale reste exactement celle annoncée par width — plus de surprise !"
            },
            {
                question: "Pourquoi écrit-on souvent * { box-sizing: border-box; } en haut d'une feuille de style ?",
                options: [
                    "Pour accélérer le chargement de la page",
                    "Pour appliquer ce comportement prévisible à TOUS les éléments de la page d'un coup",
                    "C'est obligatoire en HTML5",
                    "Pour désactiver le CSS sur certains éléments"
                ],
                correctAnswer: 1,
                successMessage: "✅ Le sélecteur * cible tous les éléments — ce reset universel évite la quasi-totalité des bugs de dimensions."
            },
            {
                question: "Deux blocs verticaux ont margin-bottom: 30px et margin-top: 20px. Quel est l'écart final entre eux (fusion des marges) ?",
                options: ["50px (30+20)", "30px (la plus grande)", "20px (la plus petite)", "25px (la moyenne)"],
                correctAnswer: 1,
                successMessage: "✅ Les marges verticales fusionnent — seule la plus grande des deux (30px) s'applique, elles ne s'additionnent pas."
            },
            {
                question: "Quelle valeur d'overflow ajoute une scrollbar UNIQUEMENT si le contenu déborde réellement ?",
                options: ["hidden", "visible", "scroll", "auto"],
                correctAnswer: 3,
                successMessage: "✅ overflow: auto est le plus pratique — pas de scrollbar inutile si le contenu rentre déjà."
            },
            {
                question: "Quelle valeur de border-radius transforme un carré en cercle parfait ?",
                options: ["100px", "50%", "circle", "round"],
                correctAnswer: 1,
                successMessage: "✅ border-radius: 50% sur un élément carré donne un cercle parfait — la technique classique pour les avatars."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch4-ex1-notification-succes",
        titre: "Notification 'Succès débloqué'",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🏆 Construis une notification de succès (style jeu vidéo)

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Succès débloqué</title>
</head>
<body>

    <div class="notification">
        <h2>🏆 Succès débloqué !</h2>
        <p>Tu as terminé le chapitre sur le modèle de boîte.</p>
    </div>

</body>
</html>
\`\`\`

Maintenant, écris le **CSS** pour transformer cette boîte en une vraie notification
de jeu vidéo, comme celles qui apparaissent en haut de l'écran quand tu débloques un trophée.

### 📝 Consignes

1. Sur \`.notification\`, applique \`box-sizing: border-box\` directement
   (on verra le reset universel \`*\` plus tard, ici fais-le explicitement sur cette classe).
2. Donne une **largeur fixe** de \`350px\`.
3. Ajoute un **padding** de \`20px\` sur tous les côtés.
4. Ajoute une **bordure** de \`3px\`, de style \`solid\`, dans une couleur dorée
   (\`#d4af37\` par exemple).
5. Donne-lui un **fond** sombre (\`#1a1a2e\` par exemple) et un **texte clair**
   (\`color: white\` ou similaire).
6. Arrondis les angles avec \`border-radius\` (\`12px\` par exemple).
7. **Centre la notification horizontalement** sur la page avec la technique
   \`margin: 0 auto\` — et ajoute aussi un peu de \`margin-top\` pour la décoller
   du haut de la page.
8. **Vérifie** : grâce à \`box-sizing: border-box\`, la largeur totale affichée
   doit rester exactement 350px, même avec le padding et la bordure ajoutés.

> 💡 Si tu retires temporairement \`box-sizing: border-box\` pour observer la
> différence, tu verras la boîte s'élargir au-delà de 350px — exactement le
> piège vu dans le cours !
        `.trim(),

        theorie_md: `
### Appliquer box-sizing sur un élément précis

\`\`\`css
.notification {
    box-sizing: border-box;
    width: 350px;
}
\`\`\`

---

### Padding, bordure et fond ensemble

\`\`\`css
.notification {
    padding: 20px;
    border: 3px solid gold;
    background-color: #1a1a2e;
    color: white;
}
\`\`\`

---

### Centrer horizontalement avec margin auto

\`\`\`css
.notification {
    width: 350px;
    margin: 20px auto;   /* 20px en haut/bas, centré automatiquement gauche/droite */
}
\`\`\`

---

### Arrondir les angles

\`\`\`css
.notification {
    border-radius: 12px;
}
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de base**

\`\`\`css
.notification {
    box-sizing: border-box;
    width: 350px;
    padding: 20px;
    border: 3px solid #d4af37;
    border-radius: 12px;
    background-color: #1a1a2e;
    color: white;
    margin: 20px auto;
}
\`\`\`

Vérifie chaque consigne une par une — il ne devrait te manquer que des ajustements
de couleur ou de valeurs précises.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice du modèle de boîte CSS : styliser une notification de jeu vidéo avec box-sizing:border-box, width:350px, padding:20px, border 3px solid doré, fond sombre, texte clair, border-radius, et centrage avec margin:auto.
Le code reçu combine HTML+CSS — analyse uniquement le CSS, en relation avec la classe .notification du HTML donné.
Points à vérifier : box-sizing:border-box explicitement présent, width:350px, padding sur tous les côtés (20px), border avec les 3 valeurs (épaisseur/style/couleur), background-color sombre, color clair pour contraste, border-radius présent, margin avec une valeur "auto" pour le centrage horizontal.
Si box-sizing est absent, souligne que la largeur totale ne sera pas exactement 350px (effet du content-box par défaut) sans donner directement "ajoute box-sizing:border-box" — pose plutôt une question qui le guide à se souvenir du cours.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
.notification {
    box-sizing: border-box;
    width: 350px;
    padding: 20px;
    border: 3px solid #d4af37;
    border-radius: 12px;
    background-color: #1a1a2e;
    color: white;
    margin: 20px auto;
}

.notification h2 {
    margin-top: 0;
}
\`\`\`

**Remarque :** \`margin-top: 0\` sur le \`h2\` n'était pas demandé explicitement,
mais évite un espace blanc inattendu en haut de la notification — les navigateurs
appliquent une marge par défaut sur les titres, qu'on neutralise souvent
volontairement dans une carte ou une boîte fermée comme celle-ci.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 4 : Le modèle de boîte...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 4 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch4-quizz                    (type: quizz — 8 questions box model)");
    console.log("  - web-ch4-ex1-notification-succes  (type: code — box-sizing, padding, border, margin auto)");
}

seed();
