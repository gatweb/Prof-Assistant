# 🚀 ROADMAP & CAHIER DES CHARGES : ProfAssistant V2 (Numérique FMTTN 1re • Dactylographie & Bureautique 3e)

## 🎯 1. Philosophie Pédagogique (RÈGLES D'OR POUR L'AGENT IA)
1. **L'IA est un Tuteur Socratique :** Elle ne doit **JAMAIS** donner la ligne de code corrigée ni la solution finale. Elle pointe l'erreur et pose une question pour faire réfléchir l'élève.
2. **Sévérité Modérée :** Le ton doit être encourageant. Les erreurs de syntaxe mineures sont signalées sans être lourdement pénalisées.
3. **Le Professeur reste maître :** Sauf indication contraire, l'IA suggère une note et un feedback, mais c'est le professeur qui valide et publie (Flux en deux étapes).

## 🛠️ 2. Stack Technique
* **Frontend (`v2/` → compilé dans `public/`) :** Vite, Alpine.js (stores modulaires dans `v2/src/stores/`), Tailwind CSS, Marked + KaTeX.
* **Backend :** Firebase Cloud Functions v2 (Node.js, `europe-west1`).
* **Base de données :** Cloud Firestore (règles testées dans `tests/firestore/rules.test.mjs`).
* **Authentification :** Firebase Auth (Google Workspace ; mode invité 100 % local).
* **Moteur IA :** Gemini via le SDK officiel `@google/genai` (`gemini-2.5-flash` / `gemini-2.5-flash-lite`).
* **La V1 (`public/v1/`) n'est plus utilisée.**

## 🗄️ 3. Architecture de la Base de Données (Firestore)
* **`users/st_<email>` :** classe officielle de l'élève (source de vérité).
* **`progressions_v2/<classe>_<email>` :** XP (incrémentés en transaction), activités récompensées, compétences, état des ateliers.
* **`submissions` :** cycle `brouillon` → `a_valider` → `valide` / `publie`. Seule la note validée par le professeur compte au bulletin.
* **`cours`, `cours/{id}/modules`, `exercices` :** contenu des cours (lecture publique).
* **`exercices_corriges` :** corrigés et barèmes, réservés aux professeurs et aux Cloud Functions.
* **`classes`, `enseignants`, `usage/{uid}` :** liaisons Classroom, équipe enseignante, quotas IA.

## 📍 4. Phase Actuelle : Audit de novembre 2026 — P0 et P1 validés, P2 implémenté (à valider)
* **Fusion V1/V2 (Phases 0 à 6) :** [TERMINÉ & DÉPLOYÉ ✅] Règles Firestore, Multi-Enseignants & Custom Claims, Moteur Multi-Cours V2, Espace Professeur Unifié (`submissions` + matrice), Google Classroom, Google Forms IA, et bascule racine `/` vers la V2.
* **Phase 7 (Fiabilité du Tuteur IA & Sécurité — Plan V3) :** [TERMINÉ & VALIDÉ ✅]
  - **Serveur (`functions/index.js`)** : Connexion obligatoire, quota horaire de 40 appels/élève/h (`usage/{uid}`), résolution stricte du prompt système côté serveur par `course_id`, cascade réduite à 2 modèles vérifiés (`gemini-2.5-flash`, `gemini-2.5-flash-lite`) avec timeout de 12 s par appel, budget total de 25 s, 1 retry avec backoff sur 429/503, `responseSchema` JSON strict, cache mémoire 10 min, gestion des réponses vides et logs JSON structurés.
  - **Client (`v2/`)** : Historique normalisé `role: user|model` (10 derniers messages sans doublon), 3 boutons d'action rapide joignant automatiquement le travail/code de l'élève, messages d'erreur explicites, et repli local réservé au mode hors ligne.
