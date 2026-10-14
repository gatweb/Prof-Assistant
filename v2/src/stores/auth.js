import { 
  initStudentSession, 
  loginUtilisateurGoogle,
  loginProfesseurGoogle, 
  deconnexionGlobale,
  logoutProfesseur, 
  subscribeToAuthState, 
  saveEleveProgression, 
  chargerProgressionEleveReelle
} from '../services/firebase.js';
import { AVAILABLE_CLASSES } from '../services/teachers-config.js';
import {
  isClassroomConnected,
  getClassroomToken,
  setClassroomToken,
  fetchStudentEnrolledCourses,
  detectClassFromCourses,
  checkIfClassroomTeacher
} from '../services/classroomService.js';

export function createAuthStore() {
  return {
    availableClasses: AVAILABLE_CLASSES,
    authReady: false,
    isLoggedIn: false,
    isGuestMode: false,
    loginLoading: false,
    loginError: '',
    modalClassChoiceOpen: false,
    classroomDetectedClass: null,
    studentSubmissionsHistory: [],

    user: {
      id: '',
      email: '',
      nom: 'Élève',
      classe: '1A',
      photoURL: '',
      xp: 0,
      avatar: 'robot',
      isLoggedIn: false
    },

    teacherAuth: {
      isTeacher: false,
      isAdmin: false,
      user: null,
      profile: null,
      loading: false,
      errorMsg: ''
    },
    modalLoginProfOpen: false,

    initAuthListener() {
      const savedClass = localStorage.getItem('profassistant_student_classe');
      if (savedClass) {
        this.user.classe = savedClass;
      }

      subscribeToAuthState(async (authStatus) => {
        this.authReady = true;

        if (authStatus.isLoggedIn) {
          this.isLoggedIn = true;
          this.teacherAuth.isTeacher = authStatus.isTeacher;
          this.teacherAuth.isAdmin = authStatus.isAdmin;
          this.teacherAuth.user = authStatus.user;
          this.teacherAuth.profile = authStatus.profile;

          if (authStatus.isTeacher) {
            console.log(`[Prof] Bienvenue ${authStatus.profile?.nom || authStatus.user?.email}`);
            if (authStatus.profile?.classes?.length) {
              const firstClass = authStatus.profile.classes.find(c => c !== 'all') || '1A';
              this.selectedTeacherClass = firstClass;
            }
            this.activerEcouteClasse(this.selectedTeacherClass);
            this.activerEcouteSubmissions();
            this.chargerElevesReels();
            this.classroomConnected = isClassroomConnected();
            if (this.classroomConnected) {
              this.chargerCoursClassroom();
            }
          } else {
            // ÉLÈVE AUTHENTIFIÉ AVEC GOOGLE
            const u = authStatus.user;
            this.user.id = u.uid;
            this.user.email = (u.email || '').toLowerCase();
            this.user.nom = u.displayName || (u.email ? u.email.split('@')[0] : "Élève");
            this.user.photoURL = u.photoURL || '';
            this.user.isLoggedIn = true;

            if (!this.user.classe && getClassroomToken()) {
              try {
                const studentCourses = await fetchStudentEnrolledCourses();
                const detectedClass = detectClassFromCourses(studentCourses, this.availableClasses);
                if (detectedClass) {
                  this.user.classe = detectedClass;
                  localStorage.setItem('profassistant_student_classe', detectedClass);
                  this.classroomDetectedClass = detectedClass;
                  if (!this.availableClasses.includes(detectedClass)) {
                    this.availableClasses.push(detectedClass);
                  }
                }
              } catch (_) {}
            }

            if (!this.user.classe) {
              this.user.classe = savedClass || '1A';
            }
            if (!savedClass && !this.classroomDetectedClass) {
              this.modalClassChoiceOpen = true;
            }

            await this.chargerProgressionEleveReelleDepuisDb();
          }
        } else {
          if (!this.isGuestMode) {
            this.isLoggedIn = false;
          }
          this.teacherAuth.isTeacher = false;
          this.teacherAuth.isAdmin = false;
          this.teacherAuth.user = null;
          this.teacherAuth.profile = null;
          this.classroomConnected = false;
          if (this.unsubscribeTeacherListener) {
            this.unsubscribeTeacherListener();
            this.unsubscribeTeacherListener = null;
          }
          if (this.unsubscribeSubmissionsListener) {
            this.unsubscribeSubmissionsListener();
            this.unsubscribeSubmissionsListener = null;
          }
        }
      });
    },

    async connexionGoogle() {
      this.loginLoading = true;
      this.loginError = '';
      try {
        const { accessToken } = await loginUtilisateurGoogle();

        if (accessToken) {
          setClassroomToken(accessToken);
          this.classroomConnected = true;

          try {
            const studentCourses = await fetchStudentEnrolledCourses();
            if (studentCourses && studentCourses.length) {
              const detectedClass = detectClassFromCourses(studentCourses, this.availableClasses);
              if (detectedClass) {
                console.log(`[Classroom] Classe détectée automatiquement : ${detectedClass}`);
                this.user.classe = detectedClass;
                localStorage.setItem('profassistant_student_classe', detectedClass);
                this.classroomDetectedClass = detectedClass;
                if (!this.availableClasses.includes(detectedClass)) {
                  this.availableClasses.push(detectedClass);
                }
                this.modalClassChoiceOpen = false;
              }
            }
          } catch (cErr) {
            console.warn("[Classroom] Détection automatique classe élève ignorée :", cErr.message);
          }

          try {
            const isClassroomTeacher = await checkIfClassroomTeacher();
            if (isClassroomTeacher && !this.teacherAuth.isTeacher) {
              console.log("[Classroom] Rôle Enseignant actif détecté dans Classroom");
              this.teacherAuth.isTeacher = true;
            }
          } catch (_) {}
        }
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          this.loginError = "Erreur de connexion : " + (err.message || "Veuillez réessayer.");
        }
      } finally {
        this.loginLoading = false;
      }
    },

    async deconnexionUtilisateur() {
      await deconnexionGlobale();
      this.isLoggedIn = false;
      this.isGuestMode = false;
      this.user = {
        id: '',
        email: '',
        nom: 'Élève',
        classe: '1A',
        photoURL: '',
        xp: 0,
        avatar: 'robot',
        isLoggedIn: false
      };
    },

    activerModeInvite() {
      this.isGuestMode = true;
      this.isLoggedIn = true;
      this.user.id = 'guest_' + Math.random().toString(36).substring(2, 8);
      this.user.nom = 'Élève Invité';
      this.user.classe = '1A';
      this.user.email = 'invite@demo.local';
      initStudentSession();
    },

    choisirClasseEleve(c) {
      this.user.classe = c;
      localStorage.setItem('profassistant_student_classe', c);
      this.modalClassChoiceOpen = false;
      this.syncCurrentStudentProgress();
    },

    async chargerProgressionEleveReelleDepuisDb() {
      if (!this.user.email && !this.user.id) return;
      try {
        const data = await chargerProgressionEleveReelle(this.user.classe, this.user.email, this.user.id);
        if (data) {
          if (data.progression) {
            const p = data.progression;
            if (p.classe_id) this.user.classe = p.classe_id;
            if (p.xp) this.user.xp = p.xp;
            if (p.competences) this.eleveCompetences = { ...this.eleveCompetences, ...p.competences };
            if (p.bilan_personnel) this.bilanPersonnel = { ...this.bilanPersonnel, ...p.bilan_personnel };
            if (p.bilan_personnel_ch2) this.bilanPersonnelCh2 = { ...this.bilanPersonnelCh2, ...p.bilan_personnel_ch2 };
            if (p.charte) this.charteState = { ...this.charteState, ...p.charte };
            if (p.escape_game) this.egState = { ...this.egState, ...p.escape_game };
            if (p.email_sim) this.emailSim = { ...this.emailSim, ...p.email_sim };
          }
          if (data.submissions?.length) {
            this.studentSubmissionsHistory = data.submissions;
            const validated = data.submissions.filter(s => s.status === 'valide').length;
            console.log(`[Progression] ${data.submissions.length} travaux trouvés (${validated} validés)`);
          }
        }
      } catch (e) {
        console.warn("[chargerProgressionEleveReelleDepuisDb] Erreur :", e);
      }
    },

    updateStudentProfile(newNom, newClasse) {
      if (newNom) this.user.nom = newNom.trim();
      if (newClasse) {
        this.user.classe = newClasse;
        localStorage.setItem('profassistant_student_classe', newClasse);
      }
      this.syncCurrentStudentProgress();
    },

    async syncCurrentStudentProgress() {
      const dataToSave = {
        nom: this.user.nom,
        email: this.user.email,
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

      await saveEleveProgression(this.user.classe, this.user.email || this.user.id || 'el_student', dataToSave);
    },

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
    }
  };
}
