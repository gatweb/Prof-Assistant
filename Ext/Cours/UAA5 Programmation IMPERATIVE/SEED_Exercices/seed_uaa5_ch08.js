const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 8 : Fonctions prédéfinies
//
// 2 exercices DOM :
//   ch8-ex1 : Jeu de Devinette      (Math.random, état persistant)
//   ch8-ex2 : Dashboard Temporel    (Date, conditions, formatage)
// ============================================================

const STYLES_BASE = `
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', sans-serif;
        background: #f1f5f9;
        margin: 0; padding: 1.5rem;
        min-height: 100vh;
    }
    .app { max-width: 560px; margin: 0 auto; }
    h2 {
        color: #1e1b4b; margin: 0 0 1rem;
        font-size: 1.2rem;
        border-bottom: 2px solid #4f46e5;
        padding-bottom: .5rem;
    }
    .controls {
        display: flex; gap: .6rem;
        margin-bottom: 1rem; flex-wrap: wrap;
    }
    input[type="number"], input[type="text"] {
        flex: 1; padding: .6rem .9rem;
        border: 2px solid #e2e8f0; border-radius: 8px;
        font-size: 1rem; outline: none;
        transition: border-color .2s; min-width: 100px;
    }
    input:focus { border-color: #4f46e5; }
    button {
        padding: .6rem 1.4rem; background: #4f46e5;
        color: white; border: none; border-radius: 8px;
        font-size: 1rem; font-weight: 600;
        cursor: pointer; transition: background .2s;
    }
    button:hover { background: #3730a3; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    #output { display: flex; flex-direction: column; gap: .4rem; margin-top: .5rem; }
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
    .item-warn strong { color: #d97706; }
    .item-info { border-left-color: #0ea5e9; }
    .item-info strong { color: #0369a1; }
    .erreur {
        background: #fef2f2; border-left-color: #dc2626;
        color: #991b1b; padding: .6rem 1rem;
        border-radius: 0 8px 8px 0;
    }
    .grand { font-size: 1.3rem; font-weight: 700; }
`;

// ─────────────────────────────────────────────────────────────────────────────

