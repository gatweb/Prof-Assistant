# Chapitre 10 — Formulaires HTML

> **UAA3 — Création du site web** | 3e secondaire | Technique de transition Informatique

---

## 🎯 Objectifs du chapitre

À la fin de ce chapitre, tu seras capable de :
- Construire un formulaire avec `<form>` et différents types de champs `<input>`
- Comprendre le rôle essentiel de l'attribut `name`
- Associer correctement un `<label>` à son champ
- Utiliser `<select>`, `<textarea>` et grouper des champs avec `<fieldset>`
- Appliquer la validation native HTML5 (`required`, `pattern`, `min`/`max`)

---

## 10.1 La balise `<form>`

Un formulaire regroupe tous les champs qu'un visiteur doit remplir, et définit ce qu'il se passe quand il valide.

```html
<form action="/traitement.php" method="post">
    <!-- tous les champs ici -->
</form>
```

| Attribut | Rôle |
|---|---|
| `action` | L'adresse où envoyer les données une fois le formulaire validé |
| `method` | `get` (données visibles dans l'URL, pour une recherche par exemple) ou `post` (données invisibles, pour des informations sensibles comme un mot de passe) |

> On ne dispose généralement pas d'un vrai serveur pour traiter le formulaire dans un exercice scolaire — l'important ici est de maîtriser la **structure** du formulaire, pas son traitement final côté serveur.

---

## 10.2 Les champs `<input>` et leurs types

`<input>` est le champ le plus polyvalent — son comportement change radicalement selon son attribut `type`.

```html
<input type="text" placeholder="Ton prénom">
<input type="email" placeholder="ton@email.com">
<input type="password" placeholder="Mot de passe">
<input type="number" min="0" max="100">
<input type="date">
<input type="checkbox">
<input type="radio">
<input type="file">
```

| Type | Comportement |
|---|---|
| `text` | Texte libre, sur une seule ligne |
| `email` | Vérifie automatiquement le format d'une adresse email |
| `password` | Masque les caractères saisis |
| `number` | N'accepte que des nombres, avec flèches +/- |
| `date` | Affiche un calendrier de sélection |
| `checkbox` | Case à cocher — sélection indépendante, plusieurs possibles |
| `radio` | Bouton radio — sélection exclusive parmi un groupe (détail au point suivant) |
| `file` | Permet de choisir un fichier sur l'appareil |

---

## 10.3 L'attribut name — le rôle souvent oublié

Voici l'erreur la plus fréquente chez les débutants : créer un champ magnifique, bien stylé, parfaitement visible... et oublier l'attribut `name`. **Sans `name`, la valeur saisie n'est jamais transmise** lors de l'envoi du formulaire — le champ existe visuellement, mais il est invisible pour le traitement des données.

```html
<!-- ❌ Cette valeur ne sera JAMAIS envoyée -->
<input type="text" placeholder="Ton prénom">

<!-- ✅ Avec name, la valeur est transmise sous l'étiquette "prenom" -->
<input type="text" name="prenom" placeholder="Ton prénom">
```

### name vs id — ne pas confondre

| Attribut | Rôle |
|---|---|
| `name` | L'étiquette sous laquelle la donnée est **envoyée** au serveur |
| `id` | Un identifiant unique pour cibler l'élément en **CSS** ou en **JavaScript**, et pour l'associer à un `<label>` |

Un champ a souvent besoin des deux, pour des raisons différentes :

```html
<input type="text" id="champ-prenom" name="prenom">
```

### Le cas particulier des boutons radio

Plusieurs boutons radio qui partagent le **même** `name` forment un groupe — un seul d'entre eux peut être sélectionné à la fois.

```html
<input type="radio" name="niveau" value="debutant"> Débutant
<input type="radio" name="niveau" value="intermediaire"> Intermédiaire
<input type="radio" name="niveau" value="avance"> Avancé
```

> Si tu donnes des `name` **différents** à ces 3 boutons par erreur, ils deviennent indépendants — l'utilisateur pourrait cocher les trois en même temps, ce qui n'a aucun sens pour un choix de niveau unique.

---

## 10.4 `<label>` — l'étiquette indispensable

Un champ sans étiquette claire est une mauvaise expérience pour tout le monde, et un vrai problème d'accessibilité.

```html
<label for="champ-email">Adresse email</label>
<input type="email" id="champ-email" name="email">
```

L'attribut `for` du `<label>` doit correspondre **exactement** à l'`id` du champ qu'il décrit. Une fois ce lien établi, cliquer sur le texte de l'étiquette active automatiquement le champ — pratique sur mobile pour les cases à cocher, par exemple.

### Alternative : envelopper le champ dans le label

```html
<label>
    Adresse email
    <input type="email" name="email">
</label>
```

Cette syntaxe crée le même lien sans avoir besoin de `for`/`id` — les deux approches sont valides, la première (avec `for`) reste la plus courante en pratique.

---

## 10.5 `<select>` — liste déroulante

```html
<label for="jeu">Jeu préféré</label>
<select id="jeu" name="jeu">
    <option value="valorant">Valorant</option>
    <option value="lol" selected>League of Legends</option>
    <option value="fortnite">Fortnite</option>
</select>
```

| Élément | Rôle |
|---|---|
| `<select>` | Le conteneur de la liste déroulante |
| `<option>` | Une option proposée — `value` est ce qui est réellement envoyé, le texte affiché peut différer |
| `selected` | Présélectionne une option par défaut |

---

## 10.6 `<textarea>` — texte multiligne

```html
<label for="message">Ton message</label>
<textarea id="message" name="message" rows="5" placeholder="Écris ton message ici..."></textarea>
```

Contrairement à `<input>`, `<textarea>` n'est **pas** une balise auto-fermante — elle a un contenu (éventuellement vide) entre ouverture et fermeture. `rows` définit la hauteur visible en nombre de lignes.

---

## 10.7 Les boutons

```html
<button type="submit">Envoyer</button>
<button type="reset">Réinitialiser</button>
<button type="button">Ne fait rien par défaut</button>
```

| Type | Comportement |
|---|---|
| `submit` | Envoie le formulaire |
| `reset` | Vide tous les champs et revient à leur état initial |
| `button` | Ne fait rien par défaut — utilisé quand on veut déclencher une action personnalisée en JavaScript |

> Si tu ne précises **aucun** `type` sur un `<button>` à l'intérieur d'un `<form>`, il se comporte par défaut comme `submit` — une source fréquente de bugs inattendus si ce n'était pas voulu.

---

## 10.8 `<fieldset>` et `<legend>` — grouper des champs liés

```html
<fieldset>
    <legend>Informations personnelles</legend>

    <label for="nom">Nom</label>
    <input type="text" id="nom" name="nom">

    <label for="email">Email</label>
    <input type="email" id="email" name="email">
</fieldset>
```

`<fieldset>` dessine visuellement un cadre autour d'un groupe de champs logiquement liés, et `<legend>` lui donne un titre. Très utile pour structurer un long formulaire en sections claires — et excellent pour l'accessibilité, puisque les lecteurs d'écran annoncent le `<legend>` avant chaque champ du groupe.

---

## 10.9 Validation native HTML5

Le navigateur peut valider certains champs **avant même** d'envoyer le formulaire, sans une seule ligne de JavaScript.

```html
<input type="text" name="prenom" required>
<input type="email" name="email" required>
<input type="number" name="age" min="0" max="120">
<input type="text" name="code" pattern="[A-Z]{3}[0-9]{3}" title="Format : 3 lettres majuscules + 3 chiffres">
<input type="password" name="motdepasse" minlength="8">
```

| Attribut | Rôle |
|---|---|
| `required` | Le champ doit être rempli avant l'envoi |
| `min` / `max` | Bornes pour un champ numérique ou une date |
| `minlength` / `maxlength` | Nombre minimum/maximum de caractères pour du texte |
| `pattern` | Expression précise que la saisie doit respecter (notation avancée, optionnelle à ce stade) |

> Cette validation reste **côté navigateur uniquement** — elle améliore l'expérience utilisateur, mais ne remplace jamais une vraie validation côté serveur dans un projet réel (un visiteur malveillant peut toujours désactiver cette vérification).

---

## 📦 Récapitulatif

| Concept | À retenir |
|---|---|
| `<form action="..." method="...">` | Conteneur global, définit où et comment envoyer les données |
| `name` | **Indispensable** — sans lui, la valeur n'est jamais transmise |
| `id` | Pour cibler en CSS/JS et associer un `<label>` |
| Boutons radio | Même `name` = groupe exclusif |
| `<label for="...">` | Doit correspondre exactement à l'`id` du champ |
| `<select>`/`<option>` | Liste déroulante — `value` ≠ texte affiché possible |
| `<textarea>` | Zone de texte multiligne, non auto-fermante |
| `<button type="submit">` | Envoie le formulaire — comportement par défaut si type omis |
| `<fieldset>`/`<legend>` | Regroupe des champs liés avec un titre |
| `required`, `min`/`max`, `minlength` | Validation native, sans JavaScript |

---

## 🔗 Pour aller plus loin

- [MDN — Formulaires HTML](https://developer.mozilla.org/fr/docs/Learn/Forms)
- [MDN — Validation de formulaire](https://developer.mozilla.org/fr/docs/Learn/Forms/Form_validation)

---

*→ Chapitre suivant : Sélecteurs avancés*
