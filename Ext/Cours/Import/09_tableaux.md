# Chapitre 9 — Tableaux HTML

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Construire un tableau HTML avec `<table>`, `<tr>`, `<td>` et `<th>`
- Organiser un tableau en sections avec `<thead>`, `<tbody>`, `<tfoot>`
- Fusionner des cellules avec `colspan` et `rowspan`
- Styliser un tableau de façon lisible avec CSS
- Améliorer l'accessibilité d'un tableau avec `<caption>` et `scope`

---

## 9.1 Pourquoi un tableau ?

Les tableaux HTML servent à présenter des **données structurées en lignes et colonnes** : un emploi du temps, un classement, un tableau de prix, des statistiques...

> ⚠️ **Mise en garde historique :** dans les années 2000, avant l'arrivée de CSS et de Flexbox, les développeurs utilisaient des tableaux pour **mettre en page des sites entiers** (colonnes, menus, structure générale). C'était une mauvaise pratique qui mélangeait structure et présentation. **N'utilise jamais un tableau pour de la mise en page** — pour ça, tu as Flexbox (chapitre 5). Réserve `<table>` exclusivement à de vraies données tabulaires.

---

## 9.2 La structure de base

```html
<table>
    <tr>
        <th>Nom</th>
        <th>Score</th>
    </tr>
    <tr>
        <td>Alex</td>
        <td>87</td>
    </tr>
    <tr>
        <td>Sam</td>
        <td>92</td>
    </tr>
</table>
```

| Balise | Signification | Rôle |
|---|---|---|
| `<table>` | *table* | Le conteneur global du tableau |
| `<tr>` | *table row* | Une ligne |
| `<th>` | *table header* | Une cellule d'**en-tête** (en gras et centré par défaut) |
| `<td>` | *table data* | Une cellule de **donnée** classique |

> Chaque `<tr>` contient autant de `<td>`/`<th>` que de colonnes — le nombre de cellules doit être cohérent sur toutes les lignes pour un tableau bien formé.

---

## 9.3 Organiser le tableau : thead, tbody, tfoot

Sur un tableau un peu long, il est conseillé de regrouper les lignes par section sémantique.

```html
<table>
    <thead>
        <tr>
            <th>Nom</th>
            <th>Score</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>Alex</td><td>87</td></tr>
        <tr><td>Sam</td><td>92</td></tr>
    </tbody>
    <tfoot>
        <tr><td>Moyenne</td><td>89.5</td></tr>
    </tfoot>
</table>
```

| Élément | Rôle |
|---|---|
| `<thead>` | L'en-tête du tableau — généralement une seule ligne de titres de colonnes |
| `<tbody>` | Le corps — toutes les données proprement dites |
| `<tfoot>` | Le pied — totaux, moyennes, résumés |

> Ces trois sections sont **sémantiques** : elles n'affichent rien de différent par défaut, mais elles indiquent clairement la structure logique du tableau, ce qui aide les outils d'accessibilité et facilite le style CSS ciblé.

---

## 9.4 Fusionner des cellules : colspan et rowspan

Parfois, une cellule doit s'étendre sur plusieurs colonnes ou plusieurs lignes.

### colspan — fusion horizontale

```html
<tr>
    <td colspan="2">Cette cellule occupe 2 colonnes</td>
</tr>
```

```
┌─────────────────────────┐
│  Cette cellule occupe   │   ← une seule cellule, large de 2 colonnes
│      2 colonnes         │
├─────────────┬───────────┤
│  Colonne A  │ Colonne B │
└─────────────┴───────────┘
```

### rowspan — fusion verticale

```html
<tr>
    <td rowspan="2">Cette cellule occupe 2 lignes</td>
    <td>Ligne 1, colonne 2</td>
</tr>
<tr>
    <td>Ligne 2, colonne 2</td>
</tr>
```

```
┌──────────────┬────────────────┐
│              │ Ligne 1, col 2 │
│  Cette       ├────────────────┤
│  cellule     │ Ligne 2, col 2 │
│  occupe      │                │
│  2 lignes    │                │
└──────────────┴────────────────┘
```

> **Piège classique :** quand une cellule est fusionnée avec `rowspan`, il faut **retirer** la cellule correspondante dans la ligne suivante — sinon le tableau se décale et devient incohérent. Dans l'exemple ci-dessus, la 2e ligne ne contient qu'**une seule** `<td>`, pas deux.

---

## 9.5 Styliser un tableau avec CSS

### Éviter les doubles bordures

Par défaut, chaque cellule a sa propre bordure, ce qui crée des doubles traits inesthétiques entre les cellules.

```css
table {
    border-collapse: collapse;   /* fusionne les bordures adjacentes en une seule */
}
```

### Aérer le contenu

```css
th, td {
    padding: 10px 14px;
    border: 1px solid #ccc;
    text-align: left;
}
```

### L'effet "zébré" (lignes alternées)

Une technique très répandue pour faciliter la lecture d'un tableau : alterner la couleur de fond des lignes. On utilise pour ça un nouveau type de sélecteur, `:nth-child()`, qui cible un élément selon sa position parmi ses frères.

```css
tbody tr:nth-child(even) {
    background-color: #f4f4f4;   /* cible les lignes paires : 2, 4, 6... */
}
```

> `:nth-child(even)` cible les positions paires, `:nth-child(odd)` les positions impaires. On reverra ce type de sélecteur plus en détail dans un chapitre ultérieur — retiens simplement que ça existe et que c'est exactement l'outil pour cet effet zébré.

---

## 9.6 Accessibilité : caption et scope

### `<caption>` — le titre du tableau

```html
<table>
    <caption>Classement du tournoi de printemps</caption>
    <thead>
        ...
```

`<caption>` donne un titre explicite au tableau, lu par les lecteurs d'écran avant le contenu — pratique pour comprendre immédiatement de quoi il s'agit.

### `scope` — préciser à quoi se rapporte un en-tête

```html
<th scope="col">Nom</th>      <!-- cet en-tête concerne toute une colonne -->
<th scope="row">Lundi</th>    <!-- cet en-tête concerne toute une ligne -->
```

Cet attribut aide les technologies d'assistance à annoncer correctement, pour chaque cellule, à quel en-tête de ligne ET de colonne elle correspond — particulièrement utile sur de grands tableaux complexes.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `<table>` | Réservé aux vraies données tabulaires — jamais pour la mise en page |
| `<tr>` | Une ligne |
| `<th>` vs `<td>` | En-tête (gras, centré) vs donnée classique |
| `<thead>`/`<tbody>`/`<tfoot>` | Structure sémantique du tableau |
| `colspan="n"` | Fusionne `n` colonnes horizontalement |
| `rowspan="n"` | Fusionne `n` lignes verticalement — retirer les cellules couvertes ! |
| `border-collapse: collapse` | Évite les doubles bordures |
| `:nth-child(even)` | Cible les éléments à une position paire — utile pour l'effet zébré |
| `<caption>` | Titre accessible du tableau |
| `scope="col"` / `scope="row"` | Précise la portée d'un en-tête pour l'accessibilité |

---

## 🔗 Pour aller plus loin

- [MDN — Tableaux HTML](https://developer.mozilla.org/fr/docs/Learn/HTML/Tables/Basics)
- [MDN — Accessibilité des tableaux](https://developer.mozilla.org/fr/docs/Learn/HTML/Tables/Advanced)

---

*→ Chapitre suivant : Formulaires HTML*
