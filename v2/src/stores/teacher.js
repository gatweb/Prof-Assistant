import {
  listenToClasseProgressions,
  getRealClassStudents,
  addRealStudent,
  updateStudentClassInDb,
  deleteStudentFromClassInDb,
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
    modalAddStudentOpen: false,
    newStudentData: {
      nom: '',
      classe: '1A',
      email: ''
    },

    classeEleves: [],

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
      if (!confirm(`Retirer l'élève « ${student.nom} » (${student.classe || '1A'}) de la liste ?`)) return;
      const ok = await deleteStudentFromClassInDb(student);
      if (ok) {
        await this.chargerTousLesElevesEcole();
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      }
    },

    getElevesFiltresGestion() {
      const q = this.searchStudentQuery.toLowerCase().trim();
      const baseList = this.allClassStudents || [];
      if (!q) return baseList;
      return baseList.filter(s => 
        (s.nom || '').toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.classe && s.classe.toLowerCase().includes(q))
      );
    },

    getProgressionMoyenneClasse() {
      if (!this.classeEleves || this.classeEleves.length === 0) return 0;
      const total = this.classeEleves.reduce((acc, el) => acc + (el.score || 0), 0);
      return Math.round(total / this.classeEleves.length);
    },

    getNbElevesTermineEG() {
      if (!this.classeEleves) return 0;
      return this.classeEleves.filter(el => el.eg === "5/5").length;
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

      (this.allClassStudents || []).forEach(st => {
        const key = (st.email || st.id || st.nom).toLowerCase();
        mergedMap.set(key, {
          id: st.id,
          nom: st.nom,
          email: st.email || '',
          xp: st.xp || 0,
          score: st.progression?.score || 50,
          tutor_calls_count: Number(st.progression?.tutor_calls_count) || 0,
          hints_used_count: Number(st.progression?.hints_used_count) || 0,
          updated_at: st.progression?.updated_at || null
        });
      });

      (this.classeEleves || []).forEach(ce => {
        const key = (ce.email || ce.id || ce.nom).toLowerCase();
        const existing = mergedMap.get(key) || {};
        mergedMap.set(key, {
          ...existing,
          id: ce.id || existing.id,
          nom: ce.nom || existing.nom,
          email: ce.email || existing.email || '',
          xp: Math.max(ce.xp || 0, existing.xp || 0),
          score: ce.score || existing.score || 50,
          tutor_calls_count: Math.max(Number(ce.tutor_calls_count) || 0, existing.tutor_calls_count || 0),
          hints_used_count: Math.max(Number(ce.hints_used_count) || 0, existing.hints_used_count || 0),
          updated_at: ce.updated_at || existing.updated_at || null
        });
      });

      const students = Array.from(mergedMap.values());
      const now = Date.now();

      return students.map(el => {
        // Chercher les soumissions de cet élève dans la classe
        const subs = (this.teacherSubmissions || []).filter(s => {
          const sameEmail = el.email && s.email_eleve && s.email_eleve.toLowerCase() === el.email.toLowerCase();
          const sameName = el.nom && s.nom_eleve && s.nom_eleve.trim().toLowerCase() === el.nom.trim().toLowerCase();
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
          priority = 1; // Afficher les élèves bloqués en premier !
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

        return {
          ...el,
          badge,
          statusLabel: label,
          colorClass,
          priority,
          isStuck,
          subsCount: subs.length,
          avgNote,
          mastery: this.getMasteryLevelFromScore(avgNote)
        };
      }).sort((a, b) => a.priority - b.priority || (a.nom || '').localeCompare(b.nom || ''));
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
