# Chapitre 1 — Bienvenue dans JavaScript

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer ce qu'est la programmation impérative et en quoi JS en est un exemple
- Utiliser ProfAssistant comme environnement de développement
- Écrire et exécuter ton premier programme JS
- Appliquer les règles de syntaxe fondamentales
- Rédiger des commentaires utiles et indenter correctement ton code

---

## 1.1 Pourquoi JavaScript ?

Tu connais déjà le HTML et le CSS depuis la 3e. HTML donne la **structure**, CSS gère l'**apparence**. Mais une page sans JS, c'est comme une affiche collée au mur — elle ne *fait* rien.

JavaScript, c'est ce qui rend les choses interactives. Clique sur un bouton, une animation se lance. Tu soumets un formulaire, les données sont validées avant d'être envoyées. Tu scrolles sur un fil d'actu, de nouveaux contenus s'chargent. Tout ça, c'est JS.

```html
<!-- Ce que tu faisais en UAA3 : structure statique -->
<button>Cliquez-moi</button>

<!-- Ce que JS ajoute : comportement -->
<button onclick="alert('Mission accomplie.')">Cliquez-moi</button>
```

Ce qui est puissant avec JS : c'est le même langage qui tourne dans ton navigateur **et** sur les serveurs (Node.js), dans les apps mobiles (React Native), dans les outils CLI... C'est le langage le plus utilisé au monde depuis plus de 10 ans consécutifs. Si tu ne devais en apprendre qu'un seul, ce serait lui.

---

## 1.2 La programmation impérative

Un programme **impératif**, c'est une liste d'ordres précis que la machine exécute dans l'ordre, ligne par ligne, sans improviser.

Imagine que tu programmes un bot Discord pour modérer un serveur :

```
1. Analyser le message entrant
2. Vérifier si l'auteur est banni
3. Si oui → supprimer le message
4. Sinon → vérifier si le message contient des mots interdits
5. Si oui → avertir l'auteur
6. Passer au message suivant
```

La machine n'invente rien. Elle ne "comprend" pas le contexte. Elle exécute exactement ce que tu as écrit — ni plus, ni moins. C'est ton job de prévoir tous les cas possibles.

