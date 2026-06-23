# Chapitre 8 — Médias : images, audio, vidéo

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Citer les propriétés d'une image numérisée : définition, résolution, format, codage
- Choisir un format d'image adapté à une utilisation donnée
- Intégrer une image avec la balise `<img>` et ses attributs essentiels
- Intégrer du son avec `<audio>` et de la vidéo avec `<video>`
- Ajouter des sous-titres avec `<track>`

---

## 8.1 Les propriétés d'une image numérisée

Avant d'utiliser une image sur le web, il faut comprendre ce qui la définit techniquement. Quatre propriétés caractérisent toute image numérique.

### La définition

La **définition** d'une image, c'est son nombre total de pixels — largeur × hauteur.

```
1920 × 1080 = 2 073 600 pixels  →  on appelle ça "Full HD"
3840 × 2160 = 8 294 400 pixels  →  on appelle ça "4K"
```

Plus la définition est élevée, plus l'image contient de détails — mais plus le fichier est lourd.

### La résolution

Attention, **résolution** et **définition** sont souvent confondues dans le langage courant — ce n'est pourtant pas la même chose. La **résolution** mesure la **densité** de pixels, c'est-à-dire combien de pixels sont concentrés sur une unité de longueur physique (exprimée en *PPI*, *pixels per inch*).

```
Écran standard    : ~96 PPI    (suffisant pour un affichage à l'écran)
Impression qualité : ~300 PPI   (nécessaire pour un rendu net sur papier)
```

> **Pour le web**, la résolution importe peu — c'est la **définition** qui compte vraiment, en fonction de la taille d'affichage prévue. Pas besoin d'une image à 300 PPI pour un site web, ça alourdirait le fichier inutilement.

### Le format

Le **format** déterm­ine comment les pixels sont organisés et compressés dans le fichier. Chaque format a ses forces et ses usages privilégiés (détail au point suivant).

### Le codage (la compression)

Le **codage** désigne la façon dont l'image est compressée pour réduire la taille du fichier.

| Type de codage | Principe | Exemple de format |
|---|---|---|
| **Sans perte** (*lossless*) | Aucune donnée visuelle n'est perdue — fichier plus lourd | PNG, GIF |
| **Avec perte** (*lossy*) | Certaines données sont supprimées de façon irréversible — fichier plus léger | JPEG |

---

## 8.2 Choisir le bon format selon l'usage

| Format | Transparence | Compression | Idéal pour |
|---|---|---|---|
| **JPEG** (.jpg) | ❌ Non | Avec perte | Photographies, dégradés complexes |
| **PNG** (.png) | ✅ Oui | Sans perte | Logos, icônes, captures d'écran, contours nets |
| **SVG** (.svg) | ✅ Oui | Vectoriel | Logos, icônes — redimensionnable à l'infini sans perte de qualité |
| **GIF** (.gif) | ✅ Oui (limité) | Sans perte | Animations très simples, palette de couleurs réduite |
| **WebP** (.webp) | ✅ Oui | Les deux | Format moderne, bon compromis poids/qualité, remplace progressivement JPEG/PNG |

> **Règle pratique simple :**
> - Une photo ? → **JPEG**
> - Un logo ou une icône avec un fond transparent ? → **PNG** ou **SVG**
> - Une forme géométrique simple, redimensionnable à toutes les tailles ? → **SVG**

---

## 8.3 La balise `<img>`

```html
<img src="photo-chaton.jpg" alt="Un chaton roux qui dort sur un coussin" width="400" height="300">
```

| Attribut | Rôle |
|---|---|
| `src` | Chemin vers le fichier image (relatif ou absolu — rappel chapitre 2 !) |
| `alt` | Texte alternatif — **toujours obligatoire** |
| `width` / `height` | Dimensions d'affichage en pixels |

### Pourquoi `alt` est-il toujours obligatoire ?

