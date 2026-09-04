import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { getSubmissionsToGrade, updateSubmissionStatus, generateMockSubmissions, generateMockCourses, db } from './firebase/db.js';
import { functions } from './firebase/config.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";
import { formatDate } from './utils.js';
import { doc, onSnapshot, collection, addDoc, query, where, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ============================================
// 1. Contrôle d'accès strict
// ============================================
const ADMIN_EMAIL = "gatweb@gmail.com";
let currentAdminUser = null;

// Écoute de l'état asynchrone (s'exécute au chargement)
listenToAuthStatus((user) => {
    const isDemoMode = window.location.search.includes("demo=true");
    if (!user && isDemoMode) {
        user = { email: ADMIN_EMAIL, displayName: "Professeur Admin (Démo)", uid: "demo-admin-123" };
    }

    if (!user) {
        window.location.href = "index.html";
        return;
    }
    
    // FILTRE DE SÉCURITÉ PRÉSENTATION
    if (user.email !== ADMIN_EMAIL) {
        alert("Accès refusé. \nVotre adresse (" + user.email + ") n'est pas autorisée sur ce tableau de bord professeur.");
        window.location.href = "workspace-html.html";
        return;
    }

    currentAdminUser = user;
    
    const emailEl = document.getElementById('userEmail');
    if(emailEl) emailEl.textContent = user.email;
    
    // Démarrage de l'app Admin
    loadSubmissionsList();
});

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
    });
}

// ============================================
// 2. Gestion de la Vue Liste & Filtres Multi-Classes
// ============================================
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const tbody = document.getElementById('submissionsTableBody');
const filterStudentSearch = document.getElementById('filterStudentSearch');
const filterCourseSelect = document.getElementById('filterCourseSelect');
const filterStatusSelect = document.getElementById('filterStatusSelect');
const refreshSubmissionsBtn = document.getElementById('refreshSubmissionsBtn');

let allLoadedCopies = [];
let currentViewingCopyId = null;

// Helper métadonnées des cours
function getCourseMeta(courseId, exerciseTitle = "") {
    const id = (courseId || "").toLowerCase();
    const title = (exerciseTitle || "").toLowerCase();

    if (id.includes("bureautique") || title.includes("drive") || title.includes("docs") || title.includes("styles") || title.includes("sommaire")) {
        return { label: "Bureautique 3e", color: "#1d4ed8", bg: "#dbeafe", icon: "📄" };
    }
    if (id.includes("dactylo") || id.startsWith("dac-") || title.includes("dactylographie") || title.includes("ligne de base") || title.includes("agilefingers")) {
        return { label: "Dactylo 3e", color: "#047857", bg: "#d1fae5", icon: "⌨️" };
    }
    if (id.includes("site-web") || id.includes("html") || id.includes("css") || title.includes("html") || title.includes("css")) {
        return { label: "Web HTML/CSS", color: "#c2410c", bg: "#ffedd5", icon: "🌐" };
    }
    if (id.includes("js") || id.includes("uaa5") || title.includes("boucle") || title.includes("fonction") || title.includes("dom")) {
        return { label: "JS UAA5", color: "#a16207", bg: "#fef9c3", icon: "💛" };
    }
    if (id.includes("studio") || title.includes("canva") || title.includes("suno") || title.includes("prompt")) {
        return { label: "Studio Créatif", color: "#7e22ce", bg: "#f3e8ff", icon: "🎬" };
    }
    return { label: courseId || "Général", color: "#475569", bg: "#f1f5f9", icon: "📚" };
}

function getStatusBadge(status, note) {
    if (status === "valide") {
        return `<span class="badge" style="background:#dcfce7;color:#15803d;font-size:11px;">✅ Validé (${note ?? 100}/100)</span>`;
    }
    if (status === "a_corriger") {
        return `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-size:11px;">🔄 À réviser</span>`;
    }
    return `<span class="badge" style="background:#fef3c7;color:#b45309;font-size:11px;">⏳ En attente</span>`;
}

