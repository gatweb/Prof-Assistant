const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Fix projet — voir CH2 pour le contexte
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

async function seed() {
    console.log("🚀 Seeding Studio Créatif — Chapitre 1...");
    try {
        const jsonPath = path.join(__dirname, 'ch1_exercices.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const quizzData = JSON.parse(rawData);

        // Note: Le titre du chapitre doit correspondre exactement à celui du config.json
        // pour que atelier.js puisse le regrouper correctement dans le lobby.
        const exercise = {
            course_id: quizzData.course_id,
            chapitre: "Niveau 1 : Bienvenue au Studio",
            titre: quizzData.title,
            type: quizzData.type,
            questions: quizzData.questions
        };

        const docId = `${quizzData.chapter_id}-quizz`;
        await db.collection('exercices').doc(docId).set(exercise);
        console.log(`✅ Quizz '${docId}' inséré.`);
    } catch (e) {
        console.error("❌ Erreur de seeding :", e);
    }
    console.log("✨ Seeding terminé !");
}

seed();
