# Exercice Pratique en Binôme : "Dev' & Présente !"
> **UAA5 — Programmation impérative** | Chapitre 8 : Les Fonctions Prédéfinies  
> *4e secondaire — Technique de transition Informatique (Belgique)*

---

## 🎯 Objectif de l'exercice

En binôme (ou trinôme), vous allez devenir les "experts" d'une partie du chapitre 8. Votre mission est double :
1. **Comprendre** votre sujet théorique et les fonctions JavaScript associées.
2. **Coder une mini-démo interactive et attrayante** (HTML/CSS/JS) illustrant votre concept.
3. **Présenter** votre travail à la classe lors d'une courte présentation de **5 à 7 minutes** au cours de laquelle vous expliquerez le code et ferez tester votre démo.

---

## 👥 Les 6 sujets à répartir

### 📐 Sujet 1 : Les Champions de l'Arrondi (`Math.round`, `floor`, `ceil`, `trunc`, `abs`)
*   **Concepts clés à maîtriser :** 
    *   La différence exacte entre l'arrondi standard (`Math.round()`), l'arrondi vers le bas (`Math.floor()`), l'arrondi vers le haut (`Math.ceil()`) et la troncature (`Math.trunc()`).
    *   Comment se comportent `Math.floor()` et `Math.trunc()` avec des nombres négatifs (le piège !).
    *   La notion de valeur absolue (`Math.abs()`).
*   **Idée de mini-démo :** Une interface interactive où l'utilisateur saisit un nombre décimal (ex: `4.6` ou `-3.2`) et voit instantanément cinq boîtes colorées afficher le résultat pour chacune de ces fonctions avec une courte phrase explicative.

### 📐 Sujet 2 : Les Géomètres de l'Objet Math (`Math.PI`, `min`, `max`, `pow`, `sqrt`)
*   **Concepts clés à maîtriser :**
    *   L'utilisation de la constante `Math.PI` pour les calculs de cercles.
    *   L'extraction automatique du plus petit et plus grand nombre avec `Math.min()` et `Math.max()`.
    *   Le calcul des puissances (`Math.pow()`) et de la racine carrée (`Math.sqrt()`).
*   **Idée de mini-démo :** Une boîte à outils géométrique. L'utilisateur peut au choix :
    *   Calculer le périmètre et l'aire d'un disque à partir du rayon (utilisation de `Math.PI`).
    *   Calculer l'hypoténuse d'un triangle rectangle à partir des deux côtés (Pythagore : `Math.sqrt` et `Math.pow`).
    *   Saisir trois nombres pour que le script surligne visuellement en vert le maximum et en rouge le minimum.

