# Chapitre 10 — Projets

> **UAA5 — Programmation impérative** | 4e secondaire | Technique de transition Informatique

---

## 🎯 Ce chapitre en quelques mots

Ce chapitre ne présente aucun nouveau concept. C'est la synthèse de tout ce que tu as appris depuis le début — variables, conditions, boucles, fonctions prédéfinies, DOM, état persistant, validation.

Deux projets complets t'attendent. Chacun démarre d'un **cahier des charges** — un énoncé qui décrit ce que le programme doit faire, sans dire comment le faire. Ton travail : lire, analyser, planifier, coder, tester.

---

## 10.1 Du cahier des charges au code — la démarche

Face à un nouveau projet, résiste à l'envie de coder immédiatement. Un quart d'heure de réflexion évite des heures de refactoring.

### Étape 1 — Lire le cahier des charges en entier

Avant d'ouvrir l'éditeur, lis tout. Identifie :

| Élément | Questions à se poser |
|---|---|
| **Entrées** | Qu'est-ce que l'utilisateur fournit ? |
| **Sorties** | Qu'est-ce que le programme affiche ? |
| **Règles** | Quelle est la logique métier ? |
| **Contraintes** | Quelles validations sont nécessaires ? |
| **Cas limites** | Que se passe-t-il si l'entrée est vide, nulle, hors plage ? |

### Étape 2 — Découper en sous-problèmes

Un projet entier intimide. La même chose découpée en 5 petits problèmes, c'est faisable.

```
Projet : Jeu Pierre-Feuille-Ciseaux
  ├── Générer le choix de l'ordinateur (Math.random)
  ├── Comparer les deux choix et déterminer le résultat
  ├── Afficher le résultat dans la page
  ├── Maintenir le score (état persistant)
  └── Réinitialiser le score
```

### Étape 3 — Écrire l'algorithme avant de coder

Même informel, un pseudo-code ou des commentaires vides structurent ton travail :

```javascript
document.getElementById("btnPierre").addEventListener("click", function() {
    // 1. Générer le choix de l'ordi
    // 2. Comparer avec "pierre"
    // 3. Déterminer gagnant
    // 4. Afficher résultat
    // 5. Mettre à jour le score
});
```

Ces commentaires deviennent les marqueurs de ta progression — quand une étape fonctionne, tu la coches mentalement.

### Étape 4 — Construire et tester par incrément

Ne code pas tout d'un coup. Avance par couches :
1. Fait afficher quelque chose dans la page → teste
2. Ajoute la logique de base → teste
3. Ajoute la validation → teste
4. Ajoute le score → teste
5. Peaufine l'affichage → teste

---

## 10.2 Projet 1 — Pierre-Feuille-Ciseaux

### Cahier des charges

> **Titre :** Jeu Pierre-Feuille-Ciseaux  
> **Contexte :** L'utilisateur joue contre l'ordinateur. L'ordinateur choisit aléatoirement.

**Fonctionnalités obligatoires :**
- Trois boutons : Pierre 🪨 / Feuille 📄 / Ciseaux ✂️
- À chaque clic, l'ordinateur choisit un élément au hasard
- Le programme détermine et affiche : le choix du joueur, le choix de l'ordinateur, et le résultat (Gagné / Perdu / Égalité)
- Le score est maintenu et affiché en continu (victoires — défaites — égalités)
- Un bouton Réinitialiser remet le score à zéro

**Règles du jeu :**
- Pierre bat Ciseaux
- Ciseaux bat Feuille
- Feuille bat Pierre
- Même choix = Égalité

**Contraintes techniques :**
- Le choix de l'ordinateur utilise `Math.random()`
- Le score persiste entre les clics (variables d'état hors listener)
- Chaque résultat est affiché dans un historique scrollable

---

## 10.3 Projet 2 — Calculateur de Moyenne Pondérée

### Cahier des charges

> **Titre :** Calculateur de Moyenne Pondérée  
> **Contexte :** Un professeur saisit des notes et leurs coefficients. Le programme calcule la moyenne pondérée.

**Fonctionnalités obligatoires :**
- Deux champs de saisie : Note (0–20) et Coefficient (entier positif)
- Bouton "Ajouter" : valide et ajoute la note à la liste
- La liste s'affiche au fur et à mesure avec note, coefficient, et contribution au calcul
- Bouton "Calculer" : affiche la moyenne pondérée avec son interprétation
- Bouton "Réinitialiser" : vide tout et repart de zéro

**Formule :**

```
Moyenne = Σ(note × coefficient) / Σ(coefficients)
```

**Contraintes de validation :**
- Note : nombre entre 0 et 20 (décimales autorisées : 12.5 est valide)
- Coefficient : entier strictement positif (≥ 1)
- Au moins une note doit être ajoutée avant de calculer

**Interprétation du résultat :**
- ≥ 14 : Distinction
- ≥ 10 : Réussite
- ≥ 8 : Ajournement possible
- < 8 : Échec

---

## 10.4 Conseils pour réussir

**Sur la lisibilité du code :**
```javascript
// ❌ Cryptique
const r = a >= b && a >= c ? "G" : b >= c ? "P" : "E";

// ✅ Lisible
let resultat;
if (choixJoueur === choixOrdi) {
    resultat = "Égalité";
} else if (...) {
    resultat = "Gagné";
} else {
    resultat = "Perdu";
}
```

**Sur les fonctions helper :**
Quand tu répètes 3 fois le même bloc DOM, c'est le signal pour en faire une fonction :

```javascript
// Au lieu de répéter ça partout :
const d = document.createElement("div");
d.className = "item";
d.textContent = texte;
output.appendChild(d);

// Extrais-le :
function ajouterItem(texte, classe = "item") {
    const d = document.createElement("div");
    d.className = classe;
    d.textContent = texte;
    output.appendChild(d);
}
```

**Sur les fonctions fléchées :**
Tu verras cette syntaxe dans les solutions — c'est une façon plus courte d'écrire une fonction anonyme :

```javascript
// Fonction classique
document.getElementById("btn").addEventListener("click", function() { ... });

// Fonction fléchée — identique dans ce contexte
document.getElementById("btn").addEventListener("click", () => { ... });
```

---

## 📦 Ce que ce module t'a appris

En 10 chapitres, tu as couvert l'intégralité de l'UAA5 :

| Chapitre | Concept | Compétence UAA5 |
|---|---|---|
| CH1 | Environnement, syntaxe | Connaitre |
| CH2 | Variables, types, opérateurs | Connaitre / Appliquer |
| CH3 | Entrées / Sorties | Connaitre / Appliquer |
| CH4 | Chaînes de caractères | Connaitre / Appliquer |
| CH5 | Conditions | Appliquer |
| CH6 | Boucles + DOM | Appliquer |
| CH7 | Structures combinées | Appliquer |
| CH8 | Fonctions prédéfinies | Connaitre / Appliquer |
| CH9 | Algorithmes | Appliquer / Transférer |
| CH10 | Projets | Transférer |

---

*Fin de l'UAA5 — Programmation impérative*
