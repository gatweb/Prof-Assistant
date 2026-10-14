import { marked } from 'marked';
import { courseManagerV2 } from '../services/courseManager.js';
import {
  structurerCoursIACloud,
  getFirestoreCoursesList,
  getCourseModulesFromFirestore,
  saveCourseStudioBundle,
  deleteCourseFromFirestore
} from '../services/firebase.js';
import {
  getClassroomToken,
  fetchCourseWork,
  fetchCourseMaterials
} from '../services/classroomService.js';

export function createStudioStore() {
  return {
    studioCoursesList: [],
    studioSelectedCourseId: '',
    studioLoading: false,
    studioSaving: false,
    studioMigrating: false,
    studioSuccessMsg: '',
    studioErrorMsg: '',

    // Éditeur de cours sans code
    studioCourseForm: {
      id: 'nouveau-cours',
      title: 'Nouveau Cours Interactif',
      pitch: 'Apprenez étape par étape avec la théorie illustrée et les missions pratiques.',
      workspaceType: 'office', // 'office' | 'coding' | 'creative'
      status: 'published',    // 'draft' | 'published'
      icon: '📚',
      primaryColor: '#2563eb',
      systemPrompt: 'Tu es un tuteur pédagogique socratique, bienveillant et encourageant. Pose des questions pour guider l\'élève sans jamais donner la réponse finale.',
      profs: []
    },
    studioModules: [
      {
        id: 'mod-1',
        title: 'Module 1 : Introduction & Premiers pas',
        order: 1,
        theorie_md: '### Bienvenue dans ce module\n\n- Lisez les notions clés ci-dessous.\n- Passez ensuite aux missions pratiques.'
      }
    ],
    studioActiveModuleIdx: 0,
    studioMissions: [
      {
        id: 'nouveau-cours-ex-1',
        module_id: 'mod-1',
        titre: 'Mission 1 : Mise en application',
        consigne: 'Réalisez l\'exercice demandé et soumettez votre travail ci-dessous.',
        submission_type: 'drive_link',
        starter_html: '',
        starter_css: '',
        starter_js: ''
      }
    ],
    studioMarkdownPreview: false,

    // Sources d'import (Phase 10 : 5 sources)
    studioImportSource: 'syllabus', // 'classroom' | 'gdoc' | 'syllabus' | 'pack' | 'duplicate'
    studioImportLoading: false,
    studioImportGDocUrl: '',
    studioImportRawText: '',
    studioImportTitleHint: '',
    studioImportWorkspaceHint: 'office',
    studioImportClassroomCourseId: '',
    studioDuplicateSourceId: 'bureautique-3e',
    studioDuplicateNewId: 'bureautique-copie',
    studioDuplicateNewTitle: 'Copie de Bureautique & Google Workspace',

    // Écran de relecture avant publication (pour toutes les propositions IA / Imports)
    studioReviewModalOpen: false,
    studioReviewProposal: null,

    async initCourseStudio() {
      this.studioLoading = true;
      try {
        await this.rafraichirCatalogueStudio();
        if (this.coursesList.length > 0 && !this.studioSelectedCourseId) {
          await this.chargerCoursDansStudio(this.coursesList[0].id);
        }
      } finally {
        this.studioLoading = false;
      }
    },

    async rafraichirCatalogueStudio() {
      this.coursesList = await courseManagerV2.loadCoursesCatalogue(true);
      this.studioCoursesList = await getFirestoreCoursesList(true);
    },

    creerNouveauCoursStudio() {
      const rand = Math.random().toString(36).substring(2, 6);
      this.studioSelectedCourseId = '';
      this.studioCourseForm = {
        id: `cours-${rand}`,
        title: 'Nouveau Cours Personnalisé',
        pitch: 'Description courte des objectifs et compétences du cours.',
        workspaceType: 'office',
        status: 'draft',
        icon: '🚀',
        primaryColor: '#4f46e5',
        systemPrompt: 'Tu es un tuteur socratique bienveillant. Aide l\'élève avec des questions courtes sans faire l\'exercice à sa place.',
        profs: this.teacherAuth?.user?.email ? [this.teacherAuth.user.email.toLowerCase()] : []
      };
      this.studioModules = [
        {
          id: 'mod-1',
          title: 'Module 1 : Découverte',
          order: 1,
          theorie_md: '### Objectifs du Module 1\n\n1. Comprendre les concepts fondamentaux.\n2. Réaliser la première mission pratique.'
        }
      ];
      this.studioActiveModuleIdx = 0;
      this.studioMissions = [
        {
          id: `cours-${rand}-ex-1`,
          module_id: 'mod-1',
          titre: 'Mission 1 : Premier atelier',
          consigne: 'Suivez les étapes du module et déposez votre lien ou code ci-dessous.',
          submission_type: 'drive_link',
          starter_html: '',
          starter_css: '',
          starter_js: ''
        }
      ];
      this.studioSuccessMsg = '✨ Nouveau brouillon de cours initialisé.';
    },

    async chargerCoursDansStudio(courseId) {
      if (!courseId) return;
      this.studioLoading = true;
      this.studioSuccessMsg = '';
      this.studioErrorMsg = '';
      try {
        const course = this.coursesList.find(c => c.id === courseId);
        if (!course) return;

        this.studioSelectedCourseId = course.id;
        this.studioCourseForm = {
          id: course.id,
          title: course.title || '',
          pitch: course.pitch || '',
          workspaceType: course.workspaceType || 'office',
          status: course.status || 'published',
          icon: course.theme?.icon || course.icon || '📚',
          primaryColor: course.theme?.primaryColor || course.primaryColor || '#2563eb',
          systemPrompt: course.systemPrompt || '',
          profs: course.profs || []
        };

        // 1. Charger les modules depuis Firestore ou depuis les fichiers Markdown statiques
        const fsModules = await getCourseModulesFromFirestore(course.id);
        if (fsModules.length > 0) {
          this.studioModules = fsModules;
        } else {
          const loadedMods = [];
          const chList = course.chapters || [];
          for (let i = 0; i < chList.length; i++) {
            const ch = chList[i];
            const md = await courseManagerV2.loadChapterMarkdown(course, ch);
            loadedMods.push({
              id: ch.id || `mod-${i + 1}`,
              title: ch.title || `Module ${i + 1}`,
              order: i + 1,
              file: ch.file || '',
              theorie_md: md
            });
          }
          this.studioModules = loadedMods.length > 0 ? loadedMods : [
            { id: 'mod-1', title: 'Module 1', order: 1, theorie_md: '# Module 1' }
          ];
        }
        this.studioActiveModuleIdx = 0;

        // 2. Charger les missions/exercices du cours
        const exos = await courseManagerV2.loadCourseExercisesFromDb(course.id);
        this.studioMissions = exos.map((ex, idx) => ({
          id: ex.id || `${course.id}-ex-${idx + 1}`,
          module_id: ex.module_id || ex.chapitre || (this.studioModules[0]?.id || 'mod-1'),
          titre: ex.titre || ex.title || `Mission ${idx + 1}`,
          consigne: ex.consigne || ex.enonce_md || '',
          submission_type: ex.submission_type || (course.workspaceType === 'coding' ? 'code' : 'drive_link'),
          starter_html: ex.starter_code?.html || ex.starter_html || '',
          starter_css: ex.starter_code?.css || ex.starter_css || '',
          starter_js: ex.starter_code?.js || ex.starter_js || ''
        }));
      } catch (err) {
        console.error("[chargerCoursDansStudio] Erreur :", err);
        this.studioErrorMsg = err.message;
      } finally {
        this.studioLoading = false;
      }
    },

    getActiveStudioModule() {
      return this.studioModules[this.studioActiveModuleIdx] || this.studioModules[0] || null;
    },

    getRenderedStudioMarkdown() {
      const mod = this.getActiveStudioModule();
      if (!mod || !mod.theorie_md) return '<p class="text-slate-400 italic">Aucun contenu Markdown.</p>';
      try {
        return marked.parse(mod.theorie_md);
      } catch (_) {
        return mod.theorie_md;
      }
    },

    ajouterModuleStudio() {
      const nextNum = this.studioModules.length + 1;
      const newMod = {
        id: `mod-${nextNum}`,
        title: `Module ${nextNum} : Nouveau Chapitre`,
        order: nextNum,
        theorie_md: `### Module ${nextNum}\n\nExpliquez ici les notions théoriques et exemples du module.`
      };
      this.studioModules.push(newMod);
      this.studioActiveModuleIdx = this.studioModules.length - 1;
    },

    supprimerModuleStudio(idx) {
      if (this.studioModules.length <= 1) {
        alert("Un cours doit comporter au moins un module.");
        return;
      }
      this.studioModules.splice(idx, 1);
      this.studioModules.forEach((m, i) => { m.order = i + 1; });
      if (this.studioActiveModuleIdx >= this.studioModules.length) {
        this.studioActiveModuleIdx = this.studioModules.length - 1;
      }
    },

    ajouterMissionStudio() {
      const activeMod = this.getActiveStudioModule();
      const nextNum = this.studioMissions.length + 1;
      const defaultSubType = this.studioCourseForm.workspaceType === 'coding'
        ? 'code'
        : (this.studioCourseForm.workspaceType === 'creative' ? 'creative_link' : 'drive_link');

      this.studioMissions.push({
        id: `${this.studioCourseForm.id}-ex-${nextNum}`,
        module_id: activeMod?.id || 'mod-1',
        titre: `Mission ${nextNum} : Nouvelle activité`,
        consigne: 'Décrivez l\'objectif pratique à réaliser par l\'élève.',
        submission_type: defaultSubType,
        starter_html: '',
        starter_css: '',
        starter_js: ''
      });
    },

    supprimerMissionStudio(idx) {
      this.studioMissions.splice(idx, 1);
    },

    async sauvegarderCoursStudio(targetStatus = null) {
      if (targetStatus) {
        this.studioCourseForm.status = targetStatus;
      }
      if (!this.studioCourseForm.id.trim() || !this.studioCourseForm.title.trim()) {
        alert("L'identifiant et le titre du cours sont obligatoires.");
        return;
      }

      this.studioSaving = true;
      this.studioSuccessMsg = '';
      this.studioErrorMsg = '';

      try {
        const res = await saveCourseStudioBundle({
          course: this.studioCourseForm,
          modules: this.studioModules,
          missions: this.studioMissions
        });

        await this.rafraichirCatalogueStudio();
        this.studioSelectedCourseId = res.courseId;
        this.studioSuccessMsg = `✅ Cours "${this.studioCourseForm.title}" enregistré dans Firestore (${this.studioCourseForm.status === 'draft' ? 'Brouillon' : 'Publié'}) !`;
      } catch (err) {
        this.studioErrorMsg = "Erreur de sauvegarde : " + err.message;
      } finally {
        this.studioSaving = false;
      }
    },

    async migrerLes6CoursStatiquesVersFirestore() {
      this.studioMigrating = true;
      this.studioSuccessMsg = '';
      this.studioErrorMsg = '';
      try {
        const count = await courseManagerV2.migrateStaticCoursesToFirestore();
        await this.rafraichirCatalogueStudio();
        this.studioSuccessMsg = `🎉 ${count} cours existants (avec leurs modules Markdown et missions) ont été migrés vers Firestore !`;
      } catch (err) {
        this.studioErrorMsg = "Erreur lors de la migration : " + err.message;
      } finally {
        this.studioMigrating = false;
      }
    },

    // ==========================================
    // LES 5 SOURCES D'IMPORT DE COURS (PHASE 10)
    // ==========================================

    /**
     * Source 1 : Import depuis un cours Google Classroom existant (supports + devoirs -> modules)
     */
    async importerCoursDepuisClassroomIA() {
      const cId = this.studioImportClassroomCourseId || this.classroomSelectedCourseId;
      if (!cId) {
        alert("Veuillez sélectionner un cours Google Classroom à importer.");
        return;
      }

      this.studioImportLoading = true;
      this.studioErrorMsg = '';
      try {
        const crCourse = this.classroomCourses.find(c => c.id === cId);
        const [courseWork, materials] = await Promise.all([
          fetchCourseWork(cId),
          fetchCourseMaterials(cId)
        ]);

        const lines = [];
        lines.push(`COURS CLASSROOM : ${crCourse?.name || cId} (${crCourse?.section || ''})`);
        if (materials.length > 0) {
          lines.push(`\nSUPPORTS DE COURS (${materials.length}) :`);
          materials.forEach((m, i) => {
            lines.push(`${i + 1}. ${m.title} : ${m.description || ''}`);
          });
        }
        if (courseWork.length > 0) {
          lines.push(`\nDEVOIRS & ACTIVITÉS (${courseWork.length}) :`);
          courseWork.forEach((cw, i) => {
            lines.push(`${i + 1}. ${cw.title} (${cw.maxPoints || 100} pts) : ${cw.description || ''}`);
          });
        }

        const rawText = lines.join('\n');
        const res = await structurerCoursIACloud({
          sourceType: 'classroom',
          rawText,
          courseTitleHint: crCourse?.name || this.studioImportTitleHint || 'Cours importé de Classroom',
          workspaceTypeHint: this.studioImportWorkspaceHint || 'office'
        });

        this.ouvrirEcranRelectureImport(res.proposal);
      } catch (err) {
        alert("Erreur lors de l'import Classroom par IA : " + err.message);
      } finally {
        this.studioImportLoading = false;
      }
    },

    /**
     * Source 2 : Import depuis un Google Doc (ID/URL Drive ou contenu collé -> Markdown & modules)
     */
    async importerCoursDepuisGoogleDocIA() {
      if (!this.studioImportGDocUrl.trim() && !this.studioImportRawText.trim()) {
        alert("Veuillez renseigner l'URL/ID du Google Doc ou coller son contenu.");
        return;
      }

      this.studioImportLoading = true;
      this.studioErrorMsg = '';
      try {
        const res = await structurerCoursIACloud({
          sourceType: 'gdoc',
          googleDocId: this.studioImportGDocUrl.trim(),
          rawText: this.studioImportRawText.trim(),
          accessToken: getClassroomToken() || '',
          courseTitleHint: this.studioImportTitleHint || 'Cours depuis Google Doc',
          workspaceTypeHint: this.studioImportWorkspaceHint || 'office'
        });

        this.ouvrirEcranRelectureImport(res.proposal);
      } catch (err) {
        alert("Erreur lors de la structuration du Google Doc : " + err.message);
      } finally {
        this.studioImportLoading = false;
      }
    },

    /**
     * Source 3 : Import depuis un PDF / Syllabus / Texte brut
     */
    async importerCoursDepuisSyllabusIA() {
      if (!this.studioImportRawText.trim() || this.studioImportRawText.trim().length < 15) {
        alert("Veuillez coller le texte de votre syllabus, cours ou PDF (au moins quelques lignes).");
        return;
      }

      this.studioImportLoading = true;
      this.studioErrorMsg = '';
      try {
        const res = await structurerCoursIACloud({
          sourceType: 'syllabus',
          rawText: this.studioImportRawText.trim(),
          courseTitleHint: this.studioImportTitleHint || 'Nouveau Cours IA',
          workspaceTypeHint: this.studioImportWorkspaceHint || 'office'
        });

        this.ouvrirEcranRelectureImport(res.proposal);
      } catch (err) {
        alert("Erreur lors de l'analyse IA du syllabus : " + err.message);
      } finally {
        this.studioImportLoading = false;
      }
    },

    /**
     * Charge un fichier local (.txt, .md, .json) dans le champ de texte du syllabus
     */
    chargerFichierTexteSyllabus(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.studioImportRawText = String(e.target?.result || '');
        if (!this.studioImportTitleHint) {
          this.studioImportTitleHint = file.name.replace(/\.[^.]+$/, '');
        }
      };
      reader.readAsText(file);
    },

    /**
     * Source 4 : Pack de cours (Export & Import JSON complet pour partage entre collègues/écoles)
     */
    exporterPackCoursJSON() {
      const pack = {
        format: "profassistant-course-pack-v3",
        exportedAt: new Date().toISOString(),
        course: this.studioCourseForm,
        modules: this.studioModules,
        missions: this.studioMissions
      };
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pack_cours_${this.studioCourseForm.id || 'profassistant'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importerPackCoursJSON(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(String(e.target?.result || '{}'));
          if (!parsed.course && !parsed.modules) {
            throw new Error("Format de pack de cours non reconnu.");
          }
          const proposal = {
            id: parsed.course?.id || parsed.id || 'cours-importe',
            title: parsed.course?.title || parsed.title || 'Cours Importé',
            pitch: parsed.course?.pitch || parsed.pitch || '',
            workspaceType: parsed.course?.workspaceType || parsed.workspaceType || 'office',
            icon: parsed.course?.icon || parsed.course?.theme?.icon || '📦',
            primaryColor: parsed.course?.primaryColor || parsed.course?.theme?.primaryColor || '#2563eb',
            systemPrompt: parsed.course?.systemPrompt || '',
            modules: (parsed.modules || []).map((m, idx) => ({
              id: m.id || `mod-${idx + 1}`,
              title: m.title || `Module ${idx + 1}`,
              order: m.order || (idx + 1),
              theorie_md: m.theorie_md || '',
              missions: (parsed.missions || []).filter(ex => (ex.module_id || ex.chapitre) === m.id)
            }))
          };
          this.ouvrirEcranRelectureImport(proposal);
        } catch (err) {
          alert("Erreur lecture du Pack JSON : " + err.message);
        }
      };
      reader.readAsText(file);
    },

    /**
     * Source 5 : Dupliquer un cours modèle en un clic
     */
    async dupliquerCoursModele() {
      const srcId = this.studioDuplicateSourceId;
      const newId = String(this.studioDuplicateNewId || `${srcId}-copie`)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-');
      const newTitle = (this.studioDuplicateNewTitle || 'Copie du cours').trim();

      if (!srcId || !newId) {
        alert("Veuillez choisir un cours modèle et un nouvel identifiant.");
        return;
      }

      await this.chargerCoursDansStudio(srcId);
      this.studioCourseForm.id = newId;
      this.studioCourseForm.title = newTitle;
      this.studioCourseForm.status = 'draft';
      this.studioMissions = this.studioMissions.map((m, idx) => ({
        ...m,
        id: `${newId}-ex-${idx + 1}`
      }));

      await this.sauvegarderCoursStudio('draft');
      this.studioSuccessMsg = `✨ Cours "${newTitle}" (${newId}) dupliqué avec succès en mode Brouillon !`;
    },

    /**
     * Écran de relecture : ouvre la proposition générée par l'IA avant de l'injecter dans l'éditeur
     */
    ouvrirEcranRelectureImport(proposal) {
      if (!proposal) return;
      this.studioReviewProposal = proposal;
      this.studioReviewModalOpen = true;
    },

    appliquerPropositionImportDansStudio() {
      const p = this.studioReviewProposal;
      if (!p) return;

      const cleanId = String(p.id || 'cours-ia')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-');

      this.studioCourseForm = {
        id: cleanId,
        title: p.title || 'Nouveau Cours IA',
        pitch: p.pitch || '',
        workspaceType: ['office', 'coding', 'creative', 'redaction', 'langues', 'sciences'].includes(p.workspaceType) ? p.workspaceType : 'office',
        status: 'draft',
        icon: p.icon || '✨',
        primaryColor: p.primaryColor || '#4f46e5',
        systemPrompt: p.systemPrompt || 'Tu es un tuteur socratique bienveillant.',
        profs: this.teacherAuth?.user?.email ? [this.teacherAuth.user.email.toLowerCase()] : []
      };

      const mods = [];
      const allMissions = [];

      (p.modules || []).forEach((m, idx) => {
        const modId = m.id || `mod-${idx + 1}`;
        mods.push({
          id: modId,
          title: m.title || `Module ${idx + 1}`,
          order: Number(m.order) || (idx + 1),
          theorie_md: m.theorie_md || ''
        });

        (m.missions || []).forEach((ex) => {
          allMissions.push({
            id: `${cleanId}-ex-${allMissions.length + 1}`,
            module_id: modId,
            titre: ex.titre || `Mission ${allMissions.length + 1}`,
            consigne: ex.consigne || '',
            submission_type: ex.submission_type || (this.studioCourseForm.workspaceType === 'coding' ? 'code' : 'drive_link'),
            starter_html: ex.starter_html || '',
            starter_css: ex.starter_css || '',
            starter_js: ex.starter_js || ''
          });
        });
      });

      this.studioModules = mods.length > 0 ? mods : [{ id: 'mod-1', title: 'Module 1', order: 1, theorie_md: '' }];
      this.studioActiveModuleIdx = 0;
      this.studioMissions = allMissions;
      this.studioReviewModalOpen = false;
      this.studioSuccessMsg = `✨ Proposition chargée dans l'éditeur ! Relisez et cliquez sur "Enregistrer & Publier" quand vous êtes prêt.`;
    }
  };
}
