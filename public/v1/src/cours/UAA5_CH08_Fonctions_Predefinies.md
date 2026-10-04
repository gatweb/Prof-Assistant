# Chapitre 8 — Fonctions prédéfinies

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer ce qu'est une bibliothèque de fonctions et comment l'utiliser
- Maîtriser les fonctions essentielles de l'objet `Math`
- Générer un nombre entier aléatoire dans une plage donnée
- Utiliser l'objet `Date` pour obtenir et formater la date et l'heure courantes
- Maintenir un état entre plusieurs clics dans une interface DOM

---

## 8.1 Le concept de bibliothèque

Une **bibliothèque** est un ensemble de fonctions et de valeurs prêtes à l'emploi, regroupées par thème. En JS, plusieurs bibliothèques sont intégrées directement dans le langage — pas besoin de les installer.

La syntaxe d'appel est toujours la même :

```javascript
Bibliotheque.fonction(arguments)   // appel d'une fonction
Bibliotheque.PROPRIETE             // accès à une constante
```

```javascript
Math.round(3.7)   // → 4      (fonction de la bibliothèque Math)
Math.PI           // → 3.14…  (constante de la bibliothèque Math)
```

Tu as déjà utilisé des bibliothèques sans le savoir :
- Les méthodes de string (`.toUpperCase()`, `.slice()`…) appartiennent à la bibliothèque `String`
- `Number()`, `isNaN()`, `parseInt()` appartiennent à la bibliothèque `Number`
- `console.log()` appartient à l'objet `console`

---

## 8.2 L'objet `Math`

`Math` est la bibliothèque mathématique de JS. Toutes ses fonctions sont accessibles via `Math.nomDeLaFonction()`.

### Constantes

```javascript
Math.PI    // 3.141592653589793 — π
Math.E     // 2.718281828459045 — nombre d'Euler
```

### Arrondir

```javascript
Math.round(4.5)   // 5  — arrondi standard (≥ .5 → supérieur)
Math.round(4.4)   // 4

Math.floor(4.9)   // 4  — toujours vers le bas (plancher)
Math.floor(-4.1)  // -5 — attention aux négatifs !

Math.ceil(4.1)    // 5  — toujours vers le haut (plafond)
Math.ceil(-4.9)   // -4

Math.trunc(4.9)   // 4  — supprime les décimales, sans arrondir
Math.trunc(-4.9)  // -4 — (différent de floor pour les négatifs)
```

### Valeur absolue

```javascript
Math.abs(-42)   // 42
Math.abs(42)    // 42
Math.abs(-3.7)  // 3.7
```

### Minimum et maximum

```javascript
Math.min(3, 1, 4, 1, 5, 9)   // 1 — le plus petit parmi tous les args
Math.max(3, 1, 4, 1, 5, 9)   // 9 — le plus grand
```

### Puissance et racine

```javascript
Math.pow(2, 10)   // 1024 — 2 à la puissance 10 (équivalent à 2 ** 10)
Math.sqrt(144)    // 12   — racine carrée de 144
Math.sqrt(2)      // 1.4142135623730951
```

---

## 8.3 `Math.random()` — le nombre aléatoire

`Math.random()` renvoie un nombre décimal **entre 0 (inclus) et 1 (exclus)** :

```javascript
Math.random()   // ex: 0.7341829... — différent à chaque appel
Math.random()   // ex: 0.1203847...
Math.random()   // ex: 0.9998123...
```

Seul, c'est rarement utile. La vraie puissance vient combiné avec `Math.floor()`.

### Le pattern — entier aléatoire entre min et max (inclus)

```javascript
// Formule universelle :
Math.floor(Math.random() * (max - min + 1)) + min

// Exemples concrets :
Math.floor(Math.random() * 6) + 1     // dé à 6 faces → 1 à 6
Math.floor(Math.random() * 100) + 1   // → 1 à 100
Math.floor(Math.random() * 10)        // → 0 à 9
Math.floor(Math.random() * 52)        // → 0 à 51 (jeu de cartes)
```

**Pourquoi ça marche ?** `Math.random()` donne un décimal dans `[0, 1[`. En multipliant par `(max - min + 1)`, on l'étire à `[0, max-min+1[`. `Math.floor()` l'arrondit vers le bas → résultat dans `[0, max-min]`. En ajoutant `min`, on décale vers `[min, max]`. ✓

```javascript
// En pratique, mets-le dans une constante ou une fonction :
const secret = Math.floor(Math.random() * 100) + 1;   // 1 à 100
console.log(secret);   // un entier différent à chaque exécution
```

