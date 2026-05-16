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
const chatMessages          = document.getElementById('chatMessages');
const chatInput             = document.getElementById('chatInput');
const chatSendBtn           = document.getElementById('chatSendBtn');
const exportEmailBtn        = document.getElementById('exportEmailBtn');
const refreshCorrectionsBtn = document.getElementById('refreshCorrectionsBtn');
const hintBtn1              = document.getElementById('hintBtn1');
const hintBtn2              = document.getElementById('hintBtn2');
const hintBtn3              = document.getElementById('hintBtn3');
const freeQuestionToggle    = document.getElementById('freeQuestionToggle');
const freeQuestionPanel     = document.getElementById('freeQuestionPanel');
const questionCounter       = document.getElementById('questionCounter');
const resourcesSidebar      = document.getElementById('resourcesSidebar');
const toggleSidebarBtn      = document.getElementById('toggleSidebar');
const courseContentEl       = document.getElementById('courseContent');

// ============================================================
// 2. ÉTAT DE LA SESSION
// ============================================================
let chatHistory        = [];
const CONSIGNE         = "Crée une boucle for en JavaScript qui affiche les nombres de 1 à 10 dans la console.";
const COURSE_ID        = "javascript";
const MAX_QUESTIONS    = 5;

// ============================================================
// 2bis. GESTION DES RESSOURCES (NotebookLM Style)
// ============================================================
const toggleSidebar = () => {
    if (!resourcesSidebar || !toggleSidebarBtn) return;
    resourcesSidebar.classList.toggle('collapsed');
    toggleSidebarBtn.textContent = resourcesSidebar.classList.contains('collapsed') ? '▶' : '◀';
};

if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);

/**
 * Charge le contenu du cours depuis Firestore
 */
const loadCourseContent = async (id) => {
    if (!courseContentEl) return;
    try {
        const docRef = doc(db, "courses", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (typeof window.marked !== 'undefined') {
                courseContentEl.innerHTML = window.marked.parse(data.content || "# Aucun contenu");
            } else {
                courseContentEl.textContent = data.content || "Aucun contenu";
            }
        } else {
            courseContentEl.innerHTML = `<div class="course-placeholder">Pas de ressources pour ce chapitre.</div>`;
        }
    } catch (e) {
        console.error("[Course] Erreur de chargement :", e);
        courseContentEl.innerHTML = `<div class="course-placeholder">Erreur lors du chargement du cours.</div>`;
    }
};

// État des indices (persisté en session)
let hintState = {
    niv1Used: false,
    niv2Used: false,
    niv3Used: false,
    questionsLeft: MAX_QUESTIONS,
    currentDocId: null,
    currentCode: null
};

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
    
    if (role === 'user' || role === 'assistant') {
        chatHistory.push({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] });
    }
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
};

// ============================================================
// 4. SYSTÈME D'INDICES PROGRESSIFS
// ============================================================

/**
 * Met à jour l'état visuel des boutons d'indices selon hintState.
 * Règle de verrouillage : N2 = N1 requis, N3 = N2 requis.
 */
function updateHintButtons() {
    if (!hintBtn1) return;

    // N1 : débloqué uniquement après soumission
    hintBtn1.disabled = !hintState.currentDocId;
    hintBtn1.title = hintState.currentDocId
        ? (hintState.niv1Used ? "✅ Déjà utilisé — clique à nouveau pour un autre indice" : "Demander un indice théorique")
        : "Soumets ton code d'abord !";

    // N2 : débloqué après N1
    hintBtn2.disabled = !hintState.niv1Used;
    hintBtn2.title = hintState.niv1Used
        ? "Analyser mon code"
        : "🔒 Consulte le Niveau 1 d'abord";

    // N3 : débloqué après N2
    hintBtn3.disabled = !hintState.niv2Used;
    hintBtn3.title = hintState.niv2Used
        ? "Obtenir la structure du code"
        : "🔒 Consulte le Niveau 2 d'abord";
}

/**
 * Appelle la Cloud Function demanderIndice et affiche la réponse.
 */
async function requestHint(niveau) {
    const btn = document.getElementById(`hintBtn${niveau}`);
    if (!btn || btn.disabled) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = `<span>⏳ Réflexion...</span>`;
    btn.disabled = true;

    try {
        const indiceFn = httpsCallable(functions, 'demanderIndice');
        const res = await indiceFn({
            niveau,
            code_eleve: hintState.currentCode || "",
            consigne: CONSIGNE,
            doc_id: hintState.currentDocId
        });

        appendMessage(res.data.reponse, 'assistant', `Tuteur IA — Niveau ${niveau}`);

        // Mise à jour de l'état de verrouillage
        if (niveau === 1) hintState.niv1Used = true;
        if (niveau === 2) hintState.niv2Used = true;
        if (niveau === 3) hintState.niv3Used = true;

        updateHintButtons();

    } catch (e) {
        console.error(`[Indice N${niveau}] Erreur :`, e);
        appendMessage("Désolé, le tuteur n'est pas disponible.", 'assistant', 'Tuteur IA');
    } finally {
        btn.innerHTML = originalText;
        // On re-active uniquement si le verrouillage le permet
        updateHintButtons();
    }
}

