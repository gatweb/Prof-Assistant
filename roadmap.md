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

## 📍 4. Phase Actuelle : Fusion V1/V2 — Phase 1 Validée & Déployée en Production 🚀
* **Phase 0 (Sécurisation & Règles Firestore) :** [TERMINÉ ✅] Réécriture complète de `firestore.rules`, accès élèves V1 restaurés (cours, config, devoirs, examens, indices), progressions V2 rattachées à la session Firebase Auth, et 24 tests unitaires validés sur émulateur.
* **Phase 1 (Socle Multi-Enseignants & Rôles) :** [TERMINÉ & DÉPLOYÉ ✅]
  - Collection Firestore `enseignants` dynamique (fin des listes blanches statiques).
  - Cloud Functions déployées : `synchroniserProfilEnseignant`, `listerEnseignants`, `enregistrerEnseignant`, `supprimerEnseignant`.
  - Attribution automatique des **Custom User Claims Firebase Auth** (`role: 'admin' | 'enseignant'`) pour validation instantanée.
  - Interface complète "🧑‍🏫 Équipe Enseignante" intégrée dans les dashboards V1 (`admin.html`) et V2 (`v2/index.html`).
* **Phase en cours :** Phase 2 — Moteur de cours modulaire & Harmonisation des Workspaces dans la V2.

## 🔮 5. Prochaines Étapes (Feuille de Route de Fusion)
- [x] **Phase 0 : Sécurisation & Rétrocompatibilité Règles Firestore :** [OK] Déployé en production.
- [x] **Phase 1 : Multi-Enseignants Centralisé & Rôles :** [OK] Cloud Functions, règles et interfaces déployées.
- [ ] **Phase 2 : Moteur de Cours Modulaire V2 :**
  - Rendre la V2 multi-cours (intégration du catalogue V1 : Bureautique 3e, Création Web, Dactylo, JS UAA5, Studio Créatif, Rap Academy + FMTTN 1re).
  - Portage des workspaces interactifs (`office`, `coding` avec Monaco, `creative`, `quizz`).
- [ ] **Phase 3 : Espace Professeur Unifié V2 :**
  - Fusion du flux de validation des devoirs V1 (`submissions`) dans le design V2.
  - Heatmap des compétences disponible pour tous les cours.
- [ ] **Phase 4 : Intégration Google Classroom :**
  - Authentification OAuth prof avec scopes Classroom.
  - Importation automatique des classes et élèves.
  - Publication des devoirs et synchronisation des notes en retour.
- [ ] **Phase 5 : Intégration Avancée Google Forms & Drive :**
  - Synchronisation bidirectionnelle des résultats des formulaires auto-corrigés.
- [ ] **Phase 6 : Bascule Finale :**
  - Redirection de la racine `/` vers la V2 unifiée.

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.