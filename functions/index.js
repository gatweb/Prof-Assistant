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
        
        const isCreative = request.data.type === 'creative_submission' || exData.type === 'creative';
        const role = isCreative ? "un directeur artistique et mentor créatif" : "un professeur de programmation";
        const labelSoumission = isCreative ? "le travail ou lien de création de l'élève" : "le code soumis par l'élève";
        const directives = isCreative 
            ? "- Analyse le lien ou texte soumis.\n- Sois très encourageant et donne des conseils de Prompt Engineering ou d'amélioration créative.\n- Pose des questions socratiques de guidage." 
            : "- Ne donne JAMAIS la solution finale.\n- Utilise le contexte théorique fourni pour pointer les erreurs.";

        const promptSysteme = `Tu es ${role} rigoureux et bienveillant.
Contexte théorique de l'exercice/mission : "${exData.theorie_md || ''}"
Consigne/Objectif : "${exData.enonce_md || ''}"

Directives :
${directives}
- Ta réponse DOIT être un JSON pur.

Structure JSON :
{
  "feedback_eleve": "ton commentaire chaleureux",
  "note_suggeree": 75,
  "erreurs_detectees": ["erreur 1", "erreur 2"]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Voici la soumission de l'élève (${labelSoumission}) :\n\n${code_eleve}`,
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

    const { question, historique, id_exercice, system_prompt_custom } = request.data;
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

        // Utilise le prompt système du cours s'il est fourni, sinon le prompt par défaut.
        const baseSystemPrompt = system_prompt_custom || `Tu es un tuteur d'informatique Socratique bienveillant.
Ton but est d'aider l'élève à trouver la réponse par lui-même.`;

        const systemInstruction = `${baseSystemPrompt}
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

/**
 * `genererSandboxIA` — Génère du texte et un rendu visuel HTML/CSS simulé
 * pour le Prompt Sandbox de l'élève.
 */
exports.genererSandboxIA = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { prompt, course_id, id_exercice } = request.data;
    if (!prompt) throw new HttpsError("invalid-argument", "Prompt manquant.");

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        const systemInstruction = `Tu es l'assistant IA de création du Studio Créatif.
L'élève te donne une consigne ou un prompt (ex: rédiger un slogan, décrire son bureau de rêve, inventer un logo ou un visuel).
Tu dois analyser sa demande et retourner :
1. "text" : Un retour ou conseil constructif (en Markdown) sur son prompt ou son idée, avec des astuces pour l'améliorer (Prompt Engineering).
2. "html" : Une carte visuelle de prévisualisation HTML avec du style CSS en ligne (inline styles). Ce composant HTML doit simuler visuellement sa demande de manière esthétique (ex: si l'élève demande un bureau moderne, dessine en HTML/CSS un bureau stylisé avec des formes épurées, des plantes, un écran géant ; s'il demande une police, affiche un aperçu textuel élégant ; s'il demande un slogan, affiche-le sous forme de carte publicitaire haut de gamme). Utilise des dégradés modernes, du relief, de la transparence (rgba), des coins arrondis et une mise en page flexbox.

Ta réponse doit obligatoirement être un objet JSON valide avec cette structure :
{
  "text": "commentaire et conseils de prompt engineering en markdown...",
  "html": "<div style=\\"...\\">...</div>"
}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Voici le prompt soumis par l'élève :\n\n${prompt}`,
            config: { 
                systemInstruction,
                temperature: 0.7
            }
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { text: response.text, html: null };
        }
        
        const result = JSON.parse(jsonMatch[0]);
        return result;

    } catch (error) {
        console.error("[genererSandboxIA] Erreur:", error);
        throw new HttpsError("internal", "Erreur lors de la génération IA.");
    }
});
