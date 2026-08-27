const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const { google } = require("googleapis");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * `corrigerDevoir` — Analyse le travail/code et injecte la théorie de l'exercice dans le prompt.
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
        const exData = exDoc.exists ? exDoc.data() : {};

        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        
        const isCreative = request.data.type === 'creative_submission' || exData.type === 'creative';
        const isOffice = request.data.type === 'office_submission' || exData.type === 'office';
        
        let role = "un professeur de programmation";
        let labelSoumission = "le code soumis par l'élève";
        let directives = "- Ne donne JAMAIS la solution finale.\n- Utilise le contexte théorique fourni pour pointer les erreurs.";

        if (isCreative) {
            role = "un directeur artistique et mentor créatif";
            labelSoumission = "le travail ou lien de création de l'élève";
            directives = "- Analyse le lien ou texte soumis.\n- Sois très encourageant et donne des conseils de Prompt Engineering ou d'amélioration créative.\n- Pose des questions socratiques de guidage.";
        } else if (isOffice) {
            role = "un professeur de bureautique et de communication numérique bienveillant pour des élèves de 3e secondaire";
            labelSoumission = "le lien du document Google Docs/Drive ou le texte soumis par l'élève";
            directives = "- Analyse la réponse ou le lien fourni par l'élève.\n- Félicite les efforts et vérifie le respect des consignes (mise en page, styles, typographie, organisation des dossiers, partages).\n- Donne des astuces pratiques et des raccourcis clavier utiles.\n- Pose des questions d'approfondissement socratiques.";
        }

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

const fs = require("fs");
const path = require("path");

/**
 * Initialise les clients Google Forms et Google Drive
 * (Service Account ou OAuth2)
 */
function getGoogleClients(customAccessToken) {
    if (customAccessToken) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: customAccessToken });
        return {
            forms: google.forms({ version: "v1", auth: oauth2Client }),
            drive: google.drive({ version: "v3", auth: oauth2Client })
        };
    }

    // 1. Clé de compte de service (Service Account)
    const saPath = path.join(__dirname, "service-account.json");
    if (fs.existsSync(saPath)) {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: saPath,
                scopes: [
                    "https://www.googleapis.com/auth/forms.body",
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/drive.file"
                ]
            });
            return {
                forms: google.forms({ version: "v1", auth }),
                drive: google.drive({ version: "v3", auth })
            };
        } catch (e) {
            console.error("[Google Service Account] Erreur auth:", e.message);
        }
    }

    // 2. Fallback Secrets OAuth
    try {
        const clientId = googleClientId.value();
        const clientSecret = googleClientSecret.value();
        const refreshToken = googleRefreshToken.value();

        if (clientId && clientSecret && refreshToken) {
            const oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                "https://developers.google.com/oauthplayground"
            );
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            return {
                forms: google.forms({ version: "v1", auth: oauth2Client }),
                drive: google.drive({ version: "v3", auth: oauth2Client })
            };
        }
    } catch (e) {
        console.warn("[Google Forms] Secrets OAuth non disponibles:", e.message);
    }

    return null;
}

/**
 * `creerFormulaireGoogleForms` — Crée un formulaire Google Forms en mode Quiz.
 */
exports.creerFormulaireGoogleForms = onCall({
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { titre, description, folderId, accessToken } = request.data;
    const clients = getGoogleClients(accessToken);

    if (!clients) {
        throw new HttpsError(
            "failed-precondition",
            "Identifiants Google non configurés (Service Account ou OAuth2 requis)."
        );
    }

    try {
        const { forms, drive } = clients;

        // 1. Création du formulaire
        const createRes = await forms.forms.create({
            requestBody: {
                info: {
                    title: titre || "Évaluation Bureautique - 3e",
                    documentTitle: titre || "Évaluation Bureautique"
                }
            }
        });

        const formId = createRes.data.formId;

        // 2. Déplacer dans le dossier Drive partagé si fourni
        if (folderId && drive) {
            try {
                await drive.files.update({
                    fileId: formId,
                    addParents: folderId,
                    fields: "id, parents"
                });
            } catch (errDrive) {
                console.warn("[creerFormulaireGoogleForms] Impossible de déplacer dans le dossier Drive :", errDrive.message);
            }
        }

        // 3. Donner les droits d'édition au compte enseignant
        if (drive && request.auth.token.email) {
            try {
                await drive.permissions.create({
                    fileId: formId,
                    requestBody: {
                        role: "writer",
                        type: "user",
                        emailAddress: request.auth.token.email
                    }
                });
            } catch (permErr) {
                console.warn("[Drive Permission] Note :", permErr.message);
            }
        }

        // 4. Activer le mode Quiz (auto-correction)
        await forms.forms.batchUpdate({
            formId: formId,
            requestBody: {
                requests: [
                    {
                        updateSettings: {
                            settings: {
                                quizSettings: { isQuiz: true }
                            },
                            updateMask: "quizSettings.isQuiz"
                        }
                    }
                ]
            }
        });

        return {
            success: true,
            formId: formId,
            responderUri: createRes.data.responderUri,
            editUri: `https://docs.google.com/forms/d/${formId}/edit`
        };
    } catch (error) {
        console.error("[creerFormulaireGoogleForms] Erreur:", error);
        throw new HttpsError("internal", error.message || "Erreur lors de la création du formulaire Google Forms.");
    }
});