if (hintBtn1) hintBtn1.addEventListener('click', () => requestHint(1));
if (hintBtn2) hintBtn2.addEventListener('click', () => requestHint(2));
if (hintBtn3) hintBtn3.addEventListener('click', () => requestHint(3));

// ============================================================
// 5. QUESTION LIBRE (toggle + compteur)
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
            appendMessage("Tu as utilisé tes 5 questions libres. Essaie le Niveau 3, ou attend la correction du professeur ! 💪", 'assistant', 'Tuteur IA');
            return;
        }
        freeQuestionPanel.classList.toggle('hidden');
        if (!freeQuestionPanel.classList.contains('hidden') && chatInput) {
            chatInput.focus();
        }
    });
}

// ============================================================
// 6. ENVOI QUESTION LIBRE
// ============================================================
const sendFreeQuestion = async () => {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    if (hintState.questionsLeft <= 0) {
        appendMessage("Tu as épuisé tes questions libres ! Utilise les boutons d'indices.", 'assistant', 'Tuteur IA');
        return;
    }

    appendMessage(text, 'user', 'Vous');
    chatInput.value = '';
    hintState.questionsLeft--;
    updateQuestionCounter();

    // Tracking Firestore des questions libres
    if (hintState.currentDocId) {
        updateDoc(doc(db, "submissions", hintState.currentDocId), {
            questions_libres: (5 - hintState.questionsLeft)
        }).catch(e => console.warn("[QLibre] Tracking échoué :", e.message));
    }

    // Fermer le panneau si plus de questions
    if (hintState.questionsLeft <= 0 && freeQuestionPanel) {
        freeQuestionPanel.classList.add('hidden');
    }

    const loadingId = "loader-" + Date.now();
    const loader = document.createElement('div');
    loader.id = loadingId;
    loader.className = 'chat-bubble assistant';
    loader.innerHTML = "<div class='chat-sender-name'>Tuteur IA</div><div class='chat-bubble-content'>🤔 Le tuteur réfléchit...</div>";
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const tuteurFn = httpsCallable(functions, 'interrogerTuteur');
        const res = await tuteurFn({ question: text, historique: chatHistory, id_cours: COURSE_ID });
        const loaderEl = document.getElementById(loadingId);
        if (loaderEl) loaderEl.remove();
        appendMessage(res.data.reponse, 'assistant', 'Tuteur IA');
    } catch (e) {
        console.error("[Question libre] Erreur :", e);
        const loaderEl = document.getElementById(loadingId);
        if (loaderEl) loaderEl.remove();
        appendMessage("Désolé, le tuteur n'est pas disponible.", 'assistant', 'Tuteur IA');
    }
};

if (chatSendBtn) chatSendBtn.addEventListener('click', sendFreeQuestion);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendFreeQuestion(); });

// ============================================================
// 7. AUTHENTIFICATION
// ============================================================
listenToAuthStatus((user) => {
    if (!user) { window.location.href = "index.html"; return; }
    if (userEmailEl) userEmailEl.textContent = user.email;
    
    const pendingDocId = localStorage.getItem('pendingDocId');
    if (pendingDocId) listenForProfFeedback(pendingDocId);
    
    updateHintButtons();
    updateQuestionCounter();
    loadCourseContent(COURSE_ID);
});

if (logoutBtn) logoutBtn.addEventListener('click', async () => await logoutUser());

// ============================================================
// 8. ÉDITEUR MONACO
// ============================================================
let monacoEditor;

document.addEventListener('monacoReady', () => {
    const container = document.getElementById('editor-container');
    if (container) {
        monacoEditor = window.monaco.editor.create(container, {
            value: "// Écris ta boucle ici\n\n",
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 16,
            padding: { top: 24 }
        });
    }
});

// ============================================================
// 9. SOUMISSION DU DEVOIR
// ============================================================
let activeSnapshotUnsub = null;

const listenForProfFeedback = (docId) => {
    if (activeSnapshotUnsub) activeSnapshotUnsub();
    console.log("[Firestore] Démarrage écoute sur docId:", docId);
    localStorage.setItem('pendingDocId', docId);

    activeSnapshotUnsub = onSnapshot(doc(db, "submissions", docId), (snapshot) => {
        const data = snapshot.data();
        console.log("[Firestore] Snapshot reçu, status:", data?.status);
        
        if (data && (data.status === "publie" || data.status === "brouillon")) {
            const isValidated = data.status === "publie";
            const icon  = isValidated ? "✅" : "🔄";
            const title = isValidated
                ? `**Correction validée par le professeur**\n\n**Note : ${data.note_suggeree || 0}/100**`
                : `**Le professeur te renvoie ta copie en révision**`;
            
            let finalOutput = `${icon} ${title}\n\n${data.feedback_ia || ''}`;
            if (data.erreurs_detectees?.length > 0) {
                finalOutput += "\n\n**Points à améliorer :**\n";
                data.erreurs_detectees.forEach(err => { finalOutput += `- ${err}\n`; });
            }
            if (!isValidated) finalOutput += "\n\n_Corrige et soumet à nouveau ! 💪_";
            
            appendMessage(finalOutput, 'assistant', 'Professeur');
            activeSnapshotUnsub();
            activeSnapshotUnsub = null;
            localStorage.removeItem('pendingDocId');
        }
    }, (error) => console.error("[Firestore] Erreur snapshot :", error));
};

