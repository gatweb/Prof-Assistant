import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "../firebase/db.js";

/**
 * CourseManager
 * Service de gestion des cours pour le frontend de ProfAssistant.
 * Gère le chargement du manifest, la sélection et la persistance du cours actif.
 */
export class CourseManager {
    constructor() {
        this.courses = [];
        this.selectedCourse = null;
        this.manifestUrl = './cours/manifest.json';
        this.storageKey = 'profassistant_active_course_id';
    }

    /**
     * Charge le manifeste des cours depuis le serveur et filtre selon les droits.
     * @param {string|null} studentEmail - Optionnel, email de l'élève connecté
     * @returns {Promise<Array>} Liste des cours autorisés.
     */
    async loadCourses(studentEmail = null) {
        try {
            // 1. Charger le manifest local
            const response = await fetch(this.manifestUrl);
            if (!response.ok) {
                throw new Error(`Impossible de charger le manifest des cours : ${response.statusText}`);
            }
            const localCourses = await response.json();
            
            // 2. Charger et filtrer les cours depuis Firestore
            let blockedCourseIds = new Set();
            if (studentEmail) {
                const emailLower = studentEmail.toLowerCase();
                try {
                    const snap = await getDocs(collection(db, "courses"));
                    snap.forEach(docSnap => {
                        const data = docSnap.data();
                        const enrolled = (data.enrolled_students || []).map(e => e.toLowerCase());
                        const teacherEmail = (data.teacher_id || "").toLowerCase();
                        
                        // Si le tableau enrolled_students contient des emails et que le nôtre n'y est pas,
                        // ET que nous ne sommes pas le propriétaire/enseignant (teacher_id), alors le cours est BLOQUÉ.
                        if (enrolled.length > 0 && !enrolled.includes(emailLower) && teacherEmail !== emailLower) {
                            blockedCourseIds.add(docSnap.id);
                        }
                    });
                } catch (err) {
                    console.warn("[CourseManager] Impossible de charger les restrictions Firestore, fallback sur la liste locale complète :", err);
                }
            }

            // 3. Filtrer les cours non bloqués
            this.courses = localCourses.filter(c => !blockedCourseIds.has(c.id));
            
            // Restaurer le cours sélectionné
            const savedId = localStorage.getItem(this.storageKey);
            if (savedId) {
                this.selectedCourse = this.courses.find(c => c.id === savedId) || null;
            }
            
            // Si aucun cours n'est sélectionné ou que le cours sauvegardé n'existe plus, on prend le premier
            if (!this.selectedCourse && this.courses.length > 0) {
                this.selectedCourse = this.courses[0];
            }
            
            return this.courses;
        } catch (error) {
            console.error('[CourseManager] Erreur de chargement :', error);
            throw error;
        }
    }

    /**
     * Retourne la liste de tous les cours disponibles.
     * @returns {Array}
     */
    getCourses() {
        return this.courses;
    }

    /**
     * Retourne le cours actuellement sélectionné.
     * @returns {Object|null}
     */
    getSelectedCourse() {
        return this.selectedCourse;
    }

    /**
     * Sélectionne un cours par son ID et persiste le choix dans localStorage.
     * @param {string} courseId 
     * @returns {Object|null} Le cours sélectionné.
     */
    selectCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.selectedCourse = course;
            localStorage.setItem(this.storageKey, course.id);
            return course;
        }
        return null;
    }

    /**
     * Trouve le chapitre du manifeste associé à un libellé de chapitre provenant de la base Firestore.
     * @param {Object} course 
     * @param {string} dbChapterLabel 
     * @returns {Object|null} Le chapitre trouvé ou null.
     */
    findChapterByDbLabel(course, dbChapterLabel) {
        if (!course || !dbChapterLabel) return null;
        const labelLower = dbChapterLabel.toLowerCase();
        
        return course.chapters.find(ch => {
            const titleLower = ch.title.toLowerCase();
            return labelLower.includes(titleLower) || titleLower.includes(labelLower);
        }) || null;
    }

    /**
     * Retourne l'URL relative pour accéder à un fichier Markdown de cours.
     * @param {Object} course 
     * @param {string} fileName 
     * @returns {string}
     */
    getCourseFileUrl(course, fileName) {
        return `./cours/${course.folder}/${fileName}`;
    }
}

// Instance globale à partager
export const courseManager = new CourseManager();
