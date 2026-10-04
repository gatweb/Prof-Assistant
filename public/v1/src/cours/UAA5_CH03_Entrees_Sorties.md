# Chapitre 3 — Entrées et Sorties interactives

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer le modèle Entrée → Traitement → Sortie
- Utiliser `prompt()` pour récupérer une saisie utilisateur
- Afficher des résultats dans la page HTML (et pas seulement dans la console)
- Valider une entrée : détecter une annulation ou une valeur non numérique
- Convertir systématiquement les entrées en nombre avant tout calcul

---

## 3.1 Le modèle Entrée → Traitement → Sortie

Tout programme interactif suit ce schéma fondamental :

```
Entrée  →  Traitement  →  Sortie
  ↑                          ↓
(données fournies       (résultat présenté
 par l'utilisateur)      à l'utilisateur)
```

Exemples concrets :

| Entrée | Traitement | Sortie |
|---|---|---|
| Température en °C | × 9/5 + 32 | Température en °F |
| Nom de l'utilisateur | Concaténation | "Bonjour, Alex !" |
| Deux nombres | Addition | Leur somme |

Sans entrée → programme qui fait toujours la même chose. Sans sortie → programme muet. Les deux sont indispensables.

---

## 3.2 Les sorties : plusieurs façons d'afficher

Tu en connais déjà une. Voici le tableau complet :

### `console.log()` — la console (tu connais)

```javascript
console.log("Score :", 9000);
```

Usage : **débogage**. Affiche dans la console de ProfAssistant. L'utilisateur final ne voit jamais la console — c'est ton espace de travail privé.

### `alert()` — le dialogue modal

```javascript
alert("Connexion réussie !");
```

Affiche une popup que l'utilisateur doit fermer avant de continuer. À utiliser avec parcimonie — c'est intrusif. Utile pour les messages critiques.

### Affichage dans la page HTML — la vraie sortie

C'est la sortie d'un vrai programme web. Tu modifies le contenu de la page directement via JS.

```javascript
// Méthode de base : cibler un élément HTML et modifier son contenu
document.getElementById("output").textContent = "Résultat : 42";

// Ou ajouter dynamiquement des éléments :
const p = document.createElement("p");
p.textContent = "Nouvelle ligne ajoutée dynamiquement";
document.getElementById("output").appendChild(p);
```

On verra en détail comment JS manipule le HTML dans les cours dédiés au DOM. Pour l'instant, la fonction `afficher()` disponible dans ProfAssistant te donne cette puissance sans t'obliger à maîtriser le DOM tout de suite.

### La fonction `afficher()` dans ProfAssistant

Dans les exercices CH3+, ton code de départ inclut cette fonction :

```javascript
afficher("Température", "23°C");
// → Affiche une card dans la page : "Température : 23°C"

afficher("Bonjour Alex !");
// → Affiche un message simple sans label
```

Elle crée automatiquement des éléments visuels dans la page. `console.log` reste disponible pour le débogage.

> **Règle pratique :**
> - `console.log()` → pour toi, pendant le développement
> - `afficher()` → pour l'utilisateur, dans le résultat final

---

## 3.3 Récupérer une entrée : `prompt()`

`prompt()` ouvre un dialogue et attend que l'utilisateur tape quelque chose.

```javascript
const prenom = prompt("Quel est ton prénom ?");
console.log(prenom);   // affiche ce que l'utilisateur a tapé
```

### Ce que `prompt()` renvoie

```javascript
// Si l'utilisateur tape "Alex" et clique OK :
const saisie = prompt("Ton prénom ?");
console.log(saisie);          // "Alex"
console.log(typeof saisie);   // "string"  ← TOUJOURS une string

// Si l'utilisateur clique Annuler :
console.log(saisie);          // null
console.log(typeof saisie);   // "object"  ← le fameux bug typeof null
```

**Point critique : `prompt()` renvoie TOUJOURS une string** (ou `null` si annulé). Même si l'utilisateur tape `42`, tu récupères la string `"42"`, pas le nombre `42`. Si tu fais un calcul sans convertir, tu retombes dans le piège de la coercion vu au chapitre 2.

```javascript
const age = prompt("Ton âge ?");
console.log(age + 1);           // ❌ "171"  si l'utilisateur a tapé "17"
console.log(Number(age) + 1);   // ✅ 18
```

**Règle absolue : convertis avec `Number()` avant tout calcul numérique.**

---

## 3.4 Valider les entrées

Un programme robuste ne fait pas confiance à l'utilisateur. Il vérifie ce qu'il reçoit.

### Cas 1 : l'utilisateur a annulé

```javascript
const saisie = prompt("Ton prénom ?");

if (saisie === null) {
    afficher("Saisie annulée.");
} else {
    afficher("Bonjour", saisie);
}
```

### Cas 2 : l'utilisateur a tapé quelque chose qui n'est pas un nombre

```javascript
const saisie = prompt("Entrez un nombre :");
const nombre = Number(saisie);

if (isNaN(nombre)) {
    afficher("Erreur : ce n'est pas un nombre valide.");
} else {
    afficher("Votre nombre au carré :", nombre ** 2);
}
```

`isNaN()` — *is Not a Number* — renvoie `true` si la valeur ne peut pas être interprétée comme un nombre.

```javascript
isNaN(42);        // false — c'est bien un nombre
isNaN("42");      // false — convertible en nombre
isNaN("abc");     // true  — pas convertible
isNaN(null);      // false — null devient 0, attention !
isNaN(undefined); // true
```

### Cas 3 : chaîne vide (l'utilisateur a juste cliqué OK sans rien taper)

```javascript
const saisie = prompt("Ton prénom ?");

if (saisie === null || saisie.trim() === "") {
    afficher("Saisie invalide.");
} else {
    afficher("Bonjour", saisie.trim());
}
```

`saisie.trim()` supprime les espaces en début et fin de chaîne. On verra `trim()` et les méthodes de string en détail au chapitre 4.

### La validation complète (pattern à retenir)

```javascript
const saisie = prompt("Entrez votre âge :");

if (saisie === null) {
    afficher("Annulé.");
} else {
    const age = Number(saisie);
    if (isNaN(age) || age <= 0) {
        afficher("Âge invalide.");
    } else {
        afficher("Âge enregistré :", age);
    }
}
```

Ce pattern — vérifier `null`, convertir, vérifier `isNaN` — reviendra dans chaque programme qui demande un nombre à l'utilisateur.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `prompt("question")` | Ouvre un dialogue, renvoie une **string** ou **null** |
| `alert("message")` | Affiche une popup — à utiliser rarement |
| `afficher(label, valeur)` | Affiche dans la page HTML (helper ProfAssistant) |
| `console.log()` | Pour le débogage uniquement |
| Retour de `prompt()` | **Toujours une string** — convertir avec `Number()` avant calcul |
| `isNaN(valeur)` | `true` si la valeur n'est pas un nombre valide |
| `null` | Ce que renvoie `prompt()` quand l'utilisateur annule |
| `.trim()` | Supprime les espaces en début/fin de chaîne |

---

## 🔗 Pour aller plus loin

- [MDN — prompt()](https://developer.mozilla.org/fr/docs/Web/API/Window/prompt)
- [MDN — isNaN()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/isNaN)
- [MDN — Number()](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Number/Number)

---

*→ Chapitre suivant : Chaînes de caractères*
