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

// 1. Initialisation silencieuse de l'authentification (anonyme pour l'élève si non connecté)
export async function initStudentSession() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("[Auth] Session élève active :", auth.currentUser.uid);
    }
    return auth.currentUser;
  } catch (err) {
    console.warn("[Auth] Session locale active :", err.message);
    return null;
  }
}

// 2. Connexion Enseignant via Google (Synchronisation dynamique & Custom Claims)
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
        await initStudentSession();
        return { 
          success: false, 
          reason: data.reason || "not_allowed", 
          message: data.message || "Votre adresse n'est pas encore enregistrée dans l'équipe enseignante.",
          email: user.email 
        };
      }

      // Forcer le rafraîchissement du token pour obtenir les claims
      await user.getIdToken(true);

      const profile = data.profile || {
        email: user.email,
        nom: user.displayName || user.email.split('@')[0],
        role: data.role || "enseignant",
        classes: ["1A", "1B", "1C", "1D"]
      };

      console.log("[Auth Prof] Enseignant authentifié :", profile);
      return {
        success: true,
        user,
        profile
      };
    } catch (fnErr) {
      console.warn("[Auth Prof] Erreur sync function, tentative de vérification directe Firestore :", fnErr);
      const docSnap = await getDoc(doc(db, "enseignants", user.email.toLowerCase()));
      if (docSnap.exists() && docSnap.data().actif !== false) {
        const profile = docSnap.data();
        return { success: true, user, profile };
      }
      if (user.email === 'gatweb@gmail.com') {
        return { success: true, user, profile: { email: user.email, nom: "Administrateur", role: "admin", classes: ["all"] } };
      }
      await signOut(auth);
      await initStudentSession();
      return { success: false, reason: "error", error: fnErr.message };
    }
  } catch (err) {
    console.error("[Auth Prof] Erreur de connexion Google :", err);
    return { success: false, reason: "error", error: err.message };
  }
}

// 3. Déconnexion Enseignant
export async function logoutProfesseur() {
  try {
    await signOut(auth);
    await initStudentSession();
    return true;
  } catch (err) {
    console.error("[Auth Prof] Erreur de déconnexion :", err);
    return false;
  }
}

// 4. Écoute de l'état d'authentification
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
            isTeacher: true,
            isAdmin: profile.role === 'admin' || user.email === 'gatweb@gmail.com',
            user,
            profile
          });
          return;
        }
      } catch (err) {
        console.warn("[subscribeToAuthState] Erreur vérification enseignant :", err.message);
      }
    }

    callback({
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
    const docKey = `${classeId}_${eleveId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, "progressions_v2", docKey);
    
    if (!auth.currentUser) await initStudentSession();
    if (!auth.currentUser) throw new Error("Aucune session Firebase");

    const payload = {
      uid: auth.currentUser.uid,
      classe_id: classeId,
      classe: classeId,
      eleve_id: eleveId,
      eleve_nom: data.nom || "Élève",
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
      competences: data.competences || {}
    };

    await setDoc(docRef, payload, { merge: true });

    // Note : l'ancien miroir vers 'users' a été retiré (Phase 0 de la fusion).
    // 'users' est indexé par email (V1) et réservé aux enseignants ; les élèves
    // V2 sont déjà listés via 'progressions_v2' dans getRealClassStudents().

    console.log(`[Firestore] Progression synchronisée pour ${data.nom} (${classeId})`);
    return true;
  } catch (err) {
    console.warn("[Firestore] Mode local actif :", err.message);
    return false;
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
          id: d.eleve_id,
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
      const elId = p.eleve_id || docSnap.id;
      if (!studentMap[elId]) {
        studentMap[elId] = {
          id: elId,
          nom: p.eleve_nom || "Élève",
          email: "",
          classe: p.classe_id || classeId,
          status: "actif",
          xp: p.xp || 0
        };
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

// 9. TUTEUR SOCRATIQUE GEMINI (MULTI-COURS)
export async function interrogerTuteurIA(question, historique = [], idExercice = 'ch1-communication', customPrompt = null) {
  try {
    const fn = httpsCallable(functions, "interrogerTuteur");
    const defaultPrompt = `Tu es le Tuteur Socratique de ProfAssistant.
Ton rôle :
1. Être chaleureux, encourageant et clair (mots simples, phrases courtes).
2. Ne JAMAIS donner la réponse directement : pose une question guidée ou donne un indice sous forme d'analogie de la vie quotidienne.
3. Reste concis et adapté aux élèves.`;

    const res = await fn({
      question,
      historique,
      id_exercice: idExercice,
      system_prompt_custom: customPrompt || defaultPrompt
    });
    return res.data?.reponse || res.data?.feedback || res.data;
  } catch (err) {
    console.warn("[TuteurIA] Erreur d'appel Cloud Function (fallback local activé) :", err.message);
    return null;
  }
}

// 10. SOUMISSION & CORRECTION AUTOMATISÉE DE DEVOIR
export async function soumettreDevoirCloud({ code_eleve, id_exercice, nom_eleve, classe_id, type }) {
  try {
    if (!auth.currentUser) await initStudentSession();
    const fn = httpsCallable(functions, "corrigerDevoir");
    const res = await fn({
      code_eleve,
      id_exercice,
      nom_eleve,
      classe_id,
      type
    });
    return res.data;
  } catch (err) {
    console.error("[soumettreDevoirCloud] Erreur :", err);
    throw err;
  }
}

