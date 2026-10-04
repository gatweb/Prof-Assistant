# Chapitre 6 — Boucles

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Utiliser `while`, `do...while` et `for` dans le bon contexte
- Contrôler le flux d'une boucle avec `break` et `continue`
- Parcourir une chaîne de caractères caractère par caractère
- Générer du contenu HTML dynamiquement depuis une boucle
- Réagir à un clic de bouton et lire la valeur d'un champ de saisie

---

## 6.1 Pourquoi les boucles ?

Sans boucle, répéter une action dix fois implique de l'écrire dix fois :

```javascript
console.log("Ligne 1");
console.log("Ligne 2");
// ... jusqu'à Ligne 10 — absurde
```

Avec une boucle, tu l'écris une fois et tu dis combien de fois la répéter :

```javascript
for (let i = 1; i <= 10; i++) {
    console.log("Ligne " + i);
}
```

Les boucles sont indispensables dès qu'une action doit se répéter : parcourir une liste, générer un tableau, vérifier chaque caractère d'un texte, compter jusqu'à un seuil...

---

## 6.2 `while` — tant que la condition est vraie

La boucle `while` répète son bloc tant qu'une condition reste vraie. Elle s'utilise quand **on ne sait pas à l'avance** combien d'itérations seront nécessaires.

```javascript
let energie = 100;

while (energie > 0) {
    console.log("Énergie restante :", energie);
    energie -= 25;
}
console.log("À court d'énergie !");
// Affiche 100, 75, 50, 25, puis "À court d'énergie !"
```

### ⚠️ La boucle infinie

Si la condition ne devient jamais fausse, la boucle tourne indéfiniment — le programme se bloque.

```javascript
// ❌ Boucle infinie — la condition reste toujours vraie
let i = 0;
while (i < 10) {
    console.log(i);
    // Oubli de i++ → i reste à 0 pour toujours
}
```

**Règle :** assure-toi toujours que la variable testée dans la condition évolue à chaque itération.

```javascript
// ✅ Correct
let i = 0;
while (i < 10) {
    console.log(i);
    i++;   // ← indispensable
}
```

---

## 6.3 `do...while` — au moins une exécution garantie

`do...while` exécute le bloc **d'abord**, puis vérifie la condition. Le bloc s'exécute donc **toujours au moins une fois**, même si la condition est fausse dès le départ.

```javascript
let tentatives = 0;

do {
    tentatives++;
    console.log("Tentative n°", tentatives);
} while (tentatives < 3);

// Affiche Tentative n° 1, 2, 3
```

La différence avec `while` :

```javascript
let x = 10;

while (x < 5) {
    console.log("while :", x);   // jamais exécuté — condition fausse dès le départ
}

do {
    console.log("do-while :", x);   // exécuté une fois malgré la condition fausse
} while (x < 5);
```

---

## 6.4 `for` — le compteur classique

La boucle `for` est conçue pour un nombre **connu** d'itérations. Elle regroupe initialisation, condition et incrément en une seule ligne.

```javascript
for (let i = 0; i < 5; i++) {
    console.log("Tour n°", i);
}
// Tour n° 0, 1, 2, 3, 4
```

Les trois parties entre parenthèses :

```
for ( initialisation ; condition ; incrément )
      let i = 0       i < 5       i++
         ↑               ↑           ↑
    exécutée          vérifiée    exécutée
    une seule fois    avant        après
    au départ        chaque tour  chaque tour
```

### Variations courantes

```javascript
// Compter à rebours
for (let i = 10; i >= 0; i--) {
    console.log(i);
}

// Compter de 2 en 2
for (let i = 0; i <= 20; i += 2) {
    console.log(i);   // 0, 2, 4, ... 20
}

// Commencer à 1 (fréquent pour les tables)
for (let i = 1; i <= 10; i++) {
    console.log(`7 × ${i} = ${7 * i}`);
}
```

---

## 6.5 Parcourir une string avec `for`

On peut accéder à chaque caractère d'une string en combinant `for` avec l'accès par indice vu au chapitre 4.

```javascript
const pseudo = "Shadow";

for (let i = 0; i < pseudo.length; i++) {
    console.log(`[${i}] → ${pseudo[i]}`);
}
// [0] → S
// [1] → h
// [2] → a
// ...
```

