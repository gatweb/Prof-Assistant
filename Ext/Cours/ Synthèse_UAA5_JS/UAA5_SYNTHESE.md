---
uaa: UAA5
titre: "Synthèse — Référence JavaScript"
type: synthese
---

# Synthèse UAA5 — Référence JavaScript

> Programmation impérative · 10 chapitres · Toutes les compétences UAA5

---

## Variables & Types `CH2`

```javascript
const nom = "Alex";   // valeur fixe — utiliser par défaut
let score = 0;        // valeur modifiable — si réassignation
// var → legacy, à éviter
```

| Type | Exemple | `typeof` |
|---|---|---|
| `number` | `42`, `3.14`, `-5` | `"number"` |
| `string` | `"Bonjour"`, `'JS'` | `"string"` |
| `boolean` | `true`, `false` | `"boolean"` |
| `undefined` | `let x;` (non assigné) | `"undefined"` |
| `null` | `const v = null;` | `"object"` ← bug ! |

> ✅ **Règle** : `const` par défaut. `let` uniquement si réassignation nécessaire.  
> ⚠️ `typeof null` renvoie `"object"` — bug historique. Tester avec `=== null`.

---

## Opérateurs `CH2`

### Arithmétiques

| Op. | Opération | Exemple | Résultat |
|---|---|---|---|
| `+` | Addition | `10 + 3` | `13` |
| `-` | Soustraction | `10 - 3` | `7` |
| `*` | Multiplication | `10 * 3` | `30` |
| `/` | Division | `10 / 3` | `3.33…` |
| `%` | Modulo (reste) | `10 % 3` | `1` |
| `**` | Exponentiation | `2 ** 8` | `256` |

### Comparaison

| Op. | Signification | Exemple | Résultat |
|---|---|---|---|
| `===` | Strictement égal | `5 === "5"` | `false` |
| `!==` | Strictement différent | `5 !== "5"` | `true` |
| `<` / `>` | Inférieur / supérieur | `3 < 5` | `true` |
| `<=` / `>=` | Inf. ou sup. ou égal | `5 <= 5` | `true` |

### Logiques

| Op. | Signification | Exemple | Résultat |
|---|---|---|---|
| `&&` | ET — les deux vrais | `true && false` | `false` |
| `\|\|` | OU — au moins un vrai | `false \|\| true` | `true` |
| `!` | NON — inverse | `!true` | `false` |

```javascript
score += 10;   // score = score + 10
score -= 5;    // score = score - 5
score *= 2;    // score = score * 2
score++;       // score = score + 1
score--;       // score = score - 1
```

> ✅ **Règle** : toujours `===` et `!==`. Jamais `==` et `!=` (coercion de type).  
> ⚠️ Coercion : `"5" + 3 → "53"` (concaténation !). `"5" - 3 → 2` (OK).

---

## Chaînes de caractères `CH4`

```javascript
const a = "guillemets doubles";
const b = 'guillemets simples';
const c = `template literal — ${a}`;       // expression dans ${ }
const d = `Niveau ${score * 2}`;           // n'importe quelle expression
```

| Méthode | Description | Exemple → Résultat |
|---|---|---|
| `.length` | Longueur | `"Bonjour".length → 7` |
| `[i]` / `.charAt(i)` | Caractère à l'indice i | `"abc"[0] → "a"` |
| `.toUpperCase()` | Tout en majuscules | `"js".toUpperCase() → "JS"` |
| `.toLowerCase()` | Tout en minuscules | `"JS".toLowerCase() → "js"` |
| `.trim()` | Supprime espaces bords | `"  hi  ".trim() → "hi"` |
| `.includes(sub)` | Contient la sous-chaîne ? | `"hello".includes("ell") → true` |
| `.startsWith(sub)` | Commence par ? | `"hello".startsWith("he") → true` |
| `.endsWith(sub)` | Finit par ? | `"hello".endsWith("lo") → true` |
| `.indexOf(sub)` | Position (ou `-1`) | `"hello".indexOf("l") → 2` |
| `.slice(d, f)` | Extrait de d à f exclu | `"hello".slice(1,3) → "el"` |
| `.replace(x, y)` | Remplace 1ère occurrence | `"aa".replace("a","b") → "ba"` |
| `.replaceAll(x, y)` | Remplace toutes | `"aa".replaceAll("a","b") → "bb"` |
| `.split(sep)` | Découpe en tableau | `"a,b".split(",") → ["a","b"]` |
| `.repeat(n)` | Répète n fois | `"ab".repeat(3) → "ababab"` |

> ⚠️ Strings **immuables** — les méthodes renvoient une NOUVELLE string. Toujours assigner : `const upper = str.toUpperCase();`

---

## Entrées / Sorties & DOM `CH3+`

