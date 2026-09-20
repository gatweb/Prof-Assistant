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

## 📍 4. Phase Actuelle : Lancement V2 FMTTN (1re secondaire) & Approche ed.ai [EN COURS 🏗️]
* **Cible :** 1re secondaire FWB (Tronc commun, 2 périodes/semaine), basé sur le manuel *@lt_X* (Lacroix & Ouanassi).
* **Architecture V2 :** Nouveau frontend ultra-léger dans `/v2` (Vite + Tailwind CSS + Alpine.js) connecté au backend Firebase/Gemini existant.
* **Philosophie ed.ai :** Évaluation par compétences (standards-aligned), détection des conceptions erronées (*error patterns*), et remédiation différenciée en un clic.
* **Documentation :** Cahier des charges complet rédigé dans `DOCS_V2_FMTTN.md`.

## 🔮 5. Prochaines Étapes (Backlog V2)
- [x] **Documentation & Cadrage V2 :** Rédaction de `DOCS_V2_FMTTN.md` et analyse des scans @lt_X.
- [/] **Initialisation Frontend V2 :** Setup Vite + Tailwind CSS + Alpine.js dans `v2/`.
- [ ] **Modélisation Chapitre 1 :** Fichier JSON structuré du Chapitre 1 (*Communication et collaboration*) avec compétences, termes clés et mini-quiz.
- [ ] **Mascotte & Tuteur Socratique V2 :** Intégration du persona robot bleu d'@lt_X avec Gemini.
- [ ] **Dashboard Professeur V2 :** Matrice de maîtrise des compétences FMTTN par classe et par élève (façon ed.ai).
- [ ] **Générateur de Remédiation :** Micro-activités de renfort automatisées pour les erreurs récurrentes.

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.