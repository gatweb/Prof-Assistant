const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 9 : Algorithmes
//
// Ce chapitre est méthodologique — les exercices testent
// la capacité à lire/traduire/déboguer, pas à inventer.
//
// 2 exercices DOM :
//   ch9-ex1 : Traducteur        (lire pseudo-code → écrire JS)
//   ch9-ex2 : Débogueur         (identifier + corriger + améliorer)
// ============================================================

const STYLES_BASE = `
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', sans-serif;
        background: #f1f5f9;
        margin: 0; padding: 1.5rem;
        min-height: 100vh;
    }
    .app { max-width: 600px; margin: 0 auto; }
    h2 {
        color: #1e1b4b; margin: 0 0 .5rem;
        font-size: 1.2rem;
        border-bottom: 2px solid #4f46e5;
        padding-bottom: .5rem;
    }
    .controls {
        display: flex; gap: .6rem;
        margin-bottom: .8rem; flex-wrap: wrap;
    }
    input[type="number"] {
        flex: 1; padding: .6rem .9rem;
        border: 2px solid #e2e8f0; border-radius: 8px;
        font-size: 1rem; outline: none;
        transition: border-color .2s; min-width: 80px;
    }
    input:focus { border-color: #4f46e5; }
    button {
        padding: .6rem 1.4rem; background: #4f46e5;
        color: white; border: none; border-radius: 8px;
        font-size: 1rem; font-weight: 600;
        cursor: pointer; transition: background .2s;
    }
    button:hover { background: #3730a3; }
    #output { display: flex; flex-direction: column; gap: .4rem; margin-top: .6rem; }
    .item {
        background: white;
        border-left: 4px solid #4f46e5;
        padding: .5rem 1rem; border-radius: 0 8px 8px 0;
        font-size: .95rem; box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .item strong { color: #4f46e5; }
    .item-ok   { border-left-color: #16a34a; }
    .item-ok strong { color: #16a34a; }
    .item-warn { border-left-color: #d97706; }
    .item-info { border-left-color: #0ea5e9; }
    .item-info strong { color: #0369a1; }
    .erreur {
        background: #fef2f2; border-left-color: #dc2626;
        color: #991b1b; padding: .6rem 1rem;
        border-radius: 0 8px 8px 0;
    }
    .titre-bloc {
        font-weight: 700; color: #1e1b4b; font-size: 1rem;
        margin-top: .8rem; padding: .3rem 0 .2rem;
        border-bottom: 1px solid #e2e8f0;
    }
`;

// ─────────────────────────────────────────────────────────────────────────────

