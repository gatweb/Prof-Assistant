import {
  listenToClasseProgressions,
  getRealClassStudents,
  addRealStudent,
  updateStudentClassInDb,
  listerEnseignantsCloud,
  enregistrerEnseignantCloud,
  supprimerEnseignantCloud,
  listenToTeacherSubmissions,
  updateTeacherSubmission,
  deleteTeacherSubmission
} from '../services/firebase.js';
import { courseManagerV2 } from '../services/courseManager.js';

export function createTeacherStore() {
  return {
    activeProfSubTab: 'copies',
    profMatrixChapter: 'ch1',
    selectedTeacherClass: '1A',
    unsubscribeTeacherListener: null,
    firestoreSynced: false,
    remediationGenerated: false,

    teacherSubmissions: [],
    unsubscribeSubmissionsListener: null,
    submissionFilterStatus: 'tous',
    submissionFilterCourse: 'tous',
    submissionFilterClass: 'tous',
    submissionSearchText: '',
    selectedSubmission: null,
    modalCorrectionOpen: false,
    gradingNote: 80,
    gradingProfMessage: '',
    gradingLoading: false,
    gradingFeedbackSuccess: '',

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
      this.selectedTeacherClass = newClass;
      this.activerEcouteClasse(newClass);
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
      this.allClassStudents = await getRealClassStudents(this.selectedTeacherClass);
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

      const res = await addRealStudent(
        this.newStudentData.nom,
        this.newStudentData.classe,
        this.newStudentData.email
      );

      if (res.success) {
        this.newStudentData.nom = '';
        this.newStudentData.email = '';
        this.modalAddStudentOpen = false;
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      } else {
        alert(`Erreur lors de l'enregistrement de l'élève : ${res.error}`);
      }
    },

    async changerClasseEleve(studentId, newClass) {
      const ok = await updateStudentClassInDb(studentId, newClass, this.selectedTeacherClass);
      if (ok) {
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      }
    },

    getElevesFiltresGestion() {
      const q = this.searchStudentQuery.toLowerCase().trim();
      if (!q) return this.allClassStudents;
      return this.allClassStudents.filter(s => 
        s.nom.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q))
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
      return this.teacherSubmissions.filter(sub => {
        if (this.submissionFilterStatus !== 'tous') {
          if (this.submissionFilterStatus === 'a_valider') {
            if (sub.status !== 'a_valider' && sub.status !== 'pending') return false;
          } else if (sub.status !== this.submissionFilterStatus) {
            return false;
          }
        }

        if (this.submissionFilterClass !== 'tous') {
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
    },

    getPendingSubmissionsCount() {
      return this.teacherSubmissions.filter(s => s.status === 'a_valider' || s.status === 'pending').length;
    },

    ouvrirModalCorrection(sub) {
      this.selectedSubmission = sub;
      this.gradingNote = sub.note_suggeree !== undefined && sub.note_suggeree !== null ? sub.note_suggeree : 80;
      this.gradingProfMessage = sub.prof_message || '';
      this.gradingFeedbackSuccess = '';
      this.modalCorrectionOpen = true;
    },

    async validerCorrection(nouveauStatut) {
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

        // Phase 9 : Si le devoir est validé et que la classe a activé le renvoi automatique des notes vers Classroom
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

        setTimeout(() => {
          this.modalCorrectionOpen = false;
        }, 1200);
      } catch (err) {
        alert("Erreur lors de la mise à jour : " + err.message);
      } finally {
        this.gradingLoading = false;
      }
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

      const headers = ["Date", "Nom Elève", "Email", "Classe", "Cours", "Exercice", "Statut", "Note", "Feedback IA", "Message Enseignant"];
      const rows = list.map(s => [
        `"${s.date_soumission ? new Date(s.date_soumission).toLocaleDateString('fr-BE') : ''}"`,
        `"${(s.nom_eleve || '').replace(/"/g, '""')}"`,
        `"${(s.email_eleve || '').replace(/"/g, '""')}"`,
        `"${s.classe_id || s.classe || ''}"`,
        `"${s.course_id || s.id_course || 'js-uaa5-classic'}"`,
        `"${(s.titre_exercice || '').replace(/"/g, '""')}"`,
        `"${s.status || ''}"`,
        `"${s.note_suggeree !== undefined ? s.note_suggeree : ''}"`,
        `"${(s.feedback_ia || '').replace(/"/g, '""')}"`,
        `"${(s.prof_message || '').replace(/"/g, '""')}"`
      ]);

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
        if (this.selectedTeacherClass && subClass && subClass !== this.selectedTeacherClass) {
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
        if (this.selectedTeacherClass && subClass && subClass !== this.selectedTeacherClass) return false;
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
