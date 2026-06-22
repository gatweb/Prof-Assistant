import { doc, getDoc, setDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "../firebase/db.js";

/**
 * ProgressManager
 * Gère le suivi et l'enregistrement de la progression des élèves dans Firestore.
 */
export class ProgressManager {
    constructor() {
        this.collectionName = 'users_progress';
    }

    /**
     * Génère l'ID unique de document pour un couple élève/cours.
     */
    getDocumentRef(userEmail, courseId) {
        // Nettoie l'email pour éviter les caractères problématiques (bien que Firestore les supporte la plupart du temps)
        const docId = `${userEmail.replace(/\//g, '_')}_${courseId}`;
        return doc(db, this.collectionName, docId);
    }

    /**
     * Enregistre qu'un élève a lu ou complété un chapitre.
     */
    async trackChapterRead(userEmail, courseId, googleUserId, chapterId) {
        if (!userEmail || !courseId || !chapterId) return;

        const docRef = this.getDocumentRef(userEmail, courseId);
        try {
            await setDoc(docRef, {
                googleUserId: googleUserId || "",
                email: userEmail,
                courseId: courseId,
                completedChapters: arrayUnion(chapterId),
                lastActive: new Date().toISOString()
            }, { merge: true });
            console.log(`📊 Chapitre ${chapterId} marqué comme lu pour ${userEmail}`);
        } catch (error) {
            console.error('[ProgressManager] Erreur trackChapterRead :', error);
        }
    }

    /**
     * Enregistre le score ou la tentative d'un élève sur un exercice.
     */
    async trackExerciseAttempt(userEmail, courseId, googleUserId, exerciseId, score) {
        if (!userEmail || !courseId || !exerciseId) return;

        const docRef = this.getDocumentRef(userEmail, courseId);
        try {
            // Pour mettre à jour un tableau d'objets (historique), nous lisons d'abord le document
            const snap = await getDoc(docRef);
            let history = [];
            
            if (snap.exists()) {
                const data = snap.data();
                history = data.exerciseHistory || [];
            }

            // Mettre à jour l'historique : si l'exercice existe déjà, on met à jour son score
            const index = history.findIndex(item => item.id === exerciseId);
            const entry = {
                id: exerciseId,
                score: score,
                date: new Date().toISOString()
            };

            if (index !== -1) {
                history[index] = entry;
            } else {
                history.push(entry);
            }

            await setDoc(docRef, {
                googleUserId: googleUserId || "",
                email: userEmail,
                courseId: courseId,
                exerciseHistory: history,
                lastActive: new Date().toISOString()
            }, { merge: true });
            
            console.log(`📊 Exercice ${exerciseId} enregistré avec un score de ${score} pour ${userEmail}`);
        } catch (error) {
            console.error('[ProgressManager] Erreur trackExerciseAttempt :', error);
        }
    }

    /**
     * Incrémente le nombre d'interactions de l'élève avec le tuteur IA.
     */
    async trackTutorInteraction(userEmail, courseId, googleUserId) {
        if (!userEmail || !courseId) return;

        const docRef = this.getDocumentRef(userEmail, courseId);
        try {
            await setDoc(docRef, {
                googleUserId: googleUserId || "",
                email: userEmail,
                courseId: courseId,
                tutorInteractions: increment(1),
                lastActive: new Date().toISOString()
            }, { merge: true });
            console.log(`📊 Interaction tuteur incrémentée pour ${userEmail}`);
        } catch (error) {
            console.error('[ProgressManager] Erreur trackTutorInteraction :', error);
        }
    }
}

export const progressManager = new ProgressManager();
