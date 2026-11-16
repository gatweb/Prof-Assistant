/**
 * ⌨️ Moteur de frappe intégré (cours de dactylographie, clavier AZERTY belge).
 * Mesure réellement la vitesse (mots/minute, 1 mot = 5 caractères) et la précision
 * (frappes justes / frappes totales) : l'élève n'encode plus son score à la main.
 */

// Textes d'entraînement par module : chaque texte n'utilise que les touches déjà apprises.
const DRILLS = {
  1: {
    label: 'Ligne de base (QSDF – JKLM)',
    texts: [
      'ff jj dd kk ss ll qq mm fj dk sl qm jf kd ls mq',
      'sqdf jklm fjdk slqm dfjk lmqs jfkd msql fdsq mlkj',
      'mdl skj fql dmk jsf lqd kfm sjd qlk fmj dls kqf'
    ]
  },
  2: {
    label: 'Ligne supérieure et voyelles',
    texts: [
      'marie pilote le kart et salue paul qui roule au milieu de la piste',
      'le samedi papa prie leo de trier les poires et de plier la toile sale',
      'ma soeur a failli laisser sa flute et sa parka sur le sol de la salle'
    ]
  },
  3: {
    label: 'Ligne inférieure (W X C V B N)',
    texts: [
      'avec mon voisin je construis une cabane au bord de la riviere',
      'le renard brun saute par dessus la barriere et court vers le bois',
      'nous savons taper vite sans baisser les yeux vers le clavier'
    ]
  },
  4: {
    label: 'G, H, majuscules et ponctuation',
    texts: [
      'Bonjour Hugo, tu viens au gymnase ce soir ? Oui, je prends mon sac et je te rejoins.',
      'Hier, Gaspard a mis son gilet rouge. Quel courage : il a couru huit tours sans marcher !',
      'Chaque matin, Hortense range son cartable ; puis elle part au village.'
    ]
  },
  6: {
    label: 'Chiffres et accents directs (é è à ç ù)',
    texts: [
      'En 2026, la leçon 7 a duré 45 minutes ; déjà 9 élèves ont réussi.',
      'Léa a reçu 12 élèves à 8 h 30 : où est passé le garçon du 3e rang ?',
      'Ça y est : à 16 h, père et mère fêtent les 40 ans du théâtre.'
    ]
  },
  7: {
    label: 'Accents composés (^ et ¨)',
    texts: [
      'Noël approche : la forêt est blanche, le château paraît immense et la fête sera très gaie.',
      'Le pâtissier naïf rêve d\'une île où le maïs et les pêches mûrissent tôt.'
    ]
  },
  8: {
    label: 'Test final chronométré',
    texts: [
      'Depuis la rentrée, notre classe s\'entraîne chaque semaine à taper sans regarder le clavier. Les index restent sur F et J, le dos bien droit. Au début, c\'était lent ; maintenant, 9 élèves sur 10 dépassent 20 mots par minute. Bravo à tous : la régularité paie toujours !'
    ]
  }
};

