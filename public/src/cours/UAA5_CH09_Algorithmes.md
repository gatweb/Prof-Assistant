# Chapitre 9 — Algorithmes

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Lire et comprendre un algorithme en pseudo-code
- Traduire un pseudo-code en JavaScript syntaxiquement correct
- Écrire un algorithme depuis un énoncé ou un cahier des charges
- Commenter efficacement du code (le pourquoi, pas le quoi)
- Identifier et corriger des erreurs logiques dans un programme existant

---

## 9.1 Qu'est-ce qu'un algorithme ?

Un algorithme est une **suite finie et précise d'instructions** permettant de résoudre un problème. Trois caractéristiques essentielles :

- **Fini** — il se termine toujours
- **Non ambigu** — chaque étape a une interprétation unique
- **Général** — applicable à des données différentes

Un même algorithme peut être exprimé de plusieurs façons :

| Représentation | Usage | Exemple |
|---|---|---|
| Langage naturel | Communication entre humains | "Si le nombre est négatif, affiche un message d'erreur" |
| **Pseudo-code** | Algorithme précis sans syntaxe d'un langage particulier | `SI n < 0 ALORS AFFICHER "Erreur"` |
| Organigramme | Représentation visuelle | Losanges (conditions), rectangles (actions) |
| Code source | Exécution par la machine | `if (n < 0) { ... }` |

Dans ce chapitre, on travaille principalement avec le **pseudo-code** — pont naturel entre l'énoncé et le code.

---

## 9.2 Lire du pseudo-code

Le pseudo-code est un langage conventionnel. Voici la notation utilisée dans ce cours :

### Les instructions de base

```
LIRE variable            → récupère une valeur (input utilisateur)
AFFICHER "texte"         → sortie à l'écran
variable ← valeur        → affectation (équivalent du = en JS)
```

### Les structures alternatives

```
SI condition ALORS
    instructions
FIN SI

SI condition ALORS
    instructions
SINON
    instructions
FIN SI

SI condition ALORS
    instructions
SINON SI autre_condition ALORS
    instructions
SINON
    instructions
FIN SI
```

### Les structures répétitives

```
POUR i DE début À fin FAIRE
    instructions
FIN POUR

TANT QUE condition FAIRE
    instructions
FIN TANT QUE

SORTIR DE LA BOUCLE      → équivalent de break
PASSER À L'ITÉRATION SUIVANTE  → équivalent de continue
```

### Exemple commenté — lire un algorithme

```
ALGO VérifierÂge
  VARIABLE age : entier

  DÉBUT
    LIRE age                         ← entrée utilisateur

    SI age < 0 ALORS                 ← validation
      AFFICHER "Âge invalide"
    SINON SI age < 18 ALORS          ← première branche
      AFFICHER "Mineur"
    SINON SI age < 65 ALORS          ← deuxième branche
      AFFICHER "Adulte"
    SINON                            ← cas par défaut
      AFFICHER "Senior"
    FIN SI
  FIN
```

**Comment lire un algorithme :** trace son exécution avec une valeur test. Prends `age = 25` — tu passes la validation (`25 >= 0`), tu rates le premier `SINON SI` (`25 >= 18`), tu entres dans le deuxième (`25 < 65`) → "Adulte". ✓

---

## 9.3 Traduire un pseudo-code en JavaScript

La traduction suit une correspondance directe. Une fois le pseudo-code compris, chaque ligne se convertit mécaniquement.

| Pseudo-code | JavaScript |
|---|---|
| `variable ← valeur` | `let variable = valeur;` |
| `LIRE variable` | `const variable = Number(input.value);` |
| `AFFICHER "texte"` | `afficher("texte")` ou `element.textContent = "texte"` |
| `SI cond ALORS` | `if (cond) {` |
| `SINON` | `} else {` |
| `FIN SI` | `}` |
| `POUR i DE 1 À n FAIRE` | `for (let i = 1; i <= n; i++) {` |
| `FIN POUR` | `}` |
| `TANT QUE cond FAIRE` | `while (cond) {` |
| `FIN TANT QUE` | `}` |
| `SORTIR DE LA BOUCLE` | `break;` |
| `MOD` | `%` |

### Exemple de traduction complète

Algorithme :
```
ALGO Maximum
  VARIABLES a, b, c : entiers

  DÉBUT
    LIRE a
    LIRE b
    LIRE c
    
    SI a >= b ET a >= c ALORS
      AFFICHER "Maximum : " + a
    SINON SI b >= c ALORS
      AFFICHER "Maximum : " + b
    SINON
      AFFICHER "Maximum : " + c
    FIN SI
  FIN
```

Traduction JavaScript :
```javascript
const a = Number(document.getElementById("inputA").value);
const b = Number(document.getElementById("inputB").value);
const c = Number(document.getElementById("inputC").value);

if (a >= b && a >= c) {
    afficher("Maximum", a);
} else if (b >= c) {
    afficher("Maximum", b);
} else {
    afficher("Maximum", c);
}
```

### La démarche de traduction — étape par étape

1. **Lire l'algorithme entier** avant d'écrire une ligne de JS
2. **Identifier les variables** et leurs types → `let` ou `const`
3. **Identifier les entrées** → `input.value` + `Number()`
4. **Traduire ligne par ligne** en respectant la syntaxe JS
5. **Tester avec des valeurs connues** dont tu connais le résultat attendu
6. **Commenter les parties non évidentes**