function renderSubmissionsTable() {
    if (!tbody) return;

    const searchTerm = (filterStudentSearch?.value || "").toLowerCase().trim();
    const selectedCourse = filterCourseSelect?.value || "all";
    const selectedStatus = filterStatusSelect?.value || "a_valider";

    let filtered = allLoadedCopies.filter(copy => {
        // Filtre Statut
        if (selectedStatus !== "all") {
            if (selectedStatus === "a_valider" && copy.status !== "a_valider") return false;
            if (selectedStatus === "valide" && copy.status !== "valide") return false;
            if (selectedStatus === "a_corriger" && copy.status !== "a_corriger") return false;
        }

        // Filtre Cours
        if (selectedCourse !== "all") {
            const cId = (copy.course_id || "").toLowerCase();
            const exTitle = (copy.titre_exercice || "").toLowerCase();
            const meta = getCourseMeta(cId, exTitle);
            
            if (selectedCourse === "bureautique-3e" && meta.label !== "Bureautique 3e") return false;
            if (selectedCourse === "dactylo-3e" && meta.label !== "Dactylo 3e") return false;
            if (selectedCourse === "creation-site-web" && meta.label !== "Web HTML/CSS") return false;
            if (selectedCourse === "js-uaa5-classic" && meta.label !== "JS UAA5") return false;
            if (selectedCourse === "studio-creatif" && meta.label !== "Studio Créatif") return false;
        }

        // Filtre Recherche (Nom élève, email, ou classe)
        if (searchTerm) {
            const nom = (copy.nom_eleve || "").toLowerCase();
            const email = (copy.email_eleve || "").toLowerCase();
            const titre = (copy.titre_exercice || "").toLowerCase();
            const matches = nom.includes(searchTerm) || email.includes(searchTerm) || titre.includes(searchTerm);
            if (!matches) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-16" style="color: #64748b;">Aucune copie ne correspond aux filtres sélectionnés.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    // Tri par date de soumission (plus récent en haut)
    const sorted = [...filtered].sort((a,b) => new Date(b.date_soumission || 0) - new Date(a.date_soumission || 0));
    
    sorted.forEach(copy => {
        const tr = document.createElement('tr');
        const dateStr = formatDate(copy.date_soumission);
        const meta = getCourseMeta(copy.course_id, copy.titre_exercice);
        const statusBadge = getStatusBadge(copy.status, copy.note_suggeree);

        tr.innerHTML = `
            <td>
                <strong>${copy.nom_eleve || "Anonyme"}</strong>
                ${copy.email_eleve ? `<div style="font-size:11px;color:#64748b;">${copy.email_eleve}</div>` : ''}
            </td>
            <td>
                <span class="badge" style="background:${meta.bg};color:${meta.color};font-size:11px;padding:3px 8px;border-radius:6px;vertical-align:middle;margin-left:0;">
                    ${meta.icon} ${meta.label}
                </span>
            </td>
            <td>${copy.titre_exercice || "-"}</td>
            <td>${statusBadge}</td>
            <td style="font-size:12px;color:#64748b;">${dateStr}</td>
            <td><button class="btn-primary btn-sm" onclick="window.openDetailView('${copy.id}')">Évaluer</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadSubmissionsList() {
    try {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-16">Chargement des copies...</td></tr>';
        
        // Écoute temps réel de toutes les soumissions récentes
        const q = collection(db, "submissions");
        
        onSnapshot(q, (snapshot) => {
            allLoadedCopies = [];
            snapshot.forEach((doc) => {
                allLoadedCopies.push({ id: doc.id, ...doc.data() });
            });

            renderSubmissionsTable();
        });
    } catch (e) {
        console.error("ERREUR FIRESTORE DETAIL :", e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-16" style="color:#ba1a1a">❌ Erreur de connexion Firestore (${e.message || e}).</td></tr>`;
    }
}

// Événements sur la barre de filtres
if (filterStudentSearch) filterStudentSearch.addEventListener('input', renderSubmissionsTable);
if (filterCourseSelect) filterCourseSelect.addEventListener('change', renderSubmissionsTable);
if (filterStatusSelect) filterStatusSelect.addEventListener('change', renderSubmissionsTable);
if (refreshSubmissionsBtn) refreshSubmissionsBtn.addEventListener('click', renderSubmissionsTable);

// Variable globale pour suivre d'où on vient avant d'ouvrir le détail
window.lastViewBeforeDetail = 'listView';

// Fonction globale injectée pour le onclick HTML
window.openDetailView = (id) => {
    const copy = allLoadedCopies.find(c => c.id === id);
    if (!copy) return;
    
    window.lastViewBeforeDetail = 'listView';
    window.openDetailViewFromCopy(copy);
};

// Nouvelle fonction globale pour ouvrir n'importe quelle copie depuis la matrice de progression
window.openDetailViewFromMatrix = (copy) => {
    if (!copy) return;
    
    window.lastViewBeforeDetail = 'progressionView';
    window.openDetailViewFromCopy(copy);
};

// Fonction générique interne pour charger les détails d'une copie
window.openDetailViewFromCopy = (copy) => {
    currentViewingCopyId = copy.id;

    // 1. Charger les données dans l'UI
    document.getElementById('detailStudentName').textContent = "Copie de : " + (copy.nom_eleve || "Anonyme");
    document.getElementById('detailExerciseName').textContent = copy.titre_exercice || "Exercice Inconnu";
    document.getElementById('feedbackIaInput').value = copy.feedback_ia || "";
    document.getElementById('scoreInput').value = copy.note_suggeree || 0;
    if (document.getElementById('profMessageInput')) {
        document.getElementById('profMessageInput').value = copy.prof_message || "";
    }
    
    // Masquer les onglets pendant la correction pour maximiser l'espace
    const tabs = document.querySelector('.admin-tabs-container');
    if (tabs) tabs.classList.add('hidden');

    // 2. Basculer l'affichage (masquer toutes les listes)
    listView.classList.add('hidden');
    const progressionView = document.getElementById('progressionView');
    if (progressionView) progressionView.classList.add('hidden');
    detailView.classList.remove('hidden');
    
    // Statistiques d'autonomie (indices utilisés + questions libres + copier/coller + focus)
    const auto = copy.autonomie || {};
    
    // Rétrocompatibilité avec les anciens champs
    const niv1 = auto.indices_niv1 !== undefined ? auto.indices_niv1 : (copy.indices_utilises?.niv1 || 0);
    const niv2 = auto.indices_niv2 !== undefined ? auto.indices_niv2 : (copy.indices_utilises?.niv2 || 0);
    const niv3 = auto.indices_niv3 !== undefined ? auto.indices_niv3 : (copy.indices_utilises?.niv3 || 0);
    const questions = auto.questions_ia !== undefined ? auto.questions_ia : (copy.questions_libres || 0);
    
    document.getElementById('statNiv1').textContent     = niv1;
    document.getElementById('statNiv2').textContent     = niv2;
    document.getElementById('statNiv3').textContent     = niv3;
    document.getElementById('statQuestions').textContent = questions;

    // Nouveaux indicateurs de copier-coller et de focus
    document.getElementById('statPasteOps').textContent  = auto.copie_colle_ops || 0;
    document.getElementById('statPasteChars').textContent = auto.copie_colle_caracteres || 0;
    document.getElementById('statPageExits').textContent = auto.sorties_page || 0;
    document.getElementById('statTimeOutside').textContent = auto.temps_hors_focus_sec !== undefined ? `${auto.temps_hors_focus_sec}s` : '0s';
    
    // Détection du mode : Code vs Bureautique / Outils Externes
    const codeData = copy.code_eleve || "";
    const editorContainer = document.getElementById('editor-container');
    const officeContainer = document.getElementById('office-preview-container');

    const isOffice = copy.type === 'office_submission' || copy.type === 'office' || codeData.includes('http') || codeData.includes('[Lien Document]');

    if (isOffice && officeContainer) {
        if (editorContainer) editorContainer.classList.add('hidden');
        officeContainer.classList.remove('hidden');

        // Extraire l'URL si présente
        const urlMatch = codeData.match(/https?:\/\/[^\s\n]+/);
        const url = urlMatch ? urlMatch[0] : null;

        officeContainer.innerHTML = `
            <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:32px;">📄</span>
                    <div>
                        <h3 style="margin:0;color:#38bdf8;font-size:18px;">Travail Bureautique / Dactylographie</h3>
                        <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Document ou score soumis par l'élève</p>
                    </div>
                </div>

                ${url ? `
                <div style="margin-top:20px;padding:16px;background:#0f172a;border-radius:8px;border:1px solid #3b82f6;">
                    <div style="color:#93c5fd;font-size:12px;font-weight:600;text-transform:uppercase;">🔗 Lien vers le document de l'élève :</div>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;margin-top:8px;color:#38bdf8;font-size:15px;font-weight:bold;text-decoration:none;word-break:break-all;">
                        ${url} ↗
                    </a>
                </div>
                ` : ''}

                <div style="margin-top:20px;">
                    <div style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:8px;">📝 Contenu transmis :</div>
                    <pre style="background:#0f172a;padding:16px;border-radius:8px;color:#e2e8f0;font-family:inherit;font-size:13px;white-space:pre-wrap;line-height:1.5;">${codeData || "Aucun texte additionnel."}</pre>
                </div>
            </div>
        `;
    } else {
        if (officeContainer) officeContainer.classList.add('hidden');
        if (editorContainer) editorContainer.classList.remove('hidden');

        // Injection du code dans Monaco
        if (monacoEditorInstance) {
            monacoEditorInstance.setValue(codeData || "// Aucun code n'a été fourni");
        } else {
            pendingCodeToSet = codeData || "// Aucun code n'a été fourni";
        }
    }
};

const backBtn = document.getElementById('backToListBtn');
if(backBtn) {
    backBtn.addEventListener('click', () => {
        detailView.classList.add('hidden');
        
        // Retourner à la vue de provenance
        const prevView = document.getElementById(window.lastViewBeforeDetail || 'listView');
        if (prevView) prevView.classList.remove('hidden');
        
        // Réafficher les onglets
        const tabs = document.querySelector('.admin-tabs-container');
        if (tabs) tabs.classList.remove('hidden');
        
        currentViewingCopyId = null;
    });
}

// ============================================
// 3. Outil de Génération de Tests (DEV ONLY)
// ============================================
const generateMockBtn = document.getElementById('generateMockBtn');
if(generateMockBtn) {
    generateMockBtn.addEventListener('click', async () => {
        const confirmMsg = "Générer 3 fausses copies dans Firebase pour tester le tableau de bord ?";
        if (confirm(confirmMsg)) {
            generateMockBtn.disabled = true;
            generateMockBtn.textContent = "Génération en cours...";
            try {
                await generateMockSubmissions();
                alert("✅ 3 copies ont été générées avec succès !");
                loadSubmissionsList();
            } catch (e) {
                console.error("Erreur mock", e);
                alert("❌ Impossible de générer. La base de données Firestore est-elle bien initialisée en mode Test ?");
            } finally {
                generateMockBtn.textContent = "🧪 Générer copies de test";
                generateMockBtn.disabled = false;
            }
        }
    });
}

const generateCoursesBtn = document.getElementById('generateCoursesBtn');
if(generateCoursesBtn) {
    generateCoursesBtn.addEventListener('click', async () => {
        if(confirm("Créer les cours par défaut (html_css, javascript) dans la base ?")) {
            generateCoursesBtn.disabled = true;
            generateCoursesBtn.textContent = "En cours...";
            try {
                await generateMockCourses();
                alert("📚 Cours générés avec succès ! Le Tuteur IA a maintenant une base de théorie.");
            } catch(e) {
                console.error(e);
                alert("Erreur création cours");
            } finally {
                generateCoursesBtn.textContent = "📚 Initialiser Cours";
                generateCoursesBtn.disabled = false;
            }
        }
    });
}

// ============================================
// 3.5 Météo de la classe (Insights)
// ============================================
const insightsContainer = document.getElementById('insightsContainer');
if (insightsContainer) {
    onSnapshot(doc(db, "statistiques_classe", "tags"), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            insightsContainer.innerHTML = ''; // Clear
            
            // Transformer en tableau pour trier par difficulté
            const tags = Object.entries(data).sort((a,b) => b[1] - a[1]);
            
            if (tags.length === 0) {
                insightsContainer.innerHTML = '<span class="badge" style="background-color: rgba(0,0,0,0.1); color: inherit;">Aucune question posée pour le moment.</span>';
                return;
            }

            tags.forEach(([tag, count]) => {
                const el = document.createElement('span');
                el.className = 'badge';
                // Code couleur
                if (count >= 5) {
                    el.style.backgroundColor = 'var(--md-sys-color-error)';
                    el.style.color = 'var(--md-sys-color-on-error)';
                } else if (count >= 2) {
                    el.style.backgroundColor = 'orange';
                    el.style.color = 'white';
                } else {
                    el.style.backgroundColor = 'var(--md-sys-color-secondary)';
                    el.style.color = 'var(--md-sys-color-on-secondary)';
                }
                el.textContent = `${tag} (${count})`;
                insightsContainer.appendChild(el);
            });
        } else {
            insightsContainer.innerHTML = '<span class="badge" style="background-color: rgba(0,0,0,0.1); color: inherit;">Aucune donnée. Les élèves sont sages !</span>';
        }
    });
}

// ============================================
// 4. Éditeur Monaco (Configuration Read-Only)
// ============================================
let monacoEditorInstance;
let pendingCodeToSet = null;

const initMonaco = () => {
    const container = document.getElementById('editor-container');
    if (container) {
        monacoEditorInstance = window.monaco.editor.create(container, {
            value: "// Chargement de la copie...",
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            readOnly: true, // IMPORTANT : Empêche l'édition de la copie de l'élève !
            minimap: { enabled: false }, // Interface épurée
            fontSize: 15,
            padding: { top: 24, bottom: 24 },
            scrollBeyondLastLine: false
        });

        // Cas où openDetailView a été cliqué avant chargement total de Monaco
        if (pendingCodeToSet) {
            monacoEditorInstance.setValue(pendingCodeToSet);
            pendingCodeToSet = null;
        }
    }
};

if (window.monaco && window.monaco.editor) {
    initMonaco();
} else {
    document.addEventListener('monacoReady', initMonaco);
}

// ============================================
// 4b. Redimensionnement de la Vue de Détail Professeur
// ============================================
const detailResizeHandle = document.getElementById('detailResizeHandle');
const detailReadOnlyPanel = document.getElementById('detailReadOnlyPanel');
let isResizingDetail = false;
let lastDetailWidth = localStorage.getItem('last_admin_detail_width') || '55%';

if (detailReadOnlyPanel && detailResizeHandle) {
    detailReadOnlyPanel.style.width = lastDetailWidth;

    detailResizeHandle.addEventListener('mousedown', (e) => {
        isResizingDetail = true;
        detailResizeHandle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizingDetail) return;
        const totalW = window.innerWidth;
        const newW = Math.max(280, Math.min(totalW - 320, e.clientX));
        const pct = ((newW / totalW) * 100).toFixed(1) + '%';
        detailReadOnlyPanel.style.width = pct;
        lastDetailWidth = pct;
        localStorage.setItem('last_admin_detail_width', pct);
        if (monacoEditorInstance?.layout) {
            monacoEditorInstance.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isResizingDetail) return;
        isResizingDetail = false;
        detailResizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (monacoEditorInstance?.layout) {
            monacoEditorInstance.layout();
        }
    });
}

// ============================================
// 5. Actions Métier (Boutons Validation & Feedback)
// ============================================
const suggestBtn = document.getElementById('suggestProfFeedbackBtn');
if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
        const scoreVal = parseInt(document.getElementById('scoreInput')?.value || '100', 10);
        const msgInput = document.getElementById('profMessageInput');
        if (!msgInput) return;

        if (scoreVal >= 85) {
            msgInput.value = "Excellent travail ! Tout est parfaitement exécuté et les consignes sont maîtrisées. Félicitations ! 🌟";
        } else if (scoreVal >= 60) {
            msgInput.value = "Bon travail dans l'ensemble ! Prends bien le temps de vérifier la mise en forme et les derniers détails, tu es sur la bonne voie. 💪";
        } else {
            msgInput.value = "Tu as fait de bons efforts, mais certains points bloquent encore. Regarde bien les conseils du Tuteur IA et pose-lui des questions pour t'aider à corriger pas à pas ! 🚀";
        }
        msgInput.focus();
    });
}

