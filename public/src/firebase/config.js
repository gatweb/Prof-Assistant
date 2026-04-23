import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Configuration Firebase fournie par l'utilisateur
const firebaseConfig = {
  apiKey: "AIzaSyCccJvi75RxyaiW4meP9yVz_--k4UUFaps",
  authDomain: "profassistant-61fde.firebaseapp.com",
  projectId: "profassistant-61fde",
  storageBucket: "profassistant-61fde.firebasestorage.app",
  messagingSenderId: "429919803539",
  appId: "1:429919803539:web:6719e34300ce0ffadc5566"
};

// Initialisation de Firebase et export global
export const app = initializeApp(firebaseConfig);

import { getFunctions } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";

// Initialisation de l'authentification et export pour utilisation ailleurs
export const auth = getAuth(app);

// Initialisation des Cloud Functions
export const functions = getFunctions(app, "europe-west1");
