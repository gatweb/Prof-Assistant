import {
  isClassroomConnected,
  connectGoogleClassroom,
  disconnectGoogleClassroom,
  fetchClassroomCourses,
  fetchCourseStudents,
  fetchCourseWork,
  publishCourseWork,
  syncStudentGradeToClassroom
} from '../services/classroomService.js';
import { addRealStudent } from '../services/firebase.js';

export function createClassroomStore() {
  return {
    classroomConnected: false,
    classroomCourses: [],
    classroomLoading: false,
    classroomSelectedCourseId: '',
    classroomSelectedCourse: null,
    classroomSelectedCourseStudents: [],
    classroomStudentsLoading: false,
    classroomTargetClass: '1A',
    classroomNewClassName: '',
    classroomImportLoading: false,
    classroomImportSuccessMsg: '',
    classroomCourseWorkList: [],
    classroomCourseWorkLoading: false,
    classroomNewAssignment: {
      title: '',
      description: '',
      selectedCourseId: '',
      selectedExerciseId: '',
      maxPoints: 100
    },
    classroomPublishLoading: false,
    classroomPublishSuccess: '',
    classroomSyncGradeLoading: false,
    classroomSyncGradeFeedback: '',
    classroomSelectedAssignmentForSync: '',

    async connecterGoogleClassroom() {
      this.classroomLoading = true;
      try {
        await connectGoogleClassroom();
        this.classroomConnected = true;
        await this.chargerCoursClassroom();
      } catch (err) {
        alert("Erreur lors de la connexion à Google Classroom : " + err.message);
      } finally {
        this.classroomLoading = false;
      }
    },

    deconnecterGoogleClassroom() {
      disconnectGoogleClassroom();
      this.classroomConnected = false;
      this.classroomCourses = [];
      this.classroomSelectedCourseId = '';
      this.classroomSelectedCourse = null;
      this.classroomSelectedCourseStudents = [];
      this.classroomCourseWorkList = [];
      this.classroomImportSuccessMsg = '';
      this.classroomPublishSuccess = '';
    },

    async chargerCoursClassroom() {
      if (!isClassroomConnected()) return;
      this.classroomLoading = true;
      try {
        this.classroomCourses = await fetchClassroomCourses();
        if (this.classroomCourses.length > 0 && !this.classroomSelectedCourseId) {
          await this.selectionnerCoursClassroom(this.classroomCourses[0].id);
        }
      } catch (err) {
        console.warn("Erreur chargement cours Classroom :", err);
        if (err.message && err.message.includes("expiré")) {
          this.classroomConnected = false;
        }
      } finally {
        this.classroomLoading = false;
      }
    },

    async selectionnerCoursClassroom(courseId) {
      this.classroomSelectedCourseId = courseId;
      this.classroomSelectedCourse = this.classroomCourses.find(c => c.id === courseId) || null;
      this.classroomImportSuccessMsg = '';
      this.classroomPublishSuccess = '';
      
      this.classroomStudentsLoading = true;
      this.classroomCourseWorkLoading = true;

      try {
        const [students, courseWork] = await Promise.all([
          fetchCourseStudents(courseId),
          fetchCourseWork(courseId)
        ]);
        this.classroomSelectedCourseStudents = students;
        this.classroomCourseWorkList = courseWork;
        if (courseWork.length > 0 && !this.classroomSelectedAssignmentForSync) {
          this.classroomSelectedAssignmentForSync = courseWork[0].id;
        }
      } catch (err) {
        console.error("Erreur sélection cours Classroom :", err);
      } finally {
        this.classroomStudentsLoading = false;
        this.classroomCourseWorkLoading = false;
      }
    },

    async importerElevesClassroom(targetClass) {
      const finalClass = (this.classroomNewClassName.trim() || targetClass || '1A').toUpperCase();
      if (!this.classroomSelectedCourseStudents.length) {
        alert("Aucun élève trouvé dans ce cours Classroom.");
        return;
      }

      if (!confirm(`Importer ${this.classroomSelectedCourseStudents.length} élèves dans la classe "${finalClass}" ?`)) {
        return;
      }

      this.classroomImportLoading = true;
      this.classroomImportSuccessMsg = '';
      let successCount = 0;

      try {
        for (const st of this.classroomSelectedCourseStudents) {
          const res = await addRealStudent(st.fullName, finalClass, st.email);
          if (res.success) successCount++;
        }

        this.classroomImportSuccessMsg = `🎉 ${successCount} élève(s) importé(s) avec succès dans la classe ${finalClass} !`;
        this.classroomNewClassName = '';
        
        this.selectedTeacherClass = finalClass;
        await this.chargerElevesReels();
        this.activerEcouteClasse(finalClass);
      } catch (err) {
        alert("Erreur lors de l'import : " + err.message);
      } finally {
        this.classroomImportLoading = false;
      }
    },

    preparerDevoirClassroom(courseId, exerciseId) {
      const course = this.coursesList.find(c => c.id === courseId) || this.currentCourse;
      const exo = (this.courseExercises || []).find(e => e.id === exerciseId) || this.currentExercise;

      this.classroomNewAssignment.selectedCourseId = courseId;
      this.classroomNewAssignment.selectedExerciseId = exerciseId;
      this.classroomNewAssignment.title = `[${course?.title || 'ProfAssistant'}] ${exo?.titre || exo?.title || 'Devoir'}`;
      this.classroomNewAssignment.description = exo?.consigne || exo?.instructions || `Complétez l'activité interactive sur ProfAssistant. Votre code ou travail sera analysé avec le tuteur d'apprentissage.`;
      this.classroomNewAssignment.maxPoints = 100;
    },

    async publierActiviteClassroom() {
      if (!this.classroomSelectedCourseId) {
        alert("Veuillez sélectionner un cours Google Classroom.");
        return;
      }
      if (!this.classroomNewAssignment.title.trim()) {
        alert("Veuillez renseigner le titre du devoir.");
        return;
      }

      this.classroomPublishLoading = true;
      this.classroomPublishSuccess = '';

      try {
        const cId = this.classroomNewAssignment.selectedCourseId || this.currentCourse?.id || 'js-uaa5-classic';
        const exId = this.classroomNewAssignment.selectedExerciseId || this.currentExercise?.id || '';
        const activityUrl = `${window.location.origin}/?course=${encodeURIComponent(cId)}${exId ? '&ex=' + encodeURIComponent(exId) : ''}`;

        await publishCourseWork(this.classroomSelectedCourseId, {
          title: this.classroomNewAssignment.title,
          description: this.classroomNewAssignment.description,
          linkUrl: activityUrl,
          maxPoints: Number(this.classroomNewAssignment.maxPoints) || 100
        });

        this.classroomPublishSuccess = `✅ Devoir publié avec succès dans Google Classroom !`;
        this.classroomCourseWorkList = await fetchCourseWork(this.classroomSelectedCourseId);
      } catch (err) {
        alert("Erreur publication devoir Classroom : " + err.message);
      } finally {
        this.classroomPublishLoading = false;
      }
    },

    async synchroniserNoteVersClassroom(submission, note) {
      if (!isClassroomConnected()) {
        alert("Veuillez d'abord connecter votre compte Google Classroom depuis l'onglet dédié.");
        return;
      }
      if (!this.classroomSelectedCourseId) {
        alert("Veuillez sélectionner un cours Google Classroom actif.");
        return;
      }

      if (!this.classroomSelectedAssignmentForSync && this.classroomCourseWorkList.length > 0) {
        this.classroomSelectedAssignmentForSync = this.classroomCourseWorkList[0].id;
      }

      const courseWorkId = this.classroomSelectedAssignmentForSync;
      if (!courseWorkId) {
        alert("Aucun devoir Classroom n'est sélectionné pour synchroniser la note.");
        return;
      }

      this.classroomSyncGradeLoading = true;
      this.classroomSyncGradeFeedback = '';

      try {
        const studentEmail = submission.email_eleve || '';
        const finalNote = note !== undefined ? note : (this.gradingNote || 80);

        await syncStudentGradeToClassroom({
          courseId: this.classroomSelectedCourseId,
          courseWorkId: courseWorkId,
          studentEmail: studentEmail,
          grade: finalNote
        });

        this.classroomSyncGradeFeedback = `✅ Note de ${finalNote}/100 transmise à Google Classroom pour ${submission.nom_eleve || studentEmail} !`;
        setTimeout(() => {
          this.classroomSyncGradeFeedback = '';
        }, 5000);
      } catch (err) {
        alert("Erreur synchronisation note Classroom : " + err.message);
      } finally {
        this.classroomSyncGradeLoading = false;
      }
    }
  };
}