document.getElementById('approveBtn').addEventListener('click', async () => {
    await processAction("valide");
});

document.getElementById('rejectBtn').addEventListener('click', async () => {
    await processAction("en_cours");
});

async function processAction(newStatus) {
    if (!currentViewingCopyId) return;

    const feedback    = document.getElementById('feedbackIaInput').value;
    const note        = document.getElementById('scoreInput').value;
    const profMessage = document.getElementById('profMessageInput')?.value?.trim() || null;

    // Label lisible pour la confirmation
    const label = newStatus === 'valide' ? '✅ Valider l\'exercice' : '❌ Demander des corrections';
    const copy  = allLoadedCopies.find(c => c.id === currentViewingCopyId);
    const nomEleve = copy?.nom_eleve || 'l\'élève';
    if (!confirm(`${label} pour ${nomEleve} ?`)) return;

    // Feedback visuel sur les boutons
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn  = document.getElementById('rejectBtn');
    approveBtn.disabled = rejectBtn.disabled = true;
    approveBtn.textContent = rejectBtn.textContent = '⏳ Envoi...';

    try {
        // 1. Mettre à jour le statut, le feedback prof et la note dans Firestore
        await updateSubmissionStatus(currentViewingCopyId, newStatus, feedback, Number(note), profMessage);

        // 2. Retour à la liste
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
        
        // S'assurer que les onglets sont visibles (au cas où on était en split screen)
        const tabs = document.querySelector('.admin-tabs-container');
        if (tabs) tabs.classList.remove('hidden');
        
        currentViewingCopyId = null;

        // Vider le message prof pour la prochaine copie
        const msgInput = document.getElementById('profMessageInput');
        if (msgInput) msgInput.value = '';

    } catch (e) {
        console.error("Erreur lors de la validation", e);
        alert("Erreur réseau lors de la mise à jour.");
    } finally {
        approveBtn.disabled = rejectBtn.disabled = false;
        approveBtn.textContent = '✅ Valider l\'exercice';
        rejectBtn.textContent  = '❌ Demander des corrections';
    }
}