/**
 * `genererQuizGoogleFormsIA` — Utilise Gemini pour générer des questions structurées
 * et crée automatiquement le Google Form complet en mode Quiz dans le dossier Drive partagé.
 */
exports.genererQuizGoogleFormsIA = onCall({
    secrets: [geminiApiKey],
    region: "europe-west1",
    cors: true
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Connexion requise.");

    const { 
        sujet, 
        niveau = "3e secondaire (14-15 ans)", 
        nombreQuestions = 10,
        titreQuiz = "Quiz Bureautique",
        folderId,
        accessToken 
    } = request.data;

    if (!sujet) throw new HttpsError("invalid-argument", "Le sujet du quiz est obligatoire.");

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        // 1. Générer les questions via Gemini
        const systemInstruction = `Tu es un concepteur pédagogique expert en Bureautique (Google Docs, Drive, Sheets, Gmail, règles de typographie, dactylographie, raccourcis).
Tu dois générer un questionnaire à choix multiples (QCM) de ${nombreQuestions} questions pour le niveau : ${niveau}.
Chaque question doit avoir :
- un intitulé clair et précis
- 4 options distinctes
- 1 seule bonne réponse (exactMatch)
- une explication pédagogique (feedback) expliquant pourquoi c'est la bonne réponse
- 1 point par question

Format de sortie OBLIGATOIRE : Un JSON pur respectant cette structure exacte :
{
  "titre": "${titreQuiz}",
  "description": "Évaluation formative sur ${sujet}",
  "questions": [
    {
      "intitule": "Comment insérer un saut de page dans Google Docs ?",
      "options": [
        "Menu Insertion > Saut > Saut de page",
        "Menu Format > Page > Saut",
        "Menu Outils > Sauts",
        "Double-clic en bas de page"
      ],
      "bonne_reponse": "Menu Insertion > Saut > Saut de page",
      "explication": "Le menu Insertion permet d'ajouter tous les nouveaux éléments structurels au document, ou via le raccourci Ctrl + Entrée."
    }
  ]
}`;

        const geminiRes = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Génère le QCM de ${nombreQuestions} questions sur le sujet suivant : "${sujet}".`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3
            }
        });

        const jsonMatch = geminiRes.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("L'IA n'a pas retourné de JSON valide.");
        }

        const quizData = JSON.parse(jsonMatch[0]);

        // 2. Création et insertion dans Google Forms
        const clients = getGoogleClients(accessToken);
        
        // Si les credentials Google ne sont pas encore configurés, renvoyer les données structurées pour prévisualisation
        if (!clients) {
            return {
                success: true,
                mode: "preview_only",
                message: "Quiz généré avec succès par l'IA ! Configurez vos clés Google API pour la publication automatique sur Google Drive.",
                quizData: quizData
            };
        }

        const { forms, drive } = clients;

        // Création du formulaire
        const createRes = await forms.forms.create({
            requestBody: {
                info: {
                    title: quizData.titre || titreQuiz,
                    documentTitle: quizData.titre || titreQuiz
                }
            }
        });

        const formId = createRes.data.formId;

        // Déplacer dans le dossier Drive partagé si fourni
        if (folderId && drive) {
            try {
                await drive.files.update({
                    fileId: formId,
                    addParents: folderId,
                    fields: "id, parents"
                });
            } catch (errDrive) {
                console.warn("[genererQuizGoogleFormsIA] Impossible de déplacer dans le dossier Drive :", errDrive.message);
            }
        }

        // Donner les droits d'édition au compte enseignant
        if (drive && request.auth.token.email) {
            try {
                await drive.permissions.create({
                    fileId: formId,
                    requestBody: {
                        role: "writer",
                        type: "user",
                        emailAddress: request.auth.token.email
                    }
                });
            } catch (permErr) {
                console.warn("[Drive Permission] Note :", permErr.message);
            }
        }

        // Préparation des requêtes de mise à jour (Quiz mode + ajout des items)
        const requests = [
            {
                updateSettings: {
                    settings: {
                        quizSettings: { isQuiz: true }
                    },
                    updateMask: "quizSettings.isQuiz"
                }
            }
        ];

        (quizData.questions || []).forEach((q, index) => {
            requests.push({
                createItem: {
                    item: {
                        title: q.intitule,
                        description: q.explication ? `💡 Astuce : ${q.explication}` : undefined,
                        questionItem: {
                            question: {
                                required: true,
                                grading: {
                                    pointValue: 1,
                                    correctAnswers: {
                                        answers: [{ value: q.bonne_reponse }]
                                    },
                                    whenRight: {
                                        generalFeedback: { text: "Excellent ! 🎯" }
                                    },
                                    whenWrong: {
                                        generalFeedback: { text: q.explication || "Vérifie les menus ou raccourcis dans ton cours." }
                                    }
                                },
                                choiceQuestion: {
                                    type: "RADIO",
                                    options: q.options.map(opt => ({ value: opt })),
                                    shuffle: true
                                }
                            }
                        }
                    },
                    location: {
                        index: index
                    }
                }
            });
        });

        await forms.forms.batchUpdate({
            formId: formId,
            requestBody: { requests }
        });

        return {
            success: true,
            mode: "created",
            formId: formId,
            responderUri: createRes.data.responderUri,
            editUri: `https://docs.google.com/forms/d/${formId}/edit`,
            quizData: quizData
        };

    } catch (error) {
        console.error("[genererQuizGoogleFormsIA] Erreur:", error);
        throw new HttpsError("internal", error.message || "Erreur lors de la génération du quiz.");
    }
});

