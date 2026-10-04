/**
 * 🏫 Service d'Intégration Google Classroom (Phase 4)
 * 
 * Permet aux enseignants de :
 * 1. Connecter leur compte Google avec les scopes Classroom.
 * 2. Importer leurs cours et listes d'élèves (rosters) vers ProfAssistant.
 * 3. Publier des exercices/missions ProfAssistant comme devoirs Classroom.
 * 4. Synchroniser et renvoyer les notes validées dans Classroom.
 */

import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students'
];

const STORAGE_KEY_TOKEN = 'prof_classroom_access_token';
const API_BASE = 'https://classroom.googleapis.com/v1';

let inMemoryToken = null;

/**
 * Récupère le token d'accès Classroom (mémoire ou sessionStorage)
 */
export function getClassroomToken() {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch (e) {
    console.warn("[Classroom] sessionStorage non accessible :", e);
  }
  return null;
}

/**
 * Enregistre le token d'accès Classroom
 */
export function setClassroomToken(token) {
  inMemoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch (e) {
    console.warn("[Classroom] Impossible d'écrire le token en storage :", e);
  }
}

/**
 * Vérifie si une session Classroom est active
 */
export function isClassroomConnected() {
  return !!getClassroomToken();
}

/**
 * Déconnexion de Google Classroom (efface le token)
 */
export function disconnectGoogleClassroom() {
  setClassroomToken(null);
}

/**
 * Déclenche le flux OAuth Google avec les scopes Google Classroom
 */
export async function connectGoogleClassroom() {
  const provider = new GoogleAuthProvider();
  CLASSROOM_SCOPES.forEach(scope => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'consent' });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error("Aucun jeton d'accès OAuth reçu lors de l'authentification.");
    }

    setClassroomToken(accessToken);
    return {
      success: true,
      token: accessToken,
      user: result.user
    };
  } catch (err) {
    console.error("[Classroom] Erreur lors de la connexion OAuth :", err);
    throw err;
  }
}

/**
 * Effectue un appel authentifié vers l'API Google Classroom
 */
