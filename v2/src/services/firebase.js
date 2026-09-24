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

// 2. Connexion Enseignant via Google
export async function loginProfesseurGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    if (!isTeacherEmailAllowed(user.email)) {
      console.warn("[Auth Prof] Adresse non autorisée sur la liste blanche :", user.email);
      await signOut(auth);
      await initStudentSession();
      return { 
        success: false, 
        reason: "not_whitelisted", 
        email: user.email 
      };
    }

    const profile = getTeacherProfile(user.email);
    console.log("[Auth Prof] Enseignant authentifié :", profile);
    return {
      success: true,
      user,
      profile
    };
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
  return onAuthStateChanged(auth, (user) => {
    if (user && !user.isAnonymous && isTeacherEmailAllowed(user.email)) {
      callback({
        isTeacher: true,
        user,
        profile: getTeacherProfile(user.email)
      });
    } else {
      callback({
        isTeacher: false,
        user: user || null,
        profile: null
      });
    }
  });
}

// 5. Sauvegarde de la progression élève dans Firestore (/progressions_v2)
export async function saveEleveProgression(classeId, eleveId, data) {
  try {
    const docKey = `${classeId}_${eleveId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, "progressions_v2", docKey);
    
    const payload = {
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
      competences: data.competences || {}
    };

    await setDoc(docRef, payload, { merge: true });

    // Enregistrement miroir dans collection 'users' (compatibilité V1)
    const userRef = doc(db, "users", eleveId);
    await setDoc(userRef, {
      nom: data.nom || "Élève",
      classe: classeId,
      xp: data.xp || 0,
      status: "actif",
      last_active: serverTimestamp()
    }, { merge: true });

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
        
        let score = 50;
        if (egRatio === "5/5") score += 20;
        if (charteEtat === "acquis") score += 10;
        if (p2Etat === "acquis") score += 20;

        eleves.push({
          id: d.eleve_id,
          nom: d.eleve_nom || "Élève",
          eg: egRatio,
          charte: charteEtat,
          d5: d5Etat,
          d6: d6Etat,
          p2: p2Etat,
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

// 9. TUTEUR SOCRATIQUE GEMINI
export async function interrogerTuteurIA(question, historique = [], idExercice = 'ch1-communication') {
  try {
    const fn = httpsCallable(functions, "interrogerTuteur");
    const systemPromptFMTTN = `Tu es le Tuteur Socratique d'@lt_X pour des élèves de 1re secondaire (11-12 ans) en Belgique (programme SeGEC / FMTTN).
Ton rôle :
1. Être chaleureux, encourageant et clair (mots simples, phrases courtes).
2. Ne JAMAIS donner la réponse directement : pose une question guidée ou donne un indice sous forme d'analogie de la vie quotidienne.
3. Rappelle les principes de respect de la vie privée (RGPD), de sécurité et de nétiquette.
4. Si l'élève parle de courriel, rappelle l'astuce de 'Cci' = Invisible, 'Cc' = visible par tous.`;

    const res = await fn({
      question,
      historique,
      id_exercice: idExercice,
      system_prompt_custom: systemPromptFMTTN
    });
    return res.data?.reponse || res.data?.feedback || res.data;
  } catch (err) {
    console.warn("[TuteurIA] Erreur d'appel Cloud Function (fallback local activé) :", err.message);
    return null;
  }
}