### 🎲 Sujet 3 : Les Maîtres du Hasard (`Math.random` & Formule personnalisée)
*   **Concepts clés à maîtriser :**
    *   Le fonctionnement de base de `Math.random()` (génération d'un décimal entre 0 inclus et 1 exclus).
    *   La logique de la formule universelle permettant d'obtenir un entier aléatoire dans une plage personnalisée `[min, max]` incluse :
        `Math.floor(Math.random() * (max - min + 1)) + min`
    *   Expliquer le rôle de chaque opération dans cette formule (la multiplication, le `Math.floor`, l'addition du `min`).
*   **Idée de mini-démo :** Un simulateur de lancer de dés de jeux de rôle. L'utilisateur choisit la valeur minimale (ex: 1) et maximale (ex: 6 pour un dé standard, 20 pour un dé RPG) et clique sur un bouton pour générer un lancer aléatoire avec un bruitage textuel ou une couleur dynamique selon le score (ex: vert pour un "critique", rouge pour un "échec").

### 📅 Sujet 4 : Les Voyageurs du Temps (L'Objet `new Date()` & Horloge)
*   **Concepts clés à maîtriser :**
    *   Comment capturer l'instant présent en JavaScript avec `new Date()`.
    *   Comment extraire les heures, les minutes et les secondes grâce aux méthodes de date.
    *   Comment utiliser la fonction `.padStart(2, "0")` sur des chaînes de caractères pour forcer l'affichage sur deux chiffres (ex: afficher `09:05` au lieu de `9:5`).
*   **Idée de mini-démo :** Une horloge digitale stylisée qui s'actualise toutes les secondes en direct grâce à `setInterval()` (facultatif) ou un chronomètre interactif avec un bouton "Pause" et "Relancer".

### 📅 Sujet 5 : Les Historiens de l'Année (Mois, Jours & Tableaux de Conversion)
*   **Concepts clés à maîtriser :**
    *   Les deux grands pièges historiques de JavaScript : pourquoi `.getMonth()` commence à 0 (janvier = 0, décembre = 11) ? Pourquoi `.getDay()` commence à 0 pour dimanche ?
    *   Comment utiliser des tableaux de chaînes de caractères (`JOURS` et `MOIS`) pour convertir ces index numériques en mots français lisibles.
*   **Idée de mini-démo :** Un calendrier interactif. L'élève saisit une date (année, mois, jour) et le script affiche :
    *   Le nom complet du jour de la semaine associé (ex: "Tu es né un Mardi !").
    *   La date complète magnifiquement rédigée (ex: "Mardi 14 octobre 2025").
    *   Un indicateur visuel indiquant s'il s'agit d'un jour de semaine ou d'un week-end.

### 💾 Sujet 6 : Les Gardiens du Score (Variables globales vs locales & État persistant)
*   **Concepts clés à maîtriser :**
    *   La notion de portée d'une variable (Variable globale vs Variable locale).
    *   Pourquoi une variable déclarée à l'intérieur d'un écouteur d'événement (`addEventListener`) est détruite et réinitialisée à chaque clic ?
    *   Comment déclarer des variables en dehors de la fonction pour qu'elles "survivent" aux clics (pour stocker un score, un compteur de tentatives, ou un nombre secret généré une seule fois).
*   **Idée de mini-démo :** Un jeu du "Juste Prix" miniature. Au chargement, le programme génère un nombre secret aléatoire entre 1 et 100. L'utilisateur saisit ses essais et clique sur un bouton. Le programme affiche "Trop grand", "Trop petit" ou "Trouvé !", tout en incrémentant un compteur de tentatives global qui persiste entre les clics.

---

## 📋 Déroulement de la présentation (Le Livrable)

Votre groupe passera au tableau et disposera de **5 à 7 minutes** réparties comme suit :

1.  **L'explication théorique (2 à 3 min) :** Avec vos propres mots et à l'aide du tableau ou de diapositives, expliquez à vos camarades les notions clés et les fonctions qui vous ont été attribuées.
2.  **La démo visuelle (2 min) :** Montrez votre interface web en action devant la classe. Testez plusieurs valeurs (y compris des cas limites comme des nombres négatifs ou des valeurs vides) pour montrer la robustesse de votre code.
3.  **L'explication du code (2 min) :** Ouvrez votre éditeur de code et montrez les lignes clés du script JavaScript (les formules mathématiques, la gestion de la date, ou l'utilisation d'une variable globale).

---

## 🗂️ Modèle de départ (Template HTML de base)

Pour coder votre démo, vous pouvez créer un fichier nommé `index.html` et y coller ce modèle de départ moderne (Theme sombre Indigo, responsive et structuré). Il vous suffira de modifier la zone des formulaires et le script JavaScript pour l'adapter à votre sujet !

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Démo interactive - Chapitre 8</title>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-color);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
    }
    .card {
      background-color: var(--card-bg);
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      border: 1px solid var(--border);
    }
    .card-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent);
      font-weight: bold;
      display: block;
      margin-bottom: 0.5rem;
    }
    h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.6rem;
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.8rem;
    }
    .input-group {
      margin-bottom: 1.2rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }
    input[type="number"], input[type="text"], select {
      width: 100%;
      padding: 0.8rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background-color: #0f172a;
      color: white;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus, select:focus {
      border-color: var(--accent);
    }
    button {
      width: 100%;
      padding: 0.8rem;
      border-radius: 8px;
      border: none;
      background-color: var(--accent);
      color: white;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    button:hover {
      background-color: var(--accent-hover);
    }
    button:active {
      transform: scale(0.98);
    }
    .output-container {
      margin-top: 1.5rem;
      background-color: #0f172a;
      padding: 1.2rem;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
      min-height: 50px;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .result-box {
      background: rgba(99, 102, 241, 0.1);
      border: 1px dashed var(--accent);
      padding: 0.5rem;
      margin-top: 0.5rem;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <div class="card">
    <span class="card-label">UAA5 - Chapitre 8</span>
    <h2>🎮 Démo : [Sujet N°...]</h2>
    
    <!-- 🟢 Zone à adapter selon votre sujet (Inputs, listes, labels) -->
    <div class="input-group">
      <label for="monInput">Entrez une valeur décimale :</label>
      <input type="number" step="any" id="monInput" placeholder="Ex: -15.67">
    </div>
    
    <button id="monBouton">Calculer les arrondis</button>
    
    <!-- 🔴 Zone de rendu de vos résultats -->
    <div class="output-container" id="monOutput">
      Saisissez une valeur et cliquez sur le bouton pour voir les calculs s'exécuter...
    </div>
  </div>

  <script>
    // ══════ VOTRE CODE JAVASCRIPT ICI ══════
    
    document.getElementById("monBouton").addEventListener("click", function() {
      // 1. Récupération de la saisie utilisateur
      const valeur = Number(document.getElementById("monInput").value);
      
      // Validation de sécurité (vérifie si c'est un nombre valide)
      if (isNaN(valeur) || document.getElementById("monInput").value === "") {
        document.getElementById("monOutput").innerHTML = "⚠️ Veuillez saisir un nombre valide.";
        return;
      }
      
      // 2. Traitements théoriques (Exemple d'arrondi)
      const arrondiStandard = Math.round(valeur);
      const plancher = Math.floor(valeur);
      
      // 3. Affichage dynamique dans l'output
      document.getElementById("monOutput").innerHTML = 
        `Pour le nombre décimal saisi : <strong>${valeur}</strong> :` +
        `<div class="result-box">Math.round() : ${arrondiStandard}</div>` +
        `<div class="result-box">Math.floor() : ${plancher}</div>`;
    });
    
  </script>
</body>
</html>
```

---

## 📊 Grille d'Évaluation (Sur 20 points)

| Critère | Description | Barème |
| :--- | :--- | :--- |
| **Exactitude Technique** | Les fonctions JavaScript prédéfinies de votre sujet sont correctement comprises, écrites et expliquées sans contre-sens théorique. | **/ 6 points** |
| **Fonctionnalité (Démo)** | La démo en direct fonctionne parfaitement au tableau, réagit instantanément au clic ou à la saisie, et gère proprement les cas limites (champs vides ou erronés). | **/ 5 points** |
| **Clarté du Code** | Le code est propre, bien indenté. Le binôme sait justifier l'intérêt de chaque variable, constante, fonction ou méthode utilisée. | **/ 4 points** |
| **Présentation Orale** | Expression orale audible et vivante. Répartition équitable de la parole entre les deux partenaires du binôme. Capacité à intéresser le reste de la classe. | **/ 3 points** |
| **Esthétique / CSS** | Des modifications personnalisées ont été faites au fichier CSS (couleurs, bordures, icônes, disposition) pour adapter le template général au sujet. | **/ 2 points** |

---

## 💡 Aide-Mémoire & Ressources pour les Groupes

### 📐 Groupe 1 & 2 : Mémento Mathématique
```javascript
Math.round(4.5)   // -> 5 (arrondi le plus proche)
Math.floor(4.9)   // -> 4 (arrondi vers le bas / plancher)
Math.ceil(4.1)    // -> 5 (arrondi vers le haut / plafond)
Math.trunc(4.9)   // -> 4 (coupe les décimales, sans arrondir)
Math.abs(-42)     // -> 42 (valeur absolue / rend le nombre positif)
Math.min(5, 8, 2) // -> 2 (renvoie le plus petit argument)
Math.max(5, 8, 2) // -> 8 (renvoie le plus grand argument)
Math.pow(2, 3)    // -> 8 (2 à la puissance 3, équivalent de 2 ** 3)
Math.sqrt(16)     // -> 4 (racine carrée de 16)
```

### 🎲 Groupe 3 : Formule Aléatoire
```javascript
// Générer un entier entre 'min' et 'max' inclus :
let aleatoire = Math.floor(Math.random() * (max - min + 1)) + min;
```

### 📅 Groupe 4 & 5 : Mémento Dates & Formatage
```javascript
const maintenant = new Date(); // instant présent
maintenant.getFullYear();      // ex: 2026
maintenant.getMonth();         // 0 à 11 (⚠️ 0 = Janvier !)
maintenant.getDate();          // 1 à 31 (le jour du mois)
maintenant.getDay();           // 0 à 6 (⚠️ 0 = Dimanche !)
maintenant.getHours();         // 0 à 23
maintenant.getMinutes();       // 0 à 59

// padStart : forcer l'affichage sur 2 chiffres
let minutes = 5;
let formatMinutes = String(minutes).padStart(2, "0"); // "05"
```

### 💾 Groupe 6 : Mémento de Portée & État
```javascript
// ✅ En dehors de l'écouteur : persiste entre les clics
let tentatives = 0;

document.getElementById("monBouton").addEventListener("click", function() {
  tentatives++; // s'incrémente à chaque clic sans jamais se réinitialiser !
  console.log("Tentatives : " + tentatives);
});
```
