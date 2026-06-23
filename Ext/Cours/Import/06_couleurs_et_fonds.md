# Chapitre 6 — Couleurs et fonds

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer le fonctionnement des bases numériques 2 et 16
- Expliquer la synthèse additive des couleurs (RGB)
- Convertir une couleur RGB en notation hexadécimale
- Utiliser les différentes syntaxes CSS pour définir une couleur
- Appliquer des fonds (couleur, image, dégradé) à un élément
- Créer des ombres avec `box-shadow`

---

## 6.1 Les bases numériques — pourquoi on en parle ici

Tu vas bientôt écrire des couleurs comme `#ff6b35` sans réfléchir. Mais que signifient réellement ces caractères ? Pour le comprendre, il faut faire un petit détour par la façon dont les ordinateurs représentent les nombres.

### La base 10 — celle que tu utilises sans y penser

Le système que tu utilises depuis l'école primaire est en **base 10** (système décimal) : 10 chiffres possibles (0 à 9) par position.

```
347 = 3×100 + 4×10 + 7×1
```

### La base 2 (binaire) — le langage des ordinateurs

Un ordinateur ne connaît que deux états électriques : courant **ou** pas de courant. La **base 2** (binaire) n'utilise donc que **2 chiffres : 0 et 1**.

```
Binaire    1011
         = 1×8 + 0×4 + 1×2 + 1×1
         = 8 + 0 + 2 + 1
         = 11 en base 10
```

Chaque position vaut une puissance de 2 (1, 2, 4, 8, 16, 32...) au lieu d'une puissance de 10.

### La base 16 (hexadécimale) — un compromis pratique

Écrire de grands nombres en binaire devient vite long et illisible. La **base 16** (hexadécimale) regroupe l'information de façon plus compacte, en utilisant **16 symboles** : les chiffres `0-9`, puis les lettres `A-F` pour représenter les valeurs 10 à 15.

| Décimal | Hexadécimal | Décimal | Hexadécimal |
|---|---|---|---|
| 0 | 0 | 8 | 8 |
| 1 | 1 | 9 | 9 |
| 2 | 2 | 10 | **A** |
| 3 | 3 | 11 | **B** |
| 4 | 4 | 12 | **C** |
| 5 | 5 | 13 | **D** |
| 6 | 6 | 14 | **E** |
| 7 | 7 | 15 | **F** |

> Pourquoi la base 16 spécifiquement ? Parce que **4 chiffres binaires** (de `0000` à `1111`) représentent **exactement** les 16 valeurs de 0 à 15 — un seul caractère hexadécimal résume parfaitement 4 bits. C'est un alignement mathématique idéal, pas un hasard.

```
Binaire : 1111 1111
Hexa    :   F    F
Décimal :  255

Binaire : 0010 1100
Hexa    :   2    C
Décimal :   44
```

C'est exactement ce mécanisme qui rend les codes couleurs CSS possibles, comme tu vas le voir.

---

## 6.2 La synthèse additive des couleurs (RGB)

### Comment l'œil humain perçoit la couleur

Un écran n'utilise pas de peinture — il **émet de la lumière**. Chaque pixel de ton écran est en réalité composé de trois minuscules sources lumineuses : une **rouge**, une **verte**, une **bleue**. C'est ce qu'on appelle la **synthèse additive** : on combine des lumières colorées pour créer toutes les autres couleurs, en ajoutant leur intensité.

```
Rouge + Vert + Bleu (tous à fond)  →  Blanc
Aucune lumière (les 3 à zéro)      →  Noir
Rouge seul                          →  Rouge
Rouge + Vert (sans bleu)            →  Jaune
```

> C'est l'opposé de la peinture (synthèse **soustractive**) : mélanger toutes les couleurs de peinture donne du noir/marron, alors que mélanger toutes les lumières colorées donne du blanc.

### Le modèle RGB en CSS

**RGB** = *Red, Green, Blue* (rouge, vert, bleu). Chaque composante varie de **0 à 255** — soit 256 intensités possibles par couleur (de "éteint" à "intensité maximale").

```css
.element {
    color: rgb(255, 0, 0);       /* rouge pur */
    color: rgb(0, 255, 0);       /* vert pur */
    color: rgb(0, 0, 255);       /* bleu pur */
    color: rgb(255, 255, 255);   /* blanc — les 3 au maximum */
    color: rgb(0, 0, 0);         /* noir — les 3 à zéro */
    color: rgb(255, 255, 0);     /* jaune — rouge + vert, sans bleu */
}
```

**Pourquoi 256 (0 à 255) précisément ?** Parce que chaque composante est stockée sur **8 bits** (un octet), et 8 bits en binaire permettent exactement 256 valeurs différentes (de `00000000` à `11111111`).

```
8 bits  =  2⁸  =  256 valeurs possibles  →  de 0 à 255
```

---

## 6.3 Transcoder RGB en hexadécimal

Voici enfin le lien entre tout ce qu'on vient de voir. Une couleur CSS en notation hexadécimale, comme `#ff6b35`, encode en réalité **trois valeurs RGB**, simplement écrites différemment.