Application concrète — compter les voyelles :

```javascript
const texte = "JavaScript";
const voyelles = "aeiouAEIOU";
let compteur = 0;

for (let i = 0; i < texte.length; i++) {
    if (voyelles.includes(texte[i])) {
        compteur++;
    }
}
console.log("Voyelles :", compteur);   // 3
```

---

## 6.6 `break` et `continue`

### `break` — sortir immédiatement de la boucle

```javascript
for (let i = 0; i < 100; i++) {
    if (i === 5) {
        break;   // sort de la boucle dès que i vaut 5
    }
    console.log(i);
}
// Affiche 0, 1, 2, 3, 4 — puis la boucle s'arrête
```

Utile pour arrêter une recherche dès qu'on a trouvé ce qu'on cherche.

### `continue` — passer à l'itération suivante

```javascript
for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
        continue;   // ignore les pairs, passe au suivant
    }
    console.log(i);
}
// Affiche 1, 3, 5, 7, 9 — uniquement les impairs
```

---

## 6.7 Générer du HTML avec une boucle

À partir de ce chapitre, les exercices utilisent le DOM directement — pas de `prompt()` ni de `console.log()` pour les résultats. Tu interagis avec la page HTML comme en développement web réel.

### Lire la valeur d'un champ de saisie

```javascript
// Récupère l'élément <input id="monInput">
const input = document.getElementById("monInput");

// Lit ce que l'utilisateur a tapé — c'est toujours une string !
const valeur = input.value;
const nombre = Number(input.value);   // conversion si nécessaire
```

### Réagir à un clic de bouton

```javascript
document.getElementById("monBouton").addEventListener("click", function() {
    // Ce code s'exécute à chaque clic sur le bouton
    console.log("Bouton cliqué !");
});
```

### Créer et insérer des éléments HTML

```javascript
const output = document.getElementById("output");
output.innerHTML = "";   // vide l'output avant de regénérer

// Créer un <p> et l'ajouter
const p = document.createElement("p");
p.textContent = "Ligne générée dynamiquement";
output.appendChild(p);
```

### Générer une liste avec une boucle — le pattern de base

```javascript
document.getElementById("btnGenerer").addEventListener("click", function() {
    const n = Number(document.getElementById("inputN").value);
    const output = document.getElementById("output");
    output.innerHTML = "";   // repart de zéro à chaque clic

    for (let i = 1; i <= n; i++) {
        const div = document.createElement("div");
        div.textContent = `Ligne ${i} sur ${n}`;
        output.appendChild(div);
    }
});
```

Ce pattern — input → bouton → vider output → boucle → appendChild — est la base de tous les exercices CH6+. Mémorise-le.

> **Rappel UAA3 :** tu as déjà utilisé HTML et CSS. JS te donne maintenant le pouvoir de modifier la page **après** son chargement. `document.getElementById()` cible un élément par son attribut `id`, exactement comme le sélecteur CSS `#id`.

---

## 📦 Récapitulatif

| Concept | Quand l'utiliser |
|---|---|
| `while` | Nombre d'itérations inconnu — répète tant que vrai |
| `do...while` | Comme `while` mais s'exécute au moins une fois |
| `for` | Nombre d'itérations connu — compteur classique |
| `break` | Sortir immédiatement de la boucle |
| `continue` | Sauter l'itération en cours, passer à la suivante |
| `for` + `[i]` | Parcourir une string caractère par caractère |
| `addEventListener` | Réagir à un événement (clic, saisie...) |
| `createElement` + `appendChild` | Créer et insérer un élément HTML |
| `output.innerHTML = ""` | Vider un conteneur avant de le regénérer |

---

## 🔗 Pour aller plus loin

- [MDN — while](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/while)
- [MDN — for](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/for)
- [MDN — addEventListener](https://developer.mozilla.org/fr/docs/Web/API/EventTarget/addEventListener)
- [MDN — createElement](https://developer.mozilla.org/fr/docs/Web/API/Document/createElement)

---

*→ Chapitre suivant : Structures combinées (boucles + conditions)*
