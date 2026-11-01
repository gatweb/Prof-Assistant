import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { isTeacherEmailAllowed, getTeacherProfile } from "./teachers-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyCccJvi75RxyaiW4meP9yVz_--k4UUFaps",
  authDomain: "profassistant-61fde.firebaseapp.com",
  projectId: "profassistant-61fde",
  storageBucket: "profassistant-61fde.firebasestorage.app",
  messagingSenderId: "429919803539",
  appId: "1:429919803539:web:6719e34300ce0ffadc5566"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "europe-west1");

// 1. Initialisation silencieuse de l'authentification (mode démo / secours invité)
export async function initStudentSession() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("[Auth] Session invité active :", auth.currentUser.uid);
    }
    return auth.currentUser;
  } catch (err) {
    console.warn("[Auth] Session locale active :", err.message);
    return null;
  }
}

// 2. Connexion Universelle via Google (Élève & Enseignant)
export async function loginUtilisateurGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return {
      user: result.user,
      accessToken: credential?.accessToken || null
    };
  } catch (err) {
    console.error("[loginUtilisateurGoogle] Erreur connexion Google :", err);
    throw err;
  }
}

// 2b. Connexion Enseignant dédiée via Google (pour synchronisation immédiate)
export async function loginProfesseurGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    try {
      const syncFn = httpsCallable(functions, "synchroniserProfilEnseignant");
      const syncRes = await syncFn();
      const data = syncRes.data || {};

      if (!data.isTeacher) {
        console.warn("[Auth Prof] Adresse non autorisée :", data.message || user.email);
        await signOut(auth);
        return { 
          success: false, 
          reason: data.reason || "not_allowed", 
          message: data.message || "Votre adresse n'est pas encore enregistrée dans l'équipe enseignante.",
          email: user.email 
        };
      }

      await user.getIdToken(true);

      const profile = data.profile || {
        email: user.email,
        nom: user.displayName || user.email.split('@')[0],
        role: data.role || "enseignant",
        classes: ["1A", "1B", "1C", "1D"]
      };

      return { success: true, user, profile };
    } catch (fnErr) {
      console.warn("[Auth Prof] Erreur sync function, vérification directe Firestore :", fnErr);
      const docSnap = await getDoc(doc(db, "enseignants", user.email.toLowerCase()));
      if (docSnap.exists() && docSnap.data().actif !== false) {
        const profile = docSnap.data();
        return { success: true, user, profile };
      }
      if (user.email === 'gatweb@gmail.com') {
        return { success: true, user, profile: { email: user.email, nom: "Administrateur", role: "admin", classes: ["all"] } };
      }
      await signOut(auth);
      return { success: false, reason: "error", error: fnErr.message };
    }
  } catch (err) {
    console.error("[Auth Prof] Erreur de connexion Google :", err);
    return { success: false, reason: "error", error: err.message };
  }
}

// 3. Déconnexion Globale (Élève & Professeur)
export async function deconnexionGlobale() {
  try {
    await signOut(auth);
    console.log("[Auth] Déconnexion réussie");
    return true;
  } catch (err) {
    console.error("[Auth] Erreur lors de la déconnexion :", err);
    return false;
  }
}

export async function logoutProfesseur() {
  return deconnexionGlobale();
}