```javascript
// Entrée utilisateur
const saisie = prompt("Ton prénom ?");
// → string ou null si annulé — TOUJOURS convertir avant calcul
const n = Number(saisie);

// Lire un champ HTML
const val = document.getElementById("monInput").value;  // toujours string !
const nb  = Number(document.getElementById("monInput").value);

// Modifier la page
element.textContent = "texte";         // texte brut (sûr)
element.innerHTML   = "<b>texte</b>";  // HTML
element.className   = "card card-ok";  // changer les classes CSS
element.disabled    = true;            // désactiver un bouton
output.innerHTML    = "";              // vider un conteneur

// Créer et insérer un élément
const div = document.createElement("div");
div.className   = "card";
div.textContent = "Mon contenu";
document.getElementById("output").appendChild(div);

// Réagir à un événement
document.getElementById("btn").addEventListener("click", function() {
    const val = document.getElementById("input").value;
    // traitement...
});

// État persistant entre les clics
let compteur = 0;   // en dehors du listener → survit entre les clics
document.getElementById("btn").addEventListener("click", function() {
    compteur++;
});
```

---

## Conditions `CH5`

```javascript
// if / else if / else
if (score >= 85) {
    // premier cas vrai → les suivants ignorés
} else if (score >= 70) {
    // testé seulement si le précédent est faux
} else {
    // aucun cas vrai → fallback
}

// switch — pour les valeurs discrètes
switch (choix) {
    case "1":
        // ...
        break;    // OBLIGATOIRE — sinon fall-through
    case "2":
        // ...
        break;
    default:
        // aucun case ne correspond
}

// Ternaire
const statut = hp > 0 ? "Vivant" : "KO";
//              condition  si vrai   si faux
```

**Valeurs falsy** — évaluées à `false` dans une condition : `false`, `0`, `""`, `null`, `undefined`, `NaN`

> ✅ **Règle** : toujours `===`. Ordre des `else if` : du plus restrictif au plus général.  
> ⚠️ `switch` utilise `===` : `prompt()` renvoie une string → `case "1":` avec guillemets, pas `case 1:`.

---

## Boucles `CH6-7`

```javascript
// while — nbr d'itérations inconnu
let energie = 100;
while (energie > 0) {
    energie -= 25;   // NE PAS oublier de faire évoluer la condition !
}

// for — nbr d'itérations connu
for (let i = 0; i < 10; i++) {
    // i vaut 0, 1, 2, ... 9
}

// Parcourir une string
for (let i = 0; i < str.length; i++) {
    const car = str[i];   // ou str.charAt(i)
}

// do...while — au moins une fois
do {
    // s'exécute toujours au moins une fois
} while (condition);

// break et continue
for (let i = 0; i < 100; i++) {
    if (i === 5) break;         // sort de la boucle
    if (i % 2 === 0) continue;  // saute les pairs
}
```

| Boucle | Utiliser quand |
|---|---|
| `for` | Nombre d'itérations connu à l'avance |
| `while` | Condition à tester, nbr d'itérations inconnu |
| `do...while` | Comme `while` mais doit s'exécuter au moins 1 fois |

---

## Fonctions prédéfinies — Math & Date `CH8`

| Méthode | Description | Exemple → Résultat |
|---|---|---|
| `Math.round(n)` | Arrondi standard | `Math.round(4.5) → 5` |
| `Math.floor(n)` | Arrondi vers le bas | `Math.floor(4.9) → 4` |
| `Math.ceil(n)` | Arrondi vers le haut | `Math.ceil(4.1) → 5` |
| `Math.abs(n)` | Valeur absolue | `Math.abs(-5) → 5` |
| `Math.min(a,b,…)` | Plus petit | `Math.min(3,1,4) → 1` |
| `Math.max(a,b,…)` | Plus grand | `Math.max(3,1,4) → 4` |
| `Math.sqrt(n)` | Racine carrée | `Math.sqrt(144) → 12` |
| `Math.pow(b,e)` | Puissance | `Math.pow(2,10) → 1024` |
| `Math.random()` | Décimal aléatoire `[0,1[` | `0.7341…` |
| `Math.PI` | Constante π | `3.14159…` |

```javascript
// Entier aléatoire entre min et max INCLUS — le pattern
Math.floor(Math.random() * (max - min + 1)) + min

// Exemples :
Math.floor(Math.random() * 6)  + 1   // dé 6 faces → 1 à 6
Math.floor(Math.random() * 100) + 1  // → 1 à 100
```

| Méthode Date | Retourne | Piège |
|---|---|---|
| `new Date()` | Instant présent | — |
| `.getFullYear()` | Année (2025) | — |
| `.getMonth()` | Mois 0–11 | **0 = janvier !** |
| `.getDate()` | Jour du mois 1–31 | — |
| `.getDay()` | Jour semaine 0–6 | **0 = dimanche !** |
| `.getHours()` | Heure 0–23 | — |
| `.getMinutes()` | Minutes 0–59 | — |

