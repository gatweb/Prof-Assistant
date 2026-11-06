# 📘 ProfAssistant V2 : Plateforme Numérique FMTTN (1re Secondaire)
> **Guide de Référence, Architecture & Cahier des Charges Pédagogique**  
> *Aligné sur le Tronc Commun FWB (Pacte d'Excellence) et le manuel officiel @lt_X*

---

## 🎯 1. Contexte & Vision

### 1.1 Le Défi Pédagogique
En Fédération Wallonie-Bruxelles (Belgique), le nouveau tronc commun introduit le cours de **Numérique** au sein de la discipline **FMTTN** (Formation Manuelle, Technique, Technologique et Numérique) dès la 1re année secondaire.
* **Volume horaire :** 2 périodes par semaine (environ 1h40 effectives).
* **Public cible :** Élèves de 11 à 12 ans, arrivant du primaire avec des niveaux de familiarité numérique extrêmement hétérogènes (de l'absence totale de manipulation de souris/clavier à des usages mobiles intuitifs ou du jeu vidéo).
* **Contraintes d'infrastructure :** Parcs informatiques scolaires hétérogènes (PC fixes reconditionnés, Chromebooks, connexions réseau avec proxy et bande passante limitée). **La légèreté, la rapidité de chargement (< 500ms) et l'absence de bugs bloquants sont vitales.**

### 1.2 Le Manuel de Référence : *@lt_X*
Le cours s'appuie sur la méthode pédagogique :  
**@lt_X : Comprendre le numérique, se questionner & agir**  
*(Auteurs : Marie-Pierre Lacroix & Jaouelle Ouanassi – Édition Enseignant Corrigée)*

La méthode est structurée en 5 chapitres répartis en 2 tomes :
* **Tome 1a :**
  * **Chapitre 1 : Communication et collaboration** (Réseaux socio-numériques, courriel, messagerie, nétiquette, éthique).
  * **Chapitre 2 : Sécurité** (Mots de passe, vie privée, traces passives/actives, cyberharcèlement, cyberdépendance, déconnexion).
* **Tome 1b :**
  * **Chapitre 3 : Intelligence Artificielle** *(Spécifique au programme actualisé mars 2026)* (Fonctionnement du ML, limites, prompts éthiques, esprit critique).
  * **Chapitre 4 : Informations et données** (Hardware/software, formats, arborescences, dossiers, sauvegardes).
  * **Chapitre 5 : Création de contenus** (Traitement de texte, algorithmique débranchée, logigrammes, programmation par blocs).

Chaque chapitre applique une progression rigoureuse en 3 étapes :
1. 🔍 **Je découvre :** Parcours de découverte, acquisition du vocabulaire clé, mini-évaluation formative (QCM / diagnostic).
2. ⚙️ **Je pratique :** Activités guidées en labo, synthèses visuelles, bilan personnel d'auto-évaluation par compétences.
3. 🎯 **Je maîtrise :** Consolidation, défi pratique / mission, expression libre.

---

## 💡 2. Pédagogie de la Maîtrise Alignée sur le Référentiel SeGEC

L'approche adoptée pour ProfAssistant V2 réside dans le passage d'une notation chiffrée classique à une **pédagogie de la maîtrise par compétences conforme au programme SeGEC** :

1. **Standards-Aligned (Alignement Référentiel Strict) :**
   * Chaque exercice, quiz ou mission est indexé sur un code précis de compétence FMTTN (issu directement de la grille officielle de la p.21 du manuel @lt_X).
   * L'évaluation ne donne pas une "note sur 20" abstraite, mais valide des critères observables (ex: *« J'utilise en contexte les termes Cc et Cci »* : Acquis / En cours / Non acquis).
2. **Error Pattern Detection (Diagnostic des fausses représentations) :**
   * L'IA ne sanctionne pas bêtement une erreur : elle identifie la fausse croyance (ex: confusion fréquente entre *moteur de recherche* et *navigateur*, ou entre *fichier original* et *raccourci*).
3. **Targeted Remediation & Differentiation (Différenciation en 1 clic) :**
   * En 2 périodes/semaine avec 25 élèves, le professeur ne peut pas concevoir 5 fiches de remédiation manuelles pendant le cours.
   * La plateforme génère automatiquement des micro-défis adaptés aux difficultés détectées pour les élèves en difficulté, pendant que les plus rapides abordent un défi de consolidation.
4. **Teacher-in-the-loop (« AI proposes, Teacher decides ») :**
   * L'IA analyse les réponses libres et propose un diagnostic + un feedback bienveillant.
   * Le professeur garde le contrôle absolu : il valide ou ajuste d'un clic avant toute publication à l'élève.
5. **Classroom Heatmap (« Météo de la classe ») :**
   * Tableau de bord synthétique affichant la matrice des compétences de toute la classe.
   * Permet à l'enseignant de voir immédiatement quelle notion doit être reprise collectivement en début de séance suivante.

---

## 🛠️ 3. Stack Technique V2 (« Légère, Robuste, Pérenne »)

Pour garantir une expérience sans latence sur les PC scolaires tout en maintenant le code propre et modulaire, nous séparons clairement le backend du frontend V2 :

### 3.1 Backend existant (Firebase & Gemini) – Conservé et valorisé
* **Firebase Cloud Functions (Node.js 26) :**
  * Hébergé en Belgique/Europe (`europe-west1` pour conformité RGPD).
  * SDK officiel `@google/genai` avec cascade de modèles (Tier 1 : `gemini-flash-lite`, Tier 2 : `gemini-3.5-flash`, Tier 3 : `gemini-2.5-flash`).
  * Endpoints prêts : `interrogerTuteur`, `corrigerDevoir`, `genererQuizForms`.
* **Cloud Firestore :**
  * Base NoSQL temps réel pour stocker les profils, les classes, la matrice de compétences et les soumissions.
* **Firebase Auth :**
  * Authentification via Google Workspace for Education (comptes école).

### 3.2 Frontend V2 (`v2/`) – Ultra-léger
* **Bundler & Dev Server :** [Vite](https://vitejs.dev) (HMR ultra-rapide, bundle final optimisé).
* **CSS Framework :** [Tailwind CSS](https://tailwindcss.com) (Styling utilitaire, cohérent, sans inflation de fichiers CSS faits-main).
* **Moteur Réactif :** [Alpine.js](https://alpinejs.dev) (< 15 Ko gzippé, logique déclarative dans le DOM, parfait pour les quiz, les onglets, la modale du tuteur et la grille de compétences).
* **Zéro framework lourd :** Pas de React ni d'hydratation complexe qui consommerait la RAM des machines modestes.

---

## 📐 4. Modèle de Données FMTTN (Firestore)

### Structure des Collections :

#### 1. `competences_fmttn`
```json
{
  "code": "NUM-1.1",
  "chapitre": 1,
  "section": "je_decouvre",
  "domaine": "Communication et collaboration",
  "intitule": "J'utilise, en contexte, les termes de la messagerie (expéditeur, destinataire, Cc, Cci, objet, pièce jointe).",
  "mots_cles": ["courriel", "expéditeur", "destinataire", "Cc", "Cci", "spam", "pièce jointe"]
}
```

#### 2. `activites_v2`
```json
{
  "id": "ch1-dec-vocabulaire-courriel",
  "chapitre_id": "ch1-communication",
  "etape": "je_decouvre",
  "titre": "Le vocabulaire du courrier électronique",
  "competences_cibles": ["NUM-1.1"],
  "type": "quiz_interactif",
  "questions": [ ... ],
  "synthese_rapide": "Rappel visuel des champs d'un email..."
}
```

#### 3. `eleves_progressions` (Document par élève)
```json
{
  "eleve_id": "eleve_xyz",
  "classe_id": "1C2",
  "competences": {
    "NUM-1.1": { "etat": "acquis", "score": 100, "date": "2026-09-22" },
    "NUM-1.2": { "etat": "a_renforcer", "score": 40, "derniere_erreur": "Confusion Cc et Cci" }
  }
}
```

---

## 🚀 5. Feuille de Route Opérationnelle (V2 Roadmap)

### Phase 1 : Socle V2 & Chapitre 1 (Validé ✅)
- [x] Exploration et analyse des scans @lt_X 1a et 1b.
- [x] Spécification du cahier des charges V2 et alignement strict avec le programme SeGEC.
- [x] Initialisation du projet Vite + Tailwind + Alpine.js dans `v2/`.
- [x] Modélisation JSON du **Chapitre 1 : Communication et collaboration** (compétences, vocabulaire, 181 QCM de la banque officielle).
- [x] Intégration de la mascotte robot bleue (@lt_X) pour le Tuteur Socratique (avec fallback local et Cloud Function).

### Phase 2 : Espace Élève V2 (Apprenant 1re secondaire - Validé ✅)
- [x] Navigation par onglets ergonomique (Module 0, Escape Game, Chapitre 1, Diaporamas NotebookLM).
- [x] Module 0 : Charte informatique interactive et test de compréhension (OK / PAS OK).
- [x] Escape Game de rentrée : 5 dossiers à énigmes progressives (codes de déverrouillage, détection phishing, explorateur Dossier 4, associations Dossier 5).
- [x] Module "Je pratique" : Simulateur de courriel p.64 avec analyse multi-critères automatique.
- [x] Module "Je maîtrise" : Mission créative d'invention d'application et auto-évaluation bilan personnel p.83.
- [ ] *(En cours d'enrichissement)* : Finalisation des banques d'exercices interactifs pour les chapitres 2 à 5.

### Phase 3 : Dashboard Enseignant V2 & Référentiel SeGEC (Validé ✅)
- [x] Matrice dynamique des compétences FMTTN par classe (Heatmap SeGEC en temps réel).
- [x] Gestion des élèves et classes réelles héritée de la V1 (collection Firestore `users`).
- [x] Détection automatique des motifs d'erreurs fréquents (*Error Patterns*, ex: champ Cci).
- [x] Générateur de remédiations différenciées en 1 clic.
- [x] Synchronisation temps réel Firestore (`/progressions_v2`) avec session anonyme fluide pour les élèves.
- [x] Sélecteur de classes étanches (1A, 1B, 1C, 1D...).

### Phase 4 : Multi-Professeurs, Sécurité & Déploiement (Validé ✅)
- [x] Configuration centralisée des enseignants autorisés (`teachers-config.js`) avec connexion Google Workspace.
- [x] Règles de sécurité Firestore (`firestore.rules`) déployées pour isoler les données.
- [x] Blindage anti-injection du prompt Gemini dans les Cloud Functions.
- [x] Configuration du build Vite pour sortie dans `public/v2` et déploiement Firebase Hosting.

### Phase 5 : Refonte Ergonomique Unifiée (Modèle UAA3) & Système Anti-Spam XP (Novembre 2026 — Validé ✅)
- [x] **Unification de la navigation FMTTN sur le modèle UAA3 (Création de site web)** :
  - Chaque module (Module 0, Escape Game, Chapitre 1, Chapitre 2) comporte désormais exactement **2 onglets principaux** :
    1. **`📖 1. Leçon & Théorie`** : Cours complet en pleine largeur, structuré par sous-chapitres numérotés (`1.1`, `1.2`... / `2.1`, `2.2`...), intégrant tous les encadrés officiels du manuel `@lt_X` (🧠 *Cerveau*, 💡 *Le savais-tu ?*, 💼 *Métier*, 🤖 *IA*), la synthèse vocale (`🔊 Écouter`), tous les **schémas interactifs** et le tableau des 34 compétences officielles en fin de leçon.
    2. **`🎯 2. Atelier & Pratique`** : Barre de **missions numérotées séquentielles** avec **un seul exercice affiché à la fois**, indicateur d'état temps réel (`✅ Terminé` / `À réaliser`), bouton `📖 Relire la leçon` et navigation linéaire (`← Précédent` / `Passer à la mission suivante ➔`).
- [x] **Suppression du mini-diaporama et des cartes NotebookLM redondantes** au profit de la vraie leçon interactive pleine largeur.
- [x] **Allègement de la barre supérieure (`<header>`)** : fusion sur une seule ligne claire avec accès direct `🏠 Mes cours`, masquage de la barre de fil d'Ariane redondante sur le Hub d'accueil, et affichage des pastilles de missions directement sur la Carte du Cours.
- [x] **26 Missions interactives réparties sur les 4 modules FMTTN** :
  - **Module 0 (2 missions)** : `1. Jeu Charte : OK ou PAS OK ?` • `2. Atelier : Mot de passe blindé & Déconnexion (1-3-4-2)`.
  - **Escape Game (5 missions)** : `Dossier 1 : Morse` • `Dossier 2 : Phishing` • `Dossier 3 : IA Atomium` • `Dossier 4 : Fichier Fantôme` • `Dossier 5 : Extensions`.
  - **Chapitre 1 (8 missions)** : 4 Quiz thématiques (`Réseaux`, `Messagerie`, `Éthique & IA`, `Outils & Cloud`) + `5. Atelier Courriel Cci (p. 64)` + `6. Défi Traducteur Nétiquette (p. 43 & 59)` + `7. Projet Application (p. 84)` + `8. Bilan Auto-évaluation (p. 83)`.
  - **Chapitre 2 (11 missions)** : 5 Quiz thématiques (`Profil`, `PEGI & BienVu`, `Cyberrisques`, `Attention & 3P`, `Traces & IP`) + `6. Inspecteur HTTPS (p. 106)` + `7. Tri Données Actives vs Passives (p. 114)` + `8. Défi Profil de Lucas (p. 125)` + `9. Défi Permissions de Lina (p. 114)` + `10. Projet Campagne 3 Réflexes (p. 158)` + `11. Bilan Auto-évaluation (p. 147)`.
- [x] **Système Anti-Spam XP & Persistance Double (LocalStorage + Firestore)** :
  - Chaque activité (`rewarded_activities`) ne donne des XP **qu'une seule fois à vie** (`attribuerXpUnique`).
  - Déduplication côté serveur (`corrigerDevoir` dans `functions/index.js`) et outil enseignant de purge des doublons + recalcul d'XP + avertissement élève (`purgerSpamEtSanctionner`).
  - Double sauvegarde locale (`profassistant_fmttn_state_<user>`) et Cloud Firestore (`progressions_v2`) garantissant que les 4 **Badges de Maîtrise Officiels `@lt_X`** (*Gardien du Poste*, *Détective des 5 Dossiers*, *Maître Courriel & Cci*, *Citoyen Cyber-Responsable*) restent définitivement débloqués après rafraîchissement.

### Phase 6 : Refonte Ergonomique de l'Espace Professeur & Synchronisation Google Classroom 1-Clic (Novembre 2026 — Validé ✅)
- [x] **Navigation Enseignant simplifiée en 4 grands piliers (sans barre de défilement horizontale cachée)** :
  1. **`📥 1. Copies à corriger`** : Cartes statistiques cliquables en 1 clic, filtres unifiés, pagination fluide (25 copies par page + *Afficher plus*) et SpeedGrader.
  2. **`📊 2. Suivi & Notes`** : Activité des élèves en direct (`⚪ 🔵 🟠 🟣 🟢`), Matrice de maîtrise des acquis SeGEC, Fiche de remédiation et Export Bulletin CSV.
  3. **`🏫 3. Classes & Classroom`** : Gestion unifiée des classes, de la liste des élèves et de Google Classroom sur un seul écran clair.
  4. **`🛠️ 4. Cours & Outils IA`** : Regroupement structuré de l'Éditeur de Cours (*Course Studio*), du Générateur de Quiz Google Forms IA, des supports NotebookLM et de l'Équipe Enseignante.
- [x] **Récupération automatique des classes et élèves depuis Google Classroom (`synchroniserToutesMesClassesClassroom`)** :
  - Demande des scopes OAuth Classroom dès la connexion Google Enseignant (`loginProfesseurGoogle`) et persistance du jeton (`localStorage` + `sessionStorage`).
  - Bouton 1-clic **« 🏫 Récupérer / Synchroniser mes classes Classroom »** directement dans l'en-tête : détecte tous les cours Google Classroom actifs du professeur, déduit ou associe le code de classe (`inferClassCodeFromCourse`), crée les liaisons Firestore (`classes/{id}`) et importe tous les élèves par lot (`upsertClassroomRosterBatch`) sans doublon et sans écraser les XP existants.
- [x] **Sélecteur de classe unique et synchronisé** :
  - Choisir une classe (ou `🌍 Toutes mes classes`) dans l'en-tête filtre simultanément les copies à corriger, le suivi en direct, la matrice et la liste d'élèves.
  - Les classes actives (liées à Classroom ou contenant des élèves/copies) s'affichent automatiquement en tête avec leur nombre d'élèves (`getClassCardsSummary`).
- [x] **Bandeau Anti-Spam discret et rassurant** :
  - Remplacement de l'ancien grand bloc rouge d'alerte par une barre calme d'une seule ligne intégrée aux filtres (`🛡️ Regrouper les essais multiples (1 copie/élève)` + bouton `🧹 Supprimer X doublon(s)` + tiroir pliable `⚖️ Régulation XP` ouvert uniquement à la demande).

---

## 👥 6. Gestion Multi-Enseignants & Multi-Classes

### 6.1 Liste blanche des professeurs (`teachers-config.js`)
L'authentification Google restreint l'accès à la matrice enseignant aux adresses définies dans `v2/src/services/teachers-config.js` :
```javascript
export const ALLOWED_TEACHERS = [
  { email: "gatweb@gmail.com", nom: "Professeur Fondateur", classes: ["1A", "1B", "1C", "1D"] },
  { email: "collegue1@ecole.be", nom: "Professeur 1A / 1B", classes: ["1A", "1B"] },
  { email: "collegue2@ecole.be", nom: "Professeur 1C / 1D", classes: ["1C", "1D"] }
];
```

### 6.2 Parcours Élève sans mot de passe
Pour s'adapter aux contraintes de la salle informatique avec des élèves de 11 ans :
- L'élève choisit simplement sa classe (`1A`, `1B`...) dans le bandeau supérieur.
- Il indique son prénom/nom une seule fois (stocké en `localStorage`).
- Une session anonyme Firebase Auth est créée silencieusement pour synchroniser les données dans Firestore sous `/progressions_v2/{classeId}_{eleveId}`.


---

## 9. Phase 7 — Activation API Google Classroom, Cours complet « Bureautique & Google Workspace (3e) » & Optimisation du Bundle JS

### 9.1 Activation des API Google Cloud (`classroom`, `forms`, `drive`)
- Activation directe sur le projet GCP `profassistant-61fde` (`429919803539`) via Google Cloud SDK :
  - `classroom.googleapis.com`
  - `forms.googleapis.com`
  - `drive.googleapis.com`
- Gestion bienveillante dans [`v2/src/stores/classroom.js`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/stores/classroom.js) lorsqu'un compte enseignant n'a encore aucun cours actif sur Google Classroom.

### 9.2 Cours complet « Bureautique & Google Workspace (3e) » (`bureautique-3e`)
- **4 modules théoriques illustrés et structurés** dans `public/cours/bureautique-3e/` :
  1. [`01_drive_organisation.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/public/cours/bureautique-3e/01_drive_organisation.md) : Stockage Cloud vs Local, arborescence numérotée (`01_`, `02_`), code couleur, convention de nommage (`BUR_Ex01_Sujet_NomPrenom`), les 3 niveaux de droits (**Lecteur / Commentateur / Éditeur**) et piège de l'accès *Limité*.
  2. [`02_docs_mise_en_page.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/public/cours/bureautique-3e/02_docs_mise_en_page.md) : Configuration de la page A4 & marges 2,5 cm, les 4 alignements (**Justifié `Ctrl+Maj+J`**), interlignes 1,15 et espacement après paragraphe, les 8 raccourcis vitaux (dont **`Ctrl+Maj+V`** *Coller sans mise en forme*), habillage d'image (*Adapter le texte*) et tableaux.
  3. [`03_styles_sommaires.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/public/cours/bureautique-3e/03_styles_sommaires.md) : Styles hiérarchiques (**Titre 1 / Titre 2 / Titre 3**), mise à jour automatique des styles, **Table des matières dynamique**, **Saut de page (`Ctrl+Entrée`)** vs **Saut de section**, et numérotation avec *Première page différente*.
  4. [`04_typographie_dactylographie.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/public/cours/bureautique-3e/04_typographie_dactylographie.md) : Règles de ponctuation française et norme NBN (signes simples `.` `,` vs signes doubles `:` `;` `!` `?`), **espace insécable (`Ctrl+Maj+Espace`)**, guillemets français `« … »`, majuscules accentuées (`À`, `É`, `È`, `Ç`) et les 5 péchés capitaux de la lisibilité.
- **8 activités progressives** dans [`v2/src/services/courseManager.js`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/services/courseManager.js) : chaque module dispose d'un **Quiz interactif de 5 QCM** (`bur-m1-quiz` à `bur-m4-quiz`) suivi d'une **Mission pratique Google Drive/Docs** (`bur-ex2`, `bur-ex1`, `bur-ex3`, `bur-ex4`).

### 9.3 Découpage du Bundle JS (Code Splitting Vite 8 / Rolldown)
- Configuration de `rolldownOptions.output.codeSplitting.groups` dans [`v2/vite.config.js`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/vite.config.js) en **8 chunks spécialisés** (< 500 kB chacun, 0 avertissement de build) :
  - `vendor-firestore`, `vendor-katex`, `data-fmttn`, `index`, `workspace-teacher`, `vendor-firebase`, `vendor-alpine`, `vendor-markdown`.

---

## 10. Phase 8 — Déduplication Intelligente des Élèves, Filtre par Année Scolaire & Vue « 📋 Bulletin Scolaire Individuel »

### 10.1 Élimination des doublons d'élèves et des comptes fantômes (`firebase.js` & `teacher.js`)
- **Normalisation par jetons de nom et adresse e-mail (`normalizeStudentNameTokens`)** :
  - Fusionne automatiquement les entrées `users` et `progressions_v2` appartenant au même élève, même si l'ordre Prénom/Nom diffère (`"Dupont Lucas"` == `"Lucas DUPONT"`) ou si un document a été créé avec un `uid` anonyme avant la connexion Google Classroom.
  - Filtre automatiquement les comptes de démonstration/fantômes (`"Élève"`, `"Élève Invité"`, `"Anonyme"`, `"invite@demo.local"`).
  - Bouton 1-clic **« 🧹 Fusionner doublons & Ranger anciens »** (`nettoyerDoublonsEtAnciensEleves()`) qui nettoie et consolide physiquement les documents Firestore en doublon tout en conservant le maximum d'XP, le meilleur score et l'adresse e-mail Google.

### 10.2 Filtre par Année Scolaire, Comptes Inactifs & Vue « Années précédentes »
- Barre de filtrage rapide présente à la fois dans **`📊 2. Suivi & Notes`** et **`🏫 3. Classes & Classroom`** :
  - **`🟢 Année 2026-2027 (Actifs)`** *(vue par défaut)* : affiche uniquement les élèves de l'année en cours ou ayant une activité réelle, pour ne jamais encombrer la vue du professeur.
  - **`💤 Comptes inactifs (0 XP / 0 devoir)`** : isole les comptes sans activité pour vérification ou nettoyage.
  - **`🗄️ Années précédentes & Archives`** : vue dédiée aux élèves des années scolaires antérieures ou archivés manuellement, avec bouton **`🗄️ Archiver / ↩️ Restaurer`** en 1 clic (`archiverOuRestaurerEleve`).
  - **`🌍 Tous`** : vue complète de tous les profils enregistrés.

### 10.3 Vue « 📋 Bulletin Scolaire Individuel » (`modalBulletinEleveOpen`)
- Accessible en **1 clic sur n'importe quel élève** (depuis les cartes du suivi en direct, les matrices de compétences ou la liste des classes) :
  - **En-tête avec navigation rapide `◀ Précédent / Suivant ▶`** pour faire défiler tous les élèves de la classe lors de la préparation des conseils de classe ou de l'encodage des bulletins.
  - **4 indicateurs synthétiques** :
    1. **Moyenne générale sur `/20` et `/100`** calculée sur l'ensemble des travaux et quiz dédupliqués de l'élève.
    2. **Niveau de maîtrise officiel SeGEC / FW-B** (`Code D` Dépassement ≥85%, `Code A` Acquis ≥70%, `Code EC` En cours ≥50%, `Code NA` Non acquis <50%).
    3. **Bilan des travaux remis** (validés vs en attente de correction).
    4. **Engagement (XP) & Score d'Autonomie** face au tuteur IA Socratique.
  - **Grille détaillée des compétences du référentiel** (`NUM-1.D1` à `NUM-2.M1`).
  - **Tableau récapitulatif des copies et évaluations de l'élève** avec accès direct `🔍 Voir copie` vers le SpeedGrader.
  - **Appréciation pédagogique automatique et modifiable** : génère une synthèse prête à être copiée en 1 clic (`📋 Copier pour le bulletin` pour Smartschool / Pronote), sauvegardée dans Firestore (`💾 Enregistrer sur la fiche élève`) ou imprimée en PDF (`🖨️ Imprimer / PDF`).