// 4. Écoute réactive de l'état d'authentification (détection automatique Prof / Élève)
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && !user.isAnonymous && user.email) {
      try {
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role;
        const isAdmin = idTokenResult.claims.admin === true || role === 'admin' || user.email === 'gatweb@gmail.com';
        const isTeacher = ['enseignant', 'admin'].includes(role) || isAdmin;

        if (isTeacher) {
          const docSnap = await getDoc(doc(db, "enseignants", user.email.toLowerCase()));
          const profile = docSnap.exists() ? docSnap.data() : {
            email: user.email,
            nom: user.displayName || user.email.split('@')[0],
            role: role || (isAdmin ? "admin" : "enseignant"),
            classes: ["1A", "1B", "1C", "1D"]
          };
          callback({
            isLoggedIn: true,
            isTeacher: true,
            isAdmin,
            user,
            profile
          });
          return;
        }

        // Vérification directe si claims en cours de propagation
        const docSnap = await getDoc(doc(db, "enseignants", user.email.toLowerCase()));
        if (docSnap.exists() && docSnap.data().actif !== false) {
          const profile = docSnap.data();
          callback({
            isLoggedIn: true,
            isTeacher: true,
            isAdmin: profile.role === 'admin' || user.email === 'gatweb@gmail.com',
            user,
            profile
          });
          return;
        }

        // C'EST UN ÉLÈVE AUTHENTIFIÉ PAR GOOGLE !
        callback({
          isLoggedIn: true,
          isTeacher: false,
          isAdmin: false,
          user,
          profile: {
            email: user.email.toLowerCase(),
            nom: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || ''
          }
        });
        return;
      } catch (err) {
        console.warn("[subscribeToAuthState] Erreur vérification rôle :", err.message);
        callback({
          isLoggedIn: true,
          isTeacher: false,
          isAdmin: false,
          user,
          profile: {
            email: user.email.toLowerCase(),
            nom: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || ''
          }
        });
        return;
      }
    }

    // Utilisateur non connecté avec Google (ou visiteur anonyme)
    callback({
      isLoggedIn: user ? !user.isAnonymous : false,
      isTeacher: false,
      isAdmin: false,
      user: user || null,
      profile: null
    });
  });
}

// 4.b Gestion d'équipe Cloud
export async function listerEnseignantsCloud() {
  try {
    const fn = httpsCallable(functions, "listerEnseignants");
    const res = await fn();
    return res.data?.teachers || [];
  } catch (err) {
    console.warn("[listerEnseignantsCloud] Fallback direct Firestore :", err.message);
    const snap = await getDocs(collection(db, "enseignants"));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  }
}

export async function enregistrerEnseignantCloud(teacherData) {
  const fn = httpsCallable(functions, "enregistrerEnseignant");
  const res = await fn(teacherData);
  return res.data;
}

export async function supprimerEnseignantCloud(email) {
  const fn = httpsCallable(functions, "supprimerEnseignant");
  const res = await fn({ email });
  return res.data;
}

// 5. Sauvegarde de la progression élève dans Firestore (/progressions_v2)
export async function saveEleveProgression(classeId, eleveId, data) {
  try {
    if (!auth.currentUser) await initStudentSession();
    if (!auth.currentUser) throw new Error("Aucune session Firebase");

    const email = auth.currentUser.email ? auth.currentUser.email.toLowerCase() : (data.email || '');
    const nom = data.nom || auth.currentUser.displayName || (email ? email.split('@')[0] : "Élève");
    const uid = auth.currentUser.uid;

    const docKey = email 
      ? `${classeId}_${email}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `${classeId}_${eleveId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, "progressions_v2", docKey);

    const payload = {
      uid: uid,
      classe_id: classeId,
      classe: classeId,
      eleve_id: eleveId,
      eleve_nom: nom,
      eleve_email: email,
      updated_at: new Date().toISOString(),
      timestamp: serverTimestamp(),
      xp: data.xp || 0,
      charte: data.charte || null,
      escape_game: data.escape_game || null,
      email_sim: data.email_sim || null,
      bilan_personnel: data.bilan_personnel || null,
      mission_app: data.mission_app || null,
      http_sim: data.http_sim || null,
      tri_donnees: data.tri_donnees || null,
      mission_secu: data.mission_secu || null,
      bilan_personnel_ch2: data.bilan_personnel_ch2 || null,
      competences: data.competences || {},
      rewarded_activities: Array.isArray(data.rewarded_activities) ? data.rewarded_activities : [],
      defis_ludiques: data.defis_ludiques || null,
      badges_altx: Array.isArray(data.badges_altx) ? data.badges_altx : [],
      spam_attempts: Number(data.spam_attempts) || 0,
      tutor_calls_count: Number(data.tutor_calls_count) || 0,
      hints_used_count: Number(data.hints_used_count) || 0,
      active_course_id: data.active_course_id || 'fmttn-1re',
      active_exercise_id: data.active_exercise_id || ''
    };

    if (data.spam_warning !== undefined) {
      payload.spam_warning = data.spam_warning;
    }

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore] Progression synchronisée pour ${nom} (${email || eleveId} - ${classeId})`);
    return true;
  } catch (err) {
    console.warn("[Firestore] Mode local actif :", err.message);
    return false;
  }
}

// 5c. Écoute temps réel du profil de l'élève connecté (pour recevoir les avertissements anti-spam et recalculs XP en direct)
export function subscribeToStudentOwnProgression(classeId, email, uid, onUpdate) {
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const keySource = normalizedEmail || uid;
    if (!classeId || !keySource) return () => {};
    const docKey = `${classeId}_${keySource}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, "progressions_v2", docKey);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, () => {});
  } catch (_) {
    return () => {};
  }
}

