const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialisation Firebase Admin
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 1...");
    try {
        const jsonPath = path.join(__dirname, 'ch1_exercices.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const exercises = JSON.parse(rawData);

        for (const ex of exercises) {
            const exercise = {
                course_id: ex.course_id,
                chapitre: ex.chapitre,
                titre: ex.titre,
                type: ex.type
            };

            if (ex.type === 'quizz') {
                exercise.questions = ex.questions;
            } else if (ex.type === 'creative') {
                exercise.enonce_md = ex.enonce_md;
                exercise.theorie_md = ex.theorie_md;
                exercise.submission_type = ex.submission_type;
                exercise.external_tools = ex.external_tools;
            }

            await db.collection('exercices').doc(ex.id).set(exercise);
            console.log(`✅ Exercice '${ex.id}' (${ex.type}) inséré.`);
        }
    } catch (e) {
        console.error("❌ Erreur de seeding :", e);
    }
    console.log("✨ Seeding terminé !");
}

seed();
