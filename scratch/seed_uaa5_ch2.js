const admin = require('firebase-admin');
 
// Initialisation (pour cibler le projet de l'émulateur local)
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();
 
// ============================================================
// UAA5 — Chapitre 2 : Variables, types et opérateurs
// 3 exercices :
//   ch2-ex1 : Fiche de personnage RPG  (const/let, types multiples)
//   ch2-ex2 : Stats de combat          (opérateurs arithmétiques)
//   ch2-ex3 : Détective typeof         (coercion, typeof, conversions)
// ============================================================
 
const EXERCICES = [
    {
        id: "ch2-ex1-fiche-personnage",
        titre: "Fiche de Personnage RPG",
        chapitre: "CH2 — Variables, types et opérateurs",
        lien_cours: "https://docs.google.com/document/d/1v9bED-lsLv1HDwCxH-n3MHuvb9WnnXVNgsFAeTCxIbI/edit?tab=t.0#heading=h.qko1lj9o6v3m",
        enonce_md: `
### 🎮 Crée la fiche de ton personnage
 
Tu développes un jeu RPG. Chaque personnage a une fiche avec ses données de base.
 
**Déclare les variables suivantes et affiche la fiche complète :**
 
| Variable | Type attendu | Valeur | Mot-clé |
|---|---|---|---|
| \`nomPersonnage\` | string | ton pseudo | \`const\` |
| \`classe\` | string | au choix (guerrier, mage, archer...) | \`const\` |
| \`niveau\` | number | entre 1 et 50 | \`const\` |
| \`hp\` | number | entre 50 et 500 | \`let\` |
| \`estVivant\` | boolean | \`true\` | \`const\` |
 
**La sortie attendue doit ressembler à :**
 
\`\`\`
=== FICHE PERSONNAGE ===
Nom     : Shadow_X
Classe  : Mage
Niveau  : 23
HP      : 340
Statut  : Vivant
========================
\`\`\`
 
### 📝 Consignes
 
1. Utilise \`const\` ou \`let\` selon si la valeur peut changer ou non.
2. Affiche chaque ligne avec \`console.log()\`.
3. Pour la ligne "Statut", affiche \`"Vivant"\` si \`estVivant\` est \`true\`, \`"KO"\` sinon.
   > 💡 Indice pour le statut : tu peux utiliser \`estVivant ? "Vivant" : "KO"\`
4. Vérifie le type de chaque variable avec \`typeof\` et affiche les résultats à la fin.
        `.trim(),
 
        theorie_md: `
### const et let — Quand utiliser quoi ?
 
**\`const\`** — valeur qui ne change pas :
\`\`\`javascript
const nomJoueur = "Shadow_X";    // ne changera jamais
const niveauMax = 99;
\`\`\`
 
**\`let\`** — valeur qui peut changer :
\`\`\`javascript
let score = 0;
score += 100;    // OK, on peut réassigner
\`\`\`
 
**Règle :** utilise \`const\` par défaut, \`let\` seulement si réassignation nécessaire.
 
---
 
### Les types de données JS
 
\`\`\`javascript
const age = 17;            // number
const pseudo = "Gat";      // string
const actif = true;        // boolean
let position;              // undefined (pas encore de valeur)
\`\`\`
 
---
 
### typeof — inspecter le type
 
\`\`\`javascript
console.log(typeof 42);        // "number"
console.log(typeof "hello");   // "string"
console.log(typeof true);      // "boolean"
\`\`\`
 
---
 
### Opérateur ternaire (bonus)
 
\`\`\`javascript
const statut = estVivant ? "Vivant" : "KO";
// Si estVivant est true → "Vivant"
// Sinon → "KO"
\`\`\`
        `.trim(),
 
        code_depart: `// === Fiche de Personnage RPG ===
 
// 1. Déclare tes variables ici (const ou let selon le cas)
 
 
// 2. Affiche la fiche complète
 
 
// 3. Affiche le type de chaque variable avec typeof
 
`,
 
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de base**
 
Commence par déclarer toutes tes variables, puis affiche-les une par une :
 
\`\`\`javascript
const nomPersonnage = "Shadow_X";   // const car ça ne changera pas
let hp = 340;                       // let car les HP peuvent diminuer
 
console.log("Nom     :", nomPersonnage);
console.log("HP      :", hp);
\`\`\`
 
Pour le statut, l'opérateur ternaire \`? :\` est ton ami :
\`\`\`javascript
const statut = estVivant ? "Vivant" : "KO";
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice de déclaration de variables JS (const/let) et d'affichage avec console.log. 
Il doit déclarer 5 variables de types différents (string, number, boolean) et afficher une fiche formatée.
Analyse son code et identifie les problèmes : mauvais choix const/let, types incorrects, formatage de la sortie, utilisation de typeof.
Guide-le avec une question ciblée sans donner le code complet. Encourage-le si la structure générale est bonne.`,
 
            niveau_3_md: `
🛠️ **Squelette de structure attendu :**
 
Voici l'ossature pour déclarer tes variables, calculer le statut de vie et faire les affichages formatés. Remplace les \`...\` par les bonnes valeurs et les bons noms de variables :
 
\`\`\`javascript
// 1. Déclarations des 5 variables
const nomPersonnage = "...";
const classe = "...";
const niveau = ...;
let hp = ...;
const estVivant = ...;
 
// 2. Calcul du statut (Vivant / KO) avec l'opérateur ternaire
const statut = estVivant ? "..." : "...";
 
// 3. Affichages console.log() formatés
console.log("=== FICHE PERSONNAGE ===");
console.log("Nom     :", ...);
console.log("Classe  :", ...);
console.log("Niveau  :", ...);
console.log("HP      :", ...);
console.log("Statut  :", ...);
console.log("========================");
 
// 4. Vérification des types
console.log(typeof ...);
console.log(typeof ...);
console.log(typeof ...);
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch2-ex2-stats-combat",
        titre: "Calculatrice de Stats de Combat",
        chapitre: "CH2 — Variables, types et opérateurs",
        lien_cours: "https://docs.google.com/document/d/1v9bED-lsLv1HDwCxH-n3MHuvb9WnnXVNgsFAeTCxIbI/edit?tab=t.0#heading=h.qko1lj9o6v3m",
        enonce_md: `
### ⚔️ Calcule les stats de ton personnage
 
Ton personnage a des **stats de base**. À partir de ces valeurs, tu dois calculer ses **stats dérivées** grâce à des formules.
 
**Stats de base (données — déclare-les avec \`const\`) :**
 
\`\`\`javascript
const force = 45;
const agilite = 32;
const intelligence = 28;
const niveau = 15;
\`\`\`
 
**Stats dérivées à calculer et afficher :**
 
| Stat | Formule |
|---|---|
| Dégâts de base | \`force * 2.5\` |
| Vitesse d'attaque | \`agilite % 10 + 5\` |
| Puissance magique | \`intelligence ** 2 / 10\` |
| Points de vie max | \`(force + agilite) * niveau\` |
| Armure | \`Math.floor(agilite / 3)\` |
 
**Sortie attendue (avec ces valeurs) :**
\`\`\`
=== STATS DE COMBAT ===
Dégâts de base   : 112.5
Vitesse attaque  : 7
Puissance magique: 78.4
HP max           : 1155
Armure           : 10
=======================
\`\`\`
 
### 📝 Consignes
 
1. Déclare les 4 stats de base avec \`const\`.
2. Calcule chaque stat dérivée dans une variable \`const\` séparée.
3. Affiche le tableau de stats formaté.
4. **Bonus :** affiche aussi le pourcentage de dégâts magiques vs physiques.
        `.trim(),
 
        theorie_md: `
### Opérateurs arithmétiques JS
 
| Opérateur | Opération | Exemple | Résultat |
|---|---|---|---|
| \`+\` | Addition | \`10 + 3\` | \`13\` |
| \`-\` | Soustraction | \`10 - 3\` | \`7\` |
| \`*\` | Multiplication | \`10 * 3\` | \`30\` |
| \`/\` | Division | \`10 / 3\` | \`3.333...\` |
| \`%\` | Modulo (reste) | \`10 % 3\` | \`1\` |
| \`**\` | Exponentiation | \`2 ** 8\` | \`256\` |
 
**Modulo %** — reste de la division entière :
\`\`\`javascript
console.log(17 % 5);   // 2  (17 = 3×5 + 2)
console.log(10 % 2);   // 0  (nombre pair)
\`\`\`
 
**Math.floor()** — arrondit vers le bas :
\`\`\`javascript
console.log(Math.floor(7.9));   // 7
console.log(Math.floor(3.1));   // 3
\`\`\`
 
**Ordre des opérations :** JS respecte les priorités mathématiques classiques.
\`\`\`javascript
const resultat = (10 + 5) * 2;   // 30, pas 20
\`\`\`
        `.trim(),
 
        code_depart: `// === Stats de Combat ===
 
// Stats de base
const force = 45;
const agilite = 32;
const intelligence = 28;
const niveau = 15;
 
// Calcule les stats dérivées ici
 
 
// Affiche le tableau de stats
 
`,
 
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Premier calcul**
 
Pour les dégâts de base, multiplie simplement \`force\` par \`2.5\` :
 
\`\`\`javascript
const degatsBase = force * 2.5;
console.log("Dégâts de base   :", degatsBase);
\`\`\`
 
Continue avec les autres formules en suivant le même principe. 
Pour \`Math.floor()\`, passe ton calcul entre les parenthèses :
\`\`\`javascript
const armure = Math.floor(agilite / 3);
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice d'opérateurs arithmétiques JS. Il doit calculer des stats dérivées à partir de formules données.
Les variables de base sont : force=45, agilite=32, intelligence=28, niveau=15.
Résultats attendus : degatsBase=112.5, vitesse=7, puissanceMagique=78.4, hpMax=1155, armure=10.
Analyse ce que l'élève a fait. Si un résultat est incorrect, guide-le vers la formule ou la priorité des opérations sans donner directement la correction.`,
 
            niveau_3_md: `
🛠 Honor **Plan de calcul des stats dérivées :**
 
Voici la structure de ton code. Remplis chaque calcul en appliquant les formules arithmétiques de la consigne (remplace les \`...\` par les calculs correspondants) :
 
\`\`\`javascript
const force = 45;
const agilite = 32;
const intelligence = 28;
const niveau = 15;
 
// Écris les formules arithmétiques requises
const degatsBase = force * ...;
const vitesse = (agilite % ...) + ...;
const puissanceMagique = (intelligence ** ...) / ...;
const hpMax = (force + agilite) * ...;
const armure = Math.floor(... / ...);
 
console.log("=== STATS DE COMBAT ===");
console.log("Dégâts de base   :", degatsBase);
console.log("Vitesse attaque  :", vitesse);
console.log("Puissance magique:", puissanceMagique);
console.log("HP max           :", hpMax);
console.log("Armure           :", armure);
console.log("=======================");
 
// Bonus : % dégâts magiques vs physiques
const totalDegats = degatsBase + puissanceMagique;
const pctMagique = Math.floor((puissanceMagique / totalDegats) * 100);
console.log("Magie            :", pctMagique + "%");
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch2-ex3-detective-typeof",
        titre: "Détective typeof — Démasque la coercion",
        chapitre: "CH2 — Variables, types et opérateurs",
        lien_cours: "https://docs.google.com/document/d/1v9bED-lsLv1HDwCxH-n3MHuvb9WnnXVNgsFAeTCxIbI/edit?tab=t.0#heading=h.qko1lj9o6v3m",
        enonce_md: `
### 🔍 Prédis le résultat avant de lancer
 
Ce programme contient **8 opérations suspectes**. Avant d'exécuter quoi que ce soit, lis chaque ligne et **écris en commentaire ce que tu penses que \`console.log\` va afficher**.
 
Ensuite, exécute le code et compare tes prédictions avec la réalité.
 
### 📝 Consignes
 
1. **Ajoute un commentaire** sur chaque ligne avec ta prédiction avant d'exécuter.
2. **Exécute** et observe les différences.
3. Pour chaque résultat qui t'a surpris, **ajoute un deuxième commentaire** qui explique pourquoi JS a fait ça.
4. **Corrige** les lignes avec \`true\`, \`null\` et \`undefined\` pour obtenir un résultat purement numérique en utilisant \`Number()\`.
        `.trim(),
 
        theorie_md: `
### La coercion de type en JS
 
JS convertit automatiquement les types quand ils ne correspondent pas. C'est pratique... mais dangereux.
 
**Le cas le plus piégeux — \`+\` avec une string :**
\`\`\`javascript
console.log("5" + 3);    // "53"  ← concaténation !
console.log("5" - 3);    // 2     ← conversion en nombre
\`\`\`
\`+\` est surchargé : il fait l'addition OU la concaténation selon le type.
Les autres opérateurs (\`-\`, \`*\`, \`/\`) forcent toujours la conversion en nombre.
 
**Valeurs "falsy" converties en nombre :**
\`\`\`javascript
Number(false);      // 0
Number(true);       // 1
Number(null);       // 0
Number(undefined);  // NaN
\`\`\`
 
**La bonne pratique — convertir explicitement :**
\`\`\`javascript
const saisie = "42";           // toujours une string depuis prompt()
const nombre = Number(saisie); // conversion explicite
console.log(nombre + 8);       // 50 ✅
\`\`\`
        `.trim(),
 
        code_depart: `// === Détective typeof — Prédis le résultat avant d'exécuter ===
// Ajoute un commentaire sur chaque ligne avec ta prédiction
 
console.log("5" + 3);        // Je prédis :
console.log("5" - 3);        // Je prédis :
console.log("5" * "2");      // Je prédis :
console.log("abc" - 1);      // Je prédis :
console.log(true + 1);       // Je prédis :
console.log(false + 10);     // Je prédis :
console.log(null + 5);       // Je prédis :
console.log(undefined + 5);  // Je prédis :
 
// Corrige ici les 3 dernières lignes (true, null, undefined)
// pour obtenir un résultat purement numérique avec Number()
 
`,
 
        indices: {
            niveau_1_md: `
💡 **Indice 1 — La règle du \`+\`**
 
L'opérateur \`+\` a deux comportements selon les types :
- Si **au moins un des deux opérandes est une string** → concaténation
- Si les deux sont des **nombres** → addition
 
\`\`\`javascript
"5" + 3    →  "53"   // string + number = concaténation
5   + 3    →  8      // number + number = addition
\`\`\`
 
Pour \`-\`, \`*\`, \`/\` → JS force toujours la conversion en nombre.
 
Pour corriger \`true\`, \`null\`, \`undefined\` : utilise \`Number()\` pour convertir explicitement avant l'opération.
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice de coercion de type JS. Il doit prédire les résultats de 8 opérations sur des types mélangés.
Résultats corrects : "53", 2, 10, NaN, 2, 10, 5, NaN.
Pour la partie correction avec Number() : Number(true)+1=2, Number(null)+5=5, Number(undefined)+5=NaN.
Analyse ses prédictions et explique pourquoi celles qui sont fausses le sont, en insistant sur la distinction entre + (ambigu avec les strings) et les autres opérateurs (toujours numériques).`,
 
            niveau_3_md: `
🛠 **Guide d'explications et indices de résolution :**
 
Regarde ces indices et explications théoriques pour t'aider à corriger ton code :
 
1. **Règle du signe \`+\`** :
   - Si l'un des côtés est du texte (string), \`+\` fait une concaténation (ex: \`"5" + 3\` donne \`"53"\`).
   - Pour les autres opérateurs (\`-\`, \`*\`, \`/\`), JS convertit automatiquement le texte en nombre (ex: \`"5" - 3\` donne \`2\`).
   - Si la conversion est impossible, le résultat sera \`NaN\` (Not a Number).
 
2. **Conversions numériques par défaut en JS** :
   - \`true\` devient \`1\`.
   - \`false\` devient \`0\`.
   - \`null\` devient \`0\`.
   - \`undefined\` ne se convertit pas en nombre et donne \`NaN\`.
 
3. **Correction avec Number()** :
   Pour convertir explicitement, enveloppe la variable ou la valeur dans la fonction \`Number()\` avant de faire ton opération arithmétique, par exemple :
   \`\`\`javascript
   console.log(Number(valeur) + 5);
   \`\`\`
            `.trim()
        }
    }
];
 
async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 2 : Variables, types et opérateurs...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 2 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch2-ex1-fiche-personnage    (const/let, types multiples)");
    console.log("  - ch2-ex2-stats-combat        (opérateurs arithmétiques)");
    console.log("  - ch2-ex3-detective-typeof    (coercion + conversions)");
}
 
seed().catch(console.error);
