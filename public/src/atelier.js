/**
 * workspace-html.js — Atelier HTML/CSS/JS dynamique.
 *
 * Architecture :
 *   1. Auth & refs DOM
 *   2. LOBBY : chargement + rendu des exercices Firestore
 *   3. WORKSPACE : initialisation Monaco + injection des données d'exercice
 *   4. Moteur de rendu Live (HTML/CSS) + Manuel (JS)
 *   5. Onglets, Resize Handle
 *   6. Système d'indices progressifs (depuis Firestore)
 *   7. Questions libres (compteur 5)
 *   8. Soumission + Écoute feedback Professeur
 */

import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";
import { functions } from './firebase/config.js';
import {
    doc, getDoc, getDocs, updateDoc, collection, addDoc,
    onSnapshot, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase/db.js';
import { ExamManager } from './exam.js';
import { courseManager } from './services/courseManager.js';
import { progressManager } from './services/progressManager.js';

// ============================================================
// 1. RÉFÉRENCES DOM
// ============================================================
// Layout
const lobbyView = document.getElementById('lobbyView');
const lobbyLoader = document.getElementById('lobbyLoader');
const lobbyContent = document.getElementById('lobbyContent');
const chaptersContainer = document.getElementById('chaptersContainer');
const workspaceView = document.getElementById('workspaceView');
// Header workspace & Navigation
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = document.getElementById('submitBtnHeader');
const exerciseTitleEl = document.getElementById('currentExerciseTitle');
const backToLobbyBtn = document.getElementById('backToLobbyBtnHeader');
const exportCodeBtn = document.getElementById('exportCodeBtn');
const courseContentEl = document.getElementById('courseContent');
const resourcesSidebar = document.getElementById('resourcesSidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebarResizeHandle = document.getElementById('sidebarResizeHandle');
const courseLink = document.getElementById('courseLink');
const resetExerciseBtn = document.getElementById('resetExerciseBtn');

// Éléments du Reader de Cours
const navCoursesBtn = document.getElementById('navCoursesBtn');
const coursesView = document.getElementById('coursesView');
const coursesContainer = document.getElementById('coursesContainer');
const courseReaderModal = document.getElementById('courseReaderModal');
const readerTitle = document.getElementById('readerTitle');
const readerBody = document.getElementById('readerBody');
const closeReaderBtn = document.getElementById('closeReaderBtn');

// Workspace Sidebar Tabs elements
const sidebarTabConsignesBtn = document.getElementById('sidebarTabConsignesBtn');
const sidebarTabLeconBtn = document.getElementById('sidebarTabLeconBtn');
const sidebarTabTuteurBtn = document.getElementById('sidebarTabTuteurBtn');
const tabContentConsignes = document.getElementById('tabContentConsignes');
const tabContentLecon = document.getElementById('tabContentLecon');
const tabContentTuteur = document.getElementById('tabContentTuteur');

// Éditeur
const runCodeBtn = document.getElementById('runCodeBtn');
const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
const livePreview = document.getElementById('livePreview');
const liveIndicator = document.getElementById('liveIndicator');
const tabButtons = document.querySelectorAll('.tab-btn');
const htmlEditorContainer = document.getElementById('html-editor-container');
const cssEditorContainer = document.getElementById('css-editor-container');
const jsEditorContainer = document.getElementById('js-editor-container');
const sandboxPromptInput = document.getElementById('sandboxPromptInput');
const sandboxPromptSendBtn = document.getElementById('sandboxPromptSendBtn');
const sandboxOutputPreview = document.getElementById('sandboxOutputPreview');
const resizeHandle = document.getElementById('resizeHandle');
const editorSection = document.getElementById('editorSection');
const splitWorkspace = document.getElementById('splitWorkspace');

// Chat Drawer
const chatFab = document.getElementById('chatFab');
const chatDrawer = document.getElementById('chatDrawer');
const chatDrawerClose = document.getElementById('chatDrawerClose');
const chatOverlay = document.getElementById('chatOverlay');
const chatMessages = document.getElementById('tuteurMessages') || document.getElementById('chatMessages');
const fabBadge = document.getElementById('fabBadge');
const hintBtn1 = document.getElementById('tuteurHintBtn1') || document.getElementById('hintBtn1');
const hintBtn2 = document.getElementById('tuteurHintBtn2') || document.getElementById('hintBtn2');
const hintBtn3 = document.getElementById('tuteurHintBtn3') || document.getElementById('hintBtn3');
const freeQuestionToggle = document.getElementById('freeQuestionToggle');
const freeQuestionPanel = document.getElementById('freeQuestionPanel');
const questionCounter = document.getElementById('tuteurQuestionCounter') || document.getElementById('questionCounter');
const chatInput = document.getElementById('tuteurChatInput') || document.getElementById('chatInput');
const chatSendBtn = document.getElementById('tuteurChatSendBtn') || document.getElementById('chatSendBtn');
const refreshCorrectionsBtn = document.getElementById('refreshCorrectionsBtn');
const exportEmailBtn = document.getElementById('exportEmailBtn');

// Console intégrée
const consolePanel = document.getElementById('consolePanel');
const consoleOutput = document.getElementById('consoleOutput');
const consoleCount = document.getElementById('consoleCount');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const consoleResizeHandle = document.getElementById('consoleResizeHandle');
let consoleLineCount = 0;
let consoleHasError = false;

// ============================================================
// 2. ÉTAT GLOBAL
// ============================================================
const MAX_QUESTIONS = 5;
let activeTab = 'html';
let chatHistory = [];
let disabledChapters = [];
let examActive = true;
let configUnsub = null;
const examManager = new ExamManager();
let currentExercice = null;  // Données de l'exercice courant (depuis Firestore)
let currentUser = null;      // Utilisateur authentifié courant
let profFeedbackUnsub = null;

let hintState = {
    niv1Used: false,
    niv2Used: false,
    niv3Used: false,
    questionsLeft: MAX_QUESTIONS,
    currentDocId: null,
    currentCode: null,
    pasteOps: 0,
    pasteChars: 0,
    pageExits: 0,
    timeOutside: 0,
    lastBlurTime: null
};

// ============================================================
// 3. AUTHENTIFICATION
// ============================================================
listenToAuthStatus((user) => {
    if (!user) { window.location.href = "index.html"; return; }
    currentUser = user;
    if (userEmailEl) userEmailEl.textContent = user.email;

    // Charger les cours dynamiquement et filtrer selon les droits de l'élève
    courseManager.loadCourses(user.email).then(() => {
        setupCourseSelector();
        // Initialiser le gestionnaire d'examen
        examManager.init(() => {
            switchToLobby();
        });
    }).catch(err => {
        console.error("Erreur de chargement des cours :", err);
    });

    // Écouter les réglages prof en temps réel (chapitres désactivés + examen actif)
    if (!configUnsub) {
        configUnsub = onSnapshot(doc(db, "config", "settings"), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                disabledChapters = data.disabled_chapters || [];
                examActive = data.exam_active !== false;
            } else {
                disabledChapters = [];
                examActive = true;
            }

            // Afficher/Masquer la bannière d'examen dans le lobby
            const examBanner = document.getElementById('lobbyExamBanner');
            if (examBanner) {
                if (examActive) {
                    examBanner.classList.remove('hidden');
                } else {
                    examBanner.classList.add('hidden');
                }
            }

            // Si on est dans la vue Lobby ou Cours, on recharge pour masquer/afficher les chapitres
            const examView = document.getElementById('examView');
            if (workspaceView.classList.contains('hidden') && (!examView || examView.classList.contains('hidden'))) {
                if (coursesView && !coursesView.classList.contains('hidden')) {
                    loadCourses();
                } else {
                    loadLobby();
                }
            }
        });
    }

    // Au chargement : vérifier si un exercice est demandé dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const exId = urlParams.get('ex');

    if (exId) {
        openExercise(exId);
    } else {
        loadLobby();
    }

    // Reprendre l'écoute prof si une soumission était en attente
    const pendingDocId = localStorage.getItem('pendingHtmlDocId');
    if (pendingDocId) {
        listenForProfFeedback(pendingDocId);
    }
});

if (logoutBtn) logoutBtn.addEventListener('click', async () => await logoutUser());

// ============================================================
// 4. LOBBY — Chargement et rendu des exercices
// ============================================================

