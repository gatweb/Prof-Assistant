import { interrogerTuteurIA } from '../services/firebase.js';

export function createTutorStore() {
  return {
    tutorOpen: false,
    tutorLoading: false,
    tutorMood: 'happy',
    tutorErrorMsg: '',
    tutorMessage: 'Salut ! Je suis ton assistant @lt_X. Pose-moi une question sur les exercices ou le cours.',
    tutorHistory: [
      { sender: 'bot', role: 'model', text: 'Bienvenue sur ProfAssistant FMTTN ! Tu peux me poser des questions sur la charte, les adresses email, la nétiquette ou les règles de sécurité.' }
    ],
    studentQuestion: '',
    tutorQuickActions: [
      { id: 'consigne', label: '🤔 Je ne comprends pas la consigne', prompt: 'Je ne comprends pas bien la consigne de cet exercice. Peux-tu me l\'expliquer avec des mots simples ?' },
      { id: 'erreur', label: '🔍 Explique mon erreur', prompt: 'Quelque chose bloque ou ne fonctionne pas dans mon travail actuel. Peux-tu m\'aider à repérer mon erreur sans me donner la réponse ?' },
      { id: 'piste', label: '💡 Une piste pour démarrer', prompt: 'Je ne sais pas par où commencer cet exercice. Peux-tu me donner une première petite piste pour démarrer ?' }
    ],

    getStudentWorkContextForTutor() {
      const ws = this.currentCourse?.workspaceType || 'fmttn';
      if (ws === 'coding') {
        const parts = [];
        if (this.currentExercise?.titre) parts.push(`Exercice : ${this.currentExercise.titre}`);
        if (this.codingFiles.html) parts.push(`HTML :\n${this.codingFiles.html}`);
        if (this.codingFiles.css) parts.push(`CSS :\n${this.codingFiles.css}`);
        if (this.codingFiles.js) parts.push(`JS :\n${this.codingFiles.js}`);
        if (this.codingConsoleLogs?.length) {
          const lastLogs = this.codingConsoleLogs.slice(-3).map(l => `[${l.type}] ${l.text}`).join('\n');
          parts.push(`Derniers messages console :\n${lastLogs}`);
        }
        return parts.join('\n\n').slice(0, 3000);
      }
      if (ws === 'office') {
        return `Exercice Bureautique : ${this.currentExercise?.titre || ''}\nConsigne : ${this.currentExercise?.consigne || ''}\nLien / Notes de l'élève : ${this.officeDocUrl} ${this.officeNotes}`.trim().slice(0, 2000);
      }
      if (ws === 'creative') {
        return `Mission Créative : ${this.currentExercise?.titre || ''}\nConsigne : ${this.currentExercise?.consigne || ''}\nProjet / Démarche de l'élève : ${this.creativeProjectUrl} ${this.creativeNotes}`.trim().slice(0, 2000);
      }
      if (ws === 'redaction') {
        return `Rédaction & Argumentation : ${this.currentExercise?.titre || ''}\nThèse : ${this.redactionState?.these || ''}\nTexte de l'élève :\n${this.redactionState?.texteComplet || ''}`.trim().slice(0, 2500);
      }
      if (ws === 'langues') {
        const lastTurns = (this.languesState?.messages || []).slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');
        return `Jeu de rôle CECRL ${this.languesState?.cefrLevel || 'A2'} (${this.languesState?.targetLang || 'en-GB'})\nScénario : ${this.languesState?.scenario || ''}\nDialogue :\n${lastTurns}`.trim().slice(0, 2000);
      }
      if (ws === 'sciences') {
        return `Sciences & Maths : ${this.currentExercise?.titre || ''}\nDonnées : ${this.sciencesState?.donneesConnues || ''}\nFormule : ${this.sciencesState?.formuleLatex || ''}\nCalcul : ${this.sciencesState?.developpementCalcul || ''}\nRésultat : ${this.sciencesState?.resultatFinal || ''} ${this.sciencesState?.uniteSI || ''}`.trim().slice(0, 2000);
      }
      if (this.selectedModuleId === 'escape-game') {
        return `Escape Game FMTTN — Dossier actif n°${this.egState.activeDossier}`;
      }
      if (this.selectedModuleId === 'ch1-communication' && this.activeTab === 'pratique') {
        return `Simulateur de courriel :\nObjet : ${this.emailSim.objet}\nDestinataire : ${this.emailSim.destinataire}\nCc : ${this.emailSim.cc}\nCci : ${this.emailSim.cci}\nCorps :\n${this.emailSim.corps}`.slice(0, 2000);
      }
      if (this.selectedModuleId === 'ch2-securite') {
        return `Chapitre 2 Sécurité & Données personnelles — Onglet : ${this.activeTab}`;
      }
      return `Module FMTTN : ${this.selectedModuleId} (${this.activeTab})`;
    },

    async envoyerActionRapideTuteur(action) {
      if (!action || this.tutorLoading) return;
      if (action.id === 'piste' || action.id === 'erreur') {
        this.studentHintsUsedCount = (this.studentHintsUsedCount || 0) + 1;
      }
      const context = this.getStudentWorkContextForTutor();
      await this.envoyerQuestionTuteur(action.prompt, context);
    },

    getLocalFallbackResponse(q) {
      let reponse = "Mode hors ligne actif : vérifie bien les consignes et les indices de l'activité à gauche !";
      const lower = q.toLowerCase();

      if (lower.includes('cci') || lower.includes('cc')) {
        reponse = "Rappelle-toi de l'astuce : 'Cci' = Invisible ! Si tu écris à 25 personnes, pourquoi ne doivent-elles pas voir les adresses de tout le monde ?";
      } else if (lower.includes('https') || lower.includes('http') || lower.includes('cadenas')) {
        reponse = "Rappelle-toi : le 'S' de HTTPS = Sécurisé (la communication est chiffrée). Mais attention : un cadenas ne garantit pas que le commerçant est honnête !";
      } else if (lower.includes('pegi')) {
        reponse = "Attention au piège classique : le chiffre PEGI indique l'âge minimum conseillé pour la sensibilité psychologique, pas le niveau de difficulté du jeu !";
      } else if (lower.includes('active') || lower.includes('passive') || lower.includes('trace')) {
        reponse = "Astuce : une donnée active, c'est ce que tu tapes ou postes volontairement. Une trace passive, c'est ce que la machine enregistre en silence (ton IP, l'heure, ton temps d'écran).";
      } else if (lower.includes('harcèlement') || lower.includes('bloquer') || lower.includes('signaler')) {
        reponse = "La règle d'or face au cyberharcèlement : 1. Capture d'écran (preuve) 2. Bloquer & Signaler 3. En parler immédiatement à un adulte ou au 103 (gratuit).";
      } else if (lower.includes('2fa') || lower.includes('double')) {
        reponse = "La double authentification (2FA), c'est comme avoir une clé normale PLUS un code secret temporaire sur ton téléphone : impossible d'entrer avec seulement le mot de passe !";
      } else if (lower.includes('sommaire') || lower.includes('table des matières')) {
        reponse = "Pour générer une table des matières automatique, as-tu bien appliqué les styles 'Titre 1' et 'Titre 2' avant de cliquer sur 'Insertion > Table des matières' ?";
      } else if (lower.includes('insécable') || lower.includes('espace')) {
        reponse = "L'espace insécable évite qu'un signe de ponctuation double (: ; ? !) se retrouve orphelin au début de la ligne suivante. Raccourci : Ctrl+Maj+Espace !";
      } else if (lower.includes('drive') || lower.includes('partage') || lower.includes('lecteur')) {
        reponse = "Dans Drive, assure-toi de choisir 'Tous les utilisateurs disposant du lien' et sélectionne le rôle 'Lecteur' pour que le professeur puisse corriger sans modifier ton fichier.";
      } else if (lower.includes('balise') || lower.includes('fermer') || lower.includes('fermeture')) {
        reponse = "Vérifie bien que chaque balise ouvrante comme <div> ou <p> possède sa balise fermante correspondante (</div>, </p>).";
      } else if (lower.includes('flexbox') || lower.includes('aligner') || lower.includes('centrer')) {
        reponse = "Pour centrer un élément avec Flexbox : place 'display: flex;', 'justify-content: center;' et 'align-items: center;' sur le conteneur parent !";
      } else if (lower.includes('variable') || lower.includes('let') || lower.includes('const')) {
        reponse = "En JavaScript, utilise 'const' pour une valeur fixe, ou 'let' si sa valeur doit changer au cours du programme.";
      } else if (lower.includes('prompt') || lower.includes('ia') || lower.includes('image')) {
        reponse = "Un bon prompt créatif contient : 1. Le sujet principal 2. Le style visuel (3D, photo, aquarelle) 3. L'éclairage et l'atmosphère souhaitée.";
      }
      return reponse;
    },

    async envoyerQuestionTuteur(presetQuestion = null, explicitContext = null) {
      const q = (typeof presetQuestion === 'string' ? presetQuestion : this.studentQuestion).trim();
      if (!q || this.tutorLoading) return;

      this.tutorErrorMsg = '';

      const historySnapshot = this.tutorHistory.slice(-10).map(m => ({
        role: (m.role === 'model' || m.sender === 'bot') ? 'model' : 'user',
        text: m.text
      }));

      this.tutorHistory.push({ sender: 'student', role: 'user', text: q });
      if (typeof presetQuestion !== 'string') {
        this.studentQuestion = '';
      }
      this.tutorMood = 'thinking';
      this.tutorLoading = true;

      // Phase 11 : Comptabiliser l'appel au tuteur pour la vue classe en direct (signal « bloqué »)
      this.studentTutorCallsCount = (this.studentTutorCallsCount || 0) + 1;
      if (typeof this.syncCurrentStudentProgress === 'function') {
        this.syncCurrentStudentProgress();
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const localReply = this.getLocalFallbackResponse(q);
        this.tutorHistory.push({ sender: 'bot', role: 'model', text: localReply });
        this.tutorMood = 'happy';
        this.tutorLoading = false;
        return;
      }

      try {
        const contextToSend = explicitContext !== null ? explicitContext : this.getStudentWorkContextForTutor();
        const response = await interrogerTuteurIA({
          question: q,
          historique: historySnapshot,
          idExercice: this.currentExercise?.id || this.selectedModuleId,
          courseId: this.currentCourse?.id || 'fmttn-1re',
          contexteEleve: contextToSend
        });

        if (response) {
          this.tutorHistory.push({ sender: 'bot', role: 'model', text: response });
          this.tutorMood = 'happy';
          this.tutorLoading = false;
          return;
        }
        throw new Error("Réponse vide du tuteur.");
      } catch (err) {
        console.warn("[TuteurIA] Erreur Cloud Function :", err);
        this.tutorLoading = false;
        this.tutorMood = 'thinking';

        const code = String(err?.code || '');
        let errMsg = "Le tuteur est très sollicité, réessaie dans 10 s.";
        if (code.includes('resource-exhausted') && err?.message?.includes('heure')) {
          errMsg = err.message;
        } else if (code.includes('unauthenticated')) {
          errMsg = "Session expirée. Recharge la page pour te reconnecter.";
        } else if (code.includes('invalid-argument') && err?.message) {
          errMsg = err.message;
        }

        this.tutorErrorMsg = errMsg;
        this.tutorHistory.push({
          sender: 'bot',
          role: 'model',
          isError: true,
          text: `⏳ ${errMsg}`
        });
      }
    }
  };
}
