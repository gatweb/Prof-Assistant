import { 
  initStudentSession, 
  loginUtilisateurGoogle,
  loginProfesseurGoogle, 
  deconnexionGlobale,
  logoutProfesseur, 
  subscribeToAuthState, 
  saveEleveProgression, 
  chargerProgressionEleveReelle,
  subscribeToStudentOwnProgression,
  acquitterAvertissementSpamEleve,
  getClassMappings,
  cleanDuplicatesAndArchiveOldStudentsInDb
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
    classMappings: [],
    authReady: false,
    isLoggedIn: false,
    isGuestMode: false,
    loginLoading: false,
    loginError: '',
    modalClassChoiceOpen: false,
    classroomDetectedClass: null,
    studentSubmissionsHistory: [],
    studentTutorCallsCount: 0,
    studentHintsUsedCount: 0,

    // 🛡️ BOUCLIER ANTI-SPAM & SUIVI D'UNICITÉ DES XP
    rewardedActivities: [],
    submissionCooldowns: {},
    studentSpamAttempts: 0,
    studentSpamWarning: null,
    spamWarningCommitmentChecked: false,
    unsubscribeOwnProgression: null,
    xpToast: {
      visible: false,
      message: '',
      type: 'xp' // 'xp' | 'already' | 'warn'
    },

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

          // Charger les liaisons explicites de classes (Phase 9)
          this.classMappings = await getClassMappings();
          this.classMappings.forEach(m => {
            if (m.id && !this.availableClasses.includes(m.id)) {
              this.availableClasses.push(m.id);
            }
          });

          if (authStatus.isTeacher) {
            console.log(`[Prof] Bienvenue ${authStatus.profile?.nom || authStatus.user?.email}`);
            if (authStatus.profile?.classes?.length) {
              const firstClass = authStatus.profile.classes.find(c => c !== 'all') || 'tous';
              this.selectedTeacherClass = firstClass;
              this.submissionFilterClass = firstClass;
            }
            this.activerEcouteClasse(this.selectedTeacherClass);
            this.activerEcouteSubmissions();
            await this.chargerElevesReels();
            if (typeof this.chargerTousLesElevesEcole === 'function') {
              await this.chargerTousLesElevesEcole();
            }
            this.classroomConnected = isClassroomConnected();
            if (this.classroomConnected) {
              await this.chargerCoursClassroom();
              await this.verifierNouveauxElevesClassroom();
            }
          } else {
            // ÉLÈVE AUTHENTIFIÉ AVEC GOOGLE
            const u = authStatus.user;
            this.user.id = u.uid;
            this.user.email = (u.email || '').toLowerCase();
            this.user.nom = u.displayName || (u.email ? u.email.split('@')[0] : "Élève");
            this.user.photoURL = u.photoURL || '';
            this.user.isLoggedIn = true;

            if (getClassroomToken()) {
              try {
                const studentCourses = await fetchStudentEnrolledCourses();
                const detectedClass = detectClassFromCourses(studentCourses, this.availableClasses, this.classMappings);
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
            if (!this.classMappings?.length) {
              this.classMappings = await getClassMappings();
            }
            const studentCourses = await fetchStudentEnrolledCourses();
            if (studentCourses && studentCourses.length) {
              const detectedClass = detectClassFromCourses(studentCourses, this.availableClasses, this.classMappings);
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

    async choisirClasseEleve(c) {
      this.user.classe = c;
      localStorage.setItem('profassistant_student_classe', c);
      this.modalClassChoiceOpen = false;
      if (typeof this.verifierEtOrienterCoursSelonClasseEleve === 'function') {
        await this.verifierEtOrienterCoursSelonClasseEleve();
      }
      this.syncCurrentStudentProgress();
    },

    async chargerProgressionEleveReelleDepuisDb() {
      if (!this.user.email && !this.user.id) return;
      try {
        const userKey = this.user.email || this.user.id;
        const storageKey = `profassistant_rewarded_${userKey}`;
        const stateCacheKey = `profassistant_fmttn_state_${userKey}`;
        try {
          const cachedRewards = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (Array.isArray(cachedRewards)) {
            this.rewardedActivities = cachedRewards;
          }
          const cachedState = JSON.parse(localStorage.getItem(stateCacheKey) || 'null');
          if (cachedState && typeof cachedState === 'object') {
            this.appliquerEtatProgressionFmttn(cachedState);
          }
        } catch (_) {}

        const data = await chargerProgressionEleveReelle(this.user.classe, this.user.email, this.user.id);
        if (data) {
          if (data.officialClasse) {
            this.user.classe = data.officialClasse;
            localStorage.setItem('profassistant_student_classe', data.officialClasse);
            this.modalClassChoiceOpen = false;
          }
          if (data.progression) {
            const p = data.progression;
            if (p.classe_id && !data.officialClasse) {
              this.user.classe = p.classe_id;
              localStorage.setItem('profassistant_student_classe', p.classe_id);
            }
            if (typeof p.xp === 'number') this.user.xp = p.xp;
            this.appliquerEtatProgressionFmttn(p);
            if (Array.isArray(p.rewarded_activities)) {
              this.rewardedActivities = Array.from(new Set([...this.rewardedActivities, ...p.rewarded_activities]));
              localStorage.setItem(storageKey, JSON.stringify(this.rewardedActivities));
            }
            if (p.spam_warning) {
              this.studentSpamWarning = p.spam_warning;
            }
            if (typeof p.spam_attempts === 'number') {
              this.studentSpamAttempts = p.spam_attempts;
            }
          }
          if (data.submissions?.length) {
            this.studentSubmissionsHistory = data.submissions;
            const validated = data.submissions.filter(s => s.status === 'valide').length;
            console.log(`[Progression] ${data.submissions.length} travaux trouvés (${validated} validés)`);
          }
        }

        // Orienter immédiatement l'élève vers le cours correspondant à son niveau (1re vs 3e)
        if (typeof this.verifierEtOrienterCoursSelonClasseEleve === 'function') {
          await this.verifierEtOrienterCoursSelonClasseEleve();
        }

        // Activer l'écoute temps réel du profil élève pour recevoir en direct les recalculs d'XP et avertissements prof
        if (this.unsubscribeOwnProgression) {
          this.unsubscribeOwnProgression();
        }
        this.unsubscribeOwnProgression = subscribeToStudentOwnProgression(
          this.user.classe,
          this.user.email,
          this.user.id,
          (liveProg) => {
            if (!liveProg) return;
            if (typeof liveProg.xp === 'number' && liveProg.xp !== this.user.xp) {
              this.user.xp = liveProg.xp;
            }
            if (Array.isArray(liveProg.rewarded_activities)) {
              this.rewardedActivities = liveProg.rewarded_activities;
              localStorage.setItem(storageKey, JSON.stringify(this.rewardedActivities));
            }
            if (liveProg.spam_warning) {
              this.studentSpamWarning = liveProg.spam_warning;
            }
          }
        );
      } catch (e) {
        console.warn("[chargerProgressionEleveReelleDepuisDb] Erreur :", e);
      }
    },

    // 🛡️ RÈGLE D'OR XP : 1 Activité = 1 seule récompense XP à vie
    isActivityRewarded(activityKey) {
      if (!activityKey) return false;
      return Array.isArray(this.rewardedActivities) && this.rewardedActivities.includes(String(activityKey));
    },

    afficherToastXp(message, type = 'xp') {
      this.xpToast = { visible: true, message, type };
      if (this._xpToastTimer) clearTimeout(this._xpToastTimer);
      this._xpToastTimer = setTimeout(() => {
        this.xpToast.visible = false;
      }, 3600);
    },

    attribuerXpUnique(activityKey, amount = 10, label = '') {
      const cleanKey = String(activityKey || '').trim();
      if (!cleanKey) return false;

      if (!Array.isArray(this.rewardedActivities)) {
        this.rewardedActivities = [];
      }

      if (this.rewardedActivities.includes(cleanKey)) {
        this.afficherToastXp(
          `✅ Déjà validé (+0 XP — Entraînement libre${label ? ' : ' + label : ''})`,
          'already'
        );
        return false;
      }

      this.rewardedActivities.push(cleanKey);
      this.user.xp = (Number(this.user.xp) || 0) + (Number(amount) || 0);

      try {
        const storageKey = `profassistant_rewarded_${this.user.email || this.user.id || 'guest'}`;
        localStorage.setItem(storageKey, JSON.stringify(this.rewardedActivities));
      } catch (_) {}

      this.afficherToastXp(
        `✨ +${amount} XP acquis${label ? ' — ' + label : ''} !`,
        'xp'
      );
      return true;
    },

    // 🛡️ Verrou anti-rebond sur les soumissions de devoirs (bloque les clics frénétiques)
    verifierCooldownSoumission(exId, cooldownSeconds = 35) {
      const key = String(exId || 'default');
      const now = Date.now();
      const lastTime = this.submissionCooldowns[key] || 0;
      const elapsedSec = (now - lastTime) / 1000;

      if (elapsedSec < cooldownSeconds) {
        this.studentSpamAttempts = (Number(this.studentSpamAttempts) || 0) + 1;
        const remaining = Math.ceil(cooldownSeconds - elapsedSec);
        this.afficherToastXp(
          `⏳ Copie déjà envoyée ! Patiente ${remaining}s avant de renvoyer (1 seule copie par exercice).`,
          'warn'
        );
        this.syncCurrentStudentProgress();
        return false;
      }

      this.submissionCooldowns[key] = now;
      return true;
    },

    async acquitterMonAvertissementSpam() {
      if (!this.spamWarningCommitmentChecked) return;
      if (this.studentSpamWarning) {
        this.studentSpamWarning.active = false;
        this.studentSpamWarning.acknowledged_at = new Date().toISOString();
      }
      this.spamWarningCommitmentChecked = false;
      await acquitterAvertissementSpamEleve({
        classeId: this.user.classe,
        eleveId: this.user.id,
        email: this.user.email
      });
    },

    appliquerEtatProgressionFmttn(p) {
      if (!p || typeof p !== 'object') return;
      if (p.competences) this.eleveCompetences = { ...this.eleveCompetences, ...p.competences };
      if (p.bilan_personnel) this.bilanPersonnel = { ...this.bilanPersonnel, ...p.bilan_personnel };
      if (p.bilan_personnel_ch2) this.bilanPersonnelCh2 = { ...this.bilanPersonnelCh2, ...p.bilan_personnel_ch2 };
      if (p.charte) this.charteState = { ...this.charteState, ...p.charte };
      if (p.escape_game) {
        this.egState = {
          ...this.egState,
          ...p.escape_game,
          dossierUnlocked: Array.isArray(p.escape_game.dossierUnlocked) && p.escape_game.dossierUnlocked.length
            ? p.escape_game.dossierUnlocked
            : (this.egState.dossierUnlocked || [1])
        };
      }
      if (p.email_sim) this.emailSim = { ...this.emailSim, ...p.email_sim };
      if (p.mission_app) this.missionApp = { ...this.missionApp, ...p.mission_app };
      if (p.http_sim) this.httpSim = { ...this.httpSim, ...p.http_sim };
      if (p.tri_donnees) this.triDonnees = { ...this.triDonnees, ...p.tri_donnees };
      if (p.mission_secu) this.missionSecu = { ...this.missionSecu, ...p.mission_secu };
      if (p.m0_deco) this.m0DecoState = { ...this.m0DecoState, ...p.m0_deco };
      if (typeof p.bilan_ch1_validated === 'boolean') this.bilanCh1Validated = p.bilan_ch1_validated;
      if (typeof p.bilan_ch2_validated === 'boolean') this.bilanCh2Validated = p.bilan_ch2_validated;
      if (Array.isArray(p.badges_altx)) {
        this.fmttnUnlockedBadges = Array.from(new Set([...(this.fmttnUnlockedBadges || []), ...p.badges_altx]));
      }
      if (p.defis_ludiques && this.defisLudiques) {
        if (p.defis_ludiques.netiquette) {
          this.defisLudiques.netiquette = { ...this.defisLudiques.netiquette, ...p.defis_ludiques.netiquette };
        }
        if (p.defis_ludiques.lucasProfil) {
          const savedFlaws = p.defis_ludiques.lucasProfil.foundFlaws || p.defis_ludiques.lucasProfil.fixedFlaws || [];
          this.defisLudiques.lucasProfil = {
            ...this.defisLudiques.lucasProfil,
            ...p.defis_ludiques.lucasProfil,
            foundFlaws: Array.isArray(savedFlaws) ? savedFlaws : []
          };
        }
        if (p.defis_ludiques.linaPermissions) {
          const defaultItems = this.defisLudiques.linaPermissions.items || [];
          this.defisLudiques.linaPermissions = {
            ...this.defisLudiques.linaPermissions,
            ...p.defis_ludiques.linaPermissions,
            items: Array.isArray(p.defis_ludiques.linaPermissions.items) && p.defis_ludiques.linaPermissions.items.length
              ? p.defis_ludiques.linaPermissions.items
              : defaultItems
          };
        }
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
      const unlockedBadges = typeof this.getUnlockedAltxBadgesIds === 'function' ? this.getUnlockedAltxBadgesIds() : [];
      this.fmttnUnlockedBadges = Array.from(new Set([...(this.fmttnUnlockedBadges || []), ...unlockedBadges]));

      const dataToSave = {
        nom: this.user.nom,
        email: this.user.email,
        classe: this.user.classe,
        xp: this.user.xp,
        competences: this.eleveCompetences,
        rewarded_activities: this.rewardedActivities || [],
        defis_ludiques: this.defisLudiques || null,
        badges_altx: this.fmttnUnlockedBadges,
        spam_attempts: this.studentSpamAttempts || 0,
        bilan_personnel: this.bilanPersonnel,
        bilan_personnel_ch2: this.bilanPersonnelCh2,
        bilan_ch1_validated: Boolean(this.bilanCh1Validated),
        bilan_ch2_validated: Boolean(this.bilanCh2Validated),
        m0_deco: this.m0DecoState || null,
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
        },
        tutor_calls_count: this.studentTutorCallsCount || 0,
        hints_used_count: this.studentHintsUsedCount || 0,
        active_course_id: this.currentCourse?.id || 'fmttn-1re',
        active_exercise_id: this.currentExercise?.id || this.selectedModuleId || ''
      };

      try {
        const userKey = this.user.email || this.user.id || 'guest';
        localStorage.setItem(`profassistant_fmttn_state_${userKey}`, JSON.stringify(dataToSave));
      } catch (_) {}

      await saveEleveProgression(this.user.classe, this.user.email || this.user.id || 'el_student', dataToSave);
    },

    ouvrirEspaceProf() {
      if (this.teacherAuth.isTeacher) {
        this.activeTab = 'prof';
        this.activerEcouteClasse(this.selectedTeacherClass);
        this.chargerElevesReels();
        if (typeof this.chargerTousLesElevesEcole === 'function') {
          this.chargerTousLesElevesEcole();
        }
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
        if (res.accessToken) {
          setClassroomToken(res.accessToken);
          this.classroomConnected = true;
          this.chargerCoursClassroom();
        }
        this.activerEcouteClasse(this.selectedTeacherClass);
        this.chargerElevesReels();
        if (typeof this.chargerTousLesElevesEcole === 'function') {
          this.chargerTousLesElevesEcole();
        }
      } else {
        this.teacherAuth.errorMsg = res.message || `L'adresse Google "${res.email}" n'est pas autorisée sur l'espace enseignant.`;
      }
    },

    async deconnexionProfesseur() {
      await logoutProfesseur();
      this.teacherAuth.isTeacher = false;
      this.teacherAuth.user = null;
      this.teacherAuth.profile = null;
      this.activeTab = 'cours';
    }
  };
}
