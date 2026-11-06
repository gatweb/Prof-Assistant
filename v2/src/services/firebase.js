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
    provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
    provider.addScope('https://www.googleapis.com/auth/classroom.topics');
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

// 2b. Connexion Enseignant dédiée via Google (avec scopes Google Classroom inclus d'office)
export async function loginProfesseurGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
    provider.addScope('https://www.googleapis.com/auth/classroom.topics');
    provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
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

      return { success: true, user, profile, accessToken };
    } catch (fnErr) {
      console.warn("[Auth Prof] Erreur sync function, vérification directe Firestore :", fnErr);
      const docSnap = await getDoc(doc(db, "enseignants", user.email.toLowerCase()));
      if (docSnap.exists() && docSnap.data().actif !== false) {
        const profile = docSnap.data();
        return { success: true, user, profile, accessToken };
      }
      if (user.email === 'gatweb@gmail.com') {
        return { success: true, user, profile: { email: user.email, nom: "Administrateur", role: "admin", classes: ["all"] }, accessToken };
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

// ============================================================================
// UTILITAIRES DE DÉDUPLICATION D'ÉLÈVES, DÉTECTION D'ANNÉE SCOLAIRE & ARCHIVES
// ============================================================================
export function getCurrentSchoolYearLabel(refDate = new Date()) {
  const d = refDate instanceof Date && !isNaN(refDate) ? refDate : new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Janvier, 7 = Août
  // L'année scolaire débute à la mi-août / 1er septembre
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export function extractIsoDateFromFirestoreField(raw) {
  if (!raw) return null;
  try {
    if (typeof raw === 'string') {
      const parsed = new Date(raw);
      return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
    }
    if (typeof raw.toDate === 'function') {
      return raw.toDate().toISOString();
    }
    if (typeof raw.seconds === 'number') {
      return new Date(raw.seconds * 1000).toISOString();
    }
    if (typeof raw === 'number') {
      return new Date(raw).toISOString();
    }
  } catch (_) {}
  return null;
}

export function normalizeStudentNameTokens(nom = "") {
  const clean = String(nom || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
  if (!clean) return "";
  const tokens = clean.split(/\s+/).filter(Boolean).sort();
  return tokens.join(" ");
}

export function isGhostOrDemoAccount(nom = "", email = "", id = "", xp = 0) {
  const cleanNom = String(nom || "").trim().toLowerCase();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanId = String(id || "").trim().toLowerCase();

  if (cleanEmail === "invite@demo.local" || cleanId.startsWith("guest_")) return true;
  if (
    (cleanNom === "élève" || cleanNom === "eleve" || cleanNom === "élève invité" || cleanNom === "eleve invite" || cleanNom === "anonyme") &&
    !cleanEmail &&
    Number(xp || 0) <= 20
  ) {
    return true;
  }
  return false;
}

export function inferStudentSchoolYearAndStatus({ updatedIso, createdIso, explicitSchoolYear, explicitStatus, archived, xp = 0, fromClassroom = false }) {
  const currentYear = getCurrentSchoolYearLabel();
  const startYearNum = parseInt(currentYear.split('-')[0], 10);
  const currentSchoolYearStartMs = new Date(`${startYearNum}-08-15T00:00:00Z`).getTime();
  const prevSchoolYearStartMs = new Date(`${startYearNum - 1}-08-15T00:00:00Z`).getTime();

  const bestIso = updatedIso || createdIso || null;
  const bestMs = bestIso ? new Date(bestIso).getTime() : 0;

  let schoolYear = explicitSchoolYear || currentYear;
  if (!explicitSchoolYear) {
    if (bestMs >= currentSchoolYearStartMs) {
      schoolYear = currentYear;
    } else if (bestMs >= prevSchoolYearStartMs) {
      schoolYear = `${startYearNum - 1}-${startYearNum}`;
    } else if (bestMs > 0) {
      schoolYear = `${startYearNum - 2}-${startYearNum - 1}`;
    } else {
      // Aucune date enregistrée : si aucun XP et non importé de Classroom, c'est un vieux compte inactif
      schoolYear = (Number(xp || 0) > 0 || fromClassroom) ? currentYear : `${startYearNum - 1}-${startYearNum}`;
    }
  }

  const isArchived = Boolean(archived || explicitStatus === 'archive' || schoolYear !== currentYear);
  const isInactive = !isArchived && Number(xp || 0) === 0 && !fromClassroom && (!bestMs || (Date.now() - bestMs > 60 * 24 * 3600 * 1000));

  return {
    school_year: schoolYear,
    isCurrentYear: schoolYear === currentYear && !archived && explicitStatus !== 'archive',
    isArchived,
    isInactive,
    lastActiveIso: bestIso
  };
}

// 6. Écoute temps réel des élèves d'une classe pour la "Météo de classe SeGEC" (AVEC DÉDUPLICATION & FILTRE FANTÔMES)
export function listenToClasseProgressions(classeId, onUpdate) {
  try {
    const isAll = !classeId || classeId === 'tous' || classeId === 'all';
    const q = isAll
      ? collection(db, "progressions_v2")
      : query(collection(db, "progressions_v2"), where("classe_id", "==", classeId));

    return onSnapshot(q, (snapshot) => {
      const dedupMap = new Map();
      const nameToKeyMap = new Map();

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const email = (d.eleve_email || '').toLowerCase().trim();
        const nom = (d.eleve_nom || "Élève").trim();
        const cl = (d.classe_id || d.classe || (isAll ? '1A' : classeId)).toUpperCase().trim();
        const xp = Number(d.xp) || 0;

        // Ignorer les sessions invités / fantômes vides
        if (isGhostOrDemoAccount(nom, email, d.eleve_id || docSnap.id, xp)) {
          return;
        }

        const normName = normalizeStudentNameTokens(nom);
        const nameLookupKey = normName && normName !== 'eleve' ? `${cl}::${normName}` : '';

        let canonicalKey = email || (nameLookupKey && nameToKeyMap.get(nameLookupKey)) || nameLookupKey || `${cl}::${d.eleve_id || docSnap.id}`;
        if (email && nameLookupKey) {
          const prevKey = nameToKeyMap.get(nameLookupKey);
          if (prevKey && prevKey !== email && dedupMap.has(prevKey)) {
            const prevEntry = dedupMap.get(prevKey);
            dedupMap.delete(prevKey);
            dedupMap.set(email, prevEntry);
          }
          nameToKeyMap.set(nameLookupKey, email);
        } else if (nameLookupKey && !nameToKeyMap.has(nameLookupKey)) {
          nameToKeyMap.set(nameLookupKey, canonicalKey);
        }

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

        const updatedIso = extractIsoDateFromFirestoreField(d.updated_at);
        const yearMeta = inferStudentSchoolYearAndStatus({
          updatedIso,
          explicitSchoolYear: d.school_year,
          explicitStatus: d.status,
          archived: d.archived,
          xp
        });

        const candidate = {
          docKey: docSnap.id,
          progDocKeys: [docSnap.id],
          id: d.eleve_id || docSnap.id,
          uid: d.uid || '',
          classe_id: cl,
          classe: cl,
          email,
          nom,
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
          xp,
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
          bulletin_appreciation: d.bulletin_appreciation || '',
          bulletin_custom_note20: d.bulletin_custom_note20 ?? null,
          updated_at: updatedIso,
          ...yearMeta
        };

        if (!dedupMap.has(canonicalKey)) {
          dedupMap.set(canonicalKey, candidate);
        } else {
          const existing = dedupMap.get(canonicalKey);
          const allProgKeys = Array.from(new Set([...(existing.progDocKeys || []), docSnap.id]));
          const preferNew = (candidate.xp > existing.xp) || (candidate.score > existing.score) || (!existing.email && candidate.email);
          const merged = preferNew ? { ...existing, ...candidate } : { ...candidate, ...existing };
          merged.progDocKeys = allProgKeys;
          merged.xp = Math.max(existing.xp || 0, candidate.xp || 0);
          merged.score = Math.max(existing.score || 50, candidate.score || 50);
          merged.email = existing.email || candidate.email || '';
          merged.nom = (existing.nom && existing.nom !== 'Élève') ? existing.nom : candidate.nom;
          merged.competences = { ...(candidate.competences || {}), ...(existing.competences || {}) };
          merged.bulletin_appreciation = existing.bulletin_appreciation || candidate.bulletin_appreciation || '';
          if (candidate.updated_at && (!existing.updated_at || candidate.updated_at > existing.updated_at)) {
            merged.updated_at = candidate.updated_at;
            merged.lastActiveIso = candidate.updated_at;
          }
          dedupMap.set(canonicalKey, merged);
        }
      });

      const eleves = Array.from(dedupMap.values()).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
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

// 7. GESTION DES ÉLÈVES & CLASSES (SYSTÈME V1/V2 UNIFIÉ + DÉDUPLICATION MULTI-CLÉS NOM/EMAIL + ANNÉE SCOLAIRE)
export async function getRealClassStudents(classeId) {
  try {
    const isAll = !classeId || classeId === 'all' || classeId === 'tous';
    const studentMap = new Map();
    const nameIndex = new Map();

    const findCanonicalKey = (emailKey, normName, cl, fallbackId) => {
      if (emailKey && studentMap.has(emailKey)) return emailKey;
      const nameKey = normName && normName !== 'eleve' ? `${cl}::${normName}` : '';
      if (nameKey && nameIndex.has(nameKey)) {
        const mapped = nameIndex.get(nameKey);
        if (emailKey && mapped !== emailKey && studentMap.has(mapped)) {
          // Promouvoir la clé vers l'email
          const prev = studentMap.get(mapped);
          studentMap.delete(mapped);
          studentMap.set(emailKey, prev);
          nameIndex.set(nameKey, emailKey);
          return emailKey;
        }
        return mapped;
      }
      const chosen = emailKey || nameKey || `${cl}::${fallbackId}`;
      if (nameKey) nameIndex.set(nameKey, chosen);
      return chosen;
    };

    // 1. Récupérer depuis 'users'
    const qUsers = isAll
      ? collection(db, "users")
      : query(collection(db, "users"), where("classe", "==", classeId));

    const snapUsers = await getDocs(qUsers);
    snapUsers.forEach(docSnap => {
      const u = docSnap.data();
      const emailKey = (u.email || "").toLowerCase().trim();
      const nom = (u.nom || u.displayName || docSnap.id).trim();
      const cl = (u.classe || (isAll ? "1A" : classeId)).toUpperCase().trim();
      const xp = Number(u.xp) || 0;

      if (isGhostOrDemoAccount(nom, emailKey, docSnap.id, xp)) return;

      const normName = normalizeStudentNameTokens(nom);
      const mapKey = findCanonicalKey(emailKey, normName, cl, docSnap.id);
      const updatedIso = extractIsoDateFromFirestoreField(u.updated_at || u.lastLogin || u.created_at);
      const yearMeta = inferStudentSchoolYearAndStatus({
        updatedIso,
        explicitSchoolYear: u.school_year,
        explicitStatus: u.status,
        archived: u.archived,
        xp,
        fromClassroom: Boolean(u.classroom_course_name)
      });

      if (!studentMap.has(mapKey)) {
        studentMap.set(mapKey, {
          id: docSnap.id,
          userDocId: docSnap.id,
          userDocIds: [docSnap.id],
          progDocKeys: [],
          nom,
          email: emailKey,
          classe: cl,
          status: u.status || "actif",
          archived: Boolean(u.archived || u.status === 'archive'),
          classroom_course_name: u.classroom_course_name || '',
          xp,
          bulletin_appreciation: u.bulletin_appreciation || '',
          bulletin_custom_note20: u.bulletin_custom_note20 ?? null,
          ...yearMeta
        });
      } else {
        const ex = studentMap.get(mapKey);
        ex.userDocIds = Array.from(new Set([...(ex.userDocIds || []), docSnap.id]));
        if (!ex.email && emailKey) ex.email = emailKey;
        if (nom && nom !== docSnap.id && (!ex.nom || ex.nom === ex.id)) ex.nom = nom;
        if (xp > (ex.xp || 0)) ex.xp = xp;
        if (u.classroom_course_name) ex.classroom_course_name = u.classroom_course_name;
        if (u.bulletin_appreciation) ex.bulletin_appreciation = u.bulletin_appreciation;
        if (updatedIso && (!ex.lastActiveIso || updatedIso > ex.lastActiveIso)) {
          Object.assign(ex, yearMeta);
        }
      }
    });

    // 2. Récupérer depuis 'progressions_v2' pour fusionner les scores réels
    const qProg = isAll
      ? collection(db, "progressions_v2")
      : query(collection(db, "progressions_v2"), where("classe_id", "==", classeId));

    const snapProg = await getDocs(qProg);
    snapProg.forEach(docSnap => {
      const p = docSnap.data();
      const emailKey = (p.eleve_email || "").toLowerCase().trim();
      const nom = (p.eleve_nom || "Élève").trim();
      const cl = (p.classe_id || p.classe || (isAll ? "1A" : classeId)).toUpperCase().trim();
      const xp = Number(p.xp) || 0;

      if (isGhostOrDemoAccount(nom, emailKey, p.eleve_id || docSnap.id, xp)) return;

      const normName = normalizeStudentNameTokens(nom);
      const mapKey = findCanonicalKey(emailKey, normName, cl, p.eleve_id || docSnap.id);
      const updatedIso = extractIsoDateFromFirestoreField(p.updated_at);
      const yearMeta = inferStudentSchoolYearAndStatus({
        updatedIso,
        explicitSchoolYear: p.school_year,
        explicitStatus: p.status,
        archived: p.archived,
        xp
      });

      if (!studentMap.has(mapKey)) {
        studentMap.set(mapKey, {
          id: p.eleve_id || docSnap.id,
          progDocKey: docSnap.id,
          userDocIds: [],
          progDocKeys: [docSnap.id],
          nom,
          email: emailKey || ((p.eleve_id || '').includes('@') ? p.eleve_id : ""),
          classe: cl,
          status: p.status || "actif",
          archived: Boolean(p.archived || p.status === 'archive'),
          xp,
          progression: p,
          bulletin_appreciation: p.bulletin_appreciation || '',
          bulletin_custom_note20: p.bulletin_custom_note20 ?? null,
          ...yearMeta
        });
      } else {
        const ex = studentMap.get(mapKey);
        ex.progDocKey = ex.progDocKey || docSnap.id;
        ex.progDocKeys = Array.from(new Set([...(ex.progDocKeys || []), docSnap.id]));
        if (!ex.email && emailKey) ex.email = emailKey;
        if (nom && nom !== "Élève" && (!ex.nom || ex.nom === "Élève" || ex.nom === ex.id)) {
          ex.nom = nom;
        }
        if (!ex.progression || (xp >= (ex.xp || 0))) {
          ex.progression = p;
        }
        if (xp > (ex.xp || 0)) ex.xp = xp;
        if (p.bulletin_appreciation) ex.bulletin_appreciation = p.bulletin_appreciation;
        if (p.bulletin_custom_note20 !== undefined) ex.bulletin_custom_note20 = p.bulletin_custom_note20;
        if (updatedIso && (!ex.lastActiveIso || updatedIso > ex.lastActiveIso)) {
          Object.assign(ex, inferStudentSchoolYearAndStatus({
            updatedIso,
            explicitSchoolYear: p.school_year || ex.school_year,
            explicitStatus: p.status || ex.status,
            archived: p.archived || ex.archived,
            xp: ex.xp,
            fromClassroom: Boolean(ex.classroom_course_name)
          }));
        }
      }
    });

    return Array.from(studentMap.values()).map(st => ({
      ...st,
      duplicateDocsCount: Math.max(0, (st.userDocIds?.length || 0) - 1) + Math.max(0, (st.progDocKeys?.length || 0) - 1)
    })).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  } catch (err) {
    console.error("[Firestore] Erreur chargement élèves réels :", err);
    return [];
  }
}

// Ajouter un élève manuellement ou depuis Classroom (idempotent : pas de doublon si l'email existe déjà)
export async function addRealStudent(nom, classe, email = "") {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanNom = (nom || "Élève").trim();
    const cleanClasse = (classe || "1A").trim().toUpperCase();
    const normName = normalizeStudentNameTokens(cleanNom);
    const studentId = cleanEmail
      ? 'st_' + cleanEmail.replace(/[^a-z0-9]/g, '_')
      : 'st_' + (normName || cleanNom.toLowerCase()).replace(/[^a-z0-9]/g, '_');

    const schoolYear = getCurrentSchoolYearLabel();
    const nowIso = new Date().toISOString();

    const userDocRef = doc(db, "users", studentId);
    await setDoc(userDocRef, {
      nom: cleanNom,
      classe: cleanClasse,
      email: cleanEmail,
      status: "actif",
      archived: false,
      school_year: schoolYear,
      updated_at: serverTimestamp()
    }, { merge: true });

    const progKey = cleanEmail
      ? `${cleanClasse}_${cleanEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `${cleanClasse}_${studentId}`;
    const progRef = doc(db, "progressions_v2", progKey);
    await setDoc(progRef, {
      classe_id: cleanClasse,
      classe: cleanClasse,
      eleve_id: studentId,
      eleve_nom: cleanNom,
      eleve_email: cleanEmail,
      status: "actif",
      archived: false,
      school_year: schoolYear,
      updated_at: nowIso
    }, { merge: true });

    return { success: true, id: studentId };
  } catch (err) {
    console.error("[Firestore] Erreur création élève :", err);
    return { success: false, error: err.message };
  }
}

// Synchronisation rapide par lot d'une classe Classroom entière (préserve les XP existants)
export async function upsertClassroomRosterBatch(studentsList = [], classeId = "1A", classroomCourseName = "") {
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    return { success: true, count: 0 };
  }
  const cleanClasse = String(classeId || "1A").trim().toUpperCase();
  const schoolYear = getCurrentSchoolYearLabel();
  const nowIso = new Date().toISOString();
  const batch = writeBatch(db);
  let count = 0;

  for (const st of studentsList) {
    const cleanEmail = String(st.email || "").trim().toLowerCase();
    const cleanNom = String(st.fullName || st.nom || "Élève").trim();
    if (!cleanNom && !cleanEmail) continue;

    const normName = normalizeStudentNameTokens(cleanNom);
    const studentId = cleanEmail
      ? 'st_' + cleanEmail.replace(/[^a-z0-9]/g, '_')
      : 'st_' + (normName || cleanNom.toLowerCase()).replace(/[^a-z0-9]/g, '_');

    const userRef = doc(db, "users", studentId);
    batch.set(userRef, {
      nom: cleanNom,
      classe: cleanClasse,
      email: cleanEmail,
      photoURL: st.photoUrl || "",
      classroom_course_name: classroomCourseName || "",
      status: "actif",
      archived: false,
      school_year: schoolYear,
      updated_at: serverTimestamp()
    }, { merge: true });

    const progKey = cleanEmail
      ? `${cleanClasse}_${cleanEmail}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `${cleanClasse}_${studentId}`;
    const progRef = doc(db, "progressions_v2", progKey);
    batch.set(progRef, {
      classe_id: cleanClasse,
      classe: cleanClasse,
      eleve_id: studentId,
      eleve_nom: cleanNom,
      eleve_email: cleanEmail,
      status: "actif",
      archived: false,
      school_year: schoolYear,
      updated_at: nowIso
    }, { merge: true });

    count++;
  }

  await batch.commit();
  return { success: true, count };
}

// Supprimer un élève d'une classe (supprime TOUTES ses entrées fusionnées dans users et progressions_v2)
export async function deleteStudentFromClassInDb(student) {
  try {
    if (!student) return false;
    const uIds = Array.from(new Set([
      ...(student.userDocIds || []),
      ...(student.userDocId ? [student.userDocId] : []),
      ...(student.id && !student.id.includes('@') ? [student.id] : [])
    ]));
    for (const uid of uIds) {
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (_) {}
    }

    const pKeys = Array.from(new Set([
      ...(student.progDocKeys || []),
      ...(student.progDocKey ? [student.progDocKey] : []),
      ...(student.docKey ? [student.docKey] : [])
    ]));
    if (student.classe && (student.email || student.id)) {
      pKeys.push(`${student.classe}_${student.email || student.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'));
    }
    for (const pk of pKeys) {
      try {
        await deleteDoc(doc(db, "progressions_v2", pk));
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error("[deleteStudentFromClassInDb] Erreur :", err);
    return false;
  }
}

// Archiver un élève vers "Années précédentes" ou le restaurer dans l'année en cours
export async function archiveOrRestoreStudentInDb(student, archive = true) {
  try {
    if (!student) return false;
    const currentYear = getCurrentSchoolYearLabel();
    const startYear = parseInt(currentYear.split('-')[0], 10);
    const targetSchoolYear = archive ? `${startYear - 1}-${startYear}` : currentYear;
    const targetStatus = archive ? "archive" : "actif";

    const uIds = Array.from(new Set([
      ...(student.userDocIds || []),
      ...(student.userDocId ? [student.userDocId] : []),
      ...(student.id && !student.id.includes('@') ? [student.id] : [])
    ]));
    for (const uid of uIds) {
      try {
        await setDoc(doc(db, "users", uid), {
          status: targetStatus,
          archived: archive,
          school_year: targetSchoolYear,
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (_) {}
    }

    const pKeys = Array.from(new Set([
      ...(student.progDocKeys || []),
      ...(student.progDocKey ? [student.progDocKey] : []),
      ...(student.docKey ? [student.docKey] : [])
    ]));
    for (const pk of pKeys) {
      try {
        await setDoc(doc(db, "progressions_v2", pk), {
          status: targetStatus,
          archived: archive,
          school_year: targetSchoolYear
        }, { merge: true });
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error("[archiveOrRestoreStudentInDb] Erreur :", err);
    return false;
  }
}

// Enregistrer l'appréciation et/ou la note ajustée du Bulletin d'un élève
export async function saveStudentBulletinInDb(student, { appreciation = "", customNote20 = null } = {}) {
  try {
    if (!student) return false;
    const payload = {
      bulletin_appreciation: appreciation,
      bulletin_custom_note20: customNote20,
      bulletin_updated_at: new Date().toISOString()
    };

    const pKeys = Array.from(new Set([
      ...(student.progDocKeys || []),
      ...(student.progDocKey ? [student.progDocKey] : []),
      ...(student.docKey ? [student.docKey] : [])
    ]));
    if (pKeys.length > 0) {
      for (const pk of pKeys) {
        try {
          await setDoc(doc(db, "progressions_v2", pk), payload, { merge: true });
        } catch (_) {}
      }
    }

    const uIds = Array.from(new Set([
      ...(student.userDocIds || []),
      ...(student.userDocId ? [student.userDocId] : [])
    ]));
    for (const uid of uIds) {
      try {
        await setDoc(doc(db, "users", uid), payload, { merge: true });
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error("[saveStudentBulletinInDb] Erreur :", err);
    return false;
  }
}

// Assainissement 1-clic de la base élèves : supprime les comptes fantômes ("Élève", "Invité"), fusionne les doublons Firestore et archive les anciens comptes inactifs
export async function cleanDuplicatesAndArchiveOldStudentsInDb() {
  let ghostsDeleted = 0;
  let duplicatesMerged = 0;
  let oldArchived = 0;

  try {
    const snapUsers = await getDocs(collection(db, "users"));
    const snapProg = await getDocs(collection(db, "progressions_v2"));

    // 1. Supprimer les profils fantômes / démos dans 'users' et 'progressions_v2'
    for (const dSnap of snapUsers.docs) {
      const u = dSnap.data();
      if (isGhostOrDemoAccount(u.nom || u.displayName, u.email, dSnap.id, u.xp)) {
        try {
          await deleteDoc(doc(db, "users", dSnap.id));
          ghostsDeleted++;
        } catch (_) {}
      }
    }
    for (const pSnap of snapProg.docs) {
      const p = pSnap.data();
      if (isGhostOrDemoAccount(p.eleve_nom, p.eleve_email, p.eleve_id || pSnap.id, p.xp)) {
        try {
          await deleteDoc(doc(db, "progressions_v2", pSnap.id));
          ghostsDeleted++;
        } catch (_) {}
      }
    }

    // 2. Recharger la liste dédupliquée et nettoyer les documents redondants + archiver les anciens comptes inactifs
    const dedupList = await getRealClassStudents('all');
    for (const st of dedupList) {
      // S'il y a plusieurs userDocIds pour la même personne, garder le 1er (ou celui avec email) et supprimer les autres
      if (Array.isArray(st.userDocIds) && st.userDocIds.length > 1) {
        const keepId = st.userDocIds.find(id => id.startsWith('st_')) || st.userDocIds[0];
        await setDoc(doc(db, "users", keepId), {
          nom: st.nom,
          email: st.email || '',
          classe: st.classe || '1A',
          xp: st.xp || 0
        }, { merge: true });

        for (const uid of st.userDocIds) {
          if (uid !== keepId) {
            try {
              await deleteDoc(doc(db, "users", uid));
              duplicatesMerged++;
            } catch (_) {}
          }
        }
      }

      // S'il y a plusieurs progDocKeys pour la même personne, garder celui avec le meilleur XP et supprimer les doublons
      if (Array.isArray(st.progDocKeys) && st.progDocKeys.length > 1) {
        const keepProgKey = st.progDocKey || st.progDocKeys[0];
        for (const pk of st.progDocKeys) {
          if (pk !== keepProgKey) {
            try {
              await deleteDoc(doc(db, "progressions_v2", pk));
              duplicatesMerged++;
            } catch (_) {}
          }
        }
      }

      // Si le compte est inactif ou date d'une année précédente et n'est pas encore marqué archivé
      if ((st.isArchived || st.isInactive) && !st.archived) {
        await archiveOrRestoreStudentInDb(st, true);
        oldArchived++;
      }
    }

    return { ghostsDeleted, duplicatesMerged, oldArchived };
  } catch (err) {
    console.error("[cleanDuplicatesAndArchiveOldStudentsInDb] Erreur :", err);
    throw err;
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




