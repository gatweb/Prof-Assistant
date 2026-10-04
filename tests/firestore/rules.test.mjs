// Tests des règles Firestore — ProfAssistant (V1 + V2)
// Lancer l'émulateur puis : FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where, getDocs,
} from 'firebase/firestore';

const RULES = readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8');
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');

let env;

// --- Profils ---
const google = (email) => ({
  email, email_verified: true, firebase: { sign_in_provider: 'google.com' },
});
const prof = () => env.authenticatedContext('prof', google('gatweb@gmail.com')).firestore();
const alice = () => env.authenticatedContext('alice-uid', google('alice@eleve.be')).firestore();
const bob = () => env.authenticatedContext('bob-uid', google('bob@eleve.be')).firestore();
const fauxProf = () => env.authenticatedContext('faux', google('pirate@ecole.be')).firestore();
const anon = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const visiteur = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-profassistant',
    firestore: { rules: RULES, host, port: Number(port) },
  });
});
after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'config/settings'), { activeCourses: ['bureautique-3e'] });
    await setDoc(doc(db, 'courses/bureautique-3e'), { titre: 'Bureautique' });
    await setDoc(doc(db, 'exercices/ex1'), { titre: 'Ex 1' });
    await setDoc(doc(db, 'users/alice@eleve.be'), { nom: 'Alice', classe: '3GB' });
    await setDoc(doc(db, 'submissions/subA'), { email_eleve: 'alice@eleve.be', status: 'a_valider', note_suggeree: 70 });
    await setDoc(doc(db, 'exam_results/resA'), { email_eleve: 'alice@eleve.be', score: 8 });
    await setDoc(doc(db, 'users_progress/alice@eleve.be_bureautique-3e'), { email: 'alice@eleve.be', completedChapters: [] });
    await setDoc(doc(db, 'progressions_v2/1A_el_owned'), { uid: 'anon-1', classe_id: '1A', eleve_id: 'el_owned', xp: 10 });
    await setDoc(doc(db, 'progressions_v2/1A_el_legacy'), { classe_id: '1A', eleve_id: 'el_legacy', xp: 5 });
    await setDoc(doc(db, 'enseignants/prof_dynamique@ecole.be'), {
      email: 'prof_dynamique@ecole.be',
      nom: 'Prof Dynamique',
      role: 'enseignant',
      actif: true
    });
    await setDoc(doc(db, 'enseignants/prof_desactive@ecole.be'), {
      email: 'prof_desactive@ecole.be',
      nom: 'Prof Désactivé',
      role: 'enseignant',
      actif: false
    });
  });
});

// =========================== V1 : élève Google ===========================
test('V1 élève : lit config, cours et exercices', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'config/settings')));
  await assertSucceeds(getDocs(collection(alice(), 'courses')));
  await assertSucceeds(getDocs(collection(alice(), 'exercices')));
});

test('V1 élève : lit ses soumissions et résultats (requête filtrée par email)', async () => {
  const db = alice();
  await assertSucceeds(getDocs(query(collection(db, 'submissions'), where('email_eleve', '==', 'alice@eleve.be'))));
  await assertSucceeds(getDocs(query(collection(db, 'exam_results'), where('email_eleve', '==', 'alice@eleve.be'))));
});

test('V1 élève : ne lit PAS les soumissions des autres', async () => {
  await assertFails(getDoc(doc(bob(), 'submissions/subA')));
  await assertFails(getDocs(collection(bob(), 'submissions')));
});

test('V1 élève : crée une soumission de quiz à son nom', async () => {
  await assertSucceeds(addDoc(collection(alice(), 'submissions'), { email_eleve: 'alice@eleve.be', status: 'valide' }));
});

test('V1 élève : ne crée pas de soumission au nom d\'un autre ni « publiée »', async () => {
  await assertFails(addDoc(collection(alice(), 'submissions'), { email_eleve: 'bob@eleve.be', status: 'valide' }));
  await assertFails(addDoc(collection(alice(), 'submissions'), { email_eleve: 'alice@eleve.be', status: 'publie' }));
});

test('V1 élève : met à jour ses compteurs d\'indices / autonomie', async () => {
  const db = alice();
  await assertSucceeds(updateDoc(doc(db, 'submissions/subA'), { 'indices_utilises.niv1': 1 }));
  await assertSucceeds(updateDoc(doc(db, 'submissions/subA'), { 'autonomie.sorties_page': 2 }));
  await assertSucceeds(updateDoc(doc(db, 'submissions/subA'), { questions_libres: 3 }));
});

test('V1 élève : ne modifie PAS sa note ni son statut', async () => {
  await assertFails(updateDoc(doc(alice(), 'submissions/subA'), { note_suggeree: 100 }));
  await assertFails(updateDoc(doc(alice(), 'submissions/subA'), { status: 'publie' }));
});

test('V1 élève : enregistre un résultat d\'examen à son nom uniquement', async () => {
  await assertSucceeds(addDoc(collection(alice(), 'exam_results'), { email_eleve: 'alice@eleve.be', score: 9 }));
  await assertFails(addDoc(collection(alice(), 'exam_results'), { email_eleve: 'bob@eleve.be', score: 20 }));
});

test('V1 élève : progression par cours (1re visite + mise à jour)', async () => {
  const db = bob();
  await assertSucceeds(getDoc(doc(db, 'users_progress/bob@eleve.be_bureautique-3e'))); // inexistant
  await assertSucceeds(setDoc(doc(db, 'users_progress/bob@eleve.be_bureautique-3e'), { email: 'bob@eleve.be', completedChapters: ['ch1'] }, { merge: true }));
  await assertFails(getDoc(doc(db, 'users_progress/alice@eleve.be_bureautique-3e')));
  await assertFails(setDoc(doc(db, 'users_progress/alice@eleve.be_bureautique-3e'), { email: 'bob@eleve.be' }, { merge: true }));
});

