# 📋 BRIEF POUR L'AGENT DE DÉVELOPPEMENT — Intégration Exhaustive du Manuel @lt_X (Tome 1a)

> **Objectif** : Enrichir et compléter à 100 % le cours **FMTTN 1re Secondaire (@lt_X)** dans `Prof Assistant V2` sans plus jamais avoir besoin d'ouvrir le PDF original.

---

## 📂 1. Source de Vérité Intégrale (164/164 pages + 583 Corrigés Enseignant)

Le manuel complet **@lt_X Tome 1a (Version Enseignant Corrigée)** a été intégralement extrait par Vision IA (Gemini 2.5 Flash) et se trouve désormais directement dans le dépôt :

- **Fichier maître dans le projet** : [`Ext/Cours/MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/Ext/Cours/MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md)
- **Copie miroir** : [`/home/gaetan/markitdown/sortie/@LT_X 1a.md`](file:///home/gaetan/markitdown/sortie/@LT_X%201a.md)
- **Volume** : **7 984 lignes** (~335 Ko), **164 / 164 pages**, **583 blocs `> **[Corrigé Enseignant]**`** balisés.

### Conventions de balisage dans le fichier Markdown :
- **Séparation des pages** : `## 📄 Page X` (où `X` est le numéro de page du PDF, soit généralement `page_manuel + 2`).
- **Corrigés du professeur** : Toujours isolés dans des citations :
  ```markdown
  > **[Corrigé Enseignant]** : ...
  ```
- **Pictogrammes pédagogiques** :
  - `[✏️ Écrire]` : Exercice écrit / question de réflexion
  - `[💻 Ordinateur]` : Manipulation pratique sur poste
  - `[🌐 Internet]` : Recherche d'informations en ligne
  - `[🤖 IA]` : Activité liée à l'Intelligence Artificielle (ajouts programme mars 2026 marqués d'un `*`)
  - `[🗣️ Débat]` : Débat / discussion collective en classe
  - `[🧠 Cerveau]` : Encadré Neurosciences (dopamine, attention, surcharge cognitive...)
  - `[💡 Le savais-tu ?]` : Point de culture numérique
  - `[💼 Métier]` : Fiche métier du numérique
  - `[Visuel / Schéma : ...]` : Description complète des schémas, captures d'écran et exercices à relier

---

## 🗺️ 2. Cartographie Exacte du Manuel vs État Actuel de la V2

Actuellement, les fichiers [`v2/src/data/module-0-introduction.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/module-0-introduction.json), [`v2/src/data/chapitre-1-communication.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-1-communication.json) et [`v2/src/data/chapitre-2-securite.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-2-securite.json) ne contiennent qu'un **condensé (~15-20 %)** du manuel.

Voici l'index complet des sections dans [`Ext/Cours/MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/Ext/Cours/MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md) à exploiter pour compléter la V2 :

### 🟢 MODULE 0 — Introduction (`## 📄 Page 11` à `## 📄 Page 20`)
1. **Mon rapport au numérique** (p. 9 du manuel / `## 📄 Page 11` à `13`) : Questionnaire initial de profil numérique élève + activités d'amorce.
2. **Création d'une adresse e-mail** (p. 12 / `## 📄 Page 14` à `17`) : Comparatif Proton Mail / Gmail / Outlook + Checklist de création.
3. **Disparaître d'un ordinateur** (p. 16 / `## 📄 Page 18`) : Risques d'oubli de déconnexion, ordre des actions (`1, 3, 4, 2`), tutoriels Chromebook / Mac / Windows.
4. **Prêt pour le numérique ?** (p. 17 / `## 📄 Page 19`) : Vue d'ensemble des 5 chapitres.

---

### 🔵 CHAPITRE 1 — Communication et Collaboration (`## 📄 Page 21` à `## 📄 Page 88`)
*Grille officielle des 18 compétences : `## 📄 Page 21`*

#### 🔍 1. JE DÉCOUVRE (`## 📄 Page 22` à `## 📄 Page 61`)
- **PARTIE 1. Réseaux socio-numériques** (p. 20 / `## 📄 Page 22` à `35`) :
  - Spécificités des RSN (Instagram, TikTok, YouTube, Snapchat, WhatsApp, Discord, LinkedIn, Mastodon, Pixelfed, BeReal...).
  - Encadrés `[🧠 Cerveau]` (dopamine, circuit de la récompense, boîte de Skinner) & `[💼 Métier]` (Community Manager).
  - Réseaux éthiques vs non éthiques, modèle économique (« Si c'est gratuit, c'est toi le produit »).