* **Phase 8 (Navigation en entonnoir, Liens profonds & Découpage modulaire) :** [TERMINÉ & VALIDÉ ✅]
  - **Navigation en entonnoir** : Hub « Mes cours » (`studentViewMode === 'hub'`) avec cartes filtrées par classe et jauge de progression en %, Carte du cours (`studentViewMode === 'course'`) avec modules numérotés et accès rapides **📖 Théorie** / **🎯 Missions**, et Mode Focus (`studentViewMode === 'focus'`) avec fil d'Ariane cliquable et boutons **« ← Précédent »** / **« Suivant ➔ »**.
  - **Liens profonds (`?course=&ex=&module=`)** : Lecture automatique au démarrage via `handleDeepLinkParams()` (corrige C1 pour l'ouverture directe des devoirs Classroom).
  - **Refactorisation modulaire (corrige M1)** : `v2/src/main.js` réduit de 2 295 lignes à 42 lignes, découpé en stores spécialisés dans `v2/src/stores/`.
* **Phase 9 (Google Classroom intégré — Plan V3) :** [TERMINÉ & VALIDÉ ✅]
  - **Liaison explicite `classes/{id}.classroom_course_id`** : Association en 1 clic d'un cours Classroom à une classe et un cours ProfAssistant (`saveClassMapping`), détection de classe 100 % fiable par ID Classroom.
  - **Publication enrichie** : Choix entre activité unique (`🎯`) et module entier (`📦`), date/heure limite (`dueDate` / `dueTime`), sélection ou création de thème Classroom (`topicId`).
  - **Renvoi automatique des notes & Synchro du roster** : Option `auto_sync_grades` par classe et détection automatique des nouveaux élèves inscrits dans Classroom avec ajout en 1 clic.
* **Phase 10 (Course Studio sans code & 5 sources d'import IA) :** [TERMINÉ & VALIDÉ ✅]
  - **Modèle & Compatibilité Firestore** : `cours/{id}`, `cours/{id}/modules/{mid}` et `exercices` avec lecture prioritaire Firestore puis repli sur `public/cours/`. Migration en 1 clic des 6 cours existants (`migrateStaticCoursesToFirestore`).
  - **Éditeur sans code (`v2/src/stores/studio.js`)** : Métadonnées, statut brouillon/publié, modules ordonnés avec éditeur Markdown/KaTeX et aperçu élève en direct, missions par type.
  - **5 Sources d'import avec écran de relecture** : Syllabus/PDF (IA `structurerCoursIA`), Google Doc (Drive API + IA), Cours Classroom existant (`courseWorkMaterials` + `courseWork` + IA), Pack de cours JSON (export/import entre collègues) et Duplication de cours modèle en 1 clic.
* **Phase 11 (Outils du professeur : SpeedGrader, Vue classe en direct & Bulletin) :** [TERMINÉ & VALIDÉ ✅]
  - **SpeedGrader en deux volets** : Copie à gauche (code exécuté en sandbox ou aperçu `/preview` Google Doc) et diagnostic IA/notation à droite, avec raccourcis clavier **`J`** / **`K`** et **`Ctrl+Entrée`** (« Valider & Suivant »).
  - **Validation par lot** : Bouton `⚡ Valider par lot` pour toutes les copies en attente remplissant tous les critères (note IA ≥ 80% et 0 erreur).
  - **Vue classe en direct (`getLiveClassStatusList`)** : 5 statuts en direct (⚪ 🔵 🟠 🟣 🟢) avec signal **« 🟠 Bloqué »** dès qu'un élève cumule au moins 2 indices ou 3 appels au tuteur sans soumission.
  - **Échelle de maîtrise & Export Bulletin CSV** : 4 niveaux (`Non acquis`, `En cours`, `Acquis`, `Dépassé`) et export CSV prêt pour le bulletin scolaire (`exporterBulletinCSV`).
* **Phase 12 (Expérience élève : Mascotte évolutive, Arbre de compétences, Autonomie, Drive & Accessibilité) :** [TERMINÉ & VALIDÉ ✅]
  - **Mascotte évolutive @lt_X à 5 stades** : Évolue avec les XP (`🥚` 0 XP → `🤖` 50 XP → `🦾` 150 XP → `🚀` 300 XP → `👑` 500+ XP).
  - **Arbre de compétences visuel & Score d'autonomie** : 3 branches interactives et score d'autonomie en direct (**100% / 80% / 60% / 40%**) enregistré dans chaque soumission.
  - **Vérification du partage Drive avant remise (`verifyDriveFileSharing`)** : Vérifie les permissions (`domain` / `anyone` / `shared`) avec le jeton de l'élève et bloque les documents oubliés en mode privé.
  - **Mode dyslexie & Lecture vocale** : Bouton `👓 Dys` persistant et boutons `🔊 Écouter la consigne` / `🔊 Écouter la leçon` via Web Speech API.
* **Phase 13 (Pilote Multi-Matières : Rédaction, Langues CECRL, Sciences/Maths KaTeX) :** [TERMINÉ & VALIDÉ ✅]
  - **3 Blocs spécialisés (`v2/src/stores/multiSubjects.js`)** : `✍️ Rédaction & Argumentation` (constructeur de plan + connecteurs logiques), `🗣️ Langues Vivantes` (jeu de rôle CECRL A1-B2 en EN/NL/ES avec synthèse vocale native), `🔬 Sciences & Maths` (rendu KaTeX en direct, saisie par étapes et vérification des unités SI).
* **Phase 14 (Novembre 2026 — Tome 1b @lt_X, Espace Professeur Simplifié, Fiabilité XP & Ergonomie Tablette) :** [TERMINÉ & VALIDÉ ✅]
  - **Tome 1b intégral (`@lt_X` — Chapitres 3, 4 et 5)** : Ajout de `chapitre-3-ia.json`, `chapitre-4-donnees.json`, `chapitre-5-creation.json` et `altx-tome1b-bank.json` (18 QCM corrigés + ateliers Prompt 5 étapes, Unités/Export PDF, Logigramme/Scratch).
  - **Illustrations & Ergonomie Tablette/Chromebook** : 8 illustrations jeunesse (`public/img/tome1b/`), schémas visuels (arborescence, logigramme, blocs Scratch), navigation tactile (`min-h-[42px..48px]`, `touch-manipulation`) et « Atelier & Pratique » guidé (`👉 À toi de jouer`).
  - **Espace Professeur simplifié & Bulletin** : Refonte en 4 onglets, vue **Bulletin par élève**, filtres **Année en cours / Comptes inactifs / Archives / Classe `0`**, fusion des doublons, et correction manuelle XP / cours validés.
  - **Fiabilisation XP & Cloisonnement par année** : Suppression du reset XP sur « Quitter », statut vert exact des cours, blocage d'accès inter-années et classe `0` (`getYearLevelFromClass`), alignement complet des 4 classes 2026 (`RAPPORT_ALIGNEMENT_ELEVES_2026.md`).

* **Phase 15 (Novembre 2026 — Audit sécurité / pédagogie / UX, correctifs P0 et P1) :** [TERMINÉ & VALIDÉ ✅]
  - **P0 sécurité (`8f91d66`)** : règles Firestore (propriété par e-mail vérifié, champs professeur intouchables, XP non décroissants), iframes en bac à sable, classe officielle verrouillée, fonctions IA réservées aux comptes identifiés avec quotas, suppression du code maître.
  - **P1 fiabilité** : XP envoyés comme gains en transaction (plus d'écrasement entre appareils), remise à zéro complète à la déconnexion, bulletin calculé sur les seules notes validées, Tome 1b (options mélangées, seuil 4/6, ateliers vierges, feedback sans réponse, persistance), compétence « acquise » après 80 % d'un sous-thème, classes 2026, cache et images allégées.
* **Phase 16 (Novembre 2026 — Confort P2) :** [IMPLÉMENTÉ — À VALIDER PAR LE PROFESSEUR ⏳]
  - **Boîtes de dialogue accessibles** (`v2/src/stores/ui.js`) à la place de `alert` / `confirm`.
  - **Accessibilité** : focus clavier visible, lien d'évitement, cibles tactiles de 44 px, zones de feedback annoncées, respect de « réduire les animations », lecture vocale avec voix française et découpage en phrases.
  - **Moteur de frappe intégré** (`v2/src/stores/typing.js`) : vitesse et précision mesurées pour la dactylographie, résultat transmis au professeur.
  - **Arbre de compétences par année** (1re : FMTTN Tomes 1a/1b ; 3e : clavier et bureautique).
  - **Corrigés des exercices protégés** : collection privée `exercices_corriges` + bouton de migration dans le Course Studio.

## 🔮 5. Prochaines Étapes (Feuille de Route V3 — voir `plan_ameliorations_v3.md`)
- [x] **Phases 0 à 6 (Fusion V1 → V2) :** [OK] Déployées en production.
- [x] **Phase 7 : Fiabilité du Tuteur IA & Sécurité :** [OK] Commit `d69b1ff` (26/26 tests Firestore).
- [x] **Phase 8 : Navigation en entonnoir & Liens profonds (`?course=&ex=`) + Refactorisation modulaire `v2/src/stores/` :** [OK] Commit `15be21d` (26/26 tests Firestore).
- [x] **Phase 9 : Google Classroom intégré (liaison explicite `classroom_course_id`, publication enrichie, auto-sync roster & notes) :** [OK] Commit `fd20369` (28/28 tests Firestore).
- [x] **Phase 10 : Course Studio sans code & 5 sources d'import IA :** [OK] Commit `a32234c` (29/29 tests Firestore).
- [x] **Phase 11 : Outils du professeur (SpeedGrader, validation par lot, vue classe en direct avec signal « bloqué », export bulletin) :** [OK] Commit `b1f2f87` (29/29 tests Firestore).
- [x] **Phase 12 : Expérience élève (Mascotte évolutive 5 stades, Arbre de compétences, score d'autonomie, vérification permissions Drive, mode dyslexie & synthèse vocale) :** [OK] Commit `cea70b7` (29/29 tests Firestore).
- [x] **Phase 13 : Multi-matières (pilote : Rédaction, Langues CECRL, Sciences/Maths KaTeX) :** [OK] Implémentée, buildée et validée (29/29 tests Firestore).
- [x] **Phase 14 : Tome 1b @lt_X, Illustrations jeunesse, Ergonomie Tablette/Chromebook, Espace Professeur 4 onglets & Alignement 2026 :** [OK] Déployée (`8da4562`).
- [x] **Phase 15 : Audit — correctifs P0 (sécurité) et P1 (fiabilité XP, bulletin, Tome 1b) :** [OK] Validés par le professeur.
- [ ] **Phase 16 : Confort P2 (modales, accessibilité, moteur de frappe, arbre par année, corrigés privés) :** implémentée, à valider. Après déploiement : cliquer une fois sur « 🔐 Protéger les corrigés des exercices » dans le Course Studio.
- [ ] **Reste à faire (hors code)** : contenu pédagogique dépendant du manuel @lt_X (chapitre 4 partie 3, compétences NUM-3/4/5, 15 QCM par chapitre du Tome 1b, rééquilibrage des distracteurs du Tome 1a).
- [ ] **Reste à faire (technique)** : chargement différé de l'Espace Professeur, de KaTeX et des données (`import()` dynamique), `x-if` par module, en-tête CSP.

---
### ⚠️ INSTRUCTION POUR L'AGENT DE DÉVELOPPEMENT :
Avant d'exécuter une nouvelle tâche, **tu dois lire ce document**.
Après chaque modification majeure validée par l'utilisateur, **tu dois mettre à jour la section "4. Phase Actuelle" et "5. Prochaines Étapes"** de ce fichier pour refléter l'état réel du projet.