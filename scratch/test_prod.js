const fs = require('fs');
const { Firestore } = require('@google-cloud/firestore');
const { UserRefreshClient } = require('google-auth-library');

async function test() {
    const configPath = '/home/gaetan/.config/configstore/firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const refreshToken = config.tokens.refresh_token;
    const clientId = config.user.azp;

    const authClient = new UserRefreshClient({
        clientId: clientId,
        refreshToken: refreshToken
    });

    const db = new Firestore({
        projectId: 'profassistant-61fde',
        authClient: authClient
    });

    console.log("Testing Firestore collection list:");
    const colls = await db.listCollections();
    colls.forEach(c => console.log(`- Collection: ${c.id}`));
}

test().catch(console.error);
