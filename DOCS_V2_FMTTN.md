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

## 💡 2. Principes Fondateurs Inspirés d'[ed.ai](https://ed.ai)

L'inspiration majeure tirée de la plateforme [ed.ai](https://ed.ai) réside dans le passage d'une notation chiffrée classique à une **pédagogie de la maîtrise par compétences** :

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

### Phase 1 : Socle V2 & Chapitre 1 (En cours 🏗️)
- [x] Exploration et analyse des scans @lt_X 1a et 1b.
- [x] Spécification du cahier des charges V2 et de la philosophie ed.ai.
- [ ] Initialisation du projet Vite + Tailwind + Alpine.js dans `v2/`.
- [ ] Modélisation JSON du **Chapitre 1 : Communication et collaboration** (compétences, vocabulaire, QCM du livre).
- [ ] Intégration de la mascotte robot bleue (@lt_X) pour le Tuteur Socratique.

### Phase 2 : Espace Élève V2 (Apprenant 1re secondaire)
- [ ] Interface épurée avec sélection des 5 chapitres.
- [ ] Module "Je découvre" : parcours pas-à-pas avec mini-quiz interactifs et feedback immédiat.
- [ ] Module "Je pratique" : mini-scénarios et auto-évaluation guidée par le Tuteur IA.
- [ ] Module "Je maîtrise" : défi final et synthèse visuelle mémo.

### Phase 3 : Dashboard Enseignant V2 (Inspiré d'ed.ai)
- [ ] Matrice dynamique des compétences FMTTN par classe (Heatmap vert/jaune/rouge).
- [ ] Détection automatique des motifs d'erreurs fréquents (*Error Patterns*).
- [ ] Générateur de remédiations différenciées en 1 clic.
- [ ] Validation rapide des devoirs par lots (*Batch review*).

### Phase 4 : Déploiement & Intégration Continue
- [ ] Configuration du build Vite pour sortie dans `public/v2` (ou bascule principale sur `public/`).
- [ ] Validation du comportement sur réseau école réel et écrans tactiles/Chromebooks.
