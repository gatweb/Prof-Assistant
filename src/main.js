import { loginWithGoogle, listenToAuthStatus } from './firebase/auth.js';

const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        // Optionnel : donner un retour visuel sur le bouton pendant la connexion
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = "Connexion en cours...";
        loginBtn.disabled = true;

        try {
            await loginWithGoogle();
            // Si la popup réussit, le state observer prendra le relais
        } catch (error) {
            console.error("Erreur détaillée :", error);
            alert("Erreur lors de la connexion. Veuillez réessayer.");
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    });
}

// L'observateur d'état d'authentification écoute les changements
// S'il y a un utilisateur valide de connecté, on le redirige vers l'espace de travail.
listenToAuthStatus((user) => {
    if (user) {
        window.location.href = "workspace.html";
    }
});