function setupCourseSelector() {
    const courseSelector = document.getElementById('courseSelector');
    if (!courseSelector) return;
    
    courseSelector.innerHTML = '';
    const courses = courseManager.getCourses();
    courses.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.theme?.icon || '📚'} ${c.title}`;
        if (courseManager.getSelectedCourse()?.id === c.id) {
            option.selected = true;
        }
        courseSelector.appendChild(option);
    });
    
    courseSelector.addEventListener('change', (e) => {
        courseManager.selectCourse(e.target.value);
        if (coursesView && !coursesView.classList.contains('hidden')) {
            loadCourses();
        } else {
            loadLobby();
        }
    });
}

/**
 * Charge tous les documents de la collection `exercices` depuis Firestore
 * et les affiche groupés par `chapitre`.
 */
async function loadLobby() {
    // Reset Header UI
    if (exerciseTitleEl) exerciseTitleEl.textContent = 'Choisis un exercice';
    if (backToLobbyBtn) {
        backToLobbyBtn.style.display = 'inline-flex';
        backToLobbyBtn.classList.add('active');
        backToLobbyBtn.textContent = '🏠 Exercices';
    }
    if (navCoursesBtn) {
        navCoursesBtn.style.display = 'none'; // Désactivé (Cours unifiés)
    }
    if (exportCodeBtn) exportCodeBtn.style.display = 'none';
    if (submitBtn) submitBtn.classList.add('hidden');

    // Reset Lobby UI
    lobbyLoader.querySelector('p').textContent = 'Chargement des exercices...';
    lobbyLoader.classList.remove('hidden');
    lobbyContent.classList.add('hidden');
    lobbyView.classList.remove('hidden');
    if (coursesView) coursesView.classList.add('hidden');
    workspaceView.classList.add('hidden');

    try {
        const userEmail = userEmailEl?.textContent || '';
        const selectedCourse = courseManager.getSelectedCourse();
        const courseId = selectedCourse ? selectedCourse.id : 'js-uaa5-classic';
        const progressDocId = userEmail ? `${userEmail.replace(/\//g, '_')}_${courseId}` : '';

        // Requêtes en parallèle : exercices + soumissions de l'élève + résultats d'examen + progression
        const [exercicesSnap, submissionsSnap, examResultsSnap, progressSnap] = await Promise.all([
            getDocs(collection(db, 'exercices')),
            userEmail
                ? getDocs(query(collection(db, 'submissions'), where('email_eleve', '==', userEmail)))
                : Promise.resolve({ docs: [] }),
            userEmail
                ? getDocs(query(collection(db, 'exam_results'), where('email_eleve', '==', userEmail)))
                : Promise.resolve({ docs: [] }),
            progressDocId
                ? getDoc(doc(db, 'users_progress', progressDocId))
                : Promise.resolve(null)
        ]);

        const completedChapters = progressSnap && progressSnap.exists()
            ? (progressSnap.data().completedChapters || [])
            : [];

        if (exercicesSnap.empty) {
            chaptersContainer.innerHTML = `
                <div class="lobby-empty">
                    <p>😔 Aucun exercice disponible pour le moment.</p>
                    <p>Reviens bientôt, ton professeur prépare des activités !</p>
                </div>`;
            lobbyLoader.classList.add('hidden');
            lobbyContent.classList.remove('hidden');
            return;
        }

        // Mettre à jour la bannière d'examen dans le lobby
        const examBanner = document.getElementById('lobbyExamBanner');
        const startExamBtn = document.getElementById('startExamBtn');
        if (examBanner && startExamBtn) {
            if (examActive) {
                examBanner.classList.remove('hidden');
                
                // Vérifier si l'élève a déjà passé l'examen
                const examResults = examResultsSnap ? examResultsSnap.docs.map(d => d.data()) : [];
                if (examResults.length > 0) {
                    // Trier par date pour avoir le plus récent
                    examResults.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const latestExam = examResults[0];

                    examBanner.querySelector('p').innerHTML = `Félicitations, tu as terminé ton examen final !<br><strong>Note obtenue : ${latestExam.score}/${latestExam.total} (${latestExam.pct}%)</strong> le ${new Date(latestExam.date).toLocaleDateString('fr-FR')}.`;
                    startExamBtn.textContent = "🏆 Examen Terminé";
                    startExamBtn.disabled = true;
                    startExamBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                    startExamBtn.style.boxShadow = "none";
                    startExamBtn.style.cursor = "default";
                } else {
                    examBanner.querySelector('p').textContent = "Teste tes connaissances sur l'ensemble des chapitres actifs. 20 questions de révision pour évaluer ton autonomie !";
                    startExamBtn.textContent = "Lancer l'examen ⚡";
                    startExamBtn.disabled = false;
                    startExamBtn.style.background = "";
                    startExamBtn.style.boxShadow = "";
                    startExamBtn.style.cursor = "";
                }
            } else {
                examBanner.classList.add('hidden');
            }
        }

        // Construire une map exercice_id -> dernière soumission (la plus récente)
        const submissionsByExercice = {};
        submissionsSnap.docs.forEach(docSnap => {
            const sub = { id: docSnap.id, ...docSnap.data() };
            const exId = sub.exercice_id || sub.id_exercice;
            if (!exId) return;
            // Garder la soumission la plus récente par exercice
            const existing = submissionsByExercice[exId];
            if (!existing || new Date(sub.date_soumission) > new Date(existing.date_soumission)) {
                submissionsByExercice[exId] = sub;
            }
        });

        // Grouper les exercices par ID de chapitre du manifest (ou 'unmatched')
        const exercisesByChapter = {};
        exercicesSnap.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            if (data.is_hidden === true) return;
            
            // Filtrer par le cours sélectionné
            const exerciseCourseId = data.course_id || 'js-uaa5-classic';
            if (selectedCourse && exerciseCourseId !== selectedCourse.id) return;

            const matchedCh = selectedCourse ? courseManager.findChapterByDbLabel(selectedCourse, data.chapitre) : null;
            const chId = matchedCh ? matchedCh.id : 'unmatched';
            
            // Masquer si le chapitre est désactivé
            const chName = matchedCh ? matchedCh.title : (data.chapitre || 'Général');
            if (disabledChapters.includes(chName) || (matchedCh && disabledChapters.includes(matchedCh.title))) return;

            if (!exercisesByChapter[chId]) exercisesByChapter[chId] = [];
            exercisesByChapter[chId].push(data);
        });

        // Vider et reconstruire le DOM
        chaptersContainer.innerHTML = '';
        const courseChapters = selectedCourse ? selectedCourse.chapters : [];

        // 1. Rendre les chapitres du manifeste dans l'ordre
        courseChapters.forEach(ch => {
            if (disabledChapters.includes(ch.title)) return;

            const chapterEl = document.createElement('div');
            chapterEl.className = 'chapter-block';
            chapterEl.innerHTML = `<h2 class="chapter-title">
                <span class="chapter-icon">📚</span> ${ch.title}
            </h2>`;

            const grid = document.createElement('div');
            grid.className = 'exercise-grid';

            // --- CARTE 1 : Le cours théorique (Markdown) ---
            const isRead = completedChapters.includes(ch.id);
            const lessonCard = document.createElement('button');
            lessonCard.className = 'exercise-card course-lesson-card';
            if (isRead) {
                lessonCard.classList.add('card-status-valide');
            }
            lessonCard.setAttribute('aria-label', `Lire : ${ch.title}`);
            
            const themeColor = selectedCourse?.theme?.primaryColor || '#eab308';
            const icon = selectedCourse?.theme?.icon || '📖';

            lessonCard.innerHTML = `
                <div class="card-header">
                    <span class="card-icon">${icon}</span>
                    <div style="display:flex;gap:4px;align-items:center;">
                        ${isRead 
                            ? '<span class="card-status-badge status-valide">✅ Lu</span>' 
                            : '<span class="card-status-badge status-attente" style="background:#fef08a;color:#854d0e;">📖 À lire</span>'}
                    </div>
                </div>
                <div class="card-title">${ch.title} (Théorie)</div>
                <div class="card-consigne">Consulter le cours théorique complet et les exemples associés.</div>
                <div class="card-arrow">Lire le cours ↗</div>
            `;
            
            lessonCard.addEventListener('click', () => {
                openCourseReader(ch);
            });
            grid.appendChild(lessonCard);

            // --- EXERCICES ET QUIZZ DU CHAPITRE ---
            const exercises = exercisesByChapter[ch.id] || [];
            
            // Trier les exercices : d'abord quizz, puis code
            exercises.sort((a, b) => {
                const typeA = a.type || 'code';
                const typeB = b.type || 'code';
                if (typeA === 'quizz' && typeB !== 'quizz') return -1;
                if (typeA !== 'quizz' && typeB === 'quizz') return 1;
                return (a.titre || '').localeCompare(b.titre || '');
            });

            exercises.forEach(ex => {
                const submission = submissionsByExercice[ex.id];
                const status = submission?.status || null;
                const hasHints = ex.statut_aide !== false;

                let cardClass = 'exercise-card';
                let statusBadge = '';
                let actionLabel = 'Commencer →';

                if (status === 'valide' || status === 'publie') {
                    cardClass += ' card-status-valide';
                    statusBadge = '<span class="card-status-badge status-valide">✅ Validé</span>';
                    actionLabel = 'Revoir →';
                } else if (status === 'a_valider') {
                    cardClass += ' card-status-en-attente';
                    statusBadge = '<span class="card-status-badge status-attente">⏳ Chez ton prof</span>';
                    actionLabel = 'Voir mon code →';
                } else if (status === 'en_cours' || status === 'brouillon') {
                    cardClass += ' card-status-revision';
                    statusBadge = '<span class="card-status-badge status-revision">🔄 Corrections demandées</span>';
                    actionLabel = 'Corriger →';
                }

                const card = document.createElement('button');
                card.className = cardClass;
                card.setAttribute('data-id', ex.id);
                card.setAttribute('aria-label', `Ouvrir : ${ex.titre}`);

                card.innerHTML = `
                    <div class="card-header">
                        <span class="card-icon">${ex.type === 'quizz' ? '⚡' : (status === 'valide' || status === 'publie' ? '🎉' : '🧩')}</span>
                        <div style="display:flex;gap:4px;align-items:center;">
                            ${ex.type === 'quizz' ? '<span class="card-badge-aide" style="background:#e0e7ff;color:#4338ca;">⚡ Quizz</span>' : ''}
                            ${hasHints && ex.type !== 'quizz' ? '<span class="card-badge-aide">💡 Aide</span>' : ''}
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="card-title">${ex.titre || 'Exercice sans titre'}</div>
                    <div class="card-consigne">${(ex.enonce_md || ex.consigne || '').substring(0, 80)}...</div>
                    <div class="card-arrow">${actionLabel}</div>
                `;

                card.addEventListener('click', () => openExercise(ex.id));
                grid.appendChild(card);
            });

            chapterEl.appendChild(grid);
            chaptersContainer.appendChild(chapterEl);
        });

        // 2. Rendre les exercices non associés à un chapitre (si présent)
        const unmatchedExercises = exercisesByChapter['unmatched'] || [];
        if (unmatchedExercises.length > 0) {
            const chapterEl = document.createElement('div');
            chapterEl.className = 'chapter-block';
            chapterEl.innerHTML = `<h2 class="chapter-title">
                <span class="chapter-icon">📚</span> Autres activités
            </h2>`;

            const grid = document.createElement('div');
            grid.className = 'exercise-grid';

            unmatchedExercises.forEach(ex => {
                const submission = submissionsByExercice[ex.id];
                const status = submission?.status || null;
                const hasHints = ex.statut_aide !== false;

                let cardClass = 'exercise-card';
                let statusBadge = '';
                let actionLabel = 'Commencer →';

                if (status === 'valide' || status === 'publie') {
                    cardClass += ' card-status-valide';
                    statusBadge = '<span class="card-status-badge status-valide">✅ Validé</span>';
                    actionLabel = 'Revoir →';
                } else if (status === 'a_valider') {
                    cardClass += ' card-status-en-attente';
                    statusBadge = '<span class="card-status-badge status-attente">⏳ Chez ton prof</span>';
                    actionLabel = 'Voir mon code →';
                } else if (status === 'en_cours' || status === 'brouillon') {
                    cardClass += ' card-status-revision';
                    statusBadge = '<span class="card-status-badge status-revision">🔄 Corrections demandées</span>';
                    actionLabel = 'Corriger →';
                }

                const card = document.createElement('button');
                card.className = cardClass;
                card.setAttribute('data-id', ex.id);
                card.setAttribute('aria-label', `Ouvrir : ${ex.titre}`);

                card.innerHTML = `
                    <div class="card-header">
                        <span class="card-icon">${ex.type === 'quizz' ? '⚡' : (status === 'valide' || status === 'publie' ? '🎉' : '🧩')}</span>
                        <div style="display:flex;gap:4px;align-items:center;">
                            ${ex.type === 'quizz' ? '<span class="card-badge-aide" style="background:#e0e7ff;color:#4338ca;">⚡ Quizz</span>' : ''}
                            ${hasHints && ex.type !== 'quizz' ? '<span class="card-badge-aide">💡 Aide</span>' : ''}
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="card-title">${ex.titre || 'Exercice sans titre'}</div>
                    <div class="card-consigne">${(ex.enonce_md || ex.consigne || '').substring(0, 80)}...</div>
                    <div class="card-arrow">${actionLabel}</div>
                `;

                card.addEventListener('click', () => openExercise(ex.id));
                grid.appendChild(card);
            });

            chapterEl.appendChild(grid);
            chaptersContainer.appendChild(chapterEl);
        }

        lobbyLoader.classList.add('hidden');
        lobbyContent.classList.remove('hidden');

    } catch (e) {
        console.error('[Lobby] Erreur :', e);
        chaptersContainer.innerHTML = `<div class="lobby-empty">❌ Impossible de charger les exercices. Vérifie ta connexion.</div>`;
        lobbyLoader.classList.add('hidden');
        lobbyContent.classList.remove('hidden');
    }
}


/**
 * Ouvre un exercice spécifique.
 * 1. Affiche un loader
 * 2. Récupère le document Firestore
 * 3. Injecte les données dans le workspace
 * 4. Bascule l'affichage
 */