async function classroomFetch(endpoint, options = {}) {
  const token = getClassroomToken();
  if (!token) {
    throw new Error("Non connecté à Google Classroom. Veuillez vous reconnecter.");
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expiré
    setClassroomToken(null);
    throw new Error("Votre session Google Classroom a expiré. Veuillez reconnecter votre compte.");
  }

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Erreur API Classroom (${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        errMsg = parsed.error.message;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  // Certains endpoints (comme :return) renvoient du vide
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return {};
}

/**
 * 1. Liste les cours actifs dont l'enseignant est propriétaire ou membre
 */
export async function fetchClassroomCourses() {
  const data = await classroomFetch('/courses?teacherId=me&courseStates=ACTIVE');
  return (data.courses || []).map(c => ({
    id: c.id,
    name: c.name,
    section: c.section || '',
    descriptionHeading: c.descriptionHeading || '',
    room: c.room || '',
    alternateLink: c.alternateLink || `https://classroom.google.com/c/${c.id}`
  }));
}

/**
 * 2. Récupère la liste des élèves (roster) d'un cours Classroom
 */
export async function fetchCourseStudents(courseId) {
  if (!courseId) throw new Error("Identifiant de cours requis.");
  const data = await classroomFetch(`/courses/${courseId}/students`);
  return (data.students || []).map(s => {
    const p = s.profile || {};
    const nameObj = p.name || {};
    const fullName = nameObj.fullName || `${nameObj.givenName || ''} ${nameObj.familyName || ''}`.trim() || 'Élève';
    return {
      userId: s.userId || p.id,
      fullName,
      email: (p.emailAddress || '').toLowerCase().trim(),
      photoUrl: p.photoUrl || ''
    };
  });
}

/**
 * 3. Récupère la liste des devoirs (CourseWork) d'un cours Classroom
 */
export async function fetchCourseWork(courseId) {
  if (!courseId) throw new Error("Identifiant de cours requis.");
  const data = await classroomFetch(`/courses/${courseId}/courseWork?courseWorkStates=PUBLISHED`);
  return (data.courseWork || []).map(cw => ({
    id: cw.id,
    courseId: cw.courseId,
    title: cw.title,
    description: cw.description || '',
    maxPoints: cw.maxPoints || 100,
    state: cw.state,
    alternateLink: cw.alternateLink || '',
    creationTime: cw.creationTime
  }));
}

/**
 * 4. Publie une activité ProfAssistant comme devoir (CourseWork) dans Classroom
 */
export async function publishCourseWork(courseId, { title, description, linkUrl, maxPoints = 100 }) {
  if (!courseId) throw new Error("Cours Classroom non sélectionné.");
  if (!title) throw new Error("Titre du devoir requis.");

  const payload = {
    title: title.trim(),
    description: description ? description.trim() : "Complétez l'activité sur ProfAssistant en cliquant sur le lien ci-joint.",
    materials: [
      {
        link: {
          url: linkUrl || window.location.origin + '/v2/',
          title: "🚀 Ouvrir l'activité ProfAssistant"
        }
      }
    ],
    workType: "ASSIGNMENT",
    state: "PUBLISHED",
    maxPoints: Number(maxPoints) || 100
  };

  const created = await classroomFetch(`/courses/${courseId}/courseWork`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return {
    id: created.id,
    title: created.title,
    alternateLink: created.alternateLink || `https://classroom.google.com/c/${courseId}/a/${created.id}/details`,
    maxPoints: created.maxPoints
  };
}

/**
 * 5. Récupère les soumissions d'élèves pour un devoir donné
 */
export async function fetchCourseWorkSubmissions(courseId, courseWorkId) {
  if (!courseId || !courseWorkId) throw new Error("Paramètres manquants.");
  const data = await classroomFetch(`/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`);
  return data.studentSubmissions || [];
}

/**
 * 6. Renvoyer / synchroniser la note d'un élève dans Google Classroom
 */
export async function syncStudentGradeToClassroom({ courseId, courseWorkId, studentEmail, studentUserId, grade }) {
  if (!courseId || !courseWorkId) throw new Error("Identifiants cours/devoir Classroom requis.");

  // Récupérer toutes les soumissions du devoir
  const subs = await fetchCourseWorkSubmissions(courseId, courseWorkId);
  if (!subs.length) {
    throw new Error("Aucune soumission élève trouvée pour ce devoir dans Classroom.");
  }

  // Trouver la soumission de l'élève par son userId ou en interrogeant son profil
  let targetSub = null;
  if (studentUserId) {
    targetSub = subs.find(s => s.userId === studentUserId);
  }

  // Si pas de match direct par userId, recherche par email parmi les élèves du cours
  if (!targetSub && studentEmail) {
    const students = await fetchCourseStudents(courseId);
    const matchedStudent = students.find(st => st.email.toLowerCase() === studentEmail.toLowerCase());
    if (matchedStudent) {
      targetSub = subs.find(s => s.userId === matchedStudent.userId);
    }
  }

  if (!targetSub) {
    throw new Error(`Impossible de trouver la copie de l'élève (${studentEmail || studentUserId}) dans ce devoir Classroom.`);
  }

  const subId = targetSub.id;
  const numGrade = Math.min(100, Math.max(0, Math.round(Number(grade))));

  // Étape 1 : Mettre à jour la note (draftGrade & assignedGrade)
  const patchPayload = {
    draftGrade: numGrade,
    assignedGrade: numGrade
  };

  await classroomFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${subId}?updateMask=draftGrade,assignedGrade`,
    {
      method: 'PATCH',
      body: JSON.stringify(patchPayload)
    }
  );

  // Étape 2 : Publier / renvoyer officiellement la copie à l'élève
  try {
    await classroomFetch(
      `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${subId}:return`,
      {
        method: 'POST',
        body: JSON.stringify({})
      }
    );
  } catch (returnErr) {
    console.warn("[Classroom] Note enregistrée en brouillon, retour direct refusé :", returnErr.message);
  }

  return {
    success: true,
    submissionId: subId,
    grade: numGrade
  };
}
