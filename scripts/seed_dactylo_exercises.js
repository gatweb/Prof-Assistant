const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialisation Firebase Admin avec le bon ProjectId
admin.initializeApp({
    projectId: 'profassistant-61fde'
});

const db = admin.firestore();

async function seedDactylo() {
    const jsonPath = path.join(__dirname, '../public/cours/dactylo-3e/exercices.json');
    if (!fs.existsSync(jsonPath)) {
        console.error("❌ Fichier exercices.json introuvable :", jsonPath);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`🚀 Insertion de ${data.length} exercices/quizz Dactylographie dans Firestore...`);

    let successCount = 0;
    for (const item of data) {
        const { id, ...docData } = item;
        try {
            await db.collection('exercices').doc(id).set(docData, { merge: true });
            console.log(`✅ Exercice/Quizz inséré : [${id}] ${docData.titre}`);
            successCount++;
        } catch (err) {
            console.error(`❌ Erreur sur [${id}] :`, err.message);
        }
    }

    console.log(`\n🎉 Terminé ! ${successCount}/${data.length} exercices enregistrés dans Firestore.`);
    process.exit(0);
}

seedDactylo();