async function openExercise(exerciceId) {
    // Montrer un loader de transition
    lobbyLoader.querySelector('p').textContent = 'Chargement de l\'exercice...';
    lobbyLoader.classList.remove('hidden');
    lobbyContent.classList.add('hidden');

    try {
        const docSnap = await getDoc(doc(db, 'exercices', exerciceId));

        if (!docSnap.exists()) {
            alert('Cet exercice n\'existe plus. Retour au lobby.');
            loadLobby();
            return;
        }

        const exData = { id: docSnap.id, ...docSnap.data() };
        currentExercice = exData;

        // Désabonner l'écouteur précédent si actif
        if (profFeedbackUnsub) {
            profFeedbackUnsub();
            profFeedbackUnsub = null;
        }

        // Réinitialiser l'état des hints pour le nouvel exercice
        hintState = {
            niv1Used: false,
            niv2Used: false,
            niv3Used: false,
            questionsLeft: MAX_QUESTIONS,
            currentDocId: null,
            currentCode: null,
            pasteOps: 0,
            pasteChars: 0,
            pageExits: 0,
            timeOutside: 0,
            lastBlurTime: null
        };
        updateHintButtons();
        updateQuestionCounter();

        // Réinitialiser le chat
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-bubble assistant">
                    <div class="chat-sender-name">Tuteur IA</div>
                    <div class="chat-bubble-content">Bonjour ! Je suis ton tuteur IA. Pose-moi une question sur cet exercice ou clique sur un bouton d'aide ci-dessous.</div>
                </div>
            `;
        }
        chatHistory = [];
        const tuteurBadge = document.getElementById('tuteurTabBadge');
        if (tuteurBadge) tuteurBadge.style.display = 'none';

        // Récupérer la dernière soumission Firestore
        let latestSub = null;
        let isRevision = false;
        let isPending = false;
        let isValidated = false;
        let subScore = 100;
        const userEmail = currentUser?.email || userEmailEl?.textContent;
        if (userEmail) {
            try {
                const subSnap = await getDocs(
                    query(
                        collection(db, 'submissions'),
                        where('email_eleve', '==', userEmail),
                        where('exercice_id', '==', exerciceId)
                    )
                );
                if (!subSnap.empty) {
                    const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    subs.sort((a, b) => new Date(b.date_soumission) - new Date(a.date_soumission));
                    latestSub = subs[0];

                    if (latestSub) {
                        hintState.currentDocId = latestSub.id;
                        isValidated = latestSub.status === 'valide' || latestSub.status === 'publie';
                        isRevision = latestSub.status === 'en_cours' || latestSub.status === 'brouillon';
                        isPending = latestSub.status === 'a_valider';
                        subScore = latestSub.note_suggeree !== undefined ? latestSub.note_suggeree : (latestSub.note || 100);
                    }
                }
            } catch (err) {
                console.error("Erreur lors de la récupération de la soumission :", err);
            }
        }

        // Injecter les données dans l'interface
        injectExerciseData(exData);

        // Si une soumission existe, ajouter le feedback au chat
        if (latestSub) {
            if (isValidated) {
                let msg = `🎉 **Exercice validé — Note : ${subScore}/100**\n\n${latestSub.feedback_ia || ''}`;
                if (latestSub.prof_message) msg += `\n\n> 💬 *${latestSub.prof_message}*`;
                appendMessage(msg, 'assistant', 'Professeur');
            } else if (isRevision) {
                let msg = `🔄 **Correction demandée**\n\n${latestSub.feedback_ia || ''}`;
                if (latestSub.prof_message) msg += `\n\n> 💬 *${latestSub.prof_message}*`;
                msg += '\n\n_Corrige et soumet à nouveau ! 💪_';
                appendMessage(msg, 'assistant', 'Professeur');
                
                // Switcher automatiquement sur l'onglet tuteur pour que l'élève voie le feedback
                switchSidebarTab('tuteur');
            } else if (isPending) {
                let msg = `⏳ **En attente de validation par ton professeur...**`;
                if (latestSub.feedback_ia) msg += `\n\n${latestSub.feedback_ia}`;
                appendMessage(msg, 'assistant', 'Tuteur IA');
                
                // Réactiver l'écoute en direct
                listenForProfFeedback(latestSub.id);
            }
        }

        // Déterminer le type d'affichage
        const selectedCourse = courseManager.getSelectedCourse();
        const isCreativeCourse = selectedCourse && selectedCourse.workspaceType === 'creative';
        const isQuizz = exData.type === 'quizz';
        const editorSection = document.getElementById('editorSection');
        const resizeHandle = document.getElementById('resizeHandle');
        const previewSection = document.getElementById('previewSection');
        const quizzSection = document.getElementById('quizzSection');
        const creativeSection = document.getElementById('creativeSection');

        if (creativeSection) creativeSection.classList.add('hidden');
        if (quizzSection) quizzSection.classList.add('hidden');
        if (editorSection) editorSection.classList.add('hidden');
        if (resizeHandle) resizeHandle.classList.add('hidden');
        if (previewSection) previewSection.classList.add('hidden');

        if (isQuizz) {
            if (quizzSection) quizzSection.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
            
            startQuizz(exData);
        } else if (isCreativeCourse) {
            if (creativeSection) creativeSection.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
            
            initCreativeWorkspace(exData, latestSub);

            // Mettre à jour l'affichage du bouton de validation créatif
            const creativeValidateBtn = document.getElementById('creativeValidateBtn');
            const creativeSubmissionFeedback = document.getElementById('creativeSubmissionFeedback');
            if (creativeValidateBtn) {
                if (isValidated) {
                    creativeValidateBtn.textContent = `Mission validée ! (${subScore}/100) 🎉`;
                    creativeValidateBtn.disabled = true;
                    if (creativeSubmissionFeedback) {
                        creativeSubmissionFeedback.textContent = "✅ Cette mission a été validée par le professeur.";
                        creativeSubmissionFeedback.style.color = "#16a34a";
                    }
                } else if (isPending) {
                    creativeValidateBtn.textContent = "⏳ En attente de validation...";
                    creativeValidateBtn.disabled = true;
                    if (creativeSubmissionFeedback) {
                        creativeSubmissionFeedback.textContent = "⏳ Mission soumise. En attente de validation par le professeur.";
                        creativeSubmissionFeedback.style.color = "#475569";
                    }
                } else if (isRevision) {
                    creativeValidateBtn.textContent = "Soumettre à nouveau 🚀";
                    creativeValidateBtn.disabled = false;
                    if (creativeSubmissionFeedback) {
                        creativeSubmissionFeedback.textContent = "🔄 Corrections demandées. Consulte l'onglet Tuteur IA.";
                        creativeSubmissionFeedback.style.color = "#ea580c";
                    }
                } else {
                    creativeValidateBtn.textContent = "Valider ma mission 🚀";
                    creativeValidateBtn.disabled = false;
                }
            }
        } else {
            if (editorSection) editorSection.classList.remove('hidden');
            if (resizeHandle) resizeHandle.classList.remove('hidden');
            if (previewSection) previewSection.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');

            // Mettre à jour l'affichage du bouton de soumission classique
            if (submitBtn) {
                if (isValidated) {
                    submitBtn.textContent = `Exercice validé ! (${subScore}/100) 🎉`;
                    submitBtn.disabled = true;
                    submitBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                } else if (isPending) {
                    submitBtn.textContent = "⏳ En attente de validation...";
                    submitBtn.disabled = true;
                } else if (isRevision) {
                    submitBtn.textContent = "Soumettre à nouveau 🚀";
                    submitBtn.disabled = false;
                    submitBtn.style.background = "";
                } else {
                    submitBtn.textContent = "Soumettre mon code 🚀";
                    submitBtn.disabled = false;
                    submitBtn.style.background = "";
                }
            }

            // --- GESTION DU BROUILLON (Auto-Save) ---
            const savedDraft = localStorage.getItem(`draft_${exerciceId}`);
            if (savedDraft && htmlEditor && cssEditor && jsEditor) {
                try {
                    const draft = JSON.parse(savedDraft);
                    htmlEditor.setValue(draft.html || '');
                    cssEditor.setValue(draft.css || '');
                    jsEditor.setValue(draft.js || '');
                    console.log("📝 Brouillon restauré pour :", exerciceId);
                } catch (e) { console.error("Erreur draft", e); }
            }

            // Forcer Monaco à recalculer sa taille
            setTimeout(() => {
                htmlEditor?.layout();
                cssEditor?.layout();
                jsEditor?.layout();
                renderPreview();
            }, 50);
        }

        // Basculer vers le workspace
        lobbyView.classList.add('hidden');
        workspaceView.classList.remove('hidden');
        if (chatFab) chatFab.classList.add('hidden'); // On cache le FAB au profit de la sidebar

        const tabPromptBtn = document.getElementById('tab-prompt');
        if (tabPromptBtn) {
            if (selectedCourse && selectedCourse.id === 'studio-creatif') {
                tabPromptBtn.classList.remove('hidden');
            } else {
                tabPromptBtn.classList.add('hidden');
            }
        }

    } catch (e) {
        console.error('[openExercise] Erreur :', e);
        alert('Erreur lors du chargement de l\'exercice.');
        loadLobby();
    }
}

/**
 * Injecte les données de l'exercice dans les différents éléments du workspace.
 */
function injectExerciseData(exData) {
    if (exerciseTitleEl) exerciseTitleEl.textContent = exData.titre || 'Exercice sans titre';

    // Rendu des Blocs de Ressources dans les Consignes
    if (tabContentConsignes && typeof window.marked !== 'undefined') {
        const enonceHTML = window.marked.parse(exData.enonce_md || exData.consigne || 'Aucun énoncé.');
        const theorieHTML = window.marked.parse(exData.theorie_md || "Consulte ton cours pour réussir cet exercice !");
        
        tabContentConsignes.innerHTML = `
            <div class="resource-block block-enonce">
                <h3>🎯 Ton Objectif</h3>
                <div class="resource-content">${enonceHTML}</div>
            </div>
            <div class="resource-block block-theorie">
                <h3>📖 Rappel du Cours</h3>
                <div class="resource-content">${theorieHTML}</div>
            </div>
        `;
    }

    // Réinitialiser sur l'onglet Consignes par défaut
    switchSidebarTab('consignes');

    // Charger et afficher la leçon complète de cours correspondante dans le deuxième onglet
    if (tabContentLecon) {
        tabContentLecon.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 0;">
                <div class="loader-spinner" style="width:30px;height:30px;"></div>
                <p style="margin-top:10px;font-size:12px;color:#64748b;">Chargement de la leçon...</p>
            </div>
        `;

        const selectedCourse = courseManager.getSelectedCourse();
        const matchedCh = selectedCourse ? courseManager.findChapterByDbLabel(selectedCourse, exData.chapitre) : null;

        if (matchedCh && matchedCh.file) {
            if (sidebarTabLeconBtn) sidebarTabLeconBtn.style.display = 'inline-flex';

            const fileUrl = courseManager.getCourseFileUrl(selectedCourse, matchedCh.file);
            fetch(fileUrl)
                .then(res => {
                    if (!res.ok) throw new Error("Fichier introuvable");
                    return res.text();
                })
                .then(mdText => {
                    if (typeof window.marked !== 'undefined') {
                        tabContentLecon.innerHTML = `
                            <div class="resource-block" style="background:transparent;border:none;box-shadow:none;padding:0;">
                                <div class="resource-content">${window.marked.parse(mdText)}</div>
                            </div>
                        `;
                    } else {
                        tabContentLecon.innerHTML = `<pre style="white-space: pre-wrap;">${mdText}</pre>`;
                    }
                })
                .catch(err => {
                    console.error("Erreur chargement leçon sidebar :", err);
                    tabContentLecon.innerHTML = `<p style="color:red;font-size:12px;padding:10px;text-align:center;">Impossible de charger la leçon complète.</p>`;
                });
        } else {
            if (sidebarTabLeconBtn) sidebarTabLeconBtn.style.display = 'none';
            tabContentLecon.innerHTML = `<p style="color:#64748b;font-size:12px;padding:20px;text-align:center;font-style:italic;">Aucune leçon complète pour ce chapitre.</p>`;
        }
    }

    // Afficher/Masquer les boutons du header selon le mode
    if (backToLobbyBtn) {
        backToLobbyBtn.style.display = 'inline-flex';
        backToLobbyBtn.classList.remove('active');
        backToLobbyBtn.textContent = '🏠 Exercices';
    }
    if (navCoursesBtn) {
        navCoursesBtn.style.display = 'none';
    }
    if (exportCodeBtn) exportCodeBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.classList.remove('hidden');

    // Injecter le code de départ dans l'éditeur JS (si Monaco est prêt)
    const codeDepart = exData.code_depart || '';
    if (jsEditor) {
        jsEditor.setValue(codeDepart);
        // Activer l'onglet JS si du code de départ est fourni
        if (codeDepart.trim()) {
            switchTab('js');
        }
    } else {
        // Monaco pas encore prêt — stocker pour injecter au ready
        pendingCodeDepart = codeDepart;
    }

    // Mettre à jour les indices (Nouveau format)
    hintState.indices = {
        niv1: exData.indices?.niveau_1_md || null,
        niv2: exData.indices?.niveau_2_prompt || null,
        niv3: exData.indices?.niveau_3_md || null,
    };

    // Désactiver les hints si statut_aide === false
    const aideActive = exData.statut_aide !== false;
    const hintsArea = document.getElementById('hintsArea');
    if (hintsArea) {
        hintsArea.style.opacity = aideActive ? '1' : '0.4';
        hintsArea.title = aideActive ? '' : 'L\'aide est désactivée pour cet exercice.';
    }

    updateHintButtons();
}

// Sidebar toggle
if (toggleSidebarBtn && resourcesSidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
        const collapsed = resourcesSidebar.classList.toggle('collapsed');
        toggleSidebarBtn.textContent = collapsed ? '▶' : '◀';
        // Recalculer le layout Monaco
        setTimeout(() => {
            htmlEditor?.layout();
            cssEditor?.layout();
            jsEditor?.layout();
        }, 350);
    });
}

// Workspace Sidebar Tabs switching logic
function switchSidebarTab(tab) {
    if (tab === 'consignes') {
        sidebarTabConsignesBtn?.classList.add('active');
        sidebarTabLeconBtn?.classList.remove('active');
        sidebarTabTuteurBtn?.classList.remove('active');
        tabContentConsignes?.classList.remove('hidden');
        tabContentLecon?.classList.add('hidden');
        tabContentTuteur?.classList.add('hidden');
    } else if (tab === 'lecon') {
        sidebarTabConsignesBtn?.classList.remove('active');
        sidebarTabLeconBtn?.classList.add('active');
        sidebarTabTuteurBtn?.classList.remove('active');
        tabContentConsignes?.classList.add('hidden');
        tabContentLecon?.classList.remove('hidden');
        tabContentTuteur?.classList.add('hidden');
        
        // Marquer automatiquement la leçon comme lue quand l'élève clique dessus
        trackCurrentChapterAsRead();
    } else if (tab === 'tuteur') {
        sidebarTabConsignesBtn?.classList.remove('active');
        sidebarTabLeconBtn?.classList.remove('active');
        sidebarTabTuteurBtn?.classList.add('active');
        tabContentConsignes?.classList.add('hidden');
        tabContentLecon?.classList.add('hidden');
        tabContentTuteur?.classList.remove('hidden');
        
        // Cacher le badge de notification
        const badge = document.getElementById('tuteurTabBadge');
        if (badge) badge.style.display = 'none';
    }
}

