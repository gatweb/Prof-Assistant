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

## 🚀 4. Commandes Utiles de Déploiement

| Action | Commande |
|---|---|
| Mettre en ligne le frontend | `npx firebase-tools deploy --only hosting` |
| Mettre en ligne les Cloud Functions | `npx firebase-tools deploy --only functions` |
| Synchroniser les dépendances Bun | `cd functions && bun install` |
| Tester les fonctions en local | `cd functions && node -c index.js` |