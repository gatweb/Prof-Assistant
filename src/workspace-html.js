/**
 * workspace-html.js — Atelier HTML/CSS/JS avec Live Preview sécurisé.
 *
 * Architecture :
 *   1. Références DOM & Auth
 *   2. Monaco (3 éditeurs : HTML, CSS, JS)
 *   3. Moteur de rendu : Live Reload UNIQUEMENT pour HTML/CSS, Manuel pour JS
 *   4. Logique des onglets (avec mode JS = Live désactivé)
 *   5. Resize Handle
 *   6. Soumission Firestore
 *   7. Écoute feedback Professeur
 */

import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { functions } from './firebase/config.js';
import { doc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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

let activeTab = 'html'; // Onglet actif courant

// ============================================================
// 2. AUTHENTIFICATION
// ============================================================
listenToAuthStatus((user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    if (userEmailEl) userEmailEl.textContent = user.email;
    
    // Reprise écoute prof si doc en attente
    const pendingDoc = localStorage.getItem('pendingHtmlDocId');
    if (pendingDoc) listenForProfFeedback(pendingDoc);
});

if (logoutBtn) logoutBtn.addEventListener('click', async () => await logoutUser());

// ============================================================
// 3. MONACO — 3 éditeurs indépendants
// ============================================================
let htmlEditor = null;
let cssEditor  = null;
let jsEditor   = null;

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
.carte button {
  margin-top: 16px;
  padding: 8px 20px;
  background: #006493;
  color: white;
  border: none;
  border-radius: 100px;
  cursor: pointer;
}`;

const DEFAULT_JS = `// Écris ton JavaScript ici
// ⚠️ Clique sur "▶️ Exécuter mon code" pour voir le résultat

function changerCouleur() {
  const couleurs = ['#006493', '#e91e63', '#2e7d32', '#f57c00', '#7b1fa2'];
  const aleatoire = couleurs[Math.floor(Math.random() * couleurs.length)];
  document.getElementById('titre').style.color = aleatoire;
}`;

document.addEventListener('monacoReady', () => {
    // Éditeur HTML
    htmlEditor = window.monaco.editor.create(htmlEditorContainer, {
        value: DEFAULT_HTML,
        language: 'html',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        padding: { top: 16 },
        scrollBeyondLastLine: false
    });

    // Éditeur CSS
    cssEditor = window.monaco.editor.create(cssEditorContainer, {
        value: DEFAULT_CSS,
        language: 'css',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        padding: { top: 16 },
        scrollBeyondLastLine: false
    });

    // Éditeur JS
    jsEditor = window.monaco.editor.create(jsEditorContainer, {
        value: DEFAULT_JS,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        padding: { top: 16 },
        scrollBeyondLastLine: false
    });

    // Live Reload : UNIQUEMENT pour HTML et CSS
    // Le JS ne rafraîchit JAMAIS automatiquement (sécurité boucles infinies)
    htmlEditor.onDidChangeModelContent(() => scheduleRender());
    cssEditor.onDidChangeModelContent(()  => scheduleRender());
    // jsEditor : PAS de listener automatique — uniquement via bouton ▶️

    renderPreview(); // Premier rendu au chargement
});

// ============================================================
// 4. MOTEUR DE RENDU
// ============================================================

let renderTimer = null;

/**
 * Debounce pour HTML/CSS uniquement.
 */
function scheduleRender() {
    // Si l'onglet JS est actif, le live reload est suspendu (indiqué visuellement)
    if (activeTab === 'js') return;

    liveIndicator.classList.add('rendering');
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 400);
}

/**
 * Assemble HTML + CSS dans l'iframe. Le JS est EXCLU du live render.
 * Appelé aussi automatiquement au changement HTML/CSS.
 */
function renderPreview() {
    if (!htmlEditor || !cssEditor) return;

    const userHtml = htmlEditor.getValue();
    const userCss  = cssEditor.getValue();

    const fullDocument = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        ${userCss}
    </style>
</head>
<body>${userHtml}</body>
</html>`;

    livePreview.srcdoc = fullDocument;
    liveIndicator.classList.remove('rendering');
}

/**
 * Exécute TOUT le code (HTML + CSS + JS) en une seule injection.
 * Seul ce bouton déclenche l'exécution du JavaScript.
 * 
 * ⚠️ Le sandbox="allow-scripts" de l'iframe protège le DOM parent,
 * même si l'élève écrit une boucle infinie ou un script malveillant.
 */
