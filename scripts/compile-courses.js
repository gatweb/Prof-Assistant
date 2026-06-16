const fs = require('fs');
const path = require('path');

const COURS_DIR = path.join(__dirname, '../public/cours');
const MANIFEST_PATH = path.join(COURS_DIR, 'manifest.json');

function validateConfig(config, folderName) {
    const required = ['id', 'title', 'pitch', 'systemPrompt', 'chapters'];
    for (const field of required) {
        if (!config[field]) {
            throw new Error(`Le champ obligatoire "${field}" est manquant dans le cours "${folderName}".`);
        }
    }
    if (!Array.isArray(config.chapters)) {
        throw new Error(`Le champ "chapters" doit être un tableau dans le cours "${folderName}".`);
    }
    config.chapters.forEach((ch, idx) => {
        if (!ch.id || !ch.title || !ch.file) {
            throw new Error(`Le chapitre à l'index ${idx} du cours "${folderName}" doit avoir un "id", "title" et "file".`);
        }
        // Vérifier que le fichier md existe bien
        const chPath = path.join(COURS_DIR, folderName, ch.file);
        if (!fs.existsSync(chPath)) {
            throw new Error(`Le fichier du chapitre "${ch.file}" (${chPath}) est introuvable pour le cours "${folderName}".`);
        }
    });
}

function compileCourses() {
    console.log('🚀 Démarrage de la compilation et validation des cours...');
    
    if (!fs.existsSync(COURS_DIR)) {
        console.log(`Création du dossier des cours : ${COURS_DIR}`);
        fs.mkdirSync(COURS_DIR, { recursive: true });
    }

    const items = fs.readdirSync(COURS_DIR);
    const manifest = [];

    for (const item of items) {
        const itemPath = path.join(COURS_DIR, item);
        if (fs.statSync(itemPath).isDirectory()) {
            const configPath = path.join(itemPath, 'config.json');
            if (!fs.existsSync(configPath)) {
                console.warn(`⚠️ Dossier ignoré (pas de config.json trouvé) : ${item}`);
                continue;
            }

            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(configContent);
                
                validateConfig(config, item);
                
                // On ajoute le dossier racine aux métadonnées pour que le frontend sache où chercher les fichiers md
                config.folder = item;
                
                manifest.push(config);
                console.log(`✅ Cours valide et compilé : ${config.title} (${item})`);
            } catch (err) {
                console.error(`❌ Erreur dans le dossier "${item}" :`, err.message);
                process.exit(1);
            }
        }
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n🎉 Compilation terminée avec succès ! Manifeste généré sous : ${MANIFEST_PATH}`);
}

compileCourses();
