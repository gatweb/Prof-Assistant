import './style.css';
import Alpine from 'alpinejs';
import chapterData from './data/chapitre-1-communication.json';
import competencesData from './data/competences-fmttn.json';
import module0Data from './data/module-0-introduction.json';
import { interrogerTuteurIA } from './services/firebase.js';

window.Alpine = Alpine;

Alpine.data('profAssistantApp', () => ({
  // Navigation Module & Onglets
  selectedModuleId: 'module-0', // 'module-0' | 'ch1-communication'
  activeTab: 'decouvre',        // 'decouvre' | 'pratique' | 'maitrise' | 'competences' | 'prof'
  
  // Données Pédagogiques
  module0: module0Data,
  chapter: chapterData,
  competences: competencesData.chapitres[0].competences,
  
  // État de l'élève
  user: {
    nom: 'Lucas M.',
    classe: '1C2',
    xp: 140,
    avatar: 'robot'
  },

  // Progression des compétences élève
  eleveCompetences: {
    'NUM-1.D5': 'en_cours',
    'NUM-1.D6': 'en_cours',
    'NUM-1.D1': 'acquis',
    'NUM-1.P2': 'a_renforcer'
  },

  // État du Quiz Chapitre 1
  quizState: {
    currentQuestionIndex: 0,
    selectedOption: null,
    hasSubmitted: false,
    isCorrect: false,
    score: 0,
    activeQuizId: 'q1-ethique-situations',
    feedbackMessage: '',
    errorPattern: null
  },

  // État du Jeu de la Charte (Module 0)
  charteState: {
    currentIndex: 0,
    userChoice: null, // true | false
    hasAnswered: false,
    score: 0,
    finished: false
  },

  // État du Tuteur Socratique (Robot Bleu @lt_X)
  tutorOpen: false,
  tutorLoading: false,
  tutorMood: 'happy', // 'happy' | 'thinking' | 'encouraging'
  tutorMessage: 'Salut Lucas ! Je suis ton tuteur FMTTN. Une question sur le cours ou un exercice ?',
  tutorHistory: [
    { sender: 'bot', text: 'Salut Lucas ! Je suis ton assistant numérique @lt_X. Tu as un doute sur un mot de passe, la charte ou le courriel ? Pose-moi ta question !' }
  ],
  studentQuestion: '',

  // Données Simulation Vue Professeur (Inspirée ed.ai)
  classeEleves: [
    { id: 1, nom: 'Lucas M.', charte: 'acquis', d5: 'en_cours', d6: 'en_cours', p2: 'a_renforcer', score: 70 },
    { id: 2, nom: 'Emma B.', charte: 'acquis', d5: 'acquis', d6: 'acquis', p2: 'acquis', score: 95 },
    { id: 3, nom: 'Youssef K.', charte: 'acquis', d5: 'acquis', d6: 'en_cours', p2: 'en_cours', score: 80 },
    { id: 4, nom: 'Camille D.', charte: 'en_cours', d5: 'a_renforcer', d6: 'a_renforcer', p2: 'a_renforcer', score: 45 },
    { id: 5, nom: 'Noah V.', charte: 'acquis', d5: 'acquis', d6: 'acquis', p2: 'en_cours', score: 85 },
    { id: 6, nom: 'Léa S.', charte: 'acquis', d5: 'en_cours', d6: 'acquis', p2: 'acquis', score: 90 }
  ],

  remediationGenerated: false,

  init() {
    console.log('ProfAssistant V2 initialisé avec support Module 0 et Chapitre 1.');
  },

  // Méthodes pour le Module 0 : Jeu de la Charte
  getCurrentCharteSituation() {
    return this.module0.parties[1].situations[this.charteState.currentIndex];
  },

  repondreCharte(choix) {
    if (this.charteState.hasAnswered) return;
    this.charteState.userChoice = choix;
    this.charteState.hasAnswered = true;
    const current = this.getCurrentCharteSituation();

    if (choix === current.est_ok) {
      this.charteState.score += 10;
      this.user.xp += 10;
      this.tutorMood = 'happy';
    } else {
      this.tutorMood = 'thinking';
    }
  },

  situationCharteSuivante() {
    const total = this.module0.parties[1].situations.length;
    if (this.charteState.currentIndex < total - 1) {
      this.charteState.currentIndex++;
      this.charteState.userChoice = null;
      this.charteState.hasAnswered = false;
    } else {
      this.charteState.finished = true;
    }
  },

  reinitialiserCharte() {
    this.charteState.currentIndex = 0;
    this.charteState.userChoice = null;
    this.charteState.hasAnswered = false;
    this.charteState.score = 0;
    this.charteState.finished = false;
  },

  // Gestion du Quiz Chapitre 1
  getCurrentQuiz() {
    return this.chapter.je_decouvre.quiz.find(q => q.id === this.quizState.activeQuizId) || this.chapter.je_decouvre.quiz[0];
  },

  getCurrentQuestion() {
    const quiz = this.getCurrentQuiz();
    return quiz.questions[this.quizState.currentQuestionIndex] || quiz.questions[0];
  },

  selectOption(idx) {
    if (this.quizState.hasSubmitted) return;
    this.quizState.selectedOption = idx;
  },

  validerReponse() {
    if (this.quizState.selectedOption === null) return;
    const q = this.getCurrentQuestion();
    this.quizState.hasSubmitted = true;
    this.quizState.isCorrect = (this.quizState.selectedOption === q.reponse_correcte);

    if (this.quizState.isCorrect) {
      this.quizState.score += 10;
      this.user.xp += 15;
      this.tutorMood = 'happy';
      this.quizState.feedbackMessage = q.feedback_reussite;
      this.quizState.errorPattern = null;
      this.eleveCompetences['NUM-1.D6'] = 'acquis';
    } else {
      this.tutorMood = 'thinking';
      this.quizState.errorPattern = this.chapter.error_patterns[q.error_pattern_key] || null;
      this.quizState.feedbackMessage = "Pas tout à fait ! Regarde l'indice de notre tuteur.";
      this.eleveCompetences['NUM-1.D6'] = 'a_renforcer';
      if (this.quizState.errorPattern) {
        this.tutorMessage = `Attention : ${this.quizState.errorPattern.conseil_tuteur}`;
        this.tutorOpen = true;
      }
    }
  },

  questionSuivante() {
    const quiz = this.getCurrentQuiz();
    if (this.quizState.currentQuestionIndex < quiz.questions.length - 1) {
      this.quizState.currentQuestionIndex++;
      this.quizState.selectedOption = null;
      this.quizState.hasSubmitted = false;
      this.quizState.isCorrect = false;
      this.quizState.feedbackMessage = '';
      this.quizState.errorPattern = null;
    } else {
      alert(`Bravo ! Tu as terminé ce quiz avec ${this.quizState.score} points !`);
    }
  },

  // Gestion du Chat Tuteur Socratique (avec appel Cloud Function réel + fallback)
  async envoyerQuestionTuteur() {
    const q = this.studentQuestion.trim();
    if (!q || this.tutorLoading) return;

    this.tutorHistory.push({ sender: 'student', text: q });
    this.studentQuestion = '';
    this.tutorMood = 'thinking';
    this.tutorLoading = true;

    try {
      // Tentative d'appel réel à la Cloud Function Firebase
      const response = await interrogerTuteurIA(q, this.tutorHistory, this.selectedModuleId);
      if (response) {
        this.tutorHistory.push({ sender: 'bot', text: response });
        this.tutorMood = 'happy';
        this.tutorLoading = false;
        return;
      }
    } catch (e) {
      console.warn("Utilisation du moteur socratique local d'appoint", e);
    }

    // Moteur de secours local socratique spécialisé FMTTN 1re
    setTimeout(() => {
      let reponse = "C'est une excellente question pour débuter l'année ! Dans les consignes du livre @lt_X, que dit la règle sur le respect du matériel et de la vie privée ?";
      const lower = q.toLowerCase();
      if (lower.includes('mot de passe') || lower.includes('password')) {
        reponse = "Un bon mot de passe, c'est comme la clé de ta maison : au moins 10 caractères et surtout jamais '123456' ou 'azerty' ! Quelle phrase drôle pourrais-tu inventer pour t'en rappeler ?";
      } else if (lower.includes('deconnect') || lower.includes('fermer')) {
        reponse = "Attention ! Comme le dit le robot @lt_X : 'Fermer l'écran ≠ se déconnecter !'. Te souviens-tu des 4 étapes pour quitter l'ordinateur de l'école sans laisser de traces ?";
      } else if (lower.includes('cci') || lower.includes('cc')) {
        reponse = "Rappelle-toi : dans 'Cci', le deuxième 'i' veut dire 'Invisible'. Pourquoi est-ce important de cacher l'adresse de tes camarades quand tu écris à toute la classe ?";
      } else if (lower.includes('censure') || lower.includes('modération')) {
        reponse = "Demande-toi : est-ce qu'on enlève un message parce qu'il insulte quelqu'un (modération pour la sécurité), ou est-ce qu'on bloque un sujet sans raison (censure) ?";
      }
      this.tutorHistory.push({ sender: 'bot', text: reponse });
      this.tutorMood = 'happy';
      this.tutorLoading = false;
    }, 500);
  },

  genererRemediationProf() {
    this.remediationGenerated = true;
  }
}));

Alpine.start();
