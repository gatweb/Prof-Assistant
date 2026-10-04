# Chapitre 7 — Structures combinées

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Filtrer des valeurs dans une boucle avec des conditions
- Accumuler des résultats conditionnellement (somme, compteur, min/max)
- Construire une recherche avec `break` sur critère
- Écrire et lire des boucles imbriquées
- Reconnaître et appliquer les 4 patterns algorithmiques de base

---

## 7.1 Les 4 patterns fondamentaux

Ce chapitre ne présente pas de nouveaux concepts — il assemble ce que tu sais déjà. Il existe 4 patterns qui reviennent dans presque tout programme impératif. Apprends à les reconnaître.

### Pattern 1 — Filtrage

Exécuter du code uniquement pour les éléments qui satisfont une condition.

```javascript
// Afficher uniquement les nombres pairs de 1 à 20
for (let i = 1; i <= 20; i++) {
    if (i % 2 === 0) {
        // traite uniquement les pairs
        const div = document.createElement("div");
        div.textContent = i;
        output.appendChild(div);
    }
    // les impairs sont ignorés — rien ne se passe pour eux
}
```

Variante avec `continue` — même résultat, logique inversée :

```javascript
for (let i = 1; i <= 20; i++) {
    if (i % 2 !== 0) continue;   // saute les impairs, continue la boucle
    // ici on sait que i est pair
    const div = document.createElement("div");
    div.textContent = i;
    output.appendChild(div);
}
```

---

### Pattern 2 — Accumulation conditionnelle

Calculer une somme, une moyenne, ou compter des occurrences selon un critère.

```javascript
// Saisie : "12, -3, 8, 0, -5, 15"
// Compter positifs, négatifs, calculer leur somme séparément

const parties = saisie.split(",");

let sommePositifs  = 0;
let nbPositifs     = 0;
let sommeNegatifs  = 0;
let nbNegatifs     = 0;

for (let i = 0; i < parties.length; i++) {
    const n = Number(parties[i].trim());
    if (isNaN(n)) continue;   // ignore les valeurs non numériques

    if (n > 0) {
        sommePositifs += n;
        nbPositifs++;
    } else if (n < 0) {
        sommeNegatifs += n;
        nbNegatifs++;
    }
    // n === 0 : ignoré volontairement ici
}
```

---

### Pattern 3 — Recherche de minimum et maximum

```javascript
let min = null;   // null = "pas encore de valeur"
let max = null;

for (let i = 0; i < parties.length; i++) {
    const n = Number(parties[i].trim());
    if (isNaN(n)) continue;

    // Premier passage : min et max prennent la première valeur valide
    if (min === null || n < min) min = n;
    if (max === null || n > max) max = n;
}

// Après la boucle : min et max contiennent les bonnes valeurs
// (ou restent null si aucune valeur valide n'a été trouvée)
```

> **Pourquoi `null` et pas `0` comme valeur initiale ?** Parce que si toutes les valeurs sont négatives, initialiser min à `0` donnerait un résultat faux. `null` signifie "je n'ai encore rien trouvé".

---

### Pattern 4 — Recherche avec arrêt anticipé

Trouver le premier élément qui correspond à un critère, puis s'arrêter.

```javascript
const texte  = "Shadow_X_Pro_2024";
let   trouve = false;
let   indice = -1;

for (let i = 0; i < texte.length; i++) {
    const car = texte[i];
    if (car >= "0" && car <= "9") {   // premier chiffre trouvé
        trouve = true;
        indice = i;
        break;   // inutile de continuer — on a ce qu'on cherchait
    }
}

if (trouve) {
    afficherStat("Premier chiffre à l'indice", indice);
} else {
    afficherStat("Chiffres", "aucun");
}
```

---

## 7.2 Boucles imbriquées

Une boucle imbriquée, c'est une boucle à l'intérieur d'une autre boucle. La boucle intérieure s'exécute **entièrement** à chaque tour de la boucle extérieure.

```javascript
for (let row = 1; row <= 3; row++) {
    for (let col = 1; col <= 3; col++) {
        console.log(`[${row}, ${col}]`);
    }
}
// [1,1] [1,2] [1,3]
// [2,1] [2,2] [2,3]
// [3,1] [3,2] [3,3]
// → 9 itérations au total (3 × 3)
```

Application directe — construire une ligne de caractères :

```javascript
const hauteur   = 5;
const caractere = "*";

for (let row = 1; row <= hauteur; row++) {
    let ligne = "";

    for (let col = 1; col <= row; col++) {
        ligne += caractere;   // ajoute un caractère à chaque tour intérieur
    }

    // ligne vaut "*", "**", "***", "****", "*****" selon row
    const div = document.createElement("div");
    div.textContent = ligne;
    output.appendChild(div);
}
```

### Condition à l'intérieur de la boucle intérieure

Pour dessiner un triangle creux (uniquement les bords) :

```javascript
for (let row = 1; row <= hauteur; row++) {
    let ligne = "";

    for (let col = 1; col <= row; col++) {
        // Premier ou dernier caractère de la ligne → bord
        // Dernière ligne → tout plein
        if (col === 1 || col === row || row === hauteur) {
            ligne += caractere;
        } else {
            ligne += " ";   // intérieur vide
        }
    }

    const div = document.createElement("div");
    div.textContent = ligne;
    output.appendChild(div);
}
```

> **Mise en garde complexité :** chaque niveau d'imbrication multiplie le nombre d'itérations. 3 boucles imbriquées de 10 tours = 1000 itérations. Au-delà de 2 niveaux, réfléchis à si c'est vraiment nécessaire.

---

## 7.3 `return` comme sortie anticipée dans un handler

Dans un `addEventListener`, le mot-clé `return` (sans valeur) arrête l'exécution de la fonction handler — exactement comme `break` sort d'une boucle. C'est le pattern de validation propre.

```javascript
document.getElementById("btn").addEventListener("click", function() {
    const n = Number(document.getElementById("input").value);

    if (isNaN(n)) {
        afficherErreur("Valeur invalide.");
        return;   // ← stop — le reste de la fonction ne s'exécute pas
    }

    // Ici on sait que n est valide
    for (let i = 1; i <= n; i++) {
        // ...
    }
});
```

---

## 📦 Récapitulatif

| Pattern | Outils | Usage |
|---|---|---|
| Filtrage | `if` dans `for` | Traiter seulement certains éléments |
| Accumulation | `if` + compteur/somme | Calculer sur un sous-ensemble |
| Min / Max | `if (null \|\| <)` | Trouver une valeur extrême |
| Recherche | `if` + `break` + flag | Trouver le premier qui correspond |
| Boucles imbriquées | `for` dans `for` | Matrices, grilles, pyramides |
| Sortie anticipée | `return` dans handler | Stopper après une erreur de validation |

---

*→ Chapitre suivant : Fonctions prédéfinies (Math, Date...)*