function showTuteurBadge() {
    const isTuteurActive = sidebarTabTuteurBtn?.classList.contains('active');
    if (!isTuteurActive) {
        const badge = document.getElementById('tuteurTabBadge');
        if (badge) {
            badge.style.display = 'inline-block';
        }
    }
}

async function trackCurrentChapterAsRead() {
    if (!currentExercice) return;
    const selectedCourse = courseManager.getSelectedCourse();
    if (!selectedCourse) return;
    
    const matchedCh = courseManager.findChapterByDbLabel(selectedCourse, currentExercice.chapitre);
    if (!matchedCh) return;
    
    const userEmail = currentUser?.email || userEmailEl?.textContent;
    const googleUserId = currentUser?.uid || "";
    if (userEmail) {
        await progressManager.trackChapterRead(userEmail, selectedCourse.id, googleUserId, matchedCh.id);
    }
}

if (sidebarTabConsignesBtn) {
    sidebarTabConsignesBtn.addEventListener('click', () => switchSidebarTab('consignes'));
}
if (sidebarTabLeconBtn) {
    sidebarTabLeconBtn.addEventListener('click', () => switchSidebarTab('lecon'));
}
if (sidebarTabTuteurBtn) {
    sidebarTabTuteurBtn.addEventListener('click', () => switchSidebarTab('tuteur'));
}

// Fonction pour revenir proprement au lobby depuis le workspace, le cours ou l'examen
function switchToLobby() {
    // Reset Header UI
    if (exerciseTitleEl) exerciseTitleEl.textContent = 'Choisis un exercice';
    if (backToLobbyBtn) {
        backToLobbyBtn.style.display = 'inline-flex';
        backToLobbyBtn.classList.add('active');
        backToLobbyBtn.textContent = '🏠 Exercices';
    }
    if (navCoursesBtn) {
        navCoursesBtn.style.display = 'inline-flex';
        navCoursesBtn.classList.remove('active');
    }
    if (exportCodeBtn) exportCodeBtn.style.display = 'none';
    if (submitBtn) submitBtn.classList.add('hidden');
    if (chatFab) chatFab.classList.add('hidden');

    lobbyView.classList.remove('hidden');
    workspaceView.classList.add('hidden');
    if (coursesView) coursesView.classList.add('hidden');
    
    const examView = document.getElementById('examView');
    if (examView) examView.classList.add('hidden');

    // Stopper l'écoute prof en cours
    if (profFeedbackUnsub) { profFeedbackUnsub(); profFeedbackUnsub = null; }
    currentExercice = null;

    loadLobby();
}

// Bouton retour lobby
if (backToLobbyBtn) {
    backToLobbyBtn.addEventListener('click', () => {
        const examView = document.getElementById('examView');
        if (examView && !examView.classList.contains('hidden')) {
            if (examManager.isExamActive()) {
                if (!confirm("Attention, si tu quittes l'examen maintenant, ton score actuel ne sera pas sauvegardé. Es-tu sûr de vouloir abandonner ?")) {
                    return;
                }
            }
            switchToLobby();
            return;
        }

        // Retourner au lobby principal (Exercices)
        switchToLobby();
    });
}

// Clic sur l'onglet Cours
if (navCoursesBtn) {
    navCoursesBtn.addEventListener('click', () => {
        loadCourses();
    });
}

// Bouton Lancer l'examen (depuis la bannière du lobby)
const startExamBtn = document.getElementById('startExamBtn');
if (startExamBtn) {
    startExamBtn.addEventListener('click', () => {
        // 1. Masquer le lobby, afficher l'examView
        lobbyView.classList.add('hidden');
        if (coursesView) coursesView.classList.add('hidden');
        const examView = document.getElementById('examView');
        if (examView) examView.classList.remove('hidden');

        // 2. Adapter le header pour le mode Examen
        if (exerciseTitleEl) exerciseTitleEl.textContent = '📝 Examen Final JavaScript';
        if (backToLobbyBtn) {
            backToLobbyBtn.style.display = 'inline-flex';
            backToLobbyBtn.classList.remove('active');
            backToLobbyBtn.textContent = '🏠 Quitter l\'examen';
        }
        if (navCoursesBtn) {
            navCoursesBtn.style.display = 'none';
        }
        if (exportCodeBtn) exportCodeBtn.style.display = 'none';
        if (submitBtn) submitBtn.classList.add('hidden');
        if (chatFab) chatFab.classList.add('hidden'); // Désactivé pendant l'examen

        // 3. Démarrer l'examen en passant les chapitres désactivés
        examManager.start(disabledChapters);
    });
}

// ============================================================
// 5. MONACO — 3 éditeurs indépendants
// ============================================================
let htmlEditor = null;
let cssEditor = null;
let jsEditor = null;
let pendingCodeDepart = null; // Code à injecter dès que Monaco est prêt

const DEFAULT_HTML = `<!-- Ton HTML ici -->
<div class="conteneur">
  <h1>Bonjour !</h1>
</div>`;

const DEFAULT_CSS = `/* Ton CSS ici */
body {
  font-family: sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: #f0f4f8;
}
.conteneur {
  background: white;
  padding: 32px 48px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  text-align: center;
}`;

const initMonaco = () => {
    htmlEditor = window.monaco.editor.create(htmlEditorContainer, {
        value: DEFAULT_HTML, language: 'html', theme: 'vs-dark',
        automaticLayout: true, minimap: { enabled: false }, fontSize: 14,
        wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false
    });
    cssEditor = window.monaco.editor.create(cssEditorContainer, {
        value: DEFAULT_CSS, language: 'css', theme: 'vs-dark',
        automaticLayout: true, minimap: { enabled: false }, fontSize: 14,
        wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false
    });
    jsEditor = window.monaco.editor.create(jsEditorContainer, {
        value: '// Ton JavaScript ici\n// ⚠️ Clique sur "▶️ Exécuter" pour voir le résultat',
        language: 'javascript', theme: 'vs-dark',
        automaticLayout: true, minimap: { enabled: false }, fontSize: 14,
        wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false
    });

    // Live Reload + AUTO-SAVE + Paste tracking
    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.onDidChangeModelContent(() => {
            scheduleRender();
            scheduleAutoSave();
        });

        editor.onDidPaste((e) => {
            const model = editor.getModel();
            if (model) {
                const pastedTextLength = model.getValueInRange(e.range).length;
                hintState.pasteOps = (hintState.pasteOps || 0) + 1;
                hintState.pasteChars = (hintState.pasteChars || 0) + pastedTextLength;
                
                // Mettre à jour en temps réel si on a déjà un document soumis
                if (hintState.currentDocId) {
                    updateDoc(doc(db, "submissions", hintState.currentDocId), {
                        "autonomie.copie_colle_ops": hintState.pasteOps,
                        "autonomie.copie_colle_caracteres": hintState.pasteChars
                    }).catch(() => {});
                }
            }
        });
    });

    // Si un code de départ attendait Monaco ET qu'il n'y a pas de brouillon
    if (pendingCodeDepart && !localStorage.getItem(`draft_${currentExercice?.id}`)) {
        jsEditor.setValue(pendingCodeDepart);
        pendingCodeDepart = null;
    }
};

if (window.monaco && window.monaco.editor) {
    initMonaco();
} else {
    document.addEventListener('monacoReady', initMonaco);
}

// --- LOGIQUE AUTO-SAVE ---
let autoSaveTimeout = null;
function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (!currentExercice || !htmlEditor || !cssEditor || !jsEditor) return;
        const draft = {
            html: htmlEditor.getValue(),
            css: cssEditor.getValue(),
            js: jsEditor.getValue(),
            updatedAt: Date.now()
        };
        localStorage.setItem(`draft_${currentExercice.id}`, JSON.stringify(draft));
    }, 1500);
}

// --- LOGIQUE RESET ---
if (resetExerciseBtn) {
    resetExerciseBtn.addEventListener('click', () => {
        if (!currentExercice) return;
        if (confirm("Voulez-vous vraiment réinitialiser cet exercice ? Votre code actuel sera perdu.")) {
            localStorage.removeItem(`draft_${currentExercice.id}`);
            // Recharger l'exercice (ce qui injectera le code de départ)
            openExercise(currentExercice.id);
        }
    });
}

// ============================================================
// 6. MOTEUR DE RENDU LIVE
// ============================================================
let renderTimer = null;

function scheduleRender() {
    if (activeTab === 'js') return; // Pas de reload auto en mode JS
    if (liveIndicator) liveIndicator.classList.add('rendering');
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 400);
}

function renderPreview() {
    if (!htmlEditor || !cssEditor) return;
    livePreview.srcdoc = buildDocument(htmlEditor.getValue(), cssEditor.getValue(), '');
    if (liveIndicator) liveIndicator.classList.remove('rendering');
}

function executeAllCode() {
    if (!htmlEditor || !cssEditor || !jsEditor) return;
    // Vider la console avant chaque exécution
    clearConsole(true);
    livePreview.srcdoc = buildDocument(htmlEditor.getValue(), cssEditor.getValue(), jsEditor.getValue());
    if (runCodeBtn) {
        runCodeBtn.textContent = "\u2705 Exécuté !";
        runCodeBtn.disabled = true;
        setTimeout(() => { runCodeBtn.textContent = "\u25b6\ufe0f Exécuter mon code"; runCodeBtn.disabled = false; }, 1500);
    }
}

/**
 * Construit le document HTML complet à injecter dans l'iframe.
 * Injecte un intercepteur console avant le code de l'élève pour
 * rediriger console.log/error/warn/info vers le panneau console parent.
 */
