const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 6 : Couleurs et fonds
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch6-quizz   : Quizz théorique (bases 2/16, synthèse RGB, hexadécimal)
//   web-ch6-ex1     : Exercice de code (bannière dégradé + box-shadow)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH6 — Couleurs et fonds";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch6-quizz",
        titre: "Quizz — Bases numériques et couleurs",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Combien de chiffres différents utilise le système binaire (base 2) ?",
                options: ["2 (0 et 1)", "10 (0 à 9)", "16 (0 à F)", "8"],
                correctAnswer: 0,
                successMessage: "✅ Exact ! Le binaire n'utilise que 0 et 1 — les deux états électriques que peut détecter un ordinateur."
            },
            {
                question: "Que représente la lettre 'F' en hexadécimal ?",
                options: ["6 en décimal", "10 en décimal", "15 en décimal", "16 en décimal"],
                correctAnswer: 2,
                successMessage: "✅ A=10, B=11, C=12, D=13, E=14, F=15 — F est la plus grande valeur d'un seul chiffre hexadécimal."
            },
            {
                question: "Pourquoi un seul chiffre hexadécimal correspond-il exactement à 4 chiffres binaires ?",
                options: [
                    "C'est une coïncidence sans raison particulière",
                    "Parce que 4 bits permettent exactement 16 valeurs (2⁴=16), soit le nombre de symboles hexadécimaux",
                    "Parce que les ordinateurs préfèrent l'hexadécimal",
                    "Ce n'est pas vrai, il en faut 8"
                ],
                correctAnswer: 1,
                successMessage: "✅ 2⁴ = 16 — exactement le nombre de symboles hexadécimaux (0-9, A-F). C'est un alignement mathématique parfait."
            },
            {
                question: "Qu'est-ce que la synthèse ADDITIVE des couleurs ?",
                options: [
                    "Mélanger des peintures pour obtenir une nouvelle couleur",
                    "Combiner des lumières colorées (rouge, vert, bleu) — leur cumul total donne du blanc",
                    "Soustraire une couleur d'une image",
                    "Une technique exclusive à l'impression papier"
                ],
                correctAnswer: 1,
                successMessage: "✅ Les écrans émettent de la lumière — additionner R+V+B au maximum donne du blanc, c'est l'inverse de la peinture."
            },
            {
                question: "Combien de valeurs différentes une composante RGB peut-elle prendre (0 à 255 inclus) ?",
                options: ["100", "255", "256", "65536"],
                correctAnswer: 2,
                successMessage: "✅ 256 valeurs (de 0 à 255) car chaque composante est stockée sur 8 bits, et 2⁸ = 256."
            },
            {
                question: "rgb(255, 0, 0) correspond à quelle couleur ?",
                options: ["Blanc", "Noir", "Rouge pur", "Vert pur"],
                correctAnswer: 2,
                successMessage: "✅ Rouge au maximum (255), vert et bleu à zéro → rouge pur."
            },
            {
                question: "Quelle notation hexadécimale est ÉQUIVALENTE à rgb(255, 255, 255) ?",
                options: ["#000000", "#FFFFFF", "#FF0000", "#808080"],
                correctAnswer: 1,
                successMessage: "✅ FF = 255 en décimal pour chaque composante → blanc total, comme rgb(255,255,255)."
            },
            {
                question: "Dans rgba(0, 0, 0, 0.5), que contrôle le 4e paramètre (0.5) ?",
                options: [
                    "Une 4e composante de couleur appelée 'alpha-rouge'",
                    "La luminosité globale",
                    "L'opacité — ici, 50% de transparence",
                    "La saturation"
                ],
                correctAnswer: 2,
                successMessage: "✅ Le canal alpha contrôle la transparence : 0 = invisible, 1 = totalement opaque, 0.5 = semi-transparent."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch6-ex1-banniere-degradee",
        titre: "Bannière de profil dégradée",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🎨 Construis une bannière de profil avec dégradé et relief

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bannière de profil</title>
</head>
<body>

    <div class="banniere">
        <h1>Bienvenue sur mon profil</h1>
    </div>

</body>
</html>
\`\`\`

### 📝 Consignes

**Sur \`.banniere\` :**
1. Donne-lui une hauteur fixe de \`200px\`.
2. Applique un **dégradé linéaire** (\`linear-gradient\`) avec 2 couleurs de ton choix.
3. Arrondis les angles avec \`border-radius\` (rappel du chapitre 4 !).
4. Ajoute un \`box-shadow\` avec une couleur en \`rgba()\` semi-transparente, pour
   un effet de relief doux (pas une ombre noire pure et dure).
5. **Centre le titre** à l'intérieur de la bannière, horizontalement ET
   verticalement (rappel du chapitre 5 — Flexbox !).

**Sur le \`h1\` :**
6. Mets le texte en blanc pour qu'il contraste bien avec le dégradé.

> 💡 Cet exercice combine volontairement plusieurs chapitres : le modèle
> de boîte (border-radius), Flexbox (centrage), et les couleurs (dégradé,
> rgba). C'est exactement comme ça qu'on construit une vraie page web —
> en combinant plusieurs techniques ensemble.
        `.trim(),

        theorie_md: `
### Dégradé linéaire

\`\`\`css
.banniere {
    background: linear-gradient(to right, #ff6b35, #4f46e5);
}
\`\`\`

---

### Centrer du contenu avec Flexbox (rappel CH5)

\`\`\`css
.banniere {
    display: flex;
    justify-content: center;
    align-items: center;
}
\`\`\`

---

### Ombre douce avec rgba

\`\`\`css
.banniere {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
\`\`\`

Utiliser \`rgba()\` plutôt que \`black\` pur donne une ombre bien plus
naturelle et moins dure visuellement.

---

### Tout assembler

\`\`\`css
.banniere {
    height: 200px;
    background: linear-gradient(to right, #ff6b35, #4f46e5);
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
}
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure complète**

\`\`\`css
.banniere {
    height: 200px;
    background: linear-gradient(to right, #ff6b35, #4f46e5);
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
}

.banniere h1 {
    color: white;
}
\`\`\`

Choisis tes propres couleurs pour le dégradé si tu préfères !
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice combinant plusieurs chapitres CSS : bannière avec height:200px, linear-gradient (2 couleurs), border-radius, box-shadow avec rgba semi-transparent, et centrage Flexbox (display:flex + justify-content:center + align-items:center) du h1 à l'intérieur, plus color:white sur le h1.
Le code reçu combine HTML+CSS — analyse uniquement le CSS, en relation avec .banniere et son h1 enfant.
Points à vérifier : linear-gradient avec syntaxe correcte (direction + 2 couleurs), border-radius présent, box-shadow utilisant rgba() et non une couleur opaque pure, display:flex avec les deux propriétés de centrage présentes sur .banniere (pas sur h1), h1 en couleur claire pour le contraste.
Si l'élève a mis flexbox sur le h1 au lieu de .banniere (erreur fréquente), pose une question qui l'aide à comprendre que c'est le CONTENEUR qui doit être flex, pas l'élément à centrer lui-même.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
.banniere {
    height: 200px;
    background: linear-gradient(to right, #ff6b35, #4f46e5);
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
}

.banniere h1 {
    color: white;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}
\`\`\`

**Bonus non demandé :** \`text-shadow\` sur le titre améliore encore la
lisibilité du texte blanc par-dessus un dégradé clair, et \`margin: 0\`
évite l'espace par défaut du \`h1\` qui décale le centrage vertical.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 6 : Couleurs et fonds...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 6 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch6-quizz                    (type: quizz — 8 questions bases/RGB/hexa)");
    console.log("  - web-ch6-ex1-banniere-degradee    (type: code — gradient, box-shadow, flexbox, rgba)");
}

seed();
