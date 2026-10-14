import {
  genererQuizGoogleFormsCloud,
  recupererReponsesGoogleFormsCloud
} from '../services/firebase.js';
import {
  isClassroomConnected,
  getClassroomToken,
  publishCourseWork,
  fetchCourseWork
} from '../services/classroomService.js';

export function createFormsStore() {
  return {
    formsGenerating: false,
    formsGeneratedData: null,
    formsFormId: '',
    formsEditUrl: '',
    formsResponderUrl: '',
    formsTitleInput: 'Quiz Numérique & Bureautique',
    formsTopicInput: 'Raccourcis clavier, gestion des fichiers Google Drive et mise en forme Google Docs',
    formsLevelInput: '3e secondaire (14-15 ans)',
    formsCountInput: 5,
    formsTargetCourseId: 'bureautique-pro',
    formsSyncLoading: false,
    formsSyncResults: [],
    formsSyncSuccessMsg: '',
    formsPublishToClassroomLoading: false,
    formsPublishToClassroomSuccessMsg: '',

    async genererQuizForms() {
      if (!this.formsTopicInput.trim()) {
        alert("Veuillez renseigner un sujet ou thème pour le quiz.");
        return;
      }

      this.formsGenerating = true;
      this.formsGeneratedData = null;
      this.formsSyncSuccessMsg = '';
      this.formsPublishToClassroomSuccessMsg = '';

      try {
        const accessToken = getClassroomToken() || undefined;
        const res = await genererQuizGoogleFormsCloud({
          sujet: this.formsTopicInput,
          niveau: this.formsLevelInput,
          nombreQuestions: Number(this.formsCountInput) || 5,
          titreQuiz: this.formsTitleInput || 'Quiz Évaluation',
          accessToken
        });

        this.formsGeneratedData = res.quizData || null;
        this.formsFormId = res.formId || '';
        this.formsEditUrl = res.editUri || '';
        this.formsResponderUrl = res.responderUri || '';

        if (res.mode === 'preview_only') {
          alert("✨ Questions générées avec succès par l'IA Gemini ! Prévisualisation disponible ci-dessous.");
        }
      } catch (err) {
        alert("Erreur lors de la génération du quiz : " + err.message);
      } finally {
        this.formsGenerating = false;
      }
    },

    async synchroniserReponsesForms() {
      if (!this.formsFormId) {
        alert("Veuillez d'abord générer un Google Form ou saisir son ID.");
        return;
      }

      this.formsSyncLoading = true;
      this.formsSyncSuccessMsg = '';

      try {
        const accessToken = getClassroomToken() || undefined;
        const res = await recupererReponsesGoogleFormsCloud({
          formId: this.formsFormId,
          accessToken,
          classeId: this.selectedTeacherClass || '1A',
          courseId: this.formsTargetCourseId || 'bureautique-pro'
        });

        this.formsSyncResults = res.results || [];
        this.formsSyncSuccessMsg = `🎉 ${res.count || 0} réponse(s) d'élèves synchronisée(s) vers exam_results ! (Barème total : ${res.maxPoints || 0} pts)`;
        
        await this.chargerElevesReels();
        this.activerEcouteClasse(this.selectedTeacherClass);
      } catch (err) {
        alert("Erreur synchronisation des réponses Google Forms : " + err.message);
      } finally {
        this.formsSyncLoading = false;
      }
    },

    async publierQuizFormsDansClassroom() {
      if (!this.formsResponderUrl) {
        alert("Aucun formulaire Google Forms actif n'a de lien de réponse.");
        return;
      }
      if (!isClassroomConnected() || !this.classroomSelectedCourseId) {
        alert("Veuillez d'abord connecter et sélectionner un cours Google Classroom depuis l'onglet 'Google Classroom'.");
        return;
      }

      this.formsPublishToClassroomLoading = true;
      this.formsPublishToClassroomSuccessMsg = '';

      try {
        await publishCourseWork(this.classroomSelectedCourseId, {
          title: this.formsGeneratedData?.titre || this.formsTitleInput || "Quiz Évaluation",
          description: this.formsGeneratedData?.description || "Complétez le Quiz Google Forms auto-corrigé en cliquant sur le lien ci-joint.",
          linkUrl: this.formsResponderUrl,
          maxPoints: Number(this.formsCountInput) || 10
        });

        this.formsPublishToClassroomSuccessMsg = `✅ Quiz publié avec succès dans Google Classroom (${this.classroomSelectedCourse?.name || 'Classroom'}) !`;
        this.classroomCourseWorkList = await fetchCourseWork(this.classroomSelectedCourseId);
      } catch (err) {
        alert("Erreur publication dans Classroom : " + err.message);
      } finally {
        this.formsPublishToClassroomLoading = false;
      }
    }
  };
}
