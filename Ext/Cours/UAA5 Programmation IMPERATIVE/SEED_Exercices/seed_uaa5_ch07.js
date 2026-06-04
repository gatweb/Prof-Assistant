const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 7 : Structures combinées
//
// Approche DOM — même pattern que CH6.
// 2 exercices :
//   ch7-ex1 : Trieur de Nombres   (for + conditions, accumulation, min/max)
//   ch7-ex2 : Pyramide            (boucles imbriquées, condition intérieure)
// ============================================================

const STYLES_BASE = `
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', sans-serif;
        background: #f1f5f9;
        margin: 0;
        padding: 1.5rem;
        min-height: 100vh;
    }
    .app { max-width: 600px; margin: 0 auto; }
    h2 {
        color: #1e1b4b;
        margin: 0 0 1rem;
        font-size: 1.2rem;
        border-bottom: 2px solid #4f46e5;
        padding-bottom: .5rem;
    }
    .controls {
        display: flex;
        gap: .6rem;
        margin-bottom: 1.2rem;
        flex-wrap: wrap;
        align-items: center;
    }
    input[type="text"], input[type="number"], input[type="range"], select {
        flex: 1;
        padding: .6rem .9rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        outline: none;
        transition: border-color .2s;
        min-width: 100px;
    }
    input:focus, select:focus { border-color: #4f46e5; }
    button {
        padding: .6rem 1.4rem;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background .2s;
        white-space: nowrap;
    }
    button:hover { background: #3730a3; }
    #output { display: flex; flex-direction: column; gap: .4rem; }
    .item {
        background: white;
        border-left: 4px solid #4f46e5;
        padding: .5rem 1rem;
        border-radius: 0 8px 8px 0;
        font-size: .95rem;
        box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .item strong { color: #4f46e5; }
    .item-ok   { border-left-color: #16a34a; }
    .item-ok strong { color: #16a34a; }
    .item-warn { border-left-color: #d97706; }
    .item-warn strong { color: #d97706; }
    .erreur {
        background: #fef2f2;
        border-left-color: #dc2626;
        color: #991b1b;
        padding: .6rem 1rem;
        border-radius: 0 8px 8px 0;
    }
    .titre-section {
        font-weight: 700;
        color: #1e1b4b;
        margin-top: .8rem;
        font-size: 1rem;
        padding: .4rem 0 .2rem;
        border-bottom: 1px solid #e2e8f0;
    }
`;

// ─────────────────────────────────────────────────────────────────────────────

