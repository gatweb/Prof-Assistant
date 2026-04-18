import { listenToAuthStatus, logoutUser } from './firebase/auth.js';
import { getSubmissionsToGrade, updateSubmissionStatus, generateMockSubmissions, generateMockCourses, db } from './firebase/db.js';
import { formatDate } from './utils.js';
import { doc, onSnapshot, collection, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
        window.location.href = "workspace.html";
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
window.openDetailView = (id) => {
    const copy = currentCopies.find(c => c.id === id);
    if (!copy) return;
    
    currentViewingCopyId = id;

    // Transition d'UI
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');

    // Injection des données
    document.getElementById('detailStudentName').textContent = "Copie de : " + (copy.nom_eleve || "Anonyme");
    document.getElementById('detailExerciseName').textContent = copy.titre_exercice || "Exercice Inconnu";
    document.getElementById('feedbackIaInput').value = copy.feedback_ia || "";
    document.getElementById('scoreInput').value = copy.note_suggeree || 0;
    
    // Statistiques d'autonomie (indices utilisés + questions libres)
    const indices = copy.indices_utilises || {};
    document.getElementById('statNiv1').textContent     = indices.niv1 || 0;
    document.getElementById('statNiv2').textContent     = indices.niv2 || 0;
    document.getElementById('statNiv3').textContent     = indices.niv3 || 0;
    document.getElementById('statQuestions').textContent = copy.questions_libres || 0;
    
    // Injection du code dans Monaco
    const codeData = copy.code_eleve || "// Aucun code n'a été fourni";
    if (monacoEditorInstance) {
        monacoEditorInstance.setValue(codeData);
    } else {
        pendingCodeToSet = codeData;
    }
};

document.getElementById('backToListBtn').addEventListener('click', () => {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    currentViewingCopyId = null;
});

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

document.addEventListener('monacoReady', () => {
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
});

// ============================================
// 5. Actions Métier (Boutons Validation)
// ============================================
document.getElementById('approveBtn').addEventListener('click', async () => {
    await processAction("publie");
});

document.getElementById('rejectBtn').addEventListener('click', async () => {
    await processAction("brouillon");
});

async function processAction(newStatus) {
    if (!currentViewingCopyId) return;

    // Récupération des valeurs potentiellement modifiées par le prof
    const feedback = document.getElementById('feedbackIaInput').value;
    const note = document.getElementById('scoreInput').value;

    try {
        await updateSubmissionStatus(currentViewingCopyId, newStatus, feedback, Number(note));
        
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
        currentViewingCopyId = null;
        
        // Rafraîchir pour faire disparaître l'item validé du dashboard
        await loadSubmissionsList();
    } catch (e) {
        console.error("Erreur lors de la validation", e);
        alert("Erreur réseau lors de la mise à jour du statut dans Firestore.");
    }
}
