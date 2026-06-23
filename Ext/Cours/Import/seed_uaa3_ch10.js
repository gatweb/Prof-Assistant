const admin = require('firebase-admin');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

// ============================================================
// UAA3 — Chapitre 10 : Formulaires HTML
// course_id : "creation-site-web"
//
// 2 exercices :
//   web-ch10-quizz   : Quizz théorique (name, label, types, validation)
//   web-ch10-ex1     : Exercice de code (inscription à un tournoi e-sport)
// ============================================================

const COURSE_ID = "creation-site-web";
const CHAPITRE  = "CH10 — Formulaires HTML";

const EXERCICES = [
    // ────────────────────────────────────────────────────────────────
    // QUIZZ — théorie (Connaitre)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch10-quizz",
        titre: "Quizz — Formulaires HTML",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        type: "quizz",
        questions: [
            {
                question: "Que se passe-t-il si un <input> n'a PAS d'attribut name ?",
                options: [
                    "Rien de spécial, ça fonctionne pareil",
                    "Le champ ne s'affiche pas",
                    "La valeur saisie n'est jamais transmise lors de l'envoi du formulaire",
                    "Le navigateur affiche une erreur"
                ],
                correctAnswer: 2,
                successMessage: "✅ Exact ! Sans name, le champ existe visuellement mais sa valeur est invisible pour le traitement des données — l'erreur n°1 des débutants."
            },
            {
                question: "Quelle est la différence principale entre name et id sur un champ de formulaire ?",
                options: [
                    "Aucune différence, ce sont des synonymes",
                    "name est l'étiquette envoyée au serveur, id sert à cibler l'élément en CSS/JS et l'associer à un label",
                    "id est obligatoire, name est optionnel",
                    "name ne fonctionne que sur les <select>"
                ],
                correctAnswer: 1,
                successMessage: "✅ Les deux ont des rôles différents et souvent complémentaires sur un même champ."
            },
            {
                question: "Trois boutons radio doivent permettre de choisir UN SEUL niveau parmi trois. Que faut-il vérifier ?",
                options: [
                    "Qu'ils ont chacun un id différent",
                    "Qu'ils ont tous le MÊME attribut name",
                    "Qu'ils sont tous dans un <select>",
                    "Qu'ils ont chacun un type différent"
                ],
                correctAnswer: 1,
                successMessage: "✅ Le même name regroupe les boutons radio en un ensemble exclusif — un seul peut être sélectionné à la fois."
            },
            {
                question: "L'attribut for d'un <label> doit correspondre à quoi ?",
                options: [
                    "Au name du champ associé",
                    "À l'id du champ associé",
                    "Au type du champ associé",
                    "À la valeur (value) du champ associé"
                ],
                correctAnswer: 1,
                successMessage: "✅ for doit correspondre exactement à l'id du champ — c'est ce qui crée le lien cliquable entre l'étiquette et le champ."
            },
            {
                question: "Dans <option value=\"lol\">League of Legends</option>, qu'est-ce qui est réellement ENVOYÉ si cette option est choisie ?",
                options: ["League of Legends", "lol", "option", "Rien, value est juste décoratif"],
                correctAnswer: 1,
                successMessage: "✅ value est ce qui est transmis — le texte affiché à l'utilisateur peut être différent de la valeur technique envoyée."
            },
            {
                question: "Quel type de bouton VIDE tous les champs d'un formulaire ?",
                options: ["<button type=\"submit\">", "<button type=\"reset\">", "<button type=\"button\">", "<button type=\"clear\">"],
                correctAnswer: 1,
                successMessage: "✅ type=\"reset\" remet tous les champs à leur état initial — à utiliser avec précaution pour éviter une perte de saisie accidentelle."
            },
            {
                question: "Quel est le rôle de <fieldset> et <legend> ?",
                options: [
                    "Ils sont purement décoratifs sans aucune utilité",
                    "Ils regroupent visuellement et sémantiquement des champs liés, avec un titre",
                    "Ils remplacent les balises <input>",
                    "Ils sont utilisés uniquement pour les formulaires de paiement"
                ],
                correctAnswer: 1,
                successMessage: "✅ Très utile pour structurer un long formulaire en sections claires, et excellent pour l'accessibilité."
            },
            {
                question: "L'attribut required empêche-t-il TOUJOURS l'envoi de données invalides ?",
                options: [
                    "Oui, c'est une garantie de sécurité absolue",
                    "Non, c'est une validation côté navigateur uniquement — une vraie validation côté serveur reste nécessaire",
                    "required ne fonctionne que sur les formulaires en method=\"post\"",
                    "required bloque uniquement les champs de type email"
                ],
                correctAnswer: 1,
                successMessage: "✅ La validation HTML5 améliore l'expérience utilisateur mais peut être contournée — un vrai projet a toujours besoin d'une validation côté serveur."
            }
        ]
    },

    // ────────────────────────────────────────────────────────────────
    // EXERCICE DE CODE — pratique (Appliquer)
    // ────────────────────────────────────────────────────────────────
    {
        id: "web-ch10-ex1-inscription-tournoi",
        titre: "Inscription à un tournoi e-sport",
        chapitre: CHAPITRE,
        course_id: COURSE_ID,
        enonce_md: `
### 🎮 Construis un formulaire d'inscription à un tournoi

Tu pars de zéro dans l'**onglet HTML**. Construis un formulaire d'inscription
à un tournoi e-sport, avec tous les éléments vus dans ce chapitre.

### 📝 Consignes

1. Crée un squelette HTML valide, avec un \`<form>\` (\`action="#"\`,
   \`method="post"\`).
2. **Premier groupe** avec \`<fieldset>\` + \`<legend>\` "Informations personnelles" :
   - Un champ \`text\` pour le pseudo, avec \`label\`, \`id\`/\`name\` cohérents,
     et \`required\`
   - Un champ \`email\`, avec \`label\` et \`required\`
3. **Deuxième groupe** avec \`<fieldset>\` + \`<legend>\` "Préférences de jeu" :
   - Un \`<select>\` "Jeu préféré" avec au moins 3 \`<option>\`
   - **3 boutons radio** pour le niveau (Débutant / Intermédiaire / Avancé) —
     vérifie qu'ils partagent le **même** \`name\` pour former un vrai groupe exclusif
   - Un \`<textarea>\` pour une courte motivation, avec un \`label\`
4. Un bouton d'envoi (\`<button type="submit">\`).
5. **Vérifie bien** que chaque champ a un \`name\`, et que chaque \`label\`
   est correctement associé via \`for\`/\`id\`.

> ⚠️ L'erreur la plus fréquente : oublier \`name\` sur un champ, ou donner
> des \`name\` différents aux 3 boutons radio (ce qui casserait leur exclusivité).
        `.trim(),

        theorie_md: `
### Structure d'un fieldset

\`\`\`html
<fieldset>
    <legend>Informations personnelles</legend>

    <label for="pseudo">Pseudo</label>
    <input type="text" id="pseudo" name="pseudo" required>
</fieldset>
\`\`\`

---

### Boutons radio groupés (même name !)

\`\`\`html
<input type="radio" id="niveau-debutant" name="niveau" value="debutant">
<label for="niveau-debutant">Débutant</label>

<input type="radio" id="niveau-inter" name="niveau" value="intermediaire">
<label for="niveau-inter">Intermédiaire</label>

<input type="radio" id="niveau-avance" name="niveau" value="avance">
<label for="niveau-avance">Avancé</label>
\`\`\`

---

### Select avec options

\`\`\`html
<label for="jeu">Jeu préféré</label>
<select id="jeu" name="jeu">
    <option value="valorant">Valorant</option>
    <option value="lol">League of Legends</option>
    <option value="fortnite">Fortnite</option>
</select>
\`\`\`

---

### Textarea avec label

\`\`\`html
<label for="motivation">Ta motivation</label>
<textarea id="motivation" name="motivation" rows="4"></textarea>
\`\`\`
        `.trim(),

        code_depart: "",

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Checklist avant de commencer**

Avant d'écrire, vérifie que tu as bien prévu :
- ✅ 2 \`<fieldset>\` avec chacun un \`<legend>\`
- ✅ Pseudo (text) + Email (email), chacun avec \`label\`/\`id\`/\`name\`/\`required\`
- ✅ 1 \`<select>\` avec 3+ \`<option>\`
- ✅ 3 boutons radio avec le **même name="niveau"**, mais des \`id\` et \`value\` différents
- ✅ 1 \`<textarea>\` avec son \`label\`
- ✅ 1 bouton \`type="submit"\`

Construis fieldset par fieldset, champ par champ, en cochant cette liste.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de formulaire HTML complet : inscription à un tournoi avec 2 fieldset (infos perso : pseudo+email ; préférences : select+radio+textarea), boutons radio groupés par name commun, labels associés via for/id, et bouton submit.
Analyse le code HTML soumis.
Points à vérifier : chaque input a un name (erreur la plus fréquente si absent), les 3 boutons radio partagent EXACTEMENT le même name (mais des id et value différents), chaque label a un for correspondant à l'id du champ, les 2 fieldset ont chacun un legend, le select a au moins 3 option, le textarea a un label associé, required est présent sur pseudo et email.
Si les boutons radio ont des name différents (ce qui casse leur exclusivité), pose une question qui aide l'élève à comprendre pourquoi ils pourraient tous être cochés en même temps, sans donner directement la solution.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Inscription au tournoi</title>
</head>
<body>

    <h1>Inscription au tournoi e-sport</h1>

    <form action="#" method="post">

        <fieldset>
            <legend>Informations personnelles</legend>

            <label for="pseudo">Pseudo</label>
            <input type="text" id="pseudo" name="pseudo" required>

            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </fieldset>

        <fieldset>
            <legend>Préférences de jeu</legend>

            <label for="jeu">Jeu préféré</label>
            <select id="jeu" name="jeu">
                <option value="valorant">Valorant</option>
                <option value="lol">League of Legends</option>
                <option value="fortnite">Fortnite</option>
            </select>

            <p>Niveau :</p>
            <input type="radio" id="niveau-debutant" name="niveau" value="debutant">
            <label for="niveau-debutant">Débutant</label>

            <input type="radio" id="niveau-inter" name="niveau" value="intermediaire">
            <label for="niveau-inter">Intermédiaire</label>

            <input type="radio" id="niveau-avance" name="niveau" value="avance">
            <label for="niveau-avance">Avancé</label>

            <label for="motivation">Ta motivation</label>
            <textarea id="motivation" name="motivation" rows="4"></textarea>
        </fieldset>

        <button type="submit">S'inscrire</button>

    </form>

</body>
</html>
\`\`\`

**Point clé à vérifier toi-même :** les 3 boutons radio ont bien
\`name="niveau"\` **identique**, mais des \`id\` et \`value\` différents.
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA3 — Chapitre 10 : Formulaires HTML...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 10 (UAA3) terminé !");
    console.log("\nExercices créés :");
    console.log("  - web-ch10-quizz                    (type: quizz — 8 questions name/label/validation)");
    console.log("  - web-ch10-ex1-inscription-tournoi  (type: code — fieldset, radio groupés, select, textarea)");
}

seed();