- **PARTIE 2. Outils pour créer, collaborer et partager** (p. 34 / `## 📄 Page 36` à `41`) :
  - Messagerie instantanée, courriel, outils de sondage/quiz (Google Forms, Kahoot, Wooclap, Framaforms), espaces collaboratifs (Drive, Padlet, Framapad) et présence de l'IA (`*`).
- **PARTIE 3. Vocabulaire de la communication numérique** (p. 40 / `## 📄 Page 42` à `51`) :
  - Anatomie complète d'un e-mail (Expéditeur, Destinataire, Objet, Cc, Cci, Pièce jointe, Corps, Signature, Brouillon, Spam), messagerie instantanée et émoticônes.
- **PARTIE 4. Éthique des médias numériques** (p. 50 / `## 📄 Page 52` à `61`) :
  - Vie privée, droit à l'oubli, droit de retrait, liberté d'expression, censure vs modération, licence open source, droit d'auteur (`*`), mention des contenus générés par IA (`*`) et enjeux d'entraînement de l'IA (`*`) + Synthèse visuelle & Évaluation formative.

#### ⚙️ 2. JE PRATIQUE (`## 📄 Page 62` à `## 📄 Page 85`)
- **PARTIE 1. Sélectionner un outil d'interaction** (p. 60 / `## 📄 Page 62` à `65`) : Études de cas + Tableau comparatif complet du chiffrement de bout en bout (WhatsApp, Signal, Telegram, Messenger, Discord, Snapchat en `## 📄 Page 64`).
- **PARTIE 2. Utiliser un outil de communication** (p. 64 / `## 📄 Page 66` à `69`) : Rédaction d'e-mails formels, erreurs à corriger, usages de Cc/Cci, conversations de groupe et création d'un sondage.
- **PARTIE 3. Respecter les droits de propriété intellectuelle** (p. 68 / `## 📄 Page 70` à `75`) : Plagiat, citation des sources, banques d'images libres, travail avec une IA (`*`).
- **PARTIE 4. Respecter la nétiquette** (p. 74 / `## 📄 Page 76` à `79`) : Analyse de messages irrespectueux et réécriture selon la nétiquette.
- **PARTIE 5. Garder la confidentialité ou l'anonymat lors de partage** (p. 78 / `## 📄 Page 80` à `81`) : Anonymisation et données sensibles (y compris dans les prompts IA `*`).
- **PARTIE 6*. Respecter les droits à l'image et à la voix** (p. 80 / `## 📄 Page 82` à `83`) : Consentement, deepfakes audio/vidéo et études de cas.
- **PARTIE 7*. Téléverser un contenu dans un environnement numérique** (p. 82 / `## 📄 Page 84` à `85`) : Upload vs Download, formats et bonnes pratiques + Bilan personnel d'auto-évaluation (`## 📄 Page 85`).

#### 🎯 3. JE MAÎTRISE (`## 📄 Page 86` à `## 📄 Page 88`)
- **Communiquer et interagir grâce aux outils numériques** (p. 84 / `## 📄 Page 86` à `88`) : Consolidation, défi complet et Expression libre (sketchnote / carte mentale).

---

### 🛡️ CHAPITRE 2 — Sécurité (`## 📄 Page 89` à `## 📄 Page 163`)
*Grille officielle des compétences du Chapitre 2 : `## 📄 Page 89`*

