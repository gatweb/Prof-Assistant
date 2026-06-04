const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 6 : Boucles
//
// NOUVEAU : approche DOM à partir de ce chapitre.
// Plus de prompt() ni de console.log() pour les résultats.
// Le code_depart crée une interface HTML (input + bouton + output)
// directement depuis le JS. L'élève complète l'event listener.
//
// Pattern de base dans chaque exercice :
//   1. Setup UI (créé dans code_depart, ne pas modifier)
//   2. addEventListener sur le bouton
//   3. Lire input.value
//   4. output.innerHTML = "" (vider)
//   5. Boucle → createElement → appendChild
//
// 3 exercices :
//   ch6-ex1 : Table de multiplication  (for classique, DOM)
//   ch6-ex2 : Analyseur de texte       (for sur string, conditions + DOM)
//   ch6-ex3 : FizzBuzz Visuel          (for + if/else + modulo + DOM coloré)
// ============================================================

// ─── Setup UI générique ──────────────────────────────────────────────────────
// Chaque exercice a son propre setup (inputs différents) — pas de helper partagé.
// Les styles de base sont communs, définis dans chaque SETUP_*.
// ─────────────────────────────────────────────────────────────────────────────

const STYLES_BASE = `
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', sans-serif;
        background: #f1f5f9;
        margin: 0;
        padding: 1.5rem;
        min-height: 100vh;
    }
    .app {
        max-width: 580px;
        margin: 0 auto;
    }
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
    }
    input[type="number"], input[type="text"] {
        flex: 1;
        padding: .6rem .9rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        outline: none;
        transition: border-color .2s;
        min-width: 120px;
    }
    input:focus { border-color: #4f46e5; }
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
    }
    button:hover { background: #3730a3; }
    #output {
        display: flex;
        flex-direction: column;
        gap: .4rem;
    }
    .item {
        background: white;
        border-left: 4px solid #4f46e5;
        padding: .5rem 1rem;
        border-radius: 0 8px 8px 0;
        font-size: .95rem;
        box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .item strong { color: #4f46e5; }
    .erreur {
        background: #fef2f2;
        border-left-color: #dc2626;
        color: #991b1b;
        padding: .6rem 1rem;
        border-radius: 0 8px 8px 0;
    }
`;

// ─────────────────────────────────────────────────────────────────────────────

