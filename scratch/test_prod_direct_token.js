const fs = require('fs');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');

async function test() {
    const configPath = '/home/gaetan/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const accessToken = config.tokens.access_token;

    const authClient = new OAuth2Client();
    authClient.setCredentials({
        access_token: accessToken
    });

    const db = new Firestore({
        projectId: 'profassistant-61fde',
        authClient: authClient
    });

    console.log("Writing test document to 'exercices' collection...");
    await db.collection('exercices').doc('test-write').set({
        titre: 'Test Seeding Prod Direct Token',
        timestamp: new Date()
    });
    console.log("✅ Write successful!");

    console.log("Reading test document back...");
    const doc = await db.collection('exercices').doc('test-write').get();
    console.log("✅ Read successful! Document data:", doc.data());

    console.log("Cleaning up test document...");
    await db.collection('exercices').doc('test-write').delete();
    console.log("✅ Cleanup successful!");
}

test().catch(console.error);
