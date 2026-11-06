import {
  listenToClasseProgressions,
  getRealClassStudents,
  addRealStudent,
  updateStudentClassInDb,
  deleteStudentFromClassInDb,
  archiveOrRestoreStudentInDb,
  saveStudentBulletinInDb,
  cleanDuplicatesAndArchiveOldStudentsInDb,
  getCurrentSchoolYearLabel,
  normalizeStudentNameTokens,
  isGhostOrDemoAccount,
  resolveBestStudentClass,
  getYearLevelFromClass,
  listerEnseignantsCloud,
  enregistrerEnseignantCloud,
  supprimerEnseignantCloud,
  listenToTeacherSubmissions,
  updateTeacherSubmission,
  deleteTeacherSubmission,
  purgerDoublonsSubmissionsFirestore,
  appliquerSanctionEtAvertissementEleve
} from '../services/firebase.js';
import { courseManagerV2 } from '../services/courseManager.js';

export function createTeacherStore() {
  return {
    activeProfSubTab: 'copies',
    activeProfToolSubTab: 'studio', // 'studio' | 'forms' | 'notebooklm' | 'equipe'
    profMatrixChapter: 'ch1',
    selectedTeacherClass: 'tous',
    unsubscribeTeacherListener: null,
    firestoreSynced: false,
    remediationGenerated: false,

    teacherSubmissions: [],
    unsubscribeSubmissionsListener: null,
    submissionFilterStatus: 'tous',
    submissionFilterCourse: 'tous',
    submissionFilterClass: 'tous',
    submissionSearchText: '',
    submissionsPageLimit: 25,
    selectedSubmission: null,
    modalCorrectionOpen: false,
    gradingNote: 80,
    gradingProfMessage: '',
    gradingLoading: false,
    gradingFeedbackSuccess: '',
    speedGraderViewTab: 'preview', // 'preview' | 'raw'
    batchValidating: false,
    batchFeedbackMsg: '',
    deduplicateSpeedGrader: true,
    showAntiSpamPanel: false,
    antiSpamCleaning: false,
    antiSpamFeedbackMsg: '',
    showSpammerRadar: true,
    customWarningMessage: "Nous avons constaté un envoi répétitif d'exercices identiques (spam de clics) visant à accumuler artificiellement des points d'XP. Tes copies en doublon ont été supprimées et ton solde d'XP a été ramené à tes réussites réelles uniques. Merci d'utiliser la plateforme avec fair-play et respect du travail scolaire.",

    profSelectedCourseId: 'fmttn-1c',
    profCourseExercises: [],
    profCourseLoading: false,

    teachersList: [],
    teachersLoading: false,
    searchTeacherQuery: '',
    modalAddTeacherOpen: false,
    isEditingTeacher: false,
    teacherFormData: {
      email: '',
      nom: '',
      role: 'enseignant',
      classes: 'all',
      actif: true
    },

    allSchoolStudents: [],
    allClassStudents: [],
    searchStudentQuery: '',
    // Filtre par année scolaire & activité : 'actifs' (Année en cours) | 'inactifs' (0 activité) | 'archives' (Années précédentes) | 'tous'
    studentPeriodFilter: 'actifs',
    studentArchiveYearFilter: 'tous',
    currentSchoolYear: getCurrentSchoolYearLabel(),
    cleaningStudentsLoading: false,
    cleaningStudentsInProgress: false,
    cleaningStudentsFeedback: '',
    studentCleanStatusMsg: '',

    // Vue « 📋 Bulletin Scolaire Individuel »
    modalBulletinEleveOpen: false,
    selectedBulletinStudent: null,
    bulletinAppreciationDraft: '',
    bulletinAppreciationText: '',
    bulletinCustomNote20: '',
    bulletinSaving: false,
    bulletinSaveFeedback: '',
    bulletinSaveMsg: '',

    modalAddStudentOpen: false,
    newStudentData: {
      nom: '',
      classe: '1A',
      email: ''
    },

    classeEleves: [],

    getCurrentSchoolYear() {
      return getCurrentSchoolYearLabel();
    },

    /**
     * Sépare automatiquement les élèves de 1re année et de 3e année selon le cours sélectionné par le professeur
     */
    doesStudentMatchSelectedProfCourseLevel(st) {
      if (!st) return false;
      if (isGhostOrDemoAccount(st.nom, st.email, st.id, st.xp)) return false;
      // Si le professeur a cliqué sur une classe spécifique (ex: 3A ou 1A), respecter ce choix
      if (this.selectedTeacherClass && this.selectedTeacherClass !== 'tous' && this.selectedTeacherClass !== 'all') {
        return true;
      }
      const stYear = getYearLevelFromClass(st.classe || st.classe_id || '1A');
      const cid = String(this.profSelectedCourseId || 'fmttn-1c').toLowerCase();
      if (cid.includes('1re') || cid.includes('1c')) {
        return stYear === '1re';
      }
      if (cid.includes('3e') || cid.includes('uaa5')) {
        return stYear === '3e';
      }
      return true;
    },

    getActiveProfCourseAccessCode() {
      const cid = this.profSelectedCourseId === 'fmttn-1c' ? 'fmttn-1re' : this.profSelectedCourseId;
      const found = (this.coursesList || []).find(c => c.id === cid);
      return found?.accessCode || courseManagerV2.inferCourseAccessCode({ id: cid });
    },

    /**
     * Détermine si un élève a au moins 1 copie remise ou une activité réelle
     */
    hasStudentRealActivity(st) {
      if (!st) return false;
      if (isGhostOrDemoAccount(st.nom, st.email, st.id, st.xp)) return false;
      if ((Number(st.xp) || 0) > 0) return true;
      if (st.classroom_course_name) return true;
      if (st.eg === '5/5' || st.charte === 'acquis' || st.p2 === 'acquis') return true;
      const normName = normalizeStudentNameTokens(st.nom || '');
      const email = (st.email || '').toLowerCase().trim();
      return (this.teacherSubmissions || []).some(s => {
        if (email && s.email_eleve && s.email_eleve.toLowerCase().trim() === email) return true;
        if (normName && normName !== 'eleve' && s.nom_eleve && normalizeStudentNameTokens(s.nom_eleve) === normName) return true;
        return false;
      });
    },

    /**
     * Classe un élève dans l'une des 3 catégories : 'actifs' | 'inactifs' | 'archives'
     */
    getStudentPeriodBucket(st) {
      if (!st) return 'inactifs';
      const currentYear = getCurrentSchoolYearLabel();
      const isExplicitlyArchived = Boolean(st.archived || st.status === 'archive');
      const isOldYear = Boolean(st.school_year && st.school_year !== currentYear);

      if (isExplicitlyArchived || isOldYear) {
        return 'archives';
      }
      if (this.hasStudentRealActivity(st)) {
        return 'actifs';
      }
      return 'inactifs';
    },

    matchesCurrentStudentPeriodFilter(st) {
      const bucket = this.getStudentPeriodBucket(st);
      if (this.studentPeriodFilter === 'tous') return true;
      if (this.studentPeriodFilter === 'actifs') return bucket === 'actifs';
      if (this.studentPeriodFilter === 'inactifs') return bucket === 'inactifs';
      if (this.studentPeriodFilter === 'archives') {
        if (bucket !== 'archives') return false;
        if (this.studentArchiveYearFilter && this.studentArchiveYearFilter !== 'tous') {
          return (st.school_year || '') === this.studentArchiveYearFilter;
        }
        return true;
      }
      return true;
    },

    getStudentsPeriodCounts() {
      const baseList = this.allClassStudents || [];
      let actifs = 0;
      let inactifs = 0;
      let archives = 0;
      let duplicates = 0;

      for (const st of baseList) {
        const b = this.getStudentPeriodBucket(st);
        if (b === 'actifs') actifs++;
        else if (b === 'inactifs') inactifs++;
        else if (b === 'archives') archives++;
        duplicates += Number(st.duplicateDocsCount || 0);
      }

      return {
        actifs,
        inactifs,
        archives,
        total: baseList.length,
        tous: baseList.length,
        duplicates
      };
    },

    changerClasseEnseignant(newClass) {
      const target = newClass || 'tous';
      this.selectedTeacherClass = target;
      this.submissionFilterClass = target;
      this.submissionsPageLimit = 25;
      if (target !== 'tous' && target !== 'all') {
        this.newStudentData.classe = target;
      }
      this.activerEcouteClasse(target);
      this.chargerElevesReels();
    },

    changerFiltreClasseCopies(newClass) {
      const target = newClass || 'tous';
      this.submissionFilterClass = target;
      this.selectedTeacherClass = target;
      this.submissionsPageLimit = 25;
      this.activerEcouteClasse(target);
      this.chargerElevesReels();
    },

    activerEcouteClasse(classeId) {
      if (this.unsubscribeTeacherListener) {
        this.unsubscribeTeacherListener();
      }

      this.firestoreSynced = false;
      this.unsubscribeTeacherListener = listenToClasseProgressions(classeId, (eleves) => {
        if (eleves) {
          this.classeEleves = eleves;
          this.firestoreSynced = true;
        }
      });
    },

    async chargerElevesReels() {
      const target = (!this.selectedTeacherClass || this.selectedTeacherClass === 'tous') ? 'all' : this.selectedTeacherClass;
      this.allClassStudents = await getRealClassStudents(target);
    },

    async chargerTousLesElevesEcole() {
      try {
        const list = await getRealClassStudents('all');
        this.allSchoolStudents = list;
        for (const st of list) {
          if (st.classe && st.classe !== 'all' && st.classe !== 'tous' && !this.availableClasses.includes(st.classe)) {
            this.availableClasses.push(st.classe);
          }
        }
      } catch (e) {
        console.warn("[chargerTousLesElevesEcole] Erreur :", e);
      }
    },

    getClassCardsSummary() {
      const countByClass = {};
      for (const st of (this.allSchoolStudents || [])) {
        // Ne compter dans les pastilles principales que les élèves correspondant au filtre actif (par défaut : actifs de l'année en cours)
        if (!this.matchesCurrentStudentPeriodFilter(st)) continue;
        const cl = st.classe || '1A';
        countByClass[cl] = (countByClass[cl] || 0) + 1;
      }

      const pendingByClass = {};
      const totalSubsByClass = {};
      for (const sub of (this.teacherSubmissions || [])) {
        const cl = sub.classe_id || sub.classe || '';
        if (!cl) continue;
        totalSubsByClass[cl] = (totalSubsByClass[cl] || 0) + 1;
        if (sub.status === 'a_valider' || sub.status === 'pending') {
          pendingByClass[cl] = (pendingByClass[cl] || 0) + 1;
        }
      }

      const allCodes = new Set([...(this.availableClasses || [])]);
      Object.keys(countByClass).forEach(k => allCodes.add(k));
      Object.keys(totalSubsByClass).forEach(k => allCodes.add(k));
      (this.classMappings || []).forEach(m => { if (m.id) allCodes.add(m.id); });

      const cards = Array.from(allCodes)
        .filter(c => c && c !== 'all' && c !== 'tous')
        .map(c => {
          const map = (this.classMappings || []).find(m => String(m.id).toUpperCase() === String(c).toUpperCase());
          const studentCount = countByClass[c] || 0;
          const pendingCount = pendingByClass[c] || 0;
          const subsCount = totalSubsByClass[c] || 0;
          const isLinked = Boolean(map?.classroom_course_id);
          return {
            id: c,
            studentCount,
            pendingCount,
            subsCount,
            isLinked,
            classroomCourseName: map?.classroom_course_name || '',
            courseId: map?.course_id || 'fmttn-1re'
          };
        });

      // Trier : d'abord les classes liées à Classroom ou contenant des élèves/copies
      return cards.sort((a, b) => {
        const scoreA = (a.isLinked ? 1000 : 0) + (a.studentCount * 10) + a.subsCount;
        const scoreB = (b.isLinked ? 1000 : 0) + (b.studentCount * 10) + b.subsCount;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id.localeCompare(b.id);
      });
    },

    async chargerEquipeEnseignants() {
      this.teachersLoading = true;
      try {
        this.teachersList = await listerEnseignantsCloud();
      } catch (e) {
        console.warn("Erreur chargement équipe :", e);
      } finally {
        this.teachersLoading = false;
      }
    },

    ouvrirModalEnseignant(isEdit = false, teacher = null) {
      this.isEditingTeacher = isEdit;
      if (isEdit && teacher) {
        this.teacherFormData = {
          email: teacher.email,
          nom: teacher.nom || teacher.email.split('@')[0],
          role: teacher.role || 'enseignant',
          classes: Array.isArray(teacher.classes) ? teacher.classes.join(', ') : (teacher.classes || 'all'),
          actif: teacher.actif !== false
        };
      } else {
        this.teacherFormData = {
          email: '',
          nom: '',
          role: 'enseignant',
          classes: 'all',
          actif: true
        };
      }
      this.modalAddTeacherOpen = true;
    },

    fermerModalEnseignant() {
      this.modalAddTeacherOpen = false;
    },

    async enregistrerEnseignantForm() {
      const email = (this.teacherFormData.email || '').trim().toLowerCase();
      if (!email) return;

      const classes = (this.teacherFormData.classes || 'all')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      try {
        await enregistrerEnseignantCloud({
          email,
          nom: (this.teacherFormData.nom || email.split('@')[0]).trim(),
          role: this.teacherFormData.role || 'enseignant',
          classes,
          cours: ["all"],
          actif: this.teacherFormData.actif !== false
        });

        this.fermerModalEnseignant();
        await this.chargerEquipeEnseignants();
      } catch (err) {
        console.error("Erreur enregistrement enseignant :", err);
        alert("Erreur lors de l'enregistrement : " + err.message);
      }
    },

    async basculerStatutEnseignant(teacher, nouveauStatut) {
      try {
        await enregistrerEnseignantCloud({
          email: teacher.email,
          nom: teacher.nom,
          role: teacher.role,
          classes: teacher.classes || ["all"],
          cours: teacher.cours || ["all"],
          actif: nouveauStatut
        });
        await this.chargerEquipeEnseignants();
      } catch (err) {
        console.error("Erreur mise à jour statut enseignant :", err);
        alert("Erreur : " + err.message);
      }
    },

    async supprimerEnseignantModal(email) {
      if (!confirm(`Retirer définitivement ${email} de l'équipe enseignante ?`)) return;

      try {
        await supprimerEnseignantCloud(email);
        await this.chargerEquipeEnseignants();
      } catch (err) {
        console.error("Erreur suppression enseignant :", err);
        alert("Erreur : " + err.message);
      }
    },

    async ajouterEleveManuel() {
      if (!this.newStudentData.nom.trim()) return;

      const targetClasse = (this.newStudentData.classe && this.newStudentData.classe !== 'tous' && this.newStudentData.classe !== 'all')
        ? this.newStudentData.classe
        : '1A';

      const res = await addRealStudent(
        this.newStudentData.nom,
        targetClasse,
        this.newStudentData.email
      );

      if (res.success) {
        this.newStudentData.nom = '';
        this.newStudentData.email = '';
        this.modalAddStudentOpen = false;
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      } else {
        alert(`Erreur lors de l'enregistrement de l'élève : ${res.error}`);
      }
    },

    async changerClasseEleve(studentId, newClass) {
      const ok = await updateStudentClassInDb(studentId, newClass, this.selectedTeacherClass === 'tous' ? '1A' : this.selectedTeacherClass);
      if (ok) {
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      }
    },

    async supprimerEleveModal(student) {
      if (!student) return;
      if (!confirm(`Supprimer définitivement le compte de « ${student.nom} » (${student.classe || '1A'}) ?\nAstuce : vous pouvez aussi cliquer sur 🗄️ Archiver pour simplement le déplacer dans « Années précédentes ».`)) return;
      const ok = await deleteStudentFromClassInDb(student);
      if (ok) {
        if (this.selectedBulletinStudent?.id === student.id) {
          this.modalBulletinEleveOpen = false;
        }
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      }
    },

    async archiverOuRestaurerEleve(student, archive = true) {
      if (!student) return;
      const ok = await archiveOrRestoreStudentInDb(student, archive);
      if (ok) {
        const msg = archive
          ? `🗄️ « ${student.nom} » a été déplacé dans « Années précédentes & Archives ».`
          : `✅ « ${student.nom} » a été restauré dans l'année en cours (${this.getCurrentSchoolYear()}).`;
        this.cleaningStudentsFeedback = msg;
        this.studentCleanStatusMsg = msg;
        setTimeout(() => {
          this.cleaningStudentsFeedback = '';
          this.studentCleanStatusMsg = '';
        }, 5000);
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      }
    },

    async nettoyerDoublonsEtAnciensEleves() {
      this.cleaningStudentsLoading = true;
      this.cleaningStudentsInProgress = true;
      const waitMsg = '⏳ Fusion des doublons, suppression des comptes fantômes ("Élève") et archivage des anciens comptes...';
      this.cleaningStudentsFeedback = waitMsg;
      this.studentCleanStatusMsg = waitMsg;
      try {
        const res = await cleanDuplicatesAndArchiveOldStudentsInDb();
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
        const doneMsg = `✨ Base assainie : ${res.duplicatesMerged} doublon(s) fusionné(s), ${res.ghostsDeleted} compte(s) fantôme(s) supprimé(s), et ${res.oldArchived} compte(s) inactif(s)/ancien(s) rangé(s) !`;
        this.cleaningStudentsFeedback = doneMsg;
        this.studentCleanStatusMsg = doneMsg;
      } catch (err) {
        alert("Erreur lors du nettoyage des élèves : " + err.message);
        this.cleaningStudentsFeedback = '';
        this.studentCleanStatusMsg = '';
      } finally {
        this.cleaningStudentsLoading = false;
        this.cleaningStudentsInProgress = false;
      }
    },

    getElevesFiltresGestion() {
      const q = this.searchStudentQuery.toLowerCase().trim();
      const baseList = (this.allClassStudents || []).filter(
        s => !isGhostOrDemoAccount(s.nom, s.email, s.id, s.xp) && this.matchesCurrentStudentPeriodFilter(s)
      );
      if (!q) return baseList;
      return baseList.filter(s => 
        (s.nom || '').toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.classe && s.classe.toLowerCase().includes(q))
      );
    },

    getFilteredClasseEleves() {
      const list = this.classeEleves || [];
      return list.filter(
        el => !isGhostOrDemoAccount(el.nom, el.email, el.id, el.xp) &&
              this.doesStudentMatchSelectedProfCourseLevel(el) &&
              this.matchesCurrentStudentPeriodFilter(el)
      );
    },

    getProgressionMoyenneClasse() {
      const list = this.getFilteredClasseEleves();
      if (!list.length) return 0;
      const total = list.reduce((acc, el) => acc + (el.score || 0), 0);
      return Math.round(total / list.length);
    },

    getNbElevesTermineEG() {
      const list = this.getFilteredClasseEleves();
      return list.filter(el => el.eg === "5/5").length;
    },

    genererRemediationProf() {
      this.remediationGenerated = true;
    },

    activerEcouteSubmissions() {
      if (this.unsubscribeSubmissionsListener) {
        this.unsubscribeSubmissionsListener();
      }
      this.unsubscribeSubmissionsListener = listenToTeacherSubmissions((subs) => {
        this.teacherSubmissions = subs;
        console.log(`[Prof] ${subs.length} soumissions synchronisées en temps réel.`);
      });
    },

    getFilteredSubmissions() {
      const filtered = this.teacherSubmissions.filter(sub => {
        if (this.submissionFilterStatus !== 'tous') {
          if (this.submissionFilterStatus === 'a_valider') {
            if (sub.status !== 'a_valider' && sub.status !== 'pending') return false;
          } else if (sub.status !== this.submissionFilterStatus) {
            return false;
          }
        }

        if (this.submissionFilterClass !== 'tous' && this.submissionFilterClass !== 'all') {
          const subClass = sub.classe_id || sub.classe || '';
          if (subClass !== this.submissionFilterClass) return false;
        }

        if (this.submissionFilterCourse !== 'tous') {
          const subCourse = sub.course_id || sub.id_course || 'js-uaa5-classic';
          if (subCourse !== this.submissionFilterCourse) return false;
        }

        if (this.submissionSearchText.trim()) {
          const q = this.submissionSearchText.toLowerCase();
          const nom = (sub.nom_eleve || '').toLowerCase();
          const email = (sub.email_eleve || '').toLowerCase();
          const titre = (sub.titre_exercice || '').toLowerCase();
          if (!nom.includes(q) && !email.includes(q) && !titre.includes(q)) return false;
        }

        return true;
      });

      if (!this.deduplicateSpeedGrader) {
        return filtered;
      }

      // Déduplication intelligente : 1 seule copie par couple (élève, exercice)
      const groups = new Map();
      for (const sub of filtered) {
        const studentKey = (sub.email_eleve || sub.uid_eleve || sub.nom_eleve || 'anonyme').toLowerCase().trim();
        const exKey = (sub.id_exercice || sub.titre_exercice || 'exo').toLowerCase().trim();
        const key = `${studentKey}::${exKey}`;
        if (!groups.has(key)) {
          groups.set(key, { best: sub, count: 1 });
        } else {
          const entry = groups.get(key);
          entry.count += 1;
          if (sub.status === 'valide' && entry.best.status !== 'valide') {
            entry.best = sub;
          }
        }
      }

      return Array.from(groups.values()).map(entry => ({
        ...entry.best,
        _duplicateCount: entry.count
      }));
    },

    getPaginatedSubmissions() {
      const list = this.getFilteredSubmissions();
      return list.slice(0, this.submissionsPageLimit || 25);
    },

    getPendingSubmissionsCount() {
      const list = this.deduplicateSpeedGrader ? this.getFilteredSubmissions() : this.teacherSubmissions;
      return list.filter(s => s.status === 'a_valider' || s.status === 'pending').length;
    },

    // ==========================================
    // CONSOLE ANTI-SPAM, DÉDUPLICATION & AVERTISSEMENT ÉLÈVE
    // ==========================================
    calculerXpLegitimeEleve(eleve, duplicateSubmissionsCount = 0) {
      if (!eleve) return 0;
      const rewarded = Array.isArray(eleve.rewarded_activities) ? eleve.rewarded_activities : [];
      if (rewarded.length > 0) {
        return Math.min(rewarded.length * 20, 650);
      }
      const compCount = Object.values(eleve.competences || {}).filter(v => v === 'acquis').length;
      const egFolders = parseInt(String(eleve.eg || '1/5').split('/')[0], 10) || 1;
      const validSubs = new Set(
        this.teacherSubmissions
          .filter(s => {
            const matchEmail = eleve.email && s.email_eleve && s.email_eleve.toLowerCase() === eleve.email.toLowerCase();
            const matchNom = eleve.nom && s.nom_eleve && s.nom_eleve.toLowerCase() === eleve.nom.toLowerCase();
            return (matchEmail || matchNom) && (s.status === 'valide' || Number(s.note_suggeree || 0) >= 60);
          })
          .map(s => s.id_exercice || s.titre_exercice)
      ).size;

      const estimated = (compCount * 15) + (Math.max(0, egFolders - 1) * 25) + (validSubs * 30);
      return Math.max(20, Math.min(estimated || 50, 600));
    },

    getDuplicateSubmissionsStats() {
      const pairCounts = new Map();
      const studentStats = new Map();

      for (const sub of this.teacherSubmissions) {
        const email = (sub.email_eleve || '').toLowerCase().trim();
        const nom = (sub.nom_eleve || 'Élève').trim();
        const classe = (sub.classe_id || sub.classe || (this.selectedTeacherClass !== 'tous' ? this.selectedTeacherClass : '1A')).trim();
        const studentKey = email || (sub.uid_eleve || nom).toLowerCase().trim();
        const exKey = (sub.id_exercice || sub.titre_exercice || 'exo').toLowerCase().trim();
        const pairKey = `${studentKey}::${exKey}`;

        pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);

        if (!studentStats.has(studentKey)) {
          studentStats.set(studentKey, {
            studentKey,
            nom,
            email,
            classe,
            totalSubmissions: 0,
            uniqueExercises: new Set(),
            duplicateSubmissions: 0
          });
        }
        const st = studentStats.get(studentKey);
        st.totalSubmissions += 1;
        if (st.uniqueExercises.has(exKey)) {
          st.duplicateSubmissions += 1;
        } else {
          st.uniqueExercises.add(exKey);
        }
      }

      let duplicateCount = 0;
      for (const count of pairCounts.values()) {
        if (count > 1) duplicateCount += (count - 1);
      }

      // Ne signaler dans la liste d'anomalies que les vrais abus (≥ 4 doublons ou XP très gonflé ou avertissement actif)
      const spammersMap = new Map();

      for (const [key, st] of studentStats.entries()) {
        if (st.duplicateSubmissions >= 4) {
          const matchingEleve = (this.classeEleves || []).find(
            e => (e.email && e.email.toLowerCase() === st.email) || (e.nom && e.nom.toLowerCase() === st.nom.toLowerCase())
          );
          const currentXp = matchingEleve ? (matchingEleve.xp || 0) : 0;
          const legitXp = matchingEleve ? this.calculerXpLegitimeEleve(matchingEleve, st.duplicateSubmissions) : 50;
          spammersMap.set(key, {
            ...st,
            docKey: matchingEleve?.docKey || st.email || st.nom,
            classe: matchingEleve?.classe || st.classe || '1A',
            currentXp,
            legitXp,
            spamAttempts: matchingEleve?.spam_attempts || st.duplicateSubmissions,
            spamWarning: matchingEleve?.spam_warning || null,
            reason: `${st.duplicateSubmissions} copies en doublon (${st.totalSubmissions} envois pour ${st.uniqueExercises.size} exo)`
          });
        }
      }

      for (const el of (this.classeEleves || [])) {
        const key = (el.email || el.docKey || el.nom || '').toLowerCase().trim();
        if (!key) continue;
        const legitXp = this.calculerXpLegitimeEleve(el, 0);
        const currentXp = Number(el.xp || 0);
        const isXpInflated = currentXp > legitXp + 250 || currentXp >= 850;
        const hasSpamAttempts = Number(el.spam_attempts || 0) >= 4;
        const hasActiveWarning = Boolean(el.spam_warning?.active);

        if ((isXpInflated || hasSpamAttempts || hasActiveWarning) && !spammersMap.has(key)) {
          spammersMap.set(key, {
            studentKey: key,
            docKey: el.docKey || el.email || el.nom,
            nom: el.nom || 'Élève',
            email: el.email || '',
            classe: el.classe || '1A',
            totalSubmissions: 0,
            duplicateSubmissions: Number(el.spam_attempts || 0),
            currentXp,
            legitXp,
            spamAttempts: Number(el.spam_attempts || 0),
            spamWarning: el.spam_warning || null,
            reason: isXpInflated
              ? `XP élevé (${currentXp} XP vs ~${legitXp} XP estimés)`
              : `${el.spam_attempts || 0} envois répétés détectés`
          });
        }
      }

      const spammersList = Array.from(spammersMap.values()).sort(
        (a, b) => (b.duplicateSubmissions * 20 + b.currentXp) - (a.duplicateSubmissions * 20 + a.currentXp)
      );

      return {
        totalSubmissions: this.teacherSubmissions.length,
        uniqueCount: this.teacherSubmissions.length - duplicateCount,
        duplicateCount,
        spammersList
      };
    },

    async nettoyerDoublonsSubmissions() {
      const stats = this.getDuplicateSubmissionsStats();
      if (stats.duplicateCount === 0) {
        this.antiSpamFeedbackMsg = '✅ Aucun doublon à supprimer : la boîte de correction est déjà propre !';
        return;
      }

      this.antiSpamCleaning = true;
      this.antiSpamFeedbackMsg = `⏳ Suppression de ${stats.duplicateCount} copie(s) en doublon en cours...`;
      try {
        const res = await purgerDoublonsSubmissionsFirestore(this.teacherSubmissions);
        this.antiSpamFeedbackMsg = `🧹 Nettoyage terminé : ${res.deletedCount} copie(s) en doublon supprimée(s) définitivement de Firestore !`;
      } catch (err) {
        console.error('[AntiSpam] Erreur purge doublons :', err);
        alert('Erreur lors de la purge des doublons : ' + err.message);
      } finally {
        this.antiSpamCleaning = false;
      }
    },

    async recalculerXpEtAvertirEleve(spammer, { resetToZero = false, sendWarning = true } = {}) {
      if (!spammer) return;
      const newXp = resetToZero ? 0 : Number(spammer.legitXp || 50);
      this.antiSpamCleaning = true;
      try {
        await appliquerSanctionEtAvertissementEleve({
          classeId: spammer.classe || this.selectedTeacherClass || '1A',
          studentDocKey: spammer.docKey || spammer.email || spammer.nom,
          nom: spammer.nom,
          email: spammer.email,
          newXp,
          warningMessage: sendWarning ? this.customWarningMessage : '',
          duplicatesRemoved: spammer.duplicateSubmissions || 0
        });
        this.antiSpamFeedbackMsg = `⚖️ ${spammer.nom} : XP ajusté à ${newXp} XP ${sendWarning ? '+ Avertissement bloquant envoyé sur son écran' : ''}.`;
      } catch (err) {
        console.error('[AntiSpam] Erreur sanction élève :', err);
        alert('Erreur lors de la sanction : ' + err.message);
      } finally {
        this.antiSpamCleaning = false;
      }
    },

    async assainirClasseAntiSpam1Clic() {
      const stats = this.getDuplicateSubmissionsStats();
      this.antiSpamCleaning = true;
      this.antiSpamFeedbackMsg = '⏳ Assainissement complet en cours (Purge des doublons + Recalcul XP + Avertissements)...';
      try {
        let deleted = 0;
        if (stats.duplicateCount > 0) {
          const res = await purgerDoublonsSubmissionsFirestore(this.teacherSubmissions);
          deleted = res.deletedCount;
        }
        let warned = 0;
        for (const spammer of stats.spammersList) {
          await appliquerSanctionEtAvertissementEleve({
            classeId: spammer.classe || this.selectedTeacherClass || '1A',
            studentDocKey: spammer.docKey || spammer.email || spammer.nom,
            nom: spammer.nom,
            email: spammer.email,
            newXp: Number(spammer.legitXp || 50),
            warningMessage: this.customWarningMessage,
            duplicatesRemoved: spammer.duplicateSubmissions || 0
          });
          warned += 1;
        }
        this.antiSpamFeedbackMsg = `✅ Assainissement réussi : ${deleted} doublon(s) supprimé(s), ${warned} élève(s) recalculé(s) et averti(s) !`;
      } catch (err) {
        console.error('[AntiSpam] Erreur assainissement global :', err);
        alert('Erreur : ' + err.message);
      } finally {
        this.antiSpamCleaning = false;
      }
    },

    // ==========================================
    // PHASE 11 : SPEEDGRADER & RACCOURCIS CLAVIER (J / K / Ctrl+Entrée)
    // ==========================================
    ouvrirModalCorrection(sub) {
      if (!sub) return;
      this.selectedSubmission = sub;
      this.gradingNote = sub.note_suggeree !== undefined && sub.note_suggeree !== null ? sub.note_suggeree : 80;
      this.gradingProfMessage = sub.prof_message || '';
      this.gradingFeedbackSuccess = '';
      this.speedGraderViewTab = 'preview';
      this.modalCorrectionOpen = true;
    },

    getSpeedGraderCurrentIndex() {
      const list = this.getFilteredSubmissions();
      if (!this.selectedSubmission || !list.length) return -1;
      return list.findIndex(s => s.id === this.selectedSubmission.id);
    },

    speedGraderSuivant() {
      const list = this.getFilteredSubmissions();
      if (!list.length) return;
      const idx = this.getSpeedGraderCurrentIndex();
      if (idx !== -1 && idx < list.length - 1) {
        this.ouvrirModalCorrection(list[idx + 1]);
      } else if (list.length > 0) {
        this.ouvrirModalCorrection(list[0]);
      }
    },

    speedGraderPrecedent() {
      const list = this.getFilteredSubmissions();
      if (!list.length) return;
      const idx = this.getSpeedGraderCurrentIndex();
      if (idx > 0) {
        this.ouvrirModalCorrection(list[idx - 1]);
      } else if (list.length > 0) {
        this.ouvrirModalCorrection(list[list.length - 1]);
      }
    },

    handleSpeedGraderKeydown(event) {
      if (!this.modalCorrectionOpen) return;
      const tag = (event.target?.tagName || '').toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+Entrée ou Cmd+Entrée : Valider et passer au suivant (fonctionne même dans un champ texte)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        this.validerCorrection('valide', true);
        return;
      }

      if (isInput) return;

      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowRight') {
        event.preventDefault();
        this.speedGraderSuivant();
      } else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowLeft') {
        event.preventDefault();
        this.speedGraderPrecedent();
      }
    },

    /**
     * Extrait une URL d'aperçu `/preview` pour Google Docs / Drive / Slides / Sheets
     */
    getSpeedGraderGooglePreviewUrl(sub) {
      const raw = String(sub?.code_eleve || '');
      const urlMatch = raw.match(/https?:\/\/[^\s\n\r"']+/);
      if (!urlMatch) return null;
      const url = urlMatch[0];

      if (url.includes('docs.google.com/') || url.includes('drive.google.com/')) {
        return url
          .replace(/\/edit(\?.*)?$/, '/preview')
          .replace(/\/view(\?.*)?$/, '/preview');
      }
      return null;
    },

    /**
     * Génère le rendu HTML exécuté pour une copie de type code dans SpeedGrader
     */
    getSpeedGraderCodeSrcDoc(sub) {
      const raw = String(sub?.code_eleve || '');
      if (!raw) return '';

      const htmlMatch = raw.match(/HTML:\n([\s\S]*?)(?=\n\nCSS:|$)/);
      const cssMatch = raw.match(/CSS:\n([\s\S]*?)(?=\n\nJS:|$)/);
      const jsMatch = raw.match(/JS:\n([\s\S]*)$/);

      if (htmlMatch || cssMatch || jsMatch) {
        const h = htmlMatch ? htmlMatch[1] : '';
        const c = cssMatch ? cssMatch[1] : '';
        const j = jsMatch ? jsMatch[1] : '';
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${c}</style></head><body>${h}<script>try{${j}}catch(e){console.error(e)}<\/script></body></html>`;
      }

      if (raw.includes('<') && raw.includes('>')) {
        return raw;
      }
      return '';
    },

    async validerCorrection(nouveauStatut, moveNext = false) {
      if (!this.selectedSubmission) return;
      this.gradingLoading = true;
      try {
        await updateTeacherSubmission(this.selectedSubmission.id, {
          status: nouveauStatut,
          note: Number(this.gradingNote),
          profMessage: this.gradingProfMessage
        });
        this.selectedSubmission.status = nouveauStatut;
        this.selectedSubmission.note_suggeree = Number(this.gradingNote);
        this.selectedSubmission.prof_message = this.gradingProfMessage;
        this.gradingFeedbackSuccess = `✅ Statut mis à jour : "${nouveauStatut}" (${this.gradingNote}/100) !`;

        if (nouveauStatut === 'valide' && typeof this.autoSyncGradeIfEnabled === 'function') {
          try {
            const autoSynced = await this.autoSyncGradeIfEnabled(this.selectedSubmission, Number(this.gradingNote));
            if (autoSynced) {
              this.gradingFeedbackSuccess += ' 📤 Note renvoyée automatiquement sur Classroom !';
            }
          } catch (syncErr) {
            console.warn("[Phase 9 AutoSync] Note non renvoyée automatiquement :", syncErr.message);
          }
        }

        if (moveNext) {
          setTimeout(() => {
            this.speedGraderSuivant();
          }, 350);
        } else {
          setTimeout(() => {
            this.modalCorrectionOpen = false;
          }, 900);
        }
      } catch (err) {
        alert("Erreur lors de la mise à jour : " + err.message);
      } finally {
        this.gradingLoading = false;
      }
    },

    // ==========================================
    // PHASE 11 : VALIDATION PAR LOT (BATCH)
    // ==========================================
    getBatchEligibleSubmissions() {
      return this.getFilteredSubmissions().filter(sub => {
        const isPending = sub.status === 'a_valider' || sub.status === 'pending';
        const scoreOk = Number(sub.note_suggeree || 0) >= 80;
        const noErrors = !Array.isArray(sub.erreurs_detectees) || sub.erreurs_detectees.length === 0;
        return isPending && scoreOk && noErrors;
      });
    },

    async validerLotCopiesEligibles() {
      const eligible = this.getBatchEligibleSubmissions();
      if (!eligible.length) {
        alert("Aucune copie en attente ne remplit tous les critères automatiques (note IA ≥ 80% et 0 erreur détectée).");
        return;
      }

      if (!confirm(`Valider par lot ${eligible.length} copie(s) ayant rempli tous les critères de réussite (note IA ≥ 80/100 et aucune erreur) ?`)) {
        return;
      }

      this.batchValidating = true;
      this.batchFeedbackMsg = '';
      let validatedCount = 0;

      try {
        for (const sub of eligible) {
          const finalNote = Number(sub.note_suggeree) || 85;
          await updateTeacherSubmission(sub.id, {
            status: 'valide',
            note: finalNote,
            profMessage: sub.prof_message || 'Travail validé — Tous les critères de réussite sont remplis, bravo !'
          });
          sub.status = 'valide';
          validatedCount++;

          if (typeof this.autoSyncGradeIfEnabled === 'function') {
            try {
              await this.autoSyncGradeIfEnabled(sub, finalNote);
            } catch (_) {}
          }
        }
        this.batchFeedbackMsg = `🎉 ${validatedCount} copie(s) validée(s) par lot avec succès !`;
        setTimeout(() => { this.batchFeedbackMsg = ''; }, 5000);
      } catch (err) {
        alert("Erreur lors de la validation par lot : " + err.message);
      } finally {
        this.batchValidating = false;
      }
    },

    // ==========================================
    // PHASE 11 : VUE CLASSE EN DIRECT & SIGNAL « BLOQUÉ » (⚪ 🔵 🟠 🟣 🟢)
    // ==========================================
    getLiveClassStatusList() {
      const mergedMap = new Map();
      const nameToKey = new Map();

      const resolveKey = (item) => {
        const email = (item.email || '').toLowerCase().trim();
        const cl = (item.classe || item.classe_id || '1A').toUpperCase().trim();
        const normName = normalizeStudentNameTokens(item.nom || '');
        const nameKey = normName && normName !== 'eleve' ? normName : '';

        if (email && mergedMap.has(email)) return email;
        if (nameKey && nameToKey.has(nameKey)) {
          const prevKey = nameToKey.get(nameKey);
          if (email && prevKey !== email && mergedMap.has(prevKey)) {
            const prevVal = mergedMap.get(prevKey);
            mergedMap.delete(prevKey);
            mergedMap.set(email, prevVal);
            nameToKey.set(nameKey, email);
            return email;
          }
          return prevKey;
        }
        const chosen = email || nameKey || `${cl}::${(item.id || item.nom || '').toLowerCase()}`;
        if (nameKey) nameToKey.set(nameKey, chosen);
        return chosen;
      };

      (this.allClassStudents || []).forEach(st => {
        if (isGhostOrDemoAccount(st.nom, st.email, st.id, st.xp)) return;
        const key = resolveKey(st);
        const existing = mergedMap.get(key) || {};
        const bestClasse = resolveBestStudentClass(existing.classe, st.classe, Boolean(existing.classroom_course_name), Boolean(st.classroom_course_name));
        mergedMap.set(key, {
          ...existing,
          ...st,
          id: st.id || existing.id,
          nom: (st.nom && st.nom !== 'Élève') ? st.nom : (existing.nom || st.nom),
          classe: bestClasse,
          classe_id: bestClasse,
          email: st.email || existing.email || '',
          xp: Math.max(st.xp || 0, existing.xp || 0),
          score: Math.max(st.progression?.score || 50, existing.score || 50),
          tutor_calls_count: Math.max(Number(st.progression?.tutor_calls_count) || 0, existing.tutor_calls_count || 0),
          hints_used_count: Math.max(Number(st.progression?.hints_used_count) || 0, existing.hints_used_count || 0),
          updated_at: st.progression?.updated_at || st.lastActiveIso || existing.updated_at || null
        });
      });

      (this.classeEleves || []).forEach(ce => {
        if (isGhostOrDemoAccount(ce.nom, ce.email, ce.id, ce.xp)) return;
        const key = resolveKey(ce);
        const existing = mergedMap.get(key) || {};
        const bestClasse = resolveBestStudentClass(existing.classe, ce.classe, Boolean(existing.classroom_course_name), false);
        mergedMap.set(key, {
          ...existing,
          ...ce,
          id: ce.id || existing.id,
          userDocIds: existing.userDocIds || [],
          progDocKeys: Array.from(new Set([...(existing.progDocKeys || []), ...(ce.progDocKeys || [ce.docKey].filter(Boolean))])),
          nom: (ce.nom && ce.nom !== 'Élève') ? ce.nom : (existing.nom || ce.nom),
          classe: bestClasse,
          classe_id: bestClasse,
          email: ce.email || existing.email || '',
          xp: Math.max(ce.xp || 0, existing.xp || 0),
          score: Math.max(ce.score || 50, existing.score || 50),
          archived: Boolean(existing.archived || ce.archived),
          status: existing.status === 'archive' || ce.status === 'archive' ? 'archive' : (existing.status || ce.status || 'actif'),
          school_year: existing.school_year || ce.school_year,
          bulletin_appreciation: existing.bulletin_appreciation || ce.bulletin_appreciation || '',
          bulletin_custom_note20: existing.bulletin_custom_note20 ?? ce.bulletin_custom_note20 ?? null,
          tutor_calls_count: Math.max(Number(ce.tutor_calls_count) || 0, existing.tutor_calls_count || 0),
          hints_used_count: Math.max(Number(ce.hints_used_count) || 0, existing.hints_used_count || 0),
          updated_at: ce.updated_at || existing.updated_at || null
        });
      });

      const students = Array.from(mergedMap.values()).filter(
        el => !isGhostOrDemoAccount(el.nom, el.email, el.id, el.xp) &&
              this.doesStudentMatchSelectedProfCourseLevel(el) &&
              this.matchesCurrentStudentPeriodFilter(el)
      );
      const now = Date.now();

      return students.map(el => {
        const normElName = normalizeStudentNameTokens(el.nom || '');
        // Chercher les soumissions de cet élève (sans jamais matcher un nom générique "eleve")
        const subs = (this.teacherSubmissions || []).filter(s => {
          const sameEmail = el.email && s.email_eleve && s.email_eleve.toLowerCase().trim() === el.email.toLowerCase().trim();
          const sameName = normElName && normElName !== 'eleve' && s.nom_eleve && normalizeStudentNameTokens(s.nom_eleve) === normElName;
          return sameEmail || sameName;
        });

        const hasValidated = subs.some(s => s.status === 'valide' || s.status === 'validee');
        const hasPending = subs.some(s => s.status === 'a_valider' || s.status === 'pending');

        const tutorCalls = Number(el.tutor_calls_count) || 0;
        const hintsUsed = Number(el.hints_used_count) || 0;

        // Signal « Bloqué » (Phase 11) : au moins 2 indices ou 3 appels au tuteur sans soumission
        const isStuck = !hasValidated && !hasPending && (hintsUsed >= 2 || tutorCalls >= 3);

        const lastActiveMs = el.updated_at ? (now - new Date(el.updated_at).getTime()) : Infinity;
        const isActive = lastActiveMs < 45 * 60 * 1000 || (el.xp || 0) > 0;

        let badge = '⚪';
        let label = 'Non démarré';
        let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
        let priority = 5;

        if (isStuck) {
          badge = '🟠';
          label = `Bloqué (${tutorCalls} appels IA / ${hintsUsed} indices)`;
          colorClass = 'bg-orange-100 text-orange-900 border-orange-300 font-black animate-pulse';
          priority = 1;
        } else if (hasPending) {
          badge = '🟣';
          label = 'Soumis (À valider)';
          colorClass = 'bg-purple-100 text-purple-800 border-purple-200 font-extrabold';
          priority = 2;
        } else if (isActive && !hasValidated) {
          badge = '🔵';
          label = 'En activité';
          colorClass = 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
          priority = 3;
        } else if (hasValidated) {
          badge = '🟢';
          label = 'Validé';
          colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
          priority = 4;
        }

        const avgNote = subs.length > 0
          ? Math.round(subs.reduce((acc, s) => acc + (Number(s.note_suggeree) || 75), 0) / subs.length)
          : (el.score || 0);
        const avgNote20 = Math.round((avgNote / 5) * 2) / 2;

        return {
          ...el,
          badge,
          statusLabel: label,
          colorClass,
          priority,
          isStuck,
          subsCount: subs.length,
          avgNote,
          avgNote20,
          mastery: this.getMasteryLevelFromScore(avgNote)
        };
      }).sort((a, b) => a.priority - b.priority || (a.nom || '').localeCompare(b.nom || ''));
    },

    // ==========================================
    // 📋 BULLETIN SCOLAIRE INDIVIDUEL PAR ÉLÈVE
    // ==========================================
    ouvrirBulletinEleve(student) {
      if (!student) return;
      this.selectedBulletinStudent = student;
      const report = this.getBulletinDataForStudent(student);
      const initialAppreciation = student.bulletin_appreciation || report.autoAppreciation;
      this.bulletinAppreciationDraft = initialAppreciation;
      this.bulletinAppreciationText = initialAppreciation;
      this.bulletinCustomNote20 = student.bulletin_custom_note20 !== null && student.bulletin_custom_note20 !== undefined
        ? String(student.bulletin_custom_note20)
        : '';
      this.bulletinSaveFeedback = '';
      this.bulletinSaveMsg = '';
      this.modalBulletinEleveOpen = true;
    },

    fermerBulletinEleve() {
      this.modalBulletinEleveOpen = false;
    },

    bulletinEleveSuivant() {
      const list = this.getLiveClassStatusList();
      if (!list.length || !this.selectedBulletinStudent) return;
      const normCurr = normalizeStudentNameTokens(this.selectedBulletinStudent.nom || '');
      const idx = list.findIndex(s =>
        (s.email && this.selectedBulletinStudent.email && s.email === this.selectedBulletinStudent.email) ||
        normalizeStudentNameTokens(s.nom || '') === normCurr
      );
      const nextIdx = (idx !== -1 && idx < list.length - 1) ? idx + 1 : 0;
      this.ouvrirBulletinEleve(list[nextIdx]);
    },

    bulletinElevePrecedent() {
      const list = this.getLiveClassStatusList();
      if (!list.length || !this.selectedBulletinStudent) return;
      const normCurr = normalizeStudentNameTokens(this.selectedBulletinStudent.nom || '');
      const idx = list.findIndex(s =>
        (s.email && this.selectedBulletinStudent.email && s.email === this.selectedBulletinStudent.email) ||
        normalizeStudentNameTokens(s.nom || '') === normCurr
      );
      const prevIdx = idx > 0 ? idx - 1 : list.length - 1;
      this.ouvrirBulletinEleve(list[prevIdx]);
    },

    getBulletinDataForStudent(student) {
      const st = student || this.selectedBulletinStudent;
      if (!st) {
        const emptyMastery = this.getMasteryLevelFromScore(0);
        return {
          nom: 'Élève',
          classe: '1A',
          email: '',
          schoolYear: this.getCurrentSchoolYear(),
          anneeScolaire: this.getCurrentSchoolYear(),
          bucket: 'actifs',
          moyenne100: 0,
          avgScore100: 0,
          moyenne20: null,
          avgNote20: null,
          mastery: emptyMastery,
          niveauMaitrise: emptyMastery,
          xp: 0,
          legitXp: 0,
          autonomyPct: 100,
          autonomy: 100,
          tutorCalls: 0,
          hintsUsed: 0,
          submissions: [],
          travaux: [],
          totalTravaux: 0,
          validatedCount: 0,
          pendingCount: 0,
          fmttnItems: [],
          competencesFmttn: [],
          coursesBreakdown: [],
          autoAppreciation: ''
        };
      }

      const normName = normalizeStudentNameTokens(st.nom || '');
      const email = (st.email || '').toLowerCase().trim();

      // Fusionner avec la fiche temps réel de classeEleves si disponible
      const liveProg = (this.classeEleves || []).find(ce =>
        (email && ce.email && ce.email.toLowerCase().trim() === email) ||
        (normName && normName !== 'eleve' && normalizeStudentNameTokens(ce.nom || '') === normName)
      ) || st.progression || {};

      // Récupérer et dédupliquer les soumissions de l'élève
      const rawSubs = (this.teacherSubmissions || []).filter(s => {
        if (email && s.email_eleve && s.email_eleve.toLowerCase().trim() === email) return true;
        if (normName && normName !== 'eleve' && s.nom_eleve && normalizeStudentNameTokens(s.nom_eleve) === normName) return true;
        return false;
      });

      const subMap = new Map();
      for (const s of rawSubs) {
        const exKey = `${s.course_id || s.id_course || 'cours'}::${(s.id_exercice || s.titre_exercice || s.id).toLowerCase()}`;
        if (!subMap.has(exKey) || (s.status === 'valide' && subMap.get(exKey).status !== 'valide')) {
          subMap.set(exKey, {
            ...s,
            exercice_title: s.titre_exercice || s.exercice_title || s.id_exercice || 'Activité',
            exercice_id: s.id_exercice || s.exercice_id || s.id
          });
        }
      }
      const uniqueSubs = Array.from(subMap.values()).sort(
        (a, b) => new Date(b.date_soumission || 0) - new Date(a.date_soumission || 0)
      );

      const validatedCount = uniqueSubs.filter(s => s.status === 'valide' || s.status === 'validee').length;
      const pendingCount = uniqueSubs.filter(s => s.status === 'a_valider' || s.status === 'pending').length;

      // Calcul de la moyenne globale (/100 et /20)
      const fmttnScore = Number(liveProg.score || st.score || 0);
      let moyenne100 = fmttnScore || 50;
      if (uniqueSubs.length > 0) {
        const avgSubs = Math.round(uniqueSubs.reduce((acc, s) => acc + (Number(s.note_suggeree) || 75), 0) / uniqueSubs.length);
        moyenne100 = fmttnScore > 50 ? Math.round((avgSubs * 0.65) + (fmttnScore * 0.35)) : avgSubs;
      }

      const custom20 = st.bulletin_custom_note20 !== null && st.bulletin_custom_note20 !== undefined && st.bulletin_custom_note20 !== ''
        ? Number(st.bulletin_custom_note20)
        : null;
      const moyenne20 = custom20 !== null && !isNaN(custom20)
        ? custom20
        : Math.round((moyenne100 / 5) * 2) / 2;

      if (custom20 !== null && !isNaN(custom20)) {
        moyenne100 = Math.round(custom20 * 5);
      }

      const mastery = this.getMasteryLevelFromScore(moyenne100);

      // Synthèse des compétences FMTTN
      const eg = liveProg.eg || (liveProg.escape_game?.finished ? '5/5' : `${liveProg.escape_game?.dossierUnlocked?.length || 1}/5`);
      const charte = liveProg.charte || (liveProg.charte_obj?.finished ? 'acquis' : 'en_cours');
      const p2 = liveProg.p2 || liveProg.competences?.['NUM-1.P2'] || 'en_cours';
      const d5 = liveProg.d5 || liveProg.competences?.['NUM-1.D5'] || 'en_cours';
      const num2_d3 = liveProg.num2_d3 || liveProg.competences?.['NUM-2.D3'] || 'en_cours';
      const num2_d4 = liveProg.num2_d4 || liveProg.competences?.['NUM-2.D4'] || 'en_cours';
      const num2_m1 = liveProg.num2_m1 || liveProg.competences?.['NUM-2.M1'] || 'en_cours';

      const fmttnItems = [
        { code: 'MOD-0', label: 'Charte & Sécurité du poste (M0)', status: charte },
        { code: 'INV-EG', label: `Investigation Escape Game (${eg})`, status: eg === '5/5' ? 'acquis' : 'en_cours' },
        { code: 'NUM-1.D5', label: 'Anatomie Courriel & Nétiquette', status: d5 },
        { code: 'NUM-1.P2', label: 'Simulateur E-mail & Cci / RGPD', status: p2 },
        { code: 'NUM-2.D3', label: 'Protocole HTTPS & Cadenas TLS', status: num2_d3 },
        { code: 'NUM-2.D4', label: 'Traces Actives vs Passives', status: num2_d4 },
        { code: 'NUM-2.M1', label: 'Campagne Stop Cyberharcèlement', status: num2_m1 }
      ];

      // Répartition par cours pour les travaux remis
      const byCourseMap = new Map();
      for (const s of uniqueSubs) {
        const cid = s.course_id || s.id_course || 'bureautique-3e';
        const cObj = (this.coursesList || []).find(c => c.id === cid);
        const cTitle = cObj?.title || cid;
        if (!byCourseMap.has(cid)) {
          byCourseMap.set(cid, { id: cid, title: cTitle, count: 0, totalScore: 0 });
        }
        const entry = byCourseMap.get(cid);
        entry.count++;
        entry.totalScore += (Number(s.note_suggeree) || 75);
      }
      const coursesBreakdown = Array.from(byCourseMap.values()).map(c => {
        const avg = Math.round(c.totalScore / c.count);
        return {
          ...c,
          avg100: avg,
          avg20: Math.round((avg / 5) * 2) / 2
        };
      });

      const tutorCalls = Number(liveProg.tutor_calls_count ?? st.tutor_calls_count ?? 0);
      const hintsUsed = Number(liveProg.hints_used_count ?? st.hints_used_count ?? 0);
      const totalHelps = tutorCalls + hintsUsed;
      const autonomyPct = totalHelps === 0 ? 100 : (totalHelps <= 2 ? 85 : (totalHelps <= 5 ? 70 : 55));

      const xp = Math.max(Number(st.xp) || 0, Number(liveProg.xp) || 0);
      const legitXp = this.calculerXpLegitimeEleve({ ...st, ...liveProg });

      // Appréciation automatique personnalisée pour le bulletin
      const strengths = [];
      const improvements = [];
      if (charte === 'acquis') strengths.push("la charte informatique");
      if (eg === '5/5') strengths.push("l'investigation Escape Game (5/5)");
      if (p2 === 'acquis') strengths.push("la rédaction professionnelle d'e-mails (Cci)");
      else improvements.push("l'usage du champ Cci et les règles de courriel");
      if (num2_d4 === 'acquis') strengths.push("l'analyse des traces numériques");
      else improvements.push("la distinction entre traces actives et passives");

      let autoAppreciation = `${st.nom} atteint le niveau « ${mastery.label} » (${moyenne20}/20). `;
      if (validatedCount > 0) {
        autoAppreciation += `${validatedCount} travail(aux) pratique(s) validé(s) avec sérieux. `;
      }
      if (strengths.length > 0) {
        autoAppreciation += `Bonne maîtrise de ${strengths.slice(0, 2).join(' et de ')}. `;
      }
      if (improvements.length > 0 && moyenne20 < 16) {
        autoAppreciation += `Point à consolider : ${improvements[0]}.`;
      } else {
        autoAppreciation += `Belle autonomie (${autonomyPct}%), poursuis sur cette lancée !`;
      }

      const schoolYear = st.school_year || this.getCurrentSchoolYear();

      return {
        nom: st.nom || 'Élève',
        classe: st.classe || st.classe_id || '1A',
        email: email || 'Inscrit manuellement',
        schoolYear,
        anneeScolaire: schoolYear,
        bucket: this.getStudentPeriodBucket(st),
        moyenne100,
        avgScore100: moyenne100,
        moyenne20,
        avgNote20: moyenne20,
        mastery,
        niveauMaitrise: mastery,
        xp,
        legitXp,
        autonomyPct,
        autonomy: autonomyPct,
        tutorCalls,
        hintsUsed,
        submissions: uniqueSubs,
        travaux: uniqueSubs,
        totalTravaux: uniqueSubs.length,
        validatedCount,
        pendingCount,
        fmttnItems,
        competencesFmttn: fmttnItems,
        coursesBreakdown,
        autoAppreciation
      };
    },

    regenererAppreciationAutoBulletin() {
      if (!this.selectedBulletinStudent) return;
      const report = this.getBulletinDataForStudent(this.selectedBulletinStudent);
      this.bulletinAppreciationDraft = report.autoAppreciation;
      this.bulletinAppreciationText = report.autoAppreciation;
    },

    async sauvegarderBulletinEleve() {
      if (!this.selectedBulletinStudent) return;
      this.bulletinSaving = true;
      this.bulletinSaveFeedback = '';
      this.bulletinSaveMsg = '';
      try {
        const appreciation = this.bulletinAppreciationText || this.bulletinAppreciationDraft || '';
        const custom20 = this.bulletinCustomNote20 !== '' && !isNaN(Number(this.bulletinCustomNote20))
          ? Math.min(20, Math.max(0, Number(this.bulletinCustomNote20)))
          : null;
        await saveStudentBulletinInDb(this.selectedBulletinStudent, {
          appreciation,
          customNote20: custom20
        });
        this.selectedBulletinStudent.bulletin_appreciation = appreciation;
        this.selectedBulletinStudent.bulletin_custom_note20 = custom20;
        const okMsg = '✅ Bulletin (note & appréciation) enregistré dans le dossier de l\'élève !';
        this.bulletinSaveFeedback = okMsg;
        this.bulletinSaveMsg = okMsg;
        await this.chargerElevesReels();
      } catch (err) {
        alert("Erreur lors de la sauvegarde du bulletin : " + err.message);
      } finally {
        this.bulletinSaving = false;
      }
    },

    async copierAppreciationBulletin() {
      const report = this.getBulletinDataForStudent(this.selectedBulletinStudent);
      const text = this.bulletinAppreciationText || this.bulletinAppreciationDraft || report.autoAppreciation;
      const textToCopy = `${report.nom} (${report.classe}) — Note : ${report.moyenne20}/20 (${report.mastery.label}) : ${text}`;
      try {
        await navigator.clipboard.writeText(textToCopy);
        const copiedMsg = '📋 Appréciation et note copiées dans le presse-papiers (prêt à coller dans Smartschool / Pronote) !';
        this.bulletinSaveFeedback = copiedMsg;
        this.bulletinSaveMsg = copiedMsg;
      } catch (_) {
        this.bulletinSaveFeedback = 'ℹ️ Sélectionnez le texte ci-dessus et faites Ctrl+C.';
        this.bulletinSaveMsg = 'ℹ️ Sélectionnez le texte ci-dessus et faites Ctrl+C.';
      }
    },

    // ==========================================
    // PHASE 11 : ÉCHELLE DE MAÎTRISE & EXPORT BULLETIN CSV
    // ==========================================
    getMasteryLevelFromScore(score) {
      const s = Number(score) || 0;
      if (s >= 90) {
        return { code: 'D', label: 'Dépassé', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      }
      if (s >= 70) {
        return { code: 'A', label: 'Acquis', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      }
      if (s >= 50) {
        return { code: 'EC', label: 'En cours', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
      }
      return { code: 'NA', label: 'Non acquis', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
    },

    exporterBulletinCSV() {
      const liveList = this.getLiveClassStatusList();
      if (!liveList.length) {
        alert("Aucun élève trouvé dans cette classe pour générer l'export bulletin.");
        return;
      }

      const headers = [
        "Classe",
        "Nom Élève",
        "Email",
        "Cours évalué",
        "Moyenne (/100)",
        "Niveau de Maîtrise (SeGEC)",
        "Code Maîtrise",
        "Travaux remis",
        "XP",
        "Appels Tuteur IA",
        "Appréciation suggérée pour le bulletin"
      ];

      const courseTitle = (this.coursesList || []).find(c => c.id === this.profSelectedCourseId)?.title || "Numérique FMTTN";

      const rows = liveList.map(st => {
        const m = st.mastery;
        let appreciation = "Compétences en cours d'acquisition. Poursuis tes efforts en atelier pratique.";
        if (m.code === 'D') {
          appreciation = "Excellente maîtrise et grande autonomie dans les réalisations numériques.";
        } else if (m.code === 'A') {
          appreciation = "Les attendus du référentiel sont bien acquis. Bon travail régulier.";
        } else if (m.code === 'NA') {
          appreciation = "Notions encore fragiles. Utilise les fiches de remédiation et les conseils du tuteur.";
        }

        return [
          `"${this.selectedTeacherClass || '1A'}"`,
          `"${(st.nom || '').replace(/"/g, '""')}"`,
          `"${(st.email || '').replace(/"/g, '""')}"`,
          `"${courseTitle.replace(/"/g, '""')}"`,
          `"${st.avgNote}"`,
          `"${m.label}"`,
          `"${m.code}"`,
          `"${st.subsCount}"`,
          `"${st.xp || 0}"`,
          `"${st.tutor_calls_count || 0}"`,
          `"${appreciation}"`
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_${this.selectedTeacherClass || 'classe'}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    async archiverCopie(sub) {
      try {
        await updateTeacherSubmission(sub.id, { status: 'archive' });
        sub.status = 'archive';
      } catch (err) {
        alert("Erreur archivage : " + err.message);
      }
    },

    async supprimerCopie(sub) {
      if (!confirm(`Supprimer définitivement la copie de ${sub.nom_eleve || 'cet élève'} ?`)) return;
      try {
        await deleteTeacherSubmission(sub.id);
        this.teacherSubmissions = this.teacherSubmissions.filter(s => s.id !== sub.id);
        if (this.selectedSubmission?.id === sub.id) {
          this.modalCorrectionOpen = false;
        }
      } catch (err) {
        alert("Erreur suppression : " + err.message);
      }
    },

    telechargerCodeEleve(sub) {
      const content = sub.code_eleve || '';
      const safeNom = (sub.nom_eleve || 'eleve').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `copie_${safeNom}_${sub.id.substring(0, 6)}.txt`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    exporterSubmissionsCSV() {
      const list = this.getFilteredSubmissions();
      if (list.length === 0) {
        alert("Aucune copie à exporter selon les filtres actuels.");
        return;
      }

      const headers = ["Date", "Nom Elève", "Email", "Classe", "Cours", "Exercice", "Statut", "Note", "Niveau Maîtrise", "Feedback IA", "Message Enseignant"];
      const rows = list.map(s => {
        const mastery = this.getMasteryLevelFromScore(s.note_suggeree).label;
        return [
          `"${s.date_soumission ? new Date(s.date_soumission).toLocaleDateString('fr-BE') : ''}"`,
          `"${(s.nom_eleve || '').replace(/"/g, '""')}"`,
          `"${(s.email_eleve || '').replace(/"/g, '""')}"`,
          `"${s.classe_id || s.classe || ''}"`,
          `"${s.course_id || s.id_course || 'js-uaa5-classic'}"`,
          `"${(s.titre_exercice || '').replace(/"/g, '""')}"`,
          `"${s.status || ''}"`,
          `"${s.note_suggeree !== undefined ? s.note_suggeree : ''}"`,
          `"${mastery}"`,
          `"${(s.feedback_ia || '').replace(/"/g, '""')}"`,
          `"${(s.prof_message || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profassistant_copies_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    async changerCoursMatriceProf(courseId) {
      this.profSelectedCourseId = courseId;
      if (courseId === 'fmttn-1c' || courseId === 'fmttn-1re') {
        this.profCourseExercises = [];
        return;
      }
      this.profCourseLoading = true;
      try {
        this.profCourseExercises = await courseManagerV2.loadCourseExercisesFromDb(courseId);
      } catch (err) {
        console.warn("Erreur chargement exercices cours prof :", err);
        this.profCourseExercises = [];
      } finally {
        this.profCourseLoading = false;
      }
    },

    getStudentExerciseSubmission(eleve, exercise) {
      if (!this.teacherSubmissions || !exercise) return null;
      const cid = this.profSelectedCourseId;
      return this.teacherSubmissions.find(s => {
        const subClass = s.classe_id || s.classe || '';
        if (this.selectedTeacherClass && this.selectedTeacherClass !== 'tous' && this.selectedTeacherClass !== 'all' && subClass && subClass !== this.selectedTeacherClass) {
          return false;
        }

        const subCourse = s.course_id || s.id_course || 'js-uaa5-classic';
        if (subCourse !== cid) return false;

        const matchesStudent = 
          (eleve.id && (s.id_eleve === eleve.id || s.uid_eleve === eleve.id)) ||
          (eleve.email && s.email_eleve && s.email_eleve.toLowerCase() === eleve.email.toLowerCase()) ||
          (eleve.nom && s.nom_eleve && s.nom_eleve.trim().toLowerCase() === eleve.nom.trim().toLowerCase());
        if (!matchesStudent) return false;

        const exTitle = exercise.titre || exercise.title || '';
        const matchesExo = 
          (s.id_exercice && s.id_exercice === exercise.id) ||
          (s.exercice_id && s.exercice_id === exercise.id) ||
          (s.exercise_id && s.exercise_id === exercise.id) ||
          (s.titre_exercice && exTitle && (
            s.titre_exercice.toLowerCase() === exTitle.toLowerCase() ||
            s.titre_exercice.toLowerCase().includes(exTitle.toLowerCase()) ||
            exTitle.toLowerCase().includes(s.titre_exercice.toLowerCase())
          ));
        return matchesExo;
      }) || null;
    },

    getStudentCourseProgress(eleve) {
      if (!this.profCourseExercises || this.profCourseExercises.length === 0) return 0;
      let validated = 0;
      for (const ex of this.profCourseExercises) {
        const sub = this.getStudentExerciseSubmission(eleve, ex);
        if (sub && (sub.status === 'valide' || sub.status === 'validee')) {
          validated++;
        }
      }
      return Math.round((validated / this.profCourseExercises.length) * 100);
    },

    getCourseStatsForCurrentClass() {
      const list = this.teacherSubmissions.filter(s => {
        const subClass = s.classe_id || s.classe || '';
        if (this.selectedTeacherClass && this.selectedTeacherClass !== 'tous' && this.selectedTeacherClass !== 'all' && subClass && subClass !== this.selectedTeacherClass) return false;
        const subCourse = s.course_id || s.id_course || 'js-uaa5-classic';
        return subCourse === this.profSelectedCourseId;
      });
      const validated = list.filter(s => s.status === 'valide' || s.status === 'validee').length;
      const pending = list.filter(s => s.status === 'a_valider' || s.status === 'pending').length;
      return {
        total: list.length,
        validated,
        pending
      };
    }
  };
}
