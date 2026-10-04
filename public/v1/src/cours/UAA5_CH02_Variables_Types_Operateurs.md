# Chapitre 2 — Variables, types et opérateurs

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Déclarer des variables avec `let` et `const` (et savoir lequel choisir)
- Identifier et utiliser les types de données fondamentaux
- Inspecter le type d'une valeur avec `typeof`
- Utiliser les opérateurs arithmétiques et d'affectation
- Anticiper le piège classique de la coercion de type en JS

---

## 2.1 Déclarer une variable : `let` et `const`

Une variable, c'est une **boîte étiquetée** qui stocke une valeur en mémoire. En JS moderne, on en déclare avec deux mots-clés : `let` et `const`.

### `const` — valeur fixe (à utiliser par défaut)

```javascript
const nomJoueur = "Shadow_X";
const niveauMax = 99;
```

`const` crée une variable dont la valeur **ne peut pas être réassignée**. Si tu essaies, JS lève une erreur immédiatement :

```javascript
const hp = 100;
hp = 80;
// ❌ TypeError: Assignment to constant variable.
```

C'est exactement ce qu'on veut la plupart du temps. Une valeur qui change par accident, c'est un bug difficile à trouver.

### `let` — valeur modifiable

```javascript
let score = 0;
score = score + 50;   // OK, score vaut maintenant 50
score = 200;          // OK, on peut réassigner
```

`let` permet de changer la valeur plus tard. À utiliser uniquement quand tu sais que la variable va évoluer (un compteur, un score, un état qui change).

### `var` — l'ancienne syntaxe

Tu verras parfois `var` dans du vieux code ou des tutoriels datés. Ne l'utilise pas — il a des comportements imprévisibles liés à la portée des variables. `let` et `const` règlent tous ces problèmes.

```javascript
var ancienneVariable = "évite ça";   // ❌ legacy, à ne pas reproduire
```

### La règle de décision

> **Utilise `const` par défaut. Passe à `let` uniquement si tu dois réassigner.**

En pratique, environ 80 % de tes variables seront des `const`.

---

## 2.2 Les types de données

JS est un langage à **typage dynamique** : tu n'as pas besoin de déclarer le type d'une variable, JS le détermine automatiquement selon la valeur assignée.

### `number` — les nombres

```javascript
const age = 17;          // entier
const pi = 3.14159;      // décimal (appelé "flottant")
const temperature = -5;  // négatif
```

JS ne distingue pas entiers et décimaux — tout est `number`. Deux valeurs spéciales à connaître :

```javascript
console.log(10 / 0);     // Infinity  — division par zéro
console.log("abc" * 2);  // NaN       — "Not a Number", opération invalide
```

### `string` — les chaînes de caractères

```javascript
const pseudo = "Shadow_X";
const message = 'Connexion établie.';
const statut = `Niveau ${17 + 1}`;   // template literal — chapitre 4
```

Trois syntaxes : guillemets doubles `"`, simples `'`, ou backticks `` ` ``. Les backticks permettent d'insérer des expressions directement dans le texte.

### `boolean` — vrai ou faux

```javascript
const estConnecte = true;
const aPerdu = false;
```

Seulement deux valeurs possibles. Indispensable pour les conditions (chapitre 5).

### `undefined` et `null`

```javascript
let position;               // déclarée, pas encore assignée → undefined
const resultat = null;      // absence intentionnelle de valeur → null
```

- `undefined` : la variable existe mais n'a pas encore de valeur.
- `null` : on a *volontairement* mis "rien". Subtile différence, importante en pratique.

---

## 2.3 `typeof` — inspecter le type

`typeof` te dit le type d'une valeur. Indispensable pour déboguer.

```javascript
console.log(typeof 42);           // "number"
console.log(typeof "Shadow_X");   // "string"
console.log(typeof true);         // "boolean"
console.log(typeof undefined);    // "undefined"
console.log(typeof null);         // "object"  ← bug historique de JS, mémorise-le
```

Ce dernier cas est un bug connu depuis 1995 qu'on ne peut pas corriger sans casser Internet. Tu le rencontreras forcément un jour.

---

## 2.4 Opérateurs arithmétiques

| Opérateur | Opération | Exemple | Résultat |
|---|---|---|---|
| `+` | Addition | `10 + 3` | `13` |
| `-` | Soustraction | `10 - 3` | `7` |
| `*` | Multiplication | `10 * 3` | `30` |
| `/` | Division | `10 / 3` | `3.333...` |
| `%` | Modulo (reste) | `10 % 3` | `1` |
| `**` | Exponentiation | `2 ** 8` | `256` |

Le **modulo** `%` mérite une attention particulière — il renvoie le reste de la division entière. Très utile pour savoir si un nombre est pair, pour faire défiler une liste circulairement, etc.

```javascript
console.log(10 % 2);   // 0  → 10 est pair
console.log(11 % 2);   // 1  → 11 est impair
console.log(7 % 3);    // 1  → reste de 7 ÷ 3
```

L'**exponentiation** `**` est plus lisible que `Math.pow()` :

```javascript
console.log(2 ** 10);   // 1024 — utile en cryptographie, algos, etc.
```

---

## 2.5 Opérateurs d'affectation

L'opérateur `=` assigne une valeur. Les opérateurs combinés raccourcissent les réassignations courantes :

```javascript
let score = 100;

