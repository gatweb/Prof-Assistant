const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 9 : Tableaux HTML
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch9-quizz   : Quizz théorique (structure, colspan/rowspan, accessibilité)
//   web-ch9-ex1     : Exercice de code (planning de stage avec colspan/rowspan)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH9 — Tableaux HTML";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch9-quizz",
        titre: "Quizz — Structure des tableaux HTML",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Quelle balise représente une LIGNE de tableau ?",
                options: ["<td>", "<th>", "<tr>", "<table-row>"],
                correctAnswer: 2,
                successMessage: "✅ <tr> (table row) représente une ligne. <td> et <th> représentent des cellules à l'intérieur d'une ligne."
            },
            {
                question: "Quelle est la différence entre <th> et <td> ?",
                options: [
                    "Aucune différence, ce sont des synonymes",
                    "<th> est une cellule d'en-tête (gras, centré par défaut), <td> est une cellule de donnée classique",
                    "<th> ne peut contenir que des nombres",
                    "<td> ne fonctionne que dans <tbody>"
                ],
                correctAnswer: 1,
                successMessage: "✅ <th> (table header) sert pour les titres de colonnes/lignes, <td> (table data) pour les données elles-mêmes."
            },
            {
                question: "Pourquoi NE FAUT-IL PAS utiliser un tableau pour mettre en page un site web entier ?",
                options: [
                    "C'est interdit par le HTML5",
                    "Cela mélange structure et présentation — Flexbox est l'outil moderne adapté à la mise en page",
                    "Les tableaux ne fonctionnent pas sur mobile",
                    "Il n'y a pas de vraie raison, c'est juste une mode"
                ],
                correctAnswer: 1,
                successMessage: "✅ <table> doit rester réservé à de vraies données tabulaires — c'était une mauvaise pratique courante avant l'arrivée de CSS/Flexbox."
            },
            {
                question: "Que fait colspan=\"3\" sur une cellule <td> ?",
                options: [
                    "La cellule fusionne verticalement sur 3 lignes",
                    "La cellule fusionne horizontalement sur 3 colonnes",
                    "La cellule devient 3 fois plus grande dans toutes les directions",
                    "Cela ajoute 3 cellules vides après elle"
                ],
                correctAnswer: 1,
                successMessage: "✅ colspan fusionne horizontalement, sur le nombre de colonnes indiqué."
            },
            {
                question: "Quand on utilise rowspan=\"2\" sur une cellule, que faut-il faire sur la ligne suivante ?",
                options: [
                    "Rien de spécial à changer",
                    "Ajouter une cellule vide à la même position",
                    "Retirer la cellule correspondante, car elle est déjà couverte par la fusion",
                    "Dupliquer le contenu de la cellule fusionnée"
                ],
                correctAnswer: 2,
                successMessage: "✅ Exact ! Sinon le tableau se décale — la cellule fusionnée occupe déjà cet espace sur la ligne suivante."
            },
            {
                question: "Quelle propriété CSS évite les doubles bordures entre cellules adjacentes ?",
                options: ["border: none;", "border-collapse: collapse;", "border-style: single;", "table-border: merge;"],
                correctAnswer: 1,
                successMessage: "✅ border-collapse: collapse; fusionne les bordures partagées entre cellules voisines en un seul trait."
            },
            {
                question: "Quel sélecteur CSS cible les lignes PAIRES d'un tableau pour créer un effet zébré ?",
                options: ["tr:pair", "tr:even-line", "tr:nth-child(even)", "tr:alternate"],
                correctAnswer: 2,
                successMessage: "✅ :nth-child(even) cible les éléments à une position paire parmi leurs frères — exactement l'outil pour alterner les couleurs de lignes."
            },
            {
                question: "Quel attribut sur <th> précise qu'un en-tête se rapporte à une COLONNE entière (pour l'accessibilité) ?",
                options: ["scope=\"col\"", "type=\"column\"", "header=\"col\"", "for=\"column\""],
                correctAnswer: 0,
                successMessage: "✅ scope=\"col\" (ou scope=\"row\") aide les lecteurs d'écran à annoncer correctement la portée de chaque en-tête."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch9-ex1-planning-stage",
        titre: "Planning de stage avec colspan et rowspan",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 📅 Construis un planning de stage

Tu pars de zéro dans l'**onglet HTML**. Construis le tableau suivant,
qui présente le planning d'une semaine de stage :

| Jour | Matin | Après-midi |
|---|---|---|
| **Lundi** | *(une seule cellule fusionnée sur toute la largeur)* Journée d'accueil et découverte de l'entreprise | |
| **Mardi** | Atelier pratique | Réunion d'équipe |
| **Mercredi** | *(fusionnée verticalement avec la ligne du dessous)* Visite du service technique | Travail sur un projet |
| **Jeudi** | *(cette cellule n'existe plus, couverte par la fusion ci-dessus)* | Bilan de mi-stage |

### 📝 Consignes

1. Crée un squelette HTML valide.
2. Construis le tableau avec \`<thead>\` (ligne de titres : Jour, Matin, Après-midi)
   et \`<tbody>\` (les 4 lignes de données).
3. Ajoute un \`<caption>\` au tableau : "Planning de la semaine de stage".
4. Pour la ligne **Lundi** : utilise \`colspan="2"\` pour fusionner "Matin" et
   "Après-midi" en une seule cellule.
5. Pour les lignes **Mercredi** et **Jeudi** : utilise \`rowspan="2"\` sur la
   cellule "Matin" de Mercredi, et **ne mets pas** de cellule "Matin" pour Jeudi
   (elle est déjà couverte par la fusion).
6. Utilise \`<th scope="row">\` pour la colonne "Jour" (ce sont des en-têtes
   de ligne, pas de simples données).

> ⚠️ **Vérifie bien** que chaque ligne a le bon nombre de cellules une fois
> les fusions prises en compte — c'est l'erreur la plus fréquente sur cet
> exercice.
        `.trim(),

        theorie_md: `
### colspan — fusion horizontale

\`\`\`html
<tr>
    <th scope="row">Lundi</th>
    <td colspan="2">Journée d'accueil et découverte de l'entreprise</td>
</tr>
\`\`\`

Cette ligne n'a que **2 cellules** au total (le \`<th>\` + le \`<td>\` fusionné),
pas 3 — le colspan="2" remplace les 2 cellules "Matin"/"Après-midi" séparées.

---

### rowspan — fusion verticale

\`\`\`html
<tr>
    <th scope="row">Mercredi</th>
    <td rowspan="2">Visite du service technique</td>
    <td>Travail sur un projet</td>
</tr>
<tr>
    <th scope="row">Jeudi</th>
    <td>Bilan de mi-stage</td>
</tr>
\`\`\`

Remarque : la ligne "Jeudi" n'a que **2 cellules** (le \`<th>\` + 1 \`<td>\`) —
pas de cellule "Matin" séparée, puisqu'elle est déjà occupée par la fusion
venant de la ligne du dessus.

---

### Caption et scope

\`\`\`html
<table>
    <caption>Planning de la semaine de stage</caption>
    <thead>
        <tr>
            <th scope="col">Jour</th>
            <th scope="col">Matin</th>
            <th scope="col">Après-midi</th>
        </tr>
    </thead>
    <tbody>
        ...
    </tbody>
</table>
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Compte les cellules ligne par ligne**

Avant d'écrire le code, compte sur papier combien de \`<td>\`/\`<th>\` chaque
ligne doit réellement contenir UNE FOIS les fusions prises en compte :

- Lundi : 2 cellules (Jour + 1 cellule fusionnée colspan="2")
- Mardi : 3 cellules (Jour + Matin + Après-midi, normal)
- Mercredi : 3 cellules (Jour + Matin avec rowspan="2" + Après-midi)
- Jeudi : 2 cellules (Jour + Après-midi seulement — pas de Matin, déjà fusionné)

Construis ligne par ligne en vérifiant ce compte à chaque fois.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de tableau HTML avec colspan et rowspan : planning de stage sur 4 jours (Lundi à Jeudi), avec colspan="2" sur Lundi (fusion Matin/Après-midi) et rowspan="2" sur la cellule Matin de Mercredi (fusionnée avec Jeudi qui n'a donc pas de cellule Matin séparée).
Analyse le code HTML soumis.
Points à vérifier : présence de <caption>, thead avec 3 <th scope="col">, tbody avec 4 <tr>, ligne Lundi avec exactement 2 cellules (th + td colspan="2"), ligne Mardi avec 3 cellules normales, ligne Mercredi avec td rowspan="2" sur Matin, ligne Jeudi avec SEULEMENT 2 cellules (pas de cellule Matin dupliquée — erreur très fréquente), th scope="row" sur la colonne Jour.
Si l'élève a ajouté une cellule Matin en trop sur la ligne Jeudi (erreur classique du rowspan), pose une question qui l'aide à comprendre que cette cellule est déjà "occupée" par la fusion venant d'au-dessus, sans donner directement la correction.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Planning de stage</title>
</head>
<body>

    <table>
        <caption>Planning de la semaine de stage</caption>
        <thead>
            <tr>
                <th scope="col">Jour</th>
                <th scope="col">Matin</th>
                <th scope="col">Après-midi</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th scope="row">Lundi</th>
                <td colspan="2">Journée d'accueil et découverte de l'entreprise</td>
            </tr>
            <tr>
                <th scope="row">Mardi</th>
                <td>Atelier pratique</td>
                <td>Réunion d'équipe</td>
            </tr>
            <tr>
                <th scope="row">Mercredi</th>
                <td rowspan="2">Visite du service technique</td>
                <td>Travail sur un projet</td>
            </tr>
            <tr>
                <th scope="row">Jeudi</th>
                <td>Bilan de mi-stage</td>
            </tr>
        </tbody>
    </table>

</body>
</html>
\`\`\`

**Point clé à vérifier toi-même :** la ligne Jeudi ne contient que 2 cellules
(\`<th>\` + 1 \`<td>\`) — la case "Matin" du jeudi est entièrement couverte
par le \`rowspan="2"\` de la ligne du dessus.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 9 : Tableaux HTML...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 9 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch9-quizz                  (type: quizz — 8 questions structure/colspan/rowspan)");
    console.log("  - web-ch9-ex1-planning-stage     (type: code — colspan + rowspan combinés)");
}

seed();
