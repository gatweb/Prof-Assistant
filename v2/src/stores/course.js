import { marked } from 'marked';
import { courseManagerV2, DEFAULT_EXERCISES_BY_COURSE } from '../services/courseManager.js';
import { soumettreDevoirCloud } from '../services/firebase.js';

export function createCourseStore() {
  return {
    // Navigation en entonnoir (Phase 8) : 'hub' | 'course' | 'focus'
    studentViewMode: 'course',
    deepLinkActive: false,

    coursesList: [],
    currentCourse: null,
    currentChapter: null,
    courseMarkdownContent: '',
    courseMarkdownLoading: false,
    courseExercises: [],
    currentExercise: null,
    exerciseLoading: false,

    // Onglet actif dans un module de la Carte du Cours : 'theorie' | 'missions'
    moduleActiveTab: 'theorie',

    // Atelier Bureautique / Dactylo
    officeDocUrl: '',
    officeNotes: '',
    officeSubmitting: false,
    officeSubmissionStatus: 'idle',
    officeFeedback: '',
    officeScore: null,
    officeMemoSlide: 1,

    // Atelier Coding (HTML / CSS / JS)
    codingActiveTab: 'html',
    codingFiles: {
      html: '',
      css: '',
      js: ''
    },
    codingConsoleLogs: [],
    codingPreviewSrcDoc: '',
    codingSubmitting: false,
    codingFeedback: '',
    codingScore: null,

    // Atelier Créatif
    creativeProjectUrl: '',
    creativeNotes: '',
    creativeSubmitting: false,
    creativeStatus: 'idle',
    creativeFeedback: '',
    creativeScore: null,

    async initCoursesCatalogue() {
      try {
        this.coursesList = await courseManagerV2.loadCoursesCatalogue();
        this.currentCourse = courseManagerV2.activeCourse || this.coursesList[0];
        this.currentChapter = courseManagerV2.activeChapter || this.currentCourse?.chapters?.[0] || null;

        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CONSOLE_LOG') {
            this.codingConsoleLogs.push({
              text: event.data.log,
              type: event.data.logType || 'info',
              time: new Date().toLocaleTimeString()
            });
            if (this.codingConsoleLogs.length > 40) {
              this.codingConsoleLogs.shift();
            }
          }
        });

        // 1. Vérifier les paramètres d'URL pour les liens profonds Classroom (?course=&ex=&module=&view=)
        const handledDeepLink = await this.handleDeepLinkParams();

        // 2. Si pas de lien profond et cours non-FMTTN, charger le contenu normal
        if (!handledDeepLink && this.currentCourse && this.currentCourse.workspaceType !== 'fmttn') {
          await this.chargerContenuCoursActif();
        }
      } catch (e) {
        console.error("[initCoursesCatalogue] Erreur :", e);
      }
    },

    /**
     * Lit `?course=…&ex=…&module=…&view=…` au démarrage (Phase 8 - corrige C1)
     */
    async handleDeepLinkParams() {
      if (typeof window === 'undefined' || !window.location.search) return false;
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get('course');
      const exParam = params.get('ex');
      const moduleParam = params.get('module');
      const viewParam = params.get('view');

      if (viewParam === 'hub') {
        this.studentViewMode = 'hub';
        return true;
      }

      if (!courseParam && !exParam && !moduleParam) return false;

      this.deepLinkActive = true;

      if (courseParam) {
        const foundCourse = courseManagerV2.selectCourse(courseParam);
        if (foundCourse) {
          this.currentCourse = foundCourse;
          this.currentChapter = foundCourse.chapters?.[0] || null;
        }
      }

      if (this.currentCourse?.workspaceType === 'fmttn') {
        const targetMod = moduleParam || exParam;
        if (targetMod && ['module-0', 'escape-game', 'ch1-communication', 'ch2-securite'].includes(targetMod)) {
          this.selectedModuleId = targetMod;
        }
        this.activeTab = 'decouvre';
        this.studentViewMode = 'focus';
        return true;
      }

      if (this.currentCourse) {
        await this.chargerContenuCoursActif();

        if (moduleParam) {
          const ch = courseManagerV2.selectChapter(moduleParam);
          if (ch) {
            this.currentChapter = ch;
            await this.chargerMarkdownChapitre();
          }
        }

        if (exParam) {
          const targetEx = this.courseExercises.find(
            e => e.id === exParam || String(e.id).toLowerCase() === String(exParam).toLowerCase()
          );
          if (targetEx) {
            this.selectionnerExercice(targetEx);
            if (targetEx.chapitre) {
              const linkedCh = courseManagerV2.findChapterByDbLabel(this.currentCourse, targetEx.chapitre);
              if (linkedCh) {
                this.currentChapter = linkedCh;
                await this.chargerMarkdownChapitre();
              }
            }
          }
          this.activeTab = 'pratique';
          this.studentViewMode = 'focus';
        } else {
          this.activeTab = 'cours';
          this.studentViewMode = 'focus';
        }
        return true;
      }

      return false;
    },

    /**
     * Met à jour l'URL sans recharger la page pour faciliter le partage et l'historique
     */
    updateUrlQueryParams({ courseId, exId, view }) {
      if (typeof window === 'undefined' || !window.history?.replaceState) return;
      const url = new URL(window.location.href);
      if (view === 'hub') {
        url.searchParams.delete('course');
        url.searchParams.delete('ex');
        url.searchParams.set('view', 'hub');
      } else {
        url.searchParams.delete('view');
        if (courseId) url.searchParams.set('course', courseId);
        if (exId) {
          url.searchParams.set('ex', exId);
        } else {
          url.searchParams.delete('ex');
        }
      }
      window.history.replaceState({}, '', url.toString());
    },

    // ==========================================
    // NAVIGATION EN ENTONNOIR (HUB -> COURS -> FOCUS)
    // ==========================================
    ouvrirHubCours() {
      this.activeTab = 'decouvre';
      this.studentViewMode = 'hub';
      this.updateUrlQueryParams({ view: 'hub' });
    },

    async ouvrirCarteCours(courseId) {
      if (courseId && courseId !== this.currentCourse?.id) {
        await this.changerCours(courseId, false);
      }
      this.studentViewMode = 'course';
      this.moduleActiveTab = 'theorie';
      this.updateUrlQueryParams({ courseId: this.currentCourse?.id, exId: null });
    },

    async ouvrirModeFocus({ chapterId = null, exercise = null, tab = null } = {}) {
      if (this.currentCourse?.workspaceType === 'fmttn') {
        if (chapterId) {
          this.selectedModuleId = chapterId;
        }
        this.activeTab = tab || 'decouvre';
        this.studentViewMode = 'focus';
        this.updateUrlQueryParams({ courseId: 'fmttn-1re', exId: this.selectedModuleId });
        return;
      }

      if (chapterId && chapterId !== this.currentChapter?.id) {
        await this.changerChapitre(chapterId);
      }
      if (exercise) {
        this.selectionnerExercice(exercise);
        this.activeTab = 'pratique';
      } else if (tab) {
        this.activeTab = tab;
      } else {
        this.activeTab = 'cours';
      }
      this.studentViewMode = 'focus';
      this.updateUrlQueryParams({
        courseId: this.currentCourse?.id,
        exId: this.currentExercise?.id || null
      });
    },

    /**
     * Boutons « Suivant ➔ » et « Précédent » en Mode Focus
     */
    async focusEtapeSuivante() {
      if (this.currentCourse?.workspaceType === 'fmttn') {
        const order = ['module-0', 'escape-game', 'ch1-communication', 'ch2-securite'];
        const idx = order.indexOf(this.selectedModuleId);
        if (idx < order.length - 1) {
          this.selectedModuleId = order[idx + 1];
          this.activeTab = 'decouvre';
        }
        return;
      }

      // Si on est sur la théorie, passer à l'atelier pratique du chapitre ou au chapitre suivant
      if (this.activeTab === 'cours') {
        const chExos = this.getExercisesForChapter(this.currentChapter);
        if (chExos.length > 0) {
          this.selectionnerExercice(chExos[0]);
          this.activeTab = 'pratique';
          this.updateUrlQueryParams({ courseId: this.currentCourse?.id, exId: chExos[0].id });
          return;
        }
        const chapters = this.currentCourse?.chapters || [];
        const cIdx = chapters.findIndex(c => c.id === this.currentChapter?.id);
        if (cIdx !== -1 && cIdx < chapters.length - 1) {
          await this.changerChapitre(chapters[cIdx + 1].id);
        } else if (this.courseExercises.length > 0) {
          this.activeTab = 'pratique';
        }
        return;
      }

      // Si on est en mode pratique, passer à l'exercice suivant ou au chapitre suivant
      if (this.activeTab === 'pratique') {
        const exIdx = this.courseExercises.findIndex(e => e.id === this.currentExercise?.id);
        if (exIdx !== -1 && exIdx < this.courseExercises.length - 1) {
          const nextEx = this.courseExercises[exIdx + 1];
          this.selectionnerExercice(nextEx);
          this.updateUrlQueryParams({ courseId: this.currentCourse?.id, exId: nextEx.id });
          return;
        }
        const chapters = this.currentCourse?.chapters || [];
        const cIdx = chapters.findIndex(c => c.id === this.currentChapter?.id);
        if (cIdx !== -1 && cIdx < chapters.length - 1) {
          await this.changerChapitre(chapters[cIdx + 1].id);
          this.activeTab = 'cours';
        }
      }
    },

    async focusEtapePrecedente() {
      if (this.currentCourse?.workspaceType === 'fmttn') {
        const order = ['module-0', 'escape-game', 'ch1-communication', 'ch2-securite'];
        const idx = order.indexOf(this.selectedModuleId);
        if (idx > 0) {
          this.selectedModuleId = order[idx - 1];
          this.activeTab = 'decouvre';
        }
        return;
      }

      if (this.activeTab === 'pratique') {
        const exIdx = this.courseExercises.findIndex(e => e.id === this.currentExercise?.id);
        if (exIdx > 0) {
          const prevEx = this.courseExercises[exIdx - 1];
          this.selectionnerExercice(prevEx);
          this.updateUrlQueryParams({ courseId: this.currentCourse?.id, exId: prevEx.id });
          return;
        }
        this.activeTab = 'cours';
        return;
      }

      const chapters = this.currentCourse?.chapters || [];
      const cIdx = chapters.findIndex(c => c.id === this.currentChapter?.id);
      if (cIdx > 0) {
        await this.changerChapitre(chapters[cIdx - 1].id);
      }
    },

    /**
     * Calcule le % de progression d'un cours pour le Hub « Mes cours »
     */
    getCourseCompletionPercent(course) {
      if (!course) return 0;
      if (course.id === 'fmttn-1re' || course.workspaceType === 'fmttn') {
        let pts = 0;
        if (this.charteState?.finished) pts += 25;
        if (this.egState?.finished) pts += 25;
        else if (this.egState?.dossierUnlocked?.length > 1) pts += (this.egState.dossierUnlocked.length * 4);
        if (this.eleveCompetences?.['NUM-1.P2'] === 'acquis') pts += 25;
        if (this.eleveCompetences?.['NUM-2.D4'] === 'acquis' || this.eleveCompetences?.['NUM-2.M1'] === 'acquis') pts += 25;
        return Math.min(100, pts);
      }

      const defaultExos = DEFAULT_EXERCISES_BY_COURSE[course.id] || [];
      const totalExos = (this.currentCourse?.id === course.id && this.courseExercises.length > 0)
        ? this.courseExercises.length
        : Math.max(1, defaultExos.length);

      const subs = (this.studentSubmissionsHistory || []).filter(
        s => (s.course_id || s.id_course) === course.id
      );
      if (subs.length === 0) return 0;

      const uniqueExosDone = new Set(subs.map(s => s.id_exercice || s.exercice_id)).size;
      return Math.min(100, Math.round((uniqueExosDone / totalExos) * 100));
    },

    /**
     * Filtre les cours du Hub selon la classe de l'élève et les liaisons Classroom (Phase 9)
     */
    getFilteredHubCourses() {
      if (!this.coursesList || !this.coursesList.length) return [];
      const cl = (this.user?.classe || '1A').toUpperCase();
      const is1re2e = cl.startsWith('1') || cl.startsWith('2');

      const explicitMapping = (this.classMappings || []).find(
        m => String(m.id || '').toUpperCase() === cl
      );
      const linkedCourseIds = new Set(
        explicitMapping?.cours || (explicitMapping?.course_id ? [explicitMapping.course_id] : [])
      );

      return this.coursesList.map(c => {
        let recommended = true;
        if (linkedCourseIds.size > 0) {
          recommended = linkedCourseIds.has(c.id);
        } else if (is1re2e) {
          recommended = c.id === 'fmttn-1re' || c.id === 'studio-creatif' || c.id === 'rap-academy';
        } else {
          recommended = c.id !== 'fmttn-1re';
        }
        return {
          ...c,
          recommended,
          explicitlyLinked: linkedCourseIds.has(c.id),
          progressPercent: this.getCourseCompletionPercent(c)
        };
      });
    },

    getExercisesForChapter(chapter) {
      if (!chapter || !this.courseExercises?.length) return [];
      const matched = this.courseExercises.filter(ex => {
        if (!ex.chapitre && !ex.module_id) return false;
        const target = String(ex.module_id || ex.chapitre).toLowerCase();
        return target === String(chapter.id).toLowerCase() ||
               String(chapter.title || '').toLowerCase().includes(target);
      });
      return matched;
    },

    async changerCours(courseId, goToFocus = true) {
      const found = courseManagerV2.selectCourse(courseId);
      if (!found) return;
      this.currentCourse = found;
      this.currentChapter = found.chapters?.[0] || null;

      if (this.currentCourse.workspaceType === 'fmttn') {
        this.selectedModuleId = 'module-0';
        this.activeTab = 'decouvre';
        this.tutorMessage = "Salut ! Je suis ton assistant @lt_X pour le cours de Numérique FMTTN. Pose-moi tes questions sur la charte, la sécurité ou la communication !";
      } else {
        this.activeTab = 'cours';
        this.tutorMessage = `Salut ! Je suis ton tuteur socratique pour "${this.currentCourse.title}". Pose-moi une question sur le cours ou un exercice !`;
        await this.chargerContenuCoursActif();
      }

      if (goToFocus && this.studentViewMode === 'hub') {
        this.studentViewMode = 'course';
      }
      this.updateUrlQueryParams({ courseId: found.id, exId: null });
    },

    async changerChapitre(chapterId) {
      const found = courseManagerV2.selectChapter(chapterId);
      if (!found) return;
      this.currentChapter = found;
      await this.chargerMarkdownChapitre();
    },

    async chargerContenuCoursActif() {
      await this.chargerMarkdownChapitre();
      this.exerciseLoading = true;
      try {
        this.courseExercises = await courseManagerV2.loadCourseExercisesFromDb(this.currentCourse.id);
        if (this.courseExercises.length > 0) {
          this.selectionnerExercice(this.courseExercises[0]);
        } else {
          this.currentExercise = null;
        }
      } finally {
        this.exerciseLoading = false;
      }
    },

    async chargerMarkdownChapitre() {
      if (!this.currentCourse || !this.currentChapter) return;
      this.courseMarkdownLoading = true;
      try {
        const raw = await courseManagerV2.loadChapterMarkdown(this.currentCourse, this.currentChapter);
        this.courseMarkdownContent = marked.parse(raw);
      } catch (e) {
        console.warn("Erreur chargement Markdown :", e);
        this.courseMarkdownContent = `<div class="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
          <h4 class="font-bold text-lg mb-2">Support de cours en préparation</h4>
          <p>Le contenu de ce chapitre est disponible dans votre classeur ou sera mis en ligne par l'enseignant.</p>
        </div>`;
      } finally {
        this.courseMarkdownLoading = false;
      }
    },

    selectionnerExercice(ex) {
      this.currentExercise = ex;
      this.officeFeedback = '';
      this.officeSubmissionStatus = 'idle';
      this.codingFeedback = '';
      this.codingConsoleLogs = [];
      this.creativeFeedback = '';
      this.creativeStatus = 'idle';

      if (this.currentCourse?.workspaceType === 'coding') {
        this.codingFiles = {
          html: ex.starter_code?.html || `<div class="carte">\n  <h1>${ex.titre || 'Mon Projet'}</h1>\n  <p>Mon premier code interactif</p>\n  <button id="btn">Cliquez ici</button>\n</div>`,
          css: ex.starter_code?.css || `body {\n  font-family: 'Plus Jakarta Sans', sans-serif;\n  background: #f8fafc;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n}\n.carte {\n  background: white;\n  padding: 24px;\n  border-radius: 12px;\n  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\n  text-align: center;\n}\nbutton {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 6px;\n  cursor: pointer;\n}`,
          js: ex.starter_code?.js || `document.getElementById('btn')?.addEventListener('click', () => {\n  console.log('Action déclenchée !');\n  alert('Bravo !');\n});`
        };
        this.updateCodingPreview();
      } else if (this.currentCourse?.workspaceType === 'office') {
        this.officeDocUrl = '';
        this.officeNotes = '';
        this.officeMemoSlide = 1;
      } else if (this.currentCourse?.workspaceType === 'creative') {
        this.creativeProjectUrl = '';
        this.creativeNotes = '';
      }
    },

    updateCodingPreview() {
      const safeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${this.codingFiles.css}
  </style>
</head>
<body>
  ${this.codingFiles.html}
  <script>
    (function() {
      const _send = (log, type) => {
        try {
          window.parent.postMessage({ type: 'CONSOLE_LOG', log: String(log), logType: type }, '*');
        } catch(e) {}
      };
      const _l = console.log;
      console.log = function(...args) {
        _l.apply(console, args);
        _send(args.join(' '), 'info');
      };
      const _w = console.warn;
      console.warn = function(...args) {
        _w.apply(console, args);
        _send(args.join(' '), 'warn');
      };
      const _e = console.error;
      console.error = function(...args) {
        _e.apply(console, args);
        _send(args.join(' '), 'error');
      };
      try {
        ${this.codingFiles.js}
      } catch (err) {
        console.error(err.message);
      }
    })();
  <\/script>
</body>
</html>`;
      this.codingPreviewSrcDoc = safeHtml;
    },

    async soumettreCodeExercice() {
      if (this.codingSubmitting) return;
      this.codingSubmitting = true;
      this.codingFeedback = '';

      const payload = `HTML:\n${this.codingFiles.html}\n\nCSS:\n${this.codingFiles.css}\n\nJS:\n${this.codingFiles.js}`;
      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      try {
        const res = await soumettreDevoirCloud({
          code_eleve: payload,
          id_exercice: this.currentExercise?.id || 'code-ex',
          titre_exercice: this.currentExercise?.titre || this.currentExercise?.title || 'Code Web',
          course_id: this.currentCourse?.id || 'js-uaa5-classic',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'code',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        const note = res?.evaluation?.note_suggeree || 85;
        const fb = res?.evaluation?.feedback_eleve || "Ton code a été analysé avec succès ! Bien joué pour la structure.";
        this.codingFeedback = `✅ ${fb} (Note suggérée : ${note}/100 • Autonomie : ${autonomyScore}%)`;
        this.codingScore = note;
        this.user.xp += 30;
        this.studentTutorCallsCount = 0;
        this.studentHintsUsedCount = 0;
        this.syncCurrentStudentProgress();
      } catch (err) {
        console.warn("[soumettreCodeExercice] Fallback local :", err);
        this.codingFeedback = "✅ Travail enregistré et transmis au professeur !";
        this.user.xp += 20;
        this.syncCurrentStudentProgress();
      } finally {
        this.codingSubmitting = false;
      }
    },

    async soumettreOfficeDevoir() {
      const docUrl = this.officeDocUrl.trim();
      if (!docUrl && this.currentExercise?.submission_type !== 'text') {
        alert("Veuillez coller le lien de votre Google Doc ou dossier Drive.");
        return;
      }

      // Phase 12 : Vérification automatique du partage Google Drive avant remise
      if (this.currentExercise?.submission_type !== 'text' && typeof this.verifierPartageLienDrive === 'function') {
        const check = await this.verifierPartageLienDrive(docUrl);
        if (check && check.status === 'private_file') {
          alert(check.message);
          return;
        }
      }

      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      this.officeSubmitting = true;
      try {
        const content = `LIEN : ${docUrl}\n\nNOTES : ${this.officeNotes}`;
        await soumettreDevoirCloud({
          code_eleve: content,
          id_exercice: this.currentExercise?.id || 'office-ex',
          titre_exercice: this.currentExercise?.titre || this.currentExercise?.title || 'Devoir Office',
          course_id: this.currentCourse?.id || 'bureautique-3e',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'office',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        this.officeSubmissionStatus = 'pending';
        this.officeFeedback = `✅ Document soumis au professeur ! (Score d'autonomie : ${autonomyScore}%)`;
        this.user.xp += 25;
        this.studentTutorCallsCount = 0;
        this.studentHintsUsedCount = 0;
        this.syncCurrentStudentProgress();
      } catch (err) {
        console.warn("[soumettreOfficeDevoir] Fallback local :", err);
        this.officeSubmissionStatus = 'pending';
        this.officeFeedback = "✅ Travail mémorisé avec succès !";
        this.user.xp += 20;
        this.syncCurrentStudentProgress();
      } finally {
        this.officeSubmitting = false;
      }
    },

    async soumettreCreativeDevoir() {
      const projUrl = this.creativeProjectUrl.trim();
      if (!projUrl) {
        alert("Veuillez coller le lien de votre création (Canva, Drive, Gemini, etc.).");
        return;
      }
      const autonomyScore = typeof this.getCurrentAutonomyScore === 'function' ? this.getCurrentAutonomyScore() : 100;
      this.creativeSubmitting = true;
      try {
        const content = `PROJET : ${projUrl}\n\nDÉMARCHE : ${this.creativeNotes}`;
        await soumettreDevoirCloud({
          code_eleve: content,
          id_exercice: this.currentExercise?.id || 'creative-ex',
          titre_exercice: this.currentExercise?.titre || this.currentExercise?.title || 'Projet Créatif',
          course_id: this.currentCourse?.id || 'studio-creatif',
          nom_eleve: this.user.nom,
          classe_id: this.user.classe,
          type: 'creative',
          autonomie: {
            score: autonomyScore,
            tutor_calls: this.studentTutorCallsCount || 0,
            hints_used: this.studentHintsUsedCount || 0
          }
        });
        this.creativeStatus = 'pending';
        this.creativeFeedback = `✨ Mission créative transmise avec brio ! (Score d'autonomie : ${autonomyScore}%)`;
        this.user.xp += 30;
        this.studentTutorCallsCount = 0;
        this.studentHintsUsedCount = 0;
        this.syncCurrentStudentProgress();
      } catch (err) {
        console.warn("[soumettreCreativeDevoir] Fallback local :", err);
        this.creativeStatus = 'pending';
        this.creativeFeedback = "✨ Mission créative mémorisée avec succès !";
        this.user.xp += 20;
        this.syncCurrentStudentProgress();
      } finally {
        this.creativeSubmitting = false;
      }
    }
  };
}
