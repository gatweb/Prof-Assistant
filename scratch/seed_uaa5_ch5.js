const admin = require('firebase-admin');
 
// Initialisation (pour cibler le projet de l'émulateur local)
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();
 
// ============================================================
// UAA5 — Chapitre 5 : Conditions
//
// 3 exercices :
//   ch5-ex1 : Classement de Score     (if/else if/else, comparaisons, &&)
//   ch5-ex2 : Vérificateur d'accès    (&&, ||, !, conditions combinées)
//   ch5-ex3 : Menu de Commandes RPG   (switch, break, default)
// ============================================================
 
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
        .card-ok    { border-left-color: #16a34a; }
        .card-ok strong { color: #16a34a; }
        .card-warn  { border-left-color: #d97706; }
        .card-warn strong { color: #d97706; }
        .card-erreur { border-left-color: #dc2626; }
        .card-erreur strong { color: #dc2626; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 99px;
                 font-weight: 700; font-size: 1.1em; margin-left: 8px; }
        .badge-s { background: #fef9c3; color: #854d0e; }
        .badge-a { background: #dcfce7; color: #166534; }
        .badge-b { background: #dbeafe; color: #1e40af; }
        .badge-c { background: #f3f4f6; color: #374151; }
        .badge-d { background: #fee2e2; color: #991b1b; }
        .badge-f { background: #27272a; color: #fafafa; }
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
function afficherOk(label, valeur) {
    const card = document.createElement("div");
    card.className = "card card-ok";
    card.innerHTML = valeur !== undefined
        ? \`<strong>\${label}</strong> : \${valeur}\`
        : \`<strong>\${label}</strong>\`;
    document.getElementById("output").appendChild(card);
}
function afficherWarn(label, valeur) {
    const card = document.createElement("div");
    card.className = "card card-warn";
    card.innerHTML = valeur !== undefined
        ? \`<strong>\${label}</strong> : \${valeur}\`
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
        id: "ch5-ex1-classement-score",
        titre: "Classement de Score",
        chapitre: "CH5 — Conditions",
        lien_cours: "https://docs.google.com/document/d/138XhScWCO45-hXsBv4GqST76xuzfSeEWyw7gH2JTaH8/edit?usp=sharing",
        enonce_md: `
### 🏆 Détermine le rang d'un joueur
 
Le programme demande un score (entre 0 et 100) et affiche le rang correspondant, un message personnalisé, et un bonus si le score est parfait.
 
**Tableau des rangs :**
 
| Score | Rang | Message |
|---|---|---|
| 100 | S+ — PARFAIT | "Score légendaire. Tu es inarrêtable." |
| 85 – 99 | S — Légendaire | "Performance exceptionnelle." |
| 70 – 84 | A — Expert | "Excellent travail, continue." |
| 55 – 69 | B — Confirmé | "Bon niveau. Encore un effort." |
| 40 – 54 | C — Intermédiaire | "Pas mal. Tu progresses." |
| 20 – 39 | D — Débutant | "Entraîne-toi encore." |
| 0 – 19 | F — Recommence | "Retour à la case départ." |
 
### 📝 Consignes
 
1. Demande le score avec \`prompt()\`.
2. **Validation complète :**
   - Si \`null\` → message d'annulation.
   - Si pas un nombre (\`isNaN\`) → erreur.
   - Si hors de \[0, 100\] → erreur avec \`&&\`.
3. Utilise \`if / else if / else\` pour déterminer le rang.
4. Gère le **score parfait (100)** en premier avec \`===\`.
5. Affiche : score saisi, rang, message, et "Bonus activé" si score ≥ 90.
 
> 💡 Commence par le score le plus élevé et descends — JS s'arrête au premier cas vrai.
        `.trim(),
 
        theorie_md: `
### Structure if / else if / else
 
\`\`\`javascript
if (condition1) {
    // exécuté si condition1 est vraie
} else if (condition2) {
    // exécuté si condition1 est fausse ET condition2 vraie
} else if (condition3) {
    // ...
} else {
    // exécuté si aucune condition précédente n'est vraie
}
\`\`\`
 
**Ordre important :** JS évalue de haut en bas et s'arrête au premier \`true\`.
 
---
 
### Opérateurs de comparaison
 
\`\`\`javascript
score === 100     // strictement égal (valeur ET type)
score >= 85       // supérieur ou égal
score > 0 && score <= 100   // ET — les deux doivent être vrais
\`\`\`
 
**Toujours \`===\` et \`!==\`, jamais \`==\` et \`!=\`.**
 
---
 
### Validation complète d'un nombre
 
\`\`\`javascript
const saisie = prompt("Entre un nombre (0-100) :");
 
if (saisie === null) {
    afficherErreur("Annulé.");
} else {
    const n = Number(saisie);
    if (isNaN(n)) {
        afficherErreur("Pas un nombre.");
    } else if (n < 0 || n > 100) {
        afficherErreur("Hors de la plage 0-100.");
    } else {
        // n est valide ici
    }
}
\`\`\`
 
---
 
### Opérateur logique ET (&&)
 
\`\`\`javascript
if (score >= 20 && score < 40) {
    // les deux conditions doivent être vraies
}
\`\`\`
        `.trim(),
 
        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────
 
// 1. Demande le score
 
 
// 2. Validation (null → isNaN → hors plage)
 
 
// 3. Détermine le rang avec if / else if / else
//    Commence par score === 100, puis >= 85, etc.
 
 
// 4. Affiche les résultats
 
 
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure générale**
 
\`\`\`javascript
const saisie = prompt("Entre ton score (0-100) :");
 
if (saisie === null) {
    afficherErreur("Saisie annulée.");
} else {
    const score = Number(saisie);
 
    if (isNaN(score)) {
        afficherErreur("Ce n'est pas un nombre.");
    } else if (score < 0 || score > 100) {
        afficherErreur("Le score doit être entre 0 et 100.");
    } else {
        // Ici score est valide — détermine le rang
        let rang = "";
        let message = "";
 
        if (score === 100) {
            rang = "S+ — PARFAIT";
            message = "Score légendaire. Tu es inarrêtable.";
        } else if (score >= 85) {
            rang = "S — Légendaire";
            message = "Performance exceptionnelle.";
        } // ... continue avec les autres rangs
    }
}
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice de conditions JS : déterminer le rang d'un score (0-100) avec if/else if/else.
Structure attendue : validation (null, isNaN, hors plage 0-100), puis if/else if/else pour les 7 rangs (100=S+, 85-99=S, 70-84=A, 55-69=B, 40-54=C, 20-39=D, 0-19=F), plus un bonus si score >= 90.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après la ligne "═══".
Points à vérifier : ordre des conditions (descendre du plus élevé), utilisation de === pour 100, opérateurs de comparaison corrects, validation complète en amont, bonus >= 90 géré séparément après la détermination du rang.
Identifie le premier problème et guide l'élève avec une question ciblée.`,
 
            niveau_3_md: `
🛠️ **Squelette de structure attendu :**
 
Voici comment ordonner tes tranches conditionnelles du score le plus élevé vers le plus bas. Remplis les \`...\` par les bonnes valeurs et les bons messages :
 
\`\`\`javascript
const saisie = prompt("Entre ton score (0-100) :");
 
if (saisie === null) {
    afficherErreur("Saisie annulée.");
} else {
    const score = Number(saisie);
 
    if (isNaN(score)) {
        afficherErreur("Ce n'est pas un nombre valide.");
    } else if (score < 0 || score > 100) {
        afficherErreur(\`Score \${score} invalide — attendu entre 0 et 100.\`);
    } else {
        let rang, message;
 
        if (score === 100) {
            rang    = "S+ — PARFAIT";
            message = "Score légendaire. Tu es inarrêtable.";
        } else if (score >= 85) {
            rang    = "S — Légendaire";
            message = "...";
        } else if (score >= 70) {
            rang    = "A — Expert";
            message = "...";
        } else if (score >= 55) {
            rang    = "B — Confirmé";
            message = "...";
        } else if (score >= 40) {
            rang    = "C — Intermédiaire";
            message = "...";
        } else if (score >= 20) {
            rang    = "D — Débutant";
            message = "...";
        } else {
            rang    = "F — Recommence";
            message = "...";
        }
 
        afficherTitre("=== RÉSULTAT ===");
        afficher("Score",   score);
        afficher("Rang",    rang);
        afficher("Message", message);
 
        // Condition de bonus séparée (si score est égal ou supérieur à 90)
        if (score >= ...) {
            afficherOk("🎁 Bonus activé", "Top 10% des joueurs !");
        }
    }
}
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch5-ex2-verificateur-acces",
        titre: "Vérificateur d'Accès Système",
        chapitre: "CH5 — Conditions",
        lien_cours: "https://docs.google.com/document/d/138XhScWCO45-hXsBv4GqST76xuzfSeEWyw7gH2JTaH8/edit?usp=sharing",
        enonce_md: `
### 🔐 Contrôle d'accès à un système sécurisé
 
Un système applique des règles d'accès complexes. Selon le profil de l'utilisateur, l'accès est autorisé, restreint, ou refusé.
 
**Demande 3 informations avec \`prompt()\` :**
- Niveau de sécurité (nombre entre 1 et 5)
- Est administrateur ? (\`"oui"\` ou \`"non"\`)
- Code d'accès (\`"ALPHA-7"\` est le seul valide)
 
**Règles d'accès :**
 
| Condition | Résultat |
|---|---|
| Admin ET code correct | Accès total — toutes zones |
| Niveau ≥ 4 ET code correct (mais pas admin) | Accès zone sécurisée |
| Niveau ≥ 2 ET niveau < 4 ET pas banni | Accès zone standard |
| Niveau < 2 OU code incorrect (sauf admin) | Accès refusé |
 
Un utilisateur est "banni" si son niveau est exactement 3 ET qu'il n'est pas admin.
 
### 📝 Consignes
 
1. Récupère les 3 informations (valide : null, niveau hors [1,5]).
2. Convertis "oui"/"non" en booléen avec \`toLowerCase() === "oui"\`.
3. Applique les règles avec \`if / else if / else\` en combinant \`&&\`, \`||\`, \`!\`.
4. Affiche le niveau d'accès et les zones disponibles.
 
> ⚠️ Testes bien tous les cas : admin+code correct, niveau 4+code correct, niveau 3 (banni), niveau 1...
        `.trim(),
 
        theorie_md: `
### Opérateurs logiques — rappel
 
**&& (ET)** : les deux conditions doivent être vraies
\`\`\`javascript
if (niveau >= 4 && codeCorrect) { ... }
\`\`\`
 
**|| (OU)** : au moins une condition doit être vraie
\`\`\`javascript
if (niveau < 2 || !codeCorrect) { ... }
\`\`\`
 
**! (NON)** : inverse la condition
\`\`\`javascript
const estAdmin = reponse.toLowerCase() === "oui";
if (!estAdmin) { ... }   // si PAS admin
\`\`\`
 
**Combiner avec des parenthèses :**
\`\`\`javascript
if ((estAdmin || niveau >= 4) && codeCorrect) {
    // admin OU niveau élevé, ET le code est bon
}
\`\`\`
 
---
 
### Convertir une réponse oui/non en booléen
 
\`\`\`javascript
const reponse = prompt("Es-tu admin ? (oui/non)");
const estAdmin = reponse !== null && reponse.toLowerCase() === "oui";
// true si l'utilisateur a tapé "oui", "Oui", "OUI"...
// false pour tout le reste
\`\`\`
 
---
 
### Valeurs falsy utiles dans les conditions
 
\`\`\`javascript
if (!pseudo)           // true si pseudo est null, "", undefined
if (pseudo)            // true si pseudo est une string non vide
\`\`\`
        `.trim(),
 
        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────
const CODE_VALIDE = "ALPHA-7";
 
// 1. Récupère les 3 informations
 
 
// 2. Validation des saisies
 
 
// 3. Convertis la réponse admin en booléen
 
 
// 4. Vérifie si le code est correct
 
 
// 5. Applique les règles d'accès avec if / else if / else
 
 
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Conversion et premières conditions**
 
**Convertir admin en booléen :**
\`\`\`javascript
const repAdmin = prompt("Es-tu administrateur ? (oui/non) :").toLowerCase().trim();
const estAdmin = repAdmin === "oui";
\`\`\`
 
**Vérifier le code :**
\`\`\`javascript
const code = prompt("Code d'accès :");
const codeCorrect = code === CODE_VALIDE;
\`\`\`
 
**Première règle :**
\`\`\`javascript
if (estAdmin && codeCorrect) {
    afficherOk("✅ ACCÈS TOTAL", "Toutes zones débloquées");
} else if (niveau >= 4 && codeCorrect) {
    afficherOk("✅ ACCÈS ZONE SÉCURISÉE", "Zones A et B");
} // ... continue
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice de conditions combinées JS avec &&, ||, !.
Logique attendue : admin && codeCorrect → accès total ; niveau>=4 && codeCorrect && !estAdmin → zone sécurisée ; niveau>=2 && niveau<4 && niveau!==3 → standard (niveau 3 = banni sauf admin) ; sinon → refusé.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points critiques : conversion correcte de la réponse admin en booléen (.toLowerCase()==="oui"), vérification stricte du code (===CODE_VALIDE), ordre des conditions (admin en premier), gestion du cas "banni" (niveau===3 && !estAdmin), parenthèses pour la priorité des opérateurs.
Identifie l'erreur principale et pose une question ciblée sans donner la solution.`,
 
            niveau_3_md: `
🛠️ **Squelette logique et règles d'accès attendus :**
 
Voici l'architecture pour évaluer les capteurs logiques complexes. Remplis les \`...\` :
 
\`\`\`javascript
const CODE_VALIDE = "ALPHA-7";
 
const saisieNiveau = prompt("Niveau de sécurité (1-5) :");
const saisieAdmin  = prompt("Es-tu administrateur ? (oui/non) :");
const code         = prompt("Code d'accès :");
 
if (saisieNiveau === null || saisieAdmin === null || code === null) {
    afficherErreur("Saisie annulée.");
} else {
    const niveau = Number(saisieNiveau);
 
    if (isNaN(niveau) || niveau < 1 || niveau > 5) {
        afficherErreur("Niveau invalide — entre 1 et 5.");
    } else {
        const estAdmin    = saisieAdmin.toLowerCase().trim() === "oui";
        const codeCorrect = code === CODE_VALIDE;
        
        // Règle de bannissement : niveau 3 ET pas admin
        const estBanni    = niveau === 3 && ...;
 
        afficherTitre("=== CONTRÔLE D'ACCÈS ===");
        afficher("Niveau",         niveau);
        afficher("Administrateur", estAdmin    ? "Oui" : "Non");
        afficher("Code valide",    codeCorrect ? "Oui" : "Non");
        afficher("Statut banni",   estBanni    ? "Oui" : "Non");
 
        // Évaluation des règles d'accès combinées
        if (estAdmin && codeCorrect) {
            afficherOk("✅ ACCÈS TOTAL", "Toutes zones débloquées");
        } else if (niveau >= 4 && codeCorrect && !estAdmin) {
            afficherOk("✅ ACCÈS ZONE SÉCURISÉE", "Zones A et B");
        } else if (niveau >= 2 && niveau < 4 && !...) {
            afficherWarn("⚠️ ACCÈS STANDARD", "Zone publique uniquement");
        } else {
            afficherErreur("Accès refusé.");
        }
    }
}
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch5-ex3-menu-commandes-rpg",
        titre: "Menu de Commandes RPG",
        chapitre: "CH5 — Conditions",
        lien_cours: "https://docs.google.com/document/d/138XhScWCO45-hXsBv4GqST76xuzfSeEWyw7gH2JTaH8/edit?usp=sharing",
        enonce_md: `
### ⚔️ Interprète les commandes d'un joueur
 
Le programme affiche un menu de combat et exécute l'action choisie par le joueur avec un \`switch\`.
 
**Stats de départ (déjà déclarées) :**
- HP : 100 | Mana : 50 | Or : 30 | Armure : 0
 
**Menu :**
\`\`\`
1 — Attaque normale    (HP ennemi -25, coût 0 mana)
2 — Sort de feu        (HP ennemi -45, coût 20 mana)
3 — Potion de soin     (HP joueur +40, coût 10 or)
4 — Bouclier magique   (Armure +20, coût 15 mana)
5 — Fuite              (Message de lâcheté)
\`\`\`
 
### 📝 Consignes
 
1. Affiche les stats de départ avec \`afficherTitre()\` + \`afficher()\`.
2. Demande le choix avec \`prompt()\` — valide (null, vide).
3. Utilise \`switch\` pour exécuter l'action :
   - Vérifie les ressources **avant** d'exécuter (mana/or suffisants).
   - Met à jour la stat concernée.
   - Affiche un message de résultat.
4. Le \`default\` gère toute commande inconnue.
5. Affiche les stats **après** l'action.
 
> 💡 Pour vérifier les ressources : un \`if\` **à l'intérieur** du \`case\` avant d'exécuter.
        `.trim(),
 
        theorie_md: `
### Structure switch
 
\`\`\`javascript
switch (valeur) {
    case "1":
        // code pour le cas "1"
        break;    // ← OBLIGATOIRE, sinon fall-through
    case "2":
        // code pour le cas "2"
        break;
    default:
        // si aucun cas ne correspond
}
\`\`\`
 
**Règles critiques :**
- \`switch\` utilise \`===\` pour comparer — les types doivent correspondre
- \`prompt()\` renvoie une string → les \`case\` doivent être des strings : \`case "1":\` pas \`case 1:\`
- \`break\` obligatoire pour sortir du switch après chaque cas
 
**Fall-through sans break :**
\`\`\`javascript
switch (x) {
    case "1":
        console.log("cas 1");
        // pas de break → tombe dans le cas suivant !
    case "2":
        console.log("cas 2");  // s'exécute aussi si x === "1"
        break;
}
\`\`\`
 
**if dans un case :**
\`\`\`javascript
case "2":
    if (mana >= 20) {
        mana -= 20;
        afficherOk("Sort lancé !");
    } else {
        afficherErreur("Mana insuffisant !");
    }
    break;
\`\`\`
        `.trim(),
 
        code_depart: HELPER_AFFICHER + `// ─── Ton code ici ──────────────────────────────────────────────────
 
// Stats de départ
let hp     = 100;
let mana   = 50;
let or     = 30;
let armure = 0;
 
// 1. Affiche les stats initiales
afficherTitre("=== STATS DE DÉPART ===");
afficher("HP",     hp);
afficher("Mana",   mana);
afficher("Or",     or);
afficher("Armure", armure);
 
// 2. Demande le choix de l'action
const choix = prompt(\`
=== MENU DE COMBAT ===
1 — Attaque normale  (dégâts : 25)
2 — Sort de feu      (dégâts : 45, coût : 20 mana)
3 — Potion de soin   (HP +40,  coût : 10 or)
4 — Bouclier magique (Armure +20, coût : 15 mana)
5 — Fuite
Ton choix :\`);
 
// 3. Traite le choix avec switch
 
 
// 4. Affiche les stats après l'action
 
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Structure du switch**
 
\`\`\`javascript
afficherTitre("=== ACTION ===");
 
switch (choix) {
    case "1":
        afficherOk("⚔️ Attaque normale", "Inflige 25 dégâts");
        break;
 
    case "2":
        if (mana >= 20) {
            mana -= 20;
            afficherOk("🔥 Sort de feu", "Inflige 45 dégâts — Mana -20");
        } else {
            afficherErreur("Mana insuffisant ! (besoin : 20)");
        }
        break;
 
    // Continue avec les cas 3, 4, 5...
 
    default:
        afficherErreur("Commande inconnue — entre 1, 2, 3, 4 ou 5.");
}
\`\`\`
 
N'oublie pas le \`break\` à la fin de chaque case !
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur un exercice switch JS pour un menu de combat RPG.
Le switch doit gérer 5 cases (chaînes "1" à "5") + default. Cases 2 et 4 nécessitent une vérification de mana (>=20 et >=15), case 3 une vérification d'or (>=10). Les stats (hp, mana, or, armure) sont des let et doivent être modifiées dans les cases.
Le code reçu combine HTML+CSS+JS — analyse uniquement le JS après "═══".
Points à vérifier : cases avec guillemets (strings pas numbers), break présent après chaque case, if pour vérification des ressources dans les cases concernés, stats modifiées avec -= ou +=, affichage des stats finales après le switch.
Identifie le problème principal (break manquant, case numérique, ressources non vérifiées...) et pose une question ciblée.`,
 
            niveau_3_md: `
🛠️ **Squelette de switch RPG attendu :**
 
Voici comment structurer ton switch sur le choix du joueur, en y imbriquant des vérifications de ressources. Remplis les \`...\` :
 
\`\`\`javascript
if (choix === null || choix.trim() === "") {
    afficherErreur("Aucune commande entrée.");
} else {
    afficherTitre("=== RÉSULTAT DE L'ACTION ===");
 
    switch (choix.trim()) {
        case "1":
            afficherOk("⚔️ Attaque normale", "L'ennemi subit 25 dégâts.");
            break;
 
        case "2":
            // Consomme 20 mana
            if (mana >= 20) {
                mana -= ...;
                afficherOk("🔥 Sort de feu", "L'ennemi subit 45 dégâts. Mana -20.");
            } else {
                afficherErreur(\`Mana insuffisant ! Tu as \${mana} mana (besoin : 20).\`);
            }
            break;
 
        case "3":
            // Consomme 10 or et soigne 40 HP
            if (or >= 10) {
                hp += ...;
                or -= ...;
                afficherOk("🧪 Potion de soin", \`HP +40 (total : \${hp}). Or -10.\`);
            } else {
                afficherErreur(\`Or insuffisante ! Tu as \${or} or (besoin : 10).\`);
            }
            break;
 
        case "4":
            // Consomme 15 mana et ajoute 20 armure
            if (mana >= 15) {
                armure += ...;
                mana   -= ...;
                afficherOk("🛡️ Bouclier magique", \`Armure +20 (total : \${armure}). Mana -15.\`);
            } else {
                afficherErreur(\`Mana insuffisant ! Tu as \${mana} mana (besoin : 15).\`);
            }
            break;
 
        case "5":
            afficherWarn("💨 Tu fuis...", "La honte sera éternelle.");
            break;
 
        default:
            // Toujours penser au cas par défaut !
            afficherErreur(\`Commande "\${choix}" inconnue — entre 1, 2, 3, 4 ou 5.\`);
    }
 
    // Affichage des statistiques finales actualisées
    afficherTitre("=== STATS APRÈS ACTION ===");
    afficher("HP",     hp);
    afficher("Mana",   mana);
    afficher("Or",     or);
    afficher("Armure", armure);
}
\`\`\`
            `.trim()
        }
    }
];
 
async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 5 : Conditions...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("✨ Seeding Chapitre 5 terminé !");
    console.log("\nExercices créés :");
    console.log("  - ch5-ex1-classement-score       (if/else if/else, ===, &&, ||)");
    console.log("  - ch5-ex2-verificateur-acces      (&&, ||, !, conditions combinées)");
    console.log("  - ch5-ex3-menu-commandes-rpg      (switch, break, default, if dans case)");
}
 
seed();
exportConfig = {
    projectId: 'profassistant-61fde'
};
