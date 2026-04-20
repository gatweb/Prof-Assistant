/**
 * workspace-html.js — Atelier HTML/CSS/JS avec Live Preview sécurisé.
 * Inclut : Drawer Chat, Système d'indices progressifs, Questions libres limitées.
 */

import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";
import { functions } from './firebase/config.js';
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase/db.js';

// ============================================================
// 1. RÉFÉRENCES DOM
// ============================================================
const userEmailEl           = document.getElementById('userEmail');
const logoutBtn             = document.getElementById('logoutBtn');
const submitBtn             = document.getElementById('submitBtn');
const runCodeBtn            = document.getElementById('runCodeBtn');
const refreshPreviewBtn     = document.getElementById('refreshPreviewBtn');
const livePreview           = document.getElementById('livePreview');
const liveIndicator         = document.getElementById('liveIndicator');
const toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');
const instructionsBar       = document.getElementById('instructionsBar');
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

let activeTab = 'html';

// ============================================================
// 2. ÉTAT DE L'APPLICATION
// ============================================================
const CONSIGNE      = "Crée une carte de profil en HTML/CSS avec ton prénom, une couleur de fond et une bordure arrondie.";
const COURSE_ID     = "html_css";
const MAX_QUESTIONS = 5;

let chatHistory  = [];
let hintState    = { niv1Used: false, niv2Used: false, niv3Used: false, questionsLeft: MAX_QUESTIONS, currentDocId: null, currentCode: null };
let profFeedbackUnsub = null;

// ============================================================
// 3. UTILITAIRES CHAT
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

    // Notification sur le FAB si le drawer est fermé
    if (role === 'assistant' && chatDrawer && !chatDrawer.classList.contains('open')) {
        if (fabBadge) fabBadge.hidden = false;
    }

    if (role === 'user' || role === 'assistant') {
        chatHistory.push({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] });
    }
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
};

// ============================================================
// 4. DRAWER CHAT — Ouverture / Fermeture
// ============================================================
function openDrawer() {
    chatDrawer.classList.add('open');
    chatDrawer.setAttribute('aria-hidden', 'false');
    chatOverlay.classList.add('visible');
    if (fabBadge) fabBadge.hidden = true; // Efface la notification
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function closeDrawer() {
    chatDrawer.classList.remove('open');
    chatDrawer.setAttribute('aria-hidden', 'true');
    chatOverlay.classList.remove('visible');
}

if (chatFab)        chatFab.addEventListener('click', openDrawer);
if (chatDrawerClose) chatDrawerClose.addEventListener('click', closeDrawer);
if (chatOverlay)    chatOverlay.addEventListener('click', closeDrawer);

// ============================================================
// 5. INDICES PROGRESSIFS
// ============================================================
function updateHintButtons() {
    if (!hintBtn1) return;
    hintBtn1.disabled = !hintState.currentDocId;
    hintBtn2.disabled = !hintState.niv1Used;
    hintBtn3.disabled = !hintState.niv2Used;
    hintBtn1.title = hintState.currentDocId ? "Demander un indice théorique" : "Soumets ton code d'abord !";
    hintBtn2.title = hintState.niv1Used ? "Analyser mon code" : "🔒 Consulte le Niveau 1 d'abord";
    hintBtn3.title = hintState.niv2Used ? "Obtenir la structure du code" : "🔒 Consulte le Niveau 2 d'abord";
}

async function requestHint(niveau) {
    const btn = document.getElementById(`hintBtn${niveau}`);
    if (!btn || btn.disabled) return;

    const original = btn.innerHTML;
    btn.innerHTML = '<span>⏳...</span>';
    btn.disabled = true;
    openDrawer();

    try {
        const indiceFn = httpsCallable(functions, 'demanderIndice');
        const res = await indiceFn({ niveau, code_eleve: hintState.currentCode || "", consigne: CONSIGNE, doc_id: hintState.currentDocId });
        appendMessage(res.data.reponse, 'assistant', `Tuteur IA — Niveau ${niveau}`);
        if (niveau === 1) hintState.niv1Used = true;
        if (niveau === 2) hintState.niv2Used = true;
        if (niveau === 3) hintState.niv3Used = true;
        updateHintButtons();
    } catch (e) {
        console.error(`[Indice N${niveau}]`, e);
        appendMessage("Désolé, le tuteur n'est pas disponible.", 'assistant', 'Tuteur IA');
    } finally {
        btn.innerHTML = original;
        updateHintButtons();
    }
}

if (hintBtn1) hintBtn1.addEventListener('click', () => requestHint(1));
if (hintBtn2) hintBtn2.addEventListener('click', () => requestHint(2));
if (hintBtn3) hintBtn3.addEventListener('click', () => requestHint(3));

// ============================================================
// 6. QUESTIONS LIBRES (compteur 5)
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
        freeQuestionPanel.classList.toggle('hidden');
        if (!freeQuestionPanel.classList.contains('hidden') && chatInput) chatInput.focus();
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
        updateDoc(doc(db, "submissions", hintState.currentDocId), { questions_libres: MAX_QUESTIONS - hintState.questionsLeft })
            .catch(e => console.warn("[QLibre] Tracking échoué :", e.message));
    }
    if (hintState.questionsLeft <= 0 && freeQuestionPanel) freeQuestionPanel.classList.add('hidden');

    const loadingId = "loader-" + Date.now();
    const loader = document.createElement('div');
    loader.id = loadingId;
    loader.className = 'chat-bubble assistant';
    loader.innerHTML = "<div class='chat-sender-name'>Tuteur IA</div><div class='chat-bubble-content'>🤔 Réflexion...</div>";
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const tuteurFn = httpsCallable(functions, 'interrogerTuteur');
        const res = await tuteurFn({ question: text, historique: chatHistory, id_cours: COURSE_ID });
        document.getElementById(loadingId)?.remove();
        appendMessage(res.data.reponse, 'assistant', 'Tuteur IA');
    } catch (e) {
        document.getElementById(loadingId)?.remove();
        appendMessage("Désolé, le tuteur n'est pas disponible.", 'assistant', 'Tuteur IA');
    }
};

