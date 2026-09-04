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
        this.viewMode = 'summary'; // 'summary' | 'detailed'
        this.expandedChapters = new Set();
        this.quickFilter = 'all'; // 'all' | 'help' | 'awaiting' | 'inactive'

        this.initUI();
    }

    initUI() {
        this.matrixContainer = document.getElementById('progressionMatrix');
        this.filterBtn = document.getElementById('filterToGradeBtn');
        this.exportBtn = document.getElementById('exportCsvBtn');
        this.refreshBtn = document.getElementById('refreshProgressionBtn');
        this.courseSelect = document.getElementById('progressionCourseSelect');
        this.classSelect = document.getElementById('progressionClassSelect');
        this.searchInput = document.getElementById('progressionSearchInput');
        this.statsSummary = document.getElementById('progressionStatsSummary');
        this.modal = document.getElementById('chapterModal');
        this.closeModalBtn = this.modal?.querySelector('.close-modal');

        this.viewSummaryBtn = document.getElementById('viewSummaryBtn');
        this.viewDetailedBtn = document.getElementById('viewDetailedBtn');

        this.initTabs();

        if (this.viewSummaryBtn && this.viewDetailedBtn) {
            this.viewSummaryBtn.addEventListener('click', () => {
                this.viewMode = 'summary';
                this.viewSummaryBtn.classList.add('active');
                this.viewDetailedBtn.classList.remove('active');
                this.expandedChapters.clear();
                this.renderMatrix();
            });
            this.viewDetailedBtn.addEventListener('click', () => {
                this.viewMode = 'detailed';
                this.viewDetailedBtn.classList.add('active');
                this.viewSummaryBtn.classList.remove('active');
                this.renderMatrix();
            });
        }

        const pillButtons = document.querySelectorAll('#progressionQuickFilters .filter-pill');
        pillButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                pillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.quickFilter = btn.dataset.filter || 'all';
                this.renderMatrix();
            });
        });

        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', () => {
                this.isFilterActive = !this.isFilterActive;
                this.filterBtn.classList.toggle('active', this.isFilterActive);
                this.filterBtn.style.backgroundColor = this.isFilterActive ? 'var(--md-sys-color-primary-container)' : '';
                this.quickFilter = this.isFilterActive ? 'awaiting' : 'all';
                pillButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === this.quickFilter));
                this.renderMatrix();
            });
        }

        if (this.courseSelect) {
            this.courseSelect.addEventListener('change', () => {
                this.processData();
                this.renderMatrix();
            });
        }

        if (this.classSelect) {
            this.classSelect.addEventListener('change', () => {
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
                if (targetId === 'usersView') {
                    window.loadUsersManagement?.();
                }
            });
        });
    }

    async loadData() {
        this.matrixContainer.innerHTML = '<div class="loader-placeholder">Chargement des données en cours...</div>';
        
        try {
            const [exs, subs, examResultsSnap, usersSnap] = await Promise.all([
                getAllExercises(),
                getAllSubmissions(),
                getDocs(collection(db, "exam_results")),
                getDocs(collection(db, "users"))
            ]);

            this.exercices = exs;
            this.submissions = subs;
            this.examResultsSnap = examResultsSnap;
            this.usersSnap = usersSnap;

            this.processData();
            this.renderMatrix();
        } catch (error) {
            console.error("Erreur chargement progression:", error);
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Erreur lors du chargement des données.</div>';
        }
    }

    processData() {
        const selectedCourse = this.courseSelect?.value || "dactylo-3e";

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
                    return cId.includes("dactylo") || ch.includes("dactylo") || ch.includes("ligne de base") || ch.includes("ligne supérieure") || ch.includes("ligne inférieure") || ch.includes("accents") || id.startsWith("dac-");
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
                const email = (res.email_eleve || "anonyme@test.com").toLowerCase().trim();
                const existing = this.examResults[email];
                if (!existing || new Date(res.date) > new Date(existing.date)) {
                    this.examResults[email] = res;
                }
            });
        }

        // 1.8 Mapper les classes et statuts depuis la collection users
        const userClassMap = {};
        const userStatusMap = {};
        if (this.usersSnap) {
            this.usersSnap.forEach(docSnap => {
                const data = docSnap.data();
                const email = (data.email || docSnap.id).toLowerCase().trim();
                if (data.classe || data.class) {
                    userClassMap[email] = data.classe || data.class;
                }
                userStatusMap[email] = data.status || 'actif';
            });
        }

        // 2. Extraire la liste unique des élèves et mapper leurs soumissions
        const studentMap = {};
        this.submissions.forEach(sub => {
            const email = (sub.email_eleve || "anonyme@test.com").toLowerCase().trim();
            if (!studentMap[email]) {
                studentMap[email] = {
                    email: email,
                    nom: sub.nom_eleve || email.split('@')[0],
                    classe: userClassMap[email] || sub.classe || '',
                    status: userStatusMap[email] || 'actif',
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

        // Inclure également les élèves ayant uniquement passé l'examen ou enregistrés dans users
        Object.keys(this.examResults).forEach(email => {
            if (!studentMap[email]) {
                const res = this.examResults[email];
                studentMap[email] = {
                    email: email,
                    nom: res.nom_eleve || email.split('@')[0],
                    classe: userClassMap[email] || '',
                    status: userStatusMap[email] || 'actif',
                    submissions: {},
                    hasAwaiting: false
                };
            }
        });

        if (this.usersSnap) {
            this.usersSnap.forEach(docSnap => {
                const data = docSnap.data();
                const email = (data.email || docSnap.id).toLowerCase().trim();
                if (email && email !== "gatweb@gmail.com" && !studentMap[email]) {
                    studentMap[email] = {
                        email: email,
                        nom: data.nom || data.displayName || email.split('@')[0],
                        classe: data.classe || data.class || '',
                        status: data.status || 'actif',
                        submissions: {},
                        hasAwaiting: false
                    };
                }
            });
        }

        this.students = Object.values(studentMap).sort((a,b) => a.nom.localeCompare(b.nom));
        this.updateClassSelect();
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

    updateClassSelect() {
        if (!this.classSelect) return;
        const currentVal = this.classSelect.value || "all";
        const classes = new Set();
        this.students.forEach(s => {
            if (s.classe && s.classe.trim()) {
                classes.add(s.classe.trim());
            }
        });
        const sortedClasses = Array.from(classes).sort();

        this.classSelect.innerHTML = `
            <option value="all">🏫 Toutes classes</option>
            ${sortedClasses.map(c => `<option value="${c}">Classe ${c}</option>`).join('')}
            <option value="unassigned">⚠️ Non assignés</option>
        `;
        if (currentVal === 'all' || currentVal === 'unassigned' || sortedClasses.includes(currentVal)) {
            this.classSelect.value = currentVal;
        } else {
            this.classSelect.value = 'all';
        }
    }

    toggleChapter(chapterName) {
        if (this.viewMode === 'detailed') {
            this.viewMode = 'summary';
            if (this.viewSummaryBtn) this.viewSummaryBtn.classList.add('active');
            if (this.viewDetailedBtn) this.viewDetailedBtn.classList.remove('active');
            this.expandedChapters = new Set(Object.keys(this.chapters).filter(ch => ch !== chapterName));
        } else {
            if (this.expandedChapters.has(chapterName)) {
                this.expandedChapters.delete(chapterName);
            } else {
                this.expandedChapters.add(chapterName);
            }
        }
        this.renderMatrix();
    }

    renderMatrix() {
        let displayStudents = this.students;

        // Exclure les élèves archivés de la matrice active
        displayStudents = displayStudents.filter(s => s.status !== 'archive');

        // Pré-calculer les métriques individuelles pour chaque élève
        displayStudents.forEach(student => {
            let needsHelp = false;
            let helpReason = "";
            let awaitingCount = 0;
            let startedCount = 0;

            for (const exercises of Object.values(this.chapters)) {
                exercises.forEach(ex => {
                    const sub = student.submissions[ex.id];
                    if (sub) {
                        startedCount++;
                        const score = this.calculateScore(sub);
                        if (sub.status === 'a_valider') awaitingCount++;
                        if (sub.status === 'a_refaire') {
                            needsHelp = true;
                            helpReason = "Exercice à refaire";
                        } else if ((sub.status === 'valide' || sub.status === 'publie') && score !== null && score < 50) {
                            needsHelp = true;
                            helpReason = "Note < 50%";
                        }
                    }
                });
            }

            student.needsHelp = needsHelp;
            student.helpReason = helpReason;
            student.awaitingCount = awaitingCount;
            student.hasAwaiting = awaitingCount > 0;
            student.startedCount = startedCount;
            student.isInactive = startedCount === 0;
        });

        // Filtre par classe
        const selectedClass = this.classSelect?.value || "all";
        if (selectedClass !== "all") {
            if (selectedClass === "unassigned") {
                displayStudents = displayStudents.filter(s => !s.classe);
            } else {
                displayStudents = displayStudents.filter(s => s.classe === selectedClass);
            }
        }

        // Filtre par recherche élève ou classe
        const searchTerm = (this.searchInput?.value || "").toLowerCase().trim();
        if (searchTerm) {
            displayStudents = displayStudents.filter(s => 
                s.nom.toLowerCase().includes(searchTerm) || 
                s.email.toLowerCase().includes(searchTerm) ||
                (s.classe && s.classe.toLowerCase().includes(searchTerm))
            );
        }

        // Mettre à jour les compteurs des badges de filtres rapides (sur l'ensemble filtré par classe/recherche)
        const countAll = displayStudents.length;
        const countHelp = displayStudents.filter(s => s.needsHelp).length;
        const countAwaiting = displayStudents.filter(s => s.hasAwaiting).length;
        const countInactive = displayStudents.filter(s => s.isInactive).length;

        const pillAll = document.getElementById('countPillAll');
        const pillHelp = document.getElementById('countPillHelp');
        const pillAwaiting = document.getElementById('countPillAwaiting');
        const pillInactive = document.getElementById('countPillInactive');
        if (pillAll) pillAll.textContent = countAll;
        if (pillHelp) pillHelp.textContent = countHelp;
        if (pillAwaiting) pillAwaiting.textContent = countAwaiting;
        if (pillInactive) pillInactive.textContent = countInactive;

        // Filtre rapide actif
        if (this.quickFilter === 'help') {
            displayStudents = displayStudents.filter(s => s.needsHelp);
        } else if (this.quickFilter === 'awaiting') {
            displayStudents = displayStudents.filter(s => s.hasAwaiting);
        } else if (this.quickFilter === 'inactive') {
            displayStudents = displayStudents.filter(s => s.isInactive);
        }

        // Calcul des statistiques globales pour le bandeau
        let totalValidatedScores = 0;
        let countValidated = 0;
        let awaitingCountTotal = 0;

        displayStudents.forEach(s => {
            if (s.hasAwaiting) awaitingCountTotal += s.awaitingCount;
            Object.values(s.submissions).forEach(sub => {
                if ((sub.status === 'valide' || sub.status === 'publie') && sub.note_suggeree !== undefined) {
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
                <span class="badge" style="background:#fef3c7;color:#b45309;font-size:12px;padding:4px 10px;">⏳ ${awaitingCountTotal} en attente</span>
            `;
        }

        const totalExercises = Object.values(this.chapters).reduce((acc, curr) => acc + curr.length, 0);

        if (totalExercises === 0) {
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Aucun exercice pour ce cours dans la base de données.</div>';
            return;
        }

        if (displayStudents.length === 0) {
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Aucun élève ne correspond aux filtres sélectionnés.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'progression-table';

        // --- THEAD ---
        const head = document.createElement('thead');
        const rowTop = document.createElement('tr');
        const rowSub = document.createElement('tr');
        let hasSubHeaders = false;

        // Sticky Corner Header: Élèves
        const cornerHeader = document.createElement('th');
        cornerHeader.className = 'sticky-col';
        cornerHeader.textContent = "Élèves";
        rowTop.appendChild(cornerHeader);

        // Header Moyenne
        const avgHead = document.createElement('th');
        avgHead.className = 'avg-col';
        avgHead.textContent = "Moyenne";
        rowTop.appendChild(avgHead);

        // Header Examen
        const examHead = document.createElement('th');
        examHead.className = 'exam-col-header';
        examHead.textContent = "Examen (Quiz)";
        rowTop.appendChild(examHead);

        // Traiter chaque chapitre
        for (const [chapterName, exercises] of Object.entries(this.chapters)) {
            const isExpanded = this.viewMode === 'detailed' || this.expandedChapters.has(chapterName);

            // Calculer taux de complétion de la classe sur ce chapitre
            let chCompletedTotal = 0;
            const chPossible = displayStudents.length * exercises.length;
            displayStudents.forEach(st => {
                exercises.forEach(ex => {
                    const sub = st.submissions[ex.id];
                    if (sub && (sub.status === 'valide' || sub.status === 'publie')) {
                        chCompletedTotal++;
                    }
                });
            });
            const chClassPct = chPossible > 0 ? Math.round((chCompletedTotal / chPossible) * 100) : 0;

            if (isExpanded) {
                hasSubHeaders = true;
                const th = document.createElement('th');
                th.className = 'chapter-header';
                th.colSpan = exercises.length;
                th.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span>${chapterName}</span>
                        ${this.viewMode === 'summary' ? `<button type="button" class="chapter-expand-btn is-expanded" title="Replier ce module">▲ Replier</button>` : ''}
                    </div>
                `;
                const btn = th.querySelector('.chapter-expand-btn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleChapter(chapterName);
                    });
                }
                th.addEventListener('click', () => this.showChapterStats(chapterName, exercises));
                rowTop.appendChild(th);

                exercises.forEach(ex => {
                    const subTh = document.createElement('th');
                    subTh.textContent = ex.titre;
                    subTh.title = ex.titre;
                    rowSub.appendChild(subTh);
                });
            } else {
                const th = document.createElement('th');
                th.className = 'summary-chapter-header';
                th.innerHTML = `
                    <div class="summary-header-content">
                        <span class="summary-header-title" title="${chapterName}">${chapterName}</span>
                        <div class="summary-header-meta">
                            <span>${exercises.length} ex.</span> • <span title="Complétion de la classe">${chClassPct}%</span>
                        </div>
                        <button type="button" class="chapter-expand-btn" title="Déplier les exercices de ce module">▼ Déplier</button>
                    </div>
                `;
                const btn = th.querySelector('.chapter-expand-btn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleChapter(chapterName);
                    });
                }
                th.addEventListener('click', () => this.toggleChapter(chapterName));
                rowTop.appendChild(th);
            }
        }

        // Ajuster rowSpan si rowSub a des enfants
        if (hasSubHeaders) {
            cornerHeader.rowSpan = 2;
            avgHead.rowSpan = 2;
            examHead.rowSpan = 2;
            Array.from(rowTop.children).forEach(child => {
                if (child.classList.contains('summary-chapter-header')) {
                    child.rowSpan = 2;
                }
            });
            head.appendChild(rowTop);
            head.appendChild(rowSub);
        } else {
            head.appendChild(rowTop);
        }
        table.appendChild(head);

        // --- TBODY ---
        const body = document.createElement('tbody');
        displayStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.className = 'student-row';

            // Nom de l'élève (Sticky) avec badge SOS éventuel
            const tdName = document.createElement('td');
            tdName.className = 'sticky-col';
            tdName.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        ${student.needsHelp ? `<span title="${student.helpReason} : cet élève a besoin d'aide" style="background:#fee2e2; color:#b91c1c; font-size:10px; font-weight:700; padding:2px 6px; border-radius:6px; cursor:help;">🆘 Aide</span>` : ''}
                        <strong>${student.nom}</strong>
                    </div>
                    ${student.classe ? `<span class="class-badge-pill" style="background:#e2e8f0; color:#334155;">${student.classe}</span>` : ''}
                </div>
                <small style="color:#64748b; font-size:11px;">${student.email}</small>
            `;
            tr.appendChild(tdName);

            // Calcul moyenne globale
            let totalScore = 0;
            let countScores = 0;

            for (const exercises of Object.values(this.chapters)) {
                exercises.forEach(ex => {
                    const sub = student.submissions[ex.id];
                    if (sub) {
                        const score = this.calculateScore(sub);
                        const status = sub.status || 'brouillon';
                        if (status === 'valide' || status === 'publie') {
                            totalScore += score;
                            countScores++;
                        }
                    }
                });
            }

            // Cellule Moyenne
            const tdAvg = document.createElement('td');
            tdAvg.className = 'avg-col';
            if (countScores > 0) {
                const avg = Math.round(totalScore / countScores);
                tdAvg.textContent = `${avg}%`;
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
                if (examRes.pct >= 80) tdExam.style.color = '#2e7d32';
                else if (examRes.pct < 50) tdExam.style.color = '#c62828';
            } else {
                tdExam.innerHTML = '<span style="color:#ccc">--</span>';
            }
            tr.appendChild(tdExam);

            // Cellules de chapitres
            for (const [chapterName, exercises] of Object.entries(this.chapters)) {
                const isExpanded = this.viewMode === 'detailed' || this.expandedChapters.has(chapterName);

                if (isExpanded) {
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
                        } else {
                            td.innerHTML = '<span style="color:#ccc">--</span>';
                        }
                        tr.appendChild(td);
                    });
                } else {
                    const tdSummary = document.createElement('td');
                    tdSummary.className = 'summary-cell';
                    tdSummary.title = "Cliquer pour déplier les exercices de ce module";

                    let completedInCh = 0;
                    let awaitingInCh = 0;
                    let hasHelpInCh = false;
                    let chScores = [];

                    exercises.forEach(ex => {
                        const sub = student.submissions[ex.id];
                        if (sub) {
                            const score = this.calculateScore(sub);
                            if (sub.status === 'valide' || sub.status === 'publie') {
                                completedInCh++;
                                if (score !== null) chScores.push(score);
                            }
                            if (sub.status === 'a_valider') awaitingInCh++;
                            if (sub.status === 'a_refaire' || ((sub.status === 'valide' || sub.status === 'publie') && score !== null && score < 50)) {
                                hasHelpInCh = true;
                            }
                        }
                    });

                    const totalInCh = exercises.length;
                    const pctInCh = totalInCh > 0 ? Math.round((completedInCh / totalInCh) * 100) : 0;
                    const chAvg = chScores.length > 0 ? Math.round(chScores.reduce((a,b)=>a+b,0) / chScores.length) : null;

                    let avgClass = 'summary-avg-none';
                    let avgLabel = '--';
                    if (chAvg !== null) {
                        avgLabel = `${chAvg}%`;
                        if (chAvg >= 80) avgClass = 'summary-avg-good';
                        else if (chAvg >= 50) avgClass = 'summary-avg-mid';
                        else avgClass = 'summary-avg-low';
                    }

                    const fillColor = pctInCh === 100 ? '#16a34a' : (pctInCh > 0 ? '#2563eb' : '#cbd5e1');

                    tdSummary.innerHTML = `
                        <div class="summary-cell-content">
                            <div class="summary-progress-wrapper">
                                <span class="mini-progress-track">
                                    <span class="mini-progress-fill" style="width:${pctInCh}%; background:${fillColor};"></span>
                                </span>
                                <span class="summary-counts">${completedInCh}/${totalInCh}</span>
                            </div>
                            <div class="summary-badges-row">
                                <span class="summary-avg-badge ${avgClass}">${avgLabel}</span>
                                ${hasHelpInCh ? '<span class="summary-status-pill" title="Exercice en difficulté" style="color:#dc2626;">🆘</span>' : ''}
                                ${awaitingInCh > 0 ? `<span class="summary-status-pill" title="${awaitingInCh} copie(s) à valider" style="color:#d97706;">⏳</span>` : ''}
                            </div>
                        </div>
                    `;

                    tdSummary.addEventListener('click', () => {
                        this.toggleChapter(chapterName);
                    });

                    tr.appendChild(tdSummary);
                }
            }

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
