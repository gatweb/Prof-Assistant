const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');

// Nettoyer l'environnement local pour éviter tout conflit d'émulateurs
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.FIRESTORE_EMULATOR_HOST;

async function main() {
    console.log("🌟 [PROD SEEDING] Initialisation de la synchronisation de production...");

    // 1. Lire la session active de Firebase CLI
    const configPath = '/home/gaetan/.config/configstore/firebase-tools.json';
    if (!fs.existsSync(configPath)) {
        console.error("❌ Impossible de trouver la session Firebase CLI. Connectez-vous d'abord avec 'firebase login'.");
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const accessToken = config.tokens?.access_token;

    if (!accessToken) {
        console.error("❌ Session Firebase expirée ou jeton manquant. Veuillez exécuter 'firebase login'.");
        process.exit(1);
    }

    console.log(`👤 Utilisateur connecté détecté : ${config.user?.email || 'gatweb@gmail.com'}`);

    // 2. Initialiser l'OAuth2Client avec le jeton d'accès actif
    const authClient = new OAuth2Client();
    authClient.setCredentials({
        access_token: accessToken
    });

    // 3. Initialiser le client Firestore de Production avec le client d'authentification
    const prodDb = new Firestore({
        projectId: 'profassistant-61fde',
        authClient: authClient
    });

    console.log("✅ Client natif Firestore de Production connecté via jeton actif.");

    // 4. Patcher le singleton 'firebase-admin' pour intercepter toutes les requêtes
    const mockApp = {
        firestore: () => prodDb
    };

    admin.initializeApp = function() {
        return mockApp;
    };
    admin.app = function() {
        return mockApp;
    };
    admin.firestore = function() {
        return prodDb;
    };

    console.log("🔌 Intercepteur firebase-admin activé avec succès !");

    // 5. Liste des fichiers à importer
    const filesToSeed = [
        'seed_uaa5_ch1.js',
        'seed_uaa5_ch2.js',
        'seed_uaa5_ch3.js',
        'seed_uaa5_ch4.js',
        'seed_uaa5_ch5.js',
        'seed_uaa5_ch6.js',
        'seed_uaa5_ch7.js',
        'seed_uaa5_ch8.js',
        'seed_uaa5_ch9.js',
        'seed_uaa5_ch10.js'
    ];

    console.log("\n🚀 Lancement de l'injection des 10 chapitres en production...\n");

    for (const file of filesToSeed) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`--------------------------------------------------`);
            console.log(`📦 Exécution de ${file} en direct sur la prod...`);
            // Supprimer le cache de require
            delete require.cache[require.resolve(filePath)];
            try {
                // require va exécuter le script de seeding qui va utiliser l'application de prod déjà initialisée
                require(filePath);
                console.log(`✅ ${file} importé avec succès !`);
            } catch (err) {
                console.error(`❌ Échec pour ${file} :`, err);
            }
            // Laisser du temps aux requêtes asynchrones en cours de se terminer
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.warn(`⚠️ Fichier introuvable : ${file}`);
        }
    }

    console.log(`\n==================================================`);
    console.log("✨ [PROD SEEDING] Tous les exercices ont été synchronisés avec la base de données en ligne !");
    console.log("==================================================\n");
}

main().catch(err => {
    console.error("❌ Erreur critique :", err);
});