---

## 8.4 L'objet `Date`

`Date` permet d'obtenir et de manipuler la date et l'heure. Contrairement à `Math`, il s'instancie avec `new` :

```javascript
const maintenant = new Date();   // capture le moment exact de cette ligne
```

### Extraire les composantes

```javascript
const maintenant = new Date();

maintenant.getFullYear()   // 2025 — l'année complète
maintenant.getMonth()      // 0 à 11 — ⚠️ janvier = 0, décembre = 11
maintenant.getDate()       // 1 à 31 — le jour du mois
maintenant.getDay()        // 0 à 6  — ⚠️ dimanche = 0, samedi = 6
maintenant.getHours()      // 0 à 23
maintenant.getMinutes()    // 0 à 59
maintenant.getSeconds()    // 0 à 59
```

> **Les deux pièges classiques :**
> - `getMonth()` commence à **0** — janvier est le mois 0, pas 1. Pour obtenir le numéro habituel : `getMonth() + 1`.
> - `getDay()` commence à **0** pour **dimanche**, pas lundi. Utilise un tableau de noms pour convertir.

### Convertir `getDay()` en nom lisible

```javascript
const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi",
               "Jeudi", "Vendredi", "Samedi"];
const MOIS  = ["janvier", "février", "mars", "avril", "mai", "juin",
               "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const maintenant   = new Date();
const nomJour      = JOURS[maintenant.getDay()];     // ex: "Lundi"
const nomMois      = MOIS[maintenant.getMonth()];    // ex: "octobre"
const dateComplete = `${nomJour} ${maintenant.getDate()} ${nomMois} ${maintenant.getFullYear()}`;
// ex: "Lundi 14 octobre 2025"
```

### Formater l'heure avec le zéro de tête

```javascript
const h = maintenant.getHours();
const m = maintenant.getMinutes();
const s = maintenant.getSeconds();

// padStart(2, "0") ajoute un zéro si le nombre n'a qu'un chiffre
const heure = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// ex: "09:05:03" au lieu de "9:5:3"
```

---

## 8.5 État persistant entre les clics

Dans les exercices précédents, chaque clic repartait de zéro. Parfois, on veut **mémoriser quelque chose entre deux clics** — le score d'un jeu, le nombre de tentatives, un nombre secret généré une seule fois.

La solution : déclarer ces variables **en dehors** du `addEventListener`.

```javascript
// Déclarées en dehors → persistent entre les clics
let secret     = Math.floor(Math.random() * 100) + 1;
let tentatives = 0;
let termine    = false;

document.getElementById("btn").addEventListener("click", function() {
    if (termine) return;   // le jeu est fini, on ignore les clics

    tentatives++;
    const essai = Number(document.getElementById("input").value);

    if (essai === secret) {
        termine = true;
        // afficher victoire + nombre de tentatives
    } else if (essai < secret) {
        // afficher "trop petit"
    } else {
        // afficher "trop grand"
    }
});
```

> **Pourquoi ça fonctionne ?** Les variables `secret`, `tentatives`, `termine` sont dans la portée du script, pas dans la fonction. La fonction les lit et les modifie à chaque clic, mais elles survivent entre les clics.

---

## 📦 Récapitulatif

| Fonction | Résultat |
|---|---|
| `Math.round(n)` | Arrondi standard |
| `Math.floor(n)` | Arrondi vers le bas |
| `Math.ceil(n)` | Arrondi vers le haut |
| `Math.abs(n)` | Valeur absolue |
| `Math.min(a, b, …)` | Plus petit argument |
| `Math.max(a, b, …)` | Plus grand argument |
| `Math.sqrt(n)` | Racine carrée |
| `Math.pow(base, exp)` | Puissance |
| `Math.random()` | Décimal aléatoire `[0, 1[` |
| `Math.floor(Math.random() * (max-min+1)) + min` | Entier aléatoire `[min, max]` |
| `new Date()` | Capture l'instant présent |
| `.getFullYear()` | Année |
| `.getMonth()` | Mois — **0 = janvier** |
| `.getDate()` | Jour du mois |
| `.getDay()` | Jour semaine — **0 = dimanche** |
| `.getHours()` / `.getMinutes()` / `.getSeconds()` | Heure / Minute / Seconde |
| `String(n).padStart(2, "0")` | Ajoute un zéro devant si nécessaire |

---

## 🔗 Pour aller plus loin

- [MDN — Math](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Math)
- [MDN — Date](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Date)

---

*→ Chapitre suivant : Algorithmes — lire, écrire, traduire*
