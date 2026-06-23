const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 8 : Médias — images, audio, vidéo
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch8-quizz   : Quizz théorique (définition/résolution/format/codage)
//   web-ch8-ex1     : Exercice de code (page médias : img, audio, video, track)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH8 — Médias : images, audio, vidéo";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch8-quizz",
        titre: "Quizz — Propriétés des images et médias",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Que désigne la DÉFINITION d'une image ?",
                options: [
                    "Le nombre total de pixels (largeur × hauteur)",
                    "La taille du fichier en mégaoctets",
                    "Le nom du format de fichier",
                    "Le niveau de zoom appliqué"
                ],
                correctAnswer: 0,
                successMessage: "✅ Exact ! 1920×1080 = environ 2 millions de pixels, c'est ce qu'on appelle le Full HD."
            },
            {
                question: "Quelle est la différence entre DÉFINITION et RÉSOLUTION ?",
                options: [
                    "Ce sont deux mots qui signifient exactement la même chose",
                    "La définition est le nombre total de pixels, la résolution est leur densité (pixels par pouce)",
                    "La résolution concerne uniquement les vidéos",
                    "La définition ne s'applique qu'aux images en noir et blanc"
                ],
                correctAnswer: 1,
                successMessage: "✅ Souvent confondues dans le langage courant, mais ce sont deux notions différentes : quantité totale vs densité."
            },
            {
                question: "Quel format choisir pour une photographie avec beaucoup de dégradés de couleurs ?",
                options: ["PNG", "JPEG", "GIF", "Aucune importance, tous identiques"],
                correctAnswer: 1,
                successMessage: "✅ JPEG est optimisé pour les photos avec dégradés complexes — sa compression avec perte reste peu visible sur ce type d'image."
            },
            {
                question: "Quel format choisir pour un logo qui doit avoir un fond TRANSPARENT ?",
                options: ["JPEG", "PNG ou SVG", "GIF uniquement", "Aucun format ne supporte la transparence"],
                correctAnswer: 1,
                successMessage: "✅ PNG et SVG supportent tous les deux la transparence — JPEG ne la supporte jamais."
            },
            {
                question: "Qu'est-ce qu'une compression SANS PERTE (lossless) ?",
                options: [
                    "Une compression qui réduit le poids du fichier sans dégrader la qualité visuelle",
                    "Une compression qui supprime des détails visuels pour réduire le poids",
                    "Un fichier qui ne peut pas être compressé",
                    "Une technique utilisée uniquement pour la vidéo"
                ],
                correctAnswer: 0,
                successMessage: "✅ PNG et GIF utilisent une compression sans perte — aucune dégradation de la qualité visuelle."
            },
            {
                question: "Pourquoi l'attribut alt sur <img> est-il TOUJOURS obligatoire ?",
                options: [
                    "Uniquement pour respecter la syntaxe HTML",
                    "Pour l'accessibilité (lecteurs d'écran), le secours si l'image ne charge pas, et le référencement (SEO)",
                    "Il n'est utile que sur les très grandes images",
                    "Pour accélérer le chargement de la page"
                ],
                correctAnswer: 1,
                successMessage: "✅ Trois raisons combinées : accessibilité, secours visuel, et référencement par les moteurs de recherche."
            },
            {
                question: "Pourquoi propose-t-on souvent PLUSIEURS <source> dans une balise <audio> ou <video> ?",
                options: [
                    "Pour que le visiteur choisisse sa version préférée",
                    "Pour augmenter la compatibilité entre navigateurs qui ne supportent pas tous les mêmes formats",
                    "C'est purement décoratif",
                    "Un seul <source> n'est pas autorisé en HTML5"
                ],
                correctAnswer: 1,
                successMessage: "✅ Tous les navigateurs ne supportent pas exactement les mêmes formats — proposer plusieurs options garantit que ça fonctionne partout."
            },
            {
                question: "Quel attribut de <track> indique la LANGUE des sous-titres ?",
                options: ["lang", "srclang", "language", "kind"],
                correctAnswer: 1,
                successMessage: "✅ srclang indique le code de langue (fr, en, nl...). kind précise plutôt le TYPE (subtitles, captions...)."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch8-ex1-page-medias",
        titre: "Construire une page multimédia",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🎬 Construis une page avec image, audio et vidéo

Cette fois, tu pars de zéro dans l'**onglet HTML**. Les fichiers (image, musique,
vidéo) n'ont pas besoin d'exister réellement pour cet exercice — c'est la
**syntaxe** des balises qui est évaluée, pas le rendu final.

