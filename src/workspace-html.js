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
const lobbyView             = document.getElementById('lobbyView');
const lobbyLoader           = document.getElementById('lobbyLoader');
const lobbyContent          = document.getElementById('lobbyContent');
const chaptersContainer     = document.getElementById('chaptersContainer');
const workspaceView         = document.getElementById('workspaceView');
const backToLobbyBtn        = document.getElementById('backToLobbyBtn');

// Header workspace
const userEmailEl           = document.getElementById('userEmail');
const logoutBtn             = document.getElementById('logoutBtn');
const submitBtn             = document.getElementById('submitBtn');
const exerciseTitleEl       = document.getElementById('exerciseTitle');
const exerciseChapterEl     = document.getElementById('exerciseChapter');
const exerciseInstructionsEl = document.getElementById('exerciseInstructions');
const toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');
const instructionsBar       = document.getElementById('instructionsBar');

// Éditeur
const runCodeBtn            = document.getElementById('runCodeBtn');
const refreshPreviewBtn     = document.getElementById('refreshPreviewBtn');
const livePreview           = document.getElementById('livePreview');
const liveIndicator         = document.getElementById('liveIndicator');
const tabButtons            = document.querySelectorAll('.tab-btn');
const htmlEditorContainer   = document.getElementById('html-editor-container');
const cssEditorContainer    = document.getElementById('css-editor-container');
const jsEditorContainer     = document.getElementById('js-editor-container');
const resizeHandle          = document.getElementById('resizeHandle');
const editorSection         = document.getElementById('editorSection');
const splitWorkspace        = document.getElementById('splitWorkspace');

// Chat Drawer
const chatFab               = document.getElementById('chatFab');
const chatDrawer            = document.getElementById('chatDrawer');
const chatDrawerClose       = document.getElementById('chatDrawerClose');
const chatOverlay           = document.getElementById('chatOverlay');
const chatMessages          = document.getElementById('chatMessages');
const fabBadge              = document.getElementById('fabBadge');
const hintBtn1              = document.getElementById('hintBtn1');
const hintBtn2              = document.getElementById('hintBtn2');
const hintBtn3              = document.getElementById('hintBtn3');
const freeQuestionToggle    = document.getElementById('freeQuestionToggle');
const freeQuestionPanel     = document.getElementById('freeQuestionPanel');
const questionCounter       = document.getElementById('questionCounter');
const chatInput             = document.getElementById('chatInput');
const chatSendBtn           = document.getElementById('chatSendBtn');
const refreshCorrectionsBtn = document.getElementById('refreshCorrectionsBtn');
const exportEmailBtn        = document.getElementById('exportEmailBtn');

