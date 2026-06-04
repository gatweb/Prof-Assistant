const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 3 : Entrées / Sorties interactives
//
// NOTE ARCHITECTURE :
//   - code_depart → injecté dans l'onglet JS uniquement
//   - HTML/CSS tabs démarrent vides
//   - Le helper afficher() et le DOM setup sont dans code_depart
//   - Le niveau_2_prompt reçoit le code combiné HTML+CSS+JS
//
// 2 exercices :
//   ch3-ex1 : Carte de visite dynamique  (prompt string, affichage HTML)
//   ch3-ex2 : Convertisseur universel    (prompt number, validation, multi-outputs)
// ============================================================

// ─── Helper partagé ─────────────────────────────────────────────────────────
// Ce bloc est injecté dans code_depart de chaque exercice.
// Il crée la zone d'affichage et expose afficher() + afficherTitre().
// L'élève n'y touche pas — il écrit son code sous la ligne séparatrice.

const HELPER_AFFICHER = `// ═══ Zone d'affichage — ne pas modifier ═══════════════════════════
(function() {
    const style = document.createElement("style");
    style.textContent = \`
        body { font-family: sans-serif; padding: 1.5rem; background: #f8f9fb; margin: 0; }
        #output { max-width: 520px; margin: 0 auto; }
        .card { background: #fff; border-left: 4px solid #4f46e5;
                padding: 10px 16px; margin: 8px 0; border-radius: 6px;
                box-shadow: 0 1px 4px rgba(0,0,0,.08); font-size: 15px; }
        .card strong { color: #4f46e5; }
        .card-titre { font-size: 18px; font-weight: 600; color: #1e1b4b;
                      border-bottom: 2px solid #4f46e5; padding-bottom: 6px;
                      margin: 16px 0 8px; }
        .card-erreur { border-left-color: #dc2626; }
        .card-erreur strong { color: #dc2626; }
    \`;
    document.head.appendChild(style);

    const zone = document.createElement("div");
    zone.id = "output";
    document.body.appendChild(zone);
})();

function afficher(label, valeur) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = valeur !== undefined
        ? \`<strong>\${label}</strong> : \${valeur}\`
        : label;
    document.getElementById("output").appendChild(card);
}

function afficherTitre(texte) {
    const h = document.createElement("div");
    h.className = "card-titre";
    h.textContent = texte;
    document.getElementById("output").appendChild(h);
}

function afficherErreur(message) {
    const card = document.createElement("div");
    card.className = "card card-erreur";
    card.innerHTML = \`<strong>Erreur</strong> : \${message}\`;
    document.getElementById("output").appendChild(card);
}
// ════════════════════════════════════════════════════════════════════

`;
// ─────────────────────────────────────────────────────────────────────────────

