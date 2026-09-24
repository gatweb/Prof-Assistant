# 🎓 Guide Professeur : ProfAssistant (Version 2026)

Ce guide récapitule l'ensemble du fonctionnement de **ProfAssistant**, la création de cours, la gestion des exercices et la génération d'évaluations Google Forms.

---

## 🏗️ 1. Architecture des Cours

Chaque cours possède son propre dossier sous `public/cours/<course-id>/`.

### Structure d'un dossier de cours :
```
public/cours/bureautique-3e/
├── config.json               <- Métadonnées, thème, persona IA et liste des chapitres
├── 01_drive_organisation.md  <- Contenu Markdown du Module 1
├── 02_docs_mise_en_page.md   <- Contenu Markdown du Module 2
└── exercices.json            <- Exercices et Quizz associés (optionnel)
```

### Modes d'affichage (`workspaceType` dans `config.json`) :
- **`"office"` (Bureautique & Google Workspace) :** Masque Monaco Editor. Propose une interface à 2 panneaux : Consignes + Aide-mémoire / raccourcis + Dépôt de lien Google Doc à gauche, et le **Tuteur Socratique IA** conversationnel à droite.
- **`"creative"` (Studio Créatif) :** Masque Monaco Editor. Propose un tableau de bord de mission (liens Canva/IA, sandbox de prompting, remise de mission).
- **`"coding"` (ou absent) :** Active Monaco Editor (HTML/CSS/JS) + console + prévisualisation temps réel.

### Compilation et Déploiement :
1. Pour régénérer le manifeste global :
   ```bash
   node scripts/compile-courses.js
   ```
2. Pour déployer sur Firebase :
   ```bash
   npx firebase-tools deploy --only hosting
   ```

---

## 📝 2. Générateur de Quiz Google Forms (IA)

Un outil dédié dans le **Dashboard Professeur** (`/admin.html` > Onglet *📝 Générateur de Quiz*) permet de créer des évaluations auto-corrigées directement sur votre Google Drive.

### Fonctionnement :
1. Indiquez le titre, le sujet/notion à évaluer (ex: *"Les styles de titres et le sommaire dans Google Docs"*), le niveau et le nombre de questions.
2. *(Optionnel)* Renseignez l'**ID du dossier Google Drive** où enregistrer le formulaire.
3. Cliquez sur **🚀 Générer le QCM & Publier sur Google Forms**.
4. L'IA Gemini structure les questions, options, bonnes réponses et feedbacks pédagogiques, puis l'API Google Forms crée le quiz et vous fournit :
   - Le **lien d'édition Professeur**.
   - Le **lien de réponse Élèves**.

### Compte de Service Google Cloud :
- Adresse du robot créateur : `bot-createur-forms@profassistant-61fde.iam.gserviceaccount.com`
- Pour que les formulaires soient rangés dans un dossier spécifique de votre Drive, partagez ce dossier avec l'adresse du robot ci-dessus en mode **Éditeur**.

---

## 🧩 3. Types d'Exercices Firestore (Collection `exercices`)

### Type `office` (Dépôt Google Docs / Drive) :
```json
{
  "id": "bur-ch1-ex1-arborescence",
  "titre": "Créer et partager son arborescence Drive",
  "chapitre": "Module 1 : Prise en main de Google Drive & Organisation",
  "course_id": "bureautique-3e",
  "type": "office",
  "enonce_md": "Consignes de la mission...",
  "theorie_md": "Rappels sur la gestion des droits de partage...",
  "submission_type": "url"
}
```

### Type `quizz` (QCM interne interactif) :
```json
{
  "id": "bur-ch1-quizz",
  "titre": "Quiz de validation Module 1",
  "chapitre": "Module 1 : Prise en main de Google Drive & Organisation",
  "course_id": "bureautique-3e",
  "type": "quizz",
  "questions": [
    {
      "question": "Quel raccourci permet de coller du texte sans conserver sa mise en forme d'origine ?",
      "options": ["Ctrl + V", "Ctrl + Maj + V", "Ctrl + Alt + V", "Ctrl + C"],
      "correctAnswer": 1,
      "successMessage": "✅ Exact ! Ctrl + Maj + V colle le texte brut en adoptant le style de votre document."
    }
  ]
}
```

---

## 🌟 4. ProfAssistant V2 : FMTTN 1re & Matrice ed.ai

La version 2 (`/v2/`) propose un environnement léger dédié au cours de **FMTTN 1re secondaire** basé sur le manuel officiel *@lt_X* et la pédagogie de maîtrise par compétences.

### 4.1 Ajouter des collègues enseignants (Liste blanche)
Pour autoriser vos collègues à accéder à l'espace enseignant lors de leur connexion Google :
1. Ouvrez `v2/src/services/teachers-config.js`.
2. Ajoutez leurs adresses email et leurs classes attribuées dans le tableau `ALLOWED_TEACHERS` :
   ```javascript
   export const ALLOWED_TEACHERS = [
     { email: "gatweb@gmail.com", nom: "Professeur Fondateur", classes: ["1A", "1B", "1C", "1D"] },
     { email: "collegue1@ecole.be", nom: "Professeur 1A / 1B", classes: ["1A", "1B"] }
   ];
   ```
3. Recompilez le frontend : `npm --prefix v2 run build`.

### 4.2 Utilisation de la Météo de Classe (Vue ed.ai)
- **Changement de classe :** Utilisez le menu déroulant en haut de la matrice pour basculer entre `Classe 1A`, `Classe 1B`... Les données et métriques se mettent à jour automatiquement.
- **Synchronisation en direct :** Un voyant vert *Firestore en direct* confirme la réception des résultats des élèves en temps réel.
- **Mode Démonstration :** Le bouton `👥 Injecter démo` permet de charger immédiatement 6 élèves types dans une classe vide pour une présentation.
- **Remédiation en 1 clic :** Le bouton `⚡ Générer la remédiation ciblée` produit instantanément une micro-fiche personnalisée pour les élèves ayant des difficultés détectées (ex: confusion Cc/Cci).

---

## 🚀 5. Commandes Utiles de Déploiement

| Action | Commande |
|---|---|
| Mettre à jour et compiler la V2 | `npm --prefix v2 run build` |
| Mettre en ligne le site web & règles | `npx firebase-tools deploy --only firestore:rules,hosting` |
| Mettre en ligne les Cloud Functions | `npx firebase-tools deploy --only functions` |
| Déployer l'intégralité du projet | `npx firebase-tools deploy` |
| Tester les fonctions en local | `node -c functions/index.js` |