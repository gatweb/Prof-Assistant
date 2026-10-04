# Chapitre 5 — Conditions

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Utiliser les opérateurs de comparaison et comprendre la différence entre `==` et `===`
- Écrire des structures `if / else if / else` pour brancher l'exécution
- Combiner des conditions avec les opérateurs logiques `&&`, `||`, `!`
- Utiliser `switch` pour gérer des valeurs discrètes
- Choisir la bonne structure selon le contexte

---

## 5.1 Les opérateurs de comparaison

Une condition, c'est une expression qui est évaluée comme `true` ou `false`. Les opérateurs de comparaison sont les outils de base pour construire ces expressions.

| Opérateur | Signification | Exemple | Résultat |
|---|---|---|---|
| `===` | Strictement égal (valeur **et** type) | `5 === 5` | `true` |
| `!==` | Strictement différent | `5 !== "5"` | `true` |
| `<` | Inférieur strict | `3 < 5` | `true` |
| `>` | Supérieur strict | `3 > 5` | `false` |
| `<=` | Inférieur ou égal | `5 <= 5` | `true` |
| `>=` | Supérieur ou égal | `6 >= 5` | `true` |

### `===` vs `==` — le piège le plus classique de JS

JS possède deux opérateurs d'égalité. **Utilise toujours `===`.**

```javascript
// == : égalité laxiste — JS convertit les types avant de comparer
console.log("5" == 5);    // true  ← dangereux, types différents
console.log(0 == false);  // true  ← 0 et false "sont pareils" pour ==
console.log("" == false); // true  ← chaîne vide et false aussi

// === : égalité stricte — valeur ET type doivent correspondre
console.log("5" === 5);   // false ← string ≠ number
console.log(0 === false); // false ← number ≠ boolean
console.log(5 === 5);     // true  ← même valeur, même type ✓
```

`==` fait de la coercion de type automatique (rappel CH2) avant de comparer. Résultat : des comportements surprenants qui causent des bugs impossibles à trouver. `===` compare sans conversion — ce que tu vois est ce qui est comparé.

> **Règle absolue : utilise toujours `===` et `!==`. Oublie `==` et `!=`.**

---

## 5.2 `if / else if / else`

La structure `if` exécute un bloc de code **uniquement si** la condition est vraie.

### Forme minimale — `if` seul

```javascript
const niveau = 42;

if (niveau >= 10) {
    afficher("Tu as débloqué le mode expert !");
}
// Si niveau < 10, rien ne se passe — le bloc est ignoré
```

### Avec alternative — `if / else`

```javascript
const hp = 15;

if (hp > 0) {
    afficher("Statut", "Vivant");
} else {
    afficher("Statut", "KO — game over");
}
// L'un ou l'autre s'exécute, jamais les deux
```

### Chaîne de conditions — `if / else if / else`

```javascript
const score = 73;

if (score >= 85) {
    afficher("Rang", "S — Légendaire");
} else if (score >= 70) {
    afficher("Rang", "A — Expert");
} else if (score >= 55) {
    afficher("Rang", "B — Confirmé");
} else if (score >= 40) {
    afficher("Rang", "C — Intermédiaire");
} else if (score >= 20) {
    afficher("Rang", "D — Débutant");
} else {
    afficher("Rang", "F — Recommence");
}
// Seul le premier bloc dont la condition est vraie s'exécute
// Les suivants sont ignorés même si leurs conditions sont vraies
```

**Point critique :** JS évalue les conditions dans l'ordre et s'arrête à la première vraie. L'ordre des `else if` compte.

### Imbrication — `if` dans un `if`

```javascript
const niveau = 50;
const estVip = true;

if (niveau >= 30) {
    if (estVip) {
        afficher("Accès zone VIP débloqué ✓");
    } else {
        afficher("Niveau suffisant, mais pas VIP");
    }
} else {
    afficher("Niveau insuffisant");
}
```

> **Attention à la lisibilité :** au-delà de 2-3 niveaux d'imbrication, le code devient difficile à lire et à déboguer. Dans ce cas, les opérateurs logiques `&&` et `||` (section suivante) sont souvent une meilleure solution.

---

## 5.3 Opérateurs logiques

Les opérateurs logiques combinent plusieurs conditions en une seule expression.

### `&&` — ET (les deux doivent être vrais)

```javascript
const niveau = 25;
const hp = 80;

if (niveau >= 20 && hp >= 50) {
    afficher("Tu peux rejoindre le raid !");
}
// Les deux conditions doivent être vraies simultanément
```

Table de vérité de `&&` :

| A | B | A && B |
|---|---|---|
| true | true | **true** |
| true | false | false |
| false | true | false |
| false | false | false |

### `||` — OU (au moins un doit être vrai)

```javascript
const aUnPass = false;
const estAdmin = true;

if (aUnPass || estAdmin) {
    afficher("Accès autorisé");
}
// Suffisant qu'une seule condition soit vraie
```

Table de vérité de `||` :

| A | B | A \|\| B |
|---|---|---|
| true | true | **true** |
| true | false | **true** |
| false | true | **true** |
| false | false | false |

### `!` — NON (inverse la condition)

```javascript
const estBanni = false;

if (!estBanni) {
    afficher("Bienvenue sur le serveur !");
}
// !false → true, donc le bloc s'exécute

const pseudo = "";
if (!pseudo) {
    afficherErreur("Pseudo vide !");
}
// !"" → !false → true (chaîne vide est falsy)
```

