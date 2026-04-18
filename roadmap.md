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

## 📍 4. Phase Actuelle : Single Learning Hub (IA + Prof) [TERMINE ✅]
**Objectif atteint :** Tout le flux (Indices IA, Corrections Prof, Questions Élève) est désormais centralisé dans une boîte de dialogue unique sous l'exercice.
*   **UI Unified :** Plus de modales ni de bulles flottantes.
*   **Real-time Collaboration :** Le chat se met à jour en direct lors de la validation prof.
*   **Historique Consolidé :** L'élève peut exporter toute la discussion par email.

## 🔮 5. Prochaines Étapes (Backlog)
- [ ] **Déploiement Global :** Déployer les fonctions ET le hosting pour valider en ligne.
- [ ] **Chat Tuteur (RAG) :** Intégration d'un bouton d'aide utilisant le cours du professeur comme contexte.
- [ ] **Export Email :** Permettre à l'élève de s'envoyer l'historique du chat/feedback par email pour réviser (via Firebase Trigger Email).
- [ ] **Analytics Professeur :** Widget de "Météo de la classe" analysant les concepts les plus problématiques.

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.