const EXERCICES = [
    {
        id: "ch8-ex1-jeu-devinette",
        titre: "Jeu de Devinette",
        chapitre: "CH8 — Fonctions prédéfinies",
        enonce_md: `
### 🎲 Devine le nombre secret

Le programme génère un nombre aléatoire entre 1 et 100. L'utilisateur doit le trouver en un minimum de tentatives.

**Comportement attendu :**
- Au chargement, un nombre secret est généré **une seule fois**
- À chaque clic sur **Essayer** : affiche "📉 Trop petit !", "📈 Trop grand !" ou "🎉 Trouvé !"
- Quand trouvé : affiche le nombre de tentatives, désactive le bouton
- Bouton **Rejouer** : génère un nouveau secret et remet les compteurs à zéro

### 📝 Consignes

1. Génère le nombre secret avec \`Math.floor(Math.random() * 100) + 1\`.
2. Déclare \`secret\`, \`tentatives\` et \`termine\` **en dehors** du listener (état persistant).
3. Dans le listener "Essayer" :
   - Si \`termine === true\` → \`return\` immédiatement.
   - Valide l'essai (nombre entre 1 et 100).
   - Incrémente \`tentatives\`.
   - Compare avec \`secret\` et affiche le bon message.
   - Si trouvé : affiche les tentatives, met \`termine = true\`, désactive le bouton.
4. Dans le listener "Rejouer" : réinitialise tout et vide l'output.

> 💡 Désactiver un bouton : \`document.getElementById("btn").disabled = true\`
        `.trim(),

        theorie_md: `
### Générer un entier aléatoire

\`\`\`javascript
// Formule universelle : entier entre min et max (inclus)
Math.floor(Math.random() * (max - min + 1)) + min

// Exemples :
Math.floor(Math.random() * 100) + 1   // 1 à 100
Math.floor(Math.random() * 6)  + 1   // 1 à 6 (dé)
\`\`\`

---

### État persistant entre les clics

\`\`\`javascript
// ✅ En dehors du listener → survit entre les clics
let secret     = Math.floor(Math.random() * 100) + 1;
let tentatives = 0;
let termine    = false;

document.getElementById("btn").addEventListener("click", function() {
    if (termine) return;   // partie finie → ignore

    tentatives++;          // modifie la variable partagée
    // ...
});
\`\`\`

---

### Désactiver / réactiver un bouton

\`\`\`javascript
document.getElementById("btnEssayer").disabled = true;  // grisé
document.getElementById("btnEssayer").disabled = false; // réactivé
\`\`\`

---

### Vider l'output et remettre à zéro

\`\`\`javascript
document.getElementById("output").innerHTML = "";
document.getElementById("inputEssai").value = "";
// Réassigner les variables d'état :
secret     = Math.floor(Math.random() * 100) + 1;
tentatives = 0;
termine    = false;
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🎲 Jeu de Devinette</h2>
    <p style="color:#64748b;margin:.2rem 0 1rem">
      Je pense à un nombre entre <strong>1</strong> et <strong>100</strong>. Trouve-le !
    </p>
    <div class="controls">
      <input id="inputEssai" type="number" min="1" max="100" placeholder="Ton essai...">
      <button id="btnEssayer">Essayer</button>
      <button id="btnRejouer" style="background:#64748b">🔄 Rejouer</button>
    </div>
    <div id="output"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// ─── État du jeu — en dehors des listeners ────────────────────────────
let secret     = Math.floor(Math.random() * 100) + 1;
let tentatives = 0;
let termine    = false;

// ─── Helper d'affichage ───────────────────────────────────────────────
function ajouterMessage(texte, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.textContent = texte;
    document.getElementById("output").appendChild(d);
}

// ─── Listener "Essayer" ───────────────────────────────────────────────
document.getElementById("btnEssayer").addEventListener("click", function() {
    // Si la partie est finie, on ignore le clic


    const essai  = Number(document.getElementById("inputEssai").value);
    const output = document.getElementById("output");

    // Validation de l'essai (entre 1 et 100)


    // Incrémente le compteur


    // Compare et affiche le message adapté


});

// ─── Listener "Rejouer" ───────────────────────────────────────────────
document.getElementById("btnRejouer").addEventListener("click", function() {
    // Réinitialise l'état et l'interface

});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure du listener "Essayer"**

\`\`\`javascript
document.getElementById("btnEssayer").addEventListener("click", function() {
    if (termine) return;   // partie terminée → on ignore

    const essai = Number(document.getElementById("inputEssai").value);

    if (isNaN(essai) || essai < 1 || essai > 100) {
        ajouterMessage("Entre un nombre entre 1 et 100.", "erreur");
        return;
    }

    tentatives++;

    if (essai === secret) {
        ajouterMessage(\`🎉 Bravo ! Trouvé en \${tentatives} tentative(s) !\`, "item item-ok grand");
        termine = true;
        document.getElementById("btnEssayer").disabled = true;
    } else if (essai < secret) {
        ajouterMessage(\`📉 Tentative \${tentatives} : \${essai} — Trop petit !\`, "item item-warn");
    } else {
        ajouterMessage(\`📈 Tentative \${tentatives} : \${essai} — Trop grand !\`, "item item-warn");
    }
});
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un jeu de devinette JS avec état persistant et DOM.
Architecture : secret, tentatives, termine déclarés en dehors des listeners. btnEssayer : if(termine)return, valider (1-100), tentatives++, comparer (===, <, >) et afficher message, si trouvé → termine=true + disabled. btnRejouer : réinitialiser les 3 variables + output.innerHTML="" + input.value="" + disabled=false.
Résultat attendu : messages distincts pour trop petit/grand/trouvé, compteur de tentatives correct, bouton désactivé quand trouvé, rejouer repart de zéro.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Identifie le premier problème (état mal placé dans le listener, disabled oublié, réinitialisation incomplète, comparaison == au lieu de ===...) et pose une question ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
// État du jeu
let secret     = Math.floor(Math.random() * 100) + 1;
let tentatives = 0;
let termine    = false;

function ajouterMessage(texte, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.textContent = texte;
    document.getElementById("output").appendChild(d);
}

// Listener "Essayer"
document.getElementById("btnEssayer").addEventListener("click", function() {
    if (termine) return;

    const essai = Number(document.getElementById("inputEssai").value);

    if (isNaN(essai) || essai < 1 || essai > 100) {
        ajouterMessage("Entre un nombre entier entre 1 et 100.", "erreur");
        return;
    }

    tentatives++;

    if (essai === secret) {
        const msg = tentatives === 1
            ? "🎉 Incroyable — trouvé du premier coup !"
            : \`🎉 Bravo ! Trouvé en \${tentatives} tentatives.\`;
        ajouterMessage(msg, "item item-ok grand");
        termine = true;
        document.getElementById("btnEssayer").disabled = true;
    } else if (essai < secret) {
        ajouterMessage(\`📉 Tentative \${tentatives} : \${essai} — Trop petit !\`, "item item-warn");
    } else {
        ajouterMessage(\`📈 Tentative \${tentatives} : \${essai} — Trop grand !\`, "item item-warn");
    }
});

// Listener "Rejouer"
document.getElementById("btnRejouer").addEventListener("click", function() {
    secret     = Math.floor(Math.random() * 100) + 1;
    tentatives = 0;
    termine    = false;
    document.getElementById("output").innerHTML   = "";
    document.getElementById("inputEssai").value   = "";
    document.getElementById("btnEssayer").disabled = false;
});
\`\`\`
            `.trim()
        }
    },

    {
        id: "ch8-ex2-dashboard-temporel",
        titre: "Dashboard Temporel",
        chapitre: "CH8 — Fonctions prédéfinies",
        enonce_md: `
### 🕐 Affiche la date, l'heure et des infos temporelles

Un dashboard qui s'actualise à chaque clic sur **Actualiser** — et qui salue l'utilisateur différemment selon l'heure.

**Éléments à afficher :**

| Info | Exemple |
|---|---|
| Salutation | "🌅 Bonjour !" / "☀️ Bon après-midi !" / "🌙 Bonsoir !" |
| Date complète | "Lundi 14 octobre 2025" |
| Heure | "09:05:03" (avec zéros devant) |
| Jour de la semaine | "Lundi" |
| Semaine de l'année | Calculée (voir indice) |
| Jours avant Noël | Nombre de jours jusqu'au 25 décembre |

### 📝 Consignes

1. Bouton **Actualiser** → relit la date à chaque clic (\`new Date()\` dans le listener).
2. **Salutation** : matin = avant 12h, après-midi = 12h à 18h, soir = après 18h.
3. **Date complète** : utilise les tableaux \`JOURS\` et \`MOIS\` pour convertir les indices.
4. **Heure formatée** : \`String(h).padStart(2, "0")\` pour ajouter les zéros manquants.
5. **Jours avant Noël** : crée un \`new Date(annee, 11, 25)\` et calcule la différence.
   > 💡 Différence en jours = \`Math.ceil((noel - maintenant) / (1000 * 60 * 60 * 24))\`
6. **Bonus** : affiche aussi si on est un jour de semaine ou le week-end.

> ⚠️ \`getMonth()\` renvoie 0 pour janvier — ajoute 1 pour le numéro habituel.
> ⚠️ \`getDay()\` renvoie 0 pour dimanche — utilise le tableau \`JOURS\`.
        `.trim(),

        theorie_md: `
### L'objet Date

\`\`\`javascript
const maintenant = new Date();   // capture l'instant présent

maintenant.getFullYear()   // 2025
maintenant.getMonth()      // 0-11 ← janvier = 0 !
maintenant.getDate()       // 1-31
maintenant.getDay()        // 0-6  ← dimanche = 0 !
maintenant.getHours()      // 0-23
maintenant.getMinutes()    // 0-59
maintenant.getSeconds()    // 0-59
\`\`\`

---

### Convertir getDay() en nom lisible

\`\`\`javascript
const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MOIS  = ["janvier","février","mars","avril","mai","juin",
               "juillet","août","septembre","octobre","novembre","décembre"];

const nomJour = JOURS[maintenant.getDay()];    // "Lundi"
const nomMois = MOIS[maintenant.getMonth()];   // "octobre"
\`\`\`

---

### Formater l'heure avec zéros

\`\`\`javascript
const h = maintenant.getHours();
const m = maintenant.getMinutes();
const heure = \`\${String(h).padStart(2,"0")}:\${String(m).padStart(2,"0")}\`;
// "9:5" devient "09:05"
\`\`\`

---

### Calculer une différence en jours

\`\`\`javascript
const maintenant = new Date();
const noel       = new Date(maintenant.getFullYear(), 11, 25); // 11 = décembre

// Les dates sont des timestamps (ms depuis 1970)
const diffMs   = noel - maintenant;           // différence en millisecondes
const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
\`\`\`
        `.trim(),

        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .heure-affichage {
        font-size: 2.2rem; font-weight: 700; color: #1e1b4b;
        letter-spacing: 2px; text-align: center;
        background: white; border-radius: 12px;
        padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.08);
        grid-column: 1 / -1;
    }