function buildDocument(html, css, jsCode) {
    // Intercepteur : surcharge console.* pour envoyer via postMessage vers le parent
    const consoleInterceptor = `<script>
(function() {
  const _relay = (type) => function(...args) {
    const msg = args.map(a => {
      if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
      return String(a);
    }).join(' ');
    window.parent.postMessage({ type: 'console', level: type, message: msg }, '*');
  };
  console.log   = _relay('log');
  console.error = _relay('error');
  console.warn  = _relay('warn');
  console.info  = _relay('info');
})();
<\/script>`;

    const scriptBlock = jsCode.trim()
        ? `<script>try{${jsCode}}catch(err){window.parent.postMessage({type:'console',level:'error',message:'Uncaught: '+err.message},'*');document.body.innerHTML+='<div style="background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-top:16px;font-family:monospace;font-size:13px;">\u274c Erreur JS : '+err.message+'</div>';}<\/script>`
        : '';

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>*,*::before,*::after{box-sizing:border-box;}${css}</style></head><body>${html}${consoleInterceptor}${scriptBlock}</body></html>`;
}

if (runCodeBtn) runCodeBtn.addEventListener('click', executeAllCode);
if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', renderPreview);

// ============================================================
// 7. ONGLETS
// ============================================================
function switchTab(targetTab) {
    activeTab = targetTab;
    tabButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.tab === targetTab);
        b.setAttribute('aria-selected', b.dataset.tab === targetTab);
    });
    htmlEditorContainer.classList.toggle('hidden', targetTab !== 'html');
    cssEditorContainer.classList.toggle('hidden', targetTab !== 'css');
    jsEditorContainer.classList.toggle('hidden', targetTab !== 'js');
    
    const promptContainer = document.getElementById('prompt-sandbox-container');
    if (promptContainer) {
        promptContainer.classList.toggle('hidden', targetTab !== 'prompt');
    }

    const indicator = liveIndicator;
    if (indicator) {
        const textEl = indicator.querySelector('.live-text');
        if (textEl) {
            if (targetTab === 'js') {
                indicator.classList.add('js-mode');
                textEl.textContent = ' ▶️ Manuel';
            } else {
                indicator.classList.remove('js-mode');
                textEl.textContent = ' Live';
            }
        }
    }

    if (targetTab === 'html' && htmlEditor) htmlEditor.layout();
    if (targetTab === 'css' && cssEditor) cssEditor.layout();
    if (targetTab === 'js' && jsEditor) jsEditor.layout();
}

tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));


// ============================================================
// 8. RESIZE HANDLE
// ============================================================
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const rect = splitWorkspace.getBoundingClientRect();
    const w = Math.max(200, Math.min(rect.width - 206, e.clientX - rect.left));
    editorSection.style.width = `${w}px`;
    editorSection.style.flex = 'none';
    htmlEditor?.layout(); cssEditor?.layout(); jsEditor?.layout();
});

document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    htmlEditor?.layout(); cssEditor?.layout(); jsEditor?.layout();
});

// --- SIDEBAR RESIZE HANDLE ---
let isResizingSidebar = false;
if (sidebarResizeHandle && resourcesSidebar) {
    sidebarResizeHandle.addEventListener('mousedown', (e) => {
        isResizingSidebar = true;
        sidebarResizeHandle.classList.add('dragging');
        resourcesSidebar.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizingSidebar) return;
        const w = Math.max(250, Math.min(600, e.clientX));
        resourcesSidebar.style.width = `${w}px`;
        htmlEditor?.layout();
        cssEditor?.layout();
        jsEditor?.layout();
    });

    document.addEventListener('mouseup', () => {
        if (!isResizingSidebar) return;
        isResizingSidebar = false;
        sidebarResizeHandle.classList.remove('dragging');
        resourcesSidebar.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        htmlEditor?.layout();
        cssEditor?.layout();
        jsEditor?.layout();
    });
}

// ============================================================
// 9. DRAWER CHAT
// ============================================================
const appendMessage = (text, role, senderName = null) => {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    if (senderName) {
        const nameEl = document.createElement('div');
        nameEl.className = 'chat-sender-name';
        nameEl.textContent = senderName;
        bubble.appendChild(nameEl);
    }
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-bubble-content';
    if (role === 'assistant' && typeof window.marked !== 'undefined') {
        contentEl.innerHTML = window.marked.parse(text);
    } else {
        contentEl.textContent = text;
    }
    bubble.appendChild(contentEl);
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Notifier si le drawer est fermé ou si on n'est pas sur le bon onglet
    if (role === 'assistant' && chatDrawer && !chatDrawer.classList.contains('open')) {
        if (fabBadge) fabBadge.hidden = false;
    }
    if (role === 'assistant') {
        showTuteurBadge();
    }

    if (role === 'user' || role === 'assistant') {
        chatHistory.push({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] });
    }
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
};

const openDrawer = () => {
    switchSidebarTab('tuteur');
};

const closeDrawer = () => {
    chatDrawer.classList.remove('open');
    chatDrawer.setAttribute('aria-hidden', 'true');
    chatOverlay.classList.remove('visible');
};

if (chatFab) chatFab.addEventListener('click', openDrawer);
if (chatDrawerClose) chatDrawerClose.addEventListener('click', closeDrawer);
if (chatOverlay) chatOverlay.addEventListener('click', closeDrawer);

// ============================================================
// 10. INDICES PROGRESSIFS — Depuis Firestore (pas de Cloud Function)
// ============================================================
function updateHintButtons() {
    if (!hintBtn1) return;

    // Les indices viennent du document Firestore de l'exercice
    const hasStatutAide = currentExercice?.statut_aide !== false;
    const hasIndices = !!hintState.indices;

    // N1 : disponible si exercice chargé et aide activée
    hintBtn1.disabled = !currentExercice || !hasStatutAide || !hintState.indices?.niv1;
    hintBtn1.title = !currentExercice ? "Choisis un exercice d'abord." : (!hasStatutAide ? "L'aide est désactivée." : "Indice théorique");

    // N2 : débloqué après N1
    hintBtn2.disabled = !hintState.niv1Used || !hintState.indices?.niv2;
    hintBtn2.title = hintState.niv1Used ? "Analyser mon code" : "🔒 Consulte le Niveau 1 d'abord";

    // N3 : débloqué après N2
    hintBtn3.disabled = !hintState.niv2Used || !hintState.indices?.niv3;
    hintBtn3.title = hintState.niv2Used ? "Obtenir la structure" : "🔒 Consulte le Niveau 2 d'abord";
}

/**
 * Récupère un indice dynamique Niveau 2 en analysant le code de l'élève
 * via la Cloud Function demanderIndiceNiveau2.
 */
async function showDynamicHintNiveau2() {
    if (!currentExercice) return;
    if (!htmlEditor || !cssEditor || !jsEditor) return;

    openDrawer();

    // 1. Ajouter la bulle de chargement
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble assistant';
    loadingBubble.innerHTML = `
        <div class="chat-sender-name">Tuteur — Indice Niveau 2</div>
        <div class="chat-bubble-content">🤖 *Le tuteur analyse ton code actuel... Patientez quelques secondes.*</div>
    `;
    chatMessages.appendChild(loadingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Désactiver le bouton pendant l'appel
    if (hintBtn2) {
        hintBtn2.disabled = true;
        hintBtn2.innerHTML = '⏳ Analyse...';
    }

    try {
        const codeEleve = `<!-- HTML -->\n${htmlEditor.getValue()}\n\n/* CSS */\n${cssEditor.getValue()}\n\n// JavaScript\n${jsEditor.getValue()}`;

        // 2. Appel Cloud Function
        const demanderIndiceFn = httpsCallable(functions, 'demanderIndiceNiveau2');
        const response = await demanderIndiceFn({
            code_eleve: codeEleve,
            id_exercice: currentExercice.id
        });

        // 3. Supprimer le chargement
        loadingBubble.remove();

        const reply = response.data.reponse;
        appendMessage(reply, 'assistant', "Tuteur — Indice Niveau 2");

        hintState.niv2Used = true;

        // Tracking Firestore si une soumission est active
        if (hintState.currentDocId) {
            updateDoc(doc(db, "submissions", hintState.currentDocId), {
                [`indices_utilises.niv2`]: (hintState[`niv2Count`] = (hintState[`niv2Count`] || 0) + 1)
            }).catch(() => { });
        }

    } catch (e) {
        console.error('[Indice N2] Erreur :', e);
        loadingBubble.remove();
        appendMessage("⚠️ Désolé, je n'ai pas réussi à analyser ton code. Vérifie ta connexion ou réessaie.", 'assistant', "Tuteur — Indice Niveau 2");
    } finally {
        if (hintBtn2) {
            hintBtn2.innerHTML = '🔍 Niveau 2<span class="hint-sub">Mon code</span>';
        }
        updateHintButtons();
    }
}

/**
 * Affiche l'indice pré-écrit depuis Firestore (indices_n1/n2/n3).
 * Pas d'appel Cloud Function ici — l'indice est déjà dans le document.
 */
function showStaticHint(niveau) {
    const indice = hintState.indices?.[`niv${niveau}`];
    if (!indice) return;

    openDrawer();
    appendMessage(indice, 'assistant', `Tuteur — Indice Niveau ${niveau}`);

    if (niveau === 1) hintState.niv1Used = true;
    if (niveau === 2) hintState.niv2Used = true;
    if (niveau === 3) hintState.niv3Used = true;

    // Tracking Firestore si une soumission est active
    if (hintState.currentDocId) {
        updateDoc(doc(db, "submissions", hintState.currentDocId), {
            [`indices_utilises.niv${niveau}`]: (hintState[`niv${niveau}Count`] = (hintState[`niv${niveau}Count`] || 0) + 1)
        }).catch(() => { });
    }

    updateHintButtons();
}

if (hintBtn1) hintBtn1.addEventListener('click', () => showStaticHint(1));
if (hintBtn2) hintBtn2.addEventListener('click', showDynamicHintNiveau2);
if (hintBtn3) hintBtn3.addEventListener('click', () => showStaticHint(3));

// ============================================================
// 11. QUESTIONS LIBRES (5 maxi)
// ============================================================
function updateQuestionCounter() {
    if (!questionCounter) return;
    const left = hintState.questionsLeft;
    questionCounter.textContent = `${left} restante${left > 1 ? 's' : ''}`;
    questionCounter.classList.toggle('exhausted', left === 0);
}

if (freeQuestionToggle) {
    freeQuestionToggle.addEventListener('click', () => {
        if (hintState.questionsLeft <= 0) {
            appendMessage("Tu as utilisé tes 5 questions libres ! Essaie le Niveau 3.", 'assistant', 'Tuteur IA');
            return;
        }
        if (freeQuestionPanel) freeQuestionPanel.classList.toggle('hidden');
        if (!freeQuestionPanel?.classList.contains('hidden') && chatInput) chatInput.focus();
    });
}

const sendFreeQuestion = async () => {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text || hintState.questionsLeft <= 0) return;

    appendMessage(text, 'user', 'Vous');
    chatInput.value = '';
    hintState.questionsLeft--;
    updateQuestionCounter();

    if (hintState.currentDocId) {
        updateDoc(doc(db, "submissions", hintState.currentDocId), {
            questions_libres: MAX_QUESTIONS - hintState.questionsLeft
        }).catch(() => { });
    }
    if (hintState.questionsLeft <= 0 && freeQuestionPanel) freeQuestionPanel.classList.add('hidden');

    const loaderId = "loader-" + Date.now();
    const loader = document.createElement('div');
    loader.id = loaderId;
    loader.className = 'chat-bubble assistant';
    loader.innerHTML = "<div class='chat-sender-name'>Tuteur IA</div><div class='chat-bubble-content'>🤔 Réflexion...</div>";
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const tuteurFn = httpsCallable(functions, 'interrogerTuteur');
        const res = await tuteurFn({ 
            question: text, 
            historique: chatHistory, 
            id_exercice: currentExercice?.id,
            system_prompt_custom: courseManager.getSelectedCourse()?.systemPrompt
        });
        document.getElementById(loaderId)?.remove();
        appendMessage(res.data.reponse, 'assistant', 'Tuteur IA');

        // Enregistrer la progression : interaction avec le tuteur
        if (currentUser) {
            const selectedCourse = courseManager.getSelectedCourse();
            if (selectedCourse) {
                progressManager.trackTutorInteraction(
                    currentUser.email,
                    selectedCourse.id,
                    currentUser.uid
                );
            }
        }
    } catch (e) {
        document.getElementById(loaderId)?.remove();
        appendMessage("Désolé, le tuteur n'est pas disponible pour le moment.", 'assistant', 'Tuteur IA');
    }
};

if (chatSendBtn) chatSendBtn.addEventListener('click', sendFreeQuestion);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendFreeQuestion(); });

// ============================================================
// 12. SOUMISSION FIRESTORE
// ============================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (!htmlEditor || !cssEditor || !jsEditor) return;
        if (!currentExercice) { alert('Aucun exercice sélectionné.'); return; }

        const userEmail = userEmailEl?.textContent || 'inconnu@test.com';
        const orig = submitBtn.textContent;
        submitBtn.textContent = "⏳ Envoi pour correction...";
        submitBtn.disabled = true;

        // Code combiné pour l'analyse Gemini (HTML + CSS + JS)
        const codeEleve = `<!-- HTML -->cn${htmlEditor.getValue()}\n\n/* CSS */\n${cssEditor.getValue()}\n\n// JavaScript\n${jsEditor.getValue()}`;

        try {
            // ✅ Appel à la Cloud Function corrigerDevoir
            // Elle : analyse le code avec Gemini → écrit dans Firestore → retourne docId + évaluation
            const corrigeFn = httpsCallable(functions, 'corrigerDevoir');
            const response = await corrigeFn({
                code_eleve: codeEleve,
                id_exercice: currentExercice.id, // Corrigé ici
                nom_eleve: userEmail.split('@')[0],
                type: 'html_css_js',
                titre_exercice: currentExercice.titre || 'Exercice',
                chapitre: currentExercice.chapitre || '',
                code_html: htmlEditor.getValue(),
                code_css: cssEditor.getValue(),
                code_js: jsEditor.getValue(),
                autonomie: {
                    indices_niv1: hintState.niv1Used ? 1 : 0,
                    indices_niv2: hintState.niv2Used ? 1 : 0,
                    indices_niv3: hintState.niv3Used ? 1 : 0,
                    questions_ia: MAX_QUESTIONS - hintState.questionsLeft,
                    copie_colle_ops: hintState.pasteOps || 0,
                    copie_colle_caracteres: hintState.pasteChars || 0,
                    sorties_page: hintState.pageExits || 0,
                    temps_hors_focus_sec: hintState.timeOutside || 0
                }
            });

            const docId = response.data.docId;
            const evalIA = response.data.evaluation;

            // Activer les indices et le tracking maintenant qu'on a le docId
            hintState.currentDocId = docId;
            hintState.currentCode = codeEleve;
            updateHintButtons();

            localStorage.setItem('pendingHtmlDocId', docId);
            listenForProfFeedback(docId);

            // Afficher le feedback IA immédiat dans le drawer
            if (evalIA?.feedback_eleve) {
                appendMessage(
                    `✨ **Indice de l'IA**\n\n${evalIA.feedback_eleve}\n\n_Le professeur va valider ta copie..._`,
                    'assistant', 'Tuteur IA'
                );
            } else {
                appendMessage("📬 Ton code a bien été soumis ! Le professeur va le corriger.", 'assistant', 'Tuteur IA');
            }

            openDrawer();
            submitBtn.textContent = "✅ Soumis !";
            setTimeout(() => { submitBtn.textContent = orig; submitBtn.disabled = false; }, 3000);

        } catch (error) {
            console.error('[Submit] Erreur Cloud Function :', error);
            appendMessage("❌ Erreur lors de l'envoi. Vérifie ta connexion et réessaie.", 'assistant', 'Tuteur IA');
            openDrawer();
            submitBtn.textContent = "❌ Erreur";
            setTimeout(() => { submitBtn.textContent = orig; submitBtn.disabled = false; }, 3000);
        }
    });
}


