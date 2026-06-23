# Chapitre 7 — Typographie et texte

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Définir une famille de polices avec une liste de secours (fallback)
- Importer et utiliser une police personnalisée via Google Fonts
- Distinguer les unités `px`, `em` et `rem` pour la taille du texte
- Maîtriser les propriétés de style et d'alignement du texte
- Appliquer les bonnes pratiques de lisibilité

---

## 7.1 Les familles de polices

```css
body {
    font-family: Arial, sans-serif;
}
```

`font-family` accepte une **liste** de polices, pas une seule. Le navigateur essaie la première ; si elle n'est pas installée sur l'appareil du visiteur, il passe à la suivante, et ainsi de suite. Cette liste de secours s'appelle le **fallback**.

```css
font-family: "Helvetica Neue", Arial, sans-serif;
/*            ↑ tentative 1      ↑ secours 1  ↑ secours générique final */
```

### Les polices "web-safe"

Certaines polices sont installées par défaut sur la quasi-totalité des appareils — on les appelle **web-safe**. Tu peux les utiliser sans aucun risque qu'elles ne s'affichent pas.

| Police | Catégorie |
|---|---|
| Arial, Helvetica | Sans-serif (sans empattement) |
| Georgia, Times New Roman | Serif (avec empattement) |
| Courier New | Monospace (largeur fixe, comme du code) |

### Les 3 catégories génériques

En toute fin de liste, on ajoute toujours une catégorie **générique** — une garantie ultime si aucune police précise n'est disponible.

```css
font-family: Georgia, serif;        /* avec empattements, classique */
font-family: Arial, sans-serif;     /* sans empattement, moderne */
font-family: "Courier New", monospace;  /* largeur fixe, style "code" */
```

> Si le nom d'une police contient un **espace**, il faut le mettre entre guillemets : `"Times New Roman"`, `"Courier New"`.

---

## 7.2 Importer une police personnalisée avec Google Fonts

Les polices web-safe sont limitées et un peu datées visuellement. **Google Fonts** propose des centaines de polices gratuites, faciles à intégrer.

### Étapes d'intégration

