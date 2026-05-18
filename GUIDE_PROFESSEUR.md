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

## 💡 Conseils pour Gemini
Pour que le tuteur soit efficace, assure-toi que le champ \`theorie_md\` contient les concepts clés. L'IA s'en servira comme "source de vérité" pour répondre à l'élève.

---
*ProfAssistant - L'enseignement du code, simplifié par l'IA.*