// ============================================================
// 13. ÉCOUTE FEEDBACK PROFESSEUR (temps réel)
// ============================================================
function listenForProfFeedback(docId) {
    if (profFeedbackUnsub) profFeedbackUnsub();
    localStorage.setItem('pendingHtmlDocId', docId);

    profFeedbackUnsub = onSnapshot(doc(db, 'submissions', docId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const isValidated = data.status === 'valide' || data.status === 'publie';
        const isRevision = data.status === 'en_cours' || data.status === 'brouillon';

        if (isValidated || isRevision) {
            // Enregistrer la progression si l'exercice est validé
            if (isValidated && currentUser && currentExercice) {
                const selectedCourse = courseManager.getSelectedCourse();
                if (selectedCourse) {
                    progressManager.trackExerciseAttempt(
                        currentUser.email,
                        selectedCourse.id,
                        currentUser.uid,
                        currentExercice.id,
                        data.note_suggeree || 100
                    );
                }
            }

            const icon = isValidated ? '✅' : '🔄';
            const title = isValidated
                ? `**Exercice validé — Note : ${data.note_suggeree || 0}/100**`
                : `**Correction demandée**`;

            let msg = `${icon} ${title}\n\n${data.feedback_ia || ''}`;
            if (data.prof_message) msg += `\n\n> 💬 *${data.prof_message}*`;
            if (isRevision) msg += '\n\n_Corrige et soumet à nouveau ! 💪_';

            // 1. Ajouter le message au chat sans ouvrir
            appendMessage(msg, 'assistant', 'Professeur');

            // 2. Afficher la notification non-intrusive
            showFeedbackNotification(isValidated ? "Travail validé !" : "Correction demandée");

            // 3. Mettre à jour les boutons du workspace en temps réel
            const selectedCourse = courseManager.getSelectedCourse();
            const isCreativeCourse = selectedCourse && selectedCourse.workspaceType === 'creative';
            const subScore = data.note_suggeree !== undefined ? data.note_suggeree : (data.note || 100);

            if (isCreativeCourse) {
                const creativeValidateBtn = document.getElementById('creativeValidateBtn');
                const creativeSubmissionFeedback = document.getElementById('creativeSubmissionFeedback');
                if (creativeValidateBtn) {
                    if (isValidated) {
                        creativeValidateBtn.textContent = `Mission validée ! (${subScore}/100) 🎉`;
                        creativeValidateBtn.disabled = true;
                        if (creativeSubmissionFeedback) {
                            creativeSubmissionFeedback.textContent = "✅ Cette mission a été validée par le professeur.";
                            creativeSubmissionFeedback.style.color = "#16a34a";
                        }
                    } else if (isRevision) {
                        creativeValidateBtn.textContent = "Soumettre à nouveau 🚀";
                        creativeValidateBtn.disabled = false;
                        if (creativeSubmissionFeedback) {
                            creativeSubmissionFeedback.textContent = "🔄 Corrections demandées. Consulte l'onglet Tuteur IA.";
                            creativeSubmissionFeedback.style.color = "#ea580c";
                        }
                    }
                }
            } else {
                if (submitBtn) {
                    if (isValidated) {
                        submitBtn.textContent = `Exercice validé ! (${subScore}/100) 🎉`;
                        submitBtn.disabled = true;
                        submitBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                    } else if (isRevision) {
                        submitBtn.textContent = "Soumettre à nouveau 🚀";
                        submitBtn.disabled = false;
                        submitBtn.style.background = "";
                    }
                }
            }

            // 4. Nettoyer l'écouteur si validé
            if (isValidated) {
                profFeedbackUnsub();
                profFeedbackUnsub = null;
                localStorage.removeItem('pendingHtmlDocId');
            }
        }
    }, err => console.error('[Firestore snapshot]', err));
}

/**
 * Affiche une bannière discrète en haut du workspace.
 */
function showFeedbackNotification(text) {
    // Supprimer l'ancienne bannière si elle existe
    document.querySelector('.feedback-banner')?.remove();

    const banner = document.createElement('div');
    banner.className = 'feedback-banner';
    banner.innerHTML = `
        <span>📬 ${text}</span>
        <button onclick="document.getElementById('chatFab').click(); this.parentElement.remove();">Voir les remarques</button>
        <button style="background:transparent; color:inherit; opacity:0.6;" onclick="this.parentElement.remove()">✕</button>
    `;

    // L'insérer juste sous le header
    const header = document.querySelector('.app-header');
    header.after(banner);

    // Faire vibrer légèrement le bouton de chat
    const fab = document.getElementById('chatFab');
    if (fab) {
        fab.classList.add('pulse-animation');
        setTimeout(() => fab.classList.remove('pulse-animation'), 2000);
    }
}

// Bouton vérifier corrections
if (refreshCorrectionsBtn) {
    refreshCorrectionsBtn.addEventListener('click', async () => {
        const orig = refreshCorrectionsBtn.textContent;
        refreshCorrectionsBtn.textContent = '🔄 Vérification...';
        refreshCorrectionsBtn.disabled = true;

        const pendingDocId = localStorage.getItem('pendingHtmlDocId');
        if (pendingDocId) {
            try {
                const snap = await getDoc(doc(db, 'submissions', pendingDocId));
                if (snap.exists()) {
                    const data = snap.data();
                    const isVal = data.status === 'valide' || data.status === 'publie';
                    const isRev = data.status === 'en_cours' || data.status === 'brouillon';
                    if (isVal || isRev) {
                        let msg = `${isVal ? '✅' : '🔄'} **${isVal ? `Exercice validé — Note : ${data.note_suggeree || 0}/100` : 'Corrections demandées'}**\n\n${data.feedback_ia || ''}`;
                        if (data.prof_message) msg += `\n\n> 💬 *${data.prof_message}*`;
                        appendMessage(msg, 'assistant', 'Professeur');
                        localStorage.removeItem('pendingHtmlDocId');
                    } else {
                        appendMessage('🔄 Toujours en attente de la correction...', 'assistant', 'Tuteur IA');
                        listenForProfFeedback(pendingDocId);
                    }
                }
            } catch (e) { console.error('[Refresh]', e); }
        } else {
            appendMessage('📭 Aucune correction en attente.', 'assistant', 'Tuteur IA');
        }

        setTimeout(() => { refreshCorrectionsBtn.textContent = orig; refreshCorrectionsBtn.disabled = false; }, 2000);
    });
}

// ============================================================
// 14. EXPORT EMAIL
// ============================================================
if (exportEmailBtn) {
    exportEmailBtn.addEventListener('click', async () => {
        const orig = exportEmailBtn.textContent;
        exportEmailBtn.textContent = '⏳ Export...';
        exportEmailBtn.disabled = true;
        try {
            let html = '<h2>Aide de révision</h2>';
            chatMessages.querySelectorAll('.chat-bubble').forEach(msg => {
                const sender = msg.querySelector('.chat-sender-name')?.textContent || 'Moi';
                const content = msg.querySelector('.chat-bubble-content')?.textContent || msg.textContent;
                html += `<p><strong>${sender} :</strong> ${content}</p>`;
            });
            await addDoc(collection(db, 'mail_queue'), {
                to: userEmailEl?.textContent || 'inconnu@test.com',
                message: { subject: 'Révision Atelier HTML/CSS/JS', html }
            });
            exportEmailBtn.textContent = '✅ Envoyé';
        } catch (e) { exportEmailBtn.textContent = '❌ Erreur'; }
        setTimeout(() => { exportEmailBtn.textContent = orig; exportEmailBtn.disabled = false; }, 4000);
    });
}

// ============================================================
// 15. CONSOLE INTÉGRÉE
// ============================================================

/**
 * Vide la console.
 * @param {boolean} silent - Si true, ne montre pas le séparateur "Console effacée".
 */
function clearConsole(silent = false) {
    if (!consoleOutput) return;
    consoleOutput.innerHTML = '';
    consoleLineCount = 0;
    consoleHasError = false;
    if (consoleCount) {
        consoleCount.hidden = true;
        consoleCount.textContent = '0';
        consoleCount.classList.remove('has-errors');
    }
    if (!silent) {
        appendConsoleLine('Console effacée.', 'system');
    }
}

/**
 * Ajoute une ligne dans le panneau console.
 * @param {string} message
 * @param {'log'|'error'|'warn'|'info'|'system'} level
 */
function appendConsoleLine(message, level = 'log') {
    if (!consoleOutput) return;

    // Retirer le placeholder au premier message réel
    consoleOutput.querySelector('.console-placeholder')?.remove();

    const line = document.createElement('div');
    line.className = `console-line type-${level}`;

    const prefixMap = { log: '>>', error: '!!', warn: ' !', info: '  i', system: '--' };
    const prefix = document.createElement('span');
    prefix.className = 'console-prefix';
    prefix.textContent = prefixMap[level] ?? '>>';

    const text = document.createElement('span');
    text.className = 'console-text';
    text.textContent = message;

    line.appendChild(prefix);
    line.appendChild(text);
    consoleOutput.appendChild(line);

    // Auto-scroll vers le bas
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Mise à jour du compteur
    if (level !== 'system') {
        consoleLineCount++;
        if (consoleCount) {
            consoleCount.textContent = consoleLineCount;
            consoleCount.hidden = false;
        }
    }
    if (level === 'error') {
        consoleHasError = true;
        consoleCount?.classList.add('has-errors');
    }
}

// Réception des messages postMessage envoyés depuis l'iframe sandbox
window.addEventListener('message', (event) => {
    // Validation : ignorer les messages qui ne sont pas de notre type
    if (!event.data || event.data.type !== 'console') return;
    const { level = 'log', message = '' } = event.data;
    appendConsoleLine(String(message), level);
});

// Bouton "Effacer"
if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', () => clearConsole(false));
}

