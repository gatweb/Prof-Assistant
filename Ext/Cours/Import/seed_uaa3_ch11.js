const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 11 : Sélecteurs avancés (dernier chapitre Partie 1)
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch11-quizz   : Quizz théorique (voisinage, attributs)
//   web-ch11-ex1     : Exercice de code (synthèse — debug + stylisation par attribut)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH11 — Sélecteurs avancés";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch11-quizz",
        titre: "Quizz — Sélecteurs avancés",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Que cible h2 + p ?",
                options: [
                    "Tous les <p> de la page",
                    "Tous les <p> à l'intérieur d'un <h2>",
                    "Uniquement le <p> qui suit DIRECTEMENT un <h2>",
                    "Tous les <p> qui suivent un <h2>, peu importe la distance"
                ],
                correctAnswer: 2,
                successMessage: "✅ Le combinateur + cible uniquement le frère IMMÉDIATEMENT suivant — pas plus loin."
            },
            {
                question: "Que cible .actif ~ li ?",
                options: [
                    "Uniquement le <li> immédiatement après .actif",
                    "Tous les <li> qui suivent .actif, peu importe le nombre d'éléments entre eux",
                    "Le <li> qui précède .actif",
                    "Tous les <li> de la page sans exception"
                ],
                correctAnswer: 1,
                successMessage: "✅ Le combinateur ~ cible TOUS les frères suivants, contrairement à + qui ne cible que le premier."
            },
            {
                question: "Que cible input[required] ?",
                options: [
                    "Tous les input, peu importe leurs attributs",
                    "Uniquement les input qui possèdent l'attribut required, peu importe sa valeur",
                    "Uniquement les input de type text",
                    "Cette syntaxe n'existe pas en CSS"
                ],
                correctAnswer: 1,
                successMessage: "✅ [attr] sans signe = cible simplement la PRÉSENCE de l'attribut, quelle que soit sa valeur."
            },
            {
                question: "Quelle syntaxe cible tous les liens dont l'URL se termine par .pdf ?",
                options: ['a[href*=".pdf"]', 'a[href^=".pdf"]', 'a[href$=".pdf"]', 'a[href=".pdf"]'],
                correctAnswer: 2,
                successMessage: '✅ $= signifie "se termine par" — exactement l\'outil pour repérer des liens de téléchargement par extension.'
            },
            {
                question: "Quelle syntaxe cible tous les liens externes commençant par https:// ?",
                options: ['a[href$="https://"]', 'a[href^="https://"]', 'a[href*="https://"]', 'a[href~="https://"]'],
                correctAnswer: 1,
                successMessage: '✅ ^= signifie "commence par".'
            },
            {
                question: "Pourquoi img[alt=\"\"] { border: red; } est-elle une astuce de débogage utile ?",
                options: [
                    "Elle rend toutes les images plus belles",
                    "Elle repère visuellement les images dont l'attribut alt est vide — un problème d'accessibilité",
                    "Elle supprime les images sans alt",
                    "Elle n'a aucune utilité réelle"
                ],
                correctAnswer: 1,
                successMessage: "✅ Exactement ! Une technique rapide pour s'auto-corriger sur l'accessibilité pendant le développement."
            },
            {
                question: "Dans form input[type=\"text\"]:focus, combien de techniques de sélection différentes sont combinées ?",
                options: [
                    "Une seule",
                    "Deux : descendant + sélecteur d'attribut",
                    "Trois : descendant, sélecteur d'attribut, et pseudo-classe",
                    "Ce n'est pas une syntaxe valide"
                ],
                correctAnswer: 2,
                successMessage: "✅ form (descendant) + input[type=\"text\"] (attribut) + :focus (pseudo-classe) — trois techniques combinées en une règle précise."
            },
            {
                question: "Quelle est la différence entre [href*=\"pdf\"] et [href$=\".pdf\"] ?",
                options: [
                    "Aucune différence",
                    "*= cherche n'importe où dans la valeur, $= exige que ce soit exactement à la fin",
                    "$= est plus rapide à charger",
                    "*= ne fonctionne que sur les images"
                ],
                correctAnswer: 1,
                successMessage: '✅ [href*="pdf"] matcherait aussi "pdf-viewer.html" par erreur — [href$=".pdf"] est plus précis pour cibler une extension de fichier.'
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer/Transférer — synthèse finale)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch11-ex1-debug-attributs",
        titre: "Stylisation et débogage par attributs",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🔍 Stylise et débogue une page grâce aux sélecteurs d'attributs

