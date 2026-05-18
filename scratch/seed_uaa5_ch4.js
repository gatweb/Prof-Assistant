const admin = require('firebase-admin');
 
// Initialisation (pour cibler le projet de l'émulateur local)
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();
 
// ============================================================
// UAA5 — Chapitre 4 : Chaînes de caractères
//
// 2 exercices :
//   ch4-ex1 : Scanner de Pseudo      (length, charAt, includes, slice, upper/lower)
//   ch4-ex2 : Fabrique de Hashtags   (trim, toLowerCase, split, replace, template literals)
// ============================================================
 
// Helper partagé — identique CH3, auto-portant dans l'onglet JS
const HELPER_AFFICHER = `// ═══ Zone d'affichage — ne pas modifier ═══════════════════════════
(function() {
    const style = document.createElement("style");
    style.textContent = \`
        body { font-family: sans-serif; padding: 1.5rem; background: #f8f9fb; margin: 0; }
        #output { max-width: 560px; margin: 0 auto; }
        .card { background: #fff; border-left: 4px solid #4f46e5;
                padding: 10px 16px; margin: 8px 0; border-radius: 6px;
                box-shadow: 0 1px 4px rgba(0,0,0,.08); font-size: 15px; }
        .card strong { color: #4f46e5; }
        .card-titre { font-size: 18px; font-weight: 600; color: #1e1b4b;
                      border-bottom: 2px solid #4f46e5; padding-bottom: 6px;
                      margin: 16px 0 8px; }
        .card-ok  { border-left-color: #16a34a; }
        .card-ok strong { color: #16a34a; }
        .card-erreur { border-left-color: #dc2626; }
        .card-erreur strong { color: #dc2626; }
        .mono { font-family: monospace; background: #f1f5f9;
                padding: 2px 6px; border-radius: 3px; }
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
        ? \`<strong>\${label}</strong> : <span class="mono">\${valeur}</span>\`
        : label;
    document.getElementById("output").appendChild(card);
}
function afficherTitre(texte) {
    const h = document.createElement("div");
    h.className = "card-titre";
    h.textContent = texte;
    document.getElementById("output").appendChild(h);
}
function afficherOk(label, valeur) {
    const card = document.createElement("div");
    card.className = "card card-ok";
    card.innerHTML = valeur !== undefined
        ? \`<strong>\${label}</strong> : <span class="mono">\${valeur}</span>\`
        : \`<strong>\${label}</strong>\`;
    document.getElementById("output").appendChild(card);
}
function afficherErreur(message) {
    const card = document.createElement("div");
    card.className = "card card-erreur";
    card.innerHTML = \`<strong>Erreur</strong> : \${message}\`;
    document.getElementById("output").appendChild(card);
}
// ════════════════════════════════════════════════════════════════════
 
`;
 