if (chatSendBtn) chatSendBtn.addEventListener('click', sendFreeQuestion);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendFreeQuestion(); });

// ============================================================
// 7. FEEDBACK PROFESSEUR
// ============================================================
function listenForProfFeedback(docId) {
    if (profFeedbackUnsub) profFeedbackUnsub();
    localStorage.setItem('pendingHtmlDocId', docId);

    profFeedbackUnsub = onSnapshot(doc(db, "submissions", docId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        if (data.status === "publie" || data.status === "brouillon") {
            const isValidated = data.status === "publie";
            const icon = isValidated ? "✅" : "🔄";
            const title = isValidated
                ? `**Correction validée — Note : ${data.note_suggeree || 0}/100**`
                : `**Le professeur te renvoie ta copie en révision**`;
            let msg = `${icon} ${title}\n\n${data.feedback_ia || ''}`;
            if (!isValidated) msg += "\n\n_Corrige et soumet à nouveau ! 💪_";
            appendMessage(msg, 'assistant', 'Professeur');
            openDrawer();
            profFeedbackUnsub();
            profFeedbackUnsub = null;
            localStorage.removeItem('pendingHtmlDocId');
        }
    });
}

// Refresh corrections
if (refreshCorrectionsBtn) {
    refreshCorrectionsBtn.addEventListener('click', async () => {
        refreshCorrectionsBtn.textContent = "🔄 Vérification...";
        refreshCorrectionsBtn.disabled = true;
        const userEmail = userEmailEl?.textContent;
        try {
            const pendingDocId = localStorage.getItem('pendingHtmlDocId');
            if (pendingDocId) {
                const snap = await getDoc(doc(db, "submissions", pendingDocId));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.status === "publie" || data.status === "brouillon") {
                        const isVal = data.status === "publie";
                        appendMessage(`${isVal ? "✅" : "🔄"} **${isVal ? `Note : ${data.note_suggeree || 0}/100` : "Copie renvoyée en révision"}**\n\n${data.feedback_ia || ''}`, 'assistant', 'Professeur');
                        localStorage.removeItem('pendingHtmlDocId');
                    } else {
                        appendMessage("🔄 Toujours en attente de la correction...", 'assistant', 'Tuteur IA');
                        listenForProfFeedback(pendingDocId);
                    }
                }
            } else {
                appendMessage("📭 Aucune correction en attente.", 'assistant', 'Tuteur IA');
            }
        } catch(e) { console.error("[Refresh]", e); }
        setTimeout(() => { refreshCorrectionsBtn.textContent = "🔄 Vérifier les corrections"; refreshCorrectionsBtn.disabled = false; }, 2000);
    });
}

