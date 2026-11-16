# 📘 Documentation Complète — ProfAssistant (V2)

> **Plateforme pédagogique interactive** (Fédération Wallonie-Bruxelles / SeGEC)  
> **URL de production** : `https://profassistant-61fde.web.app`  
> **Dernière mise à jour** : Novembre 2026

---

## 1. Vue d'ensemble & Publics cibles

ProfAssistant est une plateforme EdTech légère conçue pour les **PC scolaires modestes, Chromebooks et tablettes** :
- **1re Secondaire (11–12 ans) — `Numérique FMTTN 1re (@lt_X)`** (`fmttn-1re`) : programme officiel SeGEC basé sur les manuels *@lt_X Tome 1a & Tome 1b*.
- **3e Secondaire (13–14 ans)** :
  - `Dactylographie & Clavier Pro (3e)` (`dactylo-3e`)
  - `Bureautique & Google Workspace (3e)` (`bureautique-3e`)
- **Autres parcours / Studio** (`creation-site-web`, `js-uaa5-classic`, `rap-academy-workspace`, `studio-creatif`) gérés via `public/cours/` et Firestore `cours`.

---

## 2. Architecture Technique

### 2.1 Frontend (`v2/` → compilé dans `public/`)
- **Stack** : Vite (`v8.3`), Alpine.js, Tailwind CSS, Marked + KaTeX (découpés en chunks dédiés `vendor-alpine`, `vendor-firebase`, `vendor-firestore`, `vendor-katex`, `vendor-markdown`, `data-fmttn`, `workspace-teacher`).
- **Point d'entrée UI** : `v2/index.html` (interface élève Hub → Carte du cours → Mode Focus, et Espace Professeur).
- **Stores modulaires (`v2/src/stores/`)** :
  - `auth.js` : authentification Google Workspace (`@iscdl.be` / comptes autorisés), gestion du profil élève/prof, protection des XP lors de la déconnexion (aucune remise à zéro sur « Quitter »), chargement & fusion `chargerProgressionEleveReelle`.
  - `course.js` : navigation en entonnoir (`hub` / `course` / `focus`), liens profonds `?course=&ex=&module=`, filtrage strict des cours par niveau (`getYearLevelFromClass` : `3*` → `3e`, `2*` → `2e`, `0` → `none` sans accès aux cours, autres → `1re`), calcul du `%` d'achèvement et statut vert des cours terminés.
  - `fmttn.js` : moteur complet du cours FMTTN 1re (@lt_X Tomes 1a & 1b), banques de QCM mélangées par session, ateliers interactifs, XP uniques (`attribuerXpUnique`).
  - `teacher.js` : Espace Professeur unifié à 4 onglets (*Copies à corriger*, *Suivi & Notes*, *Classes & Classroom*, *Cours & Outils IA*), vue **Bulletin par élève**, correction manuelle XP / validation de cours, filtres *Année en cours / Comptes inactifs / Archives / Classe 0*, SpeedGrader (`J`/`K`, `Ctrl+Entrée`), validation par lot, vue classe en direct, export CSV.
  - `classroom.js` : synchronisation Google Classroom (classes, roster d'élèves, publication de devoirs avec date limite/thème, renvoi des notes).
  - `studio.js` : Course Studio sans code (édition Markdown/KaTeX + 5 sources d'import IA).
  - `forms.js` : générateur de Google Forms via IA.
  - `tutor.js` : Tuteur Socratique IA connecté aux Cloud Functions.
  - `studentExperience.js` : mascotte évolutive à 5 stades, arbre de compétences, score d'autonomie, mode dyslexie `👓 Dys`, lecture vocale TTS (`🔊 Écouter`), vérification de partage Google Drive (`verifyDriveFileSharing`).
  - `multiSubjects.js` : blocs pilote Rédaction, Langues CECRL et Sciences/Maths KaTeX.

### 2.2 Backend & Sécurité (`functions/index.js` & `firestore.rules`)
- **Cloud Functions (`europe-west1`, Node.js)** :
  - `interrogerTuteur` : Tuteur Socratique Gemini (`gemini-2.5-flash` / `gemini-2.5-flash-lite`), quota **40 appels/élève/heure** (`usage/{uid}`), timeout 12 s, budget 25 s, `responseSchema` strict, résolution serveur du `systemPrompt` par `course_id`.
  - `corrigerDevoir`, `genererQuizForms`, `structurerCoursIA`.
- **Règles Firestore (`firestore.rules`)** : isolation par `uid`/`email`, droits enseignants via collection `enseignants` et Custom Claims.

### 2.3 Modèle de Données Firestore
- `users/{email}` : `{ email, nom, classe, role, targetYear, allowedCourses, archived }` — source de vérité prioritaire pour la classe officielle de l'élève.
- `progressions_v2/{classe}_{emailKey}` : progression complète (`xp`, `rewarded_activities`, `competences`, `bilan_personnel`, `bilan_personnel_ch2`, `defis_ludiques`, `badges_altx`, `manual_completed_courses`, `active_course_id`, `classe`, `classe_id`).
- `submissions/{id}` : devoirs remis (cycle `brouillon` → `a_valider` → `publie`, note, feedback IA/prof, score d'autonomie).
- `cours/{id}` & `cours/{id}/modules/{mid}` : contenu dynamique du Studio.
- `classes/{id}` : liaison explicite `classroom_course_id` et options de synchro.

---

## 3. Contenu Pédagogique FMTTN 1re (@lt_X Tomes 1a & 1b)

### Tome 1a (`v2/src/data/`)
- **Module 0** (`module-0-introduction.json`) : Charte informatique (6 situations), mot de passe robuste & ordre de déconnexion `1-3-4-2`.
- **Escape Game** (`escape-game-data.json`) : 5 dossiers d'investigation collaboratifs.
- **Chapitre 1 : Communication & Collaboration** (`chapitre-1-communication.json` + `altx-bank.json`) : Réseaux, Messagerie (`Cc`/`Cci`), Éthique, Outils & Cloud + Simulateur d'e-mail.
- **Chapitre 2 : Sécurité & Données personnelles** (`chapitre-2-securite.json` + `altx-bank.json`) : Profil & sécurité, Signalétique, Cyberharcèlement, Confidentialité (`HTTP` vs `HTTPS`), Identité & traces + Projet 3 Réflexes + Bilan.

### Tome 1b (`v2/src/data/`)
- **Chapitre 3 : Intelligence Artificielle\*** (`chapitre-3-ia.json`, p. 9–72) : IA classique vs IA générative, 4 étapes du Machine Learning, limites (hallucinations, biais, écologie), Charte *« L'IA et moi »*, méthode du prompt en 5 étapes (*Rôle, Tâche, Contexte, Format, Ajustement*), 6 familles d'outils d'IA + Quizz (6 Q) & Atelier Prompt Builder.
- **Chapitre 4 : Informations et Données** (`chapitre-4-donnees.json`, p. 73–126) : Hardware/Software, RAM/ROM/Stockage, extensions & logiciels, réseau (routeur, IP, Wi-Fi/Ethernet/Bluetooth), tailles (`o < Ko < Mo < Go < To`), `Ctrl+S` vs Export `.pdf`, arborescence visuelle + Quizz (6 Q) & Atelier Fichiers/Export.
- **Chapitre 5 : Création de Contenus** (`chapitre-5-creation.json`, p. 127–172) : Traitement de texte (marges, en-tête/pied, saut de page, puces, note de bas de page), variables vs constantes, écologie du numérique & *Fake News* (mésinformation vs désinformation), algorithme, schéma visuel de logigramme & blocs Scratch (`360° ÷ 3 = 120°`) + Quizz (6 Q) & Atelier Logigramme/Scratch.

### Illustrations & Ergonomie Tablette/Chromebook
- **8 illustrations vectorielles jeunesse** dans `public/img/tome1b/` (`m0-welcome-hero.jpg`, `ch1-comm-hero.jpg`, `ch2-secu-hero.jpg`, `ch3-ia-hero.jpg`, `ch3-ia-ethics.jpg`, `ch4-donnees-hero.jpg`, `ch5-creation-hero.jpg`, `atelier-mission-hero.jpg`).
- **Interface tactile** : boutons `min-h-[42px..48px]`, `touch-manipulation`, `flex-wrap`, barre de progression animée des missions et consignes guidées (`👉 À toi de jouer`).

---

## 4. Gestion des Classes & Alignement 2026
- Répartition officielle vérifiée dans [RAPPORT_ALIGNEMENT_ELEVES_2026.md](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/RAPPORT_ALIGNEMENT_ELEVES_2026.md) :
  - **3e année** (`3GA`, `3GB`, `3GC`, `3GD`) : accès exclusif à `Dactylographie & Clavier Pro (3e)` et `Bureautique & Google Workspace (3e)`.
  - **1re année** (`S1-A`) : accès exclusif à `Numérique FMTTN 1re (@lt_X)`.
  - **Classe `0`** : anciens comptes / non-inscrits / `QUIT` (aucun cours débloqué).