// ============================================================
// 16. REDIMENSIONNEMENT VERTICAL DE LA CONSOLE
// ============================================================
if (consoleResizeHandle && consolePanel) {
    let isDragging = false;
    let startY = 0;
    let startH = 0;

    consoleResizeHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startH = consolePanel.offsetHeight;
        consoleResizeHandle.classList.add('dragging');
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const delta = startY - e.clientY;   // Tirer vers le HAUT agrandit
        const newHeight = Math.min(Math.max(36, startH + delta), window.innerHeight * 0.65);
        consolePanel.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        consoleResizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ============================================================
// 12. EXPORTATION DU CODE
// ============================================================
function exportCode() {
    if (!currentExercice) return;

    const html = htmlEditor.getValue();
    const css = cssEditor.getValue();
    const js = jsEditor.getValue();

    const combined = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export ProfAssistant - ${currentExercice.titre}</title>
    <style>
    /* CSS EXPORTÉ */
    ${css}
    </style>
</head>
<body>
    ${html}
    <script>
    /* JS EXPORTÉ */
    ${js}
    </script>
</body>
</html>
    `.trim();

    const blob = new Blob([combined], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exercice-${currentExercice.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

if (exportCodeBtn) exportCodeBtn.addEventListener('click', exportCode);

// Tab Switching & Blur Focus tracking
window.addEventListener('blur', () => {
    if (!currentExercice) return; // Only track when an exercise is active
    hintState.pageExits = (hintState.pageExits || 0) + 1;
    hintState.lastBlurTime = Date.now();
    
    if (hintState.currentDocId) {
        updateDoc(doc(db, "submissions", hintState.currentDocId), {
            "autonomie.sorties_page": hintState.pageExits
        }).catch(() => {});
    }
});

window.addEventListener('focus', () => {
    if (!currentExercice || !hintState.lastBlurTime) return;
    const elapsedOutside = Math.round((Date.now() - hintState.lastBlurTime) / 1000);
    hintState.timeOutside = (hintState.timeOutside || 0) + elapsedOutside;
    hintState.lastBlurTime = null;
    
    if (hintState.currentDocId) {
        updateDoc(doc(db, "submissions", hintState.currentDocId), {
            "autonomie.temps_hors_focus_sec": hintState.timeOutside
        }).catch(() => {});
    }
});

// ============================================================
// 13. ESPACE COURS ET LECTEUR INTEGRÉ (.MD)
// ============================================================

async function loadCourses() {
    // Reset Header UI
    if (exerciseTitleEl) exerciseTitleEl.textContent = 'Cours théoriques';
    if (backToLobbyBtn) {
        backToLobbyBtn.style.display = 'inline-flex';
        backToLobbyBtn.classList.remove('active');
        backToLobbyBtn.textContent = '🏠 Exercices';
    }
    if (navCoursesBtn) {
        navCoursesBtn.style.display = 'inline-flex';
        navCoursesBtn.classList.add('active');
    }
    if (exportCodeBtn) exportCodeBtn.style.display = 'none';
    if (submitBtn) submitBtn.classList.add('hidden');
    if (chatFab) chatFab.classList.add('hidden');

    // Changer la visibilité des vues
    lobbyView.classList.add('hidden');
    workspaceView.classList.add('hidden');
    if (coursesView) coursesView.classList.remove('hidden');
    
    const examView = document.getElementById('examView');
    if (examView) examView.classList.add('hidden');

    // Stopper l'écoute prof en cours
    if (profFeedbackUnsub) { profFeedbackUnsub(); profFeedbackUnsub = null; }
    currentExercice = null;

    // Rendre les cours
    renderCourses();
}

function renderCourses() {
    if (!coursesContainer) return;
    coursesContainer.innerHTML = '';

    const selectedCourse = courseManager.getSelectedCourse();
    if (!selectedCourse) {
        coursesContainer.innerHTML = `
            <div class="lobby-empty">
                <p>📚 Aucun cours sélectionné.</p>
            </div>`;
        return;
    }

    // Filtrer les chapitres dont le titre n'est pas désactivé
    const activeChapters = selectedCourse.chapters.filter(ch => !disabledChapters.includes(ch.title));

    if (activeChapters.length === 0) {
        coursesContainer.innerHTML = `
            <div class="lobby-empty">
                <p>📚 Aucun chapitre n'est disponible pour le moment.</p>
            </div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'exercise-grid';

    activeChapters.forEach(c => {
        const card = document.createElement('button');
        card.className = 'course-card';
        card.setAttribute('aria-label', `Ouvrir : ${c.title}`);

        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">📄</span>
                <span class="card-badge-aide" style="background:#e0f2fe;color:#0369a1;">Cours .MD</span>
            </div>
            <div class="card-title">${c.title}</div>
            <div class="card-description">Support théorique complet et exemples détaillés pour ce chapitre.</div>
            <div class="card-action">Lire le cours ↗</div>
        `;

        card.addEventListener('click', () => openCourseReader(c));
        grid.appendChild(card);
    });

    coursesContainer.appendChild(grid);
}

async function openCourseReader(course) {
    if (!courseReaderModal || !readerTitle || !readerBody) return;

    readerTitle.textContent = course.title;
    readerBody.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;">
            <div class="loader-spinner"></div>
            <p style="margin-top:16px;color:#64748b;">Chargement du cours...</p>
        </div>
    `;

    courseReaderModal.classList.remove('hidden-reader-modal');
    courseReaderModal.classList.add('visible-reader-modal');

    try {
        const selectedCourse = courseManager.getSelectedCourse();
        const fileUrl = courseManager.getCourseFileUrl(selectedCourse, course.file);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Erreur de chargement du fichier Markdown");
        const mdText = await response.text();

        if (typeof window.marked !== 'undefined') {
            readerBody.innerHTML = window.marked.parse(mdText);
        } else {
            readerBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${mdText}</pre>`;
        }

        // Enregistrer la progression : lecture du chapitre
        if (currentUser && selectedCourse) {
            progressManager.trackChapterRead(
                currentUser.email,
                selectedCourse.id,
                currentUser.uid,
                course.id || course.title
            );
        }
    } catch (e) {
        console.error("Erreur de chargement du cours :", e);
        readerBody.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--md-sys-color-error, #ef4444);">
                <p style="font-size:32px;">⚠️</p>
                <p style="font-weight:600;margin-top:16px;">Impossible de charger le cours.</p>
                <p style="font-size:13px;color:#64748b;margin-top:8px;">Vérifie ton accès au réseau ou réessaye plus tard.</p>
            </div>
        `;
    }
}

// Gérer la fermeture du Reader de Cours
if (closeReaderBtn) {
    closeReaderBtn.addEventListener('click', () => {
        if (courseReaderModal) {
            courseReaderModal.classList.remove('visible-reader-modal');
            courseReaderModal.classList.add('hidden-reader-modal');
        }
    });
}

// Fermer également en cliquant en dehors du modal
if (courseReaderModal) {
    courseReaderModal.addEventListener('click', (e) => {
        if (e.target === courseReaderModal) {
            courseReaderModal.classList.remove('visible-reader-modal');
            courseReaderModal.classList.add('hidden-reader-modal');
        }
    });
}

// ============================================
// 14. LOGIQUE QUIZZ (LMS SANS CODE)
// ============================================
let quizzState = {
    questions: [],
    currentIndex: 0,
    selectedOption: null,
    score: 0
};

function startQuizz(exData) {
    quizzState = {
        questions: exData.questions || [],
        currentIndex: 0,
        selectedOption: null,
        score: 0
    };

    const titleEl = document.getElementById('quizzTitle');
    if (titleEl) titleEl.textContent = exData.titre || "Quizz d'évaluation";

    renderQuizzQuestion();
}

function renderQuizzQuestion() {
    const progressEl = document.getElementById('quizzProgress');
    const questionTextEl = document.getElementById('quizzQuestionText');
    const optionsContainer = document.getElementById('quizzOptionsContainer');
    const feedbackText = document.getElementById('quizzFeedbackText');
    const submitBtn = document.getElementById('quizzSubmitBtn');
    const nextBtn = document.getElementById('quizzNextBtn');

    if (!questionTextEl || !optionsContainer) return;

    if (feedbackText) {
        feedbackText.textContent = '';
        feedbackText.style.color = '';
    }
    if (submitBtn) {
        submitBtn.style.display = 'none';
        submitBtn.disabled = true;
    }
    if (nextBtn) nextBtn.style.display = 'none';

    quizzState.selectedOption = null;

    const total = quizzState.questions.length;
    if (quizzState.currentIndex >= total) {
        showQuizzCompletion();
        return;
    }

    const currentQ = quizzState.questions[quizzState.currentIndex];
    
    if (progressEl) {
        progressEl.textContent = `Question ${quizzState.currentIndex + 1} sur ${total}`;
    }

    questionTextEl.textContent = currentQ.question;
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.style.textAlign = 'left';
        btn.style.width = '100%';
        btn.style.borderRadius = '12px';
        btn.style.padding = '12px 16px';
        btn.style.fontSize = '14px';
        btn.style.transition = 'all 0.2s';
        btn.textContent = opt;

        btn.addEventListener('click', () => {
            optionsContainer.querySelectorAll('button').forEach(b => {
                b.style.borderColor = '';
                b.style.backgroundColor = '';
                b.style.color = '';
            });

            btn.style.borderColor = 'var(--md-sys-color-primary)';
            btn.style.backgroundColor = 'var(--md-sys-color-primary-container)';
            btn.style.color = 'var(--md-sys-color-on-primary-container)';

            quizzState.selectedOption = idx;
            if (submitBtn) {
                submitBtn.style.display = 'inline-flex';
                submitBtn.disabled = false;
            }
        });

        optionsContainer.appendChild(btn);
    });
}

function submitQuizzAnswer() {
    const currentQ = quizzState.questions[quizzState.currentIndex];
    const optionsContainer = document.getElementById('quizzOptionsContainer');
    const feedbackText = document.getElementById('quizzFeedbackText');
    const submitBtn = document.getElementById('quizzSubmitBtn');
    const nextBtn = document.getElementById('quizzNextBtn');

    if (quizzState.selectedOption === null) return;

    if (submitBtn) submitBtn.style.display = 'none';

    const isCorrect = quizzState.selectedOption === currentQ.correctAnswer;
    if (isCorrect) {
        quizzState.score++;
        if (feedbackText) {
            feedbackText.textContent = currentQ.successMessage || "✅ Bonne réponse !";
            feedbackText.style.color = "green";
        }
    } else {
        if (feedbackText) {
            feedbackText.textContent = `❌ Mauvaise réponse.`;
            feedbackText.style.color = "red";
        }
    }

    if (optionsContainer) {
        optionsContainer.querySelectorAll('button').forEach((b, idx) => {
            b.disabled = true;
            if (idx === currentQ.correctAnswer) {
                b.style.borderColor = 'green';
                b.style.backgroundColor = '#dcfce7';
                b.style.color = '#15803d';
            } else if (idx === quizzState.selectedOption && !isCorrect) {
                b.style.borderColor = 'red';
                b.style.backgroundColor = '#fee2e2';
                b.style.color = '#991b1b';
            }
        });
    }

    if (nextBtn) {
        nextBtn.style.display = 'inline-flex';
        const isLast = quizzState.currentIndex === quizzState.questions.length - 1;
        nextBtn.textContent = isLast ? "Terminer le quizz 🏆" : "Question suivante ➡️";
    }
}

async function showQuizzCompletion() {
    const questionCard = document.getElementById('quizzQuestionCard');
    const progressEl = document.getElementById('quizzProgress');
    const feedbackText = document.getElementById('quizzFeedbackText');
    const nextBtn = document.getElementById('quizzNextBtn');

    if (progressEl) progressEl.textContent = "Quizz complété !";
    if (nextBtn) nextBtn.style.display = 'none';
    if (feedbackText) feedbackText.textContent = '';

    const total = quizzState.questions.length;
    const finalPct = Math.round((quizzState.score / total) * 100);

    if (questionCard) {
        questionCard.innerHTML = `
            <div style="text-align: center; padding: 24px 0;">
                <span style="font-size: 48px;">🏆</span>
                <h3 style="font-size: 20px; font-weight: 700; margin-top: 16px;">Félicitations !</h3>
                <p style="font-size: 15px; margin-top: 8px;">Tu as terminé le quizz avec un score de :</p>
                <div style="font-size: 32px; font-weight: 800; color: var(--md-sys-color-primary); margin-top: 12px;">
                    ${quizzState.score} / ${total} (${finalPct}%)
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 16px; font-style: italic;">
                    Ton score a été envoyé au professeur.
                </p>
            </div>
        `;
    }

    try {
        const userEmail = currentUser?.email || userEmailEl?.textContent || 'eleve@test.com';
        const googleUserId = currentUser?.uid || "";
        const submissionData = {
            exercice_id: currentExercice.id,
            id_exercice: currentExercice.id,
            titre_exercice: currentExercice.titre || "Quizz",
            email_eleve: userEmail,
            nom_eleve: userEmail.split('@')[0],
            status: "valide",
            feedback_ia: `L'élève a complété le quizz et obtenu le score de ${quizzState.score}/${total} (${finalPct}%).`,
            note_suggeree: finalPct,
            date_soumission: new Date().toISOString(),
            autonomie: {
                quizz_score: quizzState.score,
                quizz_total: total
            }
        };

        await addDoc(collection(db, "submissions"), submissionData);
        console.log("📊 Soumission du quizz enregistrée avec succès !");

        // Enregistrer la progression : exercice terminé
        const selectedCourse = courseManager.getSelectedCourse();
        if (selectedCourse) {
            await progressManager.trackExerciseAttempt(
                userEmail,
                selectedCourse.id,
                googleUserId,
                currentExercice.id,
                finalPct
            );
        }
    } catch (e) {
        console.error("Erreur d'envoi du score du quizz :", e);
    }
}

// Enregistrer les écouteurs d'événements pour le quizz
const quizzSubmitBtn = document.getElementById('quizzSubmitBtn');
if (quizzSubmitBtn) quizzSubmitBtn.addEventListener('click', submitQuizzAnswer);

const quizzNextBtn = document.getElementById('quizzNextBtn');
if (quizzNextBtn) {
    quizzNextBtn.addEventListener('click', () => {
        quizzState.currentIndex++;
        renderQuizzQuestion();
    });
}

// --- PROMPT SANDBOX LOGIC ---
if (sandboxPromptSendBtn && sandboxPromptInput && sandboxOutputPreview) {
    async function sendPromptSandbox() {
        const promptText = sandboxPromptInput.value.trim();
        if (!promptText) return;

        sandboxPromptSendBtn.disabled = true;
        sandboxPromptSendBtn.innerHTML = "⏳";
        
        sandboxOutputPreview.innerHTML = `
            <div class="sandbox-loading" style="color: #64748b; font-family: sans-serif; text-align: center;">
                <div class="loader-spinner" style="margin: 0 auto 12px; height: 24px; width: 24px; border: 3px solid #f3f3f3; border-top: 3px solid var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                🤖 Le tuteur IA génère ton aperçu...
            </div>
        `;

        try {
            const selectedCourse = courseManager.getSelectedCourse();
            const genererSandboxIAFn = httpsCallable(functions, 'genererSandboxIA');
            const res = await genererSandboxIAFn({
                prompt: promptText,
                course_id: selectedCourse?.id || "studio-creatif",
                id_exercice: currentExercice?.id || ""
            });

            const data = res.data;
            let outputHtml = '';

            if (data.text) {
                outputHtml += `<div style="text-align: left; margin-bottom: 16px; width: 100%; border-bottom: 1px solid #334155; padding-bottom: 12px; color: #cbd5e1; font-family: sans-serif; line-height: 1.5;">
                    ${window.marked.parse(data.text)}
                </div>`;
            }

            if (data.html) {
                outputHtml += `<div style="width: 100%; border: 1.5px dashed #475569; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.02); display: flex; justify-content: center; align-items: center;">
                    ${data.html}
                </div>`;
            }

            sandboxOutputPreview.innerHTML = outputHtml || '<div style="color: #ef4444;">Aucun résultat généré. Réessaye avec un autre prompt !</div>';

        } catch (e) {
            console.error("Erreur Sandbox Prompt :", e);
            sandboxOutputPreview.innerHTML = `
                <div style="color: #ef4444; font-family: sans-serif;">
                    ⚠️ Une erreur est survenue lors de la génération. Réessaye avec un prompt différent.
                </div>
            `;
        } finally {
            sandboxPromptSendBtn.disabled = false;
            sandboxPromptSendBtn.innerHTML = "➤";
        }
    }

    sandboxPromptSendBtn.addEventListener('click', sendPromptSandbox);
    sandboxPromptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPromptSandbox();
        }
    });
}

