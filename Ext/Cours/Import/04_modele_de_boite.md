# Chapitre 4 — Le modèle de boîte

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Décrire les 4 couches du modèle de boîte CSS
- Contrôler les dimensions d'un élément avec `width`, `height`, `padding`, `border`, `margin`
- Comprendre et appliquer la propriété `box-sizing`
- Expliquer le phénomène de fusion des marges
- Gérer les débordements de contenu avec `overflow`
- Arrondir les angles d'un élément avec `border-radius`

---

## 4.1 Tout est une boîte

Voici la règle la plus fondamentale du CSS, celle qui explique absolument tout le reste : **chaque élément HTML est une boîte rectangulaire invisible**. Un titre, un paragraphe, une image, un bouton — tout, sans exception, est une boîte.

### L'analogie du cadeau emballé

Imagine que tu emballes un cadeau :

```
┌─────────────────────────────────┐
│         MARGIN (espace          │  ← l'espace que tu laisses
│      autour de la boîte)        │     entre ce cadeau et les autres
│   ┌─────────────────────────┐   │     paquets sur l'étagère
│   │   BORDER (le carton)    │   │  ← la boîte physique elle-même
│   │  ┌───────────────────┐  │   │
│   │  │  PADDING (papier  │  │   │  ← le papier de soie qui
│   │  │  de soie)         │  │   │     protège le cadeau
│   │  │  ┌─────────────┐  │  │   │
│   │  │  │   CONTENU   │  │  │   │  ← le cadeau lui-même
│   │  │  │  (le cadeau) │  │  │   │
│   │  │  └─────────────┘  │  │   │
│   │  └───────────────────┘  │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

| Couche | Rôle | Analogie |
|---|---|---|
| **Content** | Le contenu réel (texte, image...) | Le cadeau |
| **Padding** | Espace intérieur, entre le contenu et la bordure | Le papier de soie |
| **Border** | La bordure visible de l'élément | Le carton de la boîte |
| **Margin** | Espace extérieur, entre cette boîte et ses voisines | L'espace sur l'étagère |

> **Différence essentielle à retenir :** le **padding** prend la couleur de fond de l'élément (le papier de soie est "dans" la boîte). La **margin** est toujours transparente — elle ne fait que pousser les éléments voisins plus loin.

---

## 4.2 Contrôler les dimensions

### width et height

Définissent la largeur et la hauteur de la boîte de **contenu** (pas du padding ni de la bordure — on verra pourquoi ça pose un piège dans un instant).

```css
.carte {
    width: 300px;
    height: 200px;
}
```

> `width`/`height` ne s'appliquent vraiment que sur des éléments **block** (rappel chapitre suivant) — un élément inline ignore ces propriétés par défaut.

### padding — l'espace intérieur

```css
padding: 20px;                    /* les 4 côtés identiques */
padding: 10px 20px;               /* haut/bas: 10px, gauche/droite: 20px */
padding: 10px 20px 15px 5px;      /* haut, droite, bas, gauche (sens horaire) */

/* Ou côté par côté */
padding-top: 10px;
padding-right: 20px;
padding-bottom: 15px;
padding-left: 5px;
```

### border — la bordure

```css
border: 2px solid black;
/* épaisseur · style · couleur */

border-width: 2px;
border-style: solid;     /* ou dashed, dotted, double... */
border-color: black;
```

### margin — l'espace extérieur

Fonctionne comme `padding` pour la syntaxe, mais avec une astuce en plus :

```css
margin: 20px;              /* les 4 côtés */
margin: 0 auto;            /* haut/bas: 0, gauche/droite: automatique → centre horizontalement ! */
```

> `margin: 0 auto;` est **la** technique classique pour centrer horizontalement un élément block qui a une largeur définie. Tu l'as déjà croisée sans le savoir dans plusieurs de tes exercices précédents.

---

## 4.3 box-sizing — le réglage qui change tout

Voici un piège qui frustre **tous** les débutants en CSS, sans exception.

```css
.boite {
    width: 300px;
    padding: 20px;
    border: 5px solid black;
}
```

Tu t'attends à une boîte de 300px de large. **Faux.** Par défaut, `width` ne concerne que le contenu — le padding et la bordure s'ajoutent **par-dessus**.

```
Largeur réelle = 300px (content) + 20px + 20px (padding) + 5px + 5px (border)
                = 350px !!
