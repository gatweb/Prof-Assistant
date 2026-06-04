# Chapitre 4 — Chaînes de caractères

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Construire des strings avec la concaténation et les template literals
- Accéder à un caractère par son indice avec `[]` et `.charAt()`
- Utiliser les méthodes principales de manipulation de strings
- Rechercher, extraire, transformer et découper du texte
- Comprendre l'immuabilité des strings (et pourquoi ça compte)

---

## 4.1 Créer une string — les trois syntaxes

```javascript
const a = "guillemets doubles";    // syntaxe classique
const b = 'guillemets simples';    // équivalent, même résultat
const c = `backticks`;             // template literal — la plus puissante
```

Les guillemets simples et doubles sont interchangeables. Choisis l'un, reste cohérent. Les backticks, eux, ont des super-pouvoirs.

### Template literals — la syntaxe moderne

Les backticks permettent d'insérer des **expressions** directement dans une string avec `${ }` :

```javascript
const pseudo = "Shadow_X";
const niveau = 42;

// ❌ Concaténation à l'ancienne — illisible dès que ça grandit
const msg1 = "Joueur : " + pseudo + " | Niveau : " + niveau;

// ✅ Template literal — clair et direct
const msg2 = `Joueur : ${pseudo} | Niveau : ${niveau}`;

// On peut mettre n'importe quelle expression entre ${ }
const msg3 = `Dégâts : ${niveau * 2.5} points`;
console.log(msg3);   // "Dégâts : 105 points"
```

Les template literals supportent aussi le **multiline** sans `\n` :

```javascript
const fiche = `
=== FICHE JOUEUR ===
Pseudo  : ${pseudo}
Niveau  : ${niveau}
Statut  : Actif
`;
console.log(fiche);
```

---

## 4.2 Les indices — lire une string caractère par caractère

Une string, c'est une séquence de caractères ordonnés. Chaque caractère a un **indice** (sa position), et **ça commence à 0**.

```
  S   h   a   d   o   w   _   X
  0   1   2   3   4   5   6   7
```

Pour une string de longueur 8, les indices vont de **0** à **7** (longueur - 1).

### `.length` — la longueur

```javascript
const pseudo = "Shadow_X";
console.log(pseudo.length);   // 8
```

### Accès par indice — deux syntaxes équivalentes

```javascript
const pseudo = "Shadow_X";

// Syntaxe crochet — la plus courante
console.log(pseudo[0]);   // "S"
console.log(pseudo[3]);   // "d"

// .charAt(i) — explicite, lisible, recommandée dans les explications
console.log(pseudo.charAt(0));   // "S"
console.log(pseudo.charAt(3));   // "d"
```

Les deux fonctionnent. `charAt()` est plus explicite et fait partie des méthodes officielles du référentiel — retiens les deux.

### Le dernier caractère — pattern à retenir

```javascript
const pseudo = "Shadow_X";

// Le dernier caractère est toujours à l'indice (longueur - 1)
const dernier = pseudo[pseudo.length - 1];
console.log(dernier);   // "X"

// Avec .charAt()
console.log(pseudo.charAt(pseudo.length - 1));   // "X"

// En JS moderne, .at(-1) fait la même chose
console.log(pseudo.at(-1));   // "X"
```

### ⚠️ Les strings sont immuables

On ne peut pas modifier un caractère à un indice donné. Les strings en JS sont **immuables** — chaque méthode de transformation renvoie une **nouvelle string**, elle ne modifie pas l'originale.

```javascript
let mot = "bonjour";
mot[0] = "B";            // ne fait rien (pas d'erreur, mais pas d'effet)
console.log(mot);        // "bonjour" — inchangé

const maj = mot.toUpperCase();
console.log(maj);        // "BONJOUR" — nouvelle string
console.log(mot);        // "bonjour" — toujours inchangé
```

---

## 4.3 Transformer une string

### Casse : `.toUpperCase()` et `.toLowerCase()`

```javascript
const titre = "shadow_x";
console.log(titre.toUpperCase());   // "SHADOW_X"
console.log(titre.toLowerCase());   // "shadow_x"
```

Utilisation typique : comparaison insensible à la casse.

```javascript
const saisie = prompt("Confirmes-tu ? (oui/non)");
if (saisie.toLowerCase() === "oui") {
    afficher("Confirmé ✓");
}
// Fonctionne que l'élève tape "OUI", "Oui" ou "oui"
```

### Supprimer les espaces : `.trim()`

```javascript
const saisie = "   Shadow_X   ";
console.log(saisie.trim());        // "Shadow_X"
console.log(saisie.trimStart());   // "Shadow_X   "  — espaces fin conservés
console.log(saisie.trimEnd());     // "   Shadow_X"  — espaces début conservés
```

À faire **systématiquement** sur les saisies `prompt()` — les utilisateurs ajoutent souvent des espaces involontaires.

### Remplacer : `.replace()` et `.replaceAll()`

```javascript
const phrase = "Je code en Java. Java c'est bien.";

// .replace() — remplace uniquement la PREMIÈRE occurrence
console.log(phrase.replace("Java", "JavaScript"));
// "Je code en JavaScript. Java c'est bien."

// .replaceAll() — remplace TOUTES les occurrences
console.log(phrase.replaceAll("Java", "JavaScript"));
// "Je code en JavaScript. JavaScript c'est bien."
```

### Répéter : `.repeat(n)`