// ============================================================
// 2. ÉTAT GLOBAL
// ============================================================
const MAX_QUESTIONS = 5;
let activeTab        = 'html';
let chatHistory      = [];
let currentExercice  = null;  // Données de l'exercice courant (depuis Firestore)
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

    // Au chargement : afficher le lobby
    loadLobby();

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
    // Afficher le loader
    lobbyLoader.classList.remove('hidden');
    lobbyContent.classList.add('hidden');
    lobbyView.classList.remove('hidden');
    workspaceView.classList.add('hidden');
    submitBtn.classList.add('hidden');
    chatFab.classList.add('hidden');

    try {
        const snapshot = await getDocs(collection(db, 'exercices'));

        if (snapshot.empty) {
            chaptersContainer.innerHTML = `
                <div class="lobby-empty">
                    <p>😔 Aucun exercice disponible pour le moment.</p>
                    <p>Reviens bientôt, ton professeur prépare des activités !</p>
                </div>`;
            lobbyLoader.classList.add('hidden');
            lobbyContent.classList.remove('hidden');
            return;
        }

        // Grouper par chapitre
        const chapitres = {};
        snapshot.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
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
                const card = document.createElement('button');
                card.className = 'exercise-card';
                card.setAttribute('data-id', ex.id);
                card.setAttribute('aria-label', `Ouvrir l'exercice : ${ex.titre}`);

                const hasHints = ex.statut_aide !== false;

                card.innerHTML = `
                    <div class="card-header">
                        <span class="card-icon">🧩</span>
                        ${hasHints ? '<span class="card-badge-aide" title="Indices disponibles">💡 Aide</span>' : ''}
                    </div>
                    <div class="card-title">${ex.titre || 'Exercice sans titre'}</div>
                    <div class="card-consigne">${(ex.consigne || '').substring(0, 80)}${(ex.consigne || '').length > 80 ? '...' : ''}</div>
                    <div class="card-arrow">Commencer →</div>
                `;

                card.addEventListener('click', () => openExercise(ex.id));
                grid.appendChild(card);
            });

            chapterEl.appendChild(grid);
            chaptersContainer.appendChild(chapterEl);
        }

        // Transition fluide : cacher le loader, révéler le contenu
        lobbyLoader.classList.add('hidden');
        lobbyContent.classList.remove('hidden');

    } catch (e) {
        console.error('[Lobby] Erreur chargement exercices :', e);
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

        // Forcer Monaco à recalculer sa taille maintenant que le workspace est visible
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
    // Titre et chapitre dans la bannière
    if (exerciseTitleEl)   exerciseTitleEl.textContent   = exData.titre || 'Exercice sans titre';
    if (exerciseChapterEl) exerciseChapterEl.textContent = exData.chapitre || 'Exercice';

    // Consigne (en respectant les sauts de ligne \n)
    if (exerciseInstructionsEl) {
        // Convertir les \n en <br> pour l'affichage HTML
        // Chercher aussi avec la classe consigne-body (nouvelle structure)
        const target = document.getElementById('exerciseInstructions');
        if (target) {
            target.innerHTML = (exData.consigne || 'Aucune consigne fournie.')
                .replace(/\n/g, '<br>');
        }
    }

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

    // Mettre à jour les indices dans l'état (lus depuis Firestore, pas de Cloud Function)
    hintState.indices = {
        niv1: exData.statut_aide !== false ? (exData.indices_n1 || null) : null,
        niv2: exData.statut_aide !== false ? (exData.indices_n2 || null) : null,
        niv3: exData.statut_aide !== false ? (exData.indices_n3 || null) : null,
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
let htmlEditor    = null;
let cssEditor     = null;
let jsEditor      = null;
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

document.addEventListener('monacoReady', () => {
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

    // Live Reload HTML/CSS uniquement — JS = manuel uniquement
    htmlEditor.onDidChangeModelContent(() => scheduleRender());
    cssEditor.onDidChangeModelContent(()  => scheduleRender());

    // Si un code de départ attendait Monaco
    if (pendingCodeDepart) {
        jsEditor.setValue(pendingCodeDepart);
        pendingCodeDepart = null;
    }
});

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
    livePreview.srcdoc = buildDocument(htmlEditor.getValue(), cssEditor.getValue(), jsEditor.getValue());
    if (runCodeBtn) {
        runCodeBtn.textContent = "✅ Exécuté !";
        runCodeBtn.disabled = true;
        setTimeout(() => { runCodeBtn.textContent = "▶️ Exécuter mon code"; runCodeBtn.disabled = false; }, 1500);
    }
}

/**
 * Construit le document HTML complet à injecter dans l'iframe.
 * Si jsCode est vide, le script n'est pas injecté (évite une balise vide).
 */
function buildDocument(html, css, jsCode) {
    const scriptBlock = jsCode.trim()
        ? `<script>try{${jsCode}}catch(err){document.body.innerHTML+='<div style="background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-top:16px;font-family:monospace;font-size:13px;">❌ Erreur JS : '+err.message+'</div>';}<\/script>`
        : '';
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>*,*::before,*::after{box-sizing:border-box;}${css}</style></head><body>${html}${scriptBlock}</body></html>`;
}

if (runCodeBtn)        runCodeBtn.addEventListener('click', executeAllCode);
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
    cssEditorContainer.classList.toggle('hidden',  targetTab !== 'css');
    jsEditorContainer.classList.toggle('hidden',   targetTab !== 'js');

    const indicator = liveIndicator;
    if (indicator) {
        if (targetTab === 'js') {
            indicator.classList.add('js-mode');
            indicator.querySelector('span:not(.live-dot)').textContent = ' ▶️ Manuel';
        } else {
            indicator.classList.remove('js-mode');
            indicator.querySelector('span:not(.live-dot)').textContent = ' Live';
        }
    }

    if (targetTab === 'html' && htmlEditor) htmlEditor.layout();
    if (targetTab === 'css'  && cssEditor)  cssEditor.layout();
    if (targetTab === 'js'   && jsEditor)   jsEditor.layout();
}

tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

// Instructions collapsibles
if (toggleInstructionsBtn && instructionsBar) {
    toggleInstructionsBtn.addEventListener('click', () => {
        const collapsed = instructionsBar.classList.toggle('collapsed');
        toggleInstructionsBtn.setAttribute('aria-expanded', !collapsed);
    });
}

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
    editorSection.style.flex  = 'none';
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

if (chatFab)         chatFab.addEventListener('click', openDrawer);
if (chatDrawerClose) chatDrawerClose.addEventListener('click', closeDrawer);
if (chatOverlay)     chatOverlay.addEventListener('click', closeDrawer);

// ============================================================
// 10. INDICES PROGRESSIFS — Depuis Firestore (pas de Cloud Function)
// ============================================================
function updateHintButtons() {
    if (!hintBtn1) return;

    // Les indices viennent du document Firestore de l'exercice
    const hasStatutAide = currentExercice?.statut_aide !== false;
    const hasIndices    = !!hintState.indices;

    // N1 : disponible si exercice chargé et aide activée
    hintBtn1.disabled = !currentExercice || !hasStatutAide || !hintState.indices?.niv1;
    hintBtn1.title    = !currentExercice ? "Choisis un exercice d'abord." : (!hasStatutAide ? "L'aide est désactivée." : "Indice théorique");

    // N2 : débloqué après N1
    hintBtn2.disabled = !hintState.niv1Used || !hintState.indices?.niv2;
    hintBtn2.title    = hintState.niv1Used ? "Analyser mon code" : "🔒 Consulte le Niveau 1 d'abord";

    // N3 : débloqué après N2
    hintBtn3.disabled = !hintState.niv2Used || !hintState.indices?.niv3;
    hintBtn3.title    = hintState.niv2Used ? "Obtenir la structure" : "🔒 Consulte le Niveau 2 d'abord";
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
        }).catch(() => {});
    }

    updateHintButtons();
}

if (hintBtn1) hintBtn1.addEventListener('click', () => showStaticHint(1));
if (hintBtn2) hintBtn2.addEventListener('click', () => showStaticHint(2));
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
        }).catch(() => {});
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
        const consigne = currentExercice?.consigne || '';
        const res = await tuteurFn({ question: text, historique: chatHistory, id_cours: currentExercice?.chapitre || 'html_css' });
        document.getElementById(loaderId)?.remove();
        appendMessage(res.data.reponse, 'assistant', 'Tuteur IA');
    } catch (e) {
        document.getElementById(loaderId)?.remove();
        appendMessage("Désolé, le tuteur n'est pas disponible pour le moment.", 'assistant', 'Tuteur IA');
    }
};

if (chatSendBtn) chatSendBtn.addEventListener('click', sendFreeQuestion);
if (chatInput)   chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendFreeQuestion(); });

// ============================================================
// 12. SOUMISSION FIRESTORE
// ============================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (!htmlEditor || !cssEditor || !jsEditor) return;
        if (!currentExercice) { alert('Aucun exercice sélectionné.'); return; }

        const userEmail = userEmailEl?.textContent || 'inconnu@test.com';
        const orig = submitBtn.textContent;
        submitBtn.textContent = "⏳ Correction IA...";
        submitBtn.disabled = true;

        // Code combiné pour l'analyse Gemini (HTML + CSS + JS)
        const codeEleve = `<!-- HTML -->\n${htmlEditor.getValue()}\n\n/* CSS */\n${cssEditor.getValue()}\n\n// JavaScript\n${jsEditor.getValue()}`;

        try {
            // ✅ Appel à la Cloud Function corrigerDevoir
            // Elle : analyse le code avec Gemini → écrit dans Firestore → retourne docId + évaluation
            const corrigeFn = httpsCallable(functions, 'corrigerDevoir');
            const response = await corrigeFn({
                // Champs requis par corrigerDevoir
                code_eleve:        codeEleve,
                consigne_exercice: currentExercice.consigne || '',
                nom_eleve:         userEmail.split('@')[0],
                // Champs supplémentaires (persistés dans le doc Firestore)
                type:              'html_css_js',
                exercice_id:       currentExercice.id,
                titre_exercice:    currentExercice.titre || 'Exercice',
                chapitre:          currentExercice.chapitre || '',
                code_html:         htmlEditor.getValue(),
                code_css:          cssEditor.getValue(),
                code_js:           jsEditor.getValue(),
            });

            const docId    = response.data.docId;
            const evalIA   = response.data.evaluation;

            // Activer les indices et le tracking maintenant qu'on a le docId
            hintState.currentDocId  = docId;
            hintState.currentCode   = codeEleve;
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
        if (data.status === 'publie' || data.status === 'brouillon') {
            const isValidated = data.status === 'publie';
            const icon  = isValidated ? '✅' : '🔄';
            const title = isValidated
                ? `**Correction validée — Note : ${data.note_suggeree || 0}/100**`
                : `**Le professeur te renvoie ta copie en révision**`;
            let msg = `${icon} ${title}\n\n${data.feedback_ia || ''}`;
            if (!isValidated) msg += '\n\n_Corrige et soumet à nouveau ! 💪_';
            appendMessage(msg, 'assistant', 'Professeur');
            openDrawer();
            profFeedbackUnsub();
            profFeedbackUnsub = null;
            localStorage.removeItem('pendingHtmlDocId');
        }
    }, err => console.error('[Firestore snapshot]', err));
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
                    if (data.status === 'publie' || data.status === 'brouillon') {
                        const isVal = data.status === 'publie';
                        appendMessage(`${isVal ? '✅' : '🔄'} **${isVal ? `Note : ${data.note_suggeree || 0}/100` : 'Copie renvoyée'}**\n\n${data.feedback_ia || ''}`, 'assistant', 'Professeur');
                        localStorage.removeItem('pendingHtmlDocId');
                    } else {
                        appendMessage('🔄 Toujours en attente de la correction...', 'assistant', 'Tuteur IA');
                        listenForProfFeedback(pendingDocId);
                    }
                }
            } catch(e) { console.error('[Refresh]', e); }
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
                const sender  = msg.querySelector('.chat-sender-name')?.textContent || 'Moi';
                const content = msg.querySelector('.chat-bubble-content')?.textContent || msg.textContent;
                html += `<p><strong>${sender} :</strong> ${content}</p>`;
            });
            await addDoc(collection(db, 'mail_queue'), {
                to: userEmailEl?.textContent || 'inconnu@test.com',
                message: { subject: 'Révision Atelier HTML/CSS/JS', html }
            });
            exportEmailBtn.textContent = '✅ Envoyé';
        } catch(e) { exportEmailBtn.textContent = '❌ Erreur'; }
        setTimeout(() => { exportEmailBtn.textContent = orig; exportEmailBtn.disabled = false; }, 4000);
    });
}
