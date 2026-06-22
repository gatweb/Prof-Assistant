# Chapitre 1 — Introduction au HTML

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer ce qu'est le HTML et le rôle qu'il joue sur le web
- Identifier les notions d'élément, de balise et d'attribut
- Construire le squelette valide d'une page HTML
- Expliquer les codes de caractères (ASCII, UTF-8) et leur utilité
- Respecter les bonnes pratiques : indentation, commentaires, nommage de fichiers

---

## 1.1 Qu'est-ce que le HTML ?

**HTML** signifie *HyperText Markup Language* — littéralement "langage de balisage hypertexte". C'est le langage qui donne sa **structure** à toute page web que tu visites.

Pense à la construction d'une maison :

```
HTML  → la structure  (murs, pièces, fondations)
CSS   → la décoration (peinture, meubles, ambiance)
JS    → l'électricité (interactions, mouvement, vie)
```

Sans HTML, il n'y a tout simplement pas de page — rien à décorer, rien à animer. C'est la toute première brique de tout site web, aussi simple qu'une page Wikipédia ou aussi complexe qu'un jeu en ligne.

> HTML n'est **pas** un langage de programmation — il n'y a pas de boucles, pas de conditions, pas de calculs. C'est un langage de **balisage** : il décrit *ce qu'est* un contenu (un titre, une image, un lien), pas *ce qu'il faut faire*.

---

## 1.2 Éléments, balises et attributs

### Élément

Un **élément** est un composant de base d'une page : un titre, un paragraphe, une image, un lien... Tout ce que tu vois (ou ne vois pas) sur une page web est un élément HTML.

### Balise

Les éléments sont représentés par des **balises**, délimitées par des chevrons `<` et `>`.

```html
<p>Ceci est un paragraphe.</p>
```

La plupart des éléments ont une **balise ouvrante** et une **balise fermante**, avec le contenu entre les deux. La balise fermante reprend le même nom, précédé d'un `/`.

Certains éléments n'ont pas de contenu et donc pas de balise fermante — on les appelle des **balises orphelines** (ou *self-closing*) :

```html
<br>           <!-- saut de ligne -->
<img src="...">  <!-- image -->
<meta charset="UTF-8">  <!-- métadonnée -->
```

### Attribut

Un **attribut** fournit une information supplémentaire sur un élément. Il se place dans la balise ouvrante, sous la forme `nom="valeur"`.

```html
<img src="chaton.jpg" alt="Un chaton roux qui dort">
```

Ici, `src` indique où trouver l'image, `alt` décrit son contenu (utile si l'image ne charge pas, ou pour les personnes malvoyantes). Un élément peut avoir plusieurs attributs, séparés par des espaces.

---

## 1.3 Structure d'une page HTML

Une page HTML valide suit toujours le même squelette de base :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ma page web</title>
</head>
<body>

    <!-- Tout le contenu visible va ici -->

</body>
</html>
```

| Élément | Rôle |
|---|---|
| `<!DOCTYPE html>` | Déclare qu'on utilise HTML5 — toujours en première ligne |
| `<html>` | Encapsule tout le document |
| `<head>` | Informations invisibles sur la page (titre, encodage, liens CSS...) |
| `<title>` | Titre affiché dans l'onglet du navigateur |
| `<meta charset="...">` | Précise l'encodage des caractères (voir section suivante) |
| `<body>` | Tout le contenu visible : texte, images, liens... |

> L'attribut `lang="fr"` sur `<html>` indique aux navigateurs et lecteurs d'écran que la page est en français. Petit détail, grand impact pour l'accessibilité.

---

## 1.4 Les codes de caractères

Voici une question qu'on se pose rarement : comment un ordinateur, qui ne comprend que des `0` et des `1`, sait-il afficher la lettre **"é"** ou l'emoji **"🚀"** ?

La réponse : un **code de caractères** (ou *encodage*) est une table de correspondance entre des nombres binaires et des caractères affichables. Chaque caractère possède un numéro ; l'encodage définit comment ce numéro est stocké en mémoire.

### ASCII — l'ancêtre (1963)

ASCII utilise 7 bits, ce qui permet de coder **128 caractères**. Largement suffisant pour l'anglais (lettres, chiffres, ponctuation de base) — mais aucun accent, aucun caractère spécial.

```
65 → "A"     97 → "a"     48 → "0"
```

Problème : impossible d'écrire "é", "ç", "€" ou tout caractère non-anglais avec ASCII seul.

### ISO 8859-1 et ISO 8859-15 — l'extension européenne

Ces encodages utilisent 8 bits (256 caractères possibles) pour ajouter les caractères accentués européens (é, à, ü, ñ...). La version **ISO 8859-15** ajoute en plus le symbole **€**, absent de la version originale.

Toujours limité : 256 caractères, c'est largement insuffisant pour couvrir toutes les langues du monde (chinois, arabe, emojis...).

### UTF-8 — le standard universel actuel

**UTF-8** peut représenter **n'importe quel caractère existant** — tous les alphabets, tous les symboles, tous les emojis 🎉. C'est l'encodage utilisé par la quasi-totalité du web aujourd'hui, et celui que tu dois **toujours** utiliser.

```html
<meta charset="UTF-8">
```

### Pourquoi c'est important de le déclarer ?

Si le navigateur ne sait pas quel encodage utiliser pour lire ton fichier, il devine — et il devine parfois mal. Résultat : un texte illisible, appelé *mojibake*.

```
Texte voulu :    café à 5€
Mauvais encodage : cafÃ© Ã  5â‚¬
```

C'est exactement ce qui se passe quand `<meta charset="UTF-8">` est absent ou incorrect. Une seule ligne dans le `<head>`, et ce problème n'existe jamais.

---

## 1.5 Imbrication des éléments

Les éléments HTML peuvent être **imbriqués** les uns dans les autres pour créer une structure hiérarchique — un peu comme des poupées russes.

```html
<body>
    <div>
        <h1>Titre</h1>
        <p>Un paragraphe <strong>avec du gras</strong> dedans.</p>
    </div>
