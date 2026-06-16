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
     * Charge le manifeste des cours depuis le serveur.
     * @returns {Promise<Array>} Liste des cours chargés.
     */
    async loadCourses() {
        try {
            const response = await fetch(this.manifestUrl);
            if (!response.ok) {
                throw new Error(`Impossible de charger le manifest des cours : ${response.statusText}`);
            }
            this.courses = await response.json();
            
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