// ============================================
// 6. LOGIQUE DE CONFIGURATION (Chapitres / Examen)
// ============================================
const toggleExamActive = document.getElementById('toggleExamActive');
const examStatusLabel = document.getElementById('examStatusLabel');
const adminChaptersList = document.getElementById('adminChaptersList');

let dbSettings = {
    exam_active: true,
    disabled_chapters: []
};

// Démarrer l'écoute des réglages
async function initConfigTab() {
    if (!toggleExamActive || !adminChaptersList) return;

    // 1. Écouter le statut de l'examen et des chapitres
    onSnapshot(doc(db, "config", "settings"), async (snapshot) => {
        if (snapshot.exists()) {
            dbSettings = snapshot.data();
            if (dbSettings.exam_active === undefined) dbSettings.exam_active = true;
            if (dbSettings.disabled_chapters === undefined) dbSettings.disabled_chapters = [];
        } else {
            // Créer les réglages par défaut s'ils n'existent pas
            dbSettings = { exam_active: true, disabled_chapters: [] };
            await setDoc(doc(db, "config", "settings"), dbSettings);
        }

        // Mettre à jour le toggle de l'examen
        toggleExamActive.checked = dbSettings.exam_active;
        if (examStatusLabel) {
            examStatusLabel.textContent = dbSettings.exam_active ? "Examen Actif" : "Examen Désactivé";
            examStatusLabel.style.color = dbSettings.exam_active ? "green" : "red";
        }

        // Re-rendre les chapitres pour refléter les coches
        renderChaptersConfig();
    });

    // 2. Écouter les clics sur le toggle Examen
    toggleExamActive.addEventListener('change', async () => {
        dbSettings.exam_active = toggleExamActive.checked;
        await setDoc(doc(db, "config", "settings"), dbSettings);
    });
}

async function renderChaptersConfig() {
    try {
        const exsSnap = await getDocs(collection(db, "exercices"));
        
        // Définition des cours et de leur icône
        const courseGroups = {
            "dactylo-3e": { title: "Dactylographie & Clavier Pro (3e)", icon: "⌨️", chapters: [] },
            "bureautique-3e": { title: "Bureautique & Google Workspace (3e)", icon: "📄", chapters: [] },
            "creation-site-web": { title: "UAA3 — Création du Site Web HTML/CSS", icon: "🌐", chapters: [] },
            "js-uaa5-classic": { title: "UAA5 : Algorithmique et Programmation", icon: "💛", chapters: [] },
            "studio-creatif": { title: "Studio Créatif : Ton Agence d'Une Seule Personne", icon: "🎬", chapters: [] },
            "rap-academy-workspace": { title: "Rap Star Academy : En route vers le succès", icon: "🎤", chapters: [] },
            "autre": { title: "Autres Modules & Exercices", icon: "📁", chapters: [] }
        };

        const chaptersSet = new Set();
        const chapterToCourse = {};

        exsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const ch = data.chapitre;
            if (!ch) return;

            chaptersSet.add(ch);

            const cId = (data.course_id || "").toLowerCase();
            const chLower = ch.toLowerCase();

            if (cId.includes("dactylo") || chLower.includes("dactylo") || chLower.includes("ligne de base") || chLower.includes("ligne supérieure") || chLower.includes("ligne inférieure") || chLower.includes("accents") || chLower.includes("test final")) {
                chapterToCourse[ch] = "dactylo-3e";
            } else if (cId.includes("bureautique") || chLower.includes("bureautique") || chLower.includes("drive") || chLower.includes("docs") || chLower.includes("gmail") || chLower.includes("feuille")) {
                chapterToCourse[ch] = "bureautique-3e";
            } else if (cId.includes("site-web") || cId.includes("html") || chLower.includes("html") || chLower.includes("css") || chLower.includes("arborescence") || chLower.includes("flexbox") || chLower.includes("tableaux html")) {
                chapterToCourse[ch] = "creation-site-web";
            } else if (cId.includes("js") || cId.includes("uaa5") || chLower.includes("javascript") || chLower.includes("variables") || chLower.includes("boucle") || chLower.includes("fonction") || chLower.includes("algorithme")) {
                chapterToCourse[ch] = "js-uaa5-classic";
            } else if (cId.includes("studio") || chLower.includes("studio") || chLower.includes("département")) {
                chapterToCourse[ch] = "studio-creatif";
            } else if (cId.includes("rap") || chLower.includes("rap")) {
                chapterToCourse[ch] = "rap-academy-workspace";
            } else {
                chapterToCourse[ch] = "autre";
            }
        });

        // Distribuer les chapitres uniques dans leurs groupes
        Array.from(chaptersSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).forEach(ch => {
            const targetCourse = chapterToCourse[ch] || "autre";
            courseGroups[targetCourse].chapters.push(ch);
        });

        const activeGroups = Object.entries(courseGroups).filter(([_, group]) => group.chapters.length > 0);

        if (activeGroups.length === 0) {
            adminChaptersList.innerHTML = '<p class="config-desc">Aucun chapitre trouvé dans la base.</p>';
            return;
        }

        adminChaptersList.innerHTML = activeGroups.map(([groupId, group], index) => {
            const activeCount = group.chapters.filter(ch => !dbSettings.disabled_chapters.includes(ch)).length;
            const totalCount = group.chapters.length;
            const isOpen = index === 0 ? 'open' : '';

            return `
                <div class="course-accordion ${isOpen}" id="acc-${groupId}">
                    <div class="course-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                        <div class="course-accordion-title">
                            <span>${group.icon}</span>
                            <span>${group.title}</span>
                            <span class="badge" style="background:#e2e8f0; color:#334155; font-size:11px;">
                                ${activeCount}/${totalCount} actif${activeCount > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div class="course-accordion-actions" onclick="event.stopPropagation()">
                            <button type="button" class="btn-toggle-all" onclick="toggleCourseChapters('${groupId}', true)">✅ Tout activer</button>
                            <button type="button" class="btn-toggle-all" onclick="toggleCourseChapters('${groupId}', false)">❌ Tout masquer</button>
                            <span style="font-size:14px; margin-left:6px; color:#94a3b8;">▼</span>
                        </div>
                    </div>
                    <div class="course-accordion-body">
                        ${group.chapters.map(ch => {
                            const isDisabled = dbSettings.disabled_chapters.includes(ch);
                            const isChecked = !isDisabled;
                            return `
                                <div class="chapter-config-item">
                                    <label>
                                        <input type="checkbox" data-group="${groupId}" data-chapter="${ch}" ${isChecked ? 'checked' : ''} onchange="onChapterCheckboxChange(this)">
                                        <span class="chapter-name-label">${ch}</span>
                                    </label>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Exposer les handlers globalement pour les onclick inline
        window.toggleCourseChapters = async (groupId, enable) => {
            const group = courseGroups[groupId];
            if (!group) return;

            group.chapters.forEach(ch => {
                if (enable) {
                    dbSettings.disabled_chapters = dbSettings.disabled_chapters.filter(c => c !== ch);
                } else {
                    if (!dbSettings.disabled_chapters.includes(ch)) {
                        dbSettings.disabled_chapters.push(ch);
                    }
                }
            });

            if (enable) {
                dbSettings.disabled_chapters = dbSettings.disabled_chapters.filter(c => c !== groupId && c !== group.title);
            } else {
                if (!dbSettings.disabled_chapters.includes(groupId)) dbSettings.disabled_chapters.push(groupId);
                if (!dbSettings.disabled_chapters.includes(group.title)) dbSettings.disabled_chapters.push(group.title);
            }

            await setDoc(doc(db, "config", "settings"), dbSettings);
            renderChaptersConfig();
        };

        window.onChapterCheckboxChange = async (checkbox) => {
            const chapterName = checkbox.getAttribute('data-chapter');
            const isChecked = checkbox.checked;

            if (isChecked) {
                dbSettings.disabled_chapters = dbSettings.disabled_chapters.filter(ch => ch !== chapterName);
            } else {
                if (!dbSettings.disabled_chapters.includes(chapterName)) {
                    dbSettings.disabled_chapters.push(chapterName);
                }
            }

            await setDoc(doc(db, "config", "settings"), dbSettings);
            renderChaptersConfig();
        };

    } catch (e) {
        console.error("Erreur de rendu config chapitres :", e);
        adminChaptersList.innerHTML = '<p class="config-desc" style="color:red">Erreur lors de la récupération des chapitres.</p>';
    }
}

