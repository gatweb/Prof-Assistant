import {
  isClassroomConnected,
  connectGoogleClassroom,
  disconnectGoogleClassroom,
  fetchClassroomCourses,
  fetchCourseStudents,
  fetchCourseWork,
  fetchCourseTopics,
  createCourseTopic,
  publishCourseWork,
  syncStudentGradeToClassroom
} from '../services/classroomService.js';
import {
  addRealStudent,
  getRealClassStudents,
  getClassMappings,
  saveClassMapping
} from '../services/firebase.js';
import { courseManagerV2 } from '../services/courseManager.js';

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
    classroomTopicsList: [],

    // Liaison explicite Cours Classroom <-> Classe & Cours ProfAssistant (Phase 9)
    classroomMappingForm: {
      classeId: '1A',
      newClasseId: '',
      courseId: 'fmttn-1re',
      autoSyncGrades: true
    },
    classroomMappingSaving: false,
    classroomMappingSuccessMsg: '',

    // Synchronisation du roster & détection des nouveaux élèves (Phase 9)
    classroomNewStudentsDetected: [],
    classroomRosterSyncing: false,

    // Publication enrichie (Phase 9 : date limite, thème, exercice ou module entier)
    classroomNewAssignment: {
      publishMode: 'single', // 'single' | 'module'
      title: '',
      description: '',
      selectedCourseId: 'fmttn-1re',
      selectedModuleId: '',
      selectedExerciseId: '',
      maxPoints: 100,
      dueDate: '',
      dueTime: '23:59',
      topicId: '',
      newTopicName: ''
    },
    classroomPublishExercisesList: [],
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
        await this.verifierNouveauxElevesClassroom();
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
      this.classroomTopicsList = [];
      this.classroomNewStudentsDetected = [];
      this.classroomImportSuccessMsg = '';
      this.classroomPublishSuccess = '';
    },

    async chargerCoursClassroom() {
      if (!isClassroomConnected()) return;
      this.classroomLoading = true;
      try {
        this.classMappings = await getClassMappings();
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
      this.classroomMappingSuccessMsg = '';

      // Pré-remplir le formulaire de liaison si une liaison existe déjà pour ce cours Classroom
      const existingMap = (this.classMappings || []).find(
        m => String(m.classroom_course_id) === String(courseId)
      );
      if (existingMap) {
        this.classroomMappingForm.classeId = existingMap.id;
        this.classroomMappingForm.courseId = existingMap.course_id || 'fmttn-1re';
        this.classroomMappingForm.autoSyncGrades = Boolean(existingMap.auto_sync_grades);
        this.classroomTargetClass = existingMap.id;
      }

      this.classroomStudentsLoading = true;
      this.classroomCourseWorkLoading = true;

      try {
        const [students, courseWork, topics] = await Promise.all([
          fetchCourseStudents(courseId),
          fetchCourseWork(courseId),
          fetchCourseTopics(courseId)
        ]);
        this.classroomSelectedCourseStudents = students;
        this.classroomCourseWorkList = courseWork;
        this.classroomTopicsList = topics;
        if (courseWork.length > 0 && !this.classroomSelectedAssignmentForSync) {
          this.classroomSelectedAssignmentForSync = courseWork[0].id;
        }
        await this.detecterNouveauxElevesPourCoursSelectionne();
      } catch (err) {
        console.error("Erreur sélection cours Classroom :", err);
      } finally {
        this.classroomStudentsLoading = false;
        this.classroomCourseWorkLoading = false;
      }
    },

    /**
     * Phase 9 : Enregistre la liaison explicite `classes/{id}.classroom_course_id`
     */
    async enregistrerLiaisonClassroom() {
      if (!this.classroomSelectedCourseId || !this.classroomSelectedCourse) {
        alert("Veuillez d'abord sélectionner un cours Google Classroom.");
        return;
      }
      const targetClass = (this.classroomMappingForm.newClasseId.trim() || this.classroomMappingForm.classeId || '1A').toUpperCase();
      this.classroomMappingSaving = true;
      this.classroomMappingSuccessMsg = '';

      try {
        await saveClassMapping(targetClass, {
          classroom_course_id: this.classroomSelectedCourseId,
          classroom_course_name: this.classroomSelectedCourse.name,
          course_id: this.classroomMappingForm.courseId || 'fmttn-1re',
          cours_ids: [this.classroomMappingForm.courseId || 'fmttn-1re'],
          auto_sync_grades: this.classroomMappingForm.autoSyncGrades
        });

        this.classMappings = await getClassMappings();
        if (!this.availableClasses.includes(targetClass)) {
          this.availableClasses.push(targetClass);
        }
        this.classroomMappingForm.classeId = targetClass;
        this.classroomMappingForm.newClasseId = '';
        this.classroomTargetClass = targetClass;
        this.classroomMappingSuccessMsg = `🔗 Liaison enregistrée : "${this.classroomSelectedCourse.name}" ➔ Classe ${targetClass} (${this.classroomMappingForm.courseId})`;

        await this.detecterNouveauxElevesPourCoursSelectionne();
      } catch (err) {
        alert("Erreur lors de l'enregistrement de la liaison : " + err.message);
      } finally {
        this.classroomMappingSaving = false;
      }
    },

    getMappingForClassroomCourse(classroomCourseId) {
      return (this.classMappings || []).find(
        m => String(m.classroom_course_id) === String(classroomCourseId)
      ) || null;
    },

    /**
     * Phase 9 : Compare le roster Classroom avec les élèves déjà inscrits dans la classe liée
     */
    async detecterNouveauxElevesPourCoursSelectionne() {
      if (!this.classroomSelectedCourseId || !this.classroomSelectedCourseStudents.length) {
        this.classroomNewStudentsDetected = [];
        return;
      }
      const map = this.getMappingForClassroomCourse(this.classroomSelectedCourseId);
      const targetClass = map?.id || this.classroomTargetClass || '1A';
      const existingStudents = await getRealClassStudents(targetClass);
      const existingEmails = new Set(
        existingStudents.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean)
      );

      this.classroomNewStudentsDetected = this.classroomSelectedCourseStudents.filter(
        st => st.email && !existingEmails.has(st.email.toLowerCase().trim())
      ).map(st => ({ ...st, targetClass }));
    },

    /**
     * Phase 9 : Vérifie à l'ouverture de l'espace prof tous les cours liés pour signaler les nouveaux élèves
     */
    async verifierNouveauxElevesClassroom() {
      if (!isClassroomConnected()) return;
      this.classroomRosterSyncing = true;
      try {
        if (!this.classMappings?.length) {
          this.classMappings = await getClassMappings();
        }
        const linkedMappings = (this.classMappings || []).filter(m => m.classroom_course_id);
        if (!linkedMappings.length) {
          await this.detecterNouveauxElevesPourCoursSelectionne();
          return;
        }

        const newOnes = [];
        for (const m of linkedMappings) {
          try {
            const [roster, existing] = await Promise.all([
              fetchCourseStudents(m.classroom_course_id),
              getRealClassStudents(m.id)
            ]);
            const existingEmails = new Set(existing.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean));
            roster.forEach(st => {
              if (st.email && !existingEmails.has(st.email.toLowerCase().trim())) {
                newOnes.push({ ...st, targetClass: m.id, classroomCourseName: m.classroom_course_name });
              }
            });
          } catch (_) {}
        }
        this.classroomNewStudentsDetected = newOnes;
      } finally {
        this.classroomRosterSyncing = false;
      }
    },

    async synchroniserNouveauxElevesDetectes() {
      if (!this.classroomNewStudentsDetected.length) return;
      this.classroomImportLoading = true;
      let count = 0;
      try {
        for (const st of this.classroomNewStudentsDetected) {
          const res = await addRealStudent(st.fullName, st.targetClass || '1A', st.email);
          if (res.success) count++;
        }
        this.classroomImportSuccessMsg = `✅ ${count} nouvel(aux) élève(s) ajouté(s) automatiquement à leur classe !`;
        this.classroomNewStudentsDetected = [];
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      } catch (err) {
        alert("Erreur synchronisation nouveaux élèves : " + err.message);
      } finally {
        this.classroomImportLoading = false;
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
        this.classroomNewStudentsDetected = [];
        
        this.selectedTeacherClass = finalClass;
        await this.chargerElevesReels();
        this.activerEcouteClasse(finalClass);
      } catch (err) {
        alert("Erreur lors de l'import : " + err.message);
      } finally {
        this.classroomImportLoading = false;
      }
    },

    async preparerDevoirClassroom(courseId, exerciseId = '') {
      const course = this.coursesList.find(c => c.id === courseId) || this.currentCourse;
      if (!course) return;

      this.classroomNewAssignment.selectedCourseId = course.id;
      this.classroomNewAssignment.selectedModuleId = course.chapters?.[0]?.id || '';

      // Charger la banque d'exercices du cours choisi
      const exos = await courseManagerV2.loadCourseExercisesFromDb(course.id);
      this.classroomPublishExercisesList = exos;

      const exo = exos.find(e => e.id === exerciseId) || exos[0] || null;
      this.classroomNewAssignment.selectedExerciseId = exo?.id || '';

      if (this.classroomNewAssignment.publishMode === 'module') {
        const mod = course.chapters?.find(ch => ch.id === this.classroomNewAssignment.selectedModuleId) || course.chapters?.[0];
        this.classroomNewAssignment.title = `[${course.title}] ${mod?.title || 'Module complet'}`;
        this.classroomNewAssignment.description = `Parcourez la théorie et réalisez les missions du module "${mod?.title || ''}" sur ProfAssistant.`;
      } else {
        this.classroomNewAssignment.title = `[${course.title}] ${exo?.titre || exo?.title || course.chapters?.[0]?.title || 'Activité'}`;
        this.classroomNewAssignment.description = exo?.consigne || exo?.instructions || `Complétez l'activité interactive sur ProfAssistant. Votre travail sera accompagné par le tuteur socratique.`;
      }
      this.classroomNewAssignment.maxPoints = 100;
    },

    changerModePublicationClassroom(mode) {
      this.classroomNewAssignment.publishMode = mode;
      if (this.classroomNewAssignment.selectedCourseId) {
        this.preparerDevoirClassroom(
          this.classroomNewAssignment.selectedCourseId,
          this.classroomNewAssignment.selectedExerciseId
        );
      }
    },

    /**
     * Phase 9 : Publication enrichie (date limite, thème Classroom existant ou créé à la volée, activité unique ou module entier)
     */
    async publierActiviteClassroom() {
      if (!this.classroomSelectedCourseId) {
        alert("Veuillez sélectionner un cours Google Classroom.");
        return;
      }
      if (!this.classroomNewAssignment.title.trim() && this.classroomNewAssignment.publishMode === 'single') {
        alert("Veuillez renseigner le titre du devoir.");
        return;
      }

      this.classroomPublishLoading = true;
      this.classroomPublishSuccess = '';

      try {
        const cId = this.classroomNewAssignment.selectedCourseId || this.currentCourse?.id || 'fmttn-1re';
        const course = this.coursesList.find(c => c.id === cId) || this.currentCourse;

        // 1. Résoudre ou créer le thème Classroom (Topic)
        let topicId = this.classroomNewAssignment.topicId || '';
        if (this.classroomNewAssignment.newTopicName?.trim()) {
          try {
            const newTopic = await createCourseTopic(
              this.classroomSelectedCourseId,
              this.classroomNewAssignment.newTopicName.trim()
            );
            topicId = newTopic.topicId;
            this.classroomTopicsList.push(newTopic);
            this.classroomNewAssignment.topicId = topicId;
            this.classroomNewAssignment.newTopicName = '';
          } catch (topicErr) {
            console.warn("Impossible de créer le thème Classroom :", topicErr.message);
          }
        }

        // 2. Mode Module Entier : publier le lien profond vers le module + ses missions
        if (this.classroomNewAssignment.publishMode === 'module') {
          const modId = this.classroomNewAssignment.selectedModuleId || course?.chapters?.[0]?.id || '';
          const modObj = course?.chapters?.find(ch => ch.id === modId);
          const moduleExos = (this.classroomPublishExercisesList || []).filter(
            ex => String(ex.chapitre || ex.module_id || '').toLowerCase() === String(modId).toLowerCase()
          );

          if (moduleExos.length > 1) {
            let publishedCount = 0;
            for (const ex of moduleExos) {
              const linkUrl = `${window.location.origin}/?course=${encodeURIComponent(cId)}&module=${encodeURIComponent(modId)}&ex=${encodeURIComponent(ex.id)}`;
              await publishCourseWork(this.classroomSelectedCourseId, {
                title: `[${modObj?.title || course?.title}] ${ex.titre || ex.title}`,
                description: ex.consigne || this.classroomNewAssignment.description,
                linkUrl,
                maxPoints: Number(this.classroomNewAssignment.maxPoints) || 100,
                dueDate: this.classroomNewAssignment.dueDate,
                dueTime: this.classroomNewAssignment.dueTime,
                topicId
              });
              publishedCount++;
            }
            this.classroomPublishSuccess = `✅ Module publié (${publishedCount} missions créées dans Google Classroom) !`;
          } else {
            const exId = moduleExos[0]?.id || '';
            const linkUrl = `${window.location.origin}/?course=${encodeURIComponent(cId)}&module=${encodeURIComponent(modId)}${exId ? '&ex=' + encodeURIComponent(exId) : ''}`;
            await publishCourseWork(this.classroomSelectedCourseId, {
              title: this.classroomNewAssignment.title || `[${course?.title}] ${modObj?.title || 'Module'}`,
              description: this.classroomNewAssignment.description,
              linkUrl,
              maxPoints: Number(this.classroomNewAssignment.maxPoints) || 100,
              dueDate: this.classroomNewAssignment.dueDate,
              dueTime: this.classroomNewAssignment.dueTime,
              topicId
            });
            this.classroomPublishSuccess = `✅ Module "${modObj?.title || modId}" publié avec succès dans Google Classroom !`;
          }
        } else {
          // 3. Mode Activité Unique
          const exId = this.classroomNewAssignment.selectedExerciseId || '';
          const modId = this.classroomNewAssignment.selectedModuleId || '';
          const activityUrl = `${window.location.origin}/?course=${encodeURIComponent(cId)}${modId ? '&module=' + encodeURIComponent(modId) : ''}${exId ? '&ex=' + encodeURIComponent(exId) : ''}`;

          await publishCourseWork(this.classroomSelectedCourseId, {
            title: this.classroomNewAssignment.title,
            description: this.classroomNewAssignment.description,
            linkUrl: activityUrl,
            maxPoints: Number(this.classroomNewAssignment.maxPoints) || 100,
            dueDate: this.classroomNewAssignment.dueDate,
            dueTime: this.classroomNewAssignment.dueTime,
            topicId
          });

          this.classroomPublishSuccess = `✅ Devoir publié avec succès dans Google Classroom !`;
        }

        this.classroomCourseWorkList = await fetchCourseWork(this.classroomSelectedCourseId);
      } catch (err) {
        alert("Erreur publication devoir Classroom : " + err.message);
      } finally {
        this.classroomPublishLoading = false;
      }
    },

    /**
     * Phase 9 : Renvoi automatique de la note à la validation si `auto_sync_grades` est activé sur la classe
     */
    async autoSyncGradeIfEnabled(submission, note) {
      if (!isClassroomConnected() || !submission) return false;
      const subClass = String(submission.classe_id || submission.classe || '').toUpperCase();
      const mapping = (this.classMappings || []).find(
        m => String(m.id || '').toUpperCase() === subClass
      );
      if (!mapping || !mapping.auto_sync_grades || !mapping.classroom_course_id) {
        return false;
      }

      const courseWorkList = (this.classroomSelectedCourseId === mapping.classroom_course_id && this.classroomCourseWorkList.length)
        ? this.classroomCourseWorkList
        : await fetchCourseWork(mapping.classroom_course_id);

      if (!courseWorkList.length) return false;

      const exTitle = String(submission.titre_exercice || '').toLowerCase();
      const matchedCw = courseWorkList.find(
        cw => exTitle && cw.title.toLowerCase().includes(exTitle)
      ) || courseWorkList[0];

      if (!matchedCw) return false;

      await syncStudentGradeToClassroom({
        courseId: mapping.classroom_course_id,
        courseWorkId: matchedCw.id,
        studentEmail: submission.email_eleve || '',
        grade: note
      });
      return true;
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
