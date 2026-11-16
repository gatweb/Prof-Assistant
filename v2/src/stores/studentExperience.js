import { verifyDriveFileSharing } from '../services/classroomService.js';

/**
 * Stades d'évolution de la mascotte @lt_X en fonction des XP de l'élève (Phase 12)
 */
export const MASCOT_STAGES = [
  {
    level: 1,
    minXp: 0,
    nextXp: 50,
    icon: '🥚',
    name: 'Nano-Graine @lt_X',
    title: 'Apprenti du Numérique',
    quote: 'Continue à explorer les modules pour me faire éclore !',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    glowClass: 'from-slate-500 to-blue-500'
  },
  {
    level: 2,
    minXp: 50,
    nextXp: 150,
    icon: '🤖',
    name: 'Mini-Bot @lt_X',
    title: 'Explorateur Connecté',
    quote: 'Mes capteurs sont activés ! Chaque mission réussie renforce mes circuits.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    glowClass: 'from-blue-600 to-indigo-600'
  },
  {
    level: 3,
    minXp: 150,
    nextXp: 300,
    icon: '🦾',
    name: 'Cyber-Compagnon',
    title: 'Artisan du Web & du Cloud',
    quote: 'Quelle progression ! Tu maîtrises les outils numériques avec de plus en plus d\'autonomie.',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    glowClass: 'from-indigo-600 to-purple-600'
  },
  {
    level: 4,
    minXp: 300,
    nextXp: 500,
    icon: '🚀',
    name: 'Astro-Mentor @lt_X',
    title: 'Gardien Cyber & Codeur',
    quote: 'En orbite ! Tu déjoues les pièges et tes projets prennent une vraie dimension pro.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    glowClass: 'from-purple-600 to-pink-600'
  },
  {
    level: 5,
    minXp: 500,
    nextXp: 1000,
    icon: '👑',
    name: 'Archonte @lt_X Légendaire',
    title: 'Maître du Numérique SeGEC',
    quote: 'Niveau maximal atteint ! Tu es désormais une référence pour toute la classe !',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
    glowClass: 'from-amber-500 via-orange-500 to-yellow-500'
  }
];