// Initialiser
initConfigTab();

// ============================================
// 7. IMPORTATION DES EXERCICES DEPUIS JSON
// ============================================
const triggerImportBtn = document.getElementById('triggerImportBtn');
const importExercisesInput = document.getElementById('importExercisesInput');
const importStatus = document.getElementById('importStatus');

if (triggerImportBtn && importExercisesInput) {
    triggerImportBtn.addEventListener('click', () => {
        importExercisesInput.click();
    });

    importExercisesInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        importStatus.textContent = "Lecture du fichier...";
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const exercises = Array.isArray(data) ? data : [data];
                
                importStatus.textContent = `Importation de ${exercises.length} exercice(s)...`;
                
                for (const ex of exercises) {
                    const titre = ex.titre || ex.title;
                    const courseId = ex.course_id || ex.courseId || "bureautique-3e";

                    if (!titre) {
                        throw new Error("Chaque exercice doit posséder un 'titre' (ou 'title').");
                    }

                    const docId = ex.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                    const newDoc = {
                        titre: titre,
                        course_id: courseId,
                        chapitre_id: ex.chapitre_id || ex.chapter_id || "",
                        chapitre: ex.chapitre || ex.chapter_name || "Général",
                        type: ex.type || "office",
                        enonce_md: ex.enonce_md || ex.enonce || "Consignes de l'exercice...",
                        theorie_md: ex.theorie_md || ex.theorie || "",
                        is_hidden: ex.is_hidden || false,
                        statut_aide: ex.statut_aide !== undefined ? ex.statut_aide : true
                    };
                    
                    if (ex.questions) newDoc.questions = ex.questions;
                    if (ex.indices) newDoc.indices = ex.indices;
                    if (ex.external_tools) newDoc.external_tools = ex.external_tools;
                    if (ex.submission_type) newDoc.submission_type = ex.submission_type;
                    if (ex.code_depart) newDoc.code_depart = ex.code_depart;

                    await setDoc(doc(db, "exercices", docId), newDoc, { merge: true });
                }

                importStatus.textContent = `✅ ${exercises.length} exercice(s) importé(s) avec succès !`;
                importStatus.style.color = "green";
                alert(`✅ ${exercises.length} exercices/quizz ont été importés dans la base de données Firestore !`);
                
                if (typeof renderChaptersConfig === 'function') {
                    renderChaptersConfig();
                }
            } catch (err) {
                console.error("Erreur d'import :", err);
                importStatus.textContent = "❌ Erreur d'importation.";
                importStatus.style.color = "red";
                alert(`❌ Erreur : ${err.message}`);
            }
        };
        reader.readAsText(file);
    });
}

// ============================================
// 8. CRÉATION DE COURS DEPUIS LE DASHBOARD
// ============================================
const createCourseForm = document.getElementById('createCourseForm');
const createCourseStatus = document.getElementById('createCourseStatus');

if (createCourseForm) {
    createCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('newCourseId').value.trim();
        const courseTitle = document.getElementById('newCourseTitle').value.trim();
        const enrolledText = document.getElementById('newCourseEnrolled').value.trim();
        
        if (!courseId || !courseTitle) return;
        
        const enrolled_students = enrolledText 
            ? enrolledText.split(',').map(email => email.trim()).filter(email => email.length > 0)
            : [];
            
        createCourseStatus.textContent = "Création du cours...";
        createCourseStatus.style.color = "orange";
        
        try {
            const userEmail = currentAdminUser?.email || "gatweb@gmail.com";
            
            await setDoc(doc(db, "courses", courseId), {
                id: courseId,
                title: courseTitle,
                teacher_id: userEmail,
                enrolled_students: enrolled_students
            });
            
            createCourseStatus.textContent = "✅ Cours créé avec succès !";
            createCourseStatus.style.color = "green";
            alert(`✅ Le cours "${courseTitle}" a été créé et enregistré dans Firestore !`);
            
            createCourseForm.reset();
        } catch (err) {
            console.error("Erreur de création du cours :", err);
            createCourseStatus.textContent = "❌ Erreur de création.";
            createCourseStatus.style.color = "red";
            alert(`❌ Erreur : ${err.message}`);
        }
    });
}