// 5b. Chargement de la progression réelle d'un élève depuis Firestore
export async function chargerProgressionEleveReelle(classeId, email, uid) {
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    let progressionData = null;

    if (classeId && normalizedEmail) {
      const docKey = `${classeId}_${normalizedEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const snap = await getDoc(doc(db, "progressions_v2", docKey));
      if (snap.exists()) {
        progressionData = snap.data();
      }
    }

    if (!progressionData && normalizedEmail) {
      const q = query(collection(db, "progressions_v2"), where("eleve_email", "==", normalizedEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        progressionData = qSnap.docs[0].data();
      }
    }

    if (!progressionData && uid) {
      const q = query(collection(db, "progressions_v2"), where("uid", "==", uid));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        progressionData = qSnap.docs[0].data();
      }
    }

    // Charger l'historique des soumissions de devoirs de l'élève
    const submissions = [];
    if (normalizedEmail) {
      const qSub = query(collection(db, "submissions"), where("email_eleve", "==", normalizedEmail));
      const subSnap = await getDocs(qSub);
      subSnap.forEach(d => {
        submissions.push({ id: d.id, ...d.data() });
      });
      submissions.sort((a, b) => new Date(b.date_soumission || 0) - new Date(a.date_soumission || 0));
    }

    return {
      progression: progressionData,
      submissions
    };
  } catch (err) {
    console.warn("[chargerProgressionEleveReelle] Erreur :", err.message);
    return null;
  }
}

// 6. Écoute temps réel des élèves d'une classe pour la "Météo de classe SeGEC"
export function listenToClasseProgressions(classeId, onUpdate) {
  try {
    const q = query(
      collection(db, "progressions_v2"), 
      where("classe_id", "==", classeId)
    );

    return onSnapshot(q, (snapshot) => {
      const eleves = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        
        let egRatio = d.escape_game?.finished ? "5/5" : `${d.escape_game?.dossierUnlocked?.length || 1}/5`;
        let charteEtat = d.charte?.finished ? "acquis" : (d.charte?.score > 0 ? "en_cours" : "a_renforcer");
        let d5Etat = d.competences?.['NUM-1.D5'] || "en_cours";
        let d6Etat = d.competences?.['NUM-1.D6'] || "en_cours";
        let p2Etat = d.competences?.['NUM-1.P2'] || (d.email_sim?.validationResults?.scoreGlobal >= 5 ? "acquis" : "a_renforcer");
        
        // Chapitre 2 : Sécurité & Données
        let num2_d1 = d.competences?.['NUM-2.D1'] || "en_cours";
        let num2_d2 = d.competences?.['NUM-2.D2'] || "en_cours";
        let num2_d3 = d.competences?.['NUM-2.D3'] || (d.http_sim?.scenarioActif === 'banque' ? "acquis" : "en_cours");
        let num2_d4 = d.competences?.['NUM-2.D4'] || (d.tri_donnees?.score === 6 ? "acquis" : (d.tri_donnees?.score > 0 ? "en_cours" : "a_renforcer"));
        let num2_d5 = d.competences?.['NUM-2.D5'] || "en_cours";
        let num2_m1 = d.competences?.['NUM-2.M1'] || (d.mission_secu?.isSubmitted ? "acquis" : "en_cours");

        let score = 50;
        if (egRatio === "5/5") score += 15;
        if (charteEtat === "acquis") score += 10;
        if (p2Etat === "acquis") score += 15;
        if (num2_d3 === "acquis") score += 5;
        if (num2_d4 === "acquis") score += 5;

        eleves.push({
          docKey: docSnap.id,
          id: d.eleve_id,
          uid: d.uid || '',
          classe_id: d.classe_id || classeId,
          email: d.eleve_email || '',
          nom: d.eleve_nom || "Élève",
          eg: egRatio,
          charte: charteEtat,
          d5: d5Etat,
          d6: d6Etat,
          p2: p2Etat,
          num2_d1,
          num2_d2,
          num2_d3,
          num2_d4,
          num2_d5,
          num2_m1,
          score: Math.min(100, score),
          xp: d.xp || 0,
          rewarded_activities: Array.isArray(d.rewarded_activities) ? d.rewarded_activities : [],
          spam_warning: d.spam_warning || null,
          spam_attempts: Number(d.spam_attempts) || 0,
          competences: d.competences || {},
          escape_game: d.escape_game || null,
          charte_obj: d.charte || null,
          email_sim: d.email_sim || null,
          mission_app: d.mission_app || null,
          http_sim: d.http_sim || null,
          tri_donnees: d.tri_donnees || null,
          mission_secu: d.mission_secu || null,
          defis_ludiques: d.defis_ludiques || null,
          tutor_calls_count: Number(d.tutor_calls_count) || 0,
          hints_used_count: Number(d.hints_used_count) || 0,
          active_course_id: d.active_course_id || 'fmttn-1re',
          active_exercise_id: d.active_exercise_id || '',
          updated_at: d.updated_at
        });
      });

      onUpdate(eleves);
    }, (error) => {
      console.warn("[Firestore] Écoute classe :", error.message);
      onUpdate(null);
    });
  } catch (err) {
    console.warn("[Firestore] Erreur snapshot :", err.message);
    return () => {};
  }
}

// 7. GESTION DES ÉLÈVES & CLASSES (SYSTÈME V1 ÉTENDU)
export async function getRealClassStudents(classeId) {
  try {
    const studentMap = {};

    // 1. Récupérer depuis 'users'
    const qUsers = classeId === 'all' 
      ? collection(db, "users") 
      : query(collection(db, "users"), where("classe", "==", classeId));
    
    const snapUsers = await getDocs(qUsers);
    snapUsers.forEach(docSnap => {
      const u = docSnap.data();
      studentMap[docSnap.id] = {
        id: docSnap.id,
        nom: u.nom || u.displayName || docSnap.id,
        email: u.email || "",
        classe: u.classe || classeId,
        status: u.status || "actif",
        xp: u.xp || 0
      };
    });

    // 2. Récupérer depuis 'progressions_v2' pour fusionner les scores réels
    const qProg = classeId === 'all'
      ? collection(db, "progressions_v2")
      : query(collection(db, "progressions_v2"), where("classe_id", "==", classeId));

    const snapProg = await getDocs(qProg);
    snapProg.forEach(docSnap => {
      const p = docSnap.data();
      const elId = p.eleve_email || p.eleve_id || docSnap.id;
      if (!studentMap[elId]) {
        studentMap[elId] = {
          id: elId,
          nom: p.eleve_nom || "Élève",
          email: p.eleve_email || (elId.includes('@') ? elId : ""),
          classe: p.classe_id || classeId,
          status: "actif",
          xp: p.xp || 0
        };
      } else {
        if (!studentMap[elId].email && p.eleve_email) {
          studentMap[elId].email = p.eleve_email;
        }
      }
      studentMap[elId].progression = p;
      if (p.xp > studentMap[elId].xp) {
        studentMap[elId].xp = p.xp;
      }
    });

    return Object.values(studentMap).sort((a, b) => a.nom.localeCompare(b.nom));
  } catch (err) {
    console.error("[Firestore] Erreur chargement élèves réels :", err);
    return [];
  }
}

// Ajouter un élève manuellement (depuis le tableau de bord prof)
export async function addRealStudent(nom, classe, email = "") {
  try {
    const studentId = 'el_' + Math.random().toString(36).substring(2, 9);
    const userDocRef = doc(db, "users", studentId);
    await setDoc(userDocRef, {
      nom: nom.trim(),
      classe: classe,
      email: email.trim().toLowerCase(),
      status: "actif",
      created_at: serverTimestamp()
    });

    // Initialiser document progression
    const progRef = doc(db, "progressions_v2", `${classe}_${studentId}`);
    await setDoc(progRef, {
      classe_id: classe,
      classe: classe,
      eleve_id: studentId,
      eleve_nom: nom.trim(),
      xp: 0,
      updated_at: new Date().toISOString()
    });

    return { success: true, id: studentId };
  } catch (err) {
    console.error("[Firestore] Erreur création élève :", err);
    return { success: false, error: err.message };
  }
}

// Modifier la classe d'un élève
export async function updateStudentClassInDb(studentId, newClass, currentClass = "1A") {
  try {
    const userDocRef = doc(db, "users", studentId);
    await updateDoc(userDocRef, { classe: newClass });

    // Migrer la progression si elle existe
    const oldProgRef = doc(db, "progressions_v2", `${currentClass}_${studentId}`);
    const oldSnap = await getDoc(oldProgRef);
    if (oldSnap.exists()) {
      const data = oldSnap.data();
      data.classe_id = newClass;
      data.classe = newClass;
      const newProgRef = doc(db, "progressions_v2", `${newClass}_${studentId}`);
      await setDoc(newProgRef, data);
      await deleteDoc(oldProgRef);
    }

    return true;
  } catch (err) {
    console.error("[Firestore] Erreur changement de classe :", err);
    return false;
  }
}

// 8. CONFIGURATION DIAPORAMAS & NOTEBOOKLM
export async function savePresentationConfig(moduleId, config) {
  try {
    const docRef = doc(db, "config_presentations", moduleId);
    await setDoc(docRef, {
      ...config,
      updated_at: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("[Firestore] Sauvegarde présentation :", err);
    return false;
  }
}

export async function getPresentationConfig(moduleId) {
  try {
    const docRef = doc(db, "config_presentations", moduleId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    return null;
  }
}

// 9. TUTEUR SOCRATIQUE GEMINI (MULTI-COURS — PHASE 7 SÉCURISÉE)
export async function interrogerTuteurIA({ question, historique = [], idExercice = 'ch1-communication', courseId = 'fmttn-1re', contexteEleve = '' }) {
  if (!auth.currentUser) {
    await initStudentSession();
  }
  const fn = httpsCallable(functions, "interrogerTuteur", { timeout: 28000 });

  // Convertir les 10 derniers messages au format attendu par Gemini : { role: 'user' | 'model', text }
  const normalizedHistory = (historique || [])
    .slice(-10)
    .map(msg => ({
      role: (msg.role === 'model' || msg.sender === 'bot') ? 'model' : 'user',
      text: String(msg.text || '')
    }))
    .filter(m => m.text.trim().length > 0);

  const res = await fn({
    question,
    historique: normalizedHistory,
    id_exercice: idExercice,
    course_id: courseId,
    contexte_eleve: contexteEleve
  });
  return res.data?.reponse || res.data?.feedback || res.data;
}

// 10. SOUMISSION & CORRECTION AUTOMATISÉE DE DEVOIR
export async function soumettreDevoirCloud({ code_eleve, id_exercice, titre_exercice, course_id, nom_eleve, classe_id, type, autonomie = {} }) {
  try {
    if (!auth.currentUser) await initStudentSession();
    const fn = httpsCallable(functions, "corrigerDevoir");
    const res = await fn({
      code_eleve,
      id_exercice,
      titre_exercice,
      course_id,
      nom_eleve,
      classe_id,
      type,
      autonomie
    });
    return res.data;
  } catch (err) {
    console.error("[soumettreDevoirCloud] Erreur :", err);
    throw err;
  }
}

// 11. GESTION DES SOUMISSIONS & VALIDATION PROFESSEUR (PHASE 3)
export function listenToTeacherSubmissions(callback) {
  try {
    const q = collection(db, "submissions");
    return onSnapshot(q, (snapshot) => {
      const subs = [];
      snapshot.forEach(docSnap => {
        subs.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Tri du plus récent au plus ancien
      subs.sort((a, b) => new Date(b.date_soumission || 0) - new Date(a.date_soumission || 0));
      callback(subs);
    }, (err) => {
      console.warn("[listenToTeacherSubmissions] Erreur écoute submissions :", err);
      callback([]);
    });
  } catch (err) {
    console.error("[listenToTeacherSubmissions] Erreur :", err);
    return () => {};
  }
}

export async function updateTeacherSubmission(subId, { status, note, profMessage, feedbackIa }) {
  try {
    const docRef = doc(db, "submissions", subId);
    const payload = {
      status,
      date_correction: serverTimestamp()
    };
    if (note !== undefined && note !== null) payload.note_suggeree = Number(note);
    if (profMessage !== undefined) payload.prof_message = profMessage;
    if (feedbackIa !== undefined) payload.feedback_ia = feedbackIa;

    await updateDoc(docRef, payload);
    return true;
  } catch (err) {
    console.error("[updateTeacherSubmission] Erreur :", err);
    throw err;
  }
}

export async function deleteTeacherSubmission(subId) {
  try {
    await deleteDoc(doc(db, "submissions", subId));
    return true;
  } catch (err) {
    console.error("[deleteTeacherSubmission] Erreur :", err);
    throw err;
  }
}

// 12. GÉNÉRATEUR & SYNCHRONISATION GOOGLE FORMS (PHASE 5)
export async function genererQuizGoogleFormsCloud({ sujet, niveau, nombreQuestions, titreQuiz, folderId, accessToken }) {
  try {
    const fn = httpsCallable(functions, "genererQuizGoogleFormsIA");
    const res = await fn({
      sujet,
      niveau,
      nombreQuestions,
      titreQuiz,
      folderId,
      accessToken
    });
    return res.data;
  } catch (err) {
    console.error("[genererQuizGoogleFormsCloud] Erreur :", err);
    throw err;
  }
}

export async function recupererReponsesGoogleFormsCloud({ formId, accessToken, classeId, courseId }) {
  try {
    const fn = httpsCallable(functions, "recupererReponsesGoogleForms");
    const res = await fn({
      formId,
      accessToken,
      classeId,
      courseId
    });
    return res.data;
  } catch (err) {
    console.error("[recupererReponsesGoogleFormsCloud] Erreur :", err);
    throw err;
  }
}

// 13. GESTION DES LIAISONS DE CLASSES CLASSROOM (PHASE 9)
export async function getClassMappings() {
  try {
    const snap = await getDocs(collection(db, "classes"));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn("[getClassMappings] Erreur :", err.message);
    return [];
  }
}

export async function saveClassMapping(classeId, { classroom_course_id, classroom_course_name, course_id, cours_ids = [], auto_sync_grades = false }) {
  try {
    const cleanId = String(classeId || '1A').trim().toUpperCase();
    const docRef = doc(db, "classes", cleanId);
    const payload = {
      id: cleanId,
      nom: cleanId,
      classroom_course_id: classroom_course_id || '',
      classroom_course_name: classroom_course_name || '',
      course_id: course_id || 'fmttn-1re',
      cours: Array.isArray(cours_ids) && cours_ids.length > 0 ? cours_ids : [course_id || 'fmttn-1re'],
      auto_sync_grades: Boolean(auto_sync_grades),
      updated_at: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    return { success: true, mapping: payload };
  } catch (err) {
    console.error("[saveClassMapping] Erreur :", err);
    throw err;
  }
}

// 14. COURSE STUDIO & IMPORT IA (PHASE 10)
export async function structurerCoursIACloud(payload) {
  const fn = httpsCallable(functions, "structurerCoursIA", { timeout: 65000 });
  const res = await fn(payload);
  return res.data;
}

export async function getFirestoreCoursesList(includeDrafts = false) {
  try {
    const snap = await getDocs(collection(db, "cours"));
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      if (includeDrafts || data.status !== 'draft') {
        list.push({ id: d.id, ...data });
      }
    });
    return list;
  } catch (err) {
    console.warn("[getFirestoreCoursesList] Erreur :", err.message);
    return [];
  }
}

export async function getCourseModulesFromFirestore(courseId) {
  if (!courseId) return [];
  try {
    const snap = await getDocs(collection(db, "cours", courseId, "modules"));
    const modules = [];
    snap.forEach(d => modules.push({ id: d.id, ...d.data() }));
    modules.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return modules;
  } catch (err) {
    console.warn("[getCourseModulesFromFirestore] Erreur :", err.message);
    return [];
  }
}

export async function saveCourseStudioBundle({ course, modules = [], missions = [] }) {
  if (!course || !course.id) throw new Error("Identifiant du cours requis.");
  const cleanCourseId = String(course.id)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-');

  const chaptersSummary = modules.map((m, idx) => ({
    id: m.id || `mod-${idx + 1}`,
    title: m.title || `Module ${idx + 1}`,
    order: Number(m.order) || (idx + 1),
    file: m.file || ''
  }));

  const courseRef = doc(db, "cours", cleanCourseId);
  const coursePayload = {
    id: cleanCourseId,
    title: (course.title || 'Nouveau Cours').trim(),
    pitch: (course.pitch || '').trim(),
    workspaceType: course.workspaceType || 'office',
    status: course.status === 'draft' ? 'draft' : 'published',
    profs: Array.isArray(course.profs) && course.profs.length > 0
      ? course.profs
      : (auth.currentUser?.email ? [auth.currentUser.email.toLowerCase()] : ['gatweb@gmail.com']),
    systemPrompt: course.systemPrompt || '',
    theme: {
      primaryColor: course.theme?.primaryColor || course.primaryColor || '#2563eb',
      icon: course.theme?.icon || course.icon || '📚'
    },
    chapters: chaptersSummary,
    updated_at: serverTimestamp()
  };

  await setDoc(courseRef, coursePayload, { merge: true });

  // Sauvegarder chaque module dans cours/{id}/modules/{mid}
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const modId = String(mod.id || `mod-${i + 1}`).trim();
    const modRef = doc(db, "cours", cleanCourseId, "modules", modId);
    await setDoc(modRef, {
      id: modId,
      course_id: cleanCourseId,
      title: mod.title || `Module ${i + 1}`,
      order: Number(mod.order) || (i + 1),
      theorie_md: mod.theorie_md || '',
      updated_at: serverTimestamp()
    }, { merge: true });
  }

  // Sauvegarder chaque mission dans exercices/{exId}
  for (let j = 0; j < missions.length; j++) {
    const ex = missions[j];
    const exId = String(ex.id || `${cleanCourseId}-ex-${j + 1}`).trim();
    const exRef = doc(db, "exercices", exId);
    await setDoc(exRef, {
      id: exId,
      course_id: cleanCourseId,
      module_id: ex.module_id || ex.chapitre || (modules[0]?.id || 'mod-1'),
      chapitre: ex.module_id || ex.chapitre || (modules[0]?.id || 'mod-1'),
      titre: ex.titre || ex.title || `Mission ${j + 1}`,
      consigne: ex.consigne || ex.enonce_md || '',
      enonce_md: ex.consigne || ex.enonce_md || '',
      theorie_md: ex.theorie_md || '',
      submission_type: ex.submission_type || (coursePayload.workspaceType === 'coding' ? 'code' : 'drive_link'),
      type: ex.type || coursePayload.workspaceType || 'office',
      starter_code: ex.starter_code || {
        html: ex.starter_html || '',
        css: ex.starter_css || '',
        js: ex.starter_js || ''
      },
      updated_at: serverTimestamp()
    }, { merge: true });
  }

  return {
    success: true,
    courseId: cleanCourseId,
    course: coursePayload
  };
}

export async function deleteCourseFromFirestore(courseId) {
  if (!courseId) return false;
  await deleteDoc(doc(db, "cours", courseId));
  return true;
}

// 15. BOUCLIER ANTI-SPAM : PURGE DES DOUBLONS EN LOT, RECALCUL XP & AVERTISSEMENTS OFFICIELS
export async function purgerDoublonsSubmissionsFirestore(submissionsList = []) {
  const groups = {};
  for (const sub of submissionsList) {
    if (!sub || !sub.id) continue;
    const studentKey = (sub.email_eleve && sub.email_eleve !== 'anonyme@eleve.local')
      ? sub.email_eleve.toLowerCase().trim()
      : (sub.uid_eleve && sub.uid_eleve !== 'anonyme' ? sub.uid_eleve : (sub.nom_eleve || 'inconnu').toLowerCase().trim());
    const exKey = (sub.id_exercice || sub.exercice_id || sub.titre_exercice || 'exo').trim();
    const pairKey = `${studentKey}__${exKey}`;
    if (!groups[pairKey]) groups[pairKey] = [];
    groups[pairKey].push(sub);
  }

  const idsToDelete = [];
  const spammerStats = {};

  Object.values(groups).forEach(list => {
    if (list.length <= 1) return;
    // Trier : garder en priorité une copie déjà validée, sinon la meilleure note / la plus récente
    list.sort((a, b) => {
      if (a.status === 'valide' && b.status !== 'valide') return -1;
      if (b.status === 'valide' && a.status !== 'valide') return 1;
      const noteDiff = (Number(b.note_suggeree) || 0) - (Number(a.note_suggeree) || 0);
      if (noteDiff !== 0) return noteDiff;
      return new Date(b.date_soumission || 0) - new Date(a.date_soumission || 0);
    });

    const kept = list[0];
    const duplicates = list.slice(1);
    duplicates.forEach(d => idsToDelete.push(d.id));

    const stKey = (kept.email_eleve || kept.uid_eleve || kept.nom_eleve || 'inconnu').toLowerCase();
    if (!spammerStats[stKey]) {
      spammerStats[stKey] = {
        nom: kept.nom_eleve || 'Élève',
        email: kept.email_eleve || '',
        uid: kept.uid_eleve || '',
        classe: kept.classe_id || kept.classe || '1A',
        duplicatesRemoved: 0
      };
    }
    spammerStats[stKey].duplicatesRemoved += duplicates.length;
  });

  // Suppression par lots de 400 documents (limite Firestore = 500 opérations/batch)
  const chunkSize = 400;
  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(docId => {
      batch.delete(doc(db, "submissions", docId));
    });
    await batch.commit();
  }

  return {
    deletedCount: idsToDelete.length,
    spammers: Object.values(spammerStats)
  };
}

export async function appliquerSanctionEtAvertissementEleve({
  docKey,
  classeId = '1A',
  eleveId = '',
  email = '',
  nom = 'Élève',
  newXp = null,
  rewardedActivities = null,
  sendWarning = false,
  warningMessage = '',
  teacherName = 'Ton professeur',
  duplicateCount = 0
}) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const resolvedDocKey = docKey || (normalizedEmail
    ? `${classeId}_${normalizedEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    : `${classeId}_${eleveId || nom}`.replace(/[^a-zA-Z0-9_-]/g, '_'));

  const progRef = doc(db, "progressions_v2", resolvedDocKey);
  const updatePayload = {
    updated_at: new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  if (newXp !== null && newXp !== undefined) {
    updatePayload.xp = Math.max(0, Number(newXp) || 0);
  }
  if (Array.isArray(rewardedActivities)) {
    updatePayload.rewarded_activities = rewardedActivities;
  }
  if (sendWarning) {
    updatePayload.spam_warning = {
      active: true,
      message: warningMessage || `Un comportement de spam (${duplicateCount > 0 ? duplicateCount + ' soumissions/clics en double' : 'clics répétés pour gonfler artificiellement les XP'}) a été détecté sur ton compte. Tes points d'XP illégitimes ont été supprimés et tes copies en double ont été purgées.`,
      sent_at: new Date().toISOString(),
      sent_by: teacherName,
      duplicate_count: Number(duplicateCount) || 0,
      acknowledged_at: null
    };
  }

  await setDoc(progRef, updatePayload, { merge: true });

  // Mettre aussi à jour la collection 'users' si un document correspondant existe
  if (normalizedEmail) {
    try {
      const qU = query(collection(db, "users"), where("email", "==", normalizedEmail));
      const snapU = await getDocs(qU);
      for (const d of snapU.docs) {
        const uUpd = {};
        if (newXp !== null && newXp !== undefined) uUpd.xp = Math.max(0, Number(newXp) || 0);
        if (sendWarning) uUpd.spam_warning = updatePayload.spam_warning;
        if (Object.keys(uUpd).length > 0) {
          await updateDoc(d.ref, uUpd);
        }
      }
    } catch (_) {}
  }

  return { success: true, docKey: resolvedDocKey, payload: updatePayload };
}

export async function acquitterAvertissementSpamEleve({ classeId = '1A', eleveId = '', email = '' }) {
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const keySource = normalizedEmail || eleveId;
    if (!keySource) return false;
    const docKey = `${classeId}_${keySource}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const progRef = doc(db, "progressions_v2", docKey);
    const snap = await getDoc(progRef);
    const prevWarn = snap.exists() ? (snap.data().spam_warning || {}) : {};

    await setDoc(progRef, {
      spam_warning: {
        ...prevWarn,
        active: false,
        acknowledged_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("[acquitterAvertissementSpamEleve] Erreur :", err.message);
    return false;
  }
}




