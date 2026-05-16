const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * `corrigerDevoir` — Appelle Gemini via l'API correcte (@google/genai)
 * et enregistre la soumission dans Firestore.
 */
exports.corrigerDevoir = onCall({ 
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Vous devez être connecté.");
    }

    const codeEleve = request.data.code_eleve;
    const consigne = request.data.consigne_exercice;

    if (!codeEleve || !consigne) {
        throw new HttpsError("invalid-argument", "Données manquantes.");
    }

    try {
        // Syntaxe correcte pour @google/genai (ai.models.generateContent)
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        
        const promptSysteme = `Tu es un professeur de programmation rigoureux et bienveillant.
Analyse le code de l'élève pour la consigne : "${consigne}"

Directives :
- Ne donne JAMAIS la solution finale.
- Soit encourageant mais précis.
- Ta réponse DOIT être un JSON pur, sans balise markdown autour.

Structure JSON attendue (uniquement ce JSON, rien d'autre) :
{
  "feedback_eleve": "ton commentaire chaleureux en 2-3 phrases",
  "note_suggeree": 75,
  "erreurs_detectees": ["erreur ou axe d'amélioration 1", "erreur 2"]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Voici le code soumis par l'élève :\n\n${codeEleve}`,
            config: {
                systemInstruction: promptSysteme,
                temperature: 0.2
            }
        });

        const responseText = response.text;
        console.log("[corrigerDevoir] Réponse brute Gemini :", responseText.substring(0, 200));

        // Extraction robuste du JSON (gère les backticks éventuels)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

        let jsonEvaluation;
        try {
            jsonEvaluation = JSON.parse(cleanJson);
        } catch(parseEx) {
            console.error("[corrigerDevoir] JSON Parse Error. Data:", responseText);
            throw new HttpsError("internal", "L'IA a renvoyé un format invalide.");
        }

        const submissionData = {
            code_eleve: codeEleve,
            consigne_exercice: consigne,
            email_eleve: request.auth.token.email || "anonyme@test.com",
            nom_eleve: request.data.nom_eleve || "Anonyme",
            status: "a_valider",
            feedback_ia: jsonEvaluation.feedback_eleve || "",
            note_suggeree: jsonEvaluation.note_suggeree || 0,
            erreurs_detectees: jsonEvaluation.erreurs_detectees || [],
            titre_exercice: request.data.titre_exercice || "Exercice",
            // Champs supplémentaires (atelier HTML/CSS/JS)
            type: request.data.type || "js",
            exercice_id: request.data.exercice_id || null,
            chapitre: request.data.chapitre || "",
            code_html: request.data.code_html || null,
            code_css:  request.data.code_css  || null,
            code_js:   request.data.code_js   || null,
            indices_utilises: { niv1: 0, niv2: 0, niv3: 0 },
            questions_libres: 0,
            date_soumission: new Date().toISOString()
        };
        
        const docRef = await admin.firestore().collection("submissions").add(submissionData);
        console.log("[corrigerDevoir] Submission créée :", docRef.id);

        return {
            message: "Analyse terminée !",
            docId: docRef.id,
            evaluation: jsonEvaluation
        };

    } catch (error) {
        console.error("[corrigerDevoir] CRASH:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Erreur réseau avec l'IA ou écriture BDD.");
    }
});

/**
 * `interrogerTuteur` — Tuteur Socratique avec historique de conversation.
 */
