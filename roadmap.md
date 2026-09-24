# 🚀 ROADMAP & CAHIER DES CHARGES : Plateforme EdTech (Informatique 4e)

## 🎯 1. Philosophie Pédagogique (RÈGLES D'OR POUR L'AGENT IA)
1. **L'IA est un Tuteur Socratique :** Elle ne doit **JAMAIS** donner la ligne de code corrigée ni la solution finale. Elle pointe l'erreur et pose une question pour faire réfléchir l'élève.
2. **Sévérité Modérée :** Le ton doit être encourageant. Les erreurs de syntaxe mineures sont signalées sans être lourdement pénalisées.
3. **Le Professeur reste maître :** Sauf indication contraire, l'IA suggère une note et un feedback, mais c'est le professeur qui valide et publie (Flux en deux étapes).

## 🛠️ 2. Stack Technique
* **Frontend :** HTML/CSS/JS (Vanilla). Design épuré, Glassmorphism, Typographie moderne (Inter/Roboto).
* **Éditeur de code :** Monaco Editor (ou CodeMirror).
* **Backend :** Firebase Cloud Functions (Node.js).
* **Base de données :** Cloud Firestore.
* **Authentification :** Firebase Auth (Google Workspace).
* **Moteur IA :** API Gemini 3 (via SDK officiel `@google/genai`).

## 🗄️ 3. Architecture de la Base de Données (Firestore)
* **Collection `exercices` :** Contient les énoncés et les codes de départ.
* **Collection `soumissions` :** Cycle de vie strict :
  1. `brouillon` : L'élève code.
  2. `a_valider` : Soumis à la Cloud Function, IA a généré un feedback, en attente du prof.
  3. `publie` : Professeur a validé, visible par l'élève en temps réel.
* **Collection `cours` :** Documents de référence pour le RAG (Chatbot).

## 📍 4. Phase Actuelle : Lancement V2 FMTTN (1re secondaire) & Référentiel SeGEC [EN COURS 🏗️]
* **Cible :** 1re secondaire FWB (Tronc commun, 2 périodes/semaine), aligné sur le programme SeGEC et basé sur le manuel *@lt_X* (Lacroix & Ouanassi).
* **Architecture V2 :** Nouveau frontend ultra-léger dans `/v2` (Vite + Tailwind CSS + Alpine.js) connecté au backend Firebase/Gemini existant.
* **Pédagogie SeGEC :** Évaluation par compétences (standards-aligned), détection des conceptions erronées (*error patterns*), intégration NotebookLM et remédiation différenciée en un clic.
* **Documentation :** Cahier des charges complet rédigé dans `DOCS_V2_FMTTN.md`.

## 🔮 5. Prochaines Étapes (Backlog V2)
- [x] **Documentation & Cadrage V2 :** Rédaction de `DOCS_V2_FMTTN.md` et analyse des scans @lt_X.
- [x] **Initialisation Frontend V2 :** Setup Vite + Tailwind CSS + Alpine.js dans `v2/`.
- [x] **Intégration Contenus @lt_X Réels :** Extraction et intégration des 181 questions officielles, des synthèses théoriques et de l'Escape Game (5 dossiers complets).
- [x] **Ateliers Pratiques Chapitre 1 :** Simulateur de courriel p.64 (validation des 16 critères) et bilan personnel d'auto-évaluation p.83.
- [x] **Mascotte & Tuteur Socratique V2 :** Intégration du persona robot bleu d'@lt_X avec Gemini et repli socratique local.
- [x] **Dashboard Professeur SeGEC V2 :** Matrice de maîtrise des compétences FMTTN par classe et par élève.
- [x] **Gestion Élèves Réels (Héritage V1) :** Récupération de la liste des élèves réels, changement de classe et persistance Firestore.
- [x] **Intégration Diaporamas & NotebookLM :** Lecteur de diaporamas interactif et carnet de notes NotebookLM pour chaque module.
- [x] **Persistance Firestore Élèves :** Enregistrement des soumissions et synchronisation en direct des bilans personnels dans `/progressions_v2`.
- [x] **Gestion Multi-Enseignants & Classes (Pilote Samedi) :** Liste blanche configurable dans `teachers-config.js` et déverrouillage de `admin.js`.
- [x] **Sécurisation & Règles Firestore :** Déploiement de `firestore.rules` et blindage anti-injection du prompt Gemini dans `corrigerDevoir`.
- [ ] **Déploiement en Production Firebase :** Déploiement hosting & functions pour la présentation de samedi.

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.