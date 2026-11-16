# 🔍 Prompt d'Audit Complet — ProfAssistant V2 (Technique, Pédagogique & Ludique)

Copie-colle le prompt ci-dessous tel quel pour lancer un audit approfondi du projet :

---

```text
Tu es un auditeur senior spécialisé en EdTech (architecture web Firebase/Vite/Alpine, pédagogie numérique FWB/SeGEC pour des 11-14 ans, et ergonomie ludique sur tablette/Chromebook).

Réalise un audit complet, factuel et sans complaisance de l'application **ProfAssistant V2** en t'appuyant sur :
- La documentation maître : `DOCUMENTATION_TECHNIQUE_ET_PEDAGOGIQUE.md`, `roadmap.md`, `RAPPORT_ALIGNEMENT_ELEVES_2026.md`
- Le frontend : `v2/index.html`, `v2/src/stores/*.js`, `v2/src/services/firebase.js`, `v2/src/services/courseManager.js`, `v2/src/data/*.json`
- Le backend & sécurité : `functions/index.js`, `firestore.rules`, `v2/vite.config.js`

Analyse obligatoirement les **3 axes suivants** :

### 1. Axe Technique, Fiabilité & Sécurité
1. **Règles Firestore (`firestore.rules`) & Auth** : Y a-t-il des failles d'accès (lecture/écriture sur `users`, `progressions_v2`, `submissions`, `enseignants`) ? Un élève peut-il modifier sa classe, ses XP ou voir les copies d'autres élèves ?
2. **Intégrité des données & XP** : Vérifie la synchronisation (`saveEleveProgression`, `chargerProgressionEleveReelle`, `attribuerXpUnique`, bouton « Quitter »). Existe-t-il encore un scénario où des XP, des cours validés en vert ou la classe officielle (`users.classe`) pourraient être écrasés ou perdus ?
3. **Cloisonnement par année & Classe `0`** : Vérifie `getYearLevelFromClass` et `isCourseUnlockedForStudent`. Un élève de 3e, de 1re ou en classe `0` peut-il accéder à un cours qui ne lui est pas destiné (via lien profond `?course=`, cache localStorage ou URL directe) ?
4. **Performance & Bundle** : Analyse le poids de `v2/index.html` (~536 Ko) et des chunks Vite sur Chromebook/tablette scolaire à faible RAM/bande passante. Propose des optimisations concrètes (lazy loading, découpage de templates).
5. **Cloud Functions (`functions/index.js`)** : Vérifie la gestion d'erreurs, les quotas IA, la validation des entrées et les risques de timeout ou de dépassement de coûts.

### 2. Axe Pédagogique & Conformité Programme (SeGEC / @lt_X / 3e)
1. **Couverture FMTTN 1re (@lt_X Tomes 1a & 1b)** : Compare les chapitres 1 à 5 (`v2/src/data/`) au programme officiel (compétences `NUM-*`, progression *Je découvre → Je pratique → Je maîtrise*). Y a-t-il des notions manquantes ou des QCM ambigus ?
2. **Cours 3e (Dactylographie & Bureautique Google Workspace)** : Vérifie la clarté, la progressivité et l'adéquation des exercices pratiques avec de vrais élèves de 3e secondaire.
3. **Accessibilité & Différenciation** : Évalue la qualité réelle du mode dyslexie, de la synthèse vocale (`lireTexteVocal`), du Tuteur Socratique (ne donne-t-il jamais la réponse brute ?) et du suivi prof (vue Bulletin, statut vert des cours, correction manuelle).

### 3. Axe Ludique, UX & Ergonomie Tablette / Chromebook
1. **Expérience élève (11-14 ans)** : L'interface est-elle suffisamment visuelle, motivante et peu chargée ? Les illustrations, schémas (arborescence, logigramme, blocs Scratch) et la mascotte 5 stades sont-ils cohérents sur tous les chapitres (Tome 1a, Tome 1b, 3e) ?
2. **Simplicité de « Atelier & Pratique »** : Un élève de 11 ans sur tablette comprend-il immédiatement quoi faire à chaque étape (consignes, validation, passage à la mission suivante, feedback d'erreur) ?
3. **Ergonomie Tablette / Chromebook (768px - 1280px)** : Repère les éventuels problèmes de scroll, boutons trop petits (< 44px), modales coupées, tableaux profs trop larges ou contrastes insuffisants.
4. **Espace Professeur** : Un enseignant non technicien comprend-il intuitivement les 4 onglets, le Bulletin élève, les filtres (Année en cours / Inactifs / Classe 0) et Google Classroom ?

### Format de restitution attendu
1. **Score /10 par axe** avec justification factuelle (fichiers et lignes cités).
2. **Top 5 des problèmes critiques / bloquants** (à corriger en priorité avant déploiement en classe).
3. **Top 5 des améliorations rapides (« Quick Wins »)** à fort impact pédagogique ou ludique.
4. **Plan d'action priorisé** (Correctifs P0 → P1 → P2) prêt à être exécuté.
```