if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        if (!monacoEditor) { alert("L'éditeur charge encore..."); return; }

        const studentCode  = monacoEditor.getValue();
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "Correction en cours... ⏳";
        submitBtn.disabled  = true;

        try {
            const corrigeDevoirFn = httpsCallable(functions, 'corrigerDevoir');
            const userEmail = userEmailEl ? (userEmailEl.textContent || "inconnu@test.com") : "inconnu@test.com";

            const response = await corrigeDevoirFn({
                code_eleve: studentCode,
                consigne_exercice: CONSIGNE,
                email_eleve: userEmail,
                nom_eleve: userEmail.split('@')[0]
            });

            const docId  = response.data.docId;
            const evalIA = response.data.evaluation;
            
            // Stocker le code et docId pour les indices
            hintState.currentDocId  = docId;
            hintState.currentCode   = studentCode;
            updateHintButtons();

            if (evalIA?.feedback_eleve) {
                appendMessage(`✨ **Indice de l'IA**\n\n${evalIA.feedback_eleve}\n\n_Le professeur va bientôt valider ta copie..._`, 'assistant', 'Tuteur IA');
            } else {
                appendMessage("📬 Ton devoir a bien été soumis !", 'assistant', 'Tuteur IA');
            }

            if (docId) listenForProfFeedback(docId);
            
        } catch (error) {
            console.error("[Submit] Erreur Backend :", error);
            appendMessage("❌ Erreur de communication. Réessaie dans un instant.", 'assistant', 'Tuteur IA');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled  = false;
        }
    });
}

// ============================================================
// 10. BOUTON REFRESH CORRECTIONS
// ============================================================
const checkForExistingCorrections = async (userEmail) => {
    if (!userEmail) return;
    try {
        const pendingDocId = localStorage.getItem('pendingDocId');
        if (pendingDocId) {
            const snap = await getDoc(doc(db, "submissions", pendingDocId));
            if (snap.exists()) {
                const data = snap.data();
                if (data.status === "publie" || data.status === "brouillon") {
                    const isValidated = data.status === "publie";
                    appendMessage(`${isValidated ? "✅" : "🔄"} **${isValidated ? "Correction validée" : "Copie renvoyée en révision"}**\n\n${data.feedback_ia || ''}`, 'assistant', 'Professeur');
                    localStorage.removeItem('pendingDocId');
                } else {
                    listenForProfFeedback(pendingDocId);
                    appendMessage("🔄 Toujours en attente de la correction...", 'assistant', 'Tuteur IA');
                }
            }
            return;
        }

        const q = query(collection(db, "submissions"), where("email_eleve", "==", userEmail), orderBy("date_soumission", "desc"), limit(5));
        const querySnap = await getDocs(q);
        const reviewed = querySnap.docs.map(d => ({ id: d.id, ...d.data() })).find(d => d.status === "publie" || d.status === "brouillon");

        if (reviewed) {
            const isVal = reviewed.status === "publie";
            appendMessage(`${isVal ? "✅" : "🔄"} **${isVal ? `Correction — Note : ${reviewed.note_suggeree || 0}/100` : "Copie renvoyée en révision"}**\n\n${reviewed.feedback_ia || ''}`, 'assistant', 'Professeur');
        } else {
            appendMessage("📭 Aucune correction disponible pour le moment.", 'assistant', 'Tuteur IA');
        }
    } catch (e) {
        console.error("[Refresh] Erreur :", e);
    }
};

if (refreshCorrectionsBtn) {
    refreshCorrectionsBtn.addEventListener('click', async () => {
        refreshCorrectionsBtn.textContent = "🔄 Vérification...";
        refreshCorrectionsBtn.disabled = true;
        await checkForExistingCorrections(userEmailEl?.textContent);
        setTimeout(() => { refreshCorrectionsBtn.textContent = "🔄 Corrections"; refreshCorrectionsBtn.disabled = false; }, 2000);
    });
}

// ============================================================
// 11. EXPORT EMAIL
// ============================================================
if (exportEmailBtn) {
    exportEmailBtn.addEventListener('click', async () => {
        const originalText = exportEmailBtn.textContent;
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
            await addDoc(collection(db, "mail_queue"), {
                to: userEmail,
                message: { subject: "Ton aide de révision en Informatique", html }
            });
            exportEmailBtn.textContent = "✅ Envoyé";
        } catch (e) {
            exportEmailBtn.textContent = "❌ Erreur";
        }
        setTimeout(() => { exportEmailBtn.textContent = originalText; exportEmailBtn.disabled = false; }, 4000);
    });
}
