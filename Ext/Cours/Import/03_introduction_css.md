# Chapitre 3 — Introduction au CSS

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer le rôle du CSS et sa relation avec le HTML
- Écrire une règle CSS correctement structurée
- Utiliser les sélecteurs de base : élément, classe, id
- Combiner plusieurs sélecteurs (groupement, descendant)
- Choisir la bonne méthode pour intégrer du CSS à une page
- Comprendre pourquoi l'ordre des règles CSS peut changer le résultat

---

## 3.1 Qu'est-ce que le CSS ?

Rappel de l'analogie du chapitre 1 : **HTML = la structure**, **CSS = la décoration**. Le CSS (*Cascading Style Sheets*, "feuilles de style en cascade") donne vie à ta page — couleurs, polices, espacements, mises en page.

Sans CSS, une page web ressemble à un document Word des années 90 : texte noir, fond blanc, rien d'autre. Avec CSS, cette même structure HTML peut devenir absolument n'importe quoi — un site élégant, un univers de jeu, un magazine en ligne.

> Le plus important à comprendre dès le départ : **le HTML ne change jamais selon le style**. Le même fichier HTML peut recevoir 10 designs totalement différents juste en changeant le CSS. C'est cette séparation structure/style qui rend le web maintenable.

---

## 3.2 Anatomie d'une règle CSS

Une règle CSS se compose toujours de la même façon :

```css
selecteur {
    propriete: valeur;
}
```

| Partie | Rôle |
|---|---|
| **Sélecteur** | Quel élément HTML on cible |
| **Propriété** | Quel aspect on modifie (couleur, taille, marge...) |
| **Valeur** | Comment on le modifie |
| **Déclaration** | L'ensemble `propriété: valeur;` — on peut en empiler plusieurs |

```css
p {
    color: blue;
    border: 2px solid orange;
    padding: 5px;
}
```

Cette règle cible **tous les paragraphes** (`p`) et leur applique 3 déclarations : texte bleu, bordure orange de 2px, et 5px d'espace intérieur.

> ⚠️ Chaque déclaration se termine par un **point-virgule**. Oublier ce point-virgule est l'erreur n°1 des débutants en CSS — la règle suivante risque d'être ignorée ou mal interprétée.

---

## 3.3 Les sélecteurs de base

### Sélecteur d'élément

Cible **tous** les éléments d'un type donné, sans exception.

```css
p { color: blue; }    /* tous les <p> de la page */
h1 { font-size: 2em; }  /* tous les <h1> de la page */
```

### Sélecteur de classe

Cible uniquement les éléments portant un attribut `class` précis. Une classe peut être réutilisée sur **autant d'éléments que tu veux** — c'est le sélecteur le plus utilisé en pratique.

```html
<p class="alerte">Attention !</p>
<p class="alerte">Autre message important.</p>
```

```css
.alerte {
    color: red;
    font-weight: bold;
}
```

> En CSS, un sélecteur de classe commence toujours par un **point** : `.alerte`. Dans le HTML, l'attribut s'écrit sans point : `class="alerte"`.

### Sélecteur d'identifiant (id)

Cible un **seul** élément précis — un id ne doit jamais être répété sur la même page.

```html
<h1 id="titre-principal">Bienvenue</h1>
```

```css
#titre-principal {
    color: purple;
}
```

> Le sélecteur d'id commence par un **dièse** : `#titre-principal`.

### Classe ou id — lequel choisir ?

| Situation | Utilise |
|---|---|
| Le style s'applique à plusieurs éléments | `class` |
| Tu cibles un élément unique sur la page | `id` ou `class` (les deux fonctionnent) |
| Tu veux aussi cibler cet élément en JavaScript ou créer une ancre de navigation | `id` (pratique courante) |

En résumé : **utilise `class` par défaut**, réserve `id` aux cas où l'unicité a vraiment du sens.

---

## 3.4 Combiner des sélecteurs

### Sélecteur de groupe — appliquer le même style à plusieurs sélecteurs

La virgule applique une règle à **plusieurs sélecteurs en même temps**, sans devoir la répéter.

```css
h1, h2, h3 {
    font-family: Georgia, serif;
}
```

Équivalent (mais beaucoup plus long) à écrire 3 règles séparées identiques.

### Sélecteur descendant — cibler à l'intérieur d'un autre élément

Un espace entre deux sélecteurs cible tout élément du second type, **n'importe où à l'intérieur** du premier.

```css
nav a {
    color: white;
}
```

Cette règle cible uniquement les liens `<a>` qui se trouvent **dans** un `<nav>` — pas les autres liens de la page.

### Sélecteur d'enfant direct — un cran plus précis