const EXERCICES = [
    {
        id: "ch7-ex1-trieur-nombres",
        titre: "Trieur de Nombres",
        chapitre: "CH7 — Structures combinées",
        enonce_md: `
### 🔢 Analyse une série de nombres

Entre une liste de nombres séparés par des virgules. Le programme les analyse et affiche des statistiques complètes.

**Exemple de saisie :** \`12, -3, 8, 0, -5, 15, abc, 7\`

**Statistiques à afficher :**

| Statistique | Explication |
|---|---|
| Nombres valides | Combien de valeurs numériques ont été reconnues |
| Valeurs ignorées | Combien de valeurs n'étaient pas des nombres |
| Somme totale | Somme de tous les nombres valides |
| Moyenne | Somme ÷ nombre de valeurs valides |
| Minimum | La valeur la plus petite |
| Maximum | La valeur la plus grande |
| Positifs | Compte et somme des nombres > 0 |
| Négatifs | Compte et somme des nombres < 0 |
| Pairs / Impairs | Compte des entiers pairs et impairs |

### 📝 Consignes

1. Lis l'input, sépare avec \`.split(",")\`.
2. Boucle sur chaque partie avec \`for\`.
3. Convertis avec \`Number()\` — si \`isNaN\` → \`continue\` (on l'ignore, on compte les ignorés).
4. Accumule les stats avec des variables (\`let min = null\`, etc.).
5. Affiche tout après la boucle.

> 💡 Initialise \`min\` et \`max\` à \`null\` — pas à \`0\` ! Si toutes les valeurs sont négatives, \`0\` comme max serait faux.
        `.trim(),

        theorie_md: `
### Séparer une saisie et boucler dessus

\`\`\`javascript
const saisie  = document.getElementById("inputNombres").value;
const parties = saisie.split(",");   // ["12", " -3", " 8", ...]

for (let i = 0; i < parties.length; i++) {
    const n = Number(parties[i].trim());  // trim() enlève les espaces
    if (isNaN(n)) {
        nbIgnores++;
        continue;   // passe à l'élément suivant
    }
    // ici n est un nombre valide
}
\`\`\`

---

### Les 4 patterns d'accumulation

\`\`\`javascript
// Compteur
let nbPositifs = 0;
if (n > 0) nbPositifs++;

// Somme
let somme = 0;
somme += n;

// Minimum / Maximum
let min = null;
let max = null;
if (min === null || n < min) min = n;
if (max === null || n > max) max = n;

// Pairs / Impairs (entiers uniquement)
if (Number.isInteger(n)) {
    if (n % 2 === 0) nbPairs++;
    else             nbImpairs++;
}
\`\`\`

---

### Afficher une stat

\`\`\`javascript
function stat(label, valeur, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.innerHTML = \`<strong>\${label}</strong> : \${valeur}\`;
    document.getElementById("output").appendChild(d);
}

stat("Minimum", min);
stat("Somme",   somme, "item item-ok");
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🔢 Trieur de Nombres</h2>
    <div class="controls">
      <input id="inputNombres" type="text"
             placeholder="Ex: 12, -3, 8, 0, abc, 15, 7">
      <button id="btnAnalyser">Analyser</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Ton code ici ─────────────────────────────────────────────────────

document.getElementById("btnAnalyser").addEventListener("click", function() {
    const saisie = document.getElementById("inputNombres").value.trim();
    const output = document.getElementById("output");
    output.innerHTML = "";

    // Validation de base
    if (saisie === "") {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Entre au moins un nombre.";
        output.appendChild(e);
        return;
    }

    const parties = saisie.split(",");

    // Initialise tes variables accumulatrices ici
    let nbValides  = 0;
    let nbIgnores  = 0;
    let somme      = 0;
    let min        = null;
    let max        = null;
    let nbPositifs = 0, sommePositifs = 0;
    let nbNegatifs = 0, sommeNegatifs = 0;
    let nbPairs    = 0, nbImpairs     = 0;

    // Boucle sur chaque partie
    for (let i = 0; i < parties.length; i++) {
        const n = Number(parties[i].trim());

        // Si invalide → ignore et continue


        // Accumule les stats


    }

    // Affiche les résultats après la boucle
    // Utilise la fonction stat() ou crée tes propres éléments DOM

});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — La boucle et les accumulateurs**

\`\`\`javascript
for (let i = 0; i < parties.length; i++) {
    const n = Number(parties[i].trim());

    if (isNaN(n)) {
        nbIgnores++;
        continue;   // passe au suivant sans traiter
    }

    nbValides++;
    somme += n;

    if (min === null || n < min) min = n;
    if (max === null || n > max) max = n;

    if (n > 0) { nbPositifs++; sommePositifs += n; }
    if (n < 0) { nbNegatifs++; sommeNegatifs += n; }

    if (Number.isInteger(n)) {
        if (n % 2 === 0) nbPairs++;
        else             nbImpairs++;
    }
}
\`\`\`

Pour la moyenne : \`somme / nbValides\` (vérifie que nbValides > 0 avant de diviser !).
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice combinant boucle for, conditions et accumulation en JS avec DOM.
Il reçoit une string de nombres séparés par virgules, doit les parser avec split()+Number()+trim(), ignorer les invalides (isNaN → continue), puis accumuler : nbValides, nbIgnores, somme, min/max (initialisés à null), nbPositifs/sommePositifs, nbNegatifs/sommeNegatifs, nbPairs/nbImpairs (Number.isInteger).
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points à vérifier : continue après isNaN, min/max initialisés à null et pas 0, division par zero pour la moyenne (if nbValides > 0), Number.isInteger pour pairs/impairs, affichage DOM après la boucle.
Identifie le premier problème et guide avec une question ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète — boucle et affichage :**

\`\`\`javascript
const parties = saisie.split(",");
let nbValides = 0, nbIgnores = 0, somme = 0;
let min = null, max = null;
let nbPositifs = 0, sommePositifs = 0;
let nbNegatifs = 0, sommeNegatifs = 0;
let nbPairs = 0, nbImpairs = 0;

for (let i = 0; i < parties.length; i++) {
    const n = Number(parties[i].trim());
    if (isNaN(n)) { nbIgnores++; continue; }

    nbValides++;
    somme += n;
    if (min === null || n < min) min = n;
    if (max === null || n > max) max = n;
    if (n > 0) { nbPositifs++; sommePositifs += n; }
    if (n < 0) { nbNegatifs++; sommeNegatifs += n; }
    if (Number.isInteger(n)) {
        n % 2 === 0 ? nbPairs++ : nbImpairs++;
    }
}

// Affichage
function stat(lbl, val, cls = "item") {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = \`<strong>\${lbl}</strong> : \${val}\`;
    output.appendChild(d);
}
function titre(t) {
    const d = document.createElement("div");
    d.className = "titre-section";
    d.textContent = t;
    output.appendChild(d);
}

titre("Général");
stat("Nombres valides",  nbValides);
stat("Valeurs ignorées", nbIgnores, "item item-warn");
stat("Somme",            somme);
stat("Moyenne",          nbValides > 0
    ? (somme / nbValides).toFixed(2)
    : "N/A");
stat("Minimum",          min ?? "N/A");
stat("Maximum",          max ?? "N/A");

titre("Répartition");
stat("Positifs", \`\${nbPositifs} (somme : \${sommePositifs})\`, "item item-ok");
stat("Négatifs", \`\${nbNegatifs} (somme : \${sommeNegatifs})\`);
stat("Pairs / Impairs",  \`\${nbPairs} / \${nbImpairs}\`);
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch7-ex2-pyramide",
        titre: "Pyramide Personnalisée",
        chapitre: "CH7 — Structures combinées",
        enonce_md: `
### 🔺 Génère une pyramide de caractères

Entre une hauteur, un caractère et un style — la pyramide s'affiche dans la page.

**3 styles disponibles :**

\`Triangle plein\` (hauteur 5, caractère \`*\`) :
\`\`\`
*
**
***
****
*****
\`\`\`

\`Triangle creux\` (hauteur 5) :
\`\`\`
*
**
* *
*  *
*****
\`\`\`

\`Pyramide centrée\` (hauteur 5) :
\`\`\`
    *
   ***
  *****
 *******
*********
\`\`\`

### 📝 Consignes

1. Lis la hauteur (1-15), le caractère, et le style choisi dans le \`<select>\`.
2. Valide : hauteur valide, caractère non vide (prends uniquement le 1er caractère).
3. Boucle extérieure sur les lignes (1 à hauteur).
4. Boucle intérieure pour construire chaque ligne caractère par caractère.
5. Pour **Triangle creux** : affiche le caractère seulement si \`col === 1\`, \`col === row\` ou \`row === hauteur\`.
6. Pour **Pyramide centrée** : ajoute \`hauteur - row\` espaces avant les caractères.
7. Crée un \`<div class="ligne">\` par ligne et appende-le à l'output.

> 💡 Construis chaque ligne comme une string avec \`+=\`, puis affecte-la à \`div.textContent\`.
        `.trim(),

        theorie_md: `
### Boucles imbriquées — le principe

La boucle extérieure contrôle les **lignes**, la boucle intérieure construit **chaque ligne**.

\`\`\`javascript
for (let row = 1; row <= hauteur; row++) {
    let ligne = "";                         // repart de zéro à chaque ligne

    for (let col = 1; col <= row; col++) {
        ligne += car;                       // ajoute un caractère
    }

    // ligne vaut "*", "**", "***", etc.
    const div = document.createElement("div");
    div.className = "ligne";
    div.textContent = ligne;
    output.appendChild(div);
}
\`\`\`

---

### Condition à l'intérieur de la boucle intérieure

Pour le triangle creux :
\`\`\`javascript
for (let col = 1; col <= row; col++) {
    // Affiche le car si : 1er col, dernier col, ou dernière ligne
    if (col === 1 || col === row || row === hauteur) {
        ligne += car;
    } else {
        ligne += " ";   // espace pour l'intérieur
    }
}
\`\`\`

---

### Espaces pour la pyramide centrée

\`\`\`javascript
for (let row = 1; row <= hauteur; row++) {
    // Espaces de gauche : diminuent à chaque ligne
    let ligne = " ".repeat(hauteur - row);

    // Caractères : augmentent à chaque ligne (formule 2*row - 1)
    for (let col = 1; col <= 2 * row - 1; col++) {
        ligne += car;
    }

    // ...créer et appender le div
}
\`\`\`

---

### Lire un \`<select>\`

\`\`\`javascript
const style = document.getElementById("selectStyle").value;
// value vaut "plein", "creux" ou "centre" selon l'option choisie
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    .ligne {
        font-family: 'Courier New', monospace;
        font-size: 1.1rem;
        white-space: pre;
        background: white;
        padding: 1px 12px;
        border-radius: 4px;
        letter-spacing: 2px;
        box-shadow: none;
        border: none;
        color: #1e1b4b;
    }
    #output { gap: 2px; }
\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🔺 Pyramide Personnalisée</h2>
    <div class="controls">
      <input id="inputHauteur"   type="number" min="1" max="15" placeholder="Hauteur (1-15)" style="max-width:140px">
      <input id="inputCar"       type="text"   maxlength="1"    placeholder="Caractère"      style="max-width:100px">
      <select id="selectStyle">
        <option value="plein">Triangle plein</option>
        <option value="creux">Triangle creux</option>
        <option value="centre">Pyramide centrée</option>
      </select>
      <button id="btnGenerer">Générer</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Ton code ici ─────────────────────────────────────────────────────

document.getElementById("btnGenerer").addEventListener("click", function() {
    const hauteur = Number(document.getElementById("inputHauteur").value);
    const carSaisi = document.getElementById("inputCar").value;
    const styleChoisi = document.getElementById("selectStyle").value;
    const output = document.getElementById("output");
    output.innerHTML = "";

    // 1. Validation


    // Prend uniquement le 1er caractère
    const car = carSaisi[0];

    // 2. Boucle extérieure sur les lignes
    for (let row = 1; row <= hauteur; row++) {
        let ligne = "";

        // 3. Construis la ligne selon le style choisi
        if (styleChoisi === "plein") {
            // Boucle intérieure : row caractères


        } else if (styleChoisi === "creux") {
            // Boucle intérieure : car si bord, espace sinon


        } else if (styleChoisi === "centre") {
            // Espaces + boucle intérieure (2*row-1 caractères)


        }

        // 4. Crée et ajoute le div pour cette ligne
        const div = document.createElement("div");
        div.className = "ligne";
        div.textContent = ligne;
        output.appendChild(div);
    }
});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Triangle plein et creux**

**Triangle plein :**
\`\`\`javascript
if (styleChoisi === "plein") {
    for (let col = 1; col <= row; col++) {
        ligne += car;
    }
}
\`\`\`

**Triangle creux :**
\`\`\`javascript
else if (styleChoisi === "creux") {
    for (let col = 1; col <= row; col++) {
        if (col === 1 || col === row || row === hauteur) {
            ligne += car;
        } else {
            ligne += " ";
        }
    }
}
\`\`\`

**Pyramide centrée :**
\`\`\`javascript
else if (styleChoisi === "centre") {
    ligne = " ".repeat(hauteur - row);   // espaces à gauche
    for (let col = 1; col <= 2 * row - 1; col++) {
        ligne += car;
    }
}
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de boucles imbriquées JS avec DOM : générer une pyramide de caractères en 3 styles.
Triangle plein : boucle intérieure col 1 à row, ajoute car. Triangle creux : même boucle mais ajoute car seulement si col===1 || col===row || row===hauteur, sinon espace. Pyramide centrée : " ".repeat(hauteur-row) puis boucle col 1 à 2*row-1.
Dans tous les cas : div.className="ligne", div.textContent=ligne, output.appendChild(div).
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points à vérifier : validation hauteur (1-15) et car non vide, car = carSaisi[0] (1 seul char), structure if/else if sur styleChoisi, boucle extérieure row 1 à hauteur, boucle intérieure correcte par style, div créé et appendé à chaque ligne.
Identifie le premier problème visible et guide avec une question.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
document.getElementById("btnGenerer").addEventListener("click", function() {
    const hauteur     = Number(document.getElementById("inputHauteur").value);
    const carSaisi    = document.getElementById("inputCar").value.trim();
    const styleChoisi = document.getElementById("selectStyle").value;
    const output      = document.getElementById("output");
    output.innerHTML  = "";

    // Validation
    if (isNaN(hauteur) || hauteur < 1 || hauteur > 15) {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Hauteur invalide — entre 1 et 15.";
        output.appendChild(e);
        return;
    }
    if (carSaisi === "") {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Entre un caractère.";
        output.appendChild(e);
        return;
    }

    const car = carSaisi[0];   // 1 seul caractère

    for (let row = 1; row <= hauteur; row++) {
        let ligne = "";

        if (styleChoisi === "plein") {
            for (let col = 1; col <= row; col++) {
                ligne += car;
            }
        } else if (styleChoisi === "creux") {
            for (let col = 1; col <= row; col++) {
                if (col === 1 || col === row || row === hauteur) {
                    ligne += car;
                } else {
                    ligne += " ";
                }
            }
        } else if (styleChoisi === "centre") {
            ligne = " ".repeat(hauteur - row);
            for (let col = 1; col <= 2 * row - 1; col++) {
                ligne += car;
            }
        }

        const div = document.createElement("div");
        div.className = "ligne";
        div.textContent = ligne;
        output.appendChild(div);
    }
});
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 7 : Structures combinées...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 7 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch7-ex1-trieur-nombres  (for+conditions, accumulation, min/max)");
    console.log("  - ch7-ex2-pyramide        (boucles imbriquées, condition intérieure)");
}

seed();
