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

## 📍 4. Phase Actuelle : Plan d'Amélioration V3 — Phases 7, 8 & 9 Terminées ✅ (En route vers Phase 10)
* **Fusion V1/V2 (Phases 0 à 6) :** [TERMINÉ & DÉPLOYÉ ✅] Règles Firestore, Multi-Enseignants & Custom Claims, Moteur Multi-Cours V2, Espace Professeur Unifié (`submissions` + matrice), Google Classroom, Google Forms IA, et bascule racine `/` vers la V2.
* **Phase 7 (Fiabilité du Tuteur IA & Sécurité — Plan V3) :** [TERMINÉ & VALIDÉ ✅]
  - **Serveur (`functions/index.js`)** : Connexion obligatoire, quota horaire de 40 appels/élève/h (`usage/{uid}`), résolution stricte du prompt système côté serveur par `course_id`, cascade réduite à 2 modèles vérifiés (`gemini-2.5-flash`, `gemini-2.5-flash-lite`) avec timeout de 12 s par appel, budget total de 25 s, 1 retry avec backoff sur 429/503, `responseSchema` JSON strict, cache mémoire 10 min, gestion des réponses vides et logs JSON structurés.
  - **Client (`v2/`)** : Historique normalisé `role: user|model` (10 derniers messages sans doublon), 3 boutons d'action rapide joignant automatiquement le travail/code de l'élève, messages d'erreur explicites, et repli local réservé au mode hors ligne.
* **Phase 8 (Navigation en entonnoir, Liens profonds & Découpage modulaire) :** [TERMINÉ & VALIDÉ ✅]
  - **Navigation en entonnoir** : Hub « Mes cours » (`studentViewMode === 'hub'`) avec cartes filtrées par classe et jauge de progression en %, Carte du cours (`studentViewMode === 'course'`) avec modules numérotés et accès rapides **📖 Théorie** / **🎯 Missions**, et Mode Focus (`studentViewMode === 'focus'`) avec fil d'Ariane cliquable et boutons **« ← Précédent »** / **« Suivant ➔ »**.
  - **Liens profonds (`?course=&ex=&module=`)** : Lecture automatique au démarrage via `handleDeepLinkParams()` (corrige C1 pour l'ouverture directe des devoirs Classroom).
  - **Refactorisation modulaire (corrige M1)** : `v2/src/main.js` réduit de 2 295 lignes à 33 lignes, découpé en 7 stores dans `v2/src/stores/` (`auth.js`, `course.js`, `fmttn.js`, `tutor.js`, `teacher.js`, `classroom.js`, `forms.js`).
* **Phase 9 (Google Classroom intégré — Plan V3) :** [TERMINÉ & VALIDÉ ✅]
  - **Liaison explicite `classes/{id}.classroom_course_id`** : Écran enseignant permettant de lier en 1 clic un cours Classroom à une classe et à un cours ProfAssistant (`saveClassMapping`).
  - **Détection fiable à 100 %** : `detectClassFromCourses` reconnaît désormais la classe d'un élève directement par l'ID de son cours Classroom (regex en secours — corrige C2).
  - **Publication enrichie** : Choix entre activité unique (`🎯`) et module entier (`📦`), date/heure limite (`dueDate` / `dueTime`), sélection ou création de thème Classroom (`topicId` via API Topics).
  - **Renvoi automatique des notes & Synchro du roster** : Option `auto_sync_grades` par classe renvoyant la note vers Classroom dès la validation d'une copie, et détection automatique des nouveaux élèves inscrits dans Classroom avec ajout en 1 clic.
  - **Tests Firestore** : **28/28 tests unitaires passés** sur l'émulateur (`classes`, `eleves`, `usage`).
* **Phase en cours :** Phase 10 — Course Studio sans code & 5 sources d'import IA.

## 🔮 5. Prochaines Étapes (Feuille de Route V3 — voir `plan_ameliorations_v3.md`)
- [x] **Phases 0 à 6 (Fusion V1 → V2) :** [OK] Déployées en production.
- [x] **Phase 7 : Fiabilité du Tuteur IA & Sécurité :** [OK] Commit `d69b1ff` (26/26 tests Firestore).
- [x] **Phase 8 : Navigation en entonnoir & Liens profonds (`?course=&ex=`) + Refactorisation modulaire `v2/src/stores/` :** [OK] Commit `15be21d` (26/26 tests Firestore).
- [x] **Phase 9 : Google Classroom intégré (liaison explicite `classroom_course_id`, publication enrichie, auto-sync roster & notes) :** [OK] Implémentée, buildée et validée (28/28 tests Firestore).
- [ ] **Phase 10 : Course Studio sans code & 5 sources d'import IA**
- [ ] **Phase 11 : Outils du professeur (SpeedGrader, validation par lot, vue classe en direct avec signal « bloqué », export bulletin)**
- [ ] **Phase 12 : Expérience élève (Arbre de compétences, score d'autonomie, vérification permissions Drive, mode dyslexie & synthèse vocale)**
- [ ] **Phase 13 : Multi-matières (pilote)**

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.