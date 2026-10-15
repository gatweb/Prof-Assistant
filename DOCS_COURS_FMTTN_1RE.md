# 📘 Documentation Officielle : Cours Numérique FMTTN 1re (@lt_X)
> **Plateforme ProfAssistant V2 — Référentiel SeGEC & Tronc Commun FWB**  
> *Méthode pédagogique : @lt_X (Comprendre le numérique, se questionner & agir)*  
> *Auteurs du manuel : Marie-Pierre Lacroix & Jaouelle Ouanassi (Édition Enseignant Corrigée)*

---

## 🎯 1. Vue d'Ensemble & Cadre Pédagogique

Dans le cadre du nouveau Tronc Commun en Fédération Wallonie-Bruxelles (Pacte d'Excellence), le cours de **Numérique** est dispensé en 1re année secondaire au sein de la discipline **FMTTN** (Formation Manuelle, Technique, Technologique et Numérique) à raison de 2 périodes hebdomadaires.

ProfAssistant V2 intègre nativement ce cours avec :
* **Un tuteur socratique IA (@lt_X)** : Guide bienveillant adapté aux 11-12 ans, ne donnant jamais la réponse brute.
* **Une progression par compétences SeGEC** : Validation de critères observables (Acquis / En cours / À renforcer).
* **Des activités interactives immersives** : Escape game, simulateur d'email, simulateur HTTP / cybersécurité, et bilans personnels d'auto-évaluation.

---

## 📂 2. Emplacement des Documents Sources (Poste Local)

| Document | Emplacement Local | Description |
| :--- | :--- | :--- |
| **Manuel @lt_X Tome 1a (PDF 164 pages)** | [`/home/gaetan/Téléchargements/@LT_X 1a.pdf`](file:///home/gaetan/T%C3%A9l%C3%A9chargements/@LT_X%201a.pdf) | Scan officiel enseignant contenant le Module 0, l'Escape Game, le Chapitre 1 et le Chapitre 2. |
| **Présentation Méthode @lt_X** | [`/home/gaetan/Téléchargements/The_@LT_X_Digital_Citizenship_Method.pptx`](file:///home/gaetan/T%C3%A9l%C3%A9chargements/The_@LT_X_Digital_Citizenship_Method.pptx) | Diaporama de cadrage pédagogique. |
| **Mission Control & Diaporamas** | [`/home/gaetan/Téléchargements/Digital_Mission_Control.pptx`](file:///home/gaetan/T%C3%A9l%C3%A9chargements/Digital_Mission_Control.pptx) | Diaporama de support pour les animations en classe. |
| **Ateliers Numériques** | [`/home/gaetan/Documents/COURS_INFO_2026_MD/Présentation/ProfAssistant — Ateliers Numériques.pptx`](file:///home/gaetan/Documents/COURS_INFO_2026_MD/Pr%C3%A9sentation/ProfAssistant%20%E2%80%94%20Ateliers%20Num%C3%A9riques.pptx) | Présentation des ateliers informatiques Saint-Charles. |
| **Programme SeGEC Officiel** | [`Ext/Cours/PROGRAMME_INFORMATIQUE_SEGEC.pdf`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/Ext/Cours/PROGRAMME_INFORMATIQUE_SEGEC.pdf) | Programme et socles de compétences SeGEC. |

---

## 🧩 3. Modules Déjà Intégrés dans la Plateforme (Tome 1a)

Tous les modules du Tome 1a sont opérationnels dans [`v2/src/data/`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data) et pilotés par le store [`v2/src/stores/fmttn.js`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/stores/fmttn.js) :

### 3.1 Module 0 : Bienvenue & Charte Informatique
* **Fichier de données** : [`v2/src/data/module-0-introduction.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/module-0-introduction.json)
* **Contenu** : Règles de vie du laboratoire informatique, principes de respect du matériel et test interactif « OK / PAS OK » sur les comportements numériques.

### 3.2 Escape Game de Rentrée (5 Dossiers d'Investigation)
* **Fichier de données** : [`v2/src/data/escape-game-data.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/escape-game-data.json)
* **Contenu** : Déverrouillage progressif par codes secrets, repérage d'indices de phishing, navigation dans l'explorateur de fichiers virtuel et associations de formats.

### 3.3 Chapitre 1 : Communication et Collaboration
* **Fichier de données** : [`v2/src/data/chapitre-1-communication.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-1-communication.json)
* **Activités** :
  * Je découvre : Réseaux socio-numériques, vocabulaire du courriel (expéditeur, destinataire, Cc, Cci, objet, PJ).
  * Je pratique : Simulateur interactif de courriel (p.64) avec validation multi-critères automatique.
  * Je maîtrise : Mission de conception d'une application scolaire et bilan d'auto-évaluation par compétences.

### 3.4 Chapitre 2 : Sécurité & Données Personnelles
* **Fichier de données** : [`v2/src/data/chapitre-2-securite.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-2-securite.json)
* **Activités** :
  * Mots de passe robustes (entropie, gestionnaires).
  * Traces numériques actives vs passives, RGPD et droit à l'image.
  * Simulateur HTTP et faux site bancaire (sensibilisation aux fraudes).
  * Auto-évaluation bilan personnel Ch2 (p.83).

### 3.5 Banque Officielle @lt_X & Matrice des Compétences
* **Banque de questions** : [`v2/src/data/altx-bank.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/altx-bank.json) (181 questions officielles interactives).
* **Compétences SeGEC** : [`v2/src/data/competences-fmttn.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/competences-fmttn.json) (codes `NUM-1.x` et `NUM-2.x`).

---

## 🔮 4. Feuille de Route pour le Tome 1b (@lt_X)

Dès réception des documents ou scans du **Tome 1b**, voici les modules qui viendront compléter le cours :

| Chapitre | Thématique Prévue | Compétences Visées | Fichier Cible Prévu |
| :--- | :--- | :--- | :--- |
| **Chapitre 3** | **Intelligence Artificielle** (Machine Learning, prompts éthiques, esprit critique, limites) | NUM-3.x | `v2/src/data/chapitre-3-ia.json` |
| **Chapitre 4** | **Informations & Données** (Hardware/software, arborescence, formats, organisation Drive) | NUM-4.x | `v2/src/data/chapitre-4-donnees.json` |
| **Chapitre 5** | **Création de Contenus** (Traitement de texte, algorithmique débranchée, programmation blocs) | NUM-5.x | `v2/src/data/chapitre-5-creation.json` |

---

## 🛠️ 5. Procédure d'Ajout d'un Nouveau Chapitre (Mode d'Emploi Rapide)

Lors de la transmission du Tome 1b :
1. Déposer le scan/PDF dans `Ext/Cours/` ou `/home/gaetan/Téléchargements/`.
2. Utiliser le script d'extraction ou **Course Studio** pour générer le JSON structuré (Théorie, Je Découvre, Je Pratique, Je Maîtrise).
3. Enregistrer le JSON dans `v2/src/data/chapitre-X-...json`.
4. Déclarer le nouveau chapitre dans `FMTTN_COURSE_DEF.chapters` dans [`v2/src/services/courseManager.js`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/services/courseManager.js).
5. Compiler (`cd v2 && npm run build`) et déployer sur Firebase Hosting.
