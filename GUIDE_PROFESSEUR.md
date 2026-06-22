# 🎓 Guide Professeur : Gérer les Exercices sur ProfAssistant

Ce guide t'explique comment ajouter ou modifier du contenu pédagogique dans le système "Headless" via Firestore.

## 📁 Structure d'un Exercice dans Firestore

Les exercices sont stockés dans la collection \`exercices\`. Chaque document représente un défi pour l'élève.

### Champs Obligatoires :
- **\`titre\`** (String) : Nom affiché dans le lobby (ex: "Les sélecteurs CSS").
- **\`chapitre\`** (String) : Catégorie pour grouper les exercices (ex: "CSS Fondamentaux").
- **\`enonce_md\`** (Markdown) : Les instructions claires de ce que l'élève doit faire.
- **\`theorie_md\`** (Markdown) : Le rappel de cours (apparaît dans la sidebar Notebook).
- **\`code_depart\`** (String) : Le code injecté dans Monaco Editor au chargement.

### Indices & Tutorat (RAG) :
Le système utilise ces champs pour nourrir l'IA (Gemini) :
- **\`indices.niveau_1_md\`** : Un premier indice textuel simple.
- **\`indices.niveau_2_prompt\`** : Une consigne spécifique pour l'IA (ex: "Aide l'élève sur le Box Model sans donner la réponse").
- **\`indices.niveau_3_md\`** : La solution ou un indice très fort.

---

## ✍️ Comment ajouter un cours ?

Pour le moment, l'ajout se fait via la console Firestore ou via un script de "seeding".

### Méthode Recommandée (Script) :
Utilise le fichier \`scratch/seed_html_exercise.js\` comme modèle :
1. Copie le fichier.
2. Modifie les variables \`titre\`, \`enonce_md\`, etc.
3. Exécute le script :
   \`\`\`bash
   NODE_PATH=./functions/node_modules node mon_nouveau_cours.js
   \`\`\`

## 💡 Conseils pour L'IA
Pour que le tuteur soit efficace, assure-toi que le champ \`theorie_md\` contient les concepts clés. L'IA s'en servira comme "source de vérité" pour répondre à l'élève.

---
*ProfAssistant - L'enseignement du code, simplifié par l'IA.*


1. Ajouter le Cours Théorique (Code/Hébergement)
Chaque cours possède son propre dossier sous public/cours/.

Créer le dossier du cours : Créez un nouveau sous-dossier, par exemple public/cours/bureautique-excel/.

Y placer les chapitres Markdown : Ajoutez vos fichiers Markdown pour chaque chapitre dans ce dossier (ex: 01_prise_en_main.md, 02_formules.md).

Créer le fichier config.json : Dans ce même dossier, créez un fichier config.json contenant la structure suivante :

json
{
  "id": "bureautique-excel",
  "title": "Bureautique : Excel Immersif",
  "pitch": "Maîtrisez les feuilles de calcul sous forme de jeu de rôle d'entreprise.",
  "systemPrompt": "Tu es un chef de projet exigeant mais pédagogue. Tu t'adresses à ton nouvel assistant (l'élève). Guide-le sans lui donner la formule Excel exacte.",
  "theme": {
    "primaryColor": "#10b981",
    "icon": "📊"
  },
  "chapters": [
    {
      "id": "excel-ch1",
      "title": "Prise en main d'Excel",
      "file": "01_prise_en_main.md"
    },
    {
      "id": "excel-ch2",
      "title": "Les Formules de calcul",
      "file": "02_formules.md"
    }
  ]
}
Compiler le manifeste : Pour enregistrer le cours dans l'application, lancez le script de compilation :

bash
node scripts/compile-courses.js
Déployer la théorie : Mettez en ligne les nouveaux fichiers :

bash
npx firebase-tools deploy --only hosting
2. Ajouter les Exercices du Cours (Firestore)
Les exercices sont stockés dans la base de données Cloud Firestore, dans la collection exercices.

Pour lier un exercice à un cours spécifique :

Créez un document d'exercice dans la collection exercices sur la console Firebase.
Ajoutez un champ course_id (de type string) contenant l'identifiant du cours défini dans le config.json (ex: bureautique-excel).