Le symbole `>` cible uniquement les enfants **directs**, pas les descendants plus profonds.

```css
nav > a {
    text-decoration: none;
}
```

Si un `<a>` est niché plus profondément dans le `<nav>` (par exemple dans un `<ul><li>`), cette règle ne le cible **pas** — contrairement au sélecteur descendant avec simple espace.

> Cette nuance semble subtile maintenant, elle deviendra évidente avec la pratique. On approfondit les sélecteurs avancés (attributs, voisins) plus tard dans le cours.

---

## 3.5 Où écrire le code CSS ?

Il existe trois méthodes pour lier du CSS à du HTML.

### Méthode 1 — Style en ligne (à éviter)

Le CSS est écrit directement dans l'attribut `style` de la balise.

```html
<h1 style="color: red;">Titre</h1>
```

❌ Déconseillé : aucune réutilisation possible, mélange structure et style, devient ingérable sur un vrai projet.

### Méthode 2 — Balise `<style>` dans le `<head>`

Le CSS est regroupé dans le `<head>` du document HTML.

```html
<head>
    <style>
        body { background-color: orange; }
        p { color: blue; }
    </style>
</head>
```

⚠️ Acceptable pour un test rapide ou un tout petit projet, mais ne permet pas de réutiliser le même style sur plusieurs pages.

### Méthode 3 — Fichier CSS externe (la bonne pratique)

Le CSS est dans un fichier `.css` séparé, lié via `<link>`.

```html
<head>
    <link rel="stylesheet" href="style.css">
</head>
```

✅ **La méthode à utiliser systématiquement.** Un seul fichier CSS peut habiller toutes les pages d'un site — modifie-le une fois, le changement s'applique partout.

> Dans ProfAssistant, l'onglet **CSS** correspond exactement à cette méthode 3 : ton code y est automatiquement lié à la page HTML.

---

## 3.6 Commentaires et indentation

```css
/* Ceci est un commentaire CSS */

/* Section : style du menu de navigation */
nav {
    background-color: #222;
}
```

Comme en HTML, les commentaires sont ignorés par le navigateur — uniquement pour les humains qui relisent le code.

L'indentation suit la même logique qu'en HTML : chaque propriété d'une règle est indentée à l'intérieur des accolades, pour une lecture immédiate.

```css
/* ✅ Bien indenté */
.carte {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
}
```

---

## 3.7 Pourquoi mon CSS ne s'applique pas ?

Une frustration universelle chez les débutants : tu écris une règle, et... rien ne change. Voici les deux causes les plus fréquentes.

### La spécificité

Quand plusieurs règles ciblent le même élément, celle qui est **la plus précise** gagne.

```css
p { color: blue; }
.important { color: red; }
```

```html
<p class="important">Ce texte sera rouge.</p>
```

Le sélecteur de classe `.important` est plus spécifique que le sélecteur d'élément `p` — il l'emporte, peu importe l'ordre d'écriture.

### L'ordre d'écriture (la "cascade")

Si deux règles ont **exactement** la même spécificité, c'est la **dernière déclarée** dans le fichier qui gagne.

```css
p { color: blue; }
p { color: green; }
/* Le texte sera vert — cette règle est déclarée en dernier */
```

> **Réflexe à adopter en cas de bug visuel :** vérifie d'abord les fautes de frappe (un point-virgule oublié, une classe mal orthographiée), puis la spécificité, puis l'ordre. 90% des problèmes viennent de l'une de ces trois causes.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Règle CSS | `sélecteur { propriété: valeur; }` |
| Sélecteur d'élément | `p { }` — cible TOUS les éléments de ce type |
| Sélecteur de classe | `.nom { }` — réutilisable sur plusieurs éléments |
| Sélecteur d'id | `#nom { }` — un seul élément, unique sur la page |
| Groupement | `h1, h2 { }` — applique la même règle à plusieurs sélecteurs |
| Descendant | `nav a { }` — cible à l'intérieur, à toute profondeur |
| Enfant direct | `nav > a { }` — cible uniquement un cran plus bas |
| Méthode recommandée | Fichier `.css` externe lié avec `<link>` |
| Spécificité | Le sélecteur le plus précis gagne |
| Cascade | À spécificité égale, la dernière règle déclarée gagne |

---

## 🔗 Pour aller plus loin

- [MDN — Introduction au CSS](https://developer.mozilla.org/fr/docs/Learn/Getting_started_with_the_web/CSS_basics)
- [MDN — Spécificité CSS](https://developer.mozilla.org/fr/docs/Web/CSS/Specificity)

---

*→ Chapitre suivant : Le modèle de boîte*