### Combiner les opérateurs logiques

```javascript
const age = 17;
const aAutorisationParentale = true;
const estMembre = false;

// Parenthèses pour la clarté et la priorité
if ((age >= 18 || aAutorisationParentale) && !estMembre) {
    afficher("Inscription possible !");
}
```

> **Ordre de priorité :** `!` d'abord, puis `&&`, puis `||`. En cas de doute, utilise des parenthèses — elles clarifient toujours l'intention.

### Les valeurs "falsy" et "truthy"

En JS, toute valeur peut être évaluée comme un booléen dans une condition. Certaines valeurs sont **falsy** (évaluées comme `false`) :

```javascript
// Valeurs falsy — toutes évaluées à false dans un if
false, 0, "", null, undefined, NaN

// Tout le reste est truthy — évalué à true dans un if
true, 1, "texte", [], {}
```

```javascript
const pseudo = prompt("Pseudo :");

// Plutôt que : if (pseudo !== null && pseudo !== "")
// On peut écrire :
if (pseudo) {
    afficher("Pseudo reçu :", pseudo);
}
// Mais attention : prompt() renvoie null si annulé, "" si vide
// Les deux sont falsy → cette syntaxe courte fonctionne ici
```

---

## 5.4 `switch` — pour les valeurs discrètes

`switch` est conçu pour comparer une valeur contre plusieurs cas précis. Il est plus lisible qu'une longue chaîne de `if/else if` quand on teste la même variable contre des valeurs fixes.

```javascript
const commande = prompt("Choisis une action (1-4) :");

switch (commande) {
    case "1":
        afficher("⚔️ Tu attaques !", "Inflige 45 dégâts");
        break;
    case "2":
        afficher("🛡️ Tu te défends", "Armure +20 ce tour");
        break;
    case "3":
        afficher("🧪 Tu utilises une potion", "Récupère 50 HP");
        break;
    case "4":
        afficher("💨 Tu fuis", "Perds 1 tour");
        break;
    default:
        afficherErreur("Commande inconnue — entre 1, 2, 3 ou 4");
}
```

### Les règles du `switch`

**`break` est obligatoire** (presque toujours). Sans lui, JS continue d'exécuter les cas suivants — comportement appelé *fall-through* :

```javascript
const x = 1;

switch (x) {
    case 1:
        console.log("cas 1");
        // ❌ Pas de break — le code tombe dans le cas suivant !
    case 2:
        console.log("cas 2");
        break;
}
// Affiche "cas 1" ET "cas 2" — probablement pas voulu
```

```javascript
switch (x) {
    case 1:
        console.log("cas 1");
        break;   // ✅ S'arrête ici
    case 2:
        console.log("cas 2");
        break;
}
// Affiche uniquement "cas 1"
```

**`default`** est le bloc "sinon" du switch — s'exécute si aucun cas ne correspond. Il est optionnel mais fortement recommandé.

**`switch` utilise `===`** en interne pour les comparaisons — pas de coercion de type.

```javascript
// prompt() renvoie toujours une string
// Donc les case doivent être des strings aussi :
switch (commande) {
    case "1":   // ✅ string "1" === string "1"
    case 1:     // ❌ number 1 !== string "1" — ne s'exécutera jamais
```

### `switch` vs `if/else if` — quand choisir quoi ?

| Situation | Structure recommandée |
|---|---|
| Plages de valeurs (`>`, `<`, entre X et Y) | `if / else if / else` |
| Valeurs discrètes précises (1, 2, 3 ou "nord", "sud"...) | `switch` |
| Condition unique | `if` |
| Deux alternatives | `if / else` |

---

## 5.5 Rappel — l'opérateur ternaire

Pour des conditions simples avec deux résultats, le ternaire est plus concis que `if/else` :

```javascript
// if / else complet
let statut;
if (hp > 0) {
    statut = "Vivant";
} else {
    statut = "KO";
}

// Équivalent en ternaire — une ligne
const statut = hp > 0 ? "Vivant" : "KO";
```

Syntaxe : `condition ? valeurSiVrai : valeurSiFaux`

```javascript
const score = 78;
afficher("Résultat", score >= 50 ? "Réussi ✓" : "Échoué ✗");
afficher("Bonus",    score === 100 ? "Score parfait ! 🏆" : "Pas de bonus");
```

> **Limite du ternaire :** une seule expression par branche. Dès que tu veux faire plusieurs choses selon le cas, reviens à `if/else`. Un ternaire imbriqué dans un autre ternaire est un anti-pattern — illisible.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `===` | Toujours préférer à `==` — compare valeur ET type |
| `if / else if / else` | Branches alternatives — seul le premier cas vrai s'exécute |
| `&&` | ET — les deux conditions doivent être vraies |
| `\|\|` | OU — au moins une condition doit être vraie |
| `!` | NON — inverse la condition |
| `switch` | Pour des valeurs discrètes — ne pas oublier `break` |
| `default` | Le "sinon" du switch — toujours l'inclure |
| Ternaire `? :` | Raccourci pour `if/else` simple à deux résultats |
| Valeurs falsy | `false`, `0`, `""`, `null`, `undefined`, `NaN` |

---

## 🔗 Pour aller plus loin

- [MDN — if...else](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/if...else)
- [MDN — switch](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/switch)
- [MDN — Opérateurs logiques](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/Logical_AND)
- [MDN — Opérateur de comparaison strict](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/Strict_equality)

---

*→ Chapitre suivant : Boucles (while / for)*
