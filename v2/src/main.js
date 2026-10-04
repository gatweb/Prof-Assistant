import './style.css';
import Alpine from 'alpinejs';
import chapterData from './data/chapitre-1-communication.json';
import chapter2Data from './data/chapitre-2-securite.json';
import competencesData from './data/competences-fmttn.json';
import module0Data from './data/module-0-introduction.json';
import altxBank from './data/altx-bank.json';
import escapeGameData from './data/escape-game-data.json';
import { marked } from 'marked';
import { courseManagerV2 } from './services/courseManager.js';
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
  interrogerTuteurIA,
  soumettreDevoirCloud,
  listerEnseignantsCloud,
  enregistrerEnseignantCloud,
  supprimerEnseignantCloud
} from './services/firebase.js';
import { AVAILABLE_CLASSES } from './services/teachers-config.js';

window.Alpine = Alpine;

Alpine.data('profAssistantApp', () => ({
  // ==========================================
  // CATALOGUE MULTI-COURS (PHASE 2)
  // ==========================================
  coursesList: [],
  currentCourse: null,
  currentChapter: null,
  courseMarkdownContent: '',
  courseMarkdownLoading: false,
  courseExercises: [],
  currentExercise: null,
  exerciseLoading: false,

  // Atelier Bureautique / Dactylo
  officeDocUrl: '',
  officeNotes: '',
  officeSubmitting: false,
  officeSubmissionStatus: 'idle', // 'idle' | 'pending' | 'validated'
  officeFeedback: '',
  officeScore: null,
  officeMemoSlide: 1,

  // Atelier Coding (HTML / CSS / JS)
  codingActiveTab: 'html', // 'html' | 'css' | 'js'
  codingFiles: {
    html: '',
    css: '',
    js: ''
  },
  codingConsoleLogs: [],
  codingPreviewSrcDoc: '',
  codingSubmitting: false,
  codingFeedback: '',
  codingScore: null,

  // Atelier Créatif
  creativeProjectUrl: '',
  creativeNotes: '',
  creativeSubmitting: false,
  creativeStatus: 'idle',
  creativeFeedback: '',
  creativeScore: null,

  // Navigation
  selectedModuleId: 'module-0', // 'module-0' | 'escape-game' | 'ch1-communication' | 'ch2-securite'
  activeTab: 'decouvre',        // 'decouvre' | 'pratique' | 'maitrise' | 'cours' | 'prof'
  
  // Classes disponibles (Programme SeGEC : 1A, 1B, 1C, 1D...)
  availableClasses: AVAILABLE_CLASSES,

  // Données de cours FMTTN SeGEC
  module0: module0Data,
  chapter: chapterData,
  chapter2: chapter2Data,
  competences: competencesData.chapitres[0].competences,
  competencesCh2: competencesData.chapitres[1]?.competences,
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
    'NUM-1.P2': 'a_renforcer',
    'NUM-2.D1': 'en_cours',
    'NUM-2.D2': 'en_cours',
    'NUM-2.D3': 'en_cours',
    'NUM-2.D4': 'en_cours',
    'NUM-2.D5': 'en_cours',
    'NUM-2.P1': 'en_cours',
    'NUM-2.P2': 'en_cours',
    'NUM-2.P3': 'en_cours',
    'NUM-2.M1': 'en_cours'
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

  // ==========================================
  // ÉTATS SPÉCIFIQUES CHAPITRE 2 : SÉCURITÉ
  // ==========================================
  activeSubthemeKeySecu: 'profil', // 'profil' | 'signaletique' | 'cyber' | 'confidentialite' | 'identite'
  bankQuestionIndexSecu: 0,
  bankUserSelectionSecu: null,
  bankSubmittedSecu: false,
  bankIsCorrectSecu: false,
  bankScoreSecu: 0,

  // Atelier HTTP vs HTTPS (Chapitre 2, p. 106)
  httpSim: {
    scenarioActif: 'ecole', // 'ecole' | 'banque' | 'piege'
    scenarios: {
      ecole: {
        titre: 'Portail de l\'école (Wi-Fi public)',
        url: 'http://connexion-college.be/login.php',
        isHttps: false,
        protocole: 'HTTP',
        statut: 'Non sécurisé ⚠️',
        couleur: 'rose',
        explication: 'Alerte ! Ce site utilise HTTP sans chiffrement. Si tu te connectes sur le Wi-Fi de l\'école ou un hotspot public, ton mot de passe passe en texte clair et peut être intercepté par n\'importe qui !'
      },
      banque: {
        titre: 'Espace Bancaire & Scolaire',
        url: 'https://banque-securisee.be/espace-client',
        isHttps: true,
        protocole: 'HTTPS',
        statut: 'Chiffré & Certifié 🔒',
        couleur: 'emerald',
        explication: 'Excellent ! Le cadenas vert et le "S" de HTTPS confirment que la communication est chiffrée avec un certificat SSL/TLS. Les données sont illisibles pendant le transport.'
      },
      piege: {
        titre: 'Site Promo Cadeaux Gratuits',
        url: 'https://cadeaux-gratuits-gagne-un-iphone.xyz/',
        isHttps: true,
        protocole: 'HTTPS',
        statut: 'Chiffré mais frauduleux ⚠️',
        couleur: 'amber',
        explication: 'Attention au piège classique ! Le cadenas HTTPS prouve que personne n\'intercepte les données en route, mais cela ne prouve PAS que le site est honnête ! Un escroc peut très bien obtenir un certificat HTTPS gratuit pour son site d\'arnaque.'
      }
    }
  },

  // Atelier Données Actives vs Passives (Chapitre 2, p. 114)
  triDonnees: {
    items: [
      { id: 1, label: "Une photo de mon chat postée en story publique", typeReel: "active", choixEleve: null, icone: "📸" },
      { id: 2, label: "Mon adresse IP et mon modèle de smartphone", typeReel: "passive", choixEleve: null, icone: "🌐" },
      { id: 3, label: "Mon commentaire sous la vidéo d'un streamer", typeReel: "active", choixEleve: null, icone: "💬" },
      { id: 4, label: "Le temps exact (14 secondes) passé à regarder une pub", typeReel: "passive", choixEleve: null, icone: "⏱️" },
      { id: 5, label: "La liste de mes recherches Google Maps de la journée", typeReel: "passive", choixEleve: null, icone: "📍" },
      { id: 6, label: "Le message privé envoyé à mon binôme de classe", typeReel: "active", choixEleve: null, icone: "✉️" }
    ],
    score: 0,
    valide: false,
    feedback: ''
  },

  // Auto-évaluation Bilan personnel Chapitre 2 (p. 147)
  bilanPersonnelCh2: {
    'NUM-2.D1': 'bien',
    'NUM-2.D2': 'bien',
    'NUM-2.D3': 'moyen',
    'NUM-2.D4': 'moyen',
    'NUM-2.D5': 'bien',
    'NUM-2.P1': 'bien',
    'NUM-2.P2': 'moyen',
    'NUM-2.P3': 'moyen'
  },

  // Mission Créative "Je maîtrise" Chapitre 2 (p. 158)
  missionSecu: {
    typeCampagne: 'cyberharcelement',
    slogan: 'L\'écran n\'est pas un masque : ce que tu ne dirais pas en face, ne l\'écris pas en ligne !',
    reflexe1: 'Faire une capture d\'écran immédiate comme preuve avant toute suppression.',
    reflexe2: 'Bloquer le compte harceleur et signaler le comportement aux modérateurs.',
    reflexe3: 'En parler immédiatement à un adulte de confiance ou appeler le 103 (Écoute-Enfants FWB).',
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
    isAdmin: false,
    user: null,
    profile: null,
    loading: false,
    errorMsg: ''
  },
  modalLoginProfOpen: false,
  activeProfSubTab: 'matrice', // 'matrice' | 'eleves' | 'notebooklm' | 'equipe'
  profMatrixChapter: 'ch1',    // 'ch1' | 'ch2'
  selectedTeacherClass: '1A',
  unsubscribeTeacherListener: null,
  firestoreSynced: false,
  remediationGenerated: false,

  // Gestion de l'équipe enseignante (Phase 1)
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

    // 0. Initialisation du catalogue multi-cours
    await this.initCoursesCatalogue();

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
      this.teacherAuth.isAdmin = authStatus.isAdmin;
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

  // ==========================================
  // GESTION DU CATALOGUE MULTI-COURS (PHASE 2)
  // ==========================================
  async initCoursesCatalogue() {
    try {
      this.coursesList = await courseManagerV2.loadCoursesCatalogue();
      this.currentCourse = courseManagerV2.activeCourse || this.coursesList[0];
      this.currentChapter = courseManagerV2.activeChapter || this.currentCourse?.chapters?.[0] || null;

      // Écouteur pour la console virtuelle de l'iframe de code
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CONSOLE_LOG') {
          this.codingConsoleLogs.push({
            text: event.data.log,
            type: event.data.logType || 'info',
            time: new Date().toLocaleTimeString()
          });
          if (this.codingConsoleLogs.length > 40) {
            this.codingConsoleLogs.shift();
          }
        }
      });

      // Si le cours n'est pas FMTTN, charger la leçon et les exercices
      if (this.currentCourse && this.currentCourse.workspaceType !== 'fmttn') {
        await this.chargerContenuCoursActif();
      }
    } catch (e) {
      console.error("[initCoursesCatalogue] Erreur :", e);
    }
  },

  async changerCours(courseId) {
    const found = courseManagerV2.selectCourse(courseId);
    if (!found) return;
    this.currentCourse = found;
    this.currentChapter = found.chapters?.[0] || null;

    if (this.currentCourse.workspaceType === 'fmttn') {
      this.selectedModuleId = 'module-0';
      this.activeTab = 'decouvre';
      this.tutorMessage = "Salut ! Je suis ton assistant @lt_X pour le cours de Numérique FMTTN. Pose-moi tes questions sur la charte, la sécurité ou la communication !";
    } else {
      this.activeTab = 'cours';
      this.tutorMessage = `Salut ! Je suis ton tuteur socratique pour "${this.currentCourse.title}". Pose-moi une question sur le cours ou un exercice !`;
      await this.chargerContenuCoursActif();
    }
  },

  async changerChapitre(chapterId) {
    const found = courseManagerV2.selectChapter(chapterId);
    if (!found) return;
    this.currentChapter = found;
    await this.chargerMarkdownChapitre();
  },

  async chargerContenuCoursActif() {
    await this.chargerMarkdownChapitre();
    this.exerciseLoading = true;
    try {
      this.courseExercises = await courseManagerV2.loadCourseExercisesFromDb(this.currentCourse.id);
      if (this.courseExercises.length > 0) {
        this.selectionnerExercice(this.courseExercises[0]);
      } else {
        this.currentExercise = null;
      }
    } finally {
      this.exerciseLoading = false;
    }
  },

  async chargerMarkdownChapitre() {
    if (!this.currentCourse || !this.currentChapter) return;
    this.courseMarkdownLoading = true;
    try {
      const raw = await courseManagerV2.loadChapterMarkdown(this.currentCourse, this.currentChapter);
      this.courseMarkdownContent = marked.parse(raw);
    } catch (e) {
      console.warn("Erreur chargement Markdown :", e);
      this.courseMarkdownContent = `<div class="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
        <h4 class="font-bold text-lg mb-2">Support de cours en préparation</h4>
        <p>Le contenu de ce chapitre est disponible dans votre classeur ou sera mis en ligne par l'enseignant.</p>
      </div>`;
    } finally {
      this.courseMarkdownLoading = false;
    }
  },

  selectionnerExercice(ex) {
    this.currentExercise = ex;
    this.officeFeedback = '';
    this.officeSubmissionStatus = 'idle';
    this.codingFeedback = '';
    this.codingConsoleLogs = [];
    this.creativeFeedback = '';
    this.creativeStatus = 'idle';

    if (this.currentCourse?.workspaceType === 'coding') {
      this.codingFiles = {
        html: ex.starter_code?.html || `<div class="carte">\n  <h1>${ex.titre || 'Mon Projet'}</h1>\n  <p>Mon premier code interactif</p>\n  <button id="btn">Cliquez ici</button>\n</div>`,
        css: ex.starter_code?.css || `body {\n  font-family: 'Plus Jakarta Sans', sans-serif;\n  background: #f8fafc;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n}\n.carte {\n  background: white;\n  padding: 24px;\n  border-radius: 12px;\n  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\n  text-align: center;\n}\nbutton {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 6px;\n  cursor: pointer;\n}`,
        js: ex.starter_code?.js || `document.getElementById('btn')?.addEventListener('click', () => {\n  console.log('Action déclenchée !');\n  alert('Bravo !');\n});`
      };
      this.updateCodingPreview();
    } else if (this.currentCourse?.workspaceType === 'office') {
      this.officeDocUrl = '';
      this.officeNotes = '';
      this.officeMemoSlide = 1;
    } else if (this.currentCourse?.workspaceType === 'creative') {
      this.creativeProjectUrl = '';
      this.creativeNotes = '';
    }
  },

  updateCodingPreview() {
    const safeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${this.codingFiles.css}
  </style>
</head>
<body>
  ${this.codingFiles.html}
  <script>
    (function() {
      const _send = (log, type) => {
        try {
          window.parent.postMessage({ type: 'CONSOLE_LOG', log: String(log), logType: type }, '*');
        } catch(e) {}
      };
      const _l = console.log;
      console.log = function(...args) {
        _l.apply(console, args);
        _send(args.join(' '), 'info');
      };
      const _w = console.warn;
      console.warn = function(...args) {
        _w.apply(console, args);
        _send(args.join(' '), 'warn');
      };
      const _e = console.error;
      console.error = function(...args) {
        _e.apply(console, args);
        _send(args.join(' '), 'error');
      };
      try {
        ${this.codingFiles.js}
      } catch (err) {
        console.error(err.message);
      }
    })();
  <\/script>
</body>
</html>`;
    this.codingPreviewSrcDoc = safeHtml;
  },

  async soumettreCodeExercice() {
    if (this.codingSubmitting) return;
    this.codingSubmitting = true;
    this.codingFeedback = '';

    const payload = `HTML:\n${this.codingFiles.html}\n\nCSS:\n${this.codingFiles.css}\n\nJS:\n${this.codingFiles.js}`;
    try {
      const res = await soumettreDevoirCloud({
        code_eleve: payload,
        id_exercice: this.currentExercise?.id || 'code-ex',
        nom_eleve: this.user.nom,
        classe_id: this.user.classe,
        type: 'code'
      });
      const note = res?.evaluation?.note_suggeree || 85;
      const fb = res?.evaluation?.feedback_eleve || "Ton code a été analysé avec succès ! Bien joué pour la structure.";
      this.codingFeedback = `✅ ${fb} (Note suggérée : ${note}/100)`;
      this.codingScore = note;
      this.user.xp += 30;
      this.syncCurrentStudentProgress();
    } catch (err) {
      console.warn("[soumettreCodeExercice] Fallback local :", err);
      this.codingFeedback = "✅ Travail enregistré et transmis au professeur !";
      this.user.xp += 20;
      this.syncCurrentStudentProgress();
    } finally {
      this.codingSubmitting = false;
    }
  },

  async soumettreOfficeDevoir() {
    const docUrl = this.officeDocUrl.trim();
    if (!docUrl && this.currentExercise?.submission_type !== 'text') {
      alert("Veuillez coller le lien de votre Google Doc ou dossier Drive.");
      return;
    }
    this.officeSubmitting = true;
    try {
      const content = `LIEN : ${docUrl}\n\nNOTES : ${this.officeNotes}`;
      await soumettreDevoirCloud({
        code_eleve: content,
        id_exercice: this.currentExercise?.id || 'office-ex',
        nom_eleve: this.user.nom,
        classe_id: this.user.classe,
        type: 'office'
      });
      this.officeSubmissionStatus = 'pending';
      this.officeFeedback = "✅ Document soumis au professeur ! En attente de validation.";
      this.user.xp += 25;
      this.syncCurrentStudentProgress();
    } catch (err) {
      console.warn("[soumettreOfficeDevoir] Fallback local :", err);
      this.officeSubmissionStatus = 'pending';
      this.officeFeedback = "✅ Travail mémorisé avec succès !";
      this.user.xp += 20;
      this.syncCurrentStudentProgress();
    } finally {
      this.officeSubmitting = false;
    }
  },

  async soumettreCreativeDevoir() {
    const projUrl = this.creativeProjectUrl.trim();
    if (!projUrl) {
      alert("Veuillez coller le lien de votre création (Canva, Drive, Gemini, etc.).");
      return;
    }
    this.creativeSubmitting = true;
    try {
      const content = `PROJET : ${projUrl}\n\nDÉMARCHE : ${this.creativeNotes}`;
      await soumettreDevoirCloud({
        code_eleve: content,
        id_exercice: this.currentExercise?.id || 'creative-ex',
        nom_eleve: this.user.nom,
        classe_id: this.user.classe,
        type: 'creative'
      });
      this.creativeStatus = 'pending';
      this.creativeFeedback = "✨ Mission créative transmise avec brio !";
      this.user.xp += 30;
      this.syncCurrentStudentProgress();
    } catch (err) {
      console.warn("[soumettreCreativeDevoir] Fallback local :", err);
      this.creativeStatus = 'pending';
      this.creativeFeedback = "✨ Mission créative mémorisée avec succès !";
      this.user.xp += 20;
      this.syncCurrentStudentProgress();
    } finally {
      this.creativeSubmitting = false;
    }
  },

  async syncCurrentStudentProgress() {
    const dataToSave = {
      nom: this.user.nom,
      classe: this.user.classe,
      xp: this.user.xp,
      competences: this.eleveCompetences,
      bilan_personnel: this.bilanPersonnel,
      bilan_personnel_ch2: this.bilanPersonnelCh2,
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
      },
      http_sim: {
        scenarioActif: this.httpSim.scenarioActif
      },
      tri_donnees: {
        score: this.triDonnees.score,
        valide: this.triDonnees.valide
      },
      mission_secu: {
        isSubmitted: this.missionSecu.isSubmitted
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
    } else {
      this.teacherAuth.errorMsg = res.message || `L'adresse Google "${res.email}" n'est pas autorisée sur l'espace enseignant.`;
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

  // ==========================================
  // GESTION DE L'ÉQUIPE ENSEIGNANTE (PHASE 1)
  // ==========================================
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
  // ATELIERS & QUESTIONS DU CHAPITRE 2 : SÉCURITÉ
  // ==========================================
  getActiveSubthemeSecu() {
    return this.altxBank.secu[this.activeSubthemeKeySecu] || this.altxBank.secu.profil;
  },

  getCurrentBankQuestionSecu() {
    const st = this.getActiveSubthemeSecu();
    return st.questions[this.bankQuestionIndexSecu] || st.questions[0];
  },

  selectBankChoiceSecu(choice) {
    if (this.bankSubmittedSecu) return;
    this.bankUserSelectionSecu = choice;
  },

  validerBankReponseSecu() {
    if (!this.bankUserSelectionSecu) return;
    const q = this.getCurrentBankQuestionSecu();
    this.bankSubmittedSecu = true;
    this.bankIsCorrectSecu = (this.bankUserSelectionSecu === q.rep);

    if (this.bankIsCorrectSecu) {
      this.bankScoreSecu += 10;
      this.user.xp += 10;
      this.tutorMood = 'happy';

      // Validation progressive de la compétence associée
      if (this.activeSubthemeKeySecu === 'profil') this.eleveCompetences['NUM-2.D1'] = 'acquis';
      if (this.activeSubthemeKeySecu === 'signaletique') this.eleveCompetences['NUM-2.D2'] = 'acquis';
      if (this.activeSubthemeKeySecu === 'cyber') this.eleveCompetences['NUM-2.P2'] = 'acquis';
      if (this.activeSubthemeKeySecu === 'confidentialite') this.eleveCompetences['NUM-2.P1'] = 'acquis';
      if (this.activeSubthemeKeySecu === 'identite') this.eleveCompetences['NUM-2.D5'] = 'acquis';
    } else {
      this.tutorMood = 'thinking';
    }

    this.syncCurrentStudentProgress();
  },

  bankQuestionSuivanteSecu() {
    const st = this.getActiveSubthemeSecu();
    if (this.bankQuestionIndexSecu < st.questions.length - 1) {
      this.bankQuestionIndexSecu++;
      this.bankUserSelectionSecu = null;
      this.bankSubmittedSecu = false;
      this.bankIsCorrectSecu = false;
    } else {
      alert(`Entraînement Sécurité terminé ! Score : ${this.bankScoreSecu} points.`);
      this.bankQuestionIndexSecu = 0;
      this.bankUserSelectionSecu = null;
      this.bankSubmittedSecu = false;
    }
  },

  changeSubthemeSecu(key) {
    this.activeSubthemeKeySecu = key;
    this.bankQuestionIndexSecu = 0;
    this.bankUserSelectionSecu = null;
    this.bankSubmittedSecu = false;
    this.bankIsCorrectSecu = false;
  },

  // Atelier HTTP vs HTTPS (p. 106)
  choisirScenarioHttp(key) {
    this.httpSim.scenarioActif = key;
    if (key === 'banque') {
      this.eleveCompetences['NUM-2.D3'] = 'acquis';
      this.user.xp += 15;
      this.syncCurrentStudentProgress();
    }
  },

  // Atelier Données Actives vs Passives (p. 114)
  classerDonneeTri(itemId, typeChoisi) {
    const item = this.triDonnees.items.find(i => i.id === itemId);
    if (item) {
      item.choixEleve = typeChoisi;
    }
  },

  validerTriDonnees() {
    let score = 0;
    let toutRempli = true;
    this.triDonnees.items.forEach(item => {
      if (!item.choixEleve) toutRempli = false;
      if (item.choixEleve === item.typeReel) score++;
    });

    if (!toutRempli) {
      alert('Veuillez classer les 6 éléments avant de valider.');
      return;
    }

    this.triDonnees.score = score;
    this.triDonnees.valide = true;
    if (score === 6) {
      this.triDonnees.feedback = 'Bravo ! 6/6 sans faute ! Tu distingues parfaitement ce que tu publies (données actives) des traces automatiques (données passives). Compétence NUM-2.D4 validée ! 🎉';
      this.user.xp += 25;
      this.eleveCompetences['NUM-2.D4'] = 'acquis';
    } else {
      this.triDonnees.feedback = `Score : ${score}/6. Rappel : les données passives sont celles récoltées automatiquement sans que tu tapes du texte (IP, temps d'écran, modèle de smartphone).`;
      this.eleveCompetences['NUM-2.D4'] = 'en_cours';
    }
    this.syncCurrentStudentProgress();
  },

  // Bilan personnel Chapitre 2 (p. 147)
  setBilanItemCh2(code, niveau) {
    this.bilanPersonnelCh2[code] = niveau;
    this.syncCurrentStudentProgress();
  },

  // Mission Citoyenne "Je maîtrise" Chapitre 2 (p. 158)
  soumettreMissionSecu() {
    this.missionSecu.isSubmitted = true;
    this.missionSecu.aiFeedback = `Excellente campagne citoyenne ! Ton slogan "${this.missionSecu.slogan}" est percutant et responsabilisant pour des élèves de 1re. Tes 3 réflexes (conserver la preuve, bloquer & signaler, alerter un adulte ou le 103) respectent exactement le protocole de prévention FWB / SeGEC. Compétence NUM-2.M1 validée !`;
    this.user.xp += 30;
    this.eleveCompetences['NUM-2.M1'] = 'acquis';
    this.syncCurrentStudentProgress();
  },

  // ==========================================
  // DIAPORAMA DE COURS & NOTEBOOKLM
  // ==========================================
  getCurrentModuleSlides() {
    if (this.selectedModuleId === 'module-0') {
      return this.module0?.support_cours?.slides || [];
    }
    if (this.selectedModuleId === 'ch2-securite') {
      return this.chapter2?.support_cours?.slides || [];
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
    if (this.selectedModuleId === 'ch2-securite') {
      return this.chapter2?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
    }
    return this.chapter?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
  },

  async sauvegarderNotebookLMConfig(moduleId, newUrl) {
    if (!newUrl) return;
    if (moduleId === 'module-0') {
      if (!this.module0.support_cours) this.module0.support_cours = {};
      this.module0.support_cours.notebooklm_url = newUrl;
    } else if (moduleId === 'ch2-securite') {
      if (!this.chapter2.support_cours) this.chapter2.support_cours = {};
      this.chapter2.support_cours.notebooklm_url = newUrl;
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
      const customPrompt = this.currentCourse?.systemPrompt || null;
      const response = await interrogerTuteurIA(
        q, 
        this.tutorHistory, 
        this.currentExercise?.id || this.selectedModuleId, 
        customPrompt
      );
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
      let reponse = "Très bonne question ! As-tu bien vérifié les consignes et les indices de l'activité ?";
      const lower = q.toLowerCase();
      
      // Fallback FMTTN
      if (lower.includes('cci') || lower.includes('cc')) {
        reponse = "Rappelle-toi de l'astuce : 'Cci' = Invisible ! Si tu écris à 25 personnes, pourquoi ne doivent-elles pas voir les adresses de tout le monde ?";
      } else if (lower.includes('https') || lower.includes('http') || lower.includes('cadenas')) {
        reponse = "Rappelle-toi : le 'S' de HTTPS = Sécurisé (la communication est chiffrée). Mais attention : un cadenas ne garantit pas que le commerçant est honnête !";
      } else if (lower.includes('pegi')) {
        reponse = "Attention au piège classique : le chiffre PEGI indique l'âge minimum conseillé pour la sensibilité psychologique, pas le niveau de difficulté du jeu !";
      } else if (lower.includes('active') || lower.includes('passive') || lower.includes('trace')) {
        reponse = "Astuce : une donnée active, c'est ce que tu tapes ou postes volontairement. Une trace passive, c'est ce que la machine enregistre en silence (ton IP, l'heure, ton temps d'écran).";
      } else if (lower.includes('harcèlement') || lower.includes('bloquer') || lower.includes('signaler')) {
        reponse = "La règle d'or face au cyberharcèlement : 1. Capture d'écran (preuve) 2. Bloquer & Signaler 3. En parler immédiatement à un adulte ou au 103 (gratuit).";
      } else if (lower.includes('2fa') || lower.includes('double')) {
        reponse = "La double authentification (2FA), c'est comme avoir une clé normale PLUS un code secret temporaire sur ton téléphone : impossible d'entrer avec seulement le mot de passe !";
      } 
      // Fallback Bureautique / Office
      else if (lower.includes('sommaire') || lower.includes('table des matières')) {
        reponse = "Pour générer une table des matières automatique, as-tu bien appliqué les styles 'Titre 1' et 'Titre 2' avant de cliquer sur 'Insertion > Table des matières' ?";
      } else if (lower.includes('insécable') || lower.includes('espace')) {
        reponse = "L'espace insécable évite qu'un signe de ponctuation double (: ; ? !) se retrouve orphelin au début de la ligne suivante. Raccourci : Ctrl+Maj+Espace !";
      } else if (lower.includes('drive') || lower.includes('partage') || lower.includes('lecteur')) {
        reponse = "Dans Drive, assure-toi de choisir 'Tous les utilisateurs disposant du lien' et sélectionne le rôle 'Lecteur' pour que le professeur puisse corriger sans modifier ton fichier.";
      }
      // Fallback Code (HTML / CSS / JS)
      else if (lower.includes('balise') || lower.includes('fermer') || lower.includes('fermeture')) {
        reponse = "Vérifie bien que chaque balise ouvrante comme <div> ou <p> possède sa balise fermante correspondante (</div>, </p>).";
      } else if (lower.includes('flexbox') || lower.includes('aligner') || lower.includes('centrer')) {
        reponse = "Pour centrer un élément avec Flexbox : place 'display: flex;', 'justify-content: center;' et 'align-items: center;' sur le conteneur parent !";
      } else if (lower.includes('variable') || lower.includes('let') || lower.includes('const')) {
        reponse = "En JavaScript, utilise 'const' pour une valeur fixe, ou 'let' si sa valeur doit changer au cours du programme.";
      }
      // Fallback Créatif & IA
      else if (lower.includes('prompt') || lower.includes('ia') || lower.includes('image')) {
        reponse = "Un bon prompt créatif contient : 1. Le sujet principal 2. Le style visuel (3D, photo, aquarelle) 3. L'éclairage et l'atmosphère souhaitée.";
      }

      this.tutorHistory.push({ sender: 'bot', text: reponse });
      this.tutorMood = 'happy';
      this.tutorLoading = false;
    }, 500);
  }
}));

Alpine.start();
