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
      console.log("[Auth] Session élève active (anonyme sécurisée) :", auth.currentUser.uid);
    }
    return auth.currentUser;
  } catch (err) {
    console.warn("[Auth] Authentification anonyme non active ou hors ligne :", err.message);
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
      // Réinitialiser la session anonyme
      await initStudentSession();
      return { 
        success: false, 
        reason: "not_whitelisted", 
        email: user.email 
      };
    }

    const profile = getTeacherProfile(user.email);
    console.log("[Auth Prof] Enseignant authentifié avec succès :", profile);
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
    console.log(`[Firestore] Progression synchronisée pour ${data.nom} (${classeId})`);
    return true;
  } catch (err) {
    console.warn("[Firestore] Impossible de sauvegarder en ligne (mode local actif) :", err.message);
    return false;
  }
}

// 6. Écoute temps réel des élèves d'une classe pour la "Météo de classe ed.ai"
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
        
        // Calcul du score global estimé
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
      console.warn("[Firestore] Erreur d'écoute de la classe :", error.message);
      onUpdate(null); // Signal d'erreur/repli
    });
  } catch (err) {
    console.warn("[Firestore] Erreur initialisation snapshot :", err.message);
    return () => {};
  }
}

// 7. Injecteur de données de démonstration pour une classe (1 clic pour la présentation)
export async function seedDemoClassData(classeId) {
  const mockStudents = [
    { id: 'el_1', nom: 'Lucas M.', eg: { finished: true, dossierUnlocked: [1,2,3,4,5] }, charte: { finished: true, score: 3 }, competences: { 'NUM-1.D5': 'en_cours', 'NUM-1.D6': 'en_cours', 'NUM-1.P2': 'a_renforcer' }, xp: 180 },
    { id: 'el_2', nom: 'Emma B.', eg: { finished: true, dossierUnlocked: [1,2,3,4,5] }, charte: { finished: true, score: 3 }, competences: { 'NUM-1.D5': 'acquis', 'NUM-1.D6': 'acquis', 'NUM-1.P2': 'acquis' }, xp: 260 },
    { id: 'el_3', nom: 'Youssef K.', eg: { finished: false, dossierUnlocked: [1,2,3,4] }, charte: { finished: true, score: 3 }, competences: { 'NUM-1.D5': 'acquis', 'NUM-1.D6': 'en_cours', 'NUM-1.P2': 'en_cours' }, xp: 210 },
    { id: 'el_4', nom: 'Camille D.', eg: { finished: false, dossierUnlocked: [1,2,3] }, charte: { finished: false, score: 1 }, competences: { 'NUM-1.D5': 'a_renforcer', 'NUM-1.D6': 'a_renforcer', 'NUM-1.P2': 'a_renforcer' }, xp: 95 },
    { id: 'el_5', nom: 'Noah V.', eg: { finished: true, dossierUnlocked: [1,2,3,4,5] }, charte: { finished: true, score: 3 }, competences: { 'NUM-1.D5': 'acquis', 'NUM-1.D6': 'acquis', 'NUM-1.P2': 'en_cours' }, xp: 235 },
    { id: 'el_6', nom: 'Léa S.', eg: { finished: true, dossierUnlocked: [1,2,3,4,5] }, charte: { finished: true, score: 3 }, competences: { 'NUM-1.D5': 'en_cours', 'NUM-1.D6': 'acquis', 'NUM-1.P2': 'acquis' }, xp: 245 }
  ];

  for (const s of mockStudents) {
    await saveEleveProgression(classeId, s.id, {
      nom: s.nom,
      xp: s.xp,
      charte: s.charte,
      escape_game: s.eg,
      competences: s.competences
    });
  }
  return true;
}

// 8. Wrapper d'appel au tuteur socratique Gemini
export async function interrogerTuteurIA(question, historique = [], idExercice = 'ch1-communication') {
  try {
    const fn = httpsCallable(functions, "interrogerTuteur");
    const systemPromptFMTTN = `Tu es le Tuteur Socratique d'@lt_X pour des élèves de 1re secondaire (11-12 ans) en Belgique (programme FMTTN).
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