```
#  ff   6b   35
   ↓    ↓    ↓
   R    G    B
  255  107   53
```

Chaque paire de caractères hexadécimaux représente **une composante** (R, G ou B), sur une échelle de `00` (0 en décimal) à `ff` (255 en décimal).

### Convertir une valeur RGB en hexadécimal — la méthode

Prenons R = 255 :
```
255 en binaire = 1111 1111
Découpe en 2 groupes de 4 bits : 1111 | 1111
Conversion en hexa : 1111 = F  et  1111 = F
255 → FF
```

Prenons G = 107 :
```
107 en binaire = 0110 1011
Découpe : 0110 | 1011
Conversion : 0110 = 6  et  1011 = B
107 → 6B
```

> Pas d'inquiétude si la conversion binaire → hexadécimal demande de l'entraînement — l'essentiel à retenir pour le cours, c'est **pourquoi** `#ff6b35` correspond à `rgb(255, 107, 53)`, pas nécessairement de refaire la conversion manuelle à chaque fois (les outils et les sélecteurs de couleur le font pour toi en pratique).

### Les syntaxes de couleur en CSS — équivalentes

```css
color: rgb(255, 107, 53);     /* notation RGB directe */
color: #ff6b35;                /* notation hexadécimale — équivalente ! */
color: #FF6B35;                /* la casse n'a aucune importance */
color: orangered;              /* nom de couleur prédéfini (limité, ~150 noms) */
```

### La transparence — RGBA et le canal alpha

Un quatrième canal, **alpha**, contrôle l'opacité (0 = invisible, 1 = totalement opaque).

```css
background-color: rgba(255, 0, 0, 0.5);   /* rouge à 50% d'opacité */
background-color: rgba(0, 0, 0, 0.8);     /* noir à 80% d'opacité — quasi opaque */
```

---

## 6.4 Appliquer des fonds

### Couleur de fond simple

```css
.boite {
    background-color: #1a1a2e;
}
```

### Image de fond

```css
.banniere {
    background-image: url("photo.jpg");
    background-size: cover;        /* l'image couvre toute la boîte, sans déformation */
    background-position: center;   /* centrée */
    background-repeat: no-repeat;  /* ne se répète pas */
}
```

| Propriété | Rôle |
|---|---|
| `background-size: cover` | Remplit toute la boîte, recadre si besoin, sans étirer |
| `background-size: contain` | L'image entière reste visible, peut laisser des bandes vides |
| `background-position` | Positionne l'image (`center`, `top`, `bottom`, ou des valeurs précises) |
| `background-repeat: no-repeat` | Empêche la répétition automatique en mosaïque |

### Dégradés (gradients)

Un dégradé est généré **par le CSS lui-même** — pas besoin d'image.

```css
.banniere {
    background: linear-gradient(to right, #ff6b35, #4f46e5);
}

.cercle {
    background: radial-gradient(circle, #ffffff, #1a1a2e);
}
```

`linear-gradient` se déplace en ligne droite (`to right`, `to bottom`, ou un angle en degrés comme `45deg`). `radial-gradient` rayonne depuis un point central.

---

## 6.5 box-shadow — donner du relief

```css
.carte {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    /*           ↑    ↑    ↑         ↑
              décalage  flou    couleur+transparence
              horizontal/vertical
    */
}
```

| Valeur | Rôle |
|---|---|
| 1er chiffre | Décalage horizontal (0 = pas de décalage) |
| 2e chiffre | Décalage vertical (positif = ombre vers le bas) |
| 3e chiffre | Flou — plus la valeur est grande, plus l'ombre est diffuse |
| Couleur | Souvent `rgba()` avec une transparence pour un effet naturel |

> Utiliser `rgba(0,0,0, 0.3)` plutôt que `black` pur pour une ombre donne un résultat bien plus doux et réaliste — c'est une astuce de pro à retenir.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Base 2 (binaire) | 2 chiffres (0,1) — le langage natif des ordinateurs |
| Base 16 (hexadécimal) | 16 symboles (0-9, A-F) — 1 caractère = 4 bits exactement |
| Synthèse additive | Mélanger des lumières colorées (R+V+B) — tout au max = blanc |
| RGB | 3 composantes de 0 à 255 (8 bits chacune = 256 valeurs) |
| `#ff6b35` | Notation hexadécimale — chaque paire = une composante R, G, B |
| `rgba(r,g,b,a)` | Le 4e paramètre (alpha) contrôle la transparence |
| `background-size: cover` | Remplit la boîte sans déformer l'image |
| `linear-gradient` / `radial-gradient` | Dégradés générés en CSS pur |
| `box-shadow` | décalage X, décalage Y, flou, couleur |

---

## 🔗 Pour aller plus loin

- [MDN — Valeurs de couleur CSS](https://developer.mozilla.org/fr/docs/Web/CSS/color_value)
- [MDN — Dégradés CSS](https://developer.mozilla.org/fr/docs/Web/CSS/CSS_images/Using_CSS_gradients)

---

*→ Chapitre suivant : Typographie et texte*