const EXERCICES = [
    {
        id: "ch6-ex1-table-multiplication",
        titre: "Table de Multiplication",
        chapitre: "CH6 — Boucles",
        enonce_md: `
### ✖️ Génère une table de multiplication

Entre un nombre entre 1 et 20, clique sur **Générer** — la table complète s'affiche dans la page.

**Exemple pour le nombre 7 :**
\`\`\`
7 × 1  =  7
7 × 2  =  14
7 × 3  =  21
...
7 × 10 = 70
\`\`\`

### 📝 Consignes

1. Récupère la valeur de l'input avec \`document.getElementById("inputN").value\`.
2. Convertis en nombre avec \`Number()\` et valide (entre 1 et 20).
3. Vide l'output : \`output.innerHTML = ""\`.
4. Utilise une boucle \`for\` de 1 à 10.
5. À chaque tour, crée un \`<div class="item">\` et affiche la ligne de multiplication.
6. Ajoute chaque div à l'output avec \`appendChild()\`.

> 💡 Récupère le conteneur une seule fois avant la boucle :
> \`const output = document.getElementById("output");\`
        `.trim(),

        theorie_md: `
### La boucle for — syntaxe

\`\`\`javascript
for (let i = 1; i <= 10; i++) {
    // i vaut 1, 2, 3, ... 10
}
\`\`\`

**Les 3 parties :**
- \`let i = 1\` : initialisation (une seule fois)
- \`i <= 10\` : condition vérifiée avant chaque tour
- \`i++\` : incrément exécuté après chaque tour

---

### Lire un input et créer des éléments DOM

\`\`\`javascript
// Lire la valeur de l'input
const n = Number(document.getElementById("inputN").value);

// Récupérer le conteneur de résultats
const output = document.getElementById("output");
output.innerHTML = "";   // vider avant de regénérer

// Créer et insérer un élément
const div = document.createElement("div");
div.className = "item";
div.textContent = "Mon texte";
output.appendChild(div);
\`\`\`

---

### Template literal dans une boucle

\`\`\`javascript
const n = 7;
for (let i = 1; i <= 10; i++) {
    const div = document.createElement("div");
    div.textContent = \`\${n} × \${i} = \${n * i}\`;
    output.appendChild(div);
}
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>✖️ Table de Multiplication</h2>
    <div class="controls">
      <input id="inputN" type="number" min="1" max="20" placeholder="Nombre (1-20)">
      <button id="btnGenerer">Générer</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Ton code ici ─────────────────────────────────────────────────────

document.getElementById("btnGenerer").addEventListener("click", function() {
    const n      = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";

    // 1. Valide n (entre 1 et 20)


    // 2. Boucle for de 1 à 10 — crée et affiche chaque ligne


});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure complète**

\`\`\`javascript
document.getElementById("btnGenerer").addEventListener("click", function() {
    const n      = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";

    // Validation
    if (isNaN(n) || n < 1 || n > 20) {
        const err = document.createElement("div");
        err.className = "erreur";
        err.textContent = "Entre un nombre entre 1 et 20.";
        output.appendChild(err);
        return;   // stop — ne va pas plus loin
    }

    // Boucle
    for (let i = 1; i <= 10; i++) {
        const div = document.createElement("div");
        div.className = "item";
        div.textContent = \`\${n} × \${i} = ...\`;  // complète le calcul
        output.appendChild(div);
    }
});
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de boucle for en JS avec manipulation DOM.
Il doit : lire un input numérique (1-20), valider, puis générer 10 lignes de table de multiplication (n×i pour i de 1 à 10) en créant des <div class="item"> et en les appendant à l'output.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après la ligne "═══".
Points à vérifier : lecture correcte de input.value avec Number(), validation (isNaN, hors plage), output.innerHTML="" avant la boucle, boucle for de 1 à 10, createElement + className + textContent + appendChild à chaque itération, calcul correct n*i.
Identifie le premier problème et guide avec une question ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
document.getElementById("btnGenerer").addEventListener("click", function() {
    const n      = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";

    if (isNaN(n) || n < 1 || n > 20) {
        const err = document.createElement("div");
        err.className = "erreur";
        err.textContent = "Nombre invalide — entre 1 et 20.";
        output.appendChild(err);
        return;
    }

    for (let i = 1; i <= 10; i++) {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = \`<strong>\${n}</strong> × \${i} = <strong>\${n * i}</strong>\`;
        output.appendChild(div);
    }
});
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch6-ex2-analyseur-texte",
        titre: "Analyseur de Texte",
        chapitre: "CH6 — Boucles",
        enonce_md: `
### 🔬 Analyse un texte caractère par caractère

Entre un texte dans le champ et clique sur **Analyser**. Le programme parcourt chaque caractère avec une boucle \`for\` et affiche les statistiques.

**Statistiques à afficher :**
- Longueur totale (avec espaces)
- Nombre de voyelles (a, e, i, o, u, y — majuscules et minuscules)
- Nombre de consonnes (lettres qui ne sont pas des voyelles)
- Nombre d'espaces
- Nombre de chiffres (0-9)
- Nombre de caractères spéciaux (tout le reste)
- Le caractère le plus fréquent

### 📝 Consignes

1. Valide que le champ n'est pas vide.
2. Parcours le texte avec \`for (let i = 0; i < texte.length; i++)\`.
3. À chaque caractère, utilise des \`if/else if\` pour l'incrémenter dans la bonne catégorie.
4. Affiche chaque stat dans la page avec un \`<div class="item">\`.
5. **Bonus :** pour le caractère le plus fréquent, utilise un objet de comptage \`{}\` — si tu ne connais pas encore, passe cette partie.

> 💡 Pour détecter les voyelles : \`"aeiouyAEIOUY".includes(caractere)\`
> Pour détecter les chiffres : \`caractere >= "0" && caractere <= "9"\`
        `.trim(),

        theorie_md: `
### Parcourir une string avec for

\`\`\`javascript
const texte = "Hello !";

for (let i = 0; i < texte.length; i++) {
    const car = texte[i];   // caractère à l'indice i
    console.log(car);        // H, e, l, l, o, ' ', !
}
\`\`\`

---

### Compter avec des variables accumulateurs

\`\`\`javascript
let voyelles = 0;
let espaces  = 0;

for (let i = 0; i < texte.length; i++) {
    const car = texte[i];

    if ("aeiouyAEIOUY".includes(car)) {
        voyelles++;
    } else if (car === " ") {
        espaces++;
    }
    // else if ... pour les autres catégories
}
\`\`\`

---

### Détecter des chiffres sans regex

\`\`\`javascript
const car = "5";
if (car >= "0" && car <= "9") {
    // c'est un chiffre
    // JS compare les caractères par ordre alphabétique (valeur Unicode)
    // "0" < "1" < ... < "9" — ça fonctionne pour les chiffres
}
\`\`\`

---

### Afficher les statistiques

\`\`\`javascript
function ajouterStat(label, valeur) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = \`<strong>\${label}</strong> : \${valeur}\`;
    document.getElementById("output").appendChild(div);
}

ajouterStat("Voyelles", compteurVoyelles);
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }
    .item-num { font-size: 1.4rem; font-weight: 700; color: #4f46e5; }
\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🔬 Analyseur de Texte</h2>
    <div class="controls">
      <input id="inputTexte" type="text" placeholder="Entre ton texte ici...">
      <button id="btnAnalyser">Analyser</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Ton code ici ─────────────────────────────────────────────────────

document.getElementById("btnAnalyser").addEventListener("click", function() {
    const texte  = document.getElementById("inputTexte").value;
    const output = document.getElementById("output");
    output.innerHTML = "";

    // 1. Valide que le texte n'est pas vide


    // 2. Initialise les compteurs
    let nbVoyelles  = 0;
    let nbConsonnes = 0;
    let nbEspaces   = 0;
    let nbChiffres  = 0;
    let nbSpeciaux  = 0;
    const VOYELLES  = "aeiouyAEIOUY";

    // 3. Boucle sur chaque caractère avec if/else if


    // 4. Affiche les résultats

});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — La boucle et les catégories**

\`\`\`javascript
for (let i = 0; i < texte.length; i++) {
    const car = texte[i];   // caractère courant

    if (VOYELLES.includes(car)) {
        nbVoyelles++;
    } else if (car === " ") {
        nbEspaces++;
    } else if (car >= "0" && car <= "9") {
        nbChiffres++;
    } else if (car >= "a" && car <= "z" || car >= "A" && car <= "Z") {
        nbConsonnes++;   // lettre qui n'est pas une voyelle
    } else {
        nbSpeciaux++;    // ponctuation, symboles...
    }
}
\`\`\`

Pour afficher ensuite :
\`\`\`javascript
function ajouterStat(label, val) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = \`<strong>\${label}</strong> : \${val}\`;
    output.appendChild(div);
}
ajouterStat("Voyelles", nbVoyelles);
// etc.
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de boucle for sur une string avec compteurs et DOM.
Il doit : lire un input texte, valider (non vide), parcourir chaque caractère avec for+[i], catégoriser (voyelles:"aeiouyAEIOUY".includes(), espaces:===" ", chiffres:>="0"&&<="9", consonnes:lettre non voyelle, spéciaux:reste), puis afficher les 6 stats en DOM.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points à vérifier : boucle for correcte (i < texte.length), accès par texte[i], ordre des else if (voyelles avant consonnes), incrémentations correctes, affichage DOM avec createElement/appendChild.
Identifie le premier problème et pose une question ciblée sans donner le code.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
document.getElementById("btnAnalyser").addEventListener("click", function() {
    const texte  = document.getElementById("inputTexte").value;
    const output = document.getElementById("output");
    output.innerHTML = "";

    if (texte.trim() === "") {
        const err = document.createElement("div");
        err.className = "erreur";
        err.textContent = "Le champ est vide — entre un texte.";
        output.appendChild(err);
        return;
    }

    const VOYELLES  = "aeiouyAEIOUY";
    let nbVoyelles  = 0, nbConsonnes = 0;
    let nbEspaces   = 0, nbChiffres  = 0, nbSpeciaux = 0;

    for (let i = 0; i < texte.length; i++) {
        const car = texte[i];
        if (VOYELLES.includes(car)) {
            nbVoyelles++;
        } else if (car === " ") {
            nbEspaces++;
        } else if (car >= "0" && car <= "9") {
            nbChiffres++;
        } else if ((car >= "a" && car <= "z") || (car >= "A" && car <= "Z")) {
            nbConsonnes++;
        } else {
            nbSpeciaux++;
        }
    }

    function stat(label, val) {
        const d = document.createElement("div");
        d.className = "item";
        d.innerHTML = \`<strong>\${label}</strong> : \${val}\`;
        output.appendChild(d);
    }

    stat("Longueur totale", texte.length);
    stat("Voyelles",        nbVoyelles);
    stat("Consonnes",       nbConsonnes);
    stat("Espaces",         nbEspaces);
    stat("Chiffres",        nbChiffres);
    stat("Caractères spéciaux", nbSpeciaux);
});
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch6-ex3-fizzbuzz-visuel",
        titre: "FizzBuzz Visuel",
        chapitre: "CH6 — Boucles",
        enonce_md: `
### 🎨 Le classique des entretiens de dev, version visuelle

FizzBuzz est un exercice légendaire posé dans les entretiens d'embauche depuis des décennies. Simple à comprendre, instructif à coder.

**Règles :**
- Pour chaque nombre de 1 à N (N saisi par l'utilisateur) :
  - Si le nombre est divisible par **3 et 5** → affiche **"FizzBuzz"** (fond violet)
  - Si divisible par **3 seulement** → affiche **"Fizz"** (fond vert)
  - Si divisible par **5 seulement** → affiche **"Buzz"** (fond orange)
  - Sinon → affiche le **nombre** (fond neutre)

**Exemple pour N = 15 :**
> 1 | 2 | **Fizz** | 4 | **Buzz** | **Fizz** | 7 | 8 | **Fizz** | **Buzz** | 11 | **Fizz** | 13 | 14 | **FizzBuzz**

### 📝 Consignes

1. Valide N : nombre entier entre 1 et 100.
2. Boucle \`for\` de 1 à N.
3. Utilise \`if / else if / else\` avec le **modulo \`%\`** pour déterminer la catégorie.
4. Crée un \`<span>\` par nombre avec la classe CSS correspondante.
5. **Ordre critique :** teste FizzBuzz (divisible par 3 ET 5) **en premier**.

> ⚠️ Si tu testes "divisible par 3" avant "divisible par 15", les multiples de 15 seront classés en Fizz à tort.
        `.trim(),

        theorie_md: `
### Le modulo % — rappel

\`\`\`javascript
10 % 3   // 1  — reste de 10 ÷ 3
15 % 3   // 0  — 15 est divisible par 3
15 % 5   // 0  — 15 est divisible par 5
\`\`\`

**"Divisible par X"** ↔ **reste = 0** ↔ \`n % X === 0\`

---

### Ordre des conditions — crucial ici

\`\`\`javascript
// ❌ Mauvais ordre — 15 sera classé "Fizz" à tort
if (n % 3 === 0) { ... "Fizz" }
else if (n % 5 === 0) { ... "Buzz" }
else if (n % 3 === 0 && n % 5 === 0) { ... "FizzBuzz" } // jamais atteint !

// ✅ Bon ordre — FizzBuzz en premier
if (n % 3 === 0 && n % 5 === 0) { ... "FizzBuzz" }
else if (n % 3 === 0) { ... "Fizz" }
else if (n % 5 === 0) { ... "Buzz" }
else { ... nombre }
\`\`\`

---

### Ajouter une classe CSS dynamiquement

\`\`\`javascript
const span = document.createElement("span");
span.className = "fizz";      // classe CSS à appliquer
span.textContent = "Fizz";
output.appendChild(span);
\`\`\`

Les classes \`.fizz\`, \`.buzz\`, \`.fizzbuzz\`, \`.nombre\` sont déjà définies dans les styles — tu n'as qu'à les assigner.
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    #output {
        flex-direction: row;
        flex-wrap: wrap;
        gap: .35rem;
    }
    .nombre, .fizz, .buzz, .fizzbuzz {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 52px;
        padding: .4rem .6rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: .9rem;
    }
    .nombre   { background: #f1f5f9; color: #475569; }
    .fizz     { background: #dcfce7; color: #166534; }
    .buzz     { background: #ffedd5; color: #9a3412; }
    .fizzbuzz { background: #ede9fe; color: #5b21b6; }
\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🎨 FizzBuzz Visuel</h2>
    <div class="controls">
      <input id="inputN" type="number" min="1" max="100" placeholder="Maximum (1-100)">
      <button id="btnLancer">Lancer</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Ton code ici ─────────────────────────────────────────────────────

document.getElementById("btnLancer").addEventListener("click", function() {
    const n      = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";

    // 1. Valide n (entier entre 1 et 100)


    // 2. Boucle for de 1 à n
    //    Pour chaque i : détermine la catégorie et la classe CSS
    //    Crée un <span> avec la bonne classe et le bon texte
    //    Teste FizzBuzz EN PREMIER !


});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — La structure de la boucle**

\`\`\`javascript
for (let i = 1; i <= n; i++) {
    const span = document.createElement("span");

    if (i % 3 === 0 && i % 5 === 0) {
        span.className = "fizzbuzz";
        span.textContent = "FizzBuzz";
    } else if (i % 3 === 0) {
        span.className = "fizz";
        span.textContent = "Fizz";
    } else if (i % 5 === 0) {
        span.className = "buzz";
        span.textContent = "Buzz";
    } else {
        span.className = "nombre";
        span.textContent = i;    // le nombre lui-même
    }

    output.appendChild(span);
}
\`\`\`

N'oublie pas la validation de n avant la boucle !
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur FizzBuzz en JS avec boucle for et DOM.
Il doit : lire un input (1-100), valider, puis pour chaque i de 1 à n créer un span avec la bonne classe (fizzbuzz si i%3===0&&i%5===0, fizz si i%3===0, buzz si i%5===0, nombre sinon) et l'appender à l'output.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Erreurs fréquentes : ordre des conditions (fizzbuzz pas testé en premier), utilisation de == au lieu de ===, oubli de output.innerHTML="", className incorrect (doit correspondre exactement aux classes CSS définies : "fizz","buzz","fizzbuzz","nombre"), textContent = i au lieu d'une string pour les nombres.
Identifie le problème principal et pose une question ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
document.getElementById("btnLancer").addEventListener("click", function() {
    const n      = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";

    if (isNaN(n) || n < 1 || n > 100 || !Number.isInteger(n)) {
        const err = document.createElement("div");
        err.className = "erreur";
        err.textContent = "Entre un nombre entier entre 1 et 100.";
        output.appendChild(err);
        return;
    }

    for (let i = 1; i <= n; i++) {
        const span = document.createElement("span");

        if (i % 3 === 0 && i % 5 === 0) {
            span.className = "fizzbuzz";
            span.textContent = "FizzBuzz";
        } else if (i % 3 === 0) {
            span.className = "fizz";
            span.textContent = "Fizz";
        } else if (i % 5 === 0) {
            span.className = "buzz";
            span.textContent = "Buzz";
        } else {
            span.className = "nombre";
            span.textContent = i;
        }

        output.appendChild(span);
    }
});
\`\`\`

**Bonus :** \`Number.isInteger(n)\` vérifie que c'est bien un entier (pas 3.7 par exemple).
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 6 : Boucles (approche DOM)...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 6 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch6-ex1-table-multiplication  (for, DOM, createElement)");
    console.log("  - ch6-ex2-analyseur-texte        (for sur string, compteurs, DOM)");
    console.log("  - ch6-ex3-fizzbuzz-visuel        (for + if/else + modulo, DOM coloré)");
    console.log("\n📌 CHANGEMENT : ces exercices utilisent le DOM (input + button)");
    console.log("   plus de prompt() ni console.log() pour les résultats.");
}

seed();
