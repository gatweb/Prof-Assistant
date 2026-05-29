const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * `corrigerDevoir` — Analyse le code et injecte la théorie de l'exercice dans le prompt.
 */
exports.corrigerDevoir = onCall({ 
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { code_eleve, id_exercice, nom_eleve } = request.data;
    if (!code_eleve || !id_exercice) throw new HttpsError("invalid-argument", "Données manquantes.");

    try {
        const exDoc = await admin.firestore().collection("exercices").doc(id_exercice).get();
        if (!exDoc.exists) throw new HttpsError("not-found", "Exercice introuvable.");
        const exData = exDoc.data();

        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        
        const promptSysteme = `Tu es un professeur de programmation rigoureux et bienveillant.
Contexte théorique de l'exercice : "${exData.theorie_md}"
Consigne : "${exData.enonce_md}"

Directives :
- Ne donne JAMAIS la solution finale.
- Utilise le contexte théorique fourni pour pointer les erreurs.
- Ta réponse DOIT être un JSON pur.

Structure JSON :
{
  "feedback_eleve": "ton commentaire chaleureux",
  "note_suggeree": 75,
  "erreurs_detectees": ["erreur 1", "erreur 2"]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Voici le code soumis par l'élève :\n\n${code_eleve}`,
            config: { systemInstruction: promptSysteme, temperature: 0.2 }
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        const jsonEvaluation = JSON.parse(jsonMatch ? jsonMatch[0] : response.text);

        const submissionData = {
            code_eleve: code_eleve,
            id_exercice: id_exercice,
            exercice_id: id_exercice,
            titre_exercice: exData.titre,
            email_eleve: request.auth.token.email,
            nom_eleve: nom_eleve || request.auth.token.name || request.auth.token.email.split('@')[0] || "Anonyme",
            status: "a_valider",
            feedback_ia: jsonEvaluation.feedback_eleve,
            note_suggeree: jsonEvaluation.note_suggeree,
            erreurs_detectees: jsonEvaluation.erreurs_detectees,
            date_soumission: new Date().toISOString(),
            autonomie: request.data.autonomie || {}
        };
        
        const docRef = await admin.firestore().collection("submissions").add(submissionData);
        return { docId: docRef.id, evaluation: jsonEvaluation };

    } catch (error) {
        console.error("[corrigerDevoir] Erreur:", error);
        throw new HttpsError("internal", "Erreur lors de la correction.");
    }
});

/**
 * `interrogerTuteur` — Tuteur Socratique avec RAG basé sur theorie_md.
 */
exports.interrogerTuteur = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { question, historique, id_exercice } = request.data;
    if (!question || !id_exercice) throw new HttpsError("invalid-argument", "Données manquantes.");

    try {
        const exDoc = await admin.firestore().collection("exercices").doc(id_exercice).get();
        const exData = exDoc.exists ? exDoc.data() : null;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        const contentsArray = (historique || []).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts[0].text }]
        }));
        contentsArray.push({ role: "user", parts: [{ text: question }] });

        const systemInstruction = `Tu es un tuteur d'informatique Socratique bienveillant.
Ton but est d'aider l'élève à trouver la réponse par lui-même.
${exData ? `CONCOURS THÉORIQUE DE L'EXERCICE :\n${exData.theorie_md}` : ""}

Règles :
1. Ne donne JAMAIS le code corrigé.
2. Basé tes explications sur la théorie fournie.
3. Pose des questions de guidage.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contentsArray,
            config: { systemInstruction, temperature: 0.7 }
        });

        return { reponse: response.text };
    } catch (error) {
        throw new HttpsError("internal", "Tuteur indisponible.");
    }
});

/**
 * `demanderIndice` — Gère uniquement le Niveau 2 (Analyse dynamique).
 * Les niveaux 1 et 3 sont désormais gérés en statique par le frontend.
 */
exports.demanderIndiceNiveau2 = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { code_eleve, id_exercice } = request.data;

    try {
        const exDoc = await admin.firestore().collection("exercices").doc(id_exercice).get();
        if (!exDoc.exists) throw new HttpsError("not-found", "Exercice introuvable.");
        const exData = exDoc.data();

        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Voici le code de l'élève :\n${code_eleve}`,
            config: { 
                systemInstruction: exData.indices.niveau_2_prompt,
                temperature: 0.5 
            }
        });

        return { reponse: response.text };
    } catch (error) {
        throw new HttpsError("internal", "Service d'indices indisponible.");
    }
});