1. Va sur [fonts.google.com](https://fonts.google.com) et choisis une police.
2. Sélectionne les graisses (*weights*) dont tu as besoin (400 = normal, 700 = gras...).
3. Copie le code `<link>` fourni, et colle-le dans le `<head>` de ta page.
4. Utilise le nom de la police dans ton CSS, avec un fallback générique.

```html
<head>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
</head>
```

```css
body {
    font-family: "Poppins", sans-serif;
}

h1 {
    font-family: "Poppins", sans-serif;
    font-weight: 700;   /* utilise la graisse importée ci-dessus */
}
```

> ⚠️ **Important :** tu ne peux utiliser que les graisses que tu as explicitement importées dans l'URL (`wght@400;700`). Demander `font-weight: 900` sans l'avoir importée ne provoque pas d'erreur, mais le navigateur "fabrique" un faux gras dégradé visuellement — toujours importer toutes les graisses dont tu as besoin.

---

## 7.3 Les unités de taille : px, em et rem

### px — taille fixe absolue

```css
p { font-size: 16px; }
```

Une taille fixe, qui ne change jamais quel que soit le contexte. Simple, mais rigide.

### em — relatif au parent

```css
.parent { font-size: 20px; }
.enfant { font-size: 1.5em; }   /* 1.5 × 20px = 30px */
```

`em` se calcule **par rapport à la taille de police de l'élément parent**. Piège classique : si tu imbriques plusieurs éléments en `em`, les valeurs se **multiplient en cascade**.

```css
.niveau-1 { font-size: 1.5em; }              /* 1.5 × 16px = 24px */
.niveau-1 .niveau-2 { font-size: 1.5em; }    /* 1.5 × 24px = 36px, pas 1.5 × 16px ! */
```

### rem — relatif à la racine (recommandé)

```css
html { font-size: 16px; }    /* définit la référence */
.titre { font-size: 2rem; }  /* = 32px, TOUJOURS, peu importe l'imbrication */
```

`rem` se calcule uniquement par rapport à la taille de police définie sur `<html>` — jamais par rapport au parent direct. Aucun effet de cascade multiplicative, peu importe la profondeur d'imbrication.

> **Recommandation actuelle :** utilise `rem` pour les tailles de texte dans tes projets. C'est prévisible, cohérent, et c'est la pratique standard de l'industrie aujourd'hui.

---

## 7.4 Style et poids du texte

```css
p {
    font-weight: bold;        /* ou normal, ou une valeur numérique : 400, 700... */
    font-style: italic;       /* ou normal */
    text-decoration: underline;   /* ou none, line-through, overline */
}
```

| Propriété | Valeurs courantes |
|---|---|
| `font-weight` | `normal` (400), `bold` (700), ou une valeur numérique précise |
| `font-style` | `normal`, `italic` |
| `text-decoration` | `none`, `underline`, `line-through`, `overline` |

> `text-decoration: none;` est la première ligne qu'on écrit presque systématiquement sur des liens `<a>` — par défaut, ils sont soulignés, ce qui n'est pas toujours le style voulu.

---

## 7.5 Alignement et espacement

```css
p {
    text-align: center;       /* left (défaut), right, center, justify */
    line-height: 1.6;         /* hauteur de ligne — favorise la lisibilité */
    letter-spacing: 1px;      /* espace entre les lettres */
    word-spacing: 3px;        /* espace entre les mots */
}
```

| Propriété | Rôle |
|---|---|
| `text-align` | Alignement horizontal du texte dans son conteneur |
| `line-height` | Hauteur de chaque ligne — une valeur de `1.5` à `1.8` améliore nettement la lisibilité de longs paragraphes |
| `letter-spacing` | Espace entre chaque caractère — utile pour des titres en majuscules, par exemple |
| `word-spacing` | Espace entre chaque mot |

> `line-height` sans unité (juste `1.6`) est un **multiplicateur** de la taille de police actuelle — c'est la syntaxe recommandée, car elle reste cohérente même si la taille du texte change ailleurs.

---

## 7.6 Transformer la casse du texte

```css
h1 {
    text-transform: uppercase;    /* TOUT EN MAJUSCULES */
}
```

| Valeur | Effet |
|---|---|
| `uppercase` | TOUT EN MAJUSCULES |
| `lowercase` | tout en minuscules |
| `capitalize` | Première Lettre De Chaque Mot En Majuscule |
| `none` (défaut) | Aucune transformation |

> Astuce pratique : écris ton texte HTML normalement (avec la bonne casse grammaticale), et utilise `text-transform: uppercase` en CSS pour l'afficher en majuscules. Si jamais tu changes d'avis sur le style, il suffit de modifier une ligne de CSS — pas tout ton contenu HTML.

---

## 7.7 Bonnes pratiques de lisibilité

- **Taille minimale recommandée pour du texte courant : 16px (ou `1rem`)** — en dessous, la lecture devient inconfortable, surtout sur mobile.
- **Contraste suffisant** entre le texte et le fond — un gris clair sur fond blanc est élégant, mais souvent illisible. En cas de doute, vérifie avec un outil de contraste en ligne.
- **`line-height` généreux** sur les longs paragraphes (1.5 à 1.8) — un texte trop "serré" verticalement fatigue la lecture.
- **Pas plus de 2-3 polices différentes** par site — au-delà, la page devient visuellement chaotique.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `font-family` | Liste de polices avec fallback, termine toujours par une catégorie générique |
| Police web-safe | Installée partout par défaut (Arial, Georgia, Courier New...) |
| Google Fonts | `<link>` dans le head + nom de police en CSS — importer les graisses nécessaires |
| `px` | Taille fixe, ne dépend de rien |
| `em` | Relatif au parent — risque de cascade multiplicative si imbriqué |
| `rem` | Relatif à la racine — prévisible, **recommandé** |
| `font-weight` | `normal` / `bold` / valeur numérique |
| `text-decoration: none` | À utiliser systématiquement pour retirer le soulignement des liens |
| `line-height: 1.6` | Améliore nettement la lisibilité d'un long texte |
| `text-transform: uppercase` | Transformation visuelle, sans toucher au texte HTML réel |

---

## 🔗 Pour aller plus loin

- [Google Fonts](https://fonts.google.com)
- [MDN — Mise en forme du texte](https://developer.mozilla.org/fr/docs/Learn/CSS/Styling_text/Fundamentals)

---

*→ Chapitre suivant : Médias — images, audio, vidéo*
