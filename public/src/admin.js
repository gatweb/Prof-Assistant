import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { getSubmissionsToGrade, updateSubmissionStatus, generateMockSubmissions, generateMockCourses, db } from './firebase/db.js';
import { functions } from './firebase/config.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";
import { formatDate } from './utils.js';
import { doc, onSnapshot, collection, addDoc, query, where, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ============================================
// 1. Contrôle d'accès strict
// ============================================
const ADMIN_EMAIL = "gatweb@gmail.com";
let currentAdminUser = null;

// Écoute de l'état asynchrone (s'exécute au chargement)
listenToAuthStatus((user) => {
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
// 2. Gestion de la Vue Liste
// ============================================
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const tbody = document.getElementById('submissionsTableBody');

let currentCopies = [];
let currentViewingCopyId = null;

async function loadSubmissionsList() {
    try {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-16">Chargement des copies...</td></tr>';
        
        // Branchement temps réel (onSnapshot) pour voir les copies arriver en direct
        const q = query(collection(db, "submissions"), where("status", "==", "a_valider"));
        
        onSnapshot(q, (snapshot) => {
            currentCopies = [];
            snapshot.forEach((doc) => {
                currentCopies.push({ id: doc.id, ...doc.data() });
            });

            if (currentCopies.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-16">🎉 Aucune copie en attente !</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            // Tri par date de soumission (plus récent en haut)
            const sortedCopies = [...currentCopies].sort((a,b) => new Date(b.date_soumission) - new Date(a.date_soumission));
            
            sortedCopies.forEach(copy => {
                const tr = document.createElement('tr');
                
                const dateStr = formatDate(copy.date_soumission);

                tr.innerHTML = `
                    <td><strong>${copy.nom_eleve || "Anonyme"}</strong></td>
                    <td>${copy.titre_exercice || "-"}</td>
                    <td>${dateStr}</td>
                    <td><button class="btn-primary btn-sm" onclick="window.openDetailView('${copy.id}')">Ouvrir</button></td>
                `;
                tbody.appendChild(tr);
            });
        });
    } catch (e) {
        console.error("ERREUR FIRESTORE DETAIL :", e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-16" style="color:#ba1a1a">❌ Erreur de connexion Firestore (${e.message || e}).</td></tr>`;
    }
}

// Fonction globale injectée pour le onclick HTML
// Variable globale pour suivre d'où on vient avant d'ouvrir le détail
window.lastViewBeforeDetail = 'listView';

// Fonction globale injectée pour le onclick HTML
window.openDetailView = (id) => {
    const copy = currentCopies.find(c => c.id === id);
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
    
    // Injection du code dans Monaco
    const codeData = copy.code_eleve || "// Aucun code n'a été fourni";
    if (monacoEditorInstance) {
        monacoEditorInstance.setValue(codeData);
    } else {
        pendingCodeToSet = codeData;
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
// 5. Actions Métier (Boutons Validation)
// ============================================
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
    const copy  = currentCopies.find(c => c.id === currentViewingCopyId);
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
        // Récupérer tous les exercices pour extraire la liste unique des chapitres
        const exsSnap = await getDocs(collection(db, "exercices"));
        const chaptersSet = new Set();
        
        // Liste ordonnée de référence pour les chapitres standard
        const orderedChapters = [
            "HTML & CSS",
            "CH1 — Introduction à JavaScript",
            "CH2 — Variables, types et opérateurs",
            "CH3 — Entrées / Sorties interactives",
            "CH4 — Chaînes de caractères",
            "CH5 — Conditions",
            "CH6 — Boucles",
            "CH7 — Structures combinées",
            "CH8 — Fonctions prédéfinies",
            "CH9 — Algorithmes",
            "CH10 — Projets"
        ];

        exsSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.chapitre) {
                chaptersSet.add(data.chapitre);
            }
        });

        // Convertir en tableau et trier selon orderedChapters ou alphabétiquement
        const sortedChapters = Array.from(chaptersSet).sort((a, b) => {
            const idxA = orderedChapters.indexOf(a);
            const idxB = orderedChapters.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        if (sortedChapters.length === 0) {
            adminChaptersList.innerHTML = '<p class="config-desc">Aucun chapitre trouvé dans les exercices.</p>';
            return;
        }

        adminChaptersList.innerHTML = sortedChapters.map(ch => {
            const isDisabled = dbSettings.disabled_chapters.includes(ch);
            // Si le chapitre n'est pas désactivé, il est "actif" donc coché
            const isChecked = !isDisabled;

            return `
                <div class="chapter-config-item">
                    <label class="checkbox-container">
                        <input type="checkbox" data-chapter="${ch}" ${isChecked ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        <span class="chapter-name-label">${ch}</span>
                    </label>
                </div>
            `;
        }).join('');

        // Attacher les écouteurs sur les cases à cocher
        adminChaptersList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const chapterName = checkbox.getAttribute('data-chapter');
                const isChecked = checkbox.checked;

                if (isChecked) {
                    // Retirer de la liste des désactivés
                    dbSettings.disabled_chapters = dbSettings.disabled_chapters.filter(ch => ch !== chapterName);
                } else {
                    // Ajouter à la liste des désactivés
                    if (!dbSettings.disabled_chapters.includes(chapterName)) {
                        dbSettings.disabled_chapters.push(chapterName);
                    }
                }

                await setDoc(doc(db, "config", "settings"), dbSettings);
            });
        });

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
                    if (!ex.title || !ex.course_id) {
                        throw new Error("Chaque exercice doit posséder un 'title' et un 'course_id'.");
                    }

                    const newDoc = {
                        titre: ex.title,
                        course_id: ex.course_id,
                        chapitre_id: ex.chapter_id || "",
                        chapitre: ex.chapter_name || "Général",
                        type: ex.type || "code",
                        enonce_md: ex.enonce_md || "Réponds aux questions ci-dessous.",
                        theorie_md: ex.theorie_md || "",
                        is_hidden: false,
                        statut_aide: true
                    };
                    
                    if (ex.questions) newDoc.questions = ex.questions;
                    if (ex.indices) newDoc.indices = ex.indices;

                    await addDoc(collection(db, "exercices"), newDoc);
                }

                importStatus.textContent = "✅ Importation réussie !";
                importStatus.style.color = "green";
                alert("✅ Les exercices ont été importés dans la base de données Firestore !");
                
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


