# Chapitre 11 — Sélecteurs avancés

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Utiliser les combinateurs de voisinage (`+` et `~`)
- Cibler des éléments selon leurs attributs HTML, sans ajouter de classe
- Combiner plusieurs techniques de sélection pour styliser avec précision
- Utiliser des sélecteurs d'attributs comme outil de débogage visuel

---

## 11.1 Rappel express des combinateurs déjà vus

Au chapitre 3, on a découvert trois combinateurs de base :

| Combinateur | Exemple | Cible |
|---|---|---|
| `,` (groupe) | `h1, h2` | Plusieurs sélecteurs en une règle |
| ` ` (descendant) | `nav a` | À l'intérieur, à toute profondeur |
| `>` (enfant direct) | `nav > a` | Un cran plus bas seulement |

Il en manque deux : les combinateurs de **voisinage**.

---

## 11.2 Les combinateurs de voisinage

### `+` — le frère immédiatement suivant

Cible un élément **uniquement s'il suit directement** un autre élément précis, au même niveau.

```css
h2 + p {
    font-weight: bold;
}
```

```html
<h2>Introduction</h2>
<p>Ce paragraphe est en gras — il suit directement le h2.</p>
<p>Ce second paragraphe N'est PAS en gras — il ne suit pas directement le h2.</p>
```

Usage classique : styliser différemment le **premier paragraphe** qui suit un titre, pour créer un effet d'accroche visuelle.

### `~` — tous les frères suivants

Cible **tous** les éléments suivants du même type, peu importe combien il y en a entre eux.

```css
.actif ~ li {
    opacity: 0.5;
}
```

```html
<ul>
    <li>Étape 1</li>
    <li class="actif">Étape 2 (en cours)</li>
    <li>Étape 3</li>
    <li>Étape 4</li>
</ul>
```

Ici, **toutes** les étapes après celle marquée `.actif` sont estompées — un exemple typique d'indicateur de progression (étapes restantes grisées).

```
+ (frère immédiat)              ~ (tous les frères suivants)
┌──────┐                        ┌──────┐
│ h2   │                        │ .actif│
├──────┤                        ├──────┤
│ p ✓  │ ← seul celui-ci         │ li ✓ │ ← tous ceux après
├──────┤    est ciblé            ├──────┤    sont ciblés
│ p    │                        │ li ✓ │
└──────┘                        └──────┘
```

---

## 11.3 Les sélecteurs d'attributs

Plutôt que d'ajouter une classe à chaque élément, on peut cibler directement un élément selon la **présence** ou la **valeur** d'un de ses attributs HTML.

### Présence d'un attribut

```css
input[required] {
    border-color: orange;
}
```

Cible tout `<input>` qui possède l'attribut `required`, peu importe sa valeur.

### Valeur exacte

```css
input[type="email"] {
    background-color: #f0f9ff;
}
```

Cible précisément les champs dont l'attribut `type` vaut exactement `"email"`.

### Commence par...

```css
a[href^="https://"] {
    color: green;
}
```

`^=` signifie "commence par". Utile pour repérer des liens externes sécurisés sans avoir à les marquer manuellement d'une classe.

### Se termine par...

```css
a[href$=".pdf"] {
    color: red;
    font-weight: bold;
}
```

`$=` signifie "se termine par". Idéal pour styliser automatiquement tous les liens de téléchargement d'un certain type de fichier.

### Contient...

```css
a[href*="youtube"] {
    color: #ff0000;
}
```

`*=` signifie "contient, n'importe où dans la valeur". Cible ici tout lien dont l'URL contient le mot "youtube", peu importe où.

| Syntaxe | Signification | Exemple d'usage |
|---|---|---|
| `[attr]` | L'attribut existe | `input[required]` |
| `[attr="val"]` | Valeur exactement égale | `input[type="email"]` |
| `[attr^="val"]` | Commence par | `a[href^="https"]` |
| `[attr$="val"]` | Se termine par | `a[href$=".pdf"]` |
| `[attr*="val"]` | Contient | `a[href*="youtube"]` |

---

## 11.4 Astuce : un sélecteur d'attribut comme outil de débogage

Voici une utilisation maligne et très concrète, qui fait le lien avec le chapitre 8 sur l'accessibilité des images.

```css
img[alt=""] {
    border: 4px solid red;
}
```

Cette règle repère **visuellement**, en un instant, toutes les images de ta page qui ont un attribut `alt` **vide** — donc un problème d'accessibilité. Colle cette ligne temporairement dans ton CSS pendant le développement, corrige les `alt` vides repérés, puis retire la règle. C'est exactement le genre de réflexe qu'ont les développeurs professionnels pour s'auto-corriger rapidement.

---

## 11.5 Combiner plusieurs techniques

Rien n'empêche de combiner sélecteur d'attribut et combinateur dans une seule règle, pour une précision chirurgicale.

```css
form input[type="text"]:focus {
    border-color: blue;
}
```

Cette règle ne cible que les champs `text` (sélecteur d'attribut), à l'intérieur d'un `form` (descendant), uniquement quand ils ont le focus (pseudo-classe `:focus`, déjà rencontrée indirectement avec `:hover`).

---

## 📦 Récapitulatif

| Sélecteur | Cible |
|---|---|
| `h2 + p` | Le frère immédiatement suivant |
| `.actif ~ li` | Tous les frères suivants, peu importe leur nombre |
| `[required]` | Présence d'un attribut |
| `[type="email"]` | Valeur exacte d'un attribut |
| `[href^="https"]` | Commence par une valeur donnée |
| `[href$=".pdf"]` | Se termine par une valeur donnée |
| `[href*="mot"]` | Contient une valeur, n'importe où |
| `img[alt=""]` | Astuce de débogage — repère les images sans texte alternatif |

---

## 🎓 Tu as terminé la Partie 1 !

Avec ce chapitre, tu as couvert l'ensemble des fondamentaux HTML et CSS : structure, navigation, modèle de boîte, Flexbox, couleurs, typographie, médias, tableaux, formulaires, et maintenant les sélecteurs avancés. Tu disposes de tous les outils nécessaires pour construire un site web multi-pages complet, structuré et bien stylisé.

---

## 🔗 Pour aller plus loin

- [MDN — Sélecteurs d'attributs](https://developer.mozilla.org/fr/docs/Web/CSS/Attribute_selectors)
- [MDN — Combinateurs CSS](https://developer.mozilla.org/fr/docs/Web/CSS/CSS_selectors/Combinators)

---

*Fin de la Partie 1 — UAA3 Création du site web*
