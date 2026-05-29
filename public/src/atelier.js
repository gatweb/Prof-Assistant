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
const courseLink = document.getElementById('courseLink');
const resetExerciseBtn = document.getElementById('resetExerciseBtn');

// Éditeur
const runCodeBtn = document.getElementById('runCodeBtn');
const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
const livePreview = document.getElementById('livePreview');
const liveIndicator = document.getElementById('liveIndicator');
const tabButtons = document.querySelectorAll('.tab-btn');
const htmlEditorContainer = document.getElementById('html-editor-container');
const cssEditorContainer = document.getElementById('css-editor-container');
const jsEditorContainer = document.getElementById('js-editor-container');
const resizeHandle = document.getElementById('resizeHandle');
const editorSection = document.getElementById('editorSection');
const splitWorkspace = document.getElementById('splitWorkspace');

// Chat Drawer
const chatFab = document.getElementById('chatFab');
const chatDrawer = document.getElementById('chatDrawer');
const chatDrawerClose = document.getElementById('chatDrawerClose');
const chatOverlay = document.getElementById('chatOverlay');
const chatMessages = document.getElementById('chatMessages');
const fabBadge = document.getElementById('fabBadge');
const hintBtn1 = document.getElementById('hintBtn1');
const hintBtn2 = document.getElementById('hintBtn2');
const hintBtn3 = document.getElementById('hintBtn3');
const freeQuestionToggle = document.getElementById('freeQuestionToggle');
const freeQuestionPanel = document.getElementById('freeQuestionPanel');
const questionCounter = document.getElementById('questionCounter');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
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
let currentExercice = null;  // Données de l'exercice courant (depuis Firestore)
let profFeedbackUnsub = null;

let hintState = {
    niv1Used: false,
    niv2Used: false,
    niv3Used: false,
    questionsLeft: MAX_QUESTIONS,
    currentDocId: null,
    currentCode: null
};

// ============================================================
// 3. AUTHENTIFICATION
// ============================================================
listenToAuthStatus((user) => {
    if (!user) { window.location.href = "index.html"; return; }
    if (userEmailEl) userEmailEl.textContent = user.email;

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

/**
 * Charge tous les documents de la collection `exercices` depuis Firestore
 * et les affiche groupés par `chapitre`.
 */
async function loadLobby() {
    // Reset Header UI
    if (exerciseTitleEl) exerciseTitleEl.textContent = 'Choisis un exercice';
    if (backToLobbyBtn) backToLobbyBtn.style.display = 'none';
    if (exportCodeBtn) exportCodeBtn.style.display = 'none';
    if (submitBtn) submitBtn.classList.add('hidden');

    // Reset Lobby UI
    lobbyLoader.querySelector('p').textContent = 'Chargement des exercices...';
    lobbyLoader.classList.remove('hidden');
    lobbyContent.classList.add('hidden');
    lobbyView.classList.remove('hidden');
    workspaceView.classList.add('hidden');

    try {
        const userEmail = userEmailEl?.textContent || '';

        // Requêtes en parallèle : exercices + soumissions de l'élève
        const [exercicesSnap, submissionsSnap] = await Promise.all([
            getDocs(collection(db, 'exercices')),
            userEmail
                ? getDocs(query(collection(db, 'submissions'), where('email_eleve', '==', userEmail)))
                : Promise.resolve({ docs: [] })
        ]);

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

        // Grouper par chapitre (en filtrant les exercices cachés)
        const chapitres = {};
        exercicesSnap.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            // Masquer les exercices avec is_hidden: true
            if (data.is_hidden === true) return;
            const ch = data.chapitre || 'Général';
            if (!chapitres[ch]) chapitres[ch] = [];
            chapitres[ch].push(data);
        });

        // Vider et reconstruire le DOM
        chaptersContainer.innerHTML = '';

        for (const [chapitreName, exercices] of Object.entries(chapitres)) {
            const chapterEl = document.createElement('div');
            chapterEl.className = 'chapter-block';
            chapterEl.innerHTML = `<h2 class="chapter-title">
                <span class="chapter-icon">📚</span> ${chapitreName}
            </h2>`;

            const grid = document.createElement('div');
            grid.className = 'exercise-grid';

            exercices.forEach(ex => {
                const submission = submissionsByExercice[ex.id];
                const status = submission?.status || null;
                const hasHints = ex.statut_aide !== false;

                // Déterminer l'état visuel de la carte
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
                        <span class="card-icon">${status === 'valide' || status === 'publie' ? '🎉' : '🧩'}</span>
                        <div style="display:flex;gap:4px;align-items:center;">
                            ${hasHints ? '<span class="card-badge-aide">💡 Aide</span>' : ''}
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

        // Réinitialiser l'état des hints pour le nouvel exercice
        hintState = {
            niv1Used: false,
            niv2Used: false,
            niv3Used: false,
            questionsLeft: MAX_QUESTIONS,
            currentDocId: null,
            currentCode: null
        };
        updateHintButtons();
        updateQuestionCounter();

        // Injecter les données dans l'interface
        injectExerciseData(exData);

        // Basculer vers le workspace
        lobbyView.classList.add('hidden');
        workspaceView.classList.remove('hidden');
        submitBtn.classList.remove('hidden');
        chatFab.classList.remove('hidden');

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

    // Gestion du lien vers le cours complet
    if (courseLink) {
        const url = exData.lien_cours || exData.lien_cours_complet || '';
        if (url) {
            courseLink.href = url;
            courseLink.classList.remove('hidden');
        } else {
            courseLink.classList.add('hidden');
        }
    }

    // Rendu des Blocs de Ressources (Énoncé & Théorie séparés)
    if (courseContentEl && typeof window.marked !== 'undefined') {
        const enonceHTML = window.marked.parse(exData.enonce_md || exData.consigne || 'Aucun énoncé.');
        const theorieHTML = window.marked.parse(exData.theorie_md || "Consulte ton cours pour réussir cet exercice !");
        
        courseContentEl.innerHTML = `
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

    // Afficher/Masquer les boutons du header selon le mode
    if (backToLobbyBtn) backToLobbyBtn.style.display = 'inline-flex';
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

// Bouton retour lobby
if (backToLobbyBtn) {
    backToLobbyBtn.addEventListener('click', () => {
        // Stopper l'écoute prof en cours
        if (profFeedbackUnsub) { profFeedbackUnsub(); profFeedbackUnsub = null; }
        currentExercice = null;
        loadLobby();
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

    // Live Reload + AUTO-SAVE
    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.onDidChangeModelContent(() => {
            scheduleRender();
            scheduleAutoSave();
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

    // Notifier si le drawer est fermé
    if (role === 'assistant' && chatDrawer && !chatDrawer.classList.contains('open')) {
        if (fabBadge) fabBadge.hidden = false;
    }

    if (role === 'user' || role === 'assistant') {
        chatHistory.push({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] });
    }
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
};

const openDrawer = () => {
    chatDrawer.classList.add('open');
    chatDrawer.setAttribute('aria-hidden', 'false');
    chatOverlay.classList.add('visible');
    if (fabBadge) fabBadge.hidden = true;
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
            id_exercice: currentExercice?.id // Ajouté ici
        });
        document.getElementById(loaderId)?.remove();
        appendMessage(res.data.reponse, 'assistant', 'Tuteur IA');
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

            // 3. Nettoyer l'écouteur si validé
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
