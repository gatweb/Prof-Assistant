const admin = require('firebase-admin');
 
// Initialisation (pour cibler le projet de l'émulateur local)
admin.initializeApp({
    projectId: 'profassistant-61fde'
});
const db = admin.firestore();
 
// ============================================================
// UAA5 — Chapitre 10 : Projets (Synthèse finale)
//
// 2 exercices-projets DOM :
//   ch10-ex1 : Pierre-Feuille-Ciseaux   (synthèse totale)
//   ch10-ex2 : Moyenne Pondérée         (synthèse totale)
// ============================================================
 
const STYLES_BASE = `
    * { box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', sans-serif;
        background: #f1f5f9;
        margin: 0; padding: 1.5rem;
        min-height: 100vh;
    }
    .app { max-width: 620px; margin: 0 auto; }
    h2 {
        color: #1e1b4b; margin: 0 0 .6rem;
        font-size: 1.25rem;
        border-bottom: 2px solid #4f46e5;
        padding-bottom: .5rem;
    }
    button {
        padding: .55rem 1.2rem; border: none;
        border-radius: 8px; font-size: 1rem;
        font-weight: 600; cursor: pointer;
        transition: opacity .2s;
    }
    button:hover { opacity: .85; }
    input[type="number"], input[type="text"] {
        padding: .55rem .9rem; font-size: 1rem;
        border: 2px solid #e2e8f0; border-radius: 8px;
        outline: none; transition: border-color .2s;
    }
    input:focus { border-color: #4f46e5; }
    .btn-primary  { background: #4f46e5; color: white; }
    .btn-success  { background: #16a34a; color: white; }
    .btn-danger   { background: #dc2626; color: white; }
    .btn-neutral  { background: #64748b; color: white; }
    .card {
        background: white; border-radius: 10px;
        padding: .7rem 1rem; margin: .4rem 0;
        box-shadow: 0 1px 4px rgba(0,0,0,.07);
        border-left: 4px solid #4f46e5;
    }
    .card strong { color: #4f46e5; }
    .card-ok   { border-left-color: #16a34a; }
    .card-ok strong { color: #16a34a; }
    .card-warn { border-left-color: #d97706; }
    .card-warn strong { color: #d97706; }
    .card-bad  { border-left-color: #dc2626; }
    .card-bad strong { color: #dc2626; }
    .card-draw { border-left-color: #64748b; }
    .card-draw strong { color: #475569; }
    .erreur {
        background: #fef2f2; color: #991b1b;
        border-left: 4px solid #dc2626;
        border-radius: 0 8px 8px 0;
        padding: .5rem 1rem; margin: .3rem 0;
    }
`;
 
// ─────────────────────────────────────────────────────────────────────────────
 