function executeAllCode() {
    if (!htmlEditor || !cssEditor || !jsEditor) return;

    const userHtml = htmlEditor.getValue();
    const userCss  = cssEditor.getValue();
    const userJs   = jsEditor.getValue();

    // Assemblage complet : style + html + script dans cet ordre
    const fullDocument = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        ${userCss}
    </style>
</head>
<body>
    ${userHtml}
    <script>
        // Isolation : le JS de l'élève est exécuté ici
        // L'iframe est sandboxée (sans allow-same-origin), donc aucun accès au DOM parent
        try {
            ${userJs}
        } catch(err) {
            document.body.innerHTML += '<div style="background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin-top:16px;font-family:monospace;font-size:13px;">❌ Erreur JS : ' + err.message + '</div>';
        }
    <\/script>
</body>
</html>`;

    livePreview.srcdoc = fullDocument;

    // Feedback visuel sur le bouton
    if (runCodeBtn) {
        runCodeBtn.textContent = "✅ Exécuté !";
        runCodeBtn.disabled = true;
        setTimeout(() => {
            runCodeBtn.textContent = "▶️ Exécuter mon code";
            runCodeBtn.disabled = false;
        }, 1500);
    }
}

// Bouton ▶️ Exécuter
if (runCodeBtn) runCodeBtn.addEventListener('click', executeAllCode);

// Bouton ↻ Refresh (recharge sans JS)
if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', renderPreview);

// ============================================================
// 5. GESTION DES ONGLETS
// ============================================================
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        activeTab = targetTab;

        // Mise à jour des onglets
        tabButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.tab === targetTab);
            b.setAttribute('aria-selected', b.dataset.tab === targetTab);
        });

        // Affichage du bon éditeur
        htmlEditorContainer.classList.toggle('hidden', targetTab !== 'html');
        cssEditorContainer.classList.toggle('hidden',  targetTab !== 'css');
        jsEditorContainer.classList.toggle('hidden',   targetTab !== 'js');

        // Mode JS : Live Reload suspendu, indicateur orange
        if (targetTab === 'js') {
            liveIndicator.classList.add('js-mode');
            liveIndicator.querySelector('span:not(.live-dot)').textContent = ' ▶️ Manuel';
        } else {
            liveIndicator.classList.remove('js-mode');
            liveIndicator.querySelector('span:not(.live-dot)').textContent = ' Live';
        }

        // Recalcul Monaco
        if (targetTab === 'html' && htmlEditor) htmlEditor.layout();
        if (targetTab === 'css'  && cssEditor)  cssEditor.layout();
        if (targetTab === 'js'   && jsEditor)   jsEditor.layout();
    });
});

// ============================================================
// 6. INSTRUCTIONS COLLAPSIBLES
// ============================================================
if (toggleInstructionsBtn && instructionsBar) {
    toggleInstructionsBtn.addEventListener('click', () => {
        const isCollapsed = instructionsBar.classList.toggle('collapsed');
        toggleInstructionsBtn.setAttribute('aria-expanded', !isCollapsed);
    });
}

// ============================================================
// 7. RESIZE HANDLE
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
    const containerRect = splitWorkspace.getBoundingClientRect();
    const handleWidth   = resizeHandle.offsetWidth;
    let newEditorWidth  = e.clientX - containerRect.left;
    const minWidth      = 200;
    const maxWidth      = containerRect.width - minWidth - handleWidth;
    newEditorWidth = Math.max(minWidth, Math.min(maxWidth, newEditorWidth));
    editorSection.style.width = `${newEditorWidth}px`;
    editorSection.style.flex  = 'none';
    htmlEditor?.layout();
    cssEditor?.layout();
    jsEditor?.layout();
});

document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    htmlEditor?.layout();
    cssEditor?.layout();
    jsEditor?.layout();
});

// ============================================================
// 8. SOUMISSION FIRESTORE
// ============================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (!htmlEditor || !cssEditor || !jsEditor) return;

        const userEmail     = userEmailEl ? (userEmailEl.textContent || "inconnu@test.com") : "inconnu@test.com";
        const exerciseTitle = document.getElementById('exerciseTitle')?.textContent || "Exercice HTML/CSS/JS";

        const originalText  = submitBtn.textContent;
        submitBtn.textContent = "📤 Envoi...";
        submitBtn.disabled  = true;

        try {
            const submissionData = {
                type: "html_css_js",
                code_html: htmlEditor.getValue(),
                code_css: cssEditor.getValue(),
                code_js: jsEditor.getValue(),
                // Vue combinée pour le prof (Monaco read-only)
                code_eleve: `<!-- HTML -->\n${htmlEditor.getValue()}\n\n/* CSS */\n${cssEditor.getValue()}\n\n// JavaScript\n${jsEditor.getValue()}`,
                consigne_exercice: exerciseTitle,
                email_eleve: userEmail,
                nom_eleve: userEmail.split('@')[0],
                titre_exercice: exerciseTitle,
                status: "a_valider",
                indices_utilises: { niv1: 0, niv2: 0, niv3: 0 },
                questions_libres: 0,
                date_soumission: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "submissions"), submissionData);
            localStorage.setItem('pendingHtmlDocId', docRef.id);
            listenForProfFeedback(docRef.id);

            submitBtn.textContent = "✅ Soumis !";
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error("[Submit] Erreur :", error);
            submitBtn.textContent = "❌ Erreur";
            setTimeout(() => { submitBtn.textContent = originalText; submitBtn.disabled = false; }, 3000);
        }
    });
}

// ============================================================
// 9. ÉCOUTE FEEDBACK PROFESSEUR
// ============================================================
let profFeedbackUnsub = null;

function listenForProfFeedback(docId) {
    if (profFeedbackUnsub) profFeedbackUnsub();
    profFeedbackUnsub = onSnapshot(doc(db, "submissions", docId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        if (data.status === "publie" || data.status === "brouillon") {
            const isValidated = data.status === "publie";
            const msg = isValidated
                ? `✅ Bravo ! Le professeur a validé ta création.\nNote : ${data.note_suggeree || 0}/100\n\n${data.feedback_ia || ''}`
                : `🔄 Le professeur te demande de réviser.\n\n${data.feedback_ia || ''}`;
            alert(`📬 FEEDBACK DU PROFESSEUR\n\n${msg}`);
            profFeedbackUnsub();
            profFeedbackUnsub = null;
            localStorage.removeItem('pendingHtmlDocId');
        }
    });
}