```javascript
console.log("=-".repeat(10));   // "=-=-=-=-=-=-=-=-=-=-=-=-"
console.log("⭐".repeat(5));    // "⭐⭐⭐⭐⭐"
```

---

## 4.4 Chercher dans une string

### `.includes(substring)` — est-ce que ça contient ?

```javascript
const pseudo = "Shadow_X_Pro";

console.log(pseudo.includes("Pro"));    // true
console.log(pseudo.includes("noob"));   // false
```

Renvoie `true` ou `false` — parfait pour les conditions.

### `.startsWith()` et `.endsWith()`

```javascript
const fichier = "rapport_final.pdf";

console.log(fichier.startsWith("rapport"));   // true
console.log(fichier.endsWith(".pdf"));         // true
console.log(fichier.endsWith(".docx"));        // false
```

### `.indexOf(substring)` — position de la première occurrence

```javascript
const phrase = "JavaScript est super, JavaScript c'est puissant.";

console.log(phrase.indexOf("JavaScript"));   // 0  — trouvé à l'indice 0
console.log(phrase.indexOf("Python"));       // -1 — pas trouvé → toujours -1
console.log(phrase.indexOf("est"));          // 11
```

`-1` signifie "non trouvé". Pattern classique :

```javascript
if (pseudo.indexOf("_") !== -1) {
    afficher("Le pseudo contient un underscore.");
}

// Version plus moderne et lisible avec .includes() :
if (pseudo.includes("_")) {
    afficher("Le pseudo contient un underscore.");
}
```

---

## 4.5 Extraire une partie : `.slice()`

`.slice(début, fin)` extrait une sous-string du caractère à l'indice `début` **jusqu'à** (mais sans inclure) l'indice `fin`.

```javascript
const pseudo = "Shadow_X";
//              01234567

console.log(pseudo.slice(0, 6));   // "Shadow"  — indices 0 à 5
console.log(pseudo.slice(7));      // "X"        — de 7 jusqu'à la fin
console.log(pseudo.slice(0, 3));   // "Sha"
```

### Indices négatifs — compter depuis la fin

```javascript
const pseudo = "Shadow_X";

console.log(pseudo.slice(-1));    // "X"       — le dernier
console.log(pseudo.slice(-3));    // "_X"      — les 3 derniers... non : "_X" c'est 2
// Correction : Shadow_X → longueur 8 → -3 = indice 5 → "_X"... 
// Vérifions : S(0)h(1)a(2)d(3)o(4)w(5)_(6)X(7) → -3 = indice 5 = "w_X"
console.log(pseudo.slice(-3));    // "w_X"
console.log(pseudo.slice(-2));    // "_X"      — les 2 derniers
console.log(pseudo.slice(0, -2)); // "Shadow"  — tout sauf les 2 derniers
```

> `.slice()` est à préférer à `.substring()` : il accepte les indices négatifs et a un comportement plus prévisible.

---

## 4.6 Découper une string : `.split()`

`.split(séparateur)` découpe une string en tableau de morceaux. C'est l'inverse de `.join()` qu'on verra avec les tableaux.

```javascript
const tags = "js,html,css,python";
const tableau = tags.split(",");
console.log(tableau);
// ["js", "html", "css", "python"]

console.log(tableau[0]);   // "js"
console.log(tableau.length);   // 4
```

Découper mot par mot :

```javascript
const phrase = "Shadow X est un hacker légendaire";
const mots = phrase.split(" ");
console.log(mots);
// ["Shadow", "X", "est", "un", "hacker", "légendaire"]
console.log(`Nombre de mots : ${mots.length}`);   // 6
```

---

## 📦 Récapitulatif — méthodes à connaître

| Méthode | Ce qu'elle fait | Exemple |
|---|---|---|
| `.length` | Longueur de la string | `"abc".length` → `3` |
| `[i]` / `.charAt(i)` | Caractère à l'indice i | `"abc"[1]` → `"b"` |
| `.toUpperCase()` | Tout en majuscules | `"abc".toUpperCase()` → `"ABC"` |
| `.toLowerCase()` | Tout en minuscules | `"ABC".toLowerCase()` → `"abc"` |
| `.trim()` | Supprime espaces début/fin | `"  hi  ".trim()` → `"hi"` |
| `.replace(x, y)` | Remplace la 1ère occurrence | - |
| `.replaceAll(x, y)` | Remplace toutes les occurrences | - |
| `.includes(sub)` | Contient la sous-string ? | `"hello".includes("ell")` → `true` |
| `.startsWith(sub)` | Commence par ? | `"hello".startsWith("he")` → `true` |
| `.endsWith(sub)` | Finit par ? | `"hello".endsWith("lo")` → `true` |
| `.indexOf(sub)` | Position (ou -1 si absent) | `"hello".indexOf("l")` → `2` |
| `.slice(d, f)` | Extrait de d à f (exclu) | `"hello".slice(1, 3)` → `"el"` |
| `.split(sep)` | Découpe en tableau | `"a,b".split(",")` → `["a","b"]` |
| `.repeat(n)` | Répète n fois | `"ab".repeat(3)` → `"ababab"` |

> **Rappel immuabilité :** toutes ces méthodes renvoient une **nouvelle string**. Elles ne modifient jamais l'originale. Assigne toujours le résultat à une variable.

---

## 🔗 Pour aller plus loin

- [MDN — String (référence complète)](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN — Template literals](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Template_literals)

---

*→ Chapitre suivant : Conditions (if / else / switch)*