// --- WORKSPACE CRÉATIF LOGIC ---
function initCreativeWorkspace(exData, latestSub = null) {
    const creativeMissionTitle = document.getElementById('creativeMissionTitle');
    const creativeMissionInstructions = document.getElementById('creativeMissionInstructions');
    const creativeToolsList = document.getElementById('creativeToolsList');
    const creativeSubmissionFields = document.getElementById('creativeSubmissionFields');
    const creativeSubmissionFeedback = document.getElementById('creativeSubmissionFeedback');
    const creativeValidateBtn = document.getElementById('creativeValidateBtn');

    if (creativeMissionTitle) {
        creativeMissionTitle.textContent = exData.titre || 'Mission';
    }

    if (creativeMissionInstructions && typeof window.marked !== 'undefined') {
        creativeMissionInstructions.innerHTML = window.marked.parse(exData.enonce_md || exData.consigne || 'Aucun énoncé.');
    }

    // Liens outils
    if (creativeToolsList) {
        let tools = exData.external_tools || [];
        if (tools.length === 0) {
            const titleLower = (exData.titre || '').toLowerCase();
            const enonceLower = (exData.enonce_md || '').toLowerCase();
            if (titleLower.includes('image') || enonceLower.includes('canva') || enonceLower.includes('visuel')) {
                tools = [
                    { name: "Canva", url: "https://canva.com" },
                    { name: "Adobe Firefly", url: "https://firefly.adobe.com" }
                ];
            } else if (titleLower.includes('écriture') || enonceLower.includes('slogan') || enonceLower.includes('prompt')) {
                tools = [
                    { name: "Google Gemini", url: "https://gemini.google.com" },
                    { name: "Google Docs", url: "https://docs.google.com" }
                ];
            } else if (titleLower.includes('musique') || enonceLower.includes('suno') || enonceLower.includes('sonore')) {
                tools = [
                    { name: "Suno AI", url: "https://suno.com" }
                ];
            } else if (titleLower.includes('vidéo') || enonceLower.includes('capcut') || enonceLower.includes('montage')) {
                tools = [
                    { name: "CapCut", url: "https://capcut.com" }
                ];
            } else {
                tools = [
                    { name: "Google Gemini", url: "https://gemini.google.com" },
                    { name: "Google Docs", url: "https://docs.google.com" },
                    { name: "Canva", url: "https://canva.com" }
                ];
            }
        }
        creativeToolsList.innerHTML = tools.map(t => `<a href="${t.url}" target="_blank" class="creative-tool-link-btn">🔗 ${t.name}</a>`).join('');
    }

    // Récupérer le brouillon de soumission (depuis Firestore si présent, sinon depuis localStorage)
    let savedUrl = '';
    let savedText = '';

    if (latestSub && latestSub.code_eleve) {
        const code = latestSub.code_eleve;
        const linkMatch = code.match(/\[Lien soumis\]\s*:\s*([^\n]+)/);
        if (linkMatch) {
            savedUrl = linkMatch[1].trim();
            if (savedUrl === 'Aucun') savedUrl = '';
        }
        const textSplit = code.split(/\[Texte\/Prompt soumis\]\s*:\s*\n?/);
        if (textSplit.length > 1) {
            savedText = textSplit[1].trim();
            if (savedText === 'Aucun') savedText = '';
        }
    }

    if (!savedUrl && !savedText) {
        const savedDataRaw = localStorage.getItem(`creative_draft_${exData.id}`);
        if (savedDataRaw) {
            try {
                const parsed = JSON.parse(savedDataRaw);
                savedUrl = parsed.url || '';
                savedText = parsed.text || '';
            } catch (e) { }
        }
    }

    // Injecter les champs de soumission
    if (creativeSubmissionFields) {
        creativeSubmissionFields.innerHTML = '';
        const submissionType = exData.submission_type || 'both';

        if (submissionType === 'url' || submissionType === 'both') {
            creativeSubmissionFields.innerHTML += `
                <div class="creative-input-group">
                    <label for="creativeUrlInput">🔗 Lien de ta création (Canva, Google Doc, Suno, etc.) :</label>
                    <input type="text" id="creativeUrlInput" placeholder="https://..." value="${savedUrl}" />
                </div>
            `;
        }
        if (submissionType === 'text' || submissionType === 'both') {
            creativeSubmissionFields.innerHTML += `
                <div class="creative-input-group">
                    <label for="creativeTextInput">✍️ Saisis ton texte ou le prompt final utilisé :</label>
                    <textarea id="creativeTextInput" placeholder="Saisis ton texte ici...">${savedText}</textarea>
                </div>
            `;
        }

        // Ajouter écouteurs d'auto-sauvegarde
        const urlInput = document.getElementById('creativeUrlInput');
        const textInput = document.getElementById('creativeTextInput');
        const saveDraft = () => {
            const draft = {
                url: urlInput ? urlInput.value.trim() : '',
                text: textInput ? textInput.value.trim() : ''
            };
            localStorage.setItem(`creative_draft_${exData.id}`, JSON.stringify(draft));
        };
        if (urlInput) urlInput.addEventListener('input', saveDraft);
        if (textInput) textInput.addEventListener('input', saveDraft);
    }

    // Reset feedback
    if (creativeSubmissionFeedback) {
        creativeSubmissionFeedback.textContent = '';
        creativeSubmissionFeedback.style.color = '';
    }

    if (creativeValidateBtn) {
        creativeValidateBtn.disabled = false;
        creativeValidateBtn.innerHTML = "Valider ma mission 🚀";
    }
}

// Sandbox intégrée pour le dashboard créatif
const creativeSandboxInput = document.getElementById('creativeSandboxInput');
const creativeSandboxSendBtn = document.getElementById('creativeSandboxSendBtn');
const creativeSandboxOutput = document.getElementById('creativeSandboxOutput');

if (creativeSandboxSendBtn && creativeSandboxInput && creativeSandboxOutput) {
    async function sendCreativeSandbox() {
        const promptText = creativeSandboxInput.value.trim();
        if (!promptText) return;

        creativeSandboxSendBtn.disabled = true;
        creativeSandboxSendBtn.innerHTML = "⏳";
        creativeSandboxOutput.innerHTML = `
            <div class="sandbox-loading" style="color: #64748b; font-family: sans-serif; text-align: center; padding: 20px 0;">
                <div class="loader-spinner" style="margin: 0 auto 12px; height: 24px; width: 24px; border: 3px solid #f3f3f3; border-top: 3px solid var(--md-sys-color-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                🤖 Le tuteur IA analyse ta demande...
            </div>
        `;

        try {
            const selectedCourse = courseManager.getSelectedCourse();
            const genererSandboxIAFn = httpsCallable(functions, 'genererSandboxIA');
            const res = await genererSandboxIAFn({
                prompt: promptText,
                course_id: selectedCourse?.id || "studio-creatif",
                id_exercice: currentExercice?.id || ""
            });

            const data = res.data;
            let outputHtml = '';

            if (data.text) {
                outputHtml += `<div style="text-align: left; margin-bottom: 16px; width: 100%; border-bottom: 1px solid #334155; padding-bottom: 12px; color: #cbd5e1; font-family: sans-serif; line-height: 1.5;">
                    ${window.marked.parse(data.text)}
                </div>`;
            }

            if (data.html) {
                outputHtml += `<div style="width: 100%; border: 1.5px dashed #475569; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.02); display: flex; justify-content: center; align-items: center;">
                    ${data.html}
                </div>`;
            }

            creativeSandboxOutput.innerHTML = outputHtml || '<div style="color: #ef4444;">Aucun résultat généré. Réessaye avec un autre prompt !</div>';

        } catch (e) {
            console.error("Erreur Sandbox Prompt Créative :", e);
            creativeSandboxOutput.innerHTML = `
                <div style="color: #ef4444; font-family: sans-serif; text-align: center; padding: 20px 0;">
                    ⚠️ Une erreur est survenue lors de la génération. Réessaye avec un prompt différent.
                </div>
            `;
        } finally {
            creativeSandboxSendBtn.disabled = false;
            creativeSandboxSendBtn.innerHTML = "➤";
        }
    }

    creativeSandboxSendBtn.addEventListener('click', sendCreativeSandbox);
    creativeSandboxInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCreativeSandbox();
        }
    });
}

// Bouton de validation de la mission créative
const creativeValidateBtn = document.getElementById('creativeValidateBtn');
if (creativeValidateBtn) {
    creativeValidateBtn.addEventListener('click', async () => {
        if (!currentExercice) return;

        const urlInput = document.getElementById('creativeUrlInput');
        const textInput = document.getElementById('creativeTextInput');
        const urlVal = urlInput ? urlInput.value.trim() : '';
        const textVal = textInput ? textInput.value.trim() : '';
        const feedbackEl = document.getElementById('creativeSubmissionFeedback');

        if (!urlVal && !textVal) {
            alert("Veuillez remplir au moins un champ avant de soumettre !");
            return;
        }

        creativeValidateBtn.disabled = true;
        creativeValidateBtn.innerHTML = "⏳ Validation en cours...";

        if (feedbackEl) {
            feedbackEl.textContent = "⏳ Enregistrement du devoir...";
            feedbackEl.style.color = "#475569";
        }

        const combinedSubmission = `[Lien soumis] : ${urlVal || 'Aucun'}\n\n[Texte/Prompt soumis] :\n${textVal || 'Aucun'}`;
        const userEmail = userEmailEl?.textContent || 'inconnu@test.com';

        try {
            const corrigeFn = httpsCallable(functions, 'corrigerDevoir');
            const response = await corrigeFn({
                code_eleve: combinedSubmission,
                id_exercice: currentExercice.id,
                nom_eleve: userEmail.split('@')[0],
                type: 'creative_submission',
                titre_exercice: currentExercice.titre || 'Mission',
                chapitre: currentExercice.chapitre || '',
                code_html: '',
                code_css: '',
                code_js: '',
                autonomie: {
                    indices_niv1: 0,
                    indices_niv2: 0,
                    indices_niv3: 0,
                    questions_ia: MAX_QUESTIONS - hintState.questionsLeft,
                    copie_colle_ops: 0,
                    copie_colle_caracteres: 0,
                    sorties_page: 0,
                    temps_hors_focus_sec: 0
                }
            });

            const docId = response.data.docId;
            const evalIA = response.data.evaluation;

            hintState.currentDocId = docId;
            hintState.currentCode = combinedSubmission;
            updateHintButtons();

            if (feedbackEl) {
                feedbackEl.textContent = "✅ Mission validée avec succès !";
                feedbackEl.style.color = "#16a34a";
            }

            if (evalIA?.feedback_eleve) {
                appendMessage(
                    `✨ **Retour sur ta Mission**\n\n${evalIA.feedback_eleve}\n\n_Ton travail a été enregistré pour le professeur._`,
                    'assistant', 'Tuteur IA'
                );
            } else {
                appendMessage("📬 Ta mission a bien été enregistrée et validée !", 'assistant', 'Tuteur IA');
            }

            openDrawer(); // Ouvre l'onglet tuteur dans la sidebar

        } catch (error) {
            console.error('[Creative Submit] Erreur :', error);
            if (feedbackEl) {
                feedbackEl.textContent = "❌ Erreur de soumission";
                feedbackEl.style.color = "#ef4444";
            }
            appendMessage("❌ Erreur lors de l'envoi de la mission. Vérifie ta connexion.", 'assistant', 'Tuteur IA');
        } finally {
            creativeValidateBtn.disabled = false;
            creativeValidateBtn.innerHTML = "Valider ma mission 🚀";
        }
    });
}