\`;
document.head.appendChild(style);

document.body.innerHTML = \`
  <div class="app">
    <h2>🕐 Dashboard Temporel</h2>
    <div class="controls">
      <button id="btnActualiser" style="width:100%">🔄 Actualiser</button>
    </div>
    <div class="heure-affichage" id="heureAffichage">--:--:--</div>
    <div id="output" style="margin-top:.5rem"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════

// Tableaux de noms — utilisés dans le listener
const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MOIS  = ["janvier","février","mars","avril","mai","juin",
               "juillet","août","septembre","octobre","novembre","décembre"];

// ─── Helper d'affichage ───────────────────────────────────────────────
function stat(label, valeur, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.innerHTML = \`<strong>\${label}</strong> : \${valeur}\`;
    document.getElementById("output").appendChild(d);
}

// ─── Listener "Actualiser" ────────────────────────────────────────────
document.getElementById("btnActualiser").addEventListener("click", function() {
    const maintenant = new Date();
    document.getElementById("output").innerHTML = "";

    // 1. Extrais les composantes de la date


    // 2. Formate l'heure avec padStart et affiche dans heureAffichage


    // 3. Détermine la salutation selon l'heure (matin/après-midi/soir)


    // 4. Construit la date complète (ex: "Lundi 14 octobre 2025")


    // 5. Calcule les jours avant Noël


    // 6. Affiche toutes les stats avec stat()


});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Extraire et formater**

\`\`\`javascript
const maintenant = new Date();

// Composantes
const annee    = maintenant.getFullYear();
const mois     = maintenant.getMonth();      // 0-11
const jour     = maintenant.getDate();
const jourSem  = maintenant.getDay();        // 0-6
const heures   = maintenant.getHours();
const minutes  = maintenant.getMinutes();
const secondes = maintenant.getSeconds();

// Heure formatée
const heureStr = \`\${String(heures).padStart(2,"0")}:\${String(minutes).padStart(2,"0")}:\${String(secondes).padStart(2,"0")}\`;
document.getElementById("heureAffichage").textContent = heureStr;

// Salutation
let salutation;
if (heures < 12)      salutation = "🌅 Bonjour !";
else if (heures < 18) salutation = "☀️ Bon après-midi !";
else                  salutation = "🌙 Bonsoir !";

// Date complète
const dateComplete = \`\${JOURS[jourSem]} \${jour} \${MOIS[mois]} \${annee}\`;

// Jours avant Noël
const noel      = new Date(annee, 11, 25);
const diffJours = Math.ceil((noel - maintenant) / (1000 * 60 * 60 * 24));
\`\`\`
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice utilisant l'objet Date JS avec DOM.
Il doit : new Date() dans le listener, extraire year/month/date/day/hours/minutes/seconds, formater l'heure avec padStart(2,"0"), salutation conditionnelle (heures<12/18), date complète avec JOURS[getDay()] et MOIS[getMonth()], calcul jours avant Noël avec new Date(annee, 11, 25) et Math.ceil((noel-maintenant)/(1000*60*60*24)).
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Pièges classiques : getMonth() sans +1 pour affichage (ici OK car on utilise MOIS[]), getDay()=0 est dimanche (pas lundi), noel = new Date(annee, 11, 25) avec mois=11 (décembre), division par (1000*60*60*24) pour convertir ms en jours.
Identifie le premier problème et pose une question ciblée.`,

            niveau_3_md: `
🛠️ **Solution complète :**

\`\`\`javascript
document.getElementById("btnActualiser").addEventListener("click", function() {
    const maintenant = new Date();
    document.getElementById("output").innerHTML = "";

    const annee    = maintenant.getFullYear();
    const mois     = maintenant.getMonth();
    const jour     = maintenant.getDate();
    const jourSem  = maintenant.getDay();
    const heures   = maintenant.getHours();
    const minutes  = maintenant.getMinutes();
    const secondes = maintenant.getSeconds();

    // Heure formatée
    const p = n => String(n).padStart(2, "0");
    const heureStr = \`\${p(heures)}:\${p(minutes)}:\${p(secondes)}\`;
    document.getElementById("heureAffichage").textContent = heureStr;

    // Salutation
    let salutation;
    if (heures < 12)      salutation = "🌅 Bonjour !";
    else if (heures < 18) salutation = "☀️ Bon après-midi !";
    else                  salutation = "🌙 Bonsoir !";

    // Date et Noël
    const dateComplete = \`\${JOURS[jourSem]} \${jour} \${MOIS[mois]} \${annee}\`;
    const noel         = new Date(annee, 11, 25);
    const diffJours    = Math.ceil((noel - maintenant) / (1000 * 60 * 60 * 24));
    const weekend      = jourSem === 0 || jourSem === 6;

    // Affichage
    stat("",            salutation, "item item-ok grand");
    stat("Date",        dateComplete);
    stat("Jour",        JOURS[jourSem]);
    stat("Type de jour",weekend ? "🎉 Week-end" : "💼 Jour de semaine", weekend ? "item item-ok" : "item");
    stat("Jours avant Noël",
         diffJours > 0  ? \`\${diffJours} jours 🎄\`
       : diffJours === 0 ? "C'est Noël aujourd'hui ! 🎁"
       : "Noël est passé — à l'année prochaine !", "item item-info");
});
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 8 : Fonctions prédéfinies...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 8 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch8-ex1-jeu-devinette      (Math.random, état persistant, disabled)");
    console.log("  - ch8-ex2-dashboard-temporel (Date, conditions heure, padStart, Noël)");
}

seed();
