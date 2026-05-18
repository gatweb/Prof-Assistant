const admin = require('firebase-admin');
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();

async function check() {
    console.log("Checking Firestore exercices:");
    const snap = await db.collection('exercices').get();
    snap.forEach(doc => {
        console.log(`- ID: ${doc.id}`);
        console.log(`  Data:`, doc.data());
    });
}

check().catch(console.error);
