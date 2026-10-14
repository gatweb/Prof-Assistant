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
     * Lecture vocale des consignes et synthèses (Web Speech API native, 0 €)
     */
    lireTexteVocal(rawText) {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        alert("La synthèse vocale n'est pas disponible sur ce navigateur.");
        return;
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        this.ttsPlaying = false;
        return;
      }

      const cleanText = String(rawText || '')
        .replace(/[#*_`~>-]/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'fr-BE';
      utterance.rate = this.dyslexiaMode ? 0.9 : 0.98;
      utterance.onstart = () => { this.ttsPlaying = true; };
      utterance.onend = () => { this.ttsPlaying = false; };
      utterance.onerror = () => { this.ttsPlaying = false; };

      window.speechSynthesis.speak(utterance);
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
     * Construit l'Arbre de Compétences visuel de l'élève (FMTTN + Multi-cours)
     */
    getStudentSkillTreeBranches() {
      const c = this.eleveCompetences || {};
      const subs = this.studentSubmissionsHistory || [];
      const hasCourseSub = (cid) => subs.some(s => (s.course_id || s.id_course) === cid);

      return [
        {
          id: 'branch-comm',
          title: '💬 Communication & Nétiquette',
          icon: '✉️',
          nodes: [
            { code: 'CHARTE', label: 'Charte & Poste Sécurisé', status: this.charteState?.finished ? 'acquis' : 'en_cours' },
            { code: 'NUM-1.D1', label: 'Réseaux socio-numériques', status: c['NUM-1.D1'] || 'en_cours' },
            { code: 'NUM-1.D5', label: 'Courriel (Cc / Cci)', status: c['NUM-1.D5'] || 'en_cours' },
            { code: 'NUM-1.P2', label: 'Rédiger un e-mail pro', status: c['NUM-1.P2'] || 'en_cours' }
          ]
        },
        {
          id: 'branch-secu',
          title: '🛡️ Cybersécurité & Vie Privée',
          icon: '🔒',
          nodes: [
            { code: 'EG-5', label: 'Investigation 5 Dossiers', status: this.egState?.finished ? 'acquis' : 'en_cours' },
            { code: 'NUM-2.D3', label: 'Protocole HTTPS & Cadenas', status: c['NUM-2.D3'] || 'en_cours' },
            { code: 'NUM-2.D4', label: 'Traces Actives vs Passives', status: c['NUM-2.D4'] || 'en_cours' },
            { code: 'NUM-2.M1', label: 'Campagne Anti-Harcèlement', status: c['NUM-2.M1'] || 'en_cours' }
          ]
        },
        {
          id: 'branch-prod',
          title: '💻 Bureautique, Code & Création IA',
          icon: '🚀',
          nodes: [
            { code: 'BUR-3E', label: 'Google Docs & Partage Drive', status: hasCourseSub('bureautique-3e') ? 'acquis' : 'en_cours' },
            { code: 'WEB-UAA3', label: 'Architecture HTML5 & CSS3', status: hasCourseSub('creation-site-web') ? 'acquis' : 'en_cours' },
            { code: 'JS-UAA5', label: 'Algorithmique JavaScript', status: hasCourseSub('js-uaa5-classic') ? 'acquis' : 'en_cours' },
            { code: 'CREA-IA', label: 'Prompt Engineering Créatif', status: (hasCourseSub('studio-creatif') || this.missionApp?.isSubmitted) ? 'acquis' : 'en_cours' }
          ]
        }
      ];
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
