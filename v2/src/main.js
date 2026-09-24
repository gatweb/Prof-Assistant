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
  getRealClassStudents,
  addRealStudent,
  updateStudentClassInDb,
  savePresentationConfig,
  interrogerTuteurIA 
} from './services/firebase.js';
import { AVAILABLE_CLASSES, ALLOWED_TEACHERS } from './services/teachers-config.js';

window.Alpine = Alpine;

Alpine.data('profAssistantApp', () => ({
  // Navigation
  selectedModuleId: 'module-0', // 'module-0' | 'escape-game' | 'ch1-communication'
  activeTab: 'decouvre',        // 'decouvre' | 'pratique' | 'maitrise' | 'cours' | 'prof'
  
  // Classes disponibles (Programme SeGEC : 1A, 1B, 1C, 1D...)
  availableClasses: AVAILABLE_CLASSES,

  // Données de cours FMTTN SeGEC
  module0: module0Data,
  chapter: chapterData,
  competences: competencesData.chapitres[0].competences,
  altxBank: altxBank,
  escapeGame: escapeGameData,

  // Diaporama de cours & Présentation NotebookLM
  activeSlideIndex: 0,
  notebooklmUrl: 'https://notebooklm.google.com',

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

  // Progression des compétences élève (Référentiel SeGEC)
  eleveCompetences: {
    'NUM-1.D1': 'acquis',
    'NUM-1.D5': 'en_cours',
    'NUM-1.D6': 'en_cours',
    'NUM-1.P2': 'a_renforcer'
  },

  // Auto-évaluation p.83 (Bilan personnel SeGEC)
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
    phishDigits: ['_', '_', '_', '_'],
    // Dossier 4 explorateur
    searchFile: '',
    selectedFile: null,
    // Dossier 5 associations
    dossier5Selections: {
      'histoire.docx': '',
      'paysage.png': '',
      'jingle.mp3': '',
      'expose.pptx': ''
    }
  },

  // Atelier Pratique : Simulateur de Courriel Professionnel (p. 64)
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

  // Tuteur Socratique IA (@lt_X)
  tutorOpen: false,
  tutorLoading: false,
  tutorMood: 'happy',
  tutorMessage: 'Salut ! Je suis ton assistant @lt_X. Pose-moi une question sur les exercices ou le cours.',
  tutorHistory: [
    { sender: 'bot', text: 'Bienvenue sur ProfAssistant FMTTN ! Tu peux me poser des questions sur la charte, les adresses email, la nétiquette ou les règles de sécurité.' }
  ],
  studentQuestion: '',

  // ==========================================
  // ESPACE ENSEIGNANT (PROGRAMME SEGEC)
  // ==========================================
  teacherAuth: {
    isTeacher: false,
    user: null,
    profile: null,
    loading: false,
    errorMsg: ''
  },
  modalLoginProfOpen: false,
  activeProfSubTab: 'matrice', // 'matrice' | 'eleves' | 'notebooklm'
  selectedTeacherClass: '1A',
  unsubscribeTeacherListener: null,
  firestoreSynced: false,
  remediationGenerated: false,

  // Gestion des élèves réels
  allClassStudents: [],
  searchStudentQuery: '',
  modalAddStudentOpen: false,
  newStudentData: {
    nom: '',
    classe: '1A',
    email: ''
  },

  // Élèves affichés dans la Matrice SeGEC
  classeEleves: [],

  // ==========================================
  // INITIALISATION
  // ==========================================
  async init() {
    console.log('ProfAssistant V2 initialisé — Aligné sur le programme SeGEC & FWB.');

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

    // 2. Initialisation silencieuse de la session élève
    await initStudentSession();

    // 3. Écoute de l'état d'authentification enseignant
    subscribeToAuthState((authStatus) => {
      this.teacherAuth.isTeacher = authStatus.isTeacher;
      this.teacherAuth.user = authStatus.user;
      this.teacherAuth.profile = authStatus.profile;

      if (authStatus.isTeacher) {
        console.log(`[Prof] Bienvenue ${authStatus.profile?.nom || authStatus.user?.email}`);
        if (authStatus.profile?.classes?.length) {
          this.selectedTeacherClass = authStatus.profile.classes[0];
        }
        this.activerEcouteClasse(this.selectedTeacherClass);
        this.chargerElevesReels();
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
  // GESTION DU PROFESSEUR & DONNÉES RÉELLES
  // ==========================================
  ouvrirEspaceProf() {
    if (this.teacherAuth.isTeacher) {
      this.activeTab = 'prof';
      this.activerEcouteClasse(this.selectedTeacherClass);
      this.chargerElevesReels();
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
      this.chargerElevesReels();
    } else if (res.reason === 'not_whitelisted') {
      this.teacherAuth.errorMsg = `L'adresse Google "${res.email}" n'est pas encore inscrite sur la liste blanche des professeurs autorisés. Contactez l'administrateur.`;
    } else {
      this.teacherAuth.errorMsg = `Erreur de connexion : ${res.error || 'Veuillez réessayer'}`;
    }
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

  // Métriques de Maîtrise SeGEC
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

  // ==========================================
  // JEU DE LA CHARTE (MODULE 0 - CORRIGÉ)
  // ==========================================
  getCurrentCharteSituation() {
    const situations = this.module0?.parties?.[1]?.situations || [];
    return situations[this.charteState.currentIndex] || { 
      id: "none", 
      scenario: "Théo termine son travail, se déconnecte de sa session et éteint l'écran de l'ordinateur.", 
      est_ok: true, 
      explication: "Bravo ! Théo respecte le matériel et protège ses données personnelles en fermant sa session." 
    };
  },

  repondreCharte(choice) {
    if (this.charteState.hasAnswered) return;
    const sit = this.getCurrentCharteSituation();
    this.charteState.userChoice = choice;
    this.charteState.hasAnswered = true;

    if (choice === sit.est_ok) {
      this.charteState.score += 10;
      this.user.xp += 15;
      this.tutorMood = 'happy';
    } else {
      this.tutorMood = 'thinking';
    }

    this.syncCurrentStudentProgress();
  },

  charteSuivante() {
    const situations = this.module0?.parties?.[1]?.situations || [];
    if (this.charteState.currentIndex < situations.length - 1) {
      this.charteState.currentIndex++;
      this.charteState.userChoice = null;
      this.charteState.hasAnswered = false;
    } else {
      this.charteState.finished = true;
      this.syncCurrentStudentProgress();
    }
  },

  situationCharteSuivante() {
    this.charteSuivante();
  },

  recommencerCharte() {
    this.charteState.currentIndex = 0;
    this.charteState.userChoice = null;
    this.charteState.hasAnswered = false;
    this.charteState.score = 0;
    this.charteState.finished = false;
  },

  reinitialiserCharte() {
    this.recommencerCharte();
  },

  // ==========================================
  // ESCAPE GAME (5 DOSSIERS - COMPLETS)
  // ==========================================
  clickPhishSusp(key, digit) {
    if (this.egState.foundPhish.has(key)) return;
    this.egState.foundPhish.add(key);
    const order = ['sender', 'urgent', 'password', 'link'];
    const map = { sender: '7', urgent: '3', password: '1', link: '9' };
    this.egState.phishDigits = order.map(k => this.egState.foundPhish.has(k) ? map[k] : '_');
  },

  // Dossier 4 : Explorateur de fichiers
  getFichiersServeurFiltres() {
    const list = this.escapeGame?.dossiers?.[3]?.fichiers_serveur || [];
    const q = (this.egState.searchFile || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter(f => 
      f.nom.toLowerCase().includes(q) || 
      f.proprio.toLowerCase().includes(q) || 
      f.type.toLowerCase().includes(q)
    );
  },

  selectionnerFichierDossier4(fichier) {
    this.egState.selectedFile = fichier;
    this.egState.inputCode = fichier.nom;
  },

  // Dossier 5 : Associations logiciels
  validerDossier5() {
    const sel = this.egState.dossier5Selections;
    const correct = (
      sel['histoire.docx'] === 'Traitement de texte' &&
      sel['paysage.png'] === 'Éditeur d\'image' &&
      sel['jingle.mp3'] === 'Lecteur audio' &&
      sel['expose.pptx'] === 'Logiciel de présentation'
    );

    if (correct) {
      this.egState.isSuccess = true;
      this.egState.feedback = 'Bravo ! Tu as associé chaque extension au bon outil numérique ! Dossier 5 restauré 🎉';
      this.egState.finished = true;
      this.user.xp += 50;
      this.syncCurrentStudentProgress();
    } else {
      this.egState.feedback = 'Certaines associations sont incorrectes. Vérifie : .docx pour le texte, .png pour l\'image, .mp3 pour le son et .pptx pour la présentation.';
    }
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
        this.egState.feedback = 'Fichier fantôme identifié avec succès (aurore.png) ! Dossier 4 (DONNÉES) déverrouillé.';
        this.user.xp += 25;
        this.debloquerDossierSuivant(5);
      } else {
        this.egState.feedback = 'Vérifie dans l\'explorateur : Image de Sam du 12/09 pesant plus de 5 Mo.';
      }
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
  // DIAPORAMA DE COURS & NOTEBOOKLM
  // ==========================================
  getCurrentModuleSlides() {
    if (this.selectedModuleId === 'module-0') {
      return this.module0?.support_cours?.slides || [];
    }
    return this.chapter?.support_cours?.slides || [];
  },

  getCurrentSlide() {
    const slides = this.getCurrentModuleSlides();
    return slides[this.activeSlideIndex] || slides[0] || { titre: "Présentation", contenu: "Support en cours de préparation." };
  },

  nextSlide() {
    const slides = this.getCurrentModuleSlides();
    if (this.activeSlideIndex < slides.length - 1) {
      this.activeSlideIndex++;
    } else {
      this.activeSlideIndex = 0;
    }
  },

  prevSlide() {
    const slides = this.getCurrentModuleSlides();
    if (this.activeSlideIndex > 0) {
      this.activeSlideIndex--;
    } else {
      this.activeSlideIndex = slides.length - 1;
    }
  },

  getNotebookLMUrl() {
    if (this.selectedModuleId === 'module-0') {
      return this.module0?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
    }
    return this.chapter?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
  },

  async sauvegarderNotebookLMConfig(moduleId, newUrl) {
    if (!newUrl) return;
    if (moduleId === 'module-0') {
      if (!this.module0.support_cours) this.module0.support_cours = {};
      this.module0.support_cours.notebooklm_url = newUrl;
    } else {
      if (!this.chapter.support_cours) this.chapter.support_cours = {};
      this.chapter.support_cours.notebooklm_url = newUrl;
    }
    await savePresentationConfig(moduleId, { notebooklm_url: newUrl });
    alert('Lien NotebookLM enregistré avec succès dans Firestore !');
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
      } else if (lower.includes('fantôme') || lower.includes('sam') || lower.includes('aurore')) {
        reponse = "Regarde dans l'explorateur du Dossier 4 : quel fichier appartient à Sam, date du 12/09 et pèse plus de 5 Mo ?";
      }
      this.tutorHistory.push({ sender: 'bot', text: reponse });
      this.tutorMood = 'happy';
      this.tutorLoading = false;
    }, 500);
  }
}));

Alpine.start();