JavaScript est un langage impératif. Il est aussi orienté objet et fonctionnel (on dira que c'est un langage **multi-paradigme**), mais cette année on reste en impératif pur.

> **Paradigme** : façon d'organiser et de penser un programme. Comme des styles de code différents pour un même résultat. Impératif, déclaratif, orienté objet... chacun a ses forces.

---

## 1.3 Ton environnement : ProfAssistant

Oublie l'installation de VS Code pour ce cours. Tu travailles dans **ProfAssistant**, un environnement de développement directement dans le navigateur.

```
┌──────────────────────────┬─────────────────────────┐
│    Éditeur (Monaco)      │    Panneau de sortie     │
│                          │                          │
│  console.log("Test");    │  > Test                  │
│                          │                          │
│                          │    Sidebar Notebook      │
│                          │    (ton cours ici)       │
└──────────────────────────┴─────────────────────────┘
```

- **L'éditeur** : tu écris ton code JS ici. C'est le même moteur que VS Code.
- **Le panneau de sortie** : ce que ton programme affiche en temps réel.
- **La sidebar Notebook** : le rappel de cours, toujours accessible pendant l'exercice.

Ton outil principal pour l'instant : `console.log()`. C'est lui qui fait apparaître quelque chose dans le panneau de sortie. Pense à lui comme à un `printf` ou un `print` si tu connais d'autres langages.

---

## 1.4 Ton premier programme

```javascript
console.log("Système en ligne.");
console.log("En attente de tes ordres.");
console.log("Version : 1.0.0");
```

**Sortie attendue :**
```
Système en ligne.
En attente de tes ordres.
Version : 1.0.0
```

`console.log()` affiche ce que tu lui passes entre parenthèses. Le texte entre guillemets est une **chaîne de caractères** (ou *string*) — on y reviendra en détail au chapitre 4.

Tu peux passer plusieurs éléments en une fois :

```javascript
console.log("Score :", 9000);
// Sortie : Score : 9000
```

> **À savoir :** dans ProfAssistant, `console.log()` est ta sortie principale. `alert()` et `prompt()` existent aussi — on les verra au chapitre 3 (Entrées/Sorties).

---

## 1.5 Les règles du jeu : syntaxe JS

JS a ses propres règles. Les enfreindre = programme cassé, parfois sans message d'erreur clair.

### Majuscules / minuscules (sensibilité à la casse)

JS distingue les majuscules des minuscules. C'est pas négociable.

```javascript
console.log("OK");    // ✅ Fonctionne
Console.log("OK");    // ❌ ReferenceError: Console is not defined
CONSOLE.LOG("OK");    // ❌ ReferenceError: CONSOLE is not defined
```

Même logique pour les noms de variables : `monScore` ≠ `monscore` ≠ `MonScore`.

### Le point-virgule `;`

Il marque la fin d'une instruction. JS peut parfois s'en passer grâce à l'ASI (*Automatic Semicolon Insertion*), mais c'est une source classique de bugs subtils.

**Règle simple : mets-le systématiquement. Sans exception.**

```javascript
console.log("Ligne 1");   // ✅
console.log("Ligne 2");   // ✅
```

### Les accolades `{ }`

Elles délimitent des **blocs de code**. On les verra intensément avec les conditions et les boucles. Chaque `{` doit avoir son `}`.

```javascript
if (true) {
    console.log("Je suis dans un bloc.");
}
```

### Les parenthèses `( )`

Pour appeler des fonctions ou grouper des calculs :

```javascript
console.log("Résultat :", (10 + 5) * 2);
// Sortie : Résultat : 30
```

---

## 1.6 Commentaires et indentation

### Les commentaires

Le code, tu l'écris pour la machine. Les commentaires, tu les écris pour les **humains** — toi dans 3 semaines, ton coéquipier, le prof qui corrige.

```javascript
// Commentaire sur une ligne — rapide et pratique

/*
  Commentaire sur plusieurs lignes.
  Utile pour expliquer un bloc complexe
  ou pour désactiver du code temporairement.
*/

console.log("Ce code tourne.");
// console.log("Celui-ci est désactivé — commenté.");
```

**Règle d'or : commente le *pourquoi*, pas le *quoi*.**

```javascript
// ❌ Inutile — ça se voit déjà dans le code
score = score + 1; // On ajoute 1 à score

// ✅ Utile — ça apporte une info que le code n'exprime pas
score = score + 1; // +1 pour headshot, selon les règles du mode tournoi
```

### L'indentation

L'indentation = les espaces/tabs en début de ligne. Elle montre la **hiérarchie** du code. Pas d'indentation = code illisible = bugs difficiles à trouver.

```javascript
// ❌ Sans indentation — un vrai cauchemar à déboguer
if (true) {
console.log("Dedans");
if (true) {
console.log("Encore plus dedans");
}
}

// ✅ Avec indentation — la structure est immédiatement visible
if (true) {
    console.log("Dedans");
    if (true) {
        console.log("Encore plus dedans");
    }
}
```

Dans ProfAssistant, utilise `Tab` pour indenter, `Shift+Tab` pour désindenter. L'éditeur gère aussi l'indentation automatique.

> **Convention JS :** 2 ou 4 espaces par niveau d'indentation. Choisis l'un ou l'autre, et **reste cohérent** dans tout ton fichier.

---

## 📦 Récapitulatif

| Concept | Ce qu'il faut retenir |
|---|---|
| `console.log()` | Affiche dans le panneau de sortie |
| Sensibilité à la casse | `console.log` ≠ `Console.Log` — un seul est correct |
| Point-virgule `;` | Fin d'instruction obligatoire — prends l'habitude |
| `//` | Commentaire sur une ligne |
| `/* */` | Commentaire sur plusieurs lignes |
| Indentation | 4 espaces par niveau — montre la structure |
| Paradigme impératif | Instructions exécutées dans l'ordre, une par une |

---

## 🔗 Pour aller plus loin

- [MDN — Introduction à JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Introduction)
- [MDN — console.log()](https://developer.mozilla.org/fr/docs/Web/API/console/log_static)

---

*→ Chapitre suivant : Variables et types de données*