const EXERCICES = [
    {
        id: "ch3-ex1-carte-visite",
        titre: "Carte de Visite Dynamique",
        chapitre: "CH3 — Entrées / Sorties interactives",
        enonce_md: `
### 🪪 Génère ta carte de visite

Le programme demande 3 informations à l'utilisateur et affiche sa carte de visite dans la page.

**Informations à demander avec \`prompt()\` :**
1. Prénom
2. Profession (ex: Développeur, Game Designer, Hacker éthique…)
3. Ville

**Sortie attendue dans la page :**

> **=== CARTE DE VISITE ===**
> Prénom : Alex
> Profession : Développeur JS
> Ville : Bruxelles

### 📝 Consignes

1. Utilise **3 appels à \`prompt()\`** pour récupérer les données.
2. Affiche le titre avec \`afficherTitre()\`.
3. Affiche chaque info avec \`afficher(label, valeur)\`.
4. **Validation :** si l'utilisateur annule l'un des prompts (\`null\`) ou ne tape rien, affiche un message d'erreur avec \`afficherErreur()\` et arrête le programme.

> 💡 Pour vérifier si une saisie est vide : \`saisie === null || saisie.trim() === ""\`
        `.trim(),

        theorie_md: `
### prompt() — Récupérer une saisie utilisateur

\`\`\`javascript
const prenom = prompt("Quel est ton prénom ?");
\`\`\`

**Ce que renvoie prompt() :**
- Une **string** contenant ce que l'utilisateur a tapé
- **null** si l'utilisateur a cliqué "Annuler"

⚠️ Le retour est **toujours une string**, même si l'utilisateur tape un nombre.

---

### afficher() — Afficher dans la page

\`\`\`javascript
afficherTitre("Mon titre");           // Titre en grand
afficher("Label", "Valeur");          // Card avec label : valeur
afficher("Message simple");           // Card sans label
afficherErreur("Quelque chose cloche"); // Card rouge d'erreur
\`\`\`

---

### Valider une entrée texte

\`\`\`javascript
const saisie = prompt("Ton prénom ?");

if (saisie === null || saisie.trim() === "") {
    afficherErreur("Saisie invalide ou annulée.");
} else {
    afficher("Prénom", saisie.trim());
}
\`\`\`

- \`saisie === null\` → l'utilisateur a annulé
- \`saisie.trim() === ""\` → l'utilisateur a validé sans rien taper
- \`.trim()\` supprime les espaces inutiles en début/fin
        `.trim(),

        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────

// 1. Demande les 3 informations avec prompt()


// 2. Valide les saisies (null ou vide → afficherErreur et stop)


// 3. Affiche la carte de visite


`,

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de base**

Commence par récupérer une saisie et l'afficher :

\`\`\`javascript
const prenom = prompt("Quel est ton prénom ?");

if (prenom === null || prenom.trim() === "") {
    afficherErreur("Prénom invalide.");
} else {
    afficher("Prénom", prenom.trim());
}
\`\`\`

Reproduis ce pattern pour les 3 informations, puis affiche la carte complète avec \`afficherTitre()\` et \`afficher()\`.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice JS de saisie utilisateur avec prompt() et d'affichage HTML.
Il doit : (1) appeler prompt() 3 fois pour prénom, profession, ville, (2) valider chaque saisie (null ou chaîne vide), (3) afficher une carte de visite avec afficherTitre() et afficher().
Le code reçu est le code combiné HTML+CSS+JS de l'élève. Analyse uniquement le JS (après la ligne séparatrice "═══").
Points à vérifier : prompt() bien appelé, vérification null ET chaîne vide, utilisation de .trim(), affichage avec les bonnes fonctions, logique de sortie anticipée en cas d'erreur.
Guide l'élève avec une question ciblée sur le premier problème identifié, sans donner le code corrigé.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
const prenom     = prompt("Quel est ton prénom ?");
const profession = prompt("Quelle est ta profession ?");
const ville      = prompt("Dans quelle ville es-tu ?");

// Validation groupée
if (prenom === null     || prenom.trim()     === "" ||
    profession === null || profession.trim() === "" ||
    ville === null      || ville.trim()      === "") {
    afficherErreur("Saisie incomplète ou annulée.");
} else {
    afficherTitre("=== CARTE DE VISITE ===");
    afficher("Prénom",     prenom.trim());
    afficher("Profession", profession.trim());
    afficher("Ville",      ville.trim());
}
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch3-ex2-convertisseur",
        titre: "Convertisseur de Températures",
        chapitre: "CH3 — Entrées / Sorties interactives",
        enonce_md: `
### 🌡️ Convertis une température

Le programme demande une température en **Celsius** et affiche sa conversion en **Fahrenheit** et en **Kelvin**.

**Formules :**
- Fahrenheit : \`C × 9/5 + 32\`
- Kelvin : \`C + 273.15\`

**Sortie attendue pour 100°C :**

> **=== CONVERSION DE TEMPÉRATURE ===**
> Celsius : 100 °C
> Fahrenheit : 212 °F
> Kelvin : 373.15 K

### 📝 Consignes

1. Demande la température avec \`prompt()\`.
2. **Validation complète :**
   - Si l'utilisateur annule → \`afficherErreur("Saisie annulée.")\`
   - Si la valeur n'est pas un nombre → \`afficherErreur("Valeur invalide.")\`
3. Convertis et affiche les 3 valeurs.
4. **Bonus :** arrondis les résultats à 2 décimales avec \`.toFixed(2)\`.

> 💡 Pour valider un nombre : convertis avec \`Number()\` puis vérifie avec \`isNaN()\`
        `.trim(),

        theorie_md: `
### prompt() renvoie toujours une string !

\`\`\`javascript
const saisie = prompt("Entrez un nombre :");
console.log(typeof saisie);   // "string" — toujours
\`\`\`

**Convertis avant tout calcul :**
\`\`\`javascript
const nombre = Number(saisie);
\`\`\`

---

### Valider une entrée numérique — le pattern complet

\`\`\`javascript
const saisie = prompt("Entrez un nombre :");

if (saisie === null) {
    afficherErreur("Annulé.");
} else {
    const nombre = Number(saisie);
    if (isNaN(nombre)) {
        afficherErreur("Ce n'est pas un nombre.");
    } else {
        // ici nombre est sûr et utilisable
        afficher("Résultat", nombre * 2);
    }
}
\`\`\`

**isNaN(valeur)** → renvoie \`true\` si la valeur n'est pas un nombre valide.

---

### Arrondir un résultat

\`\`\`javascript
const resultat = 212.0000001;
console.log(resultat.toFixed(2));   // "212.00"
console.log(resultat.toFixed(0));   // "212"
\`\`\`

⚠️ \`.toFixed()\` renvoie une **string**, pas un nombre.
Utilise-le uniquement pour l'affichage final.

---

### Rappel — isNaN() sur quelques valeurs

\`\`\`javascript
isNaN(42);         // false ✅ nombre valide
isNaN("42");       // false ✅ convertible
isNaN("abc");      // true  ❌ invalide
isNaN("");         // false ⚠️  chaîne vide → 0, piège !
isNaN(null);       // false ⚠️  null → 0, piège !
\`\`\`

Pour éviter les pièges de la chaîne vide et de null :
vérifie \`null\` en premier, séparément.
        `.trim(),

        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────

// 1. Demande la température en Celsius


// 2. Valide la saisie (null → annulé, isNaN → invalide)


// 3. Calcule et affiche les conversions


`,

        indices: {
            niveau_1_md: `
💡 **Indice 1 — La validation en deux étapes**

Sépare toujours la vérification de \`null\` de la vérification numérique :

\`\`\`javascript
const saisie = prompt("Température en Celsius :");

if (saisie === null) {
    afficherErreur("Saisie annulée.");
} else {
    const celsius = Number(saisie);
    if (isNaN(celsius)) {
        afficherErreur("Valeur invalide — entre un nombre.");
    } else {
        // ici celsius est sûr
        // calcule fahrenheit et kelvin...
    }
}
\`\`\`

Pour les formules : Fahrenheit = \`celsius * 9/5 + 32\`, Kelvin = \`celsius + 273.15\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice JS de conversion de températures avec prompt() et validation.
Il doit : (1) appeler prompt(), (2) valider (null puis isNaN), (3) calculer Fahrenheit=C*9/5+32 et Kelvin=C+273.15, (4) afficher avec afficherTitre() et afficher().
Le code reçu est le code combiné HTML+CSS+JS. Analyse uniquement le JS (après la ligne séparatrice "═══").
Valeurs de test : 100°C → 212°F, 373.15K. 0°C → 32°F, 273.15K. -40°C → -40°F (cas spécial sympa à mentionner).
Points à vérifier : vérification null séparée de isNaN, conversion Number() avant calcul, formules correctes, utilisation de .toFixed(2) pour l'arrondi.
Identifie le premier problème et pose une question socratique ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
const saisie = prompt("Entrez une température en Celsius :");

if (saisie === null) {
    afficherErreur("Saisie annulée.");
} else {
    const celsius = Number(saisie);

    if (isNaN(celsius)) {
        afficherErreur("Valeur invalide — entrez un nombre.");
    } else {
        const fahrenheit = celsius * 9/5 + 32;
        const kelvin     = celsius + 273.15;

        afficherTitre("=== CONVERSION DE TEMPÉRATURE ===");
        afficher("Celsius",    celsius.toFixed(2) + " °C");
        afficher("Fahrenheit", fahrenheit.toFixed(2) + " °F");
        afficher("Kelvin",     kelvin.toFixed(2) + " K");
    }
}
\`\`\`

**Bonus :** teste avec -40°C → tu obtiens -40°F. C'est le seul point où Celsius et Fahrenheit sont égaux !
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 3 : Entrées / Sorties interactives...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 3 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch3-ex1-carte-visite    (prompt string, validation, affichage HTML)");
    console.log("  - ch3-ex2-convertisseur   (prompt number, isNaN, formules, toFixed)");
    console.log("\n⚠️  Rappel : le helper afficher() est dans code_depart (onglet JS uniquement).");
    console.log("   Les onglets HTML et CSS démarrent vides — tout est auto-portant.");
}

seed();
