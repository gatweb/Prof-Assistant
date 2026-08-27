import { getAllExercises, getAllSubmissions, db } from './firebase/db.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/**
 * MODULE : Suivi de Progression Matrix
 * Gère l'affichage de la grille élève x exercice et les statistiques par chapitre.
 */

class ProgressionManager {
    constructor() {
        this.exercices = [];
        this.submissions = [];
        this.examResults = {}; // { email: examResultData }
        this.students = []; // { email, nom, submissions: { exId: sub } }
        this.chapters = {}; // { name: [exIds] }
        this.isFilterActive = false;

        this.initUI();
    }

    initUI() {
        this.matrixContainer = document.getElementById('progressionMatrix');
        this.filterBtn = document.getElementById('filterToGradeBtn');
        this.exportBtn = document.getElementById('exportCsvBtn');
        this.refreshBtn = document.getElementById('refreshProgressionBtn');
        this.courseSelect = document.getElementById('progressionCourseSelect');
        this.searchInput = document.getElementById('progressionSearchInput');
        this.statsSummary = document.getElementById('progressionStatsSummary');
        this.modal = document.getElementById('chapterModal');
        this.closeModalBtn = this.modal?.querySelector('.close-modal');

        this.initTabs();

        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', () => {
                this.isFilterActive = !this.isFilterActive;
                this.filterBtn.classList.toggle('active', this.isFilterActive);
                this.filterBtn.style.backgroundColor = this.isFilterActive ? 'var(--md-sys-color-primary-container)' : '';
                this.renderMatrix();
            });
        }

        if (this.courseSelect) {
            this.courseSelect.addEventListener('change', () => {
                this.processData();
                this.renderMatrix();
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.renderMatrix();
            });
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportToCSV());
        }

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadData());
        }

        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.modal.classList.add('hidden'));
        }

        // Close modal on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.modal.classList.add('hidden');
            }
        });
    }

    initTabs() {
        const tabLinks = document.querySelectorAll('.tab-link');
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetId = link.getAttribute('data-target');
                
                // Toggle active class on buttons
                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Toggle visibility of all main containers
                document.querySelectorAll('main.admin-container').forEach(view => {
                    view.classList.add('hidden');
                });
                
                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.classList.remove('hidden');
                }

                if (targetId === 'progressionView') {
                    this.loadData();
                }
            });
        });
    }

    async loadData() {
        this.matrixContainer.innerHTML = '<div class="loader-placeholder">Chargement des données en cours...</div>';
        
        try {
            const [exs, subs, examResultsSnap] = await Promise.all([
                getAllExercises(),
                getAllSubmissions(),
                getDocs(collection(db, "exam_results"))
            ]);

            this.exercices = exs;
            this.submissions = subs;
            this.examResultsSnap = examResultsSnap;

            this.processData();
            this.renderMatrix();
        } catch (error) {
            console.error("Erreur chargement progression:", error);
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Erreur lors du chargement des données.</div>';
        }
    }

    processData() {
        const selectedCourse = this.courseSelect?.value || "all";

        // Filtrer les exercices selon le cours choisi
        let filteredExercises = this.exercices;
        if (selectedCourse !== "all") {
            filteredExercises = this.exercices.filter(ex => {
                const cId = (ex.course_id || "").toLowerCase();
                const ch = (ex.chapitre || "").toLowerCase();
                const id = (ex.id || "").toLowerCase();

                if (selectedCourse === "bureautique-3e") {
                    return cId.includes("bureautique") || ch.includes("bureautique") || ch.includes("drive") || ch.includes("docs") || id.startsWith("bur-");
                }
                if (selectedCourse === "dactylo-3e") {
                    return cId.includes("dactylo") || ch.includes("dactylo") || ch.includes("ligne de base") || ch.includes("ligne supérieure") || ch.includes("ligne inférieure") || id.startsWith("dac-");
                }
                if (selectedCourse === "creation-site-web") {
                    return cId.includes("site-web") || cId.includes("html") || ch.includes("html") || ch.includes("css") || id.startsWith("uaa3-");
                }
                if (selectedCourse === "js-uaa5-classic") {
                    return cId.includes("js") || cId.includes("uaa5") || ch.includes("js") || ch.includes("boucle") || ch.includes("fonction") || id.startsWith("uaa5-");
                }
                if (selectedCourse === "studio-creatif") {
                    return cId.includes("studio") || ch.includes("studio") || id.startsWith("studio-");
                }
                return cId === selectedCourse;
            });
        }

        // 1. Grouper les exercices par chapitre
        this.chapters = {};
        filteredExercises.forEach(ex => {
            const ch = ex.chapitre || "Général";
            if (!this.chapters[ch]) this.chapters[ch] = [];
            this.chapters[ch].push(ex);
        });

        // 1.5 Extraire les résultats d'examen par email
        this.examResults = {};
        if (this.examResultsSnap) {
            this.examResultsSnap.forEach(docSnap => {
                const res = docSnap.data();
                const email = res.email_eleve || "anonyme@test.com";
                // Conserver le résultat le plus récent
                const existing = this.examResults[email];
                if (!existing || new Date(res.date) > new Date(existing.date)) {
                    this.examResults[email] = res;
                }
            });
        }

        // 2. Extraire la liste unique des élèves et mapper leurs soumissions
        const studentMap = {};
        this.submissions.forEach(sub => {
            const email = sub.email_eleve || "anonyme@test.com";
            if (!studentMap[email]) {
                studentMap[email] = {
                    email: email,
                    nom: sub.nom_eleve || email.split('@')[0],
                    submissions: {},
                    hasAwaiting: false
                };
            }
            
            // On garde la soumission la plus récente pour cet exercice
            const exId = sub.exercice_id || sub.id_exercice;
            if (exId) {
                const existing = studentMap[email].submissions[exId];
                if (!existing || new Date(sub.date_soumission) > new Date(existing.date_soumission)) {
                    studentMap[email].submissions[exId] = sub;
                }
                if (sub.status === 'a_valider') studentMap[email].hasAwaiting = true;
            }
        });

        // Inclure également les élèves ayant uniquement passé l'examen
        Object.keys(this.examResults).forEach(email => {
            if (!studentMap[email]) {
                const res = this.examResults[email];
                studentMap[email] = {
                    email: email,
                    nom: res.nom_eleve || email.split('@')[0],
                    submissions: {},
                    hasAwaiting: false
                };
            }
        });

        this.students = Object.values(studentMap).sort((a,b) => a.nom.localeCompare(b.nom));
    }

    calculateScore(sub) {
        if (!sub) return null;
        if (sub.note_suggeree !== undefined && sub.status === 'valide') return sub.note_suggeree;

        // Formule d'autonomie : 100 - (N1*10) - (N2*20) - (N3*30)
        const hints = sub.indices_utilises || {};
        const n1 = hints.niv1 || 0;
        const n2 = hints.niv2 || 0;
        const n3 = hints.niv3 || 0;
        
        const score = 100 - (n1 * 10) - (n2 * 20) - (n3 * 30);
        return Math.max(0, score); // Pas de score négatif
    }

    renderMatrix() {
        let displayStudents = this.students;

        // Filtre par recherche élève ou classe
        const searchTerm = (this.searchInput?.value || "").toLowerCase().trim();
        if (searchTerm) {
            displayStudents = displayStudents.filter(s => 
                s.nom.toLowerCase().includes(searchTerm) || 
                s.email.toLowerCase().includes(searchTerm)
            );
        }

        // Filtre des copies en attente
        if (this.isFilterActive) {
            displayStudents = displayStudents.filter(s => s.hasAwaiting);
        }

        // Calcul des statistiques globales pour le bandeau
        let totalValidatedScores = 0;
        let countValidated = 0;
        let awaitingCount = 0;

        displayStudents.forEach(s => {
            if (s.hasAwaiting) awaitingCount++;
            Object.values(s.submissions).forEach(sub => {
                if (sub.status === 'valide' && sub.note_suggeree !== undefined) {
                    totalValidatedScores += Number(sub.note_suggeree);
                    countValidated++;
                }
            });
        });

        const overallAvg = countValidated > 0 ? Math.round(totalValidatedScores / countValidated) : "--";

        if (this.statsSummary) {
            this.statsSummary.innerHTML = `
                <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:12px;padding:4px 10px;">👥 ${displayStudents.length} Élève${displayStudents.length > 1 ? 's' : ''}</span>
                <span class="badge" style="background:#dcfce7;color:#15803d;font-size:12px;padding:4px 10px;">📊 Moyenne : ${overallAvg}${overallAvg !== '--' ? '%' : ''}</span>
                <span class="badge" style="background:#fef3c7;color:#b45309;font-size:12px;padding:4px 10px;">⏳ ${awaitingCount} en attente</span>
            `;
        }

        const totalExercises = Object.values(this.chapters).reduce((acc, curr) => acc + curr.length, 0);

        if (totalExercises === 0) {
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Aucun exercice pour ce cours dans la base de données.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'progression-table';

        // --- THEAD : Chapitres ---
        const head = document.createElement('thead');
        const rowChapters = document.createElement('tr');
        
        // Header vide (coin haut gauche)
        const cornerHeader = document.createElement('th');
        cornerHeader.className = 'sticky-col';
        cornerHeader.rowSpan = 2;
        cornerHeader.textContent = "Élèves";
        rowChapters.appendChild(cornerHeader);

        // Header Moyenne
        const avgHead = document.createElement('th');
        avgHead.rowSpan = 2;
        avgHead.className = 'avg-col';
        avgHead.textContent = "Moyenne";
        rowChapters.appendChild(avgHead);

        // Header Examen
        const examHead = document.createElement('th');
        examHead.rowSpan = 2;
        examHead.className = 'exam-col-header';
        examHead.textContent = "Examen (Quiz)";
        rowChapters.appendChild(examHead);

        for (const [chapterName, exercises] of Object.entries(this.chapters)) {
            const th = document.createElement('th');
            th.className = 'chapter-header';
            th.textContent = chapterName;
            th.colSpan = exercises.length;
            th.addEventListener('click', () => this.showChapterStats(chapterName, exercises));
            rowChapters.appendChild(th);
        }
        head.appendChild(rowChapters);

        // --- THEAD : Exercices ---
        const rowExs = document.createElement('tr');
        for (const exercises of Object.values(this.chapters)) {
            exercises.forEach(ex => {
                const th = document.createElement('th');
                th.textContent = ex.titre;
                th.title = ex.titre;
                rowExs.appendChild(th);
            });
        }
        head.appendChild(rowExs);
        table.appendChild(head);

        // --- TBODY : Élèves ---
        const body = document.createElement('tbody');
        displayStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.className = 'student-row';

            // Nom de l'élève (Sticky)
            const tdName = document.createElement('td');
            tdName.className = 'sticky-col';
            tdName.innerHTML = `<strong>${student.nom}</strong><br><small>${student.email}</small>`;
            tr.appendChild(tdName);

            // Calcul de la moyenne globale pour cet élève
            let totalScore = 0;
            let countScores = 0;
            const scoreCells = [];

            // Cellules d'exercices
            for (const exercises of Object.values(this.chapters)) {
                exercises.forEach(ex => {
                    const sub = student.submissions[ex.id];
                    const td = document.createElement('td');
                    
                    if (sub) {
                        const score = this.calculateScore(sub);
                        const status = sub.status || 'brouillon';
                        
                        td.innerHTML = `
                            <div class="status-cell" style="cursor: pointer;" title="Cliquer pour voir le détail de l'exercice">
                                <div class="status-dot ${status}">
                                    ${this.getStatusIcon(status)}
                                </div>
                                <span class="note-badge">${score}/100</span>
                            </div>
                        `;
                        td.addEventListener('click', () => {
                            if (window.openDetailViewFromMatrix) {
                                window.openDetailViewFromMatrix(sub);
                            }
                        });

                        if (status === 'valide' || status === 'publie') {
                            totalScore += score;
                            countScores++;
                        }
                    } else {
                        td.innerHTML = '<span style="color:#ccc">--</span>';
                    }
                    scoreCells.push(td);
                });
            }

            // Moyenne Globale
            const tdAvg = document.createElement('td');
            tdAvg.className = 'avg-col';
            if (countScores > 0) {
                const avg = Math.round(totalScore / countScores);
                tdAvg.textContent = `${avg}%`;
                // Coloration selon réussite
                if (avg >= 80) tdAvg.style.color = '#2e7d32';
                else if (avg < 50) tdAvg.style.color = '#c62828';
            } else {
                tdAvg.textContent = '--';
            }
            tr.appendChild(tdAvg);

            // Cellule Examen
            const tdExam = document.createElement('td');
            tdExam.className = 'exam-col';
            const examRes = this.examResults[student.email];
            if (examRes) {
                tdExam.innerHTML = `
                    <div class="exam-status-cell">
                        <span class="note-badge exam-badge-result" style="font-weight:600;">${examRes.score}/${examRes.total}</span>
                        <span class="exam-pct-badge" style="font-size:10px;color:#64748b;display:block;">${examRes.pct}%</span>
                    </div>
                `;
                // Coloration
                if (examRes.pct >= 80) tdExam.style.color = '#2e7d32';
                else if (examRes.pct < 50) tdExam.style.color = '#c62828';
            } else {
                tdExam.innerHTML = '<span style="color:#ccc">--</span>';
            }
            tr.appendChild(tdExam);

            // Ajouter les cellules d'exercices après la moyenne et l'examen
            scoreCells.forEach(c => tr.appendChild(c));
            
            body.appendChild(tr);
        });

        table.appendChild(body);
        this.matrixContainer.innerHTML = '';
        this.matrixContainer.appendChild(table);
    }

    getStatusIcon(status) {
        switch(status) {
            case 'valide': return '✓';
            case 'publie': return '✓';
            case 'a_valider': return '⏳';
            case 'en_cours': return '✎';
            case 'brouillon': return '○';
            default: return '';
        }
    }

    showChapterStats(chapterName, exercises) {
        const titleEl = document.getElementById('modalChapterTitle');
        const rateEl = document.getElementById('chapterSuccessRate');
        const errorsEl = document.getElementById('chapterTopErrors');

        titleEl.textContent = `Stats : ${chapterName}`;
        
        // Calculer taux de réussite pour le chapitre
        let totalValide = 0;
        let totalPossible = this.students.length * exercises.length;
        let errorsCloud = {};

        this.students.forEach(s => {
            exercises.forEach(ex => {
                const sub = s.submissions[ex.id];
                if (sub && (sub.status === 'valide' || sub.status === 'publie')) {
                    totalValide++;
                }
                // Récupérer les erreurs détectées par l'IA
                if (sub && sub.erreurs_detectees) {
                    sub.erreurs_detectees.forEach(err => {
                        errorsCloud[err] = (errorsCloud[err] || 0) + 1;
                    });
                }
            });
        });

        const rate = totalPossible > 0 ? Math.round((totalValide / totalPossible) * 100) : 0;
        rateEl.textContent = `${rate}%`;

        // Afficher les erreurs
        errorsEl.innerHTML = '';
        const sortedErrors = Object.entries(errorsCloud).sort((a,b) => b[1] - a[1]).slice(0, 5);
        
        if (sortedErrors.length === 0) {
            errorsEl.innerHTML = '<span class="subtitle">Aucune erreur récurrente détectée.</span>';
        } else {
            sortedErrors.forEach(([err, count]) => {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.style.backgroundColor = 'var(--md-sys-color-error)';
                badge.style.color = 'white';
                badge.textContent = `${err} (${count})`;
                errorsEl.appendChild(badge);
            });
        }

        this.modal.classList.remove('hidden');
    }

    exportToCSV() {
        if (this.students.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }

        // En-têtes CSV
        const headers = ["Nom", "Email", "Moyenne Exercices (%)", "Note Examen (Points)", "Score Examen (%)"];
        
        // Liste ordonnée d'exercices pour le CSV
        const exercisesList = [];
        for (const exercises of Object.values(this.chapters)) {
            exercises.forEach(ex => {
                headers.push(ex.titre);
                exercisesList.push(ex.id);
            });
        }

        // Lignes du CSV
        const rows = [headers];

        this.students.forEach(student => {
            // Calculer la moyenne
            let totalScore = 0;
            let countScores = 0;
            const exScores = [];

            exercisesList.forEach(exId => {
                const sub = student.submissions[exId];
                if (sub) {
                    const score = this.calculateScore(sub);
                    const status = sub.status || "brouillon";
                    if (status === 'valide' || status === 'publie') {
                        exScores.push(`${score}/100`);
                        totalScore += score;
                        countScores++;
                    } else {
                        exScores.push(`${status} (${score}/100)`);
                    }
                } else {
                    exScores.push("--");
                }
            });

            const avg = countScores > 0 ? Math.round(totalScore / countScores) : "";
            
            // Note Examen
            const examRes = this.examResults[student.email];
            const examScoreStr = examRes ? `${examRes.score}/${examRes.total}` : "";
            const examPctStr = examRes ? `${examRes.pct}%` : "";

            const row = [
                student.nom,
                student.email,
                avg ? `${avg}%` : "--",
                examScoreStr || "--",
                examPctStr || "--",
                ...exScores
            ];
            rows.push(row);
        });

        // Formater en CSV (délimiteur ';' pour Excel en français)
        const csvContent = "\uFEFF" + rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `notes_classe_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    window.progressionManager = new ProgressionManager();
});
