import { getFirestore, collection, getDocs, query, where, doc, updateDoc, addDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { app } from "./config.js";

// Initialisation de Firestore
export const db = getFirestore(app);

// CRUD : Récupérer toutes les copies avec statut "a_valider"
export const getSubmissionsToGrade = async () => {
    const q = query(collection(db, "submissions"), where("status", "==", "a_valider"));
    const querySnapshot = await getDocs(q);
    const submissions = [];
    querySnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
    });
    return submissions;
};

// Récupérer TOUTES les soumissions (pour la matrice de progression)
export const getAllSubmissions = async () => {
    const q = collection(db, "submissions");
    const querySnapshot = await getDocs(q);
    const submissions = [];
    querySnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() });
    });
    return submissions;
};

// Récupérer TOUS les exercices (pour les colonnes de la matrice)
export const getAllExercises = async () => {
    const q = collection(db, "exercices");
    const querySnapshot = await getDocs(q);
    const exercices = [];
    querySnapshot.forEach((doc) => {
        exercices.push({ id: doc.id, ...doc.data() });
    });
    return exercices;
};

// CRUD : Mettre à jour le statut, feedback et note
export const updateSubmissionStatus = async (id, status, feedbackIa, note, profMessage = null) => {
    const docRef = doc(db, "submissions", id);
    const updateData = {
        status:       status,
        feedback_ia:  feedbackIa,
        note_suggeree: note,
        date_correction: serverTimestamp()
    };
    // Message personnalisé du prof (affiché côté élève dans le chat drawer)
    if (profMessage) updateData.prof_message = profMessage;
    await updateDoc(docRef, updateData);
};


// DEV ONLY : Génère des copies de tests s'il n'y en a pas
export const generateMockSubmissions = async () => {
    const mocks = [
        {
            nom_eleve: "Alice Dupont",
            titre_exercice: "Boucle For 1 à 10",
            code_eleve: "for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}",
            status: "a_valider",
            feedback_ia: "Code correct. La logique de la boucle est bien comprise ! 👍",
            note_suggeree: 100,
            date_soumission: new Date().toISOString()
        },
        {
            nom_eleve: "Bob Bernard",
            titre_exercice: "Boucle For 1 à 10",
            code_eleve: "let i = 1;\nwhile (i <= 10) {\n  console.log(i);\n  i++;\n}\n// J'ai utilisé while à la place car j'aime bien",
            status: "a_valider",
            feedback_ia: "Le résultat est correct en console, mais l'énoncé demandait explicitement une boucle `for`. Essaie de suivre cette contrainte technique.",
            note_suggeree: 70,
            date_soumission: new Date().toISOString()
        },
        {
            nom_eleve: "Clotilde Martin",
            titre_exercice: "Boucle For 1 à 10",
            code_eleve: "for(let i=0; i<10; i++) {\n  console.log(i+1);\n}",
            status: "a_valider",
            feedback_ia: "Astucieux. Toutefois, on préfère souvent initialiser à 1 (let i=1) si c'est simplement pour compter. Totalement valide néanmoins.",
            note_suggeree: 95,
            date_soumission: new Date().toISOString()
        }
    ];

    const coll = collection(db, "submissions");
    for (const mock of mocks) {
        await addDoc(coll, mock);
    }
};

export const generateMockCourses = async () => {
    // Initiation des deux cours
    await setDoc(doc(db, "cours", "html_css"), {
        titre: "Bases du HTML et CSS",
        ia_active: true,
        texte_cours: "Le HTML structure la page avec des balises comme div ou span. Le CSS permet de styliser le rendu, par exemple avec les sélecteurs de classe (.ma-classe) ou d'id (#mon-id). N'oublie pas la notion de box-model : padding, border, margin."
    });
    
    await setDoc(doc(db, "cours", "javascript"), {
        titre: "Introduction à Javascript",
        ia_active: true,
        texte_cours: "Javascript permet de rendre une page interactive. Les variables se déclarent avec let ou const. Les boucles for (let i=0; i<10; i++) permettent de répéter une action. Attention aux conditions avec == ou ===."
    });
};
