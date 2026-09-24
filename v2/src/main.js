import './style.css';
import Alpine from 'alpinejs';
import chapterData from './data/chapitre-1-communication.json';
import competencesData from './data/competences-fmttn.json';
import module0Data from './data/module-0-introduction.json';
import altxBank from './data/altx-bank.json';
import escapeGameData from './data/escape-game-data.json';
import { 
  initStudentSession, 
  loginProfesseurGoogle, 
  logoutProfesseur, 
  subscribeToAuthState, 
  saveEleveProgression, 
  listenToClasseProgressions, 
  seedDemoClassData, 
  interrogerTuteurIA 
} from './services/firebase.js';
import { AVAILABLE_CLASSES, ALLOWED_TEACHERS } from './services/teachers-config.js';

window.Alpine = Alpine;

Alpine.data('profAssistantApp', () => ({
  // Navigation
  selectedModuleId: 'module-0', // 'module-0' | 'escape-game' | 'ch1-communication'
  activeTab: 'decouvre',        // 'decouvre' | 'pratique' | 'maitrise' | 'competences' | 'prof'
  
  // Classes disponibles (1A, 1B, 1C, 1D...)
  availableClasses: AVAILABLE_CLASSES,

  // Données de cours FMTTN
  module0: module0Data,
  chapter: chapterData,
  competences: competencesData.chapitres[0].competences,
  altxBank: altxBank,
  escapeGame: escapeGameData,

  // Sous-thème actif dans "Je découvre" (comm)
  activeSubthemeKey: 'reseaux', // 'reseaux' | 'messagerie' | 'ethique' | 'collaboration'
  bankQuestionIndex: 0,
  bankUserSelection: null,
  bankSubmitted: false,
  bankIsCorrect: false,
  bankScore: 0,

  // Profil Élève (Sauvegardé en local pour éviter les ressaisies)
  user: {
    id: 'el_' + Math.random().toString(36).substring(2, 8),
    nom: 'Lucas M.',
    classe: '1A',
    xp: 180,
    avatar: 'robot'
  },

  // Progression des compétences élève
  eleveCompetences: {
    'NUM-1.D1': 'acquis',
    'NUM-1.D5': 'en_cours',
    'NUM-1.D6': 'en_cours',
    'NUM-1.P2': 'a_renforcer'
  },

  // Auto-évaluation p.83 (Bilan personnel)
  bilanPersonnel: {
    'NUM-1.D1': 'bien',
    'NUM-1.D5': 'moyen',
    'NUM-1.D6': 'bien',
    'NUM-1.P2': 'moyen',
    'NUM-1.P9': 'moyen'
  },

  // Jeu de la Charte (Module 0)
  charteState: {
    currentIndex: 0,
    userChoice: null,
    hasAnswered: false,
    score: 0,
    finished: false
  },

  // Escape Game de rentrée (5 Dossiers)
  egState: {
    teamName: 'Équipe Nexus',
    activeDossier: 1, // 1 to 5
    dossierUnlocked: [1],
    inputCode: '',
    feedback: '',
    isSuccess: false,
    timer: '38:42',
    finished: false,
    // Dossier 2 anomalies
    foundPhish: new Set(),
    phishDigits: ['_', '_', '_', '_']
  },

  // Atelier Pratique : Simulateur de Courriel (p. 64)
  emailSim: {
    destinataire: 'secretariat@ecole.be',
    cc: '',
    cci: 'direction@ecole.be, professeur@ecole.be',
    objet: 'Demande de renseignement concernant la sortie scolaire',
    corps: 'Bonjour Madame, Monsieur,\n\nJe vous écris pour savoir à quelle heure est prévu le retour de la visite vendredi.\n\nEn vous remerciant d\'avance,\nCordialement,\nLucas Moreau (1A)',
    hasAttachment: false,
    validationResults: null
  },

  // Mission Créative "Je maîtrise" (p. 84)
  missionApp: {
    nom: 'ClasseConnect 1A',
    cible: 'Élèves et professeurs de l\'école pour les devoirs',
    fonctionUnique: 'Mode silence qui bloque les notifications de jeux pendant les révisions de 17h à 19h.',
    reglesUsage: 'Respect absolu de la vie privée, interdiction de partager les photos sans accord écrit, modération bienveillante.',
    isSubmitted: false,
    aiFeedback: ''
  },

  // Tuteur Socratique IA
  tutorOpen: false,
  tutorLoading: false,
  tutorMood: 'happy',
  tutorMessage: 'Salut ! Je suis ton assistant @lt_X. Pose-moi une question sur les exercices ou le cours.',
  tutorHistory: [
    { sender: 'bot', text: 'Bienvenue sur ProfAssistant FMTTN ! Tu peux me poser des questions sur la charte, les adresses email, la nétiquette ou les règles de sécurité.' }
  ],
  studentQuestion: '',

  // ==========================================
  // ESPACE ENSEIGNANT (ed.ai) & AUTHENTIFICATION
  // ==========================================
  teacherAuth: {
    isTeacher: false,
    user: null,
    profile: null,
    loading: false,
    errorMsg: ''
  },
  modalLoginProfOpen: false,
  selectedTeacherClass: '1A',
  unsubscribeTeacherListener: null,
  firestoreSynced: false,
  remediationGenerated: false,

  // Données de classe affichées dans la heatmap ed.ai
  classeEleves: [
    { id: 1, nom: 'Lucas M.', eg: '5/5', charte: 'acquis', d5: 'en_cours', d6: 'en_cours', p2: 'a_renforcer', score: 75 },
    { id: 2, nom: 'Emma B.', eg: '5/5', charte: 'acquis', d5: 'acquis', d6: 'acquis', p2: 'acquis', score: 98 },
    { id: 3, nom: 'Youssef K.', eg: '4/5', charte: 'acquis', d5: 'acquis', d6: 'en_cours', p2: 'en_cours', score: 82 },
    { id: 4, nom: 'Camille D.', eg: '3/5', charte: 'en_cours', d5: 'a_renforcer', d6: 'a_renforcer', p2: 'a_renforcer', score: 48 },
    { id: 5, nom: 'Noah V.', eg: '5/5', charte: 'acquis', d5: 'acquis', d6: 'acquis', p2: 'en_cours', score: 88 },
    { id: 6, nom: 'Léa S.', eg: '5/5', charte: 'acquis', d5: 'en_cours', d6: 'acquis', p2: 'acquis', score: 92 }
  ],

  // ==========================================
  // INITIALISATION
  // ==========================================
  async init() {
    console.log('ProfAssistant V2 initialisé avec l\'écosystème complet @lt_X et ed.ai.');

    // 1. Récupération du profil élève en local
    const savedUser = localStorage.getItem('profassistant_student');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.nom && parsed.classe) {
          this.user = { ...this.user, ...parsed };
        }
      } catch (e) {
        console.warn('Erreur lecture profil local', e);
      }
    }

    // 2. Initialisation silencieuse de la session élève (Firebase Auth Anonymous)
    await initStudentSession();

    // 3. Écoute de l'état d'authentification enseignant
    subscribeToAuthState((authStatus) => {
      this.teacherAuth.isTeacher = authStatus.isTeacher;
      this.teacherAuth.user = authStatus.user;
      this.teacherAuth.profile = authStatus.profile;

      if (authStatus.isTeacher) {
        console.log(`[Prof] Bienvenue ${authStatus.profile?.nom || authStatus.user?.email}`);
        // Synchronisation automatique de la classe active de l'enseignant
        if (authStatus.profile?.classes?.length) {
          this.selectedTeacherClass = authStatus.profile.classes[0];
        }
        this.activerEcouteClasse(this.selectedTeacherClass);
      } else {
        if (this.unsubscribeTeacherListener) {
          this.unsubscribeTeacherListener();
          this.unsubscribeTeacherListener = null;
        }
      }
    });

    // 4. Première synchronisation de la progression de l'élève
    this.syncCurrentStudentProgress();
  },

  // ==========================================
  // GESTION DU PROFIL ÉLÈVE & PERSISTANCE
  // ==========================================
  updateStudentProfile(newNom, newClasse) {
    if (newNom) this.user.nom = newNom.trim();
    if (newClasse) this.user.classe = newClasse;
    
    localStorage.setItem('profassistant_student', JSON.stringify({
      id: this.user.id,
      nom: this.user.nom,
      classe: this.user.classe,
      xp: this.user.xp
    }));

    this.syncCurrentStudentProgress();
  },

  async syncCurrentStudentProgress() {
    const dataToSave = {
      nom: this.user.nom,
      classe: this.user.classe,
      xp: this.user.xp,
      competences: this.eleveCompetences,
      bilan_personnel: this.bilanPersonnel,
      charte: {
        score: this.charteState.score,
        finished: this.charteState.finished
      },
      escape_game: {
        activeDossier: this.egState.activeDossier,
        dossierUnlocked: this.egState.dossierUnlocked,
        finished: this.egState.finished
      },
      email_sim: {
        validationResults: this.emailSim.validationResults
      },
      mission_app: {
        isSubmitted: this.missionApp.isSubmitted
      }
    };

    await saveEleveProgression(this.user.classe, this.user.id, dataToSave);
  },

  // ==========================================
  // GESTION DU PROFESSEUR (AUTH & CLASSES)
  // ==========================================
  ouvrirEspaceProf() {
    if (this.teacherAuth.isTeacher) {
      this.activeTab = 'prof';
      this.activerEcouteClasse(this.selectedTeacherClass);
    } else {
      this.modalLoginProfOpen = true;
      this.teacherAuth.errorMsg = '';
    }
  },

  async connexionProfesseurGoogle() {
    this.teacherAuth.loading = true;
    this.teacherAuth.errorMsg = '';

    const res = await loginProfesseurGoogle();
    this.teacherAuth.loading = false;

    if (res.success) {
      this.modalLoginProfOpen = false;
      this.activeTab = 'prof';
      this.activerEcouteClasse(this.selectedTeacherClass);
    } else if (res.reason === 'not_whitelisted') {
      this.teacherAuth.errorMsg = `L'adresse Google "${res.email}" n'est pas encore inscrite sur la liste blanche des professeurs autorisés. Contactez l'administrateur.`;
    } else {
      this.teacherAuth.errorMsg = `Erreur de connexion : ${res.error || 'Veuillez réessayer'}`;
    }
  },

  activerModeDemoProf() {
    // Mode secours présentation (déverrouille la vue ed.ai même sans compte Google)
    this.teacherAuth.isTeacher = true;
    this.teacherAuth.profile = {
      nom: "Professeur Invité (Démo Samedi)",
      classes: this.availableClasses,
      role: "enseignant"
    };
    this.modalLoginProfOpen = false;
    this.activeTab = 'prof';
  },

  async deconnexionProfesseur() {
    await logoutProfesseur();
    this.teacherAuth.isTeacher = false;
    this.teacherAuth.user = null;
    this.teacherAuth.profile = null;
    this.activeTab = 'decouvre';
  },

  changerClasseEnseignant(newClass) {
    this.selectedTeacherClass = newClass;
    this.activerEcouteClasse(newClass);
  },

  activerEcouteClasse(classeId) {
    if (this.unsubscribeTeacherListener) {
      this.unsubscribeTeacherListener();
    }

    this.firestoreSynced = false;
    this.unsubscribeTeacherListener = listenToClasseProgressions(classeId, (eleves) => {
      if (eleves && eleves.length > 0) {
        this.classeEleves = eleves;
        this.firestoreSynced = true;
      } else {
        // Si la classe est vide dans Firestore, conserver des élèves démo ou permettre de les injecter
        this.firestoreSynced = false;
      }
    });
  },

  async injecterDonneesDemoClasse() {
    await seedDemoClassData(this.selectedTeacherClass);
    alert(`6 élèves de démonstration avec progression réaliste ont été injectés dans la classe ${this.selectedTeacherClass} !`);
  },

  // Métriques ed.ai calculées dynamiquement
  getProgressionMoyenneClasse() {
    if (!this.classeEleves || this.classeEleves.length === 0) return 0;
    const total = this.classeEleves.reduce((acc, el) => acc + (el.score || 0), 0);
    return Math.round(total / this.classeEleves.length);
  },

  getNbElevesTermineEG() {
    if (!this.classeEleves) return 0;
    return this.classeEleves.filter(el => el.eg === "5/5").length;
  },

  // ==========================================
  // BANQUE DE QUESTIONS @lt_X
  // ==========================================
  getActiveSubtheme() {
    return this.altxBank.comm[this.activeSubthemeKey] || this.altxBank.comm.reseaux;
  },

  getCurrentBankQuestion() {
    const st = this.getActiveSubtheme();
    return st.questions[this.bankQuestionIndex] || st.questions[0];
  },

  selectBankChoice(choice) {
    if (this.bankSubmitted) return;
    this.bankUserSelection = choice;
  },

  validerBankReponse() {
    if (!this.bankUserSelection) return;
    const q = this.getCurrentBankQuestion();
    this.bankSubmitted = true;
    this.bankIsCorrect = (this.bankUserSelection === q.rep);

    if (this.bankIsCorrect) {
      this.bankScore += 10;
      this.user.xp += 10;
      this.tutorMood = 'happy';
    } else {
      this.tutorMood = 'thinking';
    }

    this.syncCurrentStudentProgress();
  },

  bankQuestionSuivante() {
    const st = this.getActiveSubtheme();
    if (this.bankQuestionIndex < st.questions.length - 1) {
      this.bankQuestionIndex++;
      this.bankUserSelection = null;
      this.bankSubmitted = false;
      this.bankIsCorrect = false;
    } else {
      alert(`Entraînement terminé ! Score : ${this.bankScore} points.`);
      this.bankQuestionIndex = 0;
      this.bankUserSelection = null;
      this.bankSubmitted = false;
    }
  },

  changeSubtheme(key) {
    this.activeSubthemeKey = key;
    this.bankQuestionIndex = 0;
    this.bankUserSelection = null;
    this.bankSubmitted = false;
    this.bankIsCorrect = false;
  },

  // ==========================================
  // JEU DE LA CHARTE (MODULE 0)
  // ==========================================
  repondreCharte(choice) {
    if (this.charteState.hasAnswered) return;
    this.charteState.userChoice = choice;
    this.charteState.hasAnswered = true;
    const item = this.module0.charte_interactif[this.charteState.currentIndex];
    
    if (choice === item.rep) {
      this.charteState.score++;
      this.user.xp += 15;
    }

    this.syncCurrentStudentProgress();
  },

  charteSuivante() {
    if (this.charteState.currentIndex < this.module0.charte_interactif.length - 1) {
      this.charteState.currentIndex++;
      this.charteState.userChoice = null;
      this.charteState.hasAnswered = false;
    } else {
      this.charteState.finished = true;
      this.syncCurrentStudentProgress();
    }
  },

  recommencerCharte() {
    this.charteState.currentIndex = 0;
    this.charteState.userChoice = null;
    this.charteState.hasAnswered = false;
    this.charteState.score = 0;
    this.charteState.finished = false;
  },

  // ==========================================
  // ESCAPE GAME (5 DOSSIERS)
  // ==========================================
  clickPhishSusp(key, digit) {
    if (this.egState.foundPhish.has(key)) return;
    this.egState.foundPhish.add(key);
    const order = ['sender', 'urgent', 'password', 'link'];
    const map = { sender: '7', urgent: '3', password: '1', link: '9' };
    this.egState.phishDigits = order.map(k => this.egState.foundPhish.has(k) ? map[k] : '_');
  },

  validerCodeDossier() {
    const code = this.egState.inputCode.trim().toUpperCase().replace(/\s/g, '');
    const current = this.egState.activeDossier;

    if (current === 1) {
      if (code === 'COMMUNIQUER') {
        this.egState.isSuccess = true;
        this.egState.feedback = 'Bravo ! Le Dossier 1 (COMMUNICATION) est déverrouillé !';
        this.user.xp += 25;
        this.debloquerDossierSuivant(2);
      } else {
        this.egState.feedback = 'Code incorrect. Indice : assemble les 2 parties ("COMM" du chat + radio morse "UNIQUER").';
      }
    } else if (current === 2) {
      if (code === '7319') {
        this.egState.isSuccess = true;
        this.egState.feedback = 'Alerte neutralisée ! Le Dossier 2 (SÉCURITÉ) est déverrouillé !';
        this.user.xp += 25;
        this.debloquerDossierSuivant(3);
      } else {
        this.egState.feedback = 'Code erroné. Repère les 4 indices suspects dans le mail de phishing.';
      }
    } else if (current === 3) {
      if (code === 'FER') {
        this.egState.isSuccess = true;
        this.egState.feedback = 'Exact ! L\'Atomium est un cristal de fer, pas de cuivre ! Dossier 3 (IA) débloqué.';
        this.user.xp += 25;
        this.debloquerDossierSuivant(4);
      } else {
        this.egState.feedback = 'Indice : quel matériau compose réellement le cristal de l\'Atomium ?';
      }
    } else if (current === 4) {
      if (code === 'AURORE.PNG' || code === 'AURORE') {
        this.egState.isSuccess = true;
        this.egState.feedback = 'Fichier fantôme identifié ! Dossier 4 (DONNÉES) déverrouillé.';
        this.user.xp += 25;
        this.debloquerDossierSuivant(5);
      } else {
        this.egState.feedback = 'Vérifie : Image de Sam du 12/09 de plus de 5 Mo.';
      }
    } else if (current === 5) {
      this.egState.isSuccess = true;
      this.egState.feedback = 'Félicitations ! Les 5 dossiers ont été restaurés avec succès ! 🎉';
      this.egState.finished = true;
      this.user.xp += 50;
      this.syncCurrentStudentProgress();
    }
  },

  debloquerDossierSuivant(num) {
    if (!this.egState.dossierUnlocked.includes(num)) {
      this.egState.dossierUnlocked.push(num);
    }
    this.syncCurrentStudentProgress();

    setTimeout(() => {
      this.egState.activeDossier = num;
      this.egState.inputCode = '';
      this.egState.feedback = '';
      this.egState.isSuccess = false;
    }, 1500);
  },

  // ==========================================
  // ATELIER SIMULATEUR DE COURRIEL (P. 64)
  // ==========================================
  analyserEmailSimule() {
    const text = this.emailSim.corps.toLowerCase();
    const obj = this.emailSim.objet.trim();
    const cci = this.emailSim.cci.trim();

    const results = {
      objetOk: obj.length >= 5 && obj.length <= 80,
      politesseDebut: text.includes('bonjour') || text.includes('madame') || text.includes('monsieur') || text.includes('cher'),
      politesseFin: text.includes('cordialement') || text.includes('salutations') || text.includes('bien à vous') || text.includes('merci'),
      signature: text.includes(this.user.nom.toLowerCase().split(' ')[0]) || text.includes('moreau') || text.includes(this.user.classe.toLowerCase()),
      cciProtege: cci.includes('@'),
      pasMajuscules: !/[A-Z]{8,}/.test(this.emailSim.corps)
    };

    results.scoreGlobal = Object.values(results).filter(Boolean).length;
    this.emailSim.validationResults = results;

    if (results.scoreGlobal >= 5) {
      this.eleveCompetences['NUM-1.P2'] = 'acquis';
      this.user.xp += 20;
    } else {
      this.eleveCompetences['NUM-1.P2'] = 'en_cours';
    }

    this.syncCurrentStudentProgress();
  },

  // ==========================================
  // AUTO-ÉVALUATION BILAN PERSONNEL (P. 83)
  // ==========================================
  setBilanItem(code, niveau) {
    this.bilanPersonnel[code] = niveau;
    this.syncCurrentStudentProgress();
  },

  // ==========================================
  // MISSION CRÉATIVE (PAGE 84)
  // ==========================================
  soumettreMissionApp() {
    this.missionApp.isSubmitted = true;
    this.missionApp.aiFeedback = `Excellente proposition pour ton outil "${this.missionApp.nom}" ! L'idée du ${this.missionApp.fonctionUnique} répond parfaitement à l'objectif de concentration numérique. Tes règles d'éthique sont claires et conformes à la nétiquette @lt_X. Ton professeur a reçu ton travail pour validation.`;
    this.user.xp += 30;
    this.syncCurrentStudentProgress();
  },

  // ==========================================
  // TUTEUR SOCRATIQUE IA
  // ==========================================
  async envoyerQuestionTuteur() {
    const q = this.studentQuestion.trim();
    if (!q || this.tutorLoading) return;

    this.tutorHistory.push({ sender: 'student', text: q });
    this.studentQuestion = '';
    this.tutorMood = 'thinking';
    this.tutorLoading = true;

    try {
      const response = await interrogerTuteurIA(q, this.tutorHistory, this.selectedModuleId);
      if (response) {
        this.tutorHistory.push({ sender: 'bot', text: response });
        this.tutorMood = 'happy';
        this.tutorLoading = false;
        return;
      }
    } catch (e) {
      console.warn("Utilisation du moteur de secours local", e);
    }

    setTimeout(() => {
      let reponse = "Très bonne question ! As-tu vérifié les critères du manuel @lt_X pour ce module ?";
      const lower = q.toLowerCase();
      if (lower.includes('cci') || lower.includes('cc')) {
        reponse = "Rappelle-toi de l'astuce : 'Cci' = Invisible ! Si tu écris à 25 personnes, pourquoi ne doivent-elles pas voir les adresses de tout le monde ?";
      } else if (lower.includes('censure') || lower.includes('modération')) {
        reponse = "Pense à la règle : supprimer un message haineux ou insultant, c'est de la sécurité (modération). Bloquer une opinion légitime, c'est de la censure.";
      } else if (lower.includes('morse') || lower.includes('code')) {
        reponse = "Pour le Dossier 1 de l'Escape Game : assemble 'COMM' (du chat) avec la traduction morse 'UNIQUER' !";
      } else if (lower.includes('atomium')) {
        reponse = "Vérifie les archives de l'Atomium : est-ce vraiment du cuivre ou du fer ?";
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