const EXERCICES = [
    {
        id: "ch4-ex1-scanner-pseudo",
        titre: "Scanner de Pseudo Gamer",
        chapitre: "CH4 — Chaînes de caractères",
        lien_cours: "https://docs.google.com/document/d/1LZ4ycWozQM2Myige5GvGuW1M3p5V3P4HKr00PqFG_B8/edit?usp=sharing",
        enonce_md: `
### 🔍 Analyse un pseudo de joueur
 
Le programme demande un pseudo et affiche son analyse complète.
 
**Sortie attendue pour le pseudo \`"Shadow_X"\` :**
 
> **=== ANALYSE DU PSEUDO ===**
> Pseudo saisi : Shadow_X
> Longueur : 8 caractères
> Premier caractère : S
> Dernier caractère : X
> En majuscules : SHADOW_X
> En minuscules : shadow_x
> Contient un \`_\` : Oui
> Les 3 premiers caractères : Sha
> ✓ Pseudo valide (entre 3 et 15 caractères)
 
### 📝 Consignes
 
1. Demande le pseudo avec \`prompt()\`.
2. Valide : si \`null\` ou vide → \`afficherErreur()\` et stop.
3. Affiche chaque analyse avec \`afficher(label, valeur)\`.
4. Pour "Contient un \`_\`" : utilise \`.includes()\` et affiche \`"Oui"\` ou \`"Non"\`.
5. Pour "Les 3 premiers caractères" : utilise \`.slice(0, 3)\`.
6. Pour la validation finale : si la longueur est entre 3 et 15 inclus → \`afficherOk()\`, sinon → \`afficherErreur()\`.
 
> 💡 Le dernier caractère : \`pseudo[pseudo.length - 1]\` ou \`pseudo.charAt(pseudo.length - 1)\`
        `.trim(),
 
        theorie_md: `
### Les méthodes string essentielles
 
**Longueur et accès par indice :**
\`\`\`javascript
const s = "Shadow_X";
s.length           // 8
s[0]               // "S"  — premier caractère
s.charAt(0)        // "S"  — équivalent, syntaxe méthode
s[s.length - 1]    // "X"  — dernier caractère
s.charAt(s.length - 1) // "X"
\`\`\`
 
**Transformation :**
\`\`\`javascript
s.toUpperCase()    // "SHADOW_X"
s.toLowerCase()    // "shadow_x"
s.trim()           // supprime espaces début/fin
\`\`\`
 
**Recherche :**
\`\`\`javascript
s.includes("_")    // true  — contient "_" ?
s.indexOf("_")     // 6     — position (ou -1 si absent)
s.startsWith("Sh") // true
\`\`\`
 
**Extraction :**
\`\`\`javascript
s.slice(0, 3)      // "Sha" — du 0 au 2 inclus
s.slice(-2)        // "_X"  — les 2 derniers
\`\`\`
 
**Immuabilité :** les méthodes ne modifient pas la string originale, elles renvoient une nouvelle string.
\`\`\`javascript
let mot = "bonjour";
mot.toUpperCase();         // renvoie "BONJOUR"
console.log(mot);          // "bonjour" — inchangé !
const maj = mot.toUpperCase(); // ✅ assigne le résultat
\`\`\`
        `.trim(),
 
        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────
 
// 1. Demande le pseudo
 
 
// 2. Valide (null ou vide)
 
 
// 3. Affiche l'analyse complète
 
 
// 4. Valide la longueur (entre 3 et 15)
 
 
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Les éléments clés**
 
\`\`\`javascript
const pseudo = prompt("Ton pseudo de joueur :").trim();
 
// Longueur
afficher("Longueur", \`\${pseudo.length} caractères\`);
 
// Premier et dernier caractère
afficher("Premier caractère", pseudo.charAt(0));
afficher("Dernier caractère", pseudo.charAt(pseudo.length - 1));
 
// Contient un "_" ?
const contientUnderscore = pseudo.includes("_") ? "Oui" : "Non";
afficher("Contient un _", contientUnderscore);
 
// 3 premiers caractères
afficher("3 premiers caractères", pseudo.slice(0, 3));
\`\`\`
 
Pour la validation finale, utilise une condition sur \`pseudo.length\`.
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice d'analyse de string en JS. 
Il doit : appeler prompt(), valider (null/vide), puis afficher longueur, premier/dernier caractère (.length, .charAt() ou [i]), majuscules/minuscules, .includes(), .slice(0,3), et une validation de longueur (3-15).
Le code reçu est le combiné HTML+CSS+JS — analyse uniquement le JS après la ligne séparatrice "═══".
Points à vérifier : validation null ET vide, usage de .charAt() ou [i] pour les caractères, résultat .includes() converti en "Oui"/"Non", .slice(0,3) correct, condition de longueur.
Identifie le premier problème et pose une question socratique ciblée.`,
 
            niveau_3_md: `
🛠️ **Squelette de structure attendu :**
 
Voici la structure globale pour analyser et valider le pseudo de joueur. Remplis les \`...\` avec les méthodes appropriées de la consigne (ex: \`length\`, \`charAt()\`, \`toUpperCase()\`, \`slice()\`, etc.) :
 
\`\`\`javascript
const saisie = prompt("Ton pseudo de joueur :");
 
if (saisie === null || saisie.trim() === "") {
    afficherErreur("Pseudo vide ou annulé.");
} else {
    const pseudo = saisie.trim();
 
    afficherTitre("=== ANALYSE DU PSEUDO ===");
    afficher("Pseudo saisi",            pseudo);
    afficher("Longueur",                \`\${pseudo.length} caractères\`);
    afficher("Premier caractère",       pseudo.charAt(0));
    afficher("Dernier caractère",       pseudo.charAt(pseudo.... - 1));
    afficher("En majuscules",           pseudo.toUpperCase());
    afficher("En minuscules",           pseudo.toLowerCase());
    afficher("Contient un _",           pseudo.includes("_") ? "Oui" : "Non");
    afficher("Les 3 premiers caractères", pseudo.slice(0, ...));
 
    // Validation de la longueur (entre 3 et 15 caractères inclus)
    if (pseudo.length >= ... && pseudo.length <= ...) {
        afficherOk("✓ Pseudo valide", \`entre 3 et 15 caractères\`);
    } else {
        afficherErreur(\`Pseudo invalide — \${pseudo.length} caractères (attendu : 3-15)\`);
    }
}
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch4-ex2-fabrique-hashtags",
        titre: "Fabrique de Hashtags",
        chapitre: "CH4 — Chaînes de caractères",
        lien_cours: "https://docs.google.com/document/d/1LZ4ycWozQM2Myige5GvGuW1M3p5V3P4HKr00PqFG_B8/edit?usp=sharing",
        enonce_md: `
### #️⃣ Génère des hashtags depuis une phrase
 
Le programme demande une phrase et génère automatiquement :
1. Un **hashtag principal** (sans espaces, en minuscules, avec \`#\`)
2. Un **hashtag par mot** (un par mot de la phrase)
3. Un **slug URL** (pour une URL propre)
 
**Exemple pour la phrase \`"  JavaScript c'est super  "\` :**
 
> **=== FABRIQUE DE HASHTAGS ===**
> Phrase nettoyée : JavaScript c'est super
> Hashtag principal : #javascriptcestsuper
> Hashtags par mot : #javascript #c'est #super
> Slug URL : javascript-cest-super
> Nombre de mots : 3
 
### 📝 Consignes
 
1. Demande la phrase avec \`prompt()\` — valide (null ou vide).
2. Nettoie la phrase avec \`.trim()\`.
3. Hashtag principal : \`.toLowerCase()\` + \`.replaceAll(" ", "")\` + ajouter \`"#"\` devant.
4. Hashtags par mot : \`.split(" ")\` → boucle sur chaque mot → préfixe \`"#"\` + \`.toLowerCase()\`.
   > 💡 Pour l'instant, tu peux les afficher un par un dans la boucle, ou les rejoindre avec \`.join(" ")\`
5. Slug URL : \`.toLowerCase()\` + \`.replaceAll(" ", "-")\` + \`.replaceAll("'", "")\`.
6. Nombre de mots : longueur du tableau \`.split(" ")\`.
 
> ⚠️ L'apostrophe dans "c'est" : utilise \`.replaceAll("'", "")\` pour la supprimer du slug.
        `.trim(),
 
        theorie_md: `
### Méthodes string pour transformer du texte
 
**Supprimer les espaces de bord :**
\`\`\`javascript
"  bonjour  ".trim()        // "bonjour"
\`\`\`
 
**Remplacer dans une string :**
\`\`\`javascript
const s = "hello world world";
s.replace("world", "JS")    // "hello JS world"    — 1ère occurrence
s.replaceAll("world", "JS") // "hello JS JS"       — toutes
s.replaceAll(" ", "_")      // "hello_world_world" — espaces → _
\`\`\`
 
**Découper en tableau :**
\`\`\`javascript
"js html css".split(" ")
// ["js", "html", "css"]
 
"a,b,c".split(",")
// ["a", "b", "c"]
\`\`\`
 
**Template literals avec expressions :**
\`\`\`javascript
const mot = "shadow";
const hashtag = \`#\${mot}\`;           // "#shadow"
const majTag  = \`#\${mot.toUpperCase()}\`; // "#SHADOW"
\`\`\`
 
**Rejoindre un tableau en string :**
\`\`\`javascript
["js", "html", "css"].join(", ")   // "js, html, css"
["a", "b", "c"].join(" ")          // "a b c"
\`\`\`
 
**Longueur d'un tableau :**
\`\`\`javascript
const mots = "bonjour monde".split(" ");
mots.length   // 2
\`\`\`
        `.trim(),
 
        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────
 
// 1. Demande la phrase et valide
 
 
// 2. Nettoie avec .trim()
 
 
// 3. Génère le hashtag principal
 
 
// 4. Découpe en mots avec .split() et génère les hashtags par mot
 
 
// 5. Génère le slug URL
 
 
// 6. Affiche tout
 
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Étape par étape**
 
**Hashtag principal :**
\`\`\`javascript
const phrase = "JavaScript c'est super";
const hashtagPrincipal = "#" + phrase.toLowerCase().replaceAll(" ", "");
// "#javascriptcestsuper"
\`\`\`
 
**Découper en mots :**
\`\`\`javascript
const mots = phrase.split(" ");
// ["JavaScript", "c'est", "super"]
afficher("Nombre de mots", mots.length);
\`\`\`
 
**Hashtag par mot** — utilise une boucle \`for\` ou construis une string :
\`\`\`javascript
const hashtagsMots = mots
    .map(mot => "#" + mot.toLowerCase())
    .join(" ");
// "#javascript #c'est #super"
\`\`\`
(Si tu n'as pas encore vu \`.map()\`, construis manuellement avec une boucle \`for\`)
 
**Slug :**
\`\`\`javascript
const slug = phrase.toLowerCase().replaceAll(" ", "-").replaceAll("'", "");
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice de manipulation de strings JS : générer des hashtags et un slug depuis une phrase saisie.
Étapes attendues : (1) prompt() + validation null/vide, (2) .trim(), (3) hashtag principal avec .toLowerCase() + .replaceAll(" ",""), (4) split(" ") + hashtags par mot, (5) slug avec .replaceAll(" ","-") et .replaceAll("'",""), (6) affichage.
Pour tester : phrase "  JavaScript c'est super  " → hashtag "#javascriptcestsuper", slug "javascript-cest-super", 3 mots.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après la ligne "═══".
Identifie le problème principal (transformation incorrecte, split mal utilisé, apostrophe non gérée) et pose une question ciblée sans donner la solution.`,
 
            niveau_3_md: `
🛠️ **Squelette de structure attendu :**
 
Voici comment ordonner tes découpages et remplacements pour générer les hashtags et le slug URL. Complète les parties avec les \`...\` :
 
\`\`\`javascript
const saisie = prompt("Entre une phrase à transformer en hashtags :");
 
if (saisie === null || saisie.trim() === "") {
    afficherErreur("Saisie vide ou annulée.");
} else {
    const phrase = saisie.trim();
    const mots   = phrase.split(" ");
 
    // Hashtag principal (ex: #javascriptcestsuper)
    const hashtagPrincipal = "#" + phrase.toLowerCase().replaceAll(" ", "");
 
    // Hashtags par mot : on préfixe chaque mot avec # en minuscules
    // Astuce : mots.map() permet d'appliquer une transformation à tout le tableau
    const hashtagsMots = mots
        .map(mot => "#" + mot.toLowerCase())
        .join(" ");
 
    // Slug URL : tout en minuscules, espaces remplacés par des tirets, apostrophes supprimées
    const slug = phrase.toLowerCase()
                       .replaceAll(" ", "...")
                       .replaceAll("'", "...");
 
    afficherTitre("=== FABRIQUE DE HASHTAGS ===");
    afficher("Phrase nettoyée",    phrase);
    afficher("Hashtag principal",  hashtagPrincipal);
    afficher("Hashtags par mot",   hashtagsMots);
    afficher("Slug URL",           slug);
    afficher("Nombre de mots",     mots.length);
}
\`\`\`
 
> 💡 **Note sur .map()** : C'est une méthode très puissante qui évite d'écrire une boucle \`for\` manuelle pour transformer chaque élément d'un tableau. Nous l'étudierons en détail au chapitre des Tableaux !
            `.trim()
        }
    }
];
 
async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 4 : Chaînes de caractères...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 4 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch4-ex1-scanner-pseudo    (length, charAt, includes, slice, upper/lower)");
    console.log("  - ch4-ex2-fabrique-hashtags  (trim, split, replaceAll, template literals)");
}
 
seed();