exports.interrogerTuteur = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Connexion requise.");
    }

    const { question, historique, id_cours } = request.data;

    if (!question) {
        throw new HttpsError("invalid-argument", "La question est requise.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        // --- RAG : Récupération du contenu du cours ---
        let contenuCours = "";
        if (id_cours) {
            const courseDoc = await admin.firestore().collection("courses").doc(id_cours).get();
            if (courseDoc.exists) {
                contenuCours = courseDoc.data().content || "";
                console.log(`[interrogerTuteur] Contexte chargé pour le cours : ${id_cours}`);
            } else {
                console.warn(`[interrogerTuteur] Cours introuvable : ${id_cours}. Utilisation du savoir général.`);
            }
        }

        // Construction du prompt avec historique
        const contentsArray = [];
        
        if (historique && historique.length > 0) {
            historique.forEach(msg => {
                contentsArray.push({
                    role: msg.role,
                    parts: [{ text: msg.parts[0].text }]
                });
            });
        }
        
        contentsArray.push({ role: "user", parts: [{ text: question }] });

        const systemInstruction = `Tu es un tuteur d'informatique Socratique bienveillant.
Ton but est d'aider l'élève à trouver la réponse par lui-même, sans jamais la donner.
Pose des questions de guidage, encourage, et donne des indices progressifs.

${contenuCours ? `CONTEXTE DE RÉFÉRENCE (Utilise UNIQUEMENT ces informations pour répondre si possible) :\n${contenuCours}` : "Utilise tes connaissances générales de programmation pour guider l'élève."}

Règles de réponse :
1. Si l'information est dans le contexte, priorise-la.
2. Ne donne JAMAIS de code complet.
3. Si la question est hors sujet par rapport au cours, ramène doucement l'élève vers le sujet.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contentsArray,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7
            }
        });

        return { reponse: response.text };

    } catch (error) {
        console.error("[interrogerTuteur] Erreur :", error);
        throw new HttpsError("internal", "Le tuteur IA est indisponible.");
    }
});

/**
 * `demanderIndice` — Système d'indices progressifs à 3 niveaux.
 * Niveau 1 : Théorie pure, question rhétorique (sans regarder le code).
 * Niveau 2 : Analyse l'erreur dans le code textuellement (pas de code dans la réponse).
 * Niveau 3 : Code à trous / exemple structurel proche de la solution.
 * Enregistre chaque utilisation dans le document Firestore de la soumission.
 */
exports.demanderIndice = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Connexion requise.");
    }

    const { niveau, code_eleve, consigne, doc_id } = request.data;

    if (!niveau || !consigne) {
        throw new HttpsError("invalid-argument", "niveau et consigne sont requis.");
    }

    // Construction du prompt selon le niveau
    const prompts = {
        1: `Tu es un tuteur bienveillant. L'élève travaille sur cet exercice : "${consigne}".
Réponds avec un INDICE PUREMENT THÉORIQUE (2-3 phrases max).
NE regarde PAS son code. NE cite PAS de code du tout.
Pose une question rhétorique pour le faire réfléchir.
Exemple de ton : "Est-ce que tu sais quelle instruction permet de répéter une action en JS ?"`,

        2: `Tu es un tuteur bienveillant. L'élève travaille sur : "${consigne}".
Voici son code actuel :
\`\`\`
${code_eleve || "(aucun code soumis)"}
\`\`\`
Analyse son code et explique son erreur principale en TEXTE UNIQUEMENT.
N'écris PAS de code corrigé. Montre où est le problème et explique POURQUOI c'est incorrect.
Sois précis mais bienveillant.`,

        3: `Tu es un tuteur bienveillant. L'élève travaille sur : "${consigne}".
Voici son code actuel :
\`\`\`
${code_eleve || "(aucun code soumis)"}
\`\`\`
Donne-lui un "code à trous" : un exemple structurel PROCHE de la solution avec des parties essentielles remplacées par ___ .
Exemple : "for (let ___ = ___; ___ < ___; ___++) { console.log(___); }"
Ne complète pas les blancs. L'élève doit trouver ce qui va à chaque endroit.`
    };

    const promptChoisi = prompts[niveau];
    if (!promptChoisi) {
        throw new HttpsError("invalid-argument", `Niveau invalide : ${niveau}. Doit être 1, 2 ou 3.`);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptChoisi,
            config: { temperature: 0.5 }
        });

        const reponse = response.text;

        // Tracking Firestore : incrémente le compteur du bon niveau
        if (doc_id) {
            const fieldKey = `indices_utilises.niv${niveau}`;
            const docRef = admin.firestore().collection("submissions").doc(doc_id);
            await docRef.update({
                [fieldKey]: admin.firestore.FieldValue.increment(1)
            }).catch(e => console.warn("[demanderIndice] Tracking Firestore échoué (doc inexistant?):", e.message));
        }

        return { reponse, niveau };

    } catch (error) {
        console.error("[demanderIndice] Erreur :", error);
        throw new HttpsError("internal", "Le service d'indices est indisponible.");
    }
});