// ============================================
// 9. GÉNÉRATEUR DE QUIZ GOOGLE FORMS (IA)
// ============================================
const generateQuizForm = document.getElementById('generateQuizForm');
const generateQuizSubmitBtn = document.getElementById('generateQuizSubmitBtn');
const quizGenerationStatus = document.getElementById('quizGenerationStatus');
const quizResultCard = document.getElementById('quizResultCard');
const resultQuizTitle = document.getElementById('resultQuizTitle');
const quizEditLink = document.getElementById('quizEditLink');
const quizResponderLink = document.getElementById('quizResponderLink');
const quizQuestionsPreview = document.getElementById('quizQuestionsPreview');

if (generateQuizForm) {
    generateQuizForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('quizTitleInput').value.trim();
        const topic = document.getElementById('quizTopicInput').value.trim();
        const level = document.getElementById('quizLevelInput').value.trim();
        const count = parseInt(document.getElementById('quizQuestionsCount').value, 10) || 10;
        const folderId = document.getElementById('quizDriveFolderId') ? document.getElementById('quizDriveFolderId').value.trim() : '';

        if (!topic) return;

        generateQuizSubmitBtn.disabled = true;
        generateQuizSubmitBtn.innerHTML = "⏳ Génération IA & Création Google Forms...";
        quizGenerationStatus.textContent = "Génération du quiz en cours avec Gemini...";
        quizGenerationStatus.style.color = "orange";

        try {
            const quizFn = httpsCallable(functions, 'genererQuizGoogleFormsIA');
            const result = await quizFn({
                sujet: topic,
                titreQuiz: title || "Quiz Bureautique",
                niveau: level,
                nombreQuestions: count,
                folderId: folderId || undefined
            });

            const data = result.data;

            quizGenerationStatus.textContent = data.message || "✅ Quiz généré avec succès !";
            quizGenerationStatus.style.color = "green";

            // Affichage des résultats
            if (quizResultCard) {
                quizResultCard.classList.remove('hidden');

                if (resultQuizTitle) {
                    resultQuizTitle.textContent = `🎉 Quiz : ${data.quizData?.titre || title}`;
                }

                if (data.editUri) {
                    quizEditLink.href = data.editUri;
                    quizEditLink.style.display = "inline-flex";
                } else {
                    quizEditLink.style.display = "none";
                }

                if (data.responderUri) {
                    quizResponderLink.href = data.responderUri;
                    quizResponderLink.style.display = "inline-flex";
                } else {
                    quizResponderLink.style.display = "none";
                }

                // Affichage du détail des questions générées
                if (quizQuestionsPreview && data.quizData?.questions) {
                    quizQuestionsPreview.innerHTML = data.quizData.questions.map((q, idx) => `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
                            <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px;">
                                ${idx + 1}. ${q.intitule}
                            </div>
                            <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 13px; color: #475569;">
                                ${q.options.map(opt => `
                                    <li style="${opt === q.bonne_reponse ? 'font-weight: 700; color: #16a34a;' : ''}">
                                        ${opt} ${opt === q.bonne_reponse ? '✓ (Bonne réponse)' : ''}
                                    </li>
                                `).join('')}
                            </ul>
                            ${q.explication ? `<div style="font-size: 12px; color: #64748b; background: #eff6ff; padding: 6px 10px; border-radius: 6px;">💡 Feedback : ${q.explication}</div>` : ''}
                        </div>
                    `).join('');
                }
            }

        } catch (err) {
            console.error('[Quiz Generator] Erreur :', err);
            quizGenerationStatus.textContent = `❌ Erreur : ${err.message}`;
            quizGenerationStatus.style.color = "red";
        } finally {
            generateQuizSubmitBtn.disabled = false;
            generateQuizSubmitBtn.innerHTML = "🚀 Générer le QCM & Publier sur Google Forms";
        }
    });
}

// ============================================
// 10. DIAGNOSTIC CLÉ API GEMINI & MODÈLES
// ============================================
const testGeminiModelsBtn = document.getElementById('testGeminiModelsBtn');
const geminiModelsStatus = document.getElementById('geminiModelsStatus');
const geminiModelsList = document.getElementById('geminiModelsList');