</body>
```

**Règle d'or :** le dernier élément ouvert doit être le premier fermé. On appelle ça l'imbrication correcte (ou *bien formée*).

```html
<!-- ✅ Bien imbriqué -->
<p>Texte <strong>important</strong></p>

<!-- ❌ Mal imbriqué — les balises se chevauchent -->
<p>Texte <strong>important</p></strong>
```

---

## 1.6 Enregistrer et afficher une page

Pour créer une page HTML, il suffit de créer un fichier texte et de l'enregistrer avec l'extension `.html`.

**Règles de nommage à respecter :**
- Pas d'espace, pas d'accent, pas de caractère spécial
- Le nom doit commencer par une lettre
- Utilise des tirets ou underscores pour séparer les mots : `page-contact.html`, pas `page contact.html`

Pour afficher la page, double-clique simplement sur le fichier — il s'ouvre dans ton navigateur par défaut.

---

## 1.7 Bonnes pratiques

### Indentation

L'indentation (espaces ou tabulations en début de ligne) montre visuellement la hiérarchie du code. Ce n'est pas obligatoire pour que le navigateur affiche la page — mais c'est indispensable pour que **toi**, et n'importe qui d'autre, puisse relire et comprendre le code facilement.

```html
<!-- ❌ Sans indentation : illisible -->
<body>
<h1>Titre</h1>
<p>Texte</p>
</body>

<!-- ✅ Avec indentation : la structure est immédiatement visible -->
<body>
    <h1>Titre</h1>
    <p>Texte</p>
</body>
```

### Commentaires

Les commentaires sont ignorés par le navigateur — ils servent uniquement à documenter ton code pour les humains.

```html
<!-- Ceci est un commentaire -->
<!-- Section : à propos de moi -->
<p>Je m'appelle...</p>
```

> ⚠️ **Attention :** un commentaire HTML est visible dans le code source de la page (clic droit → "Afficher le code source"). N'y mets jamais d'information sensible ou confidentielle.

---

## 1.8 Titres et paragraphes

### Les titres

Six niveaux de titres existent, de `<h1>` (le plus important) à `<h6>` (le moins important). Ils structurent et hiérarchisent le contenu — un peu comme un plan de dissertation.

```html
<h1>Titre principal de la page</h1>
<h2>Une grande section</h2>
<h3>Une sous-section</h3>
```

> **Règle :** `<h1>` ne s'utilise qu'**une seule fois** par page (ou par section). C'est le titre le plus important — les moteurs de recherche s'en servent pour comprendre le sujet de ta page.

### Les paragraphes

L'élément `<p>` organise le texte en blocs distincts.

```html
<p>Premier paragraphe.</p>
<p>Deuxième paragraphe, bien séparé du premier.</p>
```

---

## 1.9 Espaces et retours à la ligne

Voici un piège classique pour les débutants : **le HTML ignore les espaces et retours à la ligne multiples** dans ton code source. Que tu écrives ton paragraphe sur une ligne ou sur dix, le résultat affiché sera identique — tous les espaces consécutifs sont réduits à un seul.

```html
<!-- Ces deux écritures donnent EXACTEMENT le même résultat affiché -->

<p>Bonjour    le     monde</p>

<p>Bonjour
        le
   monde</p>
```

Pour forcer un saut de ligne visible, il faut utiliser la balise `<br>` :

```html
<p>Première ligne<br>Deuxième ligne</p>
```

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Élément | Composant de base (titre, paragraphe, image...) |
| Balise | `<nom>...</nom>` — représente un élément |
| Attribut | `nom="valeur"` — info supplémentaire dans la balise ouvrante |
| `<!DOCTYPE html>` | Toujours en première ligne |
| `<head>` | Infos invisibles (titre, encodage) |
| `<body>` | Contenu visible |
| UTF-8 | Encodage universel — toujours le déclarer avec `<meta charset="UTF-8">` |
| Imbrication | Le dernier élément ouvert est le premier fermé |
| `<h1>` à `<h6>` | Titres hiérarchisés, `<h1>` une seule fois par page |
| Espaces multiples | Réduits à un seul espace par le navigateur — utiliser `<br>` pour forcer un saut de ligne |

---

## 🔗 Pour aller plus loin

- [MDN — Introduction au HTML](https://developer.mozilla.org/fr/docs/Learn/Getting_started_with_the_web/HTML_basics)
- [W3Schools — Liste complète des balises HTML](https://www.w3schools.com/html/)

---

*→ Chapitre suivant : Arborescence et navigation*
