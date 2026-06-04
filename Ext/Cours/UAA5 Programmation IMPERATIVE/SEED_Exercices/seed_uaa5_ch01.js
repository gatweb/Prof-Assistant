const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ============================================================
// UAA5 — Chapitre 1 : Introduction à JavaScript
// 2 exercices :
//   ch1-ex1 : Rapport de Mission  (premier contact console.log)
//   ch1-ex2 : Débogage Niveau 1   (4 bugs de syntaxe à corriger)
// ============================================================

const EXERCICES = [
    {
        id: "ch1-ex1-rapport-mission",
        titre: "Rapport de Mission",
        chapitre: "CH1 — Introduction à JavaScript",
        enonce_md: `
### 🎯 Mission : Afficher un rapport de mission

L'IA centrale du vaisseau est en panne. Tu dois reconstruire son rapport de démarrage manuellement.

**Le rapport doit afficher exactement ces 5 lignes, dans cet ordre :**

\`\`\`
=== SYSTÈME INITIALISÉ ===
Pilote : [ton prénom]
Vaisseau : Horizon-7
Statut : Opérationnel
Coordonnées : Secteur 42
\`\`\`

### 📝 Consignes

1. Utilise **5 appels à \`console.log()\`**, un par ligne.
2. Remplace \`[ton prénom]\` par ton vrai prénom.
3. Respecte exactement les espaces et les majuscules — le rapport est sensible à la casse.

> 💡 Tu peux passer n'importe quel texte à \`console.log()\` en le mettant entre guillemets.
        `.trim(),

        theorie_md: `
### console.log() — Afficher dans la console

\`console.log()\` est ta fonction d'affichage principale en JS. Elle affiche ce que tu lui passes entre les parenthèses.

**Syntaxe :**
\`\`\`javascript
console.log("Texte à afficher");
\`\`\`

**Exemples :**
\`\`\`javascript
console.log("Bonjour !");
// Sortie : Bonjour !

console.log("Score :", 100);
// Sortie : Score : 100
\`\`\`

**Règles à retenir :**
- Le texte doit être entre guillemets simples \`'\` ou doubles \`"\`
- Chaque instruction se termine par un point-virgule \`;\`
- JS est sensible à la casse : \`console.log\` ≠ \`Console.Log\`
        `.trim(),

        code_depart: `// Rapport de démarrage du vaisseau
// Utilise 5 console.log() pour afficher le rapport

`,

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure de base**

Chaque ligne du rapport = un \`console.log()\`. Commence par la première ligne :

\`\`\`javascript
console.log("=== SYSTÈME INITIALISÉ ===");
\`\`\`

Continue avec les 4 suivantes en suivant le même modèle.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur son premier exercice JS : afficher 5 lignes précises avec console.log(). 
Analyse son code et identifie ce qui cloche (guillemets manquants, point-virgule absent, texte incorrect, mauvais nombre de console.log). 
Pose-lui une question qui le guide vers l'erreur sans lui donner la solution. 
Reste encourageant — c'est son tout premier exercice JS.`,

            niveau_3_md: `
🛠️ **Structure complète :**

\`\`\`javascript
console.log("=== SYSTÈME INITIALISÉ ===");
console.log("Pilote : Alex");       // Remplace par ton prénom
console.log("Vaisseau : ___");
console.log("Statut : ___");
console.log("Coordonnées : ___");
\`\`\`

Complète les \`___\` avec les bonnes valeurs du rapport.
            `.trim()
        }
    },

    {
        id: "ch1-ex2-debug-syntaxe",
        titre: "Débogage : 4 bugs à trouver",
        chapitre: "CH1 — Introduction à JavaScript",
        enonce_md: `
### 🐛 Le code est cassé — trouve les bugs

Ton coéquipier a écrit ce programme pour afficher sa fiche d'agent. Problème : **il ne fonctionne pas**. Il y a **4 erreurs de syntaxe** dans le code.

\`\`\`
=== FICHE AGENT ===
Nom : Agent 404
Statut : Opérationnel
Mission : Apprendre JavaScript
===================
\`\`\`

### 📝 Consignes

1. Copie le code de départ dans l'éditeur.
2. Identifie et corrige les **4 erreurs**.
3. Ajoute un commentaire \`// Bug corrigé : [description]\` sur chaque ligne que tu as modifiée.
4. Le programme doit afficher exactement les 5 lignes ci-dessus.

> ⚠️ Les erreurs concernent : la casse, les guillemets et la syntaxe de \`console.log()\`.
        `.trim(),

        theorie_md: `
### Règles de syntaxe JS — Chapitre 1

**1. Sensibilité à la casse**
JS distingue majuscules et minuscules.
\`\`\`javascript
console.log("OK");    // ✅ correct
Console.log("OK");    // ❌ ReferenceError
\`\`\`

**2. Les guillemets**
Le texte (string) doit être entre guillemets simples ou doubles.
\`\`\`javascript
console.log("Bonjour");   // ✅
console.log('Bonjour');   // ✅
console.log(Bonjour);     // ❌ ReferenceError
\`\`\`

**3. Les parenthèses**
\`console.log\` est une fonction : elle a besoin d'une parenthèse ouvrante \`(\` et d'une fermante \`)\`.
\`\`\`javascript
console.log("Test");    // ✅
console.log("Test";     // ❌ SyntaxError
\`\`\`

**4. Le point-virgule**
Chaque instruction se termine par \`;\`.
\`\`\`javascript
console.log("A");   // ✅
console.log("B")    // ⚠️ fonctionne parfois, mais mauvaise pratique
\`\`\`

**Lire les messages d'erreur :**
- \`ReferenceError: X is not defined\` → problème de casse ou nom inconnu
- \`SyntaxError: Unexpected token\` → parenthèse ou guillemet manquant
        `.trim(),

        code_depart: `// Fiche d'agent — ce code contient 4 bugs, trouve-les !
// Ajoute un commentaire sur chaque ligne corrigée

Console.log("=== FICHE AGENT ===");
console.log("Nom : Agent 404")
console.log("Statut : Opérationnel";
console.log(Mission : Apprendre JavaScript");
console.log("===================");
`,

        indices: {
            niveau_1_md: `
💡 **Indice 1 — Types d'erreurs possibles**

Cherche dans le code ces 4 types de problèmes :
- Une erreur de **casse** (majuscule là où il n'en faut pas)
- Un **point-virgule manquant**
- Une **parenthèse mal placée**
- Un **guillemet manquant**

Lis le code ligne par ligne, lentement.
            `.trim(),

            niveau_2_prompt: `L'élève travaille sur un exercice de débogage JS niveau débutant. 
Le code original contient exactement 4 bugs : 
(1) ligne 1 : Console.log → doit être console.log (casse),
(2) ligne 2 : point-virgule manquant en fin de ligne,
(3) ligne 3 : parenthèse fermante avant le guillemet fermant (console.log("Statut : Opérationnel"; → doit être console.log("Statut : Opérationnel");),
(4) ligne 4 : guillemet ouvrant manquant avant Mission.

Analyse ce que l'élève a déjà corrigé. Pour chaque bug restant, pose une question ciblée qui l'amène à le voir lui-même, sans le corriger directement.`,

            niveau_3_md: `
🛠️ **Correction complète avec explications :**

\`\`\`javascript
// Bug corrigé : Console → console (sensibilité à la casse)
console.log("=== FICHE AGENT ===");

// Bug corrigé : point-virgule manquant
console.log("Nom : Agent 404");

// Bug corrigé : ; était AVANT ) au lieu d'être après
console.log("Statut : Opérationnel");

// Bug corrigé : guillemet ouvrant manquant avant Mission
console.log("Mission : Apprendre JavaScript");

console.log("===================");
\`\`\`
            `.trim()
        }
    }
];

async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 1 : Introduction à JavaScript...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 1 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch1-ex1-rapport-mission");
    console.log("  - ch1-ex2-debug-syntaxe");
}

seed();