// ============================================================
// 8. EXPORT EMAIL
// ============================================================
if (exportEmailBtn) {
    exportEmailBtn.addEventListener('click', async () => {
        const orig = exportEmailBtn.textContent;
        exportEmailBtn.textContent = "⏳ Export...";
        exportEmailBtn.disabled = true;
        try {
            let html = "<h2>Ton aide de révision</h2>";
            chatMessages.querySelectorAll('.chat-bubble').forEach(msg => {
                const sender  = msg.querySelector('.chat-sender-name')?.textContent || 'Moi';
                const content = msg.querySelector('.chat-bubble-content')?.textContent || msg.textContent;
                html += `<p><strong>${sender} :</strong> ${content}</p>`;
            });
            const userEmail = userEmailEl?.textContent || "inconnu@test.com";
            await addDoc(collection(db, "mail_queue"), { to: userEmail, message: { subject: "Révision Atelier HTML/CSS", html } });
            exportEmailBtn.textContent = "✅ Envoyé";
        } catch(e) { exportEmailBtn.textContent = "❌ Erreur"; }
        setTimeout(() => { exportEmailBtn.textContent = orig; exportEmailBtn.disabled = false; }, 4000);
    });
}

// ============================================================
// 9. AUTHENTIFICATION
// ============================================================
listenToAuthStatus((user) => {
    if (!user) { window.location.href = "index.html"; return; }
    if (userEmailEl) userEmailEl.textContent = user.email;
    const pendingDoc = localStorage.getItem('pendingHtmlDocId');
    if (pendingDoc) listenForProfFeedback(pendingDoc);
    updateHintButtons();
    updateQuestionCounter();
});

if (logoutBtn) logoutBtn.addEventListener('click', async () => await logoutUser());

// ============================================================
// 10. MONACO — 3 éditeurs indépendants
// ============================================================
let htmlEditor = null, cssEditor = null, jsEditor = null;

const DEFAULT_HTML = `<!-- Écris ton HTML ici -->
<div class="carte">
  <h2 id="titre">Mon Prénom</h2>
  <p>Future développeuse / développeur 🚀</p>
  <button onclick="changerCouleur()">Changer la couleur ✨</button>
</div>`;

const DEFAULT_CSS = `/* Écris ton CSS ici */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: #f0f4f8;
  font-family: sans-serif;
}
.carte {
  background: white;
  padding: 32px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  text-align: center;
}
.carte h2 { font-size: 28px; color: #006493; margin-bottom: 8px; }
.carte p  { color: #555; font-size: 15px; }
.carte button { margin-top: 16px; padding: 8px 20px; background: #006493; color: white; border: none; border-radius: 100px; cursor: pointer; }`;

const DEFAULT_JS = `// Écris ton JavaScript ici
// ⚠️ Clique sur "▶️ Exécuter mon code" pour voir le résultat

function changerCouleur() {
  const couleurs = ['#006493', '#e91e63', '#2e7d32', '#f57c00', '#7b1fa2'];
  const aleatoire = couleurs[Math.floor(Math.random() * couleurs.length)];
  document.getElementById('titre').style.color = aleatoire;
}`;

document.addEventListener('monacoReady', () => {
    htmlEditor = window.monaco.editor.create(htmlEditorContainer, { value: DEFAULT_HTML, language: 'html', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false });
    cssEditor  = window.monaco.editor.create(cssEditorContainer,  { value: DEFAULT_CSS,  language: 'css',  theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false });
    jsEditor   = window.monaco.editor.create(jsEditorContainer,   { value: DEFAULT_JS,   language: 'javascript', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false });

    htmlEditor.onDidChangeModelContent(() => scheduleRender());
    cssEditor.onDidChangeModelContent(()  => scheduleRender());
    // JS : PAS de listener automatique — uniquement via ▶️

    renderPreview();
});

// ============================================================
// 11. MOTEUR DE RENDU (Live pour HTML/CSS, Manuel pour JS)
// ============================================================
let renderTimer = null;

function scheduleRender() {
    if (activeTab === 'js') return;
    liveIndicator.classList.add('rendering');
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 400);
}

function renderPreview() {
    if (!htmlEditor || !cssEditor) return;
    livePreview.srcdoc = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>*,*::before,*::after{box-sizing:border-box;}${cssEditor.getValue()}</style></head><body>${htmlEditor.getValue()}</body></html>`;
    liveIndicator.classList.remove('rendering');
}

function executeAllCode() {
    if (!htmlEditor || !cssEditor || !jsEditor) return;
    livePreview.srcdoc = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>*,*::before,*::after{box-sizing:border-box;}${cssEditor.getValue()}</style></head><body>${htmlEditor.getValue()}<script>try{${jsEditor.getValue()}}catch(err){document.body.innerHTML+='<div style="background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-top:16px;font-family:monospace;font-size:13px;">❌ Erreur JS : '+err.message+'</div>';}<\/script></body></html>`;
    if (runCodeBtn) { runCodeBtn.textContent = "✅ Exécuté !"; runCodeBtn.disabled = true; setTimeout(() => { runCodeBtn.textContent = "▶️ Exécuter mon code"; runCodeBtn.disabled = false; }, 1500); }
}

