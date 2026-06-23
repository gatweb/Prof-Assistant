# Chapitre 2 — Arborescence et navigation

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Expliquer pourquoi un site web s'organise en plusieurs fichiers et dossiers
- Lire et construire une arborescence de fichiers
- Distinguer un lien relatif d'un lien absolu
- Associer un chemin relatif à une arborescence donnée
- Utiliser la balise `<a>` pour créer la navigation entre plusieurs pages

---

## 2.1 Pourquoi plusieurs fichiers ?

Jusqu'ici, tu as travaillé sur **une seule page** HTML. Mais un vrai site web — un blog, une boutique en ligne, le site d'une école — contient presque toujours **plusieurs pages** : une page d'accueil, une page "À propos", une page "Contact"...

Chaque page est un **fichier `.html` séparé**. Pour qu'un visiteur puisse passer de l'une à l'autre, il faut deux choses :
1. **Organiser** ces fichiers de façon cohérente (l'arborescence)
2. **Créer des liens** entre eux (la navigation)

C'est exactement ce qu'on apprend dans ce chapitre.

---

## 2.2 L'arborescence de fichiers — la carte de ton site

Une **arborescence** (ou *structure de dossiers*) est l'organisation hiérarchique des fichiers et dossiers d'un projet — un peu comme l'arborescence généalogique d'une famille, mais pour des fichiers.

Voici un exemple typique pour un petit site web :

```
mon-site/
├── index.html
├── style.css
├── images/
│   ├── logo.png
│   └── photo-profil.jpg
└── pages/
    ├── a-propos.html
    └── contact.html
```

| Terme | Signification |
|---|---|
| `mon-site/` | Le **dossier racine** — celui qui contient tout le projet |
| `index.html` | La page d'accueil — c'est la convention universelle du web |
| `style.css` | La feuille de style, à la racine pour être facilement accessible |
| `images/` | Un **sous-dossier** qui regroupe toutes les images |
| `pages/` | Un sous-dossier qui regroupe les pages secondaires |

> **Convention universelle :** la page d'accueil d'un site s'appelle presque toujours `index.html`. Quand un navigateur charge une adresse sans préciser de fichier (ex: `monsite.com/`), c'est `index.html` qu'il va chercher en premier.

### Pourquoi organiser en sous-dossiers ?

Imagine un site avec 50 images et 20 pages, tout balancé en vrac dans un seul dossier — un vrai cauchemar à naviguer. Organiser par type (`images/`, `css/`, `pages/`) rend le projet lisible, maintenable, et évite de chercher une aiguille dans une botte de foin.

---

## 2.3 Le chemin d'accès (path)

Un **chemin** (ou *path*) est l'adresse d'un fichier à l'intérieur de l'arborescence — l'équivalent d'une adresse postale, mais pour un fichier.

Donner un chemin, c'est comme donner une direction à quelqu'un :
- *"Le fichier est dans le dossier où tu es déjà"* → même dossier
- *"Le fichier est dans le sous-dossier images"* → on descend dans l'arborescence
- *"Le fichier est dans le dossier du dessus"* → on remonte dans l'arborescence

### Les symboles de navigation

| Symbole | Signification |
|---|---|
| `nomfichier.html` | Un fichier dans le **même dossier** |
| `dossier/fichier.html` | Un fichier dans un **sous-dossier** |
| `../fichier.html` | Un fichier dans le **dossier parent** (on remonte d'un niveau) |
| `../../fichier.html` | On remonte de **deux niveaux** |

Reprenons notre arborescence :

```
mon-site/
├── index.html
├── style.css
├── images/
│   ├── logo.png
│   └── photo-profil.jpg
└── pages/
    ├── a-propos.html
    └── contact.html
```

**Depuis `index.html`** (à la racine) :
```html
<img src="images/logo.png">              <!-- on descend dans images/ -->
<a href="pages/a-propos.html">À propos</a>  <!-- on descend dans pages/ -->
```

**Depuis `pages/a-propos.html`** (dans le sous-dossier) :
```html
<a href="../index.html">Accueil</a>           <!-- on remonte à la racine -->
<img src="../images/logo.png">                <!-- on remonte, puis on descend dans images/ -->
<a href="contact.html">Contact</a>             <!-- contact.html est dans le MÊME dossier, pas de chemin à ajouter -->
```

> **Le piège classique :** depuis `pages/a-propos.html`, écrire directement `images/logo.png` ne fonctionne **pas** — ce chemin chercherait un dossier `images/` à l'intérieur de `pages/`, qui n'existe pas ! Il faut d'abord remonter avec `../` avant de redescendre.

---

## 2.4 Liens relatifs vs liens absolus

### Lien relatif

Un **lien relatif** indique un chemin **par rapport à la position du fichier actuel**. C'est ce qu'on vient de voir : `images/logo.png`, `../index.html`...

```html
<a href="pages/contact.html">Contact</a>
```

C'est la méthode à privilégier pour lier des pages **à l'intérieur de ton propre site**. Avantage énorme : si tu déplaces tout ton site (par exemple en le mettant en ligne sur un serveur), les liens relatifs continuent de fonctionner, car les positions *relatives* entre les fichiers ne changent pas.

### Lien absolu

Un **lien absolu** donne l'adresse **complète** d'une ressource, depuis la racine d'Internet — typiquement, une URL complète vers un autre site.

```html
<a href="https://www.w3schools.com">W3Schools</a>
```

C'est la méthode obligatoire pour lier vers un site **externe** — il est impossible d'utiliser un chemin relatif pour pointer vers un autre domaine.

### Le tableau de décision

| Tu veux lier vers... | Type de lien | Exemple |
|---|---|---|
| Une page de ton propre site | Relatif | `pages/contact.html` |
| Une image de ton propre site | Relatif | `images/logo.png` |
| Un site externe (Google, YouTube...) | Absolu | `https://www.google.com` |

---

## 2.5 La balise `<a>` — créer un lien

La balise `<a>` (pour *anchor*, "ancre") transforme n'importe quel contenu en lien cliquable. L'attribut **`href`** ("hypertext reference") indique la destination.

```html
<a href="pages/contact.html">Contactez-nous</a>
```

### Ouvrir dans un nouvel onglet

L'attribut `target="_blank"` ouvre le lien dans un nouvel onglet — pratique pour les liens externes, pour ne pas faire quitter ton site au visiteur.

```html
<a href="https://www.w3schools.com" target="_blank">Documentation W3Schools</a>
```

### Liens spéciaux : email et téléphone

```html
<a href="mailto:contact@monsite.com">Envoyer un email</a>
<a href="tel:+32470123456">Appeler maintenant</a>
```

Ces liens déclenchent l'ouverture du logiciel de messagerie ou de l'application téléphone par défaut sur l'appareil du visiteur.

---

## 2.6 Construire la navigation entre plusieurs pages

Pour qu'un site "tienne debout", chaque page doit pouvoir mener vers les autres. La pratique courante : un **menu de navigation** identique (ou presque) sur toutes les pages.

```html
<!-- Ce menu peut apparaître sur index.html, a-propos.html, contact.html... -->
<nav>
    <a href="index.html">Accueil</a>
    <a href="pages/a-propos.html">À propos</a>
    <a href="pages/contact.html">Contact</a>
</nav>
```

> ⚠️ **Attention au contexte !** Le chemin exact vers `index.html` dépend de l'endroit où se trouve la page qui contient ce menu. Depuis la racine, c'est `index.html`. Depuis le dossier `pages/`, ce serait `../index.html`. Chaque page doit avoir SES propres chemins, adaptés à sa position dans l'arborescence.

---

## 2.7 Bonnes pratiques d'organisation

- **Nomme tes dossiers en anglais et en minuscules** : `images/`, `css/`, `js/` — c'est la convention universelle du web, peu importe la langue du contenu.
- **Pas d'espace ni d'accent** dans les noms de fichiers et de dossiers — utilise des tirets : `a-propos.html`, pas `à propos.html`.
- **Garde `index.html` à la racine** — jamais dans un sous-dossier, sinon ton site ne se chargera pas correctement par défaut.
- **Regroupe par type** : toutes les images dans `images/`, tous les styles dans `css/` (ou un seul fichier `style.css` à la racine pour un petit projet).

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Arborescence | Organisation hiérarchique des fichiers et dossiers d'un site |
| `index.html` | Nom conventionnel de la page d'accueil, toujours à la racine |
| Chemin relatif | Position par rapport au fichier actuel — pour naviguer DANS son site |
| Chemin absolu | Adresse complète (URL) — pour lier vers un site EXTERNE |
| `../` | Remonte d'un niveau dans l'arborescence |
| `dossier/fichier` | Descend dans un sous-dossier |
| `<a href="...">` | Crée un lien cliquable |
| `target="_blank"` | Ouvre le lien dans un nouvel onglet |
| `mailto:` / `tel:` | Liens spéciaux pour email et téléphone |

---

## 🔗 Pour aller plus loin

- [MDN — Créer des liens hypertextes](https://developer.mozilla.org/fr/docs/Learn/Getting_started_with_the_web/Creating_hyperlinks)
- [MDN — Chemins de fichiers](https://developer.mozilla.org/fr/docs/Learn/Getting_started_with_the_web/Dealing_with_files)

---

*→ Chapitre suivant : Introduction au CSS*