const EXERCICES = [
    {
        id: "ch9-ex1-traducteur-algo",
        titre: "Traducteur d'Algorithme",
        chapitre: "CH9 — Algorithmes",
        enonce_md: `
### 📐 Traduis cet algorithme en JavaScript

Voici un algorithme en pseudo-code. Traduis-le en JavaScript fonctionnel dans l'interface DOM fournie.

---

\`\`\`
ALGO NombrePremier
  VARIABLE n : entier
           i : entier
           estPremier : booléen

  DÉBUT
    LIRE n

    SI n < 2 ALORS
      AFFICHER "❌ " + n + " n'est pas un nombre premier"
      SORTIR
    FIN SI

    estPremier ← VRAI

    POUR i DE 2 À racine_entière(n) FAIRE
      SI n MOD i = 0 ALORS
        estPremier ← FAUX
        SORTIR DE LA BOUCLE
      FIN SI
    FIN POUR

    SI estPremier = VRAI ALORS
      AFFICHER "✅ " + n + " est un nombre premier"
      AFFICHER "Diviseurs : 1 et " + n + " uniquement"
    SINON
      AFFICHER "❌ " + n + " n'est pas un nombre premier"
      AFFICHER ses diviseurs (tous les i tels que n MOD i = 0)
    FIN SI
  FIN
\`\`\`

---

### 📝 Consignes

1. **Lis l'algorithme en entier** avant d'écrire une ligne de JS.
2. Trace son exécution sur papier avec \`n = 7\` (premier) et \`n = 12\` (non premier).
3. Traduis chaque ligne selon la table de correspondance du cours.
4. **Note importante :** \`racine_entière(n)\` = \`Math.floor(Math.sqrt(n))\` en JS.
5. Pour afficher les diviseurs du cas non-premier : utilise une **deuxième boucle** de 1 à n.
6. **Commente** chaque bloc de ton code avec le numéro de l'étape correspondante dans l'algo.

> 💡 Pourquoi s'arrêter à √n ? Si n a un diviseur > √n, il en a un correspondant < √n déjà trouvé. Inutile d'aller plus loin.

**Valeurs de test :**
| n | Résultat attendu |
|---|---|
| 2 | Premier |
| 7 | Premier |
| 12 | Non premier (diviseurs : 1, 2, 3, 4, 6, 12) |
| 1 | Non premier (< 2) |
| 97 | Premier |
        `.trim(),

        theorie_md: `
### Table de correspondance pseudo-code → JS

| Pseudo-code | JavaScript |
|---|---|
| \`variable ← valeur\` | \`let variable = valeur;\` |
| \`LIRE n\` | \`const n = Number(input.value);\` |
| \`AFFICHER "texte"\` | \`afficher("texte")\` |
| \`SI cond ALORS\` | \`if (cond) {\` |
| \`SINON\` | \`} else {\` |
| \`FIN SI\` | \`}\` |
| \`POUR i DE 2 À fin FAIRE\` | \`for (let i = 2; i <= fin; i++) {\` |
| \`FIN POUR\` | \`}\` |
| \`SORTIR DE LA BOUCLE\` | \`break;\` |
| \`SORTIR\` (quitter l'algo) | \`return;\` |
| \`n MOD i\` | \`n % i\` |
| \`racine_entière(n)\` | \`Math.floor(Math.sqrt(n))\` |
| \`estPremier ← VRAI\` | \`let estPremier = true;\` |

---

### Démarche de traduction

1. Lire l'algo entier avant d'écrire
2. Identifier les variables et leurs types
3. Identifier les entrées (\`LIRE\`) et sorties (\`AFFICHER\`)
4. Traduire structure par structure
5. Tester avec des valeurs connues
6. Ajouter les commentaires

---

### L'optimisation de la borne (√n)

\`\`\`javascript
// Au lieu de : for (let i = 2; i <= n; i++)
// On s'arrête à √n : si n = 36, √36 = 6
// Si 36 % 2 = 0 → 2 est diviseur ET 18 est diviseur
// Pas besoin de tester 18 séparément
for (let i = 2; i <= Math.floor(Math.sqrt(n)); i++) {
    if (n % i === 0) { estPremier = false; break; }
}
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>📐 Nombre Premier</h2>
    <div class="controls">
      <input id="inputN" type="number" min="1" placeholder="Entre un entier positif...">
      <button id="btnVerifier">Vérifier</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── Helpers d'affichage ──────────────────────────────────────────────
function afficher(texte, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.textContent = texte;
    document.getElementById("output").appendChild(d);
}
function titreSec(t) {
    const d = document.createElement("div");
    d.className = "titre-bloc";
    d.textContent = t;
    document.getElementById("output").appendChild(d);
}

// ─── Traduis l'algorithme ici ─────────────────────────────────────────
document.getElementById("btnVerifier").addEventListener("click", function() {
    document.getElementById("output").innerHTML = "";

    // ÉTAPE 1 — Lire n et valider
    // LIRE n
    // SI n < 2 ALORS AFFICHER "..." SORTIR FIN SI


    // ÉTAPE 2 — Initialiser estPremier à VRAI
    // estPremier ← VRAI


    // ÉTAPE 3 — Boucle POUR i DE 2 À racine_entière(n)
    //   SI n MOD i = 0 ALORS estPremier ← FAUX, SORTIR DE LA BOUCLE


    // ÉTAPE 4 — Afficher le résultat selon estPremier
    // SI estPremier → premier
    // SINON → non premier + afficher les diviseurs (2ème boucle de 1 à n)


});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Étapes 1 et 2**

\`\`\`javascript
// ÉTAPE 1 — Lire n
const n = Number(document.getElementById("inputN").value);

if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
    afficher("Entre un entier positif.", "erreur");
    return;
}

if (n < 2) {
    afficher(\`❌ \${n} n'est pas un nombre premier\`, "item item-warn");
    return;   // SORTIR de l'algorithme
}

// ÉTAPE 2 — estPremier ← VRAI
let estPremier = true;
\`\`\`

Pour l'étape 3, la borne de la boucle est \`Math.floor(Math.sqrt(n))\`.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur la traduction d'un algorithme pseudo-code en JS. L'algorithme vérifie si un nombre est premier.
Structure attendue : (1) lire n + validation + cas n<2 avec return, (2) let estPremier = true, (3) for i de 2 à Math.floor(Math.sqrt(n)), si n%i===0 → estPremier=false + break, (4) if estPremier → afficher premier, else → afficher non premier + 2ème boucle de 1 à n pour les diviseurs.
Valeurs de test : n=7→premier, n=12→non premier (diviseurs 1,2,3,4,6,12), n=97→premier.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points à vérifier : borne Math.floor(Math.sqrt(n)) (pas juste n), break après estPremier=false, return après le cas n<2, deuxième boucle de 1 à n (pas de 2 à √n) pour les diviseurs, commentaires présents.
Identifie le premier problème et guide avec une question ciblée.`,

            niveau_3_md: `
🛠️ **Traduction complète avec commentaires :**

\`\`\`javascript
document.getElementById("btnVerifier").addEventListener("click", function() {
    document.getElementById("output").innerHTML = "";

    // ÉTAPE 1 — LIRE n + validation initiale
    const n = Number(document.getElementById("inputN").value);
    if (isNaN(n) || !Number.isInteger(n) || n < 1) {
        afficher("Entre un entier positif.", "erreur");
        return;
    }

    // Cas spécial : n < 2 → pas premier par définition
    if (n < 2) {
        afficher(\`❌ \${n} n'est pas un nombre premier\`, "item item-warn");
        return;   // SORTIR de l'algorithme
    }

    // ÉTAPE 2 — estPremier ← VRAI
    let estPremier = true;

    // ÉTAPE 3 — POUR i DE 2 À racine_entière(n)
    // On s'arrête à √n : optimisation classique des tests de primalité
    for (let i = 2; i <= Math.floor(Math.sqrt(n)); i++) {
        if (n % i === 0) {          // SI n MOD i = 0
            estPremier = false;     // estPremier ← FAUX
            break;                  // SORTIR DE LA BOUCLE
        }
    }

    // ÉTAPE 4 — Afficher le résultat
    if (estPremier) {
        afficher(\`✅ \${n} est un nombre premier\`, "item item-ok");
        afficher(\`Diviseurs : 1 et \${n} uniquement\`, "item item-info");
    } else {
        afficher(\`❌ \${n} n'est pas un nombre premier\`, "item item-warn");

        // Trouver et afficher tous les diviseurs (boucle complète 1 à n)
        titreSec("Diviseurs :");
        for (let i = 1; i <= n; i++) {
            if (n % i === 0) {
                afficher(i);
            }
        }
    }
});
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch9-ex2-debogueur",
        titre: "Débogueur — Trouve et Corrige",
        chapitre: "CH9 — Algorithmes",
        enonce_md: `
### 🐛 Ce programme est cassé — répare-le

Ce programme est censé analyser une liste de notes (0-20) saisies une par une et afficher des statistiques. **Il contient 4 bugs logiques** — le code tourne sans erreur JS, mais les résultats sont faux.

**Comportement attendu :**
- L'utilisateur entre des notes une par une (bouton "Ajouter")
- Il clique "Calculer les stats" quand il a terminé
- Le programme affiche : nombre de notes, somme, moyenne, note min, note max, et le nombre de notes ≥ 10

**Les 4 bugs à trouver (cherche par toi-même avant de regarder les indices) :**
- Un calcul effectué au mauvais endroit
- Une initialisation incorrecte
- Un opérateur de comparaison qui ne fait pas ce qu'on croit
- Une condition de validation inversée

### 📝 Consignes

1. **Lis le code en entier** et comprends ce qu'il est censé faire.
2. Teste avec des valeurs connues : ajoute \`10\`, \`12\`, \`8\` → stats attendues :
   - Nombre de notes : 3 | Somme : 30 | Moyenne : 10 | Min : 8 | Max : 12 | Réussies : 2
3. Identifie chaque bug, **ajoute un commentaire** \`// BUG CORRIGÉ : description\` sur la ligne corrigée.
4. **Amélioration :** une fois les 4 bugs corrigés, ajoute l'affichage du pourcentage de réussite (notes ≥ 10 / total × 100, arrondi à 1 décimale).
        `.trim(),

        theorie_md: `
### Stratégie de débogage logique

Les bugs logiques ne produisent pas d'erreur JS — le programme tourne mais le résultat est faux.

**Méthode :**
1. Teste avec des valeurs dont tu connais le résultat
2. Compare le résultat obtenu au résultat attendu
3. Trace mentalement l'exécution ligne par ligne
4. Identifie où le calcul diverge

---

### Erreurs logiques classiques

\`\`\`javascript
// ❌ Calcul DANS une boucle au lieu d'APRÈS
for (...) {
    somme += note;
    moyenne = somme / nb;   // recalculé inutilement, incorrect si nb change
}
moyenne = somme / nb;       // ✅ après la boucle

// ❌ Initialisation à 0 quand les données peuvent être positives
let min = 0;    // si toutes les notes sont > 0, min ne sera jamais mis à jour
let min = null; // ✅

// ❌ = au lieu de === (affecte au lieu de comparer)
if (note = 20) { ... }    // affecte 20 à note et est toujours truthy !
if (note === 20) { ... }  // ✅

// ❌ Condition de validation inversée
if (note >= 0 && note <= 20) {
    afficherErreur("Note invalide");  // valide mais affiche erreur !
}
if (note < 0 || note > 20) {
    afficherErreur("Note invalide");  // ✅
}
\`\`\`

---

### Commenter une correction

\`\`\`javascript
// BUG CORRIGÉ : moyenne calculée dans la boucle au lieu d'après
// BUG CORRIGÉ : min initialisé à 0 au lieu de null
// BUG CORRIGÉ : = au lieu de === pour la comparaison
// BUG CORRIGÉ : condition de validation inversée
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>📊 Statistiques de Notes</h2>
    <div class="controls">
      <input id="inputNote" type="number" min="0" max="20" step="0.5"
             placeholder="Note (0-20)">
      <button id="btnAjouter">Ajouter</button>
    </div>
    <div id="listeNotes" style="font-size:.85rem;color:#64748b;margin-bottom:.5rem;min-height:1.2rem"></div>
    <div class="controls">
      <button id="btnCalculer" style="width:100%;background:#1e1b4b">
        📊 Calculer les stats
      </button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── État : liste des notes saisies ──────────────────────────────────
const notes = [];

// ─── Helper d'affichage ───────────────────────────────────────────────
function afficher(label, valeur, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.innerHTML = \`<strong>\${label}</strong> : \${valeur}\`;
    document.getElementById("output").appendChild(d);
}

// ─── Bouton "Ajouter" ─────────────────────────────────────────────────
document.getElementById("btnAjouter").addEventListener("click", function() {
    const note = Number(document.getElementById("inputNote").value);

    // BUG 1 : cette condition valide correctement les notes entre 0 et 20
    // mais fait le contraire de ce qu'on veut — à trouver et corriger
    if (note >= 0 && note <= 20) {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Note invalide — entre une valeur entre 0 et 20.";
        document.getElementById("output").appendChild(e);
        return;
    }

    notes.push(note);
    document.getElementById("inputNote").value = "";
    document.getElementById("listeNotes").textContent =
        "Notes saisies : " + notes.join(", ");
});

// ─── Bouton "Calculer les stats" ──────────────────────────────────────
document.getElementById("btnCalculer").addEventListener("click", function() {
    document.getElementById("output").innerHTML = "";

    if (notes.length === 0) {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Ajoute au moins une note avant de calculer.";
        document.getElementById("output").appendChild(e);
        return;
    }

    let somme    = 0;
    let moyenne  = 0;
    let min      = 0;    // BUG 2 : initialisation incorrecte
    let max      = null;
    let reussies = 0;

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];

        somme += note;
        moyenne = somme / notes.length;   // BUG 3 : calcul à la mauvaise place

        if (min === null || note < min) min = note;
        if (max === null || note > max) max = note;

        // BUG 4 : cet opérateur ne compare pas comme on le croit
        if (note = 10) {
            reussies++;
        }
    }

    // Affichage des résultats
    afficher("Nombre de notes", notes.length);
    afficher("Somme",           somme.toFixed(1));
    afficher("Moyenne",         moyenne.toFixed(2));
    afficher("Note minimum",    min, "item item-warn");
    afficher("Note maximum",    max, "item item-ok");
    afficher("Notes ≥ 10",      reussies);
});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Où chercher les 4 bugs**

Cherche sur ces lignes spécifiques :

1. **Bug 1 (validation)** — La condition \`if (note >= 0 && note <= 20)\` semble correcte, mais que fait-elle vraiment ? Quel message affiche-t-elle quand une note est valide ?

2. **Bug 2 (initialisation)** — \`let min = 0;\` — que se passe-t-il si toutes les notes sont supérieures à 0 ? Min sera-t-il mis à jour ?

3. **Bug 3 (position du calcul)** — \`moyenne = somme / notes.length;\` est dans la boucle. À quel tour de boucle la division est-elle correcte ? Déplace-la.

4. **Bug 4 (opérateur)** — \`if (note = 10)\` — est-ce une comparaison ou une affectation ? Quel opérateur faut-il utiliser ?
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de débogage JS. Il y a exactement 4 bugs logiques.
Bug 1 (ligne ~43) : condition if(note>=0&&note<=20) mène à afficher "invalide" pour les notes VALIDES — doit être if(note<0||note>20) ou if(isNaN(note)||note<0||note>20).
Bug 2 (ligne ~53) : let min=0 → si toutes les notes sont >0, min ne sera jamais mis à jour → doit être null.
Bug 3 (ligne ~60) : moyenne=somme/notes.length est dans la boucle → doit être APRÈS le for.
Bug 4 (ligne ~65) : if(note=10) est une affectation (toujours truthy pour 10) → doit être if(note>=10).
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Demande à l'élève quel bug il a trouvé. S'il a tout corrigé, vérifie que les commentaires "BUG CORRIGÉ" sont présents et que l'amélioration (% réussite) est ajoutée.`,

            niveau_3_md: `
🛠️ **Les 4 corrections + amélioration :**

\`\`\`javascript
// Bouton "Ajouter" — Bug 1 corrigé
document.getElementById("btnAjouter").addEventListener("click", function() {
    const note = Number(document.getElementById("inputNote").value);

    // BUG CORRIGÉ 1 : condition inversée — on affichait erreur pour les notes valides
    if (isNaN(note) || note < 0 || note > 20) {
        // ... afficher erreur
        return;
    }
    // ...
});

// Bouton "Calculer" — Bugs 2, 3, 4 corrigés
document.getElementById("btnCalculer").addEventListener("click", function() {
    // ...
    let somme    = 0;
    let min      = null;  // BUG CORRIGÉ 2 : null au lieu de 0
    let max      = null;
    let reussies = 0;

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        somme += note;
        // BUG CORRIGÉ 3 : moyenne retirée de la boucle

        if (min === null || note < min) min = note;
        if (max === null || note > max) max = note;

        // BUG CORRIGÉ 4 : = → >= (comparaison, pas affectation)
        if (note >= 10) {
            reussies++;
        }
    }

    const moyenne = somme / notes.length;  // ✅ après la boucle

    afficher("Nombre de notes", notes.length);
    afficher("Somme",           somme.toFixed(1));
    afficher("Moyenne",         moyenne.toFixed(2));
    afficher("Note minimum",    min, "item item-warn");
    afficher("Note maximum",    max, "item item-ok");
    afficher("Notes ≥ 10",      reussies);

    // AMÉLIORATION : pourcentage de réussite
    const pctReussite = (reussies / notes.length * 100).toFixed(1);
    afficher("Taux de réussite", pctReussite + " %",
             reussies / notes.length >= 0.5 ? "item item-ok" : "item item-warn");
});
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 9 : Algorithmes...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 9 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch9-ex1-traducteur-algo  (lire pseudo-code → traduire en JS + commenter)");
    console.log("  - ch9-ex2-debogueur        (4 bugs logiques → corriger + améliorer)");
}

seed();