#### 🔍 1. JE DÉCOUVRE (`## 📄 Page 90` à `## 📄 Page 125`)
- **PARTIE 1. Vocabulaire de profil et protection** (p. 88 / `## 📄 Page 90` à `99`) : Identifiant, pseudo, avatar, biographie, profil public vs privé, robustesse des mots de passe, double authentification (2FA), phishing/hameçonnage.
- **PARTIE 2. Signalétique** (p. 98 / `## 📄 Page 100` à `107`) : Pictogrammes PEGI (âge et descripteurs de contenu : violence, peur, achats intégrés, langage grossier...) et classification des contenus.
- **PARTIE 3. HTTP et HTTPS** (p. 106 / `## 📄 Page 108` à `111`) : Chiffrement des échanges web, cadenas, vérification d'URL.
- **PARTIE 4*. Signaler et bloquer pour se protéger en ligne** (p. 110 / `## 📄 Page 112` à `113`) : Procédures de blocage et de signalement face aux comportements inappropriés.
- **PARTIE 5*. Identité numérique : droits et responsabilité** (p. 112 / `## 📄 Page 114` à `115`) : E-réputation et conséquences légales/sociales.
- **PARTIE 6*. Données actives et données passives** (p. 114 / `## 📄 Page 116` à `117`) : Traces volontaires vs traces collectées automatiquement (cookies, géolocalisation, historique).
- **PARTIE 7*. Demander de l'aide humaine plutôt qu'à l'IA** (p. 116 / `## 📄 Page 118` à `119`) : Limites de l'IA face aux situations de détresse, harcèlement ou santé, et personnes/services ressources.
- **PARTIE 8*. Techniques pour retenir l'attention en ligne** (p. 118 / `## 📄 Page 120` à `123`) : Dark patterns, scroll infini, autoplay, notifications, streaks/flammes (`[🧠 Cerveau]`).
- **PARTIE 9*. Bienfaits de la déconnexion** (p. 122 / `## 📄 Page 124` à `125`) : Sommeil, concentration, bien-être.

#### ⚙️ 2. JE PRATIQUE (`## 📄 Page 126` à `## 📄 Page 149`)
- **PARTIE 1. Vie privée ?** (p. 124 / `## 📄 Page 126` à `127`) : Tri entre informations publiques et privées.
- **PARTIE 2. Options de confidentialité** (p. 126 / `## 📄 Page 128` à `131`) : Paramétrage de comptes et permissions d'applications.
- **PARTIE 3. Apprendre à se déconnecter** (p. 130 / `## 📄 Page 132` à `135`) : Hygiène numérique et stratégies concrètes.
- **PARTIE 4. Cyber... (Cyberharcèlement, Cyberdépendance, Cybercriminalité)** (p. 134 / `## 📄 Page 136` à `147`) : Études de cas approfondies, rôles (auteur, victime, témoin), réactions et prévention.
- **PARTIE 5*. Comprendre son usage des écrans** (p. 146 / `## 📄 Page 148` à `149`) : Analyse du temps d'écran + Bilan personnel d'auto-évaluation (`## 📄 Page 149`).

#### 🎯 3. JE MAÎTRISE (`## 📄 Page 150` à `## 📄 Page 163`)
- **PARTIE 1. Identité numérique et traces** (p. 148 / `## 📄 Page 150` à `154`)
- **PARTIE 2. Cyberdépendance** (p. 153 / `## 📄 Page 155` à `159`)
- **PARTIE 3. Cyberharcèlement & Expression libre** (p. 158 / `## 📄 Page 160` à `163`)

---

## 🚀 3. Plan d'Action Recommandé pour l'Agent Prof Assistant

1. **Enrichissement des JSON de cours (`v2/src/data/`)** :
   - Compléter [`module-0-introduction.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/module-0-introduction.json), [`chapitre-1-communication.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-1-communication.json) et [`chapitre-2-securite.json`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/v2/src/data/chapitre-2-securite.json) pour que **chaque Partie du sommaire** (y compris les nouvelles parties `4*` à `9*` de mars 2026) possède sa fiche de cours structurée, ses encadrés (`🧠 Cerveau`, `💡 Le savais-tu ?`, `💼 Métier`) et ses exercices interactifs.
2. **Injection des Corrigés Enseignant dans le Tuteur IA & SpeedGrader** :
   - Utiliser les **583 blocs `> **[Corrigé Enseignant]**`** de [`MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md`](file:///run/media/gaetan/Data/_DEV/_PROD/Prof%20Assistant/Ext/Cours/MANUEL_ALTX_1A_INTEGRAL_CORRIGE.md) comme critères de référence (`expected_answer` / `rubric`) dans les exercices et les prompts de `functions/index.js` afin que le tuteur socratique guide l'élève exactement vers les réponses attendues par les autrices du manuel.
3. **Pour le futur Tome 1b (Chapitres 3, 4 et 5)** :
   - Dès réception du PDF du Tome 1b, il suffira de le glisser dans `/home/gaetan/markitdown/entree/` et de lancer [`/home/gaetan/markitdown/convertir_tout.sh`](file:///home/gaetan/markitdown/convertir_tout.sh) : il utilisera automatiquement [`ocr_vision_gemini.py`](file:///home/gaetan/markitdown/ocr_vision_gemini.py) pour produire le même fichier Markdown corrigé.
