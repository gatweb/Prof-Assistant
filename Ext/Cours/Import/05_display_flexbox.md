# Chapitre 5 — Display et Flexbox

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Distinguer les valeurs de base de `display` : `block`, `inline`, `inline-block`, `none`
- Activer Flexbox sur un conteneur et comprendre ses deux axes
- Aligner des éléments avec `justify-content` et `align-items`
- Contrôler l'espacement avec `gap` et la direction avec `flex-direction`
- Gérer le retour à la ligne avec `flex-wrap`
- Utiliser `flex-grow` pour répartir l'espace entre plusieurs éléments

---

## 5.1 Rappel express : les valeurs de base de display

Tu as déjà croisé `display` au chapitre 1 quand on parlait de balises bloc et en ligne. Petit rappel condensé :

| Valeur | Comportement |
|---|---|
| `block` | Toute la largeur disponible, saut de ligne avant/après (`<div>`, `<p>`, `<h1>`...) |
| `inline` | Reste dans le flux du texte, ignore `width`/`height` (`<span>`, `<a>`, `<strong>`...) |
| `inline-block` | Reste en ligne, MAIS respecte `width`/`height`/`margin` |
| `none` | L'élément disparaît complètement — aucun espace réservé |

C'est tout ce qu'il faut retenir pour l'instant. Le vrai sujet de ce chapitre, c'est ce qui vient ensuite.

---

## 5.2 Pourquoi Flexbox ?

Avant Flexbox, aligner des éléments côte à côte, les centrer, ou répartir l'espace entre eux demandait des techniques compliquées et peu fiables. **Flexbox** a été créé spécifiquement pour résoudre ce problème : c'est **l'outil moderne pour aligner et répartir des éléments**, en ligne ou en colonne.

Une seule propriété suffit pour transformer complètement le comportement d'un conteneur :

```css
.conteneur {
    display: flex;
}
```

Dès que tu écris ça, **tous les enfants directs** de `.conteneur` deviennent des "éléments flexibles" et se comportent selon des règles totalement différentes du flux normal.

---

## 5.3 Les deux axes de Flexbox

C'est LE concept à comprendre absolument avant tout le reste. Un conteneur flex possède toujours **deux axes perpendiculaires** :

```
flex-direction: row  (valeur par défaut)

        axe principal (main axis) →
       ┌─────┐ ┌─────┐ ┌─────┐
       │  1  │ │  2  │ │  3  │     ↓ axe secondaire
       └─────┘ └─────┘ └─────┘       (cross axis)
```

- **L'axe principal** (*main axis*) : la direction dans laquelle les éléments s'alignent en premier (horizontale par défaut).
- **L'axe secondaire** (*cross axis*) : l'axe perpendiculaire à l'axe principal.

Tout l'enjeu de Flexbox revient à répondre à deux questions :
1. *Comment répartir l'espace sur l'axe principal ?* → `justify-content`
2. *Comment aligner sur l'axe secondaire ?* → `align-items`

Retiens bien cette distinction — elle explique 90% des questions "pourquoi mon alignement ne marche pas".

---

## 5.4 flex-direction — choisir la direction

```css
.conteneur { flex-direction: row; }    /* par défaut : horizontal, gauche → droite */
```

```
row (par défaut)              column
┌───┐┌───┐┌───┐               ┌───┐
│ 1 ││ 2 ││ 3 │                │ 1 │
└───┘└───┘└───┘               ├───┤
                               │ 2 │
                               ├───┤
                               │ 3 │
                               └───┘
```

| Valeur | Effet |
|---|---|
| `row` (défaut) | Horizontal, de gauche à droite |
| `row-reverse` | Horizontal, de droite à gauche |
| `column` | Vertical, de haut en bas |
| `column-reverse` | Vertical, de bas en haut |

> **Important :** quand tu passes en `column`, l'axe principal devient **vertical** — `justify-content` et `align-items` échangent alors leurs rôles !

---

## 5.5 justify-content — répartir sur l'axe principal

```css
.conteneur {
    display: flex;
    justify-content: center;
}
```

| Valeur | Résultat (en `flex-direction: row`) |
|---|---|
| `flex-start` (défaut) | `[1][2][3]` — collés à gauche |
| `center` | `␣␣␣[1][2][3]␣␣␣` — groupés au centre |
| `flex-end` | `␣␣␣␣␣␣␣[1][2][3]` — collés à droite |
| `space-between` | `[1]␣␣␣␣[2]␣␣␣␣[3]` — extrêmes collés aux bords, espace réparti entre |
| `space-around` | `␣[1]␣␣[2]␣␣[3]␣` — espace égal autour de chaque élément |

```
flex-start                    center
┌─────────────────┐          ┌─────────────────┐
│[1][2][3]        │          │    [1][2][3]    │
└─────────────────┘          └─────────────────┘

space-between                 flex-end
┌─────────────────┐          ┌─────────────────┐
│[1]    [2]    [3]│          │        [1][2][3]│
└─────────────────┘          └─────────────────┘
```

---