export function createStudentExperienceStore() {
  return {
    dyslexiaMode: false,
    ttsPlaying: false,
    _ttsQueue: [],
    _ttsSession: 0,
    skillTreeModalOpen: false,

    // Vérification du partage Google Drive avant remise
    driveShareCheckLoading: false,
    driveShareCheckResult: null,

    initStudentExperience() {
      const savedDys = localStorage.getItem('profassistant_dyslexia_mode') === 'true';
      this.dyslexiaMode = savedDys;
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dyslexia-mode', savedDys);
      }
    },

    basculerModeDyslexie() {
      this.dyslexiaMode = !this.dyslexiaMode;
      localStorage.setItem('profassistant_dyslexia_mode', String(this.dyslexiaMode));
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dyslexia-mode', this.dyslexiaMode);
      }
    },

    /**
     * Choisit la meilleure voix française disponible (Belgique, puis France, puis toute voix `fr`).
     * Sans voix française installée, le navigateur lirait le texte avec un accent étranger.
     */
    getFrenchVoice() {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
      const voices = (window.speechSynthesis.getVoices() || []).filter(v => /^fr([-_]|$)/i.test(v.lang || ''));
      if (!voices.length) return null;
      const score = (v) => {
        const lang = (v.lang || '').replace('_', '-').toLowerCase();
        let pts = 0;
        if (lang === 'fr-be') pts += 40;
        else if (lang === 'fr-fr') pts += 30;
        else if (lang === 'fr-ch') pts += 20;
        else if (lang === 'fr-ca') pts += 5;
        if (/google|natural|premium|enhanced|neural/i.test(v.name || '')) pts += 8;
        if (v.localService) pts += 3; // fonctionne aussi hors ligne
        if (v.default) pts += 1;
        return pts;
      };
      return voices.slice().sort((a, b) => score(b) - score(a))[0];
    },

    /** Découpe un texte en phrases courtes : les longues lectures sont coupées net par Chrome. */
    splitTextForSpeech(text, maxLen = 180) {
      const sentences = String(text || '').match(/[^.!?…:;\n]+[.!?…:;]*\s*/g) || [];
      const chunks = [];
      for (const raw of sentences) {
        let sentence = raw.trim();
        if (!sentence) continue;
        while (sentence.length > maxLen) {
          let cut = sentence.lastIndexOf(',', maxLen);
          if (cut < maxLen * 0.4) cut = sentence.lastIndexOf(' ', maxLen);
          if (cut <= 0) cut = maxLen;
          chunks.push(sentence.slice(0, cut + 1).trim());
          sentence = sentence.slice(cut + 1).trim();
        }
        if (sentence) chunks.push(sentence);
      }
      return chunks;
    },

    arreterLectureVocale() {
      this._ttsQueue = [];
      this._ttsSession = (this._ttsSession || 0) + 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      this.ttsPlaying = false;
    },

    /**
     * Lecture vocale des consignes et synthèses (Web Speech API native, 0 €).
     * Un second clic arrête la lecture.
     */
    lireTexteVocal(rawText) {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.notify("La lecture à voix haute n'est pas disponible sur ce navigateur.");
        return;
      }

      if (this.ttsPlaying || window.speechSynthesis.speaking) {
        this.arreterLectureVocale();
        return;
      }

      const cleanText = String(rawText || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\$\$?[^$]*\$\$?/g, ' ') // formules KaTeX : illisibles à voix haute
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // liens Markdown : garder le libellé
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[#*_`~>|]/g, ' ')
        .replace(/(^|\s)-\s/g, '$1')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ') // émojis
        .replace(/@lt_X/gi, 'Alt X')
        .replace(/[ \t]+/g, ' ')
        .trim();

      const chunks = this.splitTextForSpeech(cleanText);
      if (!chunks.length) return;

      const session = (this._ttsSession || 0) + 1;
      this._ttsSession = session;
      this._ttsQueue = chunks;
      this.ttsPlaying = true;

      const speakNext = () => {
        if (this._ttsSession !== session) return;
        const part = this._ttsQueue.shift();
        if (!part) {
          this.ttsPlaying = false;
          return;
        }
        const utterance = new SpeechSynthesisUtterance(part);
        const voice = this.getFrenchVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'fr-BE';
        utterance.rate = this.dyslexiaMode ? 0.85 : 0.95;
        utterance.onend = speakNext;
        utterance.onerror = () => { if (this._ttsSession === session) this.ttsPlaying = false; };
        window.speechSynthesis.speak(utterance);
      };

      // Les voix se chargent parfois après le premier appel (Chrome / ChromeOS).
      if (!window.speechSynthesis.getVoices().length && typeof window.speechSynthesis.addEventListener === 'function') {
        let started = false;
        const start = () => { if (!started) { started = true; speakNext(); } };
        window.speechSynthesis.addEventListener('voiceschanged', start, { once: true });
        setTimeout(start, 400);
      } else {
        speakNext();
      }
    },

    /**
     * Retourne le stade actuel de la mascotte évolutive selon `user.xp`
     */
    getMascotStage() {
      const xp = Number(this.user?.xp) || 0;
      let current = MASCOT_STAGES[0];
      for (const st of MASCOT_STAGES) {
        if (xp >= st.minXp) {
          current = st;
        }
      }
      const span = Math.max(1, current.nextXp - current.minXp);
      const progressInStage = Math.min(100, Math.round(((xp - current.minXp) / span) * 100));
      return {
        ...current,
        xp,
        progressInStage,
        xpToNext: Math.max(0, current.nextXp - xp)
      };
    },

    /**
     * Calcule le score d'autonomie sur l'activité en cours (100 / 80 / 60 / 40)
     * - 0 indice / 0 appel tuteur => 100% (Autonomie Totale 🏆)
     * - 1 aide => 80% (Très Autonome ⭐)
     * - 2 aides => 60% (Guidé 💡)
     * - 3+ aides => 40% (Accompagné Pas-à-Pas 🤝)
     */
    getCurrentAutonomyScore() {
      const helps = (Number(this.studentHintsUsedCount) || 0) + (Number(this.studentTutorCallsCount) || 0);
      if (helps === 0) return 100;
      if (helps === 1) return 80;
      if (helps === 2) return 60;
      return 40;
    },

    getAutonomyBadgeInfo() {
      const score = this.getCurrentAutonomyScore();
      if (score === 100) {
        return { score: 100, label: 'Autonomie 100% 🏆', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      }
      if (score === 80) {
        return { score: 80, label: 'Autonomie 80% ⭐', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      }
      if (score === 60) {
        return { score: 60, label: 'Autonomie 60% 💡', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      }
      return { score: 40, label: 'Autonomie 40% 🤝', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    },

    /**
     * Arbre de compétences adapté à l'ANNÉE de l'élève :
     *  - 1re : référentiel FMTTN (@lt_X Tomes 1a et 1b) ;
     *  - 3e : dactylographie et bureautique ;
     *  - autres (2e, invité, professeur en aperçu) : vue d'ensemble.
     * Statuts : 'acquis' (validé), 'en_cours' (commencé), 'a_faire' (pas encore abordé).
     */
    getStudentSkillTreeBranches() {
      const c = this.eleveCompetences || {};
      const subs = this.studentSubmissionsHistory || [];
      const rewarded = this.rewardedActivities || [];
      const isValidated = (s) => ['valide', 'validee', 'publie'].includes(s.status);
      const subId = (s) => String(s.id_exercice || s.exercice_id || '');
      const hasCourseSub = (cid) => subs.some(s => (s.course_id || s.id_course) === cid);

      // Statut d'un ensemble d'activités repérées par préfixe d'identifiant (ex. « dac-ch3 »).
      const statusForPrefixes = (prefixes) => {
        const match = (id) => prefixes.some(p => id === p || id.startsWith(p + '-') || id.startsWith(p));
        const mine = subs.filter(s => match(subId(s)));
        if (mine.some(isValidated)) return 'acquis';
        const touched = mine.length > 0 || rewarded.some(k => {
          const id = String(k).replace(/^(exo|quiz|quizz|dactylo):/, '');
          return match(id);
        });
        return touched ? 'en_cours' : 'a_faire';
      };
      const fromCompetences = (codes) => {
        const states = codes.map(code => c[code]);
        if (states.every(st => st === 'acquis')) return 'acquis';
        return states.some(st => st === 'acquis') ? 'en_cours' : 'a_faire';
      };
      const tome1bStatus = (ch) => {
        const quiz = Boolean(this.tome1bQuiz?.[ch]?.completed) || rewarded.includes(`quiz:tome1b-${ch}`);
        const atelier = Boolean(this.tome1bAtelier?.[ch]?.validated) || rewarded.includes(`atelier:tome1b-${ch}`);
        if (quiz && atelier) return 'acquis';
        return (quiz || atelier) ? 'en_cours' : 'a_faire';
      };
      const flag = (done, started = false) => (done ? 'acquis' : (started ? 'en_cours' : 'a_faire'));

      const year = typeof this.getStudentYearLevel === 'function' ? this.getStudentYearLevel() : '1re';
      const isTeacherPreview = Boolean(this.teacherAuth?.isTeacher);

      const branches1re = [
        {
          id: 'branch-comm',
          title: 'Communiquer et collaborer',
          icon: '💬',
          nodes: [
            { code: 'MOD-0', label: 'Charte et poste sécurisé', status: flag(this.charteState?.finished || this.m0DecoState?.completed, rewarded.some(k => String(k).startsWith('module0:'))) },
            { code: 'NUM-1 • Réseaux', label: 'Réseaux socio-numériques', status: fromCompetences(['NUM-1.D1', 'NUM-1.D2']) },
            { code: 'NUM-1 • Messagerie', label: 'Courriel, Cc et Cci', status: fromCompetences(['NUM-1.D5', 'NUM-1.P1']) },
            { code: 'NUM-1 • Éthique', label: 'Nétiquette et respect en ligne', status: fromCompetences(['NUM-1.D6', 'NUM-1.D7', 'NUM-1.D8']) },
            { code: 'NUM-1 • Cloud', label: 'Outils collaboratifs', status: fromCompetences(['NUM-1.D3', 'NUM-1.D4']) }
          ]
        },
        {
          id: 'branch-secu',
          title: 'Sécurité et vie privée',
          icon: '🛡️',
          nodes: [
            { code: 'ENQUÊTE', label: 'Escape game : 5 dossiers', status: flag(this.egState?.finished, (this.egState?.dossierUnlocked?.length || 0) > 1) },
            { code: 'NUM-2 • Profil', label: 'Profil et mots de passe', status: fromCompetences(['NUM-2.D1', 'NUM-2.P4']) },
            { code: 'NUM-2 • HTTPS', label: 'Signalétique et cadenas HTTPS', status: fromCompetences(['NUM-2.D2', 'NUM-2.D3']) },
            { code: 'NUM-2 • Cyber', label: 'Agir contre le cyberharcèlement', status: fromCompetences(['NUM-2.D6', 'NUM-2.D7', 'NUM-2.D9']) },
            { code: 'NUM-2 • Traces', label: 'Identité et traces numériques', status: fromCompetences(['NUM-2.D4', 'NUM-2.D8']) }
          ]
        },
        {
          id: 'branch-tome1b',
          title: 'IA, données et création',
          icon: '🚀',
          nodes: [
            { code: 'CH. 3', label: 'Intelligence artificielle et prompt', status: tome1bStatus('ch3') },
            { code: 'CH. 4', label: 'Informations, fichiers et données', status: tome1bStatus('ch4') },
            { code: 'CH. 5', label: 'Création, algorithme et Scratch', status: tome1bStatus('ch5') }
          ]
        }
      ];

      const branches3e = [
        {
          id: 'branch-dactylo-base',
          title: 'Clavier : les bases',
          icon: '⌨️',
          nodes: [
            { code: 'DAC 1', label: 'Posture et ligne de base', status: statusForPrefixes(['dac-ch1', 'dac-ex1']) },
            { code: 'DAC 2', label: 'Ligne supérieure et voyelles', status: statusForPrefixes(['dac-ch2']) },
            { code: 'DAC 3', label: 'Ligne inférieure', status: statusForPrefixes(['dac-ch3']) },
            { code: 'DAC 4', label: 'Majuscules et ponctuation', status: statusForPrefixes(['dac-ch4']) }
          ]
        },
        {
          id: 'branch-dactylo-pro',
          title: 'Clavier : niveau pro',
          icon: '🏁',
          nodes: [
            { code: 'DAC 5', label: 'Typographie (espaces, guillemets)', status: statusForPrefixes(['dac-ch5']) },
            { code: 'DAC 6', label: 'Chiffres et accents directs', status: statusForPrefixes(['dac-ch6']) },
            { code: 'DAC 7', label: 'Accents composés', status: statusForPrefixes(['dac-ch7']) },
            { code: 'DAC 8', label: 'Test final chronométré', status: statusForPrefixes(['dac-ch8']) }
          ]
        },
        {
          id: 'branch-bureautique',
          title: 'Bureautique Google Workspace',
          icon: '📄',
          nodes: [
            { code: 'BUR 1', label: 'Drive : organiser et partager', status: statusForPrefixes(['bur-m1', 'bur-ex2']) },
            { code: 'BUR 2', label: 'Docs : mise en page', status: statusForPrefixes(['bur-m2', 'bur-ex1']) },
            { code: 'BUR 3', label: 'Styles et sommaire automatique', status: statusForPrefixes(['bur-m3', 'bur-ex3']) },
            { code: 'BUR 4', label: 'Typographie et frappe soignée', status: statusForPrefixes(['bur-m4', 'bur-ex4']) }
          ]
        }
      ];

      if (year === '3e' && !isTeacherPreview) return branches3e;
      if (year === '1re' && !isTeacherPreview && !this.isGuestMode) return branches1re;

      // Vue d'ensemble (invité, professeur, autre année) : une branche par parcours.
      return [
        branches1re[0],
        branches1re[1],
        {
          id: 'branch-overview',
          title: 'Autres parcours',
          icon: '🧭',
          nodes: [
            { code: 'TOME 1b', label: 'IA, données et création', status: ['ch3', 'ch4', 'ch5'].every(ch => tome1bStatus(ch) === 'acquis') ? 'acquis' : (['ch3', 'ch4', 'ch5'].some(ch => tome1bStatus(ch) !== 'a_faire') ? 'en_cours' : 'a_faire') },
            { code: 'DACTYLO', label: 'Dactylographie (3e)', status: flag(false, hasCourseSub('dactylo-3e')) },
            { code: 'BUREAUTIQUE', label: 'Google Workspace (3e)', status: flag(false, hasCourseSub('bureautique-3e')) }
          ]
        }
      ];
    },

    getSkillTreeTitle() {
      const year = typeof this.getStudentYearLevel === 'function' ? this.getStudentYearLevel() : '1re';
      if (this.teacherAuth?.isTeacher || this.isGuestMode) return 'Arbre de compétences (vue d\'ensemble)';
      if (year === '3e') return 'Mon arbre de compétences — 3e (clavier et bureautique)';
      if (year === '1re') return 'Mon arbre de compétences — 1re (numérique FMTTN)';
      return 'Mon arbre de compétences';
    },

    getSkillTreeSummary() {
      const nodes = this.getStudentSkillTreeBranches().flatMap(b => b.nodes);
      return { done: nodes.filter(n => n.status === 'acquis').length, total: nodes.length };
    },

    /**
     * Vérifie le partage Google Drive du lien saisi par l'élève avant remise
     */
    async verifierPartageLienDrive(urlToCheck) {
      const target = String(urlToCheck ?? this.officeDocUrl ?? '').trim();
      if (!target) {
        this.driveShareCheckResult = null;
        return { valid: false };
      }

      this.driveShareCheckLoading = true;
      try {
        const res = await verifyDriveFileSharing(target);
        this.driveShareCheckResult = res;
        return res;
      } finally {
        this.driveShareCheckLoading = false;
      }
    }
  };
}