- **Accessibilité** : les personnes malvoyantes utilisent des lecteurs d'écran qui lisent à voix haute le contenu de `alt`.
- **Si l'image ne charge pas** : le texte alternatif s'affiche à la place, donnant quand même une information à l'utilisateur.
- **Référencement (SEO)** : les moteurs de recherche "lisent" le texte de `alt` pour comprendre le contenu d'une image — ils ne voient pas l'image elle-même.

```html
<!-- ❌ Mauvais alt, inutile -->
<img src="photo.jpg" alt="image">

<!-- ✅ Bon alt, descriptif -->
<img src="photo.jpg" alt="Coucher de soleil sur la mer du Nord, vu depuis la plage">
```

### Pourquoi définir width et height ?

Réserver l'espace exact dès le chargement de la page évite que le contenu "saute" visuellement une fois l'image chargée (un phénomène appelé *layout shift*, désagréable pour le visiteur).

---

## 8.4 La balise `<audio>`

```html
<audio controls>
    <source src="musique.mp3" type="audio/mpeg">
    <source src="musique.ogg" type="audio/ogg">
    Ton navigateur ne supporte pas la lecture audio.
</audio>
```

| Élément/Attribut | Rôle |
|---|---|
| `controls` | Affiche les boutons de lecture (play, pause, volume...) |
| `<source>` | Propose un fichier audio — plusieurs formats augmentent la compatibilité entre navigateurs |
| Texte après les `<source>` | Message de secours si **aucun** format n'est supporté |

> Pourquoi plusieurs `<source>` ? Tous les navigateurs ne supportent pas exactement les mêmes formats audio/vidéo. En proposer plusieurs (par exemple MP3 et OGG), le navigateur choisit automatiquement le premier qu'il sait lire.

---

## 8.5 La balise `<video>`

```html
<video controls width="640" poster="apercu.jpg">
    <source src="film.mp4" type="video/mp4">
    <source src="film.webm" type="video/webm">
    Ton navigateur ne supporte pas la lecture vidéo.
</video>
```

| Attribut | Rôle |
|---|---|
| `controls` | Affiche les contrôles de lecture |
| `poster` | Image affichée avant que la vidéo ne soit lancée |
| `width` | Largeur d'affichage |
| `autoplay`, `loop`, `muted` | Lecture automatique, en boucle, sans son (à utiliser avec prudence — l'autoplay avec son est bloqué par défaut sur la plupart des navigateurs modernes) |

---

## 8.6 Les sous-titres avec `<track>`

```html
<video controls>
    <source src="film.mp4" type="video/mp4">
    <track src="sous-titres-fr.vtt" kind="subtitles" srclang="fr" label="Français">
</video>
```

| Attribut | Rôle |
|---|---|
| `kind="subtitles"` | Précise que ce fichier contient des sous-titres |
| `srclang` | Code de langue (`fr`, `en`, `nl`...) |
| `label` | Nom affiché dans le menu de sélection des sous-titres |

Le fichier de sous-titres lui-même utilise un format texte spécifique (`.vtt`), pas couvert en détail ici, mais bon à savoir : il existe.

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| Définition | Nombre total de pixels (largeur × hauteur) |
| Résolution | Densité de pixels (PPI) — surtout pertinent pour l'impression |
| Format | JPEG (photos), PNG/SVG (logos, transparence), GIF (animations simples) |
| Codage sans perte | Aucune dégradation visuelle (PNG, GIF) |
| Codage avec perte | Compression plus forte, légère dégradation (JPEG) |
| `alt` | Toujours obligatoire — accessibilité, secours, SEO |
| `width`/`height` sur `<img>` | Évite le décalage visuel pendant le chargement |
| `<source>` multiple | Améliore la compatibilité entre navigateurs |
| `poster` | Image d'aperçu avant lecture d'une vidéo |
| `<track>` | Ajoute des sous-titres à une vidéo |

---

## 🔗 Pour aller plus loin

- [MDN — Images en HTML](https://developer.mozilla.org/fr/docs/Learn/HTML/Multimedia_and_embedding/Images_in_HTML)
- [MDN — Vidéo et audio](https://developer.mozilla.org/fr/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content)

---

*→ Chapitre suivant : Tableaux HTML*