### 📝 Consignes

1. Crée un squelette HTML valide complet.
2. Ajoute une image avec :
   - un \`src\` (n'importe quel nom de fichier, ex: \`"paysage.jpg"\`)
   - un attribut \`alt\` **descriptif** (pas juste "image" !)
   - \`width\` et \`height\`
3. Ajoute un lecteur audio avec :
   - l'attribut \`controls\`
   - **2 balises \`<source>\`** proposant 2 formats différents (mp3 et ogg)
   - un texte de secours si la lecture audio n'est pas supportée
4. Ajoute un lecteur vidéo avec :
   - l'attribut \`controls\`
   - un attribut \`poster\` (image d'aperçu)
   - **2 balises \`<source>\`** proposant 2 formats différents (mp4 et webm)
   - une balise \`<track>\` pour des sous-titres en français

> 💡 Rappelle-toi : le texte de secours pour \`<audio>\`/\`<video>\` se place
> directement après les \`<source>\`, à l'intérieur de la balise parente.
        `.trim(),

        theorie_md: `
### Image complète

\`\`\`html
<img src="paysage.jpg" alt="Coucher de soleil sur des montagnes enneigées" width="600" height="400">
\`\`\`

---

### Audio avec compatibilité multi-formats

\`\`\`html
<audio controls>
    <source src="musique.mp3" type="audio/mpeg">
    <source src="musique.ogg" type="audio/ogg">
    Ton navigateur ne supporte pas la lecture audio.
</audio>
\`\`\`

---

### Vidéo avec poster, sources multiples et sous-titres

\`\`\`html
<video controls width="640" poster="apercu.jpg">
    <source src="film.mp4" type="video/mp4">
    <source src="film.webm" type="video/webm">
    <track src="sous-titres.vtt" kind="subtitles" srclang="fr" label="Français">
    Ton navigateur ne supporte pas la lecture vidéo.
</video>
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de base**

\`\`\`html
<img src="paysage.jpg" alt="Description précise de l'image" width="600" height="400">

<audio controls>
    <source src="musique.mp3" type="audio/mpeg">
    <source src="musique.ogg" type="audio/ogg">
    Audio non supporté.
</audio>

<video controls poster="apercu.jpg">
    <source src="film.mp4" type="video/mp4">
    <source src="film.webm" type="video/webm">
    <track src="sous-titres.vtt" kind="subtitles" srclang="fr" label="Français">
    Vidéo non supportée.
</video>
\`\`\`

Vérifie que chaque attribut demandé est bien présent.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice HTML de médias : une image (src, alt descriptif, width, height), un audio (controls, 2 source avec types corrects, texte de secours), une vidéo (controls, poster, 2 source, track avec kind/srclang/label, texte de secours).
Analyse le code HTML soumis par l'élève.
Points à vérifier : alt n'est pas un texte générique comme "image" mais une vraie description, présence de 2 source pour audio ET vidéo (pas juste 1), attribut type présent sur chaque source, track a bien les 3 attributs kind/srclang/label, le texte de secours est placé après les source à l'intérieur de la balise parente (pas en dehors).
Si l'élève n'a mis qu'un seul <source>, pose une question sur la compatibilité entre navigateurs pour l'aider à comprendre pourquoi en ajouter un second, sans donner directement la réponse.`,

            niveau_3_md: `
🛠️ **Exemple de solution complète :**

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ma page multimédia</title>
</head>
<body>

    <h1>Galerie multimédia</h1>

    <img src="paysage.jpg" alt="Coucher de soleil orange sur des montagnes enneigées" width="600" height="400">

    <h2>Musique</h2>
    <audio controls>
        <source src="musique.mp3" type="audio/mpeg">
        <source src="musique.ogg" type="audio/ogg">
        Ton navigateur ne supporte pas la lecture audio.
    </audio>

    <h2>Vidéo</h2>
    <video controls width="640" poster="apercu.jpg">
        <source src="film.mp4" type="video/mp4">
        <source src="film.webm" type="video/webm">
        <track src="sous-titres.vtt" kind="subtitles" srclang="fr" label="Français">
        Ton navigateur ne supporte pas la lecture vidéo.
    </video>

</body>
</html>
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 8 : Médias...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 8 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch8-quizz                (type: quizz — 8 questions définition/résolution/format/codage)");
    console.log("  - web-ch8-ex1-page-medias      (type: code — img/audio/video/track complets)");
}

seed();