```javascript
// Formater avec zéros (9:5 → 09:05)
const h = String(new Date().getHours()).padStart(2, "0");
const m = String(new Date().getMinutes()).padStart(2, "0");
const heure = h + ":" + m;
```

---

## Patterns algorithmiques `CH7`

```javascript
// 1. FILTRAGE — traiter seulement certains éléments
for (let i = 0; i < n; i++) {
    if (condition) { /* traite l'élément */ }
}

// 2. ACCUMULATION CONDITIONNELLE
let somme = 0, count = 0;
for (let i = 0; i < n; i++) {
    if (condition) { somme += valeur; count++; }
}

// 3. MIN / MAX — initialiser à null, jamais à 0 !
let min = null, max = null;
for (let i = 0; i < n; i++) {
    if (min === null || valeur < min) min = valeur;
    if (max === null || valeur > max) max = valeur;
}

// 4. RECHERCHE AVEC ARRÊT ANTICIPÉ
let found = false, idx = -1;
for (let i = 0; i < n; i++) {
    if (condition) { found = true; idx = i; break; }
}
```

> ⚠️ Min/max : initialiser à `null`, jamais à `0`. Si toutes les valeurs sont positives et `min = 0`, il ne sera jamais mis à jour.

---

## Validation — Le pattern de référence `CH3,5`

```javascript
// Saisie texte
const saisie = prompt("Ton prénom ?");
if (saisie === null)          { afficherErreur("Annulé."); return; }
if (saisie.trim() === "")     { afficherErreur("Vide.");   return; }
const prenom = saisie.trim(); // ici valide

// Saisie numérique complète
const saisie = prompt("Entrez un nombre (0-100) :");
if (saisie === null)          { afficherErreur("Annulé.");      return; }
const n = Number(saisie);
if (isNaN(n))                 { afficherErreur("Pas un nombre."); return; }
if (n < 0 || n > 100)         { afficherErreur("Hors plage.");  return; }
// Ici n est un nombre valide entre 0 et 100

// Dans un handler DOM
document.getElementById("btn").addEventListener("click", function() {
    const n = Number(document.getElementById("input").value);
    if (isNaN(n) || n < 0 || n > 100) { afficherErreur("Invalide."); return; }
    // Ici valide — continue...
});
```

> ✅ **Ordre** : (1) vérifier `null` → (2) vérifier type/format → (3) vérifier plage. Chaque erreur → `return` immédiat.

---

## Les 10 pièges les plus fréquents `Tous chapitres`

| Piège | Ce qui se passe | Correction |
|---|---|---|
| `==` au lieu de `===` | `"5" == 5 → true` (coercion) | Toujours `===` |
| `prompt()` → string | calcul sans `Number()` | `Number(saisie)` avant tout calcul |
| `"5" + 3` | `"53"` — concaténation ! | Convertir d'abord ou utiliser `-` |
| `min = 0` pas `null` | si tout `> 0`, min reste `0` | Initialiser à `null` |
| `case 1:` (number) | `prompt` renvoie string, pas number | `case "1":` avec guillemets |
| `break` oublié en switch | fall-through : cas suivants s'exécutent | `break;` obligatoire |
| `typeof null` | renvoie `"object"` pas `"null"` | Vérifier avec `=== null` |
| `getMonth() = 0` | janvier = 0, décembre = 11 | Tableau de noms `MOIS[idx]` |
| `getDay() = 0` | dimanche = 0, lundi = 1 | Tableau de noms `JOURS[idx]` |
| `.toUpperCase()` non assigné | résultat perdu | `const upper = str.toUpperCase()` |

```javascript
// Coercion — résumé
"5" + 3       // "53"  ← + avec string = concaténation !
"5" - 3       //   2   ← - force la conversion
"abc" * 2     // NaN   ← impossible à convertir
true  + 1     //   2   ← true vaut 1
false + 5     //   5   ← false vaut 0
null  + 5     //   5   ← null vaut 0
undefined + 5 // NaN
```

---

## Tableau de bord UAA5 — Compétences couvertes

| Chapitre | Contenu | Dimension SEGEC |
|---|---|---|
| CH1 | Environnement, syntaxe, commentaires | Connaitre |
| CH2 | Variables, types, opérateurs | Connaitre / Appliquer |
| CH3 | Entrées / Sorties | Connaitre / Appliquer |
| CH4 | Chaînes de caractères | Connaitre / Appliquer |
| CH5 | Conditions (if/else, switch) | Appliquer |
| CH6 | Boucles (while, for) + DOM | Appliquer |
| CH7 | Structures combinées | Appliquer |
| CH8 | Fonctions prédéfinies (Math, Date) | Connaitre / Appliquer |
| CH9 | Algorithmes — lire, écrire, traduire | Appliquer / Transférer |
| CH10 | Projets (PFC, Moyenne pondérée) | Transférer |