---

## 9.4 Écrire un algorithme depuis un cahier des charges

Un **cahier des charges** décrit ce que le programme doit faire — pas comment le faire. Ton travail : extraire les informations utiles et concevoir l'algorithme avant de coder.

### Extraire les informations d'un énoncé

Prenons cet énoncé :

> *"Le programme demande un nombre entier positif. Il affiche tous ses diviseurs. Si le nombre n'a que 1 et lui-même comme diviseurs, il affiche qu'il est premier."*

Extrais systématiquement :

| Élément | Contenu |
|---|---|
| **Entrée(s)** | Un entier positif `n` |
| **Sortie(s)** | Liste des diviseurs + "premier" ou non |
| **Contrainte** | n > 0 (à valider) |
| **Logique** | Boucle de 1 à n, si `n MOD i = 0` → diviseur. Compter les diviseurs. Si count = 2 → premier |

Puis tu écris le pseudo-code :

```
ALGO DiviseursPremier
  VARIABLES n, i, compteur : entiers

  DÉBUT
    LIRE n

    SI n <= 0 ALORS
      AFFICHER "Nombre invalide"
      SORTIR
    FIN SI

    compteur ← 0
    AFFICHER "Diviseurs de " + n + " :"

    POUR i DE 1 À n FAIRE
      SI n MOD i = 0 ALORS
        AFFICHER i
        compteur ← compteur + 1
      FIN SI
    FIN POUR

    SI compteur = 2 ALORS
      AFFICHER n + " est un nombre premier"
    FIN SI
  FIN
```

**Seulement après** avoir validé la logique du pseudo-code, tu traduis en JS.

---

## 9.5 Commenter son code

Commenter, ce n'est pas décrire ce que le code fait — ça, on le voit en lisant. C'est expliquer **pourquoi** une décision a été prise.

```javascript
// ❌ Commentaire inutile — redondant avec le code
let compteur = 0;   // initialise compteur à 0

// ✅ Commentaire utile — explique le raisonnement
let compteur = 0;   // compte les diviseurs (2 diviseurs = nombre premier)

// ❌ Inutile
i++;   // on incrémente i

// ✅ Utile — la borne de la boucle n'est pas évidente
for (let i = 2; i <= Math.sqrt(n); i++) {
    // On s'arrête à √n car si n a un diviseur > √n,
    // il a forcément un diviseur correspondant < √n, déjà trouvé
```

### Conventions de commentaires

```javascript
// Commentaire de section — décrit un bloc logique
// ─────────────────────────────────────────────

/*
 * Commentaire de fonction — explique l'objectif, les paramètres,
 * le résultat attendu. À placer avant les blocs complexes.
 */

// TODO: à améliorer plus tard
// FIXME: bug connu à corriger
// HACK: solution temporaire — expliquer pourquoi
```

---

## 9.6 Corriger un programme défaillant

Les erreurs logiques sont les plus difficiles à trouver : le programme tourne sans erreur JS, mais le résultat est faux. Méthode :

### 1. Comprendre ce que le programme est censé faire
Lis le code comme si tu ne savais pas ce qu'il devrait produire.

### 2. Tester avec des valeurs dont tu connais le résultat
```javascript
// Si le programme calcule une moyenne :
// Test avec [10, 10, 10] → résultat attendu : 10
// Test avec [0, 100] → résultat attendu : 50
// Test avec [] → résultat attendu : message d'erreur
```

### 3. Tracer l'exécution mentalement
Prends une valeur de test et simule l'exécution ligne par ligne, en notant la valeur de chaque variable à chaque étape.

### 4. Erreurs logiques fréquentes

```javascript
// ❌ Comparaison avec = au lieu de ===
if (score = 100) { }     // affecte 100 à score au lieu de comparer !
if (score === 100) { }   // ✅

// ❌ Condition inversée
if (score < 0 || score > 100) { /* valide */ }   // devrait être "invalide"
if (score >= 0 && score <= 100) { /* invalide */ }

// ❌ Calcul à l'intérieur d'une boucle alors qu'il doit être après
for (let i = 0; i < n; i++) {
    somme += notes[i];
    moyenne = somme / n;   // ❌ calculé à chaque tour, pas à la fin
}
moyenne = somme / n;       // ✅ après la boucle

// ❌ Initialisation incorrecte du min/max
let min = 0;   // ❌ si toutes les valeurs sont positives, résultat faux
let min = null; // ✅

// ❌ Off-by-one — boucle qui s'arrête trop tôt ou trop tard
for (let i = 0; i < n; i++) { }    // indices 0 à n-1
for (let i = 1; i <= n; i++) { }   // indices 1 à n — choisir selon le contexte
```

---

## 📦 Récapitulatif

| Compétence | Ce qu'elle demande |
|---|---|
| Lire un algo | Tracer l'exécution avec des valeurs test |
| Traduire | Correspondance systématique pseudo-code → JS |
| Écrire un algo | Extraire entrées/sorties/logique → pseudo-code avant le code |
| Commenter | Expliquer le *pourquoi*, pas le *quoi* |
| Déboguer | Tester avec valeurs connues, tracer mentalement, chercher les erreurs logiques classiques |

---

*→ Chapitre suivant : Projets — Pierre-Feuille-Ciseaux & Moyenne Pondérée*