Copie d'abord ce code dans l'**onglet HTML** :

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Sélecteurs avancés</title>
</head>
<body>

    <h2>Documents</h2>
    <a href="rapport.pdf">Rapport annuel</a><br>
    <a href="https://exemple.com">Site externe</a><br>
    <a href="contact.html">Page de contact</a>

    <h2>Formulaire</h2>
    <form>
        <input type="text" placeholder="Nom"><br>
        <input type="email" placeholder="Email"><br>
        <input type="password" placeholder="Mot de passe">
    </form>

    <h2>Galerie</h2>
    <img src="photo1.jpg" alt="Coucher de soleil sur la mer" width="150"><br>
    <img src="photo2.jpg" alt="" width="150">

</body>
</html>
\`\`\`

### 📝 Consignes — utilise UNIQUEMENT des sélecteurs d'attributs, sans ajouter de classe

1. Les liens se terminant par \`.pdf\` doivent apparaître en **rouge et gras**
   (signaler un téléchargement).
2. Les liens commençant par \`https://\` doivent apparaître en **vert**
   (signaler un lien externe sécurisé).
3. Les champs \`type="password"\` doivent avoir une **bordure orange**
   (signaler un champ sensible).
4. **Debug d'accessibilité :** toutes les images dont l'attribut \`alt\` est
   **vide** doivent avoir une **bordure rouge épaisse (4px)** — repère
   visuellement le problème d'accessibilité sur \`photo2.jpg\`.

> 💡 Aucune de ces 4 règles ne doit utiliser de classe ou d'id — uniquement
> des sélecteurs d'attributs, comme vu dans ce chapitre.
        `.trim(),

        theorie_md: `
### Les 4 sélecteurs d'attributs de cet exercice

\`\`\`css
/* Se termine par .pdf */
a[href$=".pdf"] {
    color: red;
    font-weight: bold;
}

/* Commence par https:// */
a[href^="https://"] {
    color: green;
}

/* Valeur exacte */
input[type="password"] {
    border: 2px solid orange;
}

/* Attribut présent avec valeur vide */
img[alt=""] {
    border: 4px solid red;
}
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Les 4 règles**

\`\`\`css
a[href$=".pdf"] {
    color: red;
    font-weight: bold;
}

a[href^="https://"] {
    color: green;
}

input[type="password"] {
    border: 2px solid orange;
}

img[alt=""] {
    border: 4px solid red;
}
\`\`\`

Vérifie bien les symboles : \`$=\` pour "se termine par", \`^=\` pour
"commence par", \`=\` seul pour une valeur exacte.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de synthèse sur les sélecteurs d'attributs CSS : a[href$=".pdf"] (rouge+gras), a[href^="https://"] (vert), input[type="password"] (bordure orange), img[alt=""] (bordure rouge 4px, debug accessibilité).
Analyse uniquement le CSS soumis, en lien avec le HTML donné (liens pdf/externe/interne, 3 inputs dont 1 password, 2 images dont 1 avec alt vide).
Points à vérifier : utilisation correcte de $= et ^= (pas confondus entre eux), aucune classe ajoutée (la consigne demande explicitement seulement des sélecteurs d'attributs), input[type="password"] cible la bonne valeur exacte, img[alt=""] avec des guillemets vides corrects (pas img[alt] qui cibrerait TOUTES les images avec un alt, vide ou pas).
Si l'élève a confondu $= et ^=, pose une question qui l'aide à se souvenir du sens de chaque symbole sans donner directement la réponse.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`css
a[href$=".pdf"] {
    color: red;
    font-weight: bold;
}

a[href^="https://"] {
    color: green;
}

input[type="password"] {
    border: 2px solid orange;
}

img[alt=""] {
    border: 4px solid red;
}
\`\`\`

**Point clé à vérifier toi-même :** \`img[alt=""]\` (avec des guillemets vides)
cible uniquement les \`alt\` réellement vides. \`img[alt]\` seul (sans \`=""\`)
ciblerait TOUTES les images possédant un attribut \`alt\`, vide ou rempli —
une nuance importante entre "présence" et "valeur exacte vide".

---

🎓 **Avec cet exercice, tu termines la Partie 1 de l'UAA3 !** Tu as maintenant
tous les outils HTML et CSS fondamentaux pour construire un vrai site web
multi-pages, structuré, accessible et stylisé.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 11 : Sélecteurs avancés...");
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
    console.log("   UAA3 — Création du site web : PARTIE 1 TERMINÉE");
    console.log("   11 chapitres | 11 quizz | 11 exercices de code");
    console.log("   ════════════════════════════════════════");
    console.log("\nExercices CH11 créés :");
    console.log("  - web-ch11-quizz                 (type: quizz — 8 questions voisinage/attributs)");
    console.log("  - web-ch11-ex1-debug-attributs    (type: code — synthèse finale, 4 sélecteurs d'attributs)");
}

seed();