if (testGeminiModelsBtn) {
    testGeminiModelsBtn.addEventListener('click', async () => {
        testGeminiModelsBtn.disabled = true;
        testGeminiModelsBtn.textContent = "⏳ Interrogation de Google AI Studio...";
        if (geminiModelsStatus) {
            geminiModelsStatus.textContent = "Connexion à l'API Gemini en cours...";
            geminiModelsStatus.style.color = "orange";
        }
        if (geminiModelsList) geminiModelsList.style.display = "none";

        try {
            const listFn = httpsCallable(functions, 'listerModelesGemini');
            const result = await listFn();
            const data = result.data;

            if (geminiModelsStatus) {
                geminiModelsStatus.textContent = `✅ Clé API Valide ! ${data.count} modèle(s) détecté(s) sur votre compte Google AI Studio :`;
                geminiModelsStatus.style.color = "green";
            }

            if (geminiModelsList && data.models) {
                geminiModelsList.style.display = "block";
                geminiModelsList.innerHTML = data.models.map(m => `
                    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #0f172a;">${m.name}</strong> 
                        ${m.displayName ? `<span style="color: #64748b;">(${m.displayName})</span>` : ''}
                        <div style="font-size: 11px; color: #475569;">${m.description || 'Pas de description'}</div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('[Diagnostic Gemini] Erreur :', err);
            if (geminiModelsStatus) {
                geminiModelsStatus.textContent = `❌ Erreur clé API : ${err.message}`;
                geminiModelsStatus.style.color = "red";
            }
        } finally {
            testGeminiModelsBtn.disabled = false;
            testGeminiModelsBtn.textContent = "🔍 Tester ma clé & Lister les modèles Gemini";
        }
    });
}

// ============================================
// 11. GESTION DES ÉLÈVES, CLASSES LIBRES & ARCHIVAGE
// ============================================
let allLoadedStudents = [];
let allKnownClasses = new Set(["3GB", "3CB", "3G1", "3G2", "3TT", "4TT", "4G1"]);

const usersTableBody = document.getElementById('usersTableBody');
const usersSearchInput = document.getElementById('usersSearchInput');
const usersClassFilter = document.getElementById('usersClassFilter');
const usersStatusFilter = document.getElementById('usersStatusFilter');
const usersStatsBadge = document.getElementById('usersStatsBadge');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const classListSuggestions = document.getElementById('classListSuggestions');

async function loadUsersData() {
    if (!usersTableBody) return;

    usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">⏳ Chargement des élèves et des classes...</td></tr>';

    try {
        const [usersSnap, subsSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "submissions"))
        ]);

        const studentMap = {};

        // 1. Charger les utilisateurs de Firestore
        usersSnap.forEach(docSnap => {
            const data = docSnap.data();
            const email = (data.email || docSnap.id).toLowerCase().trim();
            if (email && email !== ADMIN_EMAIL.toLowerCase()) {
                const classe = data.classe || data.class || '';
                if (classe) allKnownClasses.add(classe);

                studentMap[email] = {
                    id: docSnap.id,
                    email: email,
                    nom: data.nom || data.displayName || email.split('@')[0],
                    classe: classe,
                    status: data.status || 'actif', // actif ou archive
                    submissionsCount: 0
                };
            }
        });

        // 2. Détecter les élèves depuis les soumissions pour ne perdre personne
        subsSnap.forEach(docSnap => {
            const sub = docSnap.data();
            const email = (sub.email_eleve || '').toLowerCase().trim();
            if (email && email !== ADMIN_EMAIL.toLowerCase()) {
                if (!studentMap[email]) {
                    const classe = sub.classe || '';
                    if (classe) allKnownClasses.add(classe);

                    studentMap[email] = {
                        id: email,
                        email: email,
                        nom: sub.nom_eleve || email.split('@')[0],
                        classe: classe,
                        status: 'actif',
                        submissionsCount: 0
                    };
                }
                studentMap[email].submissionsCount++;
                if (!studentMap[email].classe && sub.classe) {
                    studentMap[email].classe = sub.classe;
                    allKnownClasses.add(sub.classe);
                }
            }
        });

        allLoadedStudents = Object.values(studentMap).sort((a, b) => a.nom.localeCompare(b.nom));
        updateClassDropdowns();
        renderUsersTable();

    } catch (err) {
        console.error('[Users Management] Erreur chargement :', err);
        usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:red;">❌ Erreur lors du chargement des élèves.</td></tr>';
    }
}

// Met à jour les suggestions et les sélecteurs de classes
function updateClassDropdowns() {
    // 1. Datalist pour le champ libre
    if (classListSuggestions) {
        classListSuggestions.innerHTML = Array.from(allKnownClasses).sort().map(c => `<option value="${c}">`).join('');
    }

    // 2. Filtre de classe dans la vue Élèves
    if (usersClassFilter) {
        const currentVal = usersClassFilter.value || "all";
        const sortedClasses = Array.from(allKnownClasses).sort();
        usersClassFilter.innerHTML = `
            <option value="all">📚 Toutes les classes</option>
            ${sortedClasses.map(c => `<option value="${c}" ${currentVal === c ? 'selected' : ''}>Classe ${c}</option>`).join('')}
            <option value="unassigned" ${currentVal === 'unassigned' ? 'selected' : ''}>⚠️ Non assignés</option>
        `;
    }

    // 3. Filtre de classe dans la vue Progression
    const progClassSelect = document.getElementById('progressionClassSelect');
    if (progClassSelect) {
        const currentVal = progClassSelect.value || "all";
        const sortedClasses = Array.from(allKnownClasses).sort();
        progClassSelect.innerHTML = `
            <option value="all">🏫 Toutes classes</option>
            ${sortedClasses.map(c => `<option value="${c}" ${currentVal === c ? 'selected' : ''}>Classe ${c}</option>`).join('')}
            <option value="unassigned" ${currentVal === 'unassigned' ? 'selected' : ''}>⚠️ Non assignés</option>
        `;
    }
}

function renderUsersTable() {
    if (!usersTableBody) return;

    const searchTerm = (usersSearchInput?.value || "").toLowerCase().trim();
    const classFilter = usersClassFilter?.value || "all";
    const statusFilter = usersStatusFilter?.value || "active";

    // Statistiques
    let activeCount = 0;
    let archivedCount = 0;
    const classCounts = {};

    allLoadedStudents.forEach(s => {
        if (s.status === 'archive') {
            archivedCount++;
        } else {
            activeCount++;
            const c = s.classe || 'Non assigné';
            classCounts[c] = (classCounts[c] || 0) + 1;
        }
    });

    if (usersStatsBadge) {
        const topClassesBadges = Object.entries(classCounts)
            .map(([c, cnt]) => `<span class="badge" style="background:#f1f5f9; color:#334155; padding:4px 8px;">${c}: ${cnt}</span>`)
            .join(' ');

        usersStatsBadge.innerHTML = `
            <span class="badge" style="background:#dcfce7; color:#15803d; padding:4px 8px;">🟢 ${activeCount} Actifs</span>
            ${archivedCount > 0 ? `<span class="badge" style="background:#fef3c7; color:#b45309; padding:4px 8px;">📦 ${archivedCount} Archivés</span>` : ''}
            ${topClassesBadges}
        `;
    }

    // Filtrage
    const filtered = allLoadedStudents.filter(s => {
        const matchesSearch = s.nom.toLowerCase().includes(searchTerm) || s.email.toLowerCase().includes(searchTerm) || (s.classe && s.classe.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;

        // Filtre de statut
        if (statusFilter === "active" && s.status === 'archive') return false;
        if (statusFilter === "archived" && s.status !== 'archive') return false;

        // Filtre de classe
        if (classFilter === "all") return true;
        if (classFilter === "unassigned") return !s.classe;
        return s.classe === classFilter;
    });

    if (filtered.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Aucun élève ne correspond aux critères de filtre.</td></tr>';
        return;
    }

    usersTableBody.innerHTML = filtered.map(s => {
        const safeEmailKey = encodeURIComponent(s.email);
        const isArchived = s.status === 'archive';

        return `
            <tr id="user-row-${safeEmailKey}" style="${isArchived ? 'opacity: 0.75; background: #fafafa;' : ''}">
                <td>
                    <div style="font-weight: 700; color: #0f172a;">${s.nom}</div>
                </td>
                <td style="color: #64748b; font-family: monospace; font-size: 13px;">
                    ${s.email}
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <input 
                            type="text" 
                            list="classListSuggestions" 
                            value="${s.classe || ''}" 
                            placeholder="Ex: 3GB, 3CB..." 
                            class="md-input" 
                            style="padding: 6px 10px; font-size: 13px; font-weight: 700; width: 110px; text-transform: uppercase;" 
                            onchange="saveStudentClass('${s.email}', this.value)"
                        />
                        <span id="save-status-${safeEmailKey}" style="font-size: 11px; color: green;"></span>
                    </div>
                </td>
                <td>
                    <select class="class-select-dropdown" style="padding: 4px 8px; font-size: 12px;" onchange="saveStudentStatus('${s.email}', this.value)">
                        <option value="actif" ${!isArchived ? 'selected' : ''}>🟢 Actif</option>
                        <option value="archive" ${isArchived ? 'selected' : ''}>📦 Archivé</option>
                    </select>
                </td>
                <td style="text-align: center;">
                    <span class="badge" style="background:#f1f5f9; color:#475569;">
                        ${s.submissionsCount} copie${s.submissionsCount > 1 ? 's' : ''}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div style="display:flex; gap:6px; justify-content: flex-end;">
                        <button class="btn-action-icon" title="Télécharger le dossier complet des travaux" onclick="downloadStudentDossier('${s.email}', '${s.nom}', '${s.classe || ''}')" style="background: #e0f2fe; color: #0369a1; border:none; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;">
                            📦 Télécharger dossier
                        </button>
                        <button class="btn-danger-icon" title="Supprimer cet élève" onclick="confirmDeleteStudent('${s.email}', '${s.nom}', '${s.classe || ''}')">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Fonction de sauvegarde de la classe
window.saveStudentClass = async (email, newClass) => {
    const safeEmailKey = encodeURIComponent(email);
    const statusEl = document.getElementById(`save-status-${safeEmailKey}`);
    if (statusEl) statusEl.textContent = "⏳...";

    const cleanClass = (newClass || '').trim().toUpperCase();

    try {
        await setDoc(doc(db, "users", email), {
            email: email,
            classe: cleanClass,
            role: "eleve",
            date_update: new Date().toISOString()
        }, { merge: true });

        const student = allLoadedStudents.find(s => s.email === email);
        if (student) student.classe = cleanClass;

        if (cleanClass) allKnownClasses.add(cleanClass);
        updateClassDropdowns();

        if (statusEl) {
            statusEl.textContent = "✓";
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
        }

    } catch (err) {
        console.error("Erreur mise à jour classe :", err);
        if (statusEl) statusEl.textContent = "❌";
    }
};

// Fonction de sauvegarde du statut (Actif / Archivé)
window.saveStudentStatus = async (email, newStatus) => {
    try {
        await setDoc(doc(db, "users", email), {
            email: email,
            status: newStatus,
            date_update: new Date().toISOString()
        }, { merge: true });

        const student = allLoadedStudents.find(s => s.email === email);
        if (student) student.status = newStatus;

        renderUsersTable();

    } catch (err) {
        console.error("Erreur mise à jour statut :", err);
        alert("Erreur lors de la mise à jour du statut.");
    }
};

// 📦 TÉLÉCHARGER LE DOSSIER COMPLET DES TRAVAUX D'UN ÉLÈVE (Export HTML & Markdown)
window.downloadStudentDossier = async (email, nom, classe) => {
    try {
        const qSubs = query(collection(db, "submissions"), where("email_eleve", "==", email));
        const subsSnap = await getDocs(qSubs);
        const submissions = [];

        subsSnap.forEach(docSnap => {
            submissions.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Trier par date
        submissions.sort((a, b) => new Date(a.date_soumission || 0) - new Date(b.date_soumission || 0));

        const exportDate = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Génération du contenu HTML formaté et imprimable
        const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Dossier d'apprentissage — ${nom} (${classe || 'Classe non assignée'})</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 40px; margin: 0; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0 0 10px 0; color: #0f172a; }
        .meta-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-right: 8px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        .summary-table th, .summary-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        .summary-table th { background: #f1f5f9; font-weight: 700; }
        .badge-success { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
        .badge-waiting { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
        .work-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; background: #ffffff; }
        .work-card-header { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 14px; font-weight: 700; }
        pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
        .feedback-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; margin-top: 14px; border-radius: 0 8px 8px 0; }
        @media print { body { background: white; padding: 0; } .container { box-shadow: none; padding: 0; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📁 Dossier d'Apprentissage & Travaux Élève</h1>
            <div>
                <span class="meta-tag">👤 ${nom}</span>
                <span class="meta-tag">✉️ ${email}</span>
                <span class="meta-tag">🏫 Classe : ${classe || 'Non assignée'}</span>
                <span class="meta-tag">📅 Exporté le : ${exportDate}</span>
            </div>
        </div>

        <h2>📊 Synthèse des Travaux (${submissions.length} au total)</h2>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Activité / Module</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Note / Score</th>
                </tr>
            </thead>
            <tbody>
                ${submissions.map((sub, idx) => `
                    <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${sub.titre_exercice || 'Exercice'}</strong></td>
                        <td>${sub.date_soumission ? new Date(sub.date_soumission).toLocaleDateString('fr-FR') : '-'}</td>
                        <td><span class="${sub.status === 'valide' ? 'badge-success' : 'badge-waiting'}">${sub.status === 'valide' ? 'Validé' : 'En attente'}</span></td>
                        <td><strong>${sub.note_suggeree !== undefined ? sub.note_suggeree + '/100' : '-'}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>📝 Détail exhaustif des soumissions</h2>
        ${submissions.map((sub, idx) => `
            <div class="work-card">
                <div class="work-card-header">
                    <span>${idx + 1}. ${sub.titre_exercice || 'Exercice'} (${sub.type || 'standard'})</span>
                    <span>Note : ${sub.note_suggeree !== undefined ? sub.note_suggeree + '/100' : 'Non noté'}</span>
                </div>
                <div>
                    <strong>Contenu soumis / Code élève :</strong>
                    <pre>${escapeHtml(sub.code_eleve || sub.code_html || 'Aucun contenu textuel')}</pre>
                </div>
                ${sub.feedback_ia ? `
                    <div class="feedback-box">
                        <strong>🤖 Évaluation du Tuteur IA :</strong>
                        <p style="margin: 6px 0 0 0;">${escapeHtml(sub.feedback_ia)}</p>
                    </div>
                ` : ''}
                ${sub.prof_message ? `
                    <div class="feedback-box" style="background:#f0fdf4; border-left-color:#22c55e;">
                        <strong>🧑‍🏫 Commentaire de l'enseignant :</strong>
                        <p style="margin: 6px 0 0 0;">${escapeHtml(sub.prof_message)}</p>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

        // Déclencher le téléchargement du fichier HTML dans le navigateur
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = nom.replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeClass = (classe || 'SansClasse').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.href = url;
        a.download = `Dossier_Travaux_${safeName}_${safeClass}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;

    } catch (err) {
        console.error("Erreur lors de l'export des travaux :", err);
        alert("Erreur lors du téléchargement des travaux de l'élève.");
        return false;
    }
};

// Suppression avec proposition de téléchargement préalable
window.confirmDeleteStudent = async (email, nom, classe) => {
    const choice = confirm(
        `⚠️ Vous allez supprimer l'élève ${nom} (${email}).\n\n` +
        `💡 Souhaitez-vous d'abord TÉLÉCHARGER le dossier complet de tous ses travaux avant de supprimer son profil ?\n\n` +
        `• Cliquez sur [OK] pour télécharger le dossier puis supprimer\n` +
        `• Cliquez sur [Annuler] si vous voulez abandonner ou l'archiver à la place`
    );

    if (!choice) return;

    // 1. Télécharger les travaux
    await window.downloadStudentDossier(email, nom, classe);

    // 2. Confirmation finale de suppression
    if (!confirm(`Le dossier a été téléchargé. Confirmez-vous la suppression définitive du compte de ${nom} de la base ?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "users", email));
        allLoadedStudents = allLoadedStudents.filter(s => s.email !== email);
        renderUsersTable();
    } catch (err) {
        console.error("Erreur suppression :", err);
        alert("Erreur lors de la suppression.");
    }
};

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Écouteurs de recherche et filtres
if (usersSearchInput) {
    usersSearchInput.addEventListener('input', renderUsersTable);
}
if (usersClassFilter) {
    usersClassFilter.addEventListener('change', renderUsersTable);
}
if (usersStatusFilter) {
    usersStatusFilter.addEventListener('change', renderUsersTable);
}
if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', loadUsersData);
}

// Exposer globalement pour l'activation d'onglet
window.loadUsersManagement = loadUsersData;


