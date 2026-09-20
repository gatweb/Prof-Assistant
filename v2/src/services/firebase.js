import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
  onSnapshot 
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

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

// Wrapper d'appel au tuteur socratique Gemini
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
    console.warn("[TuteurIA] Erreur d'appel Cloud Function (fallback local activé) :", err);
    // Fallback local si non connecté ou erreur réseau
    return null;
  }
}