test('V1 élève : s\'envoie un mail de révision à lui-même seulement', async () => {
  await assertSucceeds(addDoc(collection(alice(), 'mail_queue'), { to: 'alice@eleve.be', message: { subject: 'x', html: 'y' } }));
  await assertFails(addDoc(collection(alice(), 'mail_queue'), { to: 'victime@exemple.com', message: { subject: 'x', html: 'y' } }));
});

test('V1 élève : lit sa fiche mais pas l\'annuaire ni la config en écriture', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'users/alice@eleve.be')));
  await assertFails(getDocs(collection(alice(), 'users')));
  await assertFails(setDoc(doc(alice(), 'config/settings'), { activeCourses: [] }));
});

// =========================== V2 : élève anonyme ===========================
test('V2 élève anonyme : crée et met à jour SA progression', async () => {
  const db = anon('anon-2');
  await assertSucceeds(setDoc(doc(db, 'progressions_v2/1B_el_new'), { uid: 'anon-2', classe_id: '1B', xp: 0 }, { merge: true }));
  await assertSucceeds(setDoc(doc(db, 'progressions_v2/1B_el_new'), { uid: 'anon-2', xp: 50 }, { merge: true }));
});

test('V2 élève anonyme : rattache un ancien document sans uid', async () => {
  await assertSucceeds(setDoc(doc(anon('anon-3'), 'progressions_v2/1A_el_legacy'), { uid: 'anon-3', xp: 20 }, { merge: true }));
});

test('V2 élève anonyme : ne lit ni ne modifie la progression d\'un autre', async () => {
  const db = anon('anon-intrus');
  await assertFails(getDoc(doc(db, 'progressions_v2/1A_el_owned')));
  await assertFails(getDocs(collection(db, 'progressions_v2')));
  await assertFails(setDoc(doc(db, 'progressions_v2/1A_el_owned'), { uid: 'anon-intrus', xp: 9999 }, { merge: true }));
  await assertFails(deleteDoc(doc(db, 'progressions_v2/1A_el_owned')));
});

test('V2 élève anonyme : n\'écrit plus dans l\'annuaire users', async () => {
  await assertFails(setDoc(doc(anon('anon-2'), 'users/el_abc'), { nom: 'X' }));
});

// =========================== Visiteurs / usurpation ===========================
test('Visiteur non connecté : aucune donnée élève', async () => {
  const db = visiteur();
  await assertSucceeds(getDoc(doc(db, 'config/settings')));
  await assertFails(getDocs(collection(db, 'progressions_v2')));
  await assertFails(getDocs(collection(db, 'submissions')));
  await assertFails(setDoc(doc(db, 'progressions_v2/x'), { uid: 'x' }));
});

test('Adresse @ecole.be non listée : PAS de droits enseignant', async () => {
  const db = fauxProf();
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDocs(collection(db, 'progressions_v2')));
});

test('Email non vérifié : pas de droits enseignant', async () => {
  const db = env.authenticatedContext('x', { email: 'gatweb@gmail.com', email_verified: false, firebase: { sign_in_provider: 'password' } }).firestore();
  await assertFails(getDocs(collection(db, 'users')));
});

// =========================== Enseignant ===========================
test('Enseignant : accès complet (V1 + V2)', async () => {
  const db = prof();
  await assertSucceeds(getDocs(collection(db, 'users')));
  await assertSucceeds(getDocs(query(collection(db, 'progressions_v2'), where('classe_id', '==', '1A'))));
  await assertSucceeds(updateDoc(doc(db, 'submissions/subA'), { status: 'publie', note_finale: 80 }));
  await assertSucceeds(setDoc(doc(db, 'config/settings'), { activeCourses: [] }));
  await assertSucceeds(setDoc(doc(db, 'users/carl@eleve.be'), { nom: 'Carl', classe: '3GB' }));
  await assertSucceeds(deleteDoc(doc(db, 'progressions_v2/1A_el_owned')));
});

test('Enseignant via custom claim role', async () => {
  const db = env.authenticatedContext('p2', { email: 'x@y.be', email_verified: true, role: 'enseignant', firebase: { sign_in_provider: 'google.com' } }).firestore();
  await assertSucceeds(getDocs(collection(db, 'users')));
});

test('Enseignant dynamique via collection enseignants (sans claim préalable)', async () => {
  const db = env.authenticatedContext('dyn', google('prof_dynamique@ecole.be')).firestore();
  await assertSucceeds(getDocs(collection(db, 'users')));
  await assertSucceeds(getDoc(doc(db, 'enseignants/prof_dynamique@ecole.be')));
});

test('Enseignant désactivé dans la collection : accès refusé', async () => {
  const db = env.authenticatedContext('des', google('prof_desactive@ecole.be')).firestore();
  await assertFails(getDocs(collection(db, 'users')));
});

test('Enseignant non-admin : lecture des enseignants autorisée, écriture refusée', async () => {
  const db = env.authenticatedContext('dyn', google('prof_dynamique@ecole.be')).firestore();
  await assertSucceeds(getDoc(doc(db, 'enseignants/gatweb@gmail.com')));
  await assertFails(setDoc(doc(db, 'enseignants/hacker@ecole.be'), { role: 'admin' }));
});

test('Administrateur (gatweb@gmail.com ou claim admin) : écriture sur enseignants autorisée', async () => {
  const db = prof();
  await assertSucceeds(setDoc(doc(db, 'enseignants/nouveau_collegue@ecole.be'), {
    email: 'nouveau_collegue@ecole.be',
    nom: 'Nouveau',
    role: 'enseignant',
    actif: true
  }));
});