const EXERCICES = [
    {
        id: "ch10-ex1-pierre-feuille-ciseaux",
        titre: "Pierre-Feuille-Ciseaux",
        chapitre: "CH10 — Projets",
        lien_cours: "https://docs.google.com/document/d/1X2bXVb9zAkLxuXWT59znUbxeNpJate64jyCghDzMreg/edit?usp=sharing",
        enonce_md: `
### 🪨📄✂️ Projet 1 — Pierre-Feuille-Ciseaux
 
Implémente le jeu complet contre l'ordinateur selon le cahier des charges suivant.
 
---
 
**Fonctionnalités à implémenter :**
 
1. **Jeu** — Au clic sur un bouton (Pierre / Feuille / Ciseaux) :
   - L'ordinateur choisit aléatoirement parmi les 3 options
   - Le résultat est affiché : choix du joueur, choix de l'ordi, et **Gagné / Perdu / Égalité**
   - Un résultat est ajouté à l'historique
 
2. **Score** — Mis à jour en temps réel :
   - Victoires | Défaites | Égalités
 
3. **Réinitialiser** — Remet le score à zéro et vide l'historique
 
---
 
**Règles du jeu :**
 
| Joueur | Ordinateur | Résultat |
|---|---|---|
| Pierre | Ciseaux | Gagné 🎉 |
| Ciseaux | Feuille | Gagné 🎉 |
| Feuille | Pierre | Gagné 🎉 |
| Même | Même | Égalité 🤝 |
| Autres | - | Perdu 😞 |
 
---
 
**Démarche conseillée :**
 
1. Commence par faire afficher le choix de l'ordi quand on clique
2. Ajoute la comparaison et le résultat
3. Ajoute la mise à jour du score
4. Ajoute l'historique
5. Ajoute le bouton Réinitialiser
 
> 💡 Les 3 boutons appellent la même logique — crée une fonction \`jouer(choixJoueur)\` et appelle-la depuis chaque listener.
        `.trim(),
 
        theorie_md: `
### Rappels clés pour ce projet
 
**Choix aléatoire dans un tableau :**
\`\`\`javascript
const options = ["pierre", "feuille", "ciseaux"];
const choixOrdi = options[Math.floor(Math.random() * 3)];
\`\`\`
 
**État persistant entre les clics :**
\`\`\`javascript
// En dehors des listeners
let victories = 0, defaites = 0, egalites = 0;
\`\`\`
 
**Déterminer le gagnant :**
\`\`\`javascript
// Une façon claire avec if/else if
if (joueur === ordi) {
    // Égalité
} else if (
    (joueur === "pierre"  && ordi === "ciseaux") ||
    (joueur === "ciseaux" && ordi === "feuille") ||
    (joueur === "feuille" && ordi === "pierre")
) {
    // Gagné
} else {
    // Perdu
}
\`\`\`
 
**Mettre à jour le score affiché :**
\`\`\`javascript
document.getElementById("score").textContent =
    \`Victoires : \${victories} | Défaites : \${defaites} | Égalités : \${egalites}\`;
\`\`\`
 
**Fonction fléchée (syntaxe courte) :**
\`\`\`javascript
// Équivalent à function() { jouer("pierre"); }
document.getElementById("btnPierre").addEventListener("click",
    () => jouer("pierre"));
\`\`\`
        `.trim(),
 
        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    .btns-jeu { display: flex; gap: .7rem; margin-bottom: 1rem; }
    .btn-choix {
        flex: 1; padding: 1rem; font-size: 1.6rem;
        border-radius: 12px; border: none;
        background: white; cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,.1);
        transition: transform .1s, box-shadow .1s;
    }
    .btn-choix:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .btn-choix:active { transform: translateY(0); }
    .score-bar {
        background: #1e1b4b; color: white;
        border-radius: 10px; padding: .6rem 1rem;
        text-align: center; font-weight: 600;
        margin-bottom: .8rem; font-size: .95rem;
    }
    #historique { max-height: 300px; overflow-y: auto; }
\`;
document.head.appendChild(style);
 
document.body.innerHTML = \`
  <div class="app">
    <h2>🪨📄✂️ Pierre-Feuille-Ciseaux</h2>
 
    <div class="btns-jeu">
      <button class="btn-choix" id="btnPierre"  title="Pierre">🪨</button>
      <button class="btn-choix" id="btnFeuille" title="Feuille">📄</button>
      <button class="btn-choix" id="btnCiseaux" title="Ciseaux">✂️</button>
    </div>
 
    <div class="score-bar" id="score">
      Victoires : 0 | Défaites : 0 | Égalités : 0
    </div>
 
    <div id="historique"></div>
 
    <div style="margin-top:.8rem;text-align:right">
      <button class="btn-neutral" id="btnReset">🔄 Réinitialiser</button>
    </div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════
 
// ─── État du jeu ──────────────────────────────────────────────────────
const OPTIONS   = ["pierre", "feuille", "ciseaux"];
const EMOJIS    = { pierre: "🪨", feuille: "📄", ciseaux: "✂️" };
let victories = 0, defaites = 0, egalites = 0;
 
// ─── Fonction principale — à compléter ────────────────────────────────
function jouer(choixJoueur) {
    // 1. Choix aléatoire de l'ordinateur
 
 
    // 2. Déterminer le résultat (Gagné / Perdu / Égalité)
 
 
    // 3. Mettre à jour le score
 
 
    // 4. Afficher le résultat dans l'historique
    //    Crée une div.card avec la classe adaptée et ajoute-la à #historique
 
 
    // 5. Mettre à jour l'affichage du score
 
}
 
// ─── Listeners des boutons ────────────────────────────────────────────
document.getElementById("btnPierre") .addEventListener("click", () => jouer("pierre"));
document.getElementById("btnFeuille").addEventListener("click", () => jouer("feuille"));
document.getElementById("btnCiseaux").addEventListener("click", () => jouer("ciseaux"));
 
document.getElementById("btnReset").addEventListener("click", function() {
    // Réinitialise le score et l'historique
 
});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Choix de l'ordi et comparaison**
 
\`\`\`javascript
function jouer(choixJoueur) {
    // 1. Choix aléatoire
    const choixOrdi = OPTIONS[Math.floor(Math.random() * 3)];
 
    // 2. Résultat
    let resultat, classe;
 
    if (choixJoueur === choixOrdi) {
        resultat = "Égalité 🤝";
        classe   = "card card-draw";
        egalites++;
    } else if (
        (choixJoueur === "pierre"  && choixOrdi === "ciseaux") ||
        (choixJoueur === "ciseaux" && choixOrdi === "feuille") ||
        (choixJoueur === "feuille" && choixOrdi === "pierre")
    ) {
        resultat = "Gagné 🎉";
        classe   = "card card-ok";
        victories++;
    } else {
        resultat = "Perdu 😞";
        classe   = "card card-bad";
        defaites++;
    }
 
    // 3. Ajouter à l'historique
    const div = document.createElement("div");
    div.className = classe;
    div.innerHTML = \`
        <strong>\${resultat}</strong> — 
        Toi : \${EMOJIS[choixJoueur]} | Ordi : \${EMOJIS[choixOrdi]}
    \`;
    document.getElementById("historique").prepend(div);  // prepend = en tête
 
    // 4. Mettre à jour le score
    document.getElementById("score").textContent =
        \`Victoires : \${victories} | Défaites : \${defaites} | Égalités : \${egalites}\`;
}
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur le projet PFC (Pierre-Feuille-Ciseaux) en JS avec DOM.
Architecture attendue : OPTIONS=["pierre","feuille","ciseaux"], EMOJIS={pierre:"🪨",...}, victoires/defaites/egalites en dehors de jouer(). Dans jouer(choixJoueur) : choixOrdi avec Math.floor(Math.random()*3), détermination résultat par if égalité / else if victoire (3 conditions) / else défaite, incrémentation compteur, création div.card avec classe adaptée (card-ok/card-bad/card-draw), prepend dans #historique, mise à jour #score. Bouton reset : remettre les 3 compteurs à 0, innerHTML="", mettre à jour #score.
Analyse le JS après "═══". Identifie le premier problème (mauvaise comparaison, compteur dans le mauvais scope, innerHTML pas vidé au reset, score pas mis à jour...) et pose une question ciblée.`,
 
            niveau_3_md: `
🛠️ **Squelette logique du jeu Pierre-Feuille-Ciseaux attendu :**
 
Voici comment ordonner ton état persistant, ta fonction de jeu principale et le bouton de réinitialisation. Remplis les \`...\` :
 
\`\`\`javascript
const OPTIONS = ["pierre", "feuille", "ciseaux"];
const EMOJIS  = { pierre: "🪨", feuille: "📄", ciseaux: "✂️" };
let victories = 0, defaites = 0, egalites = 0;
 
// Fonction utilitaire pour rafraîchir l'affichage du score
function majScore() {
    document.getElementById("score").textContent =
        \`Victoires : \${victories} | Défaites : \${defaites} | Égalités : \${egalites}\`;
}
 
function jouer(choixJoueur) {
    // 1. Choix aléatoire de l'ordinateur (sélectionne l'index 0, 1 ou 2)
    const choixOrdi = OPTIONS[Math.floor(Math.random() * 3)];
 
    let resultat, classe;
 
    // 2. Évaluation des règles de victoire, défaite et égalité
    if (choixJoueur === choixOrdi) {
        resultat = "Égalité 🤝"; 
        classe = "card card-draw"; 
        egalites++;
    } else if (
        (choixJoueur === "pierre"  && choixOrdi === "ciseaux") ||
        (choixJoueur === "ciseaux" && choixOrdi === "feuille") ||
        (choixJoueur === "feuille" && choixOrdi === "pierre")
    ) {
        resultat = "Gagné 🎉"; 
        classe = "card card-ok"; 
        victories++;
    } else {
        resultat = "Perdu 😞"; 
        classe = "card card-bad"; 
        defaites++;
    }
 
    // 3. Injection dynamique dans l'historique (en haut de la liste avec prepend)
    const div = document.createElement("div");
    div.className = classe;
    div.innerHTML = \`<strong>\${resultat}</strong> — 
        Toi&nbsp;: \${EMOJIS[choixJoueur]}&nbsp;&nbsp;|&nbsp;&nbsp;
        Ordi&nbsp;: \${EMOJIS[choixOrdi]}\`;
    document.getElementById("historique").prepend(div);
 
    // 4. Mise à jour de l'UI du score
    majScore();
}
 
// Câblage des écouteurs d'événements
document.getElementById("btnPierre") .addEventListener("click", () => jouer("pierre"));
document.getElementById("btnFeuille").addEventListener("click", () => jouer("ciseaux"));
document.getElementById("btnCiseaux").addEventListener("click", () => jouer("ciseaux"));
 
// Réinitialisation du jeu
document.getElementById("btnReset").addEventListener("click", function() {
    victories = 0; 
    defaites = 0; 
    egalites = 0;
    document.getElementById("historique").innerHTML = "";
    majScore();
});
\`\`\`
            `.trim()
        }
    },
 
    {
        id: "ch10-ex2-moyenne-ponderee",
        titre: "Calculateur de Moyenne Pondérée",
        chapitre: "CH10 — Projets",
        lien_cours: "https://docs.google.com/document/d/1X2bXVb9zAkLxuXWT59znUbxeNpJate64jyCghDzMreg/edit?usp=sharing",
        enonce_md: `
### 📊 Projet 2 — Calculateur de Moyenne Pondérée
 
Implémente le calculateur complet selon le cahier des charges suivant.
 
---
 
**Fonctionnalités à implémenter :**
 
1. **Ajouter une note** (bouton "Ajouter") :
   - Champs : Note (0–20, décimales OK) et Coefficient (entier ≥ 1)
   - Valide les deux champs avant d'ajouter
   - Affiche la note ajoutée dans la liste avec sa contribution : \`Note × Coeff\`
   - Vide les champs après ajout
 
2. **Calculer** (bouton "Calculer") :
   - Formule : \`Σ(note × coeff) / Σ(coefficients)\`
   - Affiche la moyenne arrondie à 2 décimales
   - Affiche l'interprétation (Distinction / Réussite / Ajournement / Échec)
   - Empêche le calcul si aucune note n'a été ajoutée
 
3. **Réinitialiser** (bouton "Réinitialiser") :
   - Supprime toutes les notes et vide l'affichage
 
---
 
**Interprétation :**
 
| Moyenne | Mention |
|---|---|
| ≥ 14/20 | 🏆 Distinction |
| ≥ 10/20 | ✅ Réussite |
| ≥ 8/20 | ⚠️ Ajournement possible |
| < 8/20 | ❌ Échec |
 
---
 
**Démarche conseillée :**
 
1. Fais d'abord fonctionner "Ajouter" : valide, stocke dans les variables accumulatrices, affiche dans la liste
2. Implémente "Calculer" avec la formule
3. Ajoute l'interprétation
4. Ajoute "Réinitialiser"
 
> 💡 Tu n'as pas besoin de tableau — deux variables suffisent : \`sommeNoteCoeff\` et \`sommeCoeffs\`.
        `.trim(),
 
        theorie_md: `
### La formule de la moyenne pondérée
 
\`\`\`
Moyenne = (n1×c1 + n2×c2 + n3×c3) / (c1 + c2 + c3)
        = Σ(note × coeff) / Σ(coefficients)
\`\`\`
 
**En JS, avec deux accumulateurs :**
\`\`\`javascript
// Variables d'état (en dehors des listeners)
let sommeNoteCoeff = 0;
let sommeCoeffs    = 0;
let nbNotes        = 0;
 
// À chaque ajout :
sommeNoteCoeff += note * coeff;
sommeCoeffs    += coeff;
nbNotes++;
 
// Pour calculer :
const moyenne = sommeNoteCoeff / sommeCoeffs;
\`\`\`
 
---
 
### Validation de la note et du coefficient
 
\`\`\`javascript
const note  = Number(document.getElementById("inputNote").value);
const coeff = Number(document.getElementById("inputCoeff").value);
 
if (isNaN(note) || note < 0 || note > 20) {
    // Note invalide
    return;
}
if (isNaN(coeff) || !Number.isInteger(coeff) || coeff < 1) {
    // Coefficient invalide
    return;
}
\`\`\`
 
---
 
### Interprétation du résultat
 
\`\`\`javascript
let mention, classe;
if (moyenne >= 14) {
    mention = "🏆 Distinction";  classe = "card-ok";
} else if (moyenne >= 10) {
    mention = "✅ Réussite";      classe = "card-ok";
} else if (moyenne >= 8) {
    mention = "⚠️ Ajournement";  classe = "card-warn";
} else {
    mention = "❌ Échec";         classe = "card-bad";
}
 
---
 
### Vider les champs après ajout
 
\`\`\`javascript
document.getElementById("inputNote").value  = "";
document.getElementById("inputCoeff").value = "";
document.getElementById("inputNote").focus(); // repositionne le curseur
\`\`\`
        `.trim(),
 
        code_depart: `// ═══ Setup interface — ne pas modifier ══════════════════════════════
const style = document.createElement("style");
style.textContent = \`${STYLES_BASE}
    .form-ajout {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: .5rem; margin-bottom: .8rem;
    }
    .form-ajout input { min-width: 0; }
    .liste-notes { margin-bottom: .8rem; max-height: 240px; overflow-y: auto; }
    .note-ligne {
        display: flex; justify-content: space-between;
        background: white; border-radius: 8px;
        padding: .4rem .8rem; margin: .25rem 0;
        font-size: .9rem; box-shadow: 0 1px 3px rgba(0,0,0,.06);
        border-left: 3px solid #4f46e5;
    }
    .note-contrib { color: #64748b; font-size: .85rem; }
    .btns-actions { display: flex; gap: .5rem; }
    #resultat { margin-top: .8rem; }
    .moyenne-affichage {
        font-size: 2rem; font-weight: 800; text-align: center;
        color: #1e1b4b; padding: .5rem;
    }
\`;
document.head.appendChild(style);
 
document.body.innerHTML = \`
  <div class="app">
    <h2>📊 Calculateur de Moyenne Pondérée</h2>
 
    <div class="form-ajout">
      <input id="inputNote"  type="number" min="0" max="20" step="0.5"
             placeholder="Note (0-20)">
      <input id="inputCoeff" type="number" min="1" step="1"
             placeholder="Coeff (≥1)">
      <button class="btn-primary" id="btnAjouter">+ Ajouter</button>
    </div>
 
    <div class="liste-notes" id="listeNotes"></div>
 
    <div class="btns-actions">
      <button class="btn-success" id="btnCalculer" style="flex:1">
        📊 Calculer la moyenne
      </button>
      <button class="btn-neutral" id="btnReset">🔄 Réinitialiser</button>
    </div>
 
    <div id="resultat"></div>
  </div>
\`;
// ══════════════════════════════════════════════════════════════════════
 
// ─── État — accumulateurs ─────────────────────────────────────────────
let sommeNoteCoeff = 0;
let sommeCoeffs    = 0;
let nbNotes        = 0;
 
// ─── Bouton "Ajouter" — à compléter ──────────────────────────────────
document.getElementById("btnAjouter").addEventListener("click", function() {
    const note  = Number(document.getElementById("inputNote").value);
    const coeff = Number(document.getElementById("inputCoeff").value);
 
    // 1. Valider note (0-20) et coeff (entier ≥ 1)
 
 
    // 2. Mettre à jour les accumulateurs
 
 
    // 3. Afficher la ligne dans #listeNotes
 
 
    // 4. Vider les champs et remettre le focus sur inputNote
 
});
 
// ─── Bouton "Calculer" — à compléter ─────────────────────────────────
document.getElementById("btnCalculer").addEventListener("click", function() {
    document.getElementById("resultat").innerHTML = "";
 
    // 1. Vérifier qu'il y a au moins une note
 
 
    // 2. Calculer la moyenne pondérée
 
 
    // 3. Déterminer la mention
 
 
    // 4. Afficher dans #resultat
 
});
 
// ─── Bouton "Réinitialiser" ───────────────────────────────────────────
document.getElementById("btnReset").addEventListener("click", function() {
    // Remettre les accumulateurs à zéro et vider l'affichage
 
});
`,
        indices: {
            niveau_1_md: `
💡 **Indice 1 — Validation et accumulation**
 
\`\`\`javascript
document.getElementById("btnAjouter").addEventListener("click", function() {
    const note  = Number(document.getElementById("inputNote").value);
    const coeff = Number(document.getElementById("inputCoeff").value);
 
    // Validation
    if (isNaN(note) || note < 0 || note > 20) {
        alert("Note invalide — entre une valeur entre 0 et 20.");
        return;
    }
    if (isNaN(coeff) || !Number.isInteger(coeff) || coeff < 1) {
        alert("Coefficient invalide — entre un entier ≥ 1.");
        return;
    }
 
    // Accumulation
    sommeNoteCoeff += note * coeff;
    sommeCoeffs    += coeff;
    nbNotes++;
 
    // Affichage de la ligne
    const div = document.createElement("div");
    div.className = "note-ligne";
    div.innerHTML = \`
        <span><strong>\${note}/20</strong> × coeff \${coeff}</span>
        <span class="note-contrib">contribution : \${(note * coeff).toFixed(1)}</span>
    \`;
    document.getElementById("listeNotes").appendChild(div);
 
    // Vider les champs
    document.getElementById("inputNote").value  = "";
    document.getElementById("inputCoeff").value = "";
    document.getElementById("inputNote").focus();
});
\`\`\`
            `.trim(),
 
            niveau_2_prompt: `L'élève travaille sur le projet de moyenne pondérée en JS avec DOM.
Architecture : sommeNoteCoeff, sommeCoeffs, nbNotes en dehors des listeners. btnAjouter : valider note(0-20) et coeff(entier>=1), accumuler sommeNoteCoeff+=note*coeff et sommeCoeffs+=coeff et nbNotes++, créer div.note-ligne dans #listeNotes, vider champs. btnCalculer : vérifier nbNotes>0, calculer moyenne=sommeNoteCoeff/sommeCoeffs, déterminer mention (>=14=Distinction, >=10=Réussite, >=8=Ajournement, sinon=Échec), afficher dans #resultat avec .moyenne-affichage. btnReset : remettre les 3 variables à 0, vider #listeNotes et #resultat.
Analyse le JS après "═══". Identifie le premier problème et pose une question ciblée.`,
 
            niveau_3_md: `
🛠️ **Squelette logique du Calculateur de Moyenne Pondérée attendu :**
 
Voici l'architecture globale pour accumuler et calculer les notes, ainsi que les tranches de mentions correspondantes. Complète les parties vides avec \`...\` :
 
\`\`\`javascript
// Accumulateurs d'état en dehors de la portée des fonctions
let sommeNoteCoeff = 0, sommeCoeffs = 0, nbNotes = 0;
 
document.getElementById("btnAjouter").addEventListener("click", function() {
    const note  = Number(document.getElementById("inputNote").value);
    const coeff = Number(document.getElementById("inputCoeff").value);
 
    // 1. Validation stricte de la note (entre 0 et 20) et du coefficient (entier supérieur ou égal à 1)
    if (isNaN(note)  || note  < 0 || note > 20) {
        alert("Note invalide (0–20)."); 
        return;
    }
    if (isNaN(coeff) || !Number.isInteger(coeff) || coeff < 1) {
        alert("Coefficient invalide (entier ≥ 1)."); 
        return;
    }
 
    // 2. Accumulation pondérée
    sommeNoteCoeff += note * coeff;
    sommeCoeffs    += coeff;
    nbNotes++;
 
    // 3. Rendu dynamique de la ligne dans l'historique
    const div = document.createElement("div");
    div.className = "note-ligne";
    div.innerHTML = \`
        <span><strong>\${note}/20</strong> — coeff \${coeff}</span>
        <span class="note-contrib">\${note} × \${coeff} = \${(note * coeff).toFixed(1)}</span>
    \`;
    document.getElementById("listeNotes").appendChild(div);
 
    // 4. Nettoyage et focus
    document.getElementById("inputNote").value  = "";
    document.getElementById("inputCoeff").value = "";
    document.getElementById("inputNote").focus();
});
 
document.getElementById("btnCalculer").addEventListener("click", function() {
    const res = document.getElementById("resultat");
    res.innerHTML = "";
 
    // Empêcher la division par zéro s'il n'y a aucune note
    if (nbNotes === 0) {
        const e = document.createElement("div");
        e.className = "erreur";
        e.textContent = "Ajoute au moins une note avant de calculer.";
        res.appendChild(e); 
        return;
    }
 
    // Calcul de la moyenne pondérée
    const moyenne = sommeNoteCoeff / sommeCoeffs;
 
    // Tranches de mentions
    let mention, classeCard;
    if (moyenne >= 14) { 
        mention = "🏆 Distinction"; 
        classeCard = "card-ok";  
    } else if (moyenne >= 10) { 
        mention = "✅ Réussite"; 
        classeCard = "card-ok";  
    } else if (moyenne >= 8)  { 
        mention = "⚠️ Ajournement"; 
        classeCard = "card-warn"; 
    } else { 
        mention = "❌ Échec"; 
        classeCard = "card-bad";  
    }
 
    // Rendu de la card finale
    const card = document.createElement("div");
    card.className = \`card \${classeCard}\`;
    card.innerHTML = \`
        <div class="moyenne-affichage">\${moyenne.toFixed(2)} / 20</div>
        <div style="text-align:center;font-size:1.1rem;margin-top:.3rem">
            <strong>\${mention}</strong>
        </div>
        <div style="text-align:center;color:#64748b;font-size:.85rem;margin-top:.3rem">
            \${nbNotes} note(s) — somme coefficients : \${sommeCoeffs}
        </div>
    \`;
    res.appendChild(card);
});
 
// Réinitialisation complète
document.getElementById("btnReset").addEventListener("click", function() {
    sommeNoteCoeff = 0; 
    sommeCoeffs = 0; 
    nbNotes = 0;
    document.getElementById("listeNotes").innerHTML = "";
    document.getElementById("resultat").innerHTML   = "";
    document.getElementById("inputNote").focus();
});
\`\`\`
            `.trim()
        }
    }
];
 
async function seed() {
    console.log("🚀 Seeding UAA5 — Chapitre 10 : Projets finaux...");
    for (const ex of EXERCICES) {
        const { id, ...data } = ex;
        try {
            await db.collection('exercices').doc(id).set(data);
            console.log(`✅ '${id}' ajouté.`);
        } catch (e) {
            console.error(`❌ Erreur pour '${id}':`, e);
        }
    }
    console.log("\n✨ ════════════════════════════════════════");
    console.log("   UAA5 — Programmation impérative : TERMINÉ");
    console.log("   10 chapitres | 22 exercices | 20 seeds");
    console.log("   ════════════════════════════════════════");
    console.log("\nExercices CH10 créés :");
    console.log("  - ch10-ex1-pierre-feuille-ciseaux  (synthèse : Math.random, state, DOM)");
    console.log("  - ch10-ex2-moyenne-ponderee        (synthèse : accumulation, validation, DOM)");
}
 
seed();
exportConfig = {
    projectId: 'profassistant-61fde'
};