## 5.6 align-items — aligner sur l'axe secondaire

`align-items` contrôle l'alignement sur l'axe **perpendiculaire** — par défaut, l'axe vertical.

```css
.conteneur {
    display: flex;
    align-items: center;
}
```

| Valeur | Effet (en `flex-direction: row`) |
|---|---|
| `stretch` (défaut) | Les éléments s'étirent pour remplir toute la hauteur du conteneur |
| `flex-start` | Alignés en haut |
| `center` | Centrés verticalement |
| `flex-end` | Alignés en bas |

```
align-items: flex-start        align-items: center
┌─────────────────────┐        ┌─────────────────────┐
│[1] [2]      [3]     │        │                      │
│    [2]      [3]     │        │[1] [2]      [3]      │
│             [3]     │        │    [2]      [3]      │
│                      │        │             [3]      │
└─────────────────────┘        └─────────────────────┘
```

> **Mnémotechnique simple :** `justify-content` = la direction "longue" du conteneur (souvent l'axe principal, gauche-droite). `align-items` = la direction "courte" perpendiculaire.

---

## 5.7 gap — l'espacement simple et moderne

Avant `gap`, il fallait ajouter des marges sur chaque élément flex individuellement — fastidieux et source d'erreurs. `gap` règle l'espace **entre** les éléments en une seule ligne, sans toucher aux bords extérieurs.

```css
.conteneur {
    display: flex;
    gap: 16px;
}
```

```
┌──────────────────────────────┐
│ [1]  ←16px→  [2]  ←16px→  [3]│
└──────────────────────────────┘
```

> `gap` fonctionne aussi avec `flex-direction: column` — l'espacement s'applique alors verticalement, entre les lignes.

---

## 5.8 flex-wrap — gérer le débordement

Par défaut, Flexbox essaie de faire rentrer **tous** les éléments sur une seule ligne, même si ça les rétrécit excessivement. `flex-wrap: wrap` autorise le retour à la ligne quand il n'y a plus de place.

```css
.conteneur {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
```

```
nowrap (par défaut)                    wrap
┌─────────────────────┐                ┌─────────────────────┐
│[1][2][3][4][5][6][7]│ ← tout écrasé  │[1][2][3][4]          │
└─────────────────────┘                │[5][6][7]             │
                                        └─────────────────────┘
```

---

## 5.9 Les enfants flexibles : flex-grow et le raccourci flex

Jusqu'ici, on a contrôlé le **conteneur**. On peut aussi contrôler le comportement de **chaque enfant** individuellement.

```css
.enfant {
    flex-grow: 1;     /* cet élément absorbe l'espace disponible */
}
```

Tu as déjà rencontré ce principe sans le savoir : pour répartir équitablement l'espace entre plusieurs éléments (par exemple 4 encarts de même largeur), on utilise le raccourci `flex` :

```css
.attribut {
    flex: 1;     /* tous les éléments avec flex:1 se partagent l'espace à parts égales */
}
```

```
┌───────────────────────────────────┐
│ [  1  ][  2  ][  3  ][  4  ]      │  ← chaque .attribut a flex: 1
└───────────────────────────────────┘     → largeur identique, automatique
```

> `flex: 1` est en réalité un raccourci pour `flex-grow: 1; flex-shrink: 1; flex-basis: 0;` — beaucoup plus pratique à écrire que les trois séparément.

---

## 5.10 Bonus : display: none vs visibility: hidden

Une confusion fréquente qui vaut la peine d'être clarifiée :

```css
.cache-1 { display: none; }       /* disparaît, AUCUN espace réservé */
.cache-2 { visibility: hidden; }  /* invisible, mais l'espace reste réservé */
```

```
display: none                     visibility: hidden
┌──────────────┐                  ┌──────────────┐
│[1]      [3]  │  (2 disparu,     │[1] [ ]  [3]  │  (2 invisible,
│              │   espace réduit) │              │   espace conservé)
└──────────────┘                  └──────────────┘
```

---

## 📦 Récapitulatif

| Propriété | Rôle |
|---|---|
| `display: flex` | Active Flexbox sur le conteneur |
| `flex-direction` | Choisit la direction de l'axe principal (`row`/`column`) |
| `justify-content` | Répartit l'espace sur l'axe **principal** |
| `align-items` | Aligne les éléments sur l'axe **secondaire** |
| `gap` | Espace entre les éléments, sans toucher les bords |
| `flex-wrap: wrap` | Autorise le retour à la ligne si besoin |
| `flex: 1` (sur un enfant) | Répartit l'espace disponible équitablement |
| `display: none` | Élément disparu, aucun espace réservé |
| `visibility: hidden` | Élément invisible, espace toujours réservé |

---

## 🔗 Pour aller plus loin

- [MDN — Les bases de Flexbox](https://developer.mozilla.org/fr/docs/Learn/CSS/CSS_layout/Flexbox)
- [Flexbox Froggy — jeu pour s'entraîner](https://flexboxfroggy.com/) (en anglais, mais 100% visuel)

---

*→ Chapitre suivant : Couleurs et fonds*