score += 50;    // score = score + 50  →  150
score -= 20;    // score = score - 20  →  130
score *= 2;     // score = score * 2   →  260
score /= 4;     // score = score / 4   →   65
score %= 10;    // score = score % 10  →    5
score **= 2;    // score = score ** 2  →   25
```

---

## 2.6 Incrémentation et décrémentation

Augmenter ou diminuer d'exactement 1 est si courant qu'il existe deux opérateurs dédiés :

```javascript
let compteur = 0;

compteur++;              // compteur = compteur + 1
console.log(compteur);  // 1

compteur--;              // compteur = compteur - 1
console.log(compteur);  // 0
```

Il existe une subtilité entre la forme *post* et *pré* :

```javascript
let i = 5;

// Post-incrémentation : utilise la valeur PUIS incrémente
console.log(i++);   // affiche 5, i devient 6 ensuite

// Pré-incrémentation : incrémente PUIS utilise la valeur
console.log(++i);   // i devient 7, affiche 7
```

En pratique dans les boucles `for`, la distinction ne change rien. La convention standard est `i++`.

---

## 2.7 ⚠️ Le piège : la coercion de type

JS est **permissif** : quand les types ne correspondent pas dans une opération, il essaie de les convertir automatiquement au lieu de lever une erreur. C'est la **coercion de type**, et c'est la source n°1 de bugs mystérieux chez les débutants.

```javascript
console.log("5" + 3);    // "53"  ← JS a concaténé deux strings !
console.log("5" - 3);    // 2     ← là il convertit "5" en nombre
console.log("5" * "3");  // 15    ← ça marche aussi
console.log("abc" * 2);  // NaN   ← impossible à convertir
```

Pourquoi `"5" + 3` donne `"53"` et pas `8` ? Parce que `+` sert aussi à concaténer des strings. JS voit une string et décide que `+` = concaténation. Pour `-`, `*`, `/`, pas d'ambiguïté — JS convertit les strings en nombres.

**La solution : convertir explicitement avant d'opérer.**

```javascript
const saisie = "42";              // string typique d'une entrée utilisateur

const nombre = Number(saisie);    // conversion explicite → 42 (number)
console.log(nombre + 8);          // 50 ✅

// Autres conversions utiles :
console.log(parseInt("42.7"));    // 42    — entier uniquement, coupe les décimales
console.log(parseFloat("42.7"));  // 42.7  — décimal conservé
console.log(String(100));         // "100" — nombre vers string
```

> **Règle pratique :** quand tu récupères une valeur venant d'un utilisateur (via `prompt()` au chapitre 3), elle est **toujours une string**. Convertis-la avec `Number()` avant tout calcul.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `const` | Valeur fixe — **à utiliser par défaut** |
| `let` | Valeur modifiable — uniquement si réassignation nécessaire |
| `var` | Legacy — à éviter |
| Types | `number`, `string`, `boolean`, `undefined`, `null` |
| `typeof` | Inspecte le type d'une valeur |
| `%` | Modulo — reste de la division entière |
| `**` | Exponentiation |
| `++` / `--` | Incrémentation / décrémentation de 1 |
| Coercion | JS convertit automatiquement — utilise toujours `Number()` pour les entrées utilisateur |

---

## 🔗 Pour aller plus loin

- [MDN — let](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/let)
- [MDN — const](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/const)
- [MDN — Types et structures de données](https://developer.mozilla.org/fr/docs/Web/JavaScript/Data_structures)
- [MDN — typeof](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/typeof)

---

*→ Chapitre suivant : Entrées / Sorties interactives*