```

Ta boîte est 50px plus large que prévu. Sur une mise en page précise, ça casse tout.

### La solution : box-sizing: border-box

```css
.boite {
    box-sizing: border-box;
    width: 300px;
    padding: 20px;
    border: 5px solid black;
}
```

Avec `border-box`, la valeur `width: 300px` inclut **désormais** le padding et la bordure. Le contenu se réduit automatiquement pour que la boîte totale fasse exactement 300px. C'est presque toujours le comportement qu'on veut.

### Le reset universel

C'est pour cette raison que tu as vu cette ligne au tout début de **chacun** des exercices précédents, sans qu'on l'explique encore :

```css
* { box-sizing: border-box; }
```

Le sélecteur `*` cible **tous** les éléments de la page. Cette unique ligne, placée en haut de n'importe quelle feuille de style professionnelle, élimine la quasi-totalité des problèmes de dimensions inattendues. Maintenant que tu sais ce qu'elle fait, tu ne l'oublieras plus.

| Valeur | Comportement |
|---|---|
| `content-box` (par défaut) | `width`/`height` ne couvrent que le contenu — padding et bordure s'ajoutent en plus |
| `border-box` | `width`/`height` incluent le padding ET la bordure — la boîte finale a exactement la taille demandée |

---

## 4.4 La fusion des marges (margin collapse)

Un comportement très particulier des marges **verticales** : quand deux éléments se suivent, leurs marges ne s'additionnent **pas** — elles fusionnent, et seule la plus grande des deux s'applique.

```css
.bloc-1 { margin-bottom: 30px; }
.bloc-2 { margin-top: 20px; }
```

```html
<div class="bloc-1">Premier bloc</div>
<div class="bloc-2">Deuxième bloc</div>
```

On pourrait s'attendre à 50px d'écart entre les deux blocs (30 + 20). **En réalité, l'écart sera de 30px** — la plus grande des deux marges l'emporte, l'autre est ignorée.

> Ce comportement ne concerne QUE les marges **verticales** (haut/bas) entre éléments en flux normal. Les marges horizontales s'additionnent normalement, et ce phénomène ne s'applique pas aux éléments en `flex` (qu'on découvrira au prochain chapitre).

---

## 4.5 Gérer les débordements avec overflow

Que se passe-t-il si le contenu d'un élément est plus grand que la boîte qui le contient ? La propriété `overflow` décide.

```css
.boite {
    width: 200px;
    height: 100px;
    overflow: hidden;     /* le surplus est coupé, invisible */
}
```

| Valeur | Comportement |
|---|---|
| `visible` (par défaut) | Le contenu débordant reste visible, dépasse de la boîte |
| `hidden` | Le contenu débordant est coupé, invisible |
| `scroll` | Des barres de défilement apparaissent (même si pas nécessaire) |
| `auto` | Des barres de défilement apparaissent **seulement si nécessaire** |

> `overflow: auto` est généralement le choix le plus naturel — il n'ajoute une scrollbar que quand c'est réellement utile.

---

## 4.6 Arrondir les angles avec border-radius

```css
.carte {
    border-radius: 12px;    /* même arrondi sur les 4 coins */
}

.avatar {
    border-radius: 50%;     /* astuce classique : transforme un carré en cercle parfait ! */
}
```

On peut aussi définir un arrondi différent par coin (haut-gauche, haut-droite, bas-droite, bas-gauche, dans cet ordre) :

```css
border-radius: 20px 0 20px 0;   /* effet "ticket" en diagonale */
```

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Content | Le contenu réel de l'élément |
| Padding | Espace intérieur — prend la couleur de fond |
| Border | La bordure visible |
| Margin | Espace extérieur — toujours transparent |
| `width`/`height` | Dimensionnent le contenu (sauf si `border-box`) |
| `box-sizing: border-box` | `width`/`height` incluent padding + bordure — **à utiliser presque toujours** |
| `* { box-sizing: border-box; }` | Le reset universel à mettre en haut de chaque feuille de style |
| Fusion des marges | Deux marges verticales adjacentes ne s'additionnent pas — la plus grande gagne |
| `overflow: hidden` | Coupe le contenu qui dépasse |
| `overflow: auto` | Scrollbar uniquement si nécessaire |
| `border-radius: 50%` | Transforme un carré en cercle parfait |
| `margin: 0 auto` | Centre horizontalement un élément block de largeur fixe |

---

## 🔗 Pour aller plus loin

- [MDN — Le modèle de boîte CSS](https://developer.mozilla.org/fr/docs/Learn/CSS/Building_blocks/The_box_model)
- [MDN — box-sizing](https://developer.mozilla.org/fr/docs/Web/CSS/box-sizing)

---

*→ Chapitre suivant : Display et Flexbox*