function drillNumberForExercise(ex) {
  const id = String(ex?.id || '');
  const m = id.match(/^dac-ch(\d+)/) || id.match(/^dac-ex(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Espaces insécables et apostrophes typographiques : équivalents à la frappe clavier. */
function normalizeTyped(value) {
  return String(value || '')
    .replace(/[  ]/g, ' ')
    .replace(/[’‘`´]/g, '\'')
    .replace(/\r?\n/g, ' ');
}

function escapeHtml(ch) {
  return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;
}

const blankTyping = () => ({
  exId: '',
  label: '',
  text: '',
  textIndex: 0,
  typed: '',
  started: false,
  startTs: 0,
  elapsedMs: 0,
  keystrokes: 0,
  errors: 0,
  finished: false,
  wpm: 0,
  accuracy: 100,
  goalWpm: 15,
  goalAccuracy: 90,
  reached: false,
  implausible: false,
  notice: '',
  best: null
});

export function createTypingStore() {
  return {
    typing: blankTyping(),
    _typingTimer: null,

    /** Un entraînement de frappe existe-t-il pour l'activité affichée ? */
    hasTypingDrill() {
      if (this.currentCourse?.id !== 'dactylo-3e') return false;
      const n = drillNumberForExercise(this.currentExercise);
      return Boolean(n && DRILLS[n]);
    },

    _typingBestKey(exId) {
      return `profassistant_typing_best_${this.user?.email || this.user?.id || 'guest'}_${exId}`;
    },

    /** Prépare (ou change) le texte à taper pour l'activité courante. */
    prepareTypingDrill(nextText = false) {
      if (!this.hasTypingDrill()) return;
      const ex = this.currentExercise;
      const drill = DRILLS[drillNumberForExercise(ex)];
      const sameExercise = this.typing.exId === ex.id;
      if (sameExercise && !nextText && this.typing.text) return;

      this._stopTypingTimer();
      const textIndex = sameExercise && nextText
        ? (this.typing.textIndex + 1) % drill.texts.length
        : 0;
      const source = `${ex.consigne || ''} ${ex.enonce_md || ''}`;
      const goalWpm = Number((source.match(/(\d{1,3})\s*mots/i) || [])[1]) || 15;
      const goalAccuracy = Number((source.match(/(\d{2,3})\s*%/) || [])[1]) || 90;
      let best = sameExercise ? this.typing.best : null;
      if (!sameExercise) {
        try { best = JSON.parse(localStorage.getItem(this._typingBestKey(ex.id)) || 'null'); } catch (_) { best = null; }
      }
      this.typing = {
        ...blankTyping(),
        exId: ex.id,
        label: drill.label,
        text: drill.texts[textIndex],
        textIndex,
        goalWpm: Math.min(120, Math.max(5, goalWpm)),
        goalAccuracy: Math.min(100, Math.max(50, goalAccuracy)),
        best
      };
    },

    hasSeveralTypingTexts() {
      const n = drillNumberForExercise(this.currentExercise);
      return Boolean(n && DRILLS[n] && DRILLS[n].texts.length > 1);
    },

    recommencerFrappe() {
      const keep = { ...this.typing };
      this._stopTypingTimer();
      this.typing = {
        ...blankTyping(),
        exId: keep.exId, label: keep.label, text: keep.text, textIndex: keep.textIndex,
        goalWpm: keep.goalWpm, goalAccuracy: keep.goalAccuracy, best: keep.best
      };
      if (typeof this.$nextTick === 'function') {
        this.$nextTick(() => document.getElementById('typing-input')?.focus());
      }
    },

    _stopTypingTimer() {
      if (this._typingTimer) {
        clearInterval(this._typingTimer);
        this._typingTimer = null;
      }
    },

    _computeTypingStats() {
      const t = this.typing;
      const minutes = Math.max(t.elapsedMs, 1000) / 60000;
      let correct = 0;
      for (let i = 0; i < t.typed.length; i++) {
        if (t.typed[i] === t.text[i]) correct++;
      }
      t.wpm = Math.round((correct / 5) / minutes);
      t.accuracy = t.keystrokes > 0
        ? Math.max(0, Math.round(((t.keystrokes - t.errors) / t.keystrokes) * 100))
        : 100;
    },

    /** Appelé à chaque frappe dans la zone de saisie. */
    onTypingInput(event) {
      const t = this.typing;
      const field = event.target;
      if (t.finished || !t.text) {
        field.value = t.typed;
        return;
      }
      let value = normalizeTyped(field.value).slice(0, t.text.length);
      const added = value.length - t.typed.length;

      // Collage, glisser-déposer ou saisie automatique : refusé (seule la frappe compte).
      if (added > 2 || (added > 0 && !value.startsWith(t.typed))) {
        field.value = t.typed;
        t.notice = '✋ Seule la frappe au clavier compte : pas de copier-coller ni de saisie automatique.';
        return;
      }
      t.notice = '';

      if (!t.started && value.length > 0) {
        t.started = true;
        t.startTs = Date.now();
        this._stopTypingTimer();
        this._typingTimer = setInterval(() => {
          if (!this.typing.started || this.typing.finished) return this._stopTypingTimer();
          this.typing.elapsedMs = Date.now() - this.typing.startTs;
          this._computeTypingStats();
        }, 500);
      }

      for (let i = t.typed.length; i < value.length; i++) {
        t.keystrokes++;
        if (value[i] !== t.text[i]) t.errors++;
      }
      t.typed = value;
      if (field.value !== value) field.value = value;
      if (t.started) t.elapsedMs = Date.now() - t.startTs;
      this._computeTypingStats();

      if (value.length >= t.text.length) this._finishTyping();
    },

    _finishTyping() {
      const t = this.typing;
      this._stopTypingTimer();
      t.finished = true;
      t.elapsedMs = Date.now() - t.startTs;
      this._computeTypingStats();
      // Au-delà de 150 mots/min sur un texte aussi court, ce n'est pas une frappe humaine.
      t.implausible = t.wpm > 150;
      t.reached = !t.implausible && t.wpm >= t.goalWpm && t.accuracy >= t.goalAccuracy;
      if (t.implausible) return;

      const result = { wpm: t.wpm, accuracy: t.accuracy, at: new Date().toISOString() };
      // Record = meilleure vitesse « nette » (la vitesse compte moins si la précision baisse).
      const net = (r) => r.wpm * (r.accuracy / 100);
      const better = !t.best || net(result) > net(t.best);
      if (better) {
        t.best = result;
        try { localStorage.setItem(this._typingBestKey(t.exId), JSON.stringify(result)); } catch (_) {}
      }
      if (t.reached && typeof this.attribuerXpUnique === 'function') {
        this.attribuerXpUnique(`dactylo:${t.exId}`, 15, `Objectif de frappe atteint (${t.label})`);
        if (typeof this.syncCurrentStudentProgress === 'function') this.syncCurrentStudentProgress();
      }
    },

    getTypingSeconds() {
      return Math.round((this.typing.elapsedMs || 0) / 1000);
    },

    getTypingProgressPct() {
      const t = this.typing;
      return t.text ? Math.round((t.typed.length / t.text.length) * 100) : 0;
    },

    /** Texte modèle coloré caractère par caractère (contenu interne, échappé). */
    getTypingTargetHtml() {
      const t = this.typing;
      let html = '';
      for (let i = 0; i < t.text.length; i++) {
        const ch = t.text[i];
        let cls = 'tc-todo';
        if (i < t.typed.length) cls = t.typed[i] === ch ? 'tc-ok' : 'tc-ko';
        else if (i === t.typed.length && !t.finished) cls = 'tc-cur';
        html += `<span class="${cls}">${escapeHtml(ch)}</span>`;
      }
      return html;
    },

    getTypingResultText() {
      const t = this.typing;
      if (!t.finished) return '';
      if (t.implausible) {
        return '🤔 Ce résultat est trop rapide pour être une vraie frappe au clavier. Recommence en tapant toi-même le texte.';
      }
      if (t.reached) {
        return `🏆 Objectif atteint : ${t.wpm} mots/min avec ${t.accuracy} % de précision. Bravo !`;
      }
      if (t.accuracy < t.goalAccuracy) {
        return `🎯 ${t.wpm} mots/min, ${t.accuracy} % de précision. Vise d'abord la précision (${t.goalAccuracy} %) : ralentis, la vitesse viendra toute seule.`;
      }
      return `💪 ${t.wpm} mots/min, ${t.accuracy} % de précision. Ta frappe est précise : encore un peu de vitesse pour atteindre ${t.goalWpm} mots/min.`;
    },

    /** Recopie le résultat mesuré dans le champ de remise au professeur. */
    utiliserResultatFrappe() {
      const t = this.typing;
      if (!t.finished || t.implausible) return;
      this.officeDocUrl = `${t.wpm} mots/min, ${t.accuracy} % de précision — mesuré par ProfAssistant `
        + `(${t.text.length} caractères en ${this.getTypingSeconds()} s, ${t.errors} faute(s) de frappe, objectif ${t.goalWpm} mots/min et ${t.goalAccuracy} %)`;
      if (typeof this.$nextTick === 'function') {
        this.$nextTick(() => document.getElementById('office-submit-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
    }
  };
}
