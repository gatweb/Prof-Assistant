import { getAllExercises, getAllSubmissions, db } from './firebase/db.js';

/**
 * MODULE : Suivi de Progression Matrix
 * Gère l'affichage de la grille élève x exercice et les statistiques par chapitre.
 */

class ProgressionManager {
    constructor() {
        this.exercices = [];
        this.submissions = [];
        this.students = []; // { email, nom, submissions: { exId: sub } }
        this.chapters = {}; // { name: [exIds] }
        this.isFilterActive = false;

        this.initUI();
    }

    initUI() {
        this.matrixContainer = document.getElementById('progressionMatrix');
        this.filterBtn = document.getElementById('filterToGradeBtn');
        this.refreshBtn = document.getElementById('refreshProgressionBtn');
        this.modal = document.getElementById('chapterModal');
        this.closeModalBtn = this.modal?.querySelector('.close-modal');

        // Tabs logic handled globally in admin.js? 
        // We'll manage it here for now if not present elsewhere.
        this.initTabs();

        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', () => {
                this.isFilterActive = !this.isFilterActive;
                this.filterBtn.classList.toggle('active', this.isFilterActive);
                this.filterBtn.style.backgroundColor = this.isFilterActive ? 'var(--md-sys-color-primary-container)' : '';
                this.renderMatrix();
            });
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

                // Toggle visibility of mains
                document.getElementById('listView').classList.add('hidden');
                document.getElementById('progressionView').classList.add('hidden');
                const configView = document.getElementById('configView');
                if (configView) configView.classList.add('hidden');
                
                document.getElementById(targetId).classList.remove('hidden');

                if (targetId === 'progressionView') {
                    this.loadData();
                }
            });
        });
    }

    async loadData() {
        this.matrixContainer.innerHTML = '<div class="loader-placeholder">Chargement des données en cours...</div>';
        
        try {
            const [exs, subs] = await Promise.all([
                getAllExercises(),
                getAllSubmissions()
            ]);

            this.exercices = exs;
            this.submissions = subs;

            this.processData();
            this.renderMatrix();
        } catch (error) {
            console.error("Erreur chargement progression:", error);
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Erreur lors du chargement des données.</div>';
        }
    }

    processData() {
        // 1. Grouper les exercices par chapitre
        this.chapters = {};
        this.exercices.forEach(ex => {
            const ch = ex.chapitre || "Général";
            if (!this.chapters[ch]) this.chapters[ch] = [];
            this.chapters[ch].push(ex);
        });

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
            
            // On garde la soumission la plus récente pour cet exercice (ou on priorise les statuts validés?)
            const exId = sub.exercice_id || sub.id_exercice;
            if (exId) {
                const existing = studentMap[email].submissions[exId];
                if (!existing || new Date(sub.date_soumission) > new Date(existing.date_soumission)) {
                    studentMap[email].submissions[exId] = sub;
                }
                if (sub.status === 'a_valider') studentMap[email].hasAwaiting = true;
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
        if (this.isFilterActive) {
            displayStudents = this.students.filter(s => s.hasAwaiting);
        }

        if (this.exercices.length === 0) {
            this.matrixContainer.innerHTML = '<div class="loader-placeholder">Aucun exercice créé pour le moment.</div>';
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
                            <div class="status-cell">
                                <div class="status-dot ${status}" title="Statut: ${status}">
                                    ${this.getStatusIcon(status)}
                                </div>
                                <span class="note-badge">${score}/100</span>
                            </div>
                        `;

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

            // Ajouter les cellules d'exercices après la moyenne
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
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    window.progressionManager = new ProgressionManager();
});
