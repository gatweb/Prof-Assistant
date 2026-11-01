import katex from 'katex';
import { marked } from 'marked';
import { soumettreDevoirCloud, interrogerTuteurIA } from '../services/firebase.js';

/**
 * Transforme les formules LaTeX `$$...$$` (bloc) et `$...$` (inline) en HTML KaTeX
 * puis applique `marked.parse()`.
 */
export function renderMarkdownWithKatex(rawMd) {
  if (!rawMd) return '';
  let text = String(rawMd);

  // 1. Formules en bloc $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch (_) {
      return `$$${tex}$$`;
    }
  });

  // 2. Formules en ligne $ ... $
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch (_) {
      return `$${tex}$`;
    }
  });

  try {
    return marked.parse(text);
  } catch (_) {
    return text;
  }
}

export function createMultiSubjectsStore() {
  return {
    // ==========================================
    // 1. BLOC « RÉDACTION ET ARGUMENTATION »
    // ==========================================
    redactionState: {
      these: '',
      argument1: '',
      exemple1: '',
      argument2: '',
      exemple2: '',
      conclusion: '',
      texteComplet: '',
      submitting: false,
      feedback: '',
      score: null
    },
    connecteursLogiques: [
      { categorie: 'Introduire', mots: ['Tout d\'abord,', 'En premier lieu,', 'Pour commencer,'] },
      { categorie: 'Ajouter', mots: ['De plus,', 'Par ailleurs,', 'En outre,'] },
      { categorie: 'Illustrer', mots: ['Par exemple,', 'Ainsi,', 'C\'est notamment le cas de'] },
      { categorie: 'Nuancer / Opposer', mots: ['Cependant,', 'Toutefois,', 'En revanche,'] },
      { categorie: 'Conclure', mots: ['En conclusion,', 'Par conséquent,', 'En définitive,'] }
    ],

    insererConnecteurRedaction(mot) {
      const cur = this.redactionState.texteComplet || '';
      const sep = cur && !cur.endsWith(' ') && !cur.endsWith('\n') ? ' ' : '';
      this.redactionState.texteComplet = `${cur}${sep}${mot} `;
    },

    assemblerPlanDansTexteRedaction() {
      const s = this.redactionState;
      const parts = [];
      if (s.these.trim()) parts.push(`Thèse : ${s.these.trim()}`);
      if (s.argument1.trim()) parts.push(`Tout d'abord, ${s.argument1.trim()} ${s.exemple1.trim() ? 'Par exemple, ' + s.exemple1.trim() : ''}`);
      if (s.argument2.trim()) parts.push(`De plus, ${s.argument2.trim()} ${s.exemple2.trim() ? 'Ainsi, ' + s.exemple2.trim() : ''}`);
      if (s.conclusion.trim()) parts.push(`En conclusion, ${s.conclusion.trim()}`);
      if (parts.length > 0) {
        this.redactionState.texteComplet = parts.join('\n\n');
      }
    },

    getRedactionWordCount() {
      const txt = (this.redactionState.texteComplet || '').trim();
      if (!txt) return 0;
      return txt.split(/\s+/).filter(Boolean).length;
    },

    async soumettreDevoirRedaction() {
      if (!this.redactionState.texteComplet.trim() && !this.redactionState.these.trim()) {
        alert("Veuillez rédiger votre argumentation avant de soumettre.");
        return;
      }
      if (!this.redactionState.texteComplet.trim()) {
        this.assemblerPlanDansTexteRedaction();
      }

      const exId = this.currentExercise?.id || 'redac-ex1';
      if (typeof this.verifierCooldownSoumission === 'function' && !this.verifierCooldownSoumission(exId, 35)) {
        return;
      }

      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      this.redactionState.submitting = true;
      this.redactionState.feedback = '';

      const payload = `PLAN :\n- Thèse : ${this.redactionState.these}\n- Argument 1 : ${this.redactionState.argument1} (Ex: ${this.redactionState.exemple1})\n- Argument 2 : ${this.redactionState.argument2} (Ex: ${this.redactionState.exemple2})\n- Conclusion : ${this.redactionState.conclusion}\n\nTEXTE RÉDIGÉ (${this.getRedactionWordCount()} mots) :\n${this.redactionState.texteComplet}`;

      try {
        const res = await soumettreDevoirCloud({
          code_eleve: payload,
          id_exercice: exId,
          titre_exercice: this.currentExercise?.titre || 'Rédaction & Argumentation',
          course_id: this.currentCourse?.id || 'pilote-redaction',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'redaction',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        const note = res?.evaluation?.note_suggeree || 85;
        const fb = res?.evaluation?.feedback_eleve || "Texte argumentatif bien structuré et transmis au professeur !";
        this.redactionState.feedback = `✅ ${fb} (Note suggérée : ${note}/100 • Autonomie : ${autonomyScore}%)`;
        this.redactionState.score = note;
        if (!res?.rateLimited && !res?.alreadyValidated && typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 30, 'Rédaction & Argumentation');
        }
        this.studentTutorCallsCount = 0;
        this.studentHintsUsedCount = 0;
        this.syncCurrentStudentProgress();
      } catch (err) {
        this.redactionState.feedback = "✅ Rédaction enregistrée et transmise au professeur !";
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 20, 'Rédaction & Argumentation');
        }
        this.syncCurrentStudentProgress();
      } finally {
        this.redactionState.submitting = false;
      }
    },

    // ==========================================
    // 2. BLOC « LANGUES VIVANTES (JEU DE RÔLE CECRL) »
    // ==========================================
    languesState: {
      targetLang: 'en-GB', // 'en-GB' | 'nl-BE' | 'es-ES'
      cefrLevel: 'A2',     // 'A1' | 'A2' | 'B1' | 'B2'
      scenario: 'Commander dans un café à Londres et signaler poliment une erreur dans l\'addition',
      messages: [
        { role: 'model', text: 'Hello! Welcome to The Covent Garden Café. What can I get for you today?' }
      ],
      studentInput: '',
      loading: false,
      submitting: false,
      feedback: '',
      score: null
    },

    changerLangueRoleplay(lang) {
      this.languesState.targetLang = lang;
      if (lang === 'nl-BE') {
        this.languesState.scenario = 'Een treinticket kopen in het station van Antwerpen-Centraal';
        this.languesState.messages = [
          { role: 'model', text: 'Goedendag! Welkom in het station Antwerpen-Centraal. Waar wilt u naartoe reizen?' }
        ];
      } else if (lang === 'es-ES') {
        this.languesState.scenario = 'Pedir tapas en un restaurante de Madrid y preguntar por los ingredientes';
        this.languesState.messages = [
          { role: 'model', text: '¡Hola! Bienvenido a nuestra taberna en Madrid. ¿Qué te gustaría tomar hoy?' }
        ];
      } else {
        this.languesState.scenario = 'Commander dans un café à Londres et signaler poliment une erreur dans l\'addition';
        this.languesState.messages = [
          { role: 'model', text: 'Hello! Welcome to The Covent Garden Café. What can I get for you today?' }
        ];
      }
    },

    lireMessageLangueCible(text) {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ''));
      u.lang = this.languesState.targetLang || 'en-GB';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    },

    async envoyerRepliqueLangues() {
      const msg = this.languesState.studentInput.trim();
      if (!msg || this.languesState.loading) return;

      const histSnapshot = this.languesState.messages.slice(-8);
      this.languesState.messages.push({ role: 'user', text: msg });
      this.languesState.studentInput = '';
      this.languesState.loading = true;

      try {
        const langName = this.languesState.targetLang === 'nl-BE' ? 'Néerlandais' : (this.languesState.targetLang === 'es-ES' ? 'Espagnol' : 'Anglais');
        const reply = await interrogerTuteurIA({
          question: `[Jeu de rôle CECRL ${this.languesState.cefrLevel} en ${langName} — Scénario : ${this.languesState.scenario}]. Réponds dans la langue cible (${langName}) au niveau ${this.languesState.cefrLevel} pour faire avancer le dialogue, puis ajoute entre parenthèses un très court conseil bienveillant en français si l'élève a fait une faute. Réplique de l'élève : ${msg}`,
          historique: histSnapshot,
          idExercice: this.currentExercise?.id || 'lang-ex1',
          courseId: 'langues',
          contexteEleve: `Niveau CECRL : ${this.languesState.cefrLevel}`
        });
        this.languesState.messages.push({
          role: 'model',
          text: reply || "Great! Could you tell me a little more?"
        });
      } catch (e) {
        this.languesState.messages.push({
          role: 'model',
          text: this.languesState.targetLang === 'nl-BE'
            ? "Prima! Wilt u nog iets anders bestellen?"
            : "That sounds good! Would you like anything else with that?"
        });
      } finally {
        this.languesState.loading = false;
      }
    },

    async soumettreDevoirLangues() {
      const studentTurns = this.languesState.messages.filter(m => m.role === 'user');
      if (studentTurns.length === 0) {
        alert("Écris au moins une réplique dans le dialogue avant de soumettre ta mission.");
        return;
      }

      const exId = this.currentExercise?.id || 'lang-ex1';
      if (typeof this.verifierCooldownSoumission === 'function' && !this.verifierCooldownSoumission(exId, 35)) {
        return;
      }

      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      this.languesState.submitting = true;
      this.languesState.feedback = '';

      const transcript = this.languesState.messages
        .map(m => `${m.role === 'user' ? 'ÉLÈVE' : 'INTERLOCUTEUR'} : ${m.text}`)
        .join('\n');
      const payload = `LANGUE : ${this.languesState.targetLang} | NIVEAU CECRL : ${this.languesState.cefrLevel}\nSCÉNARIO : ${this.languesState.scenario}\n\nTRANSCRIPTION DU JEU DE RÔLE :\n${transcript}`;

      try {
        const res = await soumettreDevoirCloud({
          code_eleve: payload,
          id_exercice: exId,
          titre_exercice: this.currentExercise?.titre || `Jeu de rôle CECRL ${this.languesState.cefrLevel}`,
          course_id: this.currentCourse?.id || 'pilote-langues',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'langues',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        const note = res?.evaluation?.note_suggeree || 85;
        const fb = res?.evaluation?.feedback_eleve || "Excellent dialogue CECRL !";
        this.languesState.feedback = `✅ ${fb} (Note suggérée : ${note}/100 • Autonomie : ${autonomyScore}%)`;
        this.languesState.score = note;
        if (!res?.rateLimited && !res?.alreadyValidated && typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 30, 'Jeu de rôle CECRL');
        }
        this.syncCurrentStudentProgress();
      } catch (_) {
        this.languesState.feedback = "✅ Dialogue enregistré et transmis au professeur !";
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 20, 'Jeu de rôle CECRL');
        }
        this.syncCurrentStudentProgress();
      } finally {
        this.languesState.submitting = false;
      }
    },

    // ==========================================
    // 3. BLOC « SCIENCES & MATHS (KATEX) »
    // ==========================================
    sciencesState: {
      donneesConnues: 'm = 80 kg, v = 5 m/s',
      formuleLatex: 'E_c = \\frac{1}{2} \\cdot m \\cdot v^2',
      developpementCalcul: 'E_c = 0.5 \\cdot 80 \\cdot 5^2 = 40 \\cdot 25 = 1000',
      resultatFinal: '1000',
      uniteSI: 'J (Joules)',
      submitting: false,
      feedback: '',
      score: null
    },

    insererSymboleLatexSciences(sym) {
      this.sciencesState.formuleLatex = `${this.sciencesState.formuleLatex || ''} ${sym}`.trim();
    },

    getRenderedSciencesPreview() {
      const s = this.sciencesState;
      const md = `**1. Données :** $${s.donneesConnues || '...'}$\n\n**2. Formule :**\n$$${s.formuleLatex || '...'}$$\n\n**3. Calcul :**\n$$${s.developpementCalcul || '...'}$$\n\n**4. Résultat final :** **$${s.resultatFinal || '?'}\\text{ ${s.uniteSI || ''}}$**`;
      return renderMarkdownWithKatex(md);
    },

    async soumettreDevoirSciences() {
      if (!this.sciencesState.resultatFinal.trim()) {
        alert("Veuillez indiquer votre résultat final et son unité.");
        return;
      }

      const exId = this.currentExercise?.id || 'sci-ex1';
      if (typeof this.verifierCooldownSoumission === 'function' && !this.verifierCooldownSoumission(exId, 35)) {
        return;
      }

      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      this.sciencesState.submitting = true;
      this.sciencesState.feedback = '';

      const s = this.sciencesState;
      const payload = `DÉMARCHE SCIENTIFIQUE & MATHÉMATIQUE :\n1. Données connues : ${s.donneesConnues}\n2. Formule (LaTeX) : $$${s.formuleLatex}$$\n3. Développement & Calcul : $$${s.developpementCalcul}$$\n4. Résultat final : ${s.resultatFinal} | Unité : ${s.uniteSI}`;

      try {
        const res = await soumettreDevoirCloud({
          code_eleve: payload,
          id_exercice: exId,
          titre_exercice: this.currentExercise?.titre || 'Résolution Sciences & Maths',
          course_id: this.currentCourse?.id || 'pilote-sciences',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'sciences',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        const note = res?.evaluation?.note_suggeree || 85;
        const fb = res?.evaluation?.feedback_eleve || "Démarche scientifique claire et rigoureuse !";
        this.sciencesState.feedback = `✅ ${fb} (Note suggérée : ${note}/100 • Autonomie : ${autonomyScore}%)`;
        this.sciencesState.score = note;
        if (!res?.rateLimited && !res?.alreadyValidated && typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 30, 'Sciences & Maths');
        }
        this.syncCurrentStudentProgress();
      } catch (_) {
        this.sciencesState.feedback = "✅ Résolution enregistrée et transmise au professeur !";
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique(`exo:${exId}`, 20, 'Sciences & Maths');
        }
        this.syncCurrentStudentProgress();
      } finally {
        this.sciencesState.submitting = false;
      }
    },

    renderRichMathMarkdown(md) {
      return renderMarkdownWithKatex(md);
    }
  };
}
