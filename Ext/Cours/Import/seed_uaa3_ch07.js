const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 7 : Typographie et texte
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch7-quizz   : Quizz théorique (fallback, em/rem, propriétés texte)
//   web-ch7-ex1     : Exercice de code (carte de citation inspirante)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH7 — Typographie et texte";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch7-quizz",
        titre: "Quizz — Typographie CSS",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Dans font-family: \"Helvetica Neue\", Arial, sans-serif;, à quoi sert sans-serif à la fin ?",
                options: [
                    "C'est une erreur de syntaxe",
                    "C'est une catégorie générique de secours, garantie disponible partout",
                    "Cela force le texte à ne jamais avoir d'empattement",
                    "Cela ralentit le chargement de la page"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exact ! Si aucune des polices précises n'est disponible, le navigateur utilise au moins une police de cette catégorie générique."
            },
            {
                question: "Pourquoi écrit-on \"Times New Roman\" entre guillemets dans font-family ?",
                options: [
                    "C'est obligatoire pour TOUTES les polices",
                    "Parce que le nom contient des espaces",
                    "Parce que c'est une police payante",
                    "Les guillemets n'ont aucune utilité ici"
                ],
                correctAnswer: 1,
                successMessage: "✅ Dès qu'un nom de police contient un espace, il faut le mettre entre guillemets pour que le navigateur l'interprète comme un seul nom."
            },
            {
                question: "Un parent a font-size: 20px. Son enfant a font-size: 2em. Quelle est la taille réelle de l'enfant ?",
                options: ["20px", "22px", "40px", "2px"],
                correctAnswer: 2,
                successMessage: "✅ em se calcule par rapport au PARENT : 2 × 20px = 40px."
            },
            {
                question: "Pourquoi rem est-il généralement recommandé plutôt que em pour les tailles de texte ?",
                options: [
                    "rem est plus rapide à charger",
                    "rem se base toujours sur la racine (html), évitant les effets de cascade multiplicative en cas d'imbrication",
                    "em ne fonctionne plus dans les navigateurs récents",
                    "Il n'y a aucune différence pratique"
                ],
                correctAnswer: 1,
                successMessage: "✅ rem reste prévisible peu importe la profondeur d'imbrication, contrairement à em qui peut s'accumuler de façon inattendue."
            },
            {
                question: "Quelle propriété retire le soulignement par défaut d'un lien <a> ?",
                options: ["text-style: none;", "text-decoration: none;", "font-decoration: none;", "underline: false;"],
                correctAnswer: 1,
                successMessage: "✅ text-decoration: none; est la propriété correcte — souvent l'une des premières lignes appliquées aux liens."
            },
            {
                question: "Que fait text-transform: capitalize; ?",
                options: [
                    "Met tout le texte en majuscules",
                    "Met la première lettre de chaque mot en majuscule",
                    "Met tout le texte en minuscules",
                    "Met uniquement la première lettre de la phrase en majuscule"
                ],
                correctAnswer: 1,
                successMessage: "✅ capitalize met une majuscule au début de CHAQUE mot, pas seulement le premier de la phrase."
            },
            {
                question: "Quelle valeur de line-height est généralement recommandée pour un long paragraphe lisible ?",
                options: ["0.5", "1", "Entre 1.5 et 1.8", "5"],
                correctAnswer: 2,
                successMessage: "✅ Une valeur entre 1.5 et 1.8 donne un espacement vertical confortable pour la lecture de longs textes."
            },
            {
                question: "Pour utiliser une police Google Fonts en gras (weight 700), que faut-il faire ?",
                options: [
                    "Rien de spécial, toutes les graisses sont automatiquement disponibles",
                    "Importer explicitement le poids 700 dans l'URL Google Fonts, puis l'utiliser avec font-weight: 700",
                    "Utiliser font-style: bold;",
                    "C'est impossible avec Google Fonts"
                ],
                correctAnswer: 1,
                successMessage: "✅ Il faut importer chaque graisse utilisée explicitement (ex: wght@400;700) — sinon le navigateur simule un faux gras de moins bonne qualité."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch7-ex1-carte-citation",
        titre: "Carte de citation inspirante",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### ✍️ Stylise une citation inspirante

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Citation du jour</title>
</head>
<body>

    <div class="carte-citation">
        <p class="citation">la seule limite a notre épanouissement de demain sera nos doutes d'aujourd'hui</p>
        <p class="auteur">Franklin D. Roosevelt</p>
    </div>

</body>
</html>
\`\`\`

### 📝 Consignes

1. Sur \`body\`, définis une famille de police avec au moins **un fallback**
   et une catégorie générique (\`font-family\`).
2. Sur \`.citation\` :
   - Mets le texte en \`italic\`
   - Utilise \`text-transform: capitalize\` (remarque, le texte HTML est tout
     en minuscules — c'est volontaire, c'est justement le CSS qui doit
     gérer la mise en forme visuelle !)
   - Donne une taille confortable avec \`rem\` (par exemple \`1.4rem\`)
   - Ajoute un \`line-height\` généreux pour la lisibilité (\`1.6\` par exemple)
   - Centre le texte avec \`text-align\`
3. Sur \`.auteur\` :
   - Mets-le en \`uppercase\`
   - Ajoute un peu de \`letter-spacing\` pour un effet "signature élégante"
   - Réduis légèrement sa taille par rapport à la citation
4. Sur \`.carte-citation\` (le conteneur) :
   - Ajoute un \`padding\` confortable
   - Donne-lui une largeur maximale raisonnable (\`max-width: 500px\`) pour
     éviter que le texte s'étale sur toute la largeur de l'écran

> 💡 Le texte HTML reste volontairement "brut" (sans majuscules) — c'est le
> CSS, via \`text-transform\`, qui se charge entièrement de la présentation
> visuelle. C'est une bonne pratique : on sépare le contenu de sa mise en forme.
        `.trim(),

        theorie_md: `
### text-transform sur du texte brut

\`\`\`css
.citation {
    text-transform: capitalize;   /* "bonjour le monde" → "Bonjour Le Monde" visuellement */
}
\`\`\`

Le HTML ne change jamais — seul l'affichage est transformé.

---

### Tailles en rem et line-height

\`\`\`css
.citation {
    font-size: 1.4rem;
    line-height: 1.6;
    text-align: center;
    font-style: italic;
}
\`\`\`

---

### Effet "signature" avec letter-spacing

\`\`\`css
.auteur {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.9rem;
}
\`\`\`

---

### Limiter la largeur d'un bloc de texte

\`\`\`css
.carte-citation {
    max-width: 500px;
    padding: 24px;
}
\`\`\`

\`max-width\` empêche le bloc de dépasser cette largeur, tout en restant
flexible sur des écrans plus petits (contrairement à \`width\` fixe).
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de départ**

\`\`\`css
body {
    font-family: Georgia, serif;
}

.carte-citation {
    max-width: 500px;
    padding: 24px;
}

.citation {
    font-style: italic;
    text-transform: capitalize;
    font-size: 1.4rem;
    line-height: 1.6;
    text-align: center;
}

.auteur {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.9rem;
}
\`\`\`

Ajuste les valeurs selon ton goût — l'essentiel est d'utiliser chaque
propriété demandée.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de typographie CSS : carte de citation avec font-family+fallback sur body, .citation (italic, text-transform:capitalize, font-size en rem, line-height généreux, text-align:center), .auteur (uppercase, letter-spacing, taille réduite), .carte-citation (padding, max-width).
Le code reçu combine HTML+CSS — analyse uniquement le CSS, en relation avec le HTML donné (.carte-citation contient .citation et .auteur).
Points à vérifier : font-family a bien un fallback générique en fin de liste, .citation utilise text-transform:capitalize (pas uppercase, qui donnerait un effet différent), font-size en rem et non px, max-width et non width fixe sur .carte-citation (pour la flexibilité), letter-spacing présent sur .auteur.
Si l'élève a utilisé width au lieu de max-width, explique la nuance avec une question plutôt qu'une affirmation directe.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
body {
    font-family: Georgia, "Times New Roman", serif;
}

.carte-citation {
    max-width: 500px;
    padding: 24px;
    margin: 40px auto;
}

.citation {
    font-style: italic;
    text-transform: capitalize;
    font-size: 1.4rem;
    line-height: 1.6;
    text-align: center;
    color: #333;
}

.auteur {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.9rem;
    text-align: center;
    color: #888;
    margin-top: 16px;
}
\`\`\`

**Bonus non demandé :** \`margin: 40px auto\` sur \`.carte-citation\` centre
la carte horizontalement sur la page (rappel du chapitre 4 !) et l'éloigne
du haut de l'écran.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 7 : Typographie et texte...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 7 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch7-quizz                  (type: quizz — 8 questions typographie)");
    console.log("  - web-ch7-ex1-carte-citation     (type: code — font-family, em/rem, transform, spacing)");
}

seed();