if (runCodeBtn)       runCodeBtn.addEventListener('click', executeAllCode);
if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', renderPreview);

// ============================================================
// 12. ONGLETS
// ============================================================
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        activeTab = targetTab;
        tabButtons.forEach(b => { b.classList.toggle('active', b.dataset.tab === targetTab); b.setAttribute('aria-selected', b.dataset.tab === targetTab); });
        htmlEditorContainer.classList.toggle('hidden', targetTab !== 'html');
        cssEditorContainer.classList.toggle('hidden',  targetTab !== 'css');
        jsEditorContainer.classList.toggle('hidden',   targetTab !== 'js');
        if (targetTab === 'js') { liveIndicator.classList.add('js-mode'); liveIndicator.querySelector('span:not(.live-dot)').textContent = ' ▶️ Manuel'; }
        else { liveIndicator.classList.remove('js-mode'); liveIndicator.querySelector('span:not(.live-dot)').textContent = ' Live'; }
        if (targetTab === 'html' && htmlEditor) htmlEditor.layout();
        if (targetTab === 'css'  && cssEditor)  cssEditor.layout();
        if (targetTab === 'js'   && jsEditor)   jsEditor.layout();
    });
});

// ============================================================
// 13. INSTRUCTIONS COLLAPSIBLES
// ============================================================
if (toggleInstructionsBtn && instructionsBar) {
    toggleInstructionsBtn.addEventListener('click', () => {
        const isCollapsed = instructionsBar.classList.toggle('collapsed');
        toggleInstructionsBtn.setAttribute('aria-expanded', !isCollapsed);
    });
}

// ============================================================
// 14. RESIZE HANDLE
// ============================================================
let isResizing = false;
resizeHandle.addEventListener('mousedown', (e) => { isResizing = true; resizeHandle.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; e.preventDefault(); });
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerRect = splitWorkspace.getBoundingClientRect();
    let newEditorWidth = Math.max(200, Math.min(containerRect.width - 206, e.clientX - containerRect.left));
    editorSection.style.width = `${newEditorWidth}px`;
    editorSection.style.flex  = 'none';
    htmlEditor?.layout(); cssEditor?.layout(); jsEditor?.layout();
});
document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false; resizeHandle.classList.remove('dragging');
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    htmlEditor?.layout(); cssEditor?.layout(); jsEditor?.layout();
});

// ============================================================
// 15. SOUMISSION FIRESTORE
// ============================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (!htmlEditor || !cssEditor || !jsEditor) return;
        const userEmail     = userEmailEl?.textContent || "inconnu@test.com";
        const exerciseTitle = document.getElementById('exerciseTitle')?.textContent || "Exercice HTML/CSS/JS";
        const orig = submitBtn.textContent;
        submitBtn.textContent = "📤 Envoi...";
        submitBtn.disabled = true;

        try {
            const submissionData = {
                type: "html_css_js",
                code_html: htmlEditor.getValue(),
                code_css:  cssEditor.getValue(),
                code_js:   jsEditor.getValue(),
                code_eleve: `<!-- HTML -->\n${htmlEditor.getValue()}\n\n/* CSS */\n${cssEditor.getValue()}\n\n// JS\n${jsEditor.getValue()}`,
                consigne_exercice: CONSIGNE,
                email_eleve: userEmail,
                nom_eleve: userEmail.split('@')[0],
                titre_exercice: exerciseTitle,
                status: "a_valider",
                indices_utilises: { niv1: 0, niv2: 0, niv3: 0 },
                questions_libres: 0,
                date_soumission: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "submissions"), submissionData);
            hintState.currentDocId  = docRef.id;
            hintState.currentCode   = submissionData.code_eleve;
            updateHintButtons();
            listenForProfFeedback(docRef.id);
            appendMessage("📬 Ton atelier a bien été soumis ! Le professeur va le corriger.", 'assistant', 'Tuteur IA');
            openDrawer();

            submitBtn.textContent = "✅ Soumis !";
            setTimeout(() => { submitBtn.textContent = orig; submitBtn.disabled = false; }, 3000);
        } catch (error) {
            console.error("[Submit]", error);
            submitBtn.textContent = "❌ Erreur";
            setTimeout(() => { submitBtn.textContent = orig; submitBtn.disabled = false; }, 3000);
        }
    });
}
