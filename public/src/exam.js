import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase/db.js';

const Q = [
  // ── CH1 ──────────────────────────────────────────────────────────────────
  { ch:"CH1", tp:"concept",
    q:"Lequel de ces appels fonctionne correctement ?",
    opts:['Console.log("OK")', 'console.Log("OK")', 'CONSOLE.LOG("OK")', 'console.log("OK")'],
    ok:3,
    ex:"JS est sensible à la casse. Seul console.log() (tout en minuscules) est valide. Les 3 autres lèvent une ReferenceError au lancement." },

  { ch:"CH1", tp:"concept",
    q:"Quel commentaire applique la règle d'or : commenter le POURQUOI, pas le QUOI ?",
    opts:["// On ajoute 1 au score", "// score = score + 1", "// +1 pour kill en headshot — règles du tournoi", "/* Incrémentation */"],
    ok:2,
    ex:"Le bon commentaire apporte une info qu'on ne peut pas déduire du code seul. Les autres répètent simplement ce que le code dit déjà." },

  // ── CH2 ──────────────────────────────────────────────────────────────────
  { ch:"CH2", tp:"code",
    q:"Que se passe-t-il à l'exécution ?",
    code:"const hp = 100;\nhp = 80;",
    opts:["hp vaut 80", "hp vaut 100", "TypeError: Assignment to constant variable", "undefined"],
    ok:2,
    ex:"const crée une liaison immuable. Toute réassignation lève TypeError immédiatement. C'est son rôle : protéger contre les modifications accidentelles." },

  { ch:"CH2", tp:"code",
    q:"Que vaut cette expression ?",
    code:'"5" + 3',
    opts:['8', '"53"', 'NaN', 'TypeError'],
    ok:1,
    ex:'+ avec une string = concaténation. "5" + 3 → "53". Pour une addition : Number("5") + 3 = 8. Piège classique après un prompt().' },

  { ch:"CH2", tp:"code",
    q:"Que renvoie typeof null ?",
    code:"typeof null",
    opts:['"null"', '"undefined"', '"object"', '"boolean"'],
    ok:2,
    ex:'"object" — bug historique de JS depuis 1995, non corrigeable sans casser l\'existant. Pour tester null : toujours === null, jamais typeof.' },

  // ── CH3 ──────────────────────────────────────────────────────────────────
  { ch:"CH3", tp:"code",
    q:"L'utilisateur clique Annuler. Que vaut saisie ?",
    code:'const saisie = prompt("Ton prénom ?");',
    opts:['""', "undefined", "null", "false"],
    ok:2,
    ex:"prompt() renvoie null si l'utilisateur annule. Toujours vérifier if (saisie === null) avant d'utiliser la valeur." },

  { ch:"CH3", tp:"bug",
    q:"Ce code calcule l'âge l'année prochaine. Quel est le bug ?",
    code:'const age = prompt("Ton âge ?");\nconsole.log(age + 1);',
    opts:["prompt() ne peut pas être utilisé ici", "console.log ne peut pas afficher des calculs",
          "age est une string : + va concaténer au lieu d'additionner", "Il manque un point-virgule"],
    ok:2,
    ex:'prompt() renvoie TOUJOURS une string. Si l\'utilisateur tape "17" : "17" + 1 = "171". Correction : const age = Number(prompt("Ton âge ?"));' },

  // ── CH4 ──────────────────────────────────────────────────────────────────
  { ch:"CH4", tp:"code",
    q:"Que vaut cette expression ?",
    code:'"Shadow".charAt(2)',
    opts:['"S"', '"h"', '"a"', '"d"'],
    ok:2,
    ex:"Indices : S=0, h=1, a=2, d=3, o=4, w=5. charAt(2) → \"a\". Même résultat avec \"Shadow\"[2]. Les indices démarrent toujours à 0." },

  { ch:"CH4", tp:"code",
    q:"Que vaut cette expression ?",
    code:'"  JS  ".trim().length',
    opts:["6", "2", "4", "5"],
    ok:1,
    ex:'trim() supprime les espaces de bord : "  JS  " → "JS". Longueur = 2. Les méthodes se chaînent : .trim() renvoie une string, .length s\'applique dessus.' },

  { ch:"CH4", tp:"concept",
    q:"Quelle méthode string renvoie -1 si la valeur n'est pas trouvée ?",
    opts:[".includes()", ".slice()", ".indexOf()", ".charAt()"],
    ok:2,
    ex:".indexOf() renvoie la position de la 1ère occurrence, ou -1 si absent. .includes() renvoie true/false mais pas la position." },

  { ch:"CH4", tp:"bug",
    q:"Ce code est censé afficher le pseudo en majuscules. Quel est le bug ?",
    code:'let pseudo = "shadow_x";\npseudo.toUpperCase();\nconsole.log(pseudo);',
    opts:["toUpperCase() n'existe pas", "pseudo doit être const",
          "Le résultat n'est pas assigné — strings immuables", "Il manque des guillemets"],
    ok:2,
    ex:"Strings immuables : toUpperCase() renvoie une NOUVELLE string sans modifier l'originale. Le résultat est perdu. Correction : const upper = pseudo.toUpperCase();" },

  // ── CH5 ──────────────────────────────────────────────────────────────────
  { ch:"CH5", tp:"code",
    q:"Qu'affiche ce code ?",
    code:'const x = 0;\nif (x) {\n    console.log("vrai");\n} else {\n    console.log("faux");\n}',
    opts:['"vrai"', '"faux"', "rien", "TypeError"],
    ok:1,
    ex:"0 est une valeur falsy — elle s'évalue à false dans une condition. Le bloc else s'exécute. Autres valeurs falsy : false, \"\", null, undefined, NaN." },

  { ch:"CH5", tp:"bug",
    q:"Ce code est censé détecter une note invalide. Quel est le problème logique ?",
    code:'const note = Number(prompt("Note ?"));\nif (note >= 0 && note <= 20) {\n    console.log("Note invalide");\n}',
    opts:["Number() est incorrecte", "|| devrait remplacer &&",
          "La condition est vraie pour les notes VALIDES — logique inversée", "Pas de bug"],
    ok:2,
    ex:'note >= 0 && note <= 20 est vraie pour les notes VALIDES. Le code affiche "invalide" pour ces cas ! Correction : if (note < 0 || note > 20).' },

  { ch:"CH5", tp:"concept",
    q:"Dans un switch, que se passe-t-il si on oublie break ?",
    opts:["SyntaxError au lancement", "La case est ignorée",
          "Le code de la case suivante s'exécute aussi (fall-through)", "Rien — break est optionnel"],
    ok:2,
    ex:"Sans break, JS continue d'exécuter les cases suivantes même si elles ne correspondent pas — fall-through. Toujours mettre break; à la fin de chaque case." },

  { ch:"CH5", tp:"code",
    q:"Que vaut result ?",
    code:'const score = 42;\nconst result = score >= 50 ? "Réussi" : "Échoué";',
    opts:['"Réussi"', '"Échoué"', "true", "false"],
    ok:1,
    ex:"42 >= 50 est false. Le ternaire renvoie la valeur après : quand la condition est false. result = \"Échoué\"." },

  // ── CH6 ──────────────────────────────────────────────────────────────────
  { ch:"CH6", tp:"code",
    q:"Combien de fois console.log s'exécute-t-il ?",
    code:"for (let i = 1; i <= 5; i++) {\n    if (i % 2 === 0) continue;\n    console.log(i);\n}",
    opts:["5 fois", "2 fois", "3 fois", "4 fois"],
    ok:2,
    ex:"continue saute les pairs (i=2, i=4). Restent : 1, 3, 5 → 3 exécutions. continue passe à l'itération suivante sans exécuter le reste du bloc." },

  { ch:"CH6", tp:"concept",
    q:"Quelle est la vraie différence entre while et do...while ?",
    opts:["while est plus performant", "do...while s'exécute toujours au moins une fois",
          "while ne peut pas avoir de break", "Aucune différence"],
    ok:1,
    ex:"while vérifie AVANT d'exécuter. Si la condition est fausse dès le départ, le bloc ne tourne jamais. do...while exécute D'ABORD puis vérifie → garanti au moins 1 tour." },

  { ch:"CH6", tp:"bug",
    q:"Ce code a un problème critique. Lequel ?",
    code:"let i = 0;\nwhile (i < 10) {\n    console.log(i);\n}",
    opts:["i devrait commencer à 1", "La condition devrait être <=",
          "i n'est jamais incrémenté → boucle infinie", "console.log ne fonctionne pas dans while"],
    ok:2,
    ex:"i reste à 0. i < 10 est toujours vraie → boucle infinie, le navigateur plante. Correction : ajouter i++; dans le bloc. Bug n°1 des boucles while." },

  // ── CH7 ──────────────────────────────────────────────────────────────────
  { ch:"CH7", tp:"code",
    q:"Que vaut count après ce code ?",
    code:"let count = 0;\nfor (let i = 1; i <= 10; i++) {\n    if (i % 2 === 0) count++;\n}",
    opts:["4", "5", "6", "10"],
    ok:1,
    ex:"Pairs de 1 à 10 : 2, 4, 6, 8, 10 → 5 nombres. count = 5. Pattern : accumulation conditionnelle (incrémenter uniquement si la condition est vraie)." },

  { ch:"CH7", tp:"bug",
    q:"Ce code cherche le minimum de valeurs positives. Quel est le bug ?",
    code:"let min = 0;\n// Boucle sur des valeurs positives : 5, 3, 8, 1, 4\nif (valeur < min) min = valeur; // cette ligne n'est jamais vraie !",
    opts:["Condition devrait être valeur > min",
          "min = 0 : aucune valeur > 0 ne sera jamais < 0, min ne se met pas à jour",
          "Il faudrait utiliser Math.min()", "Pas de bug"],
    ok:1,
    ex:"Si min=0 et toutes les valeurs sont > 0 : valeur < 0 est toujours fausse. min reste 0 — résultat faux. Correction : let min = null; if (min === null || valeur < min) min = valeur;" },
];

const TYPE_LABEL = { concept:"Concept", code:"Prédiction", bug:"Trouve le bug" };
const TYPE_ICON  = { concept:"ti-book-2", code:"ti-player-play", bug:"ti-bug" };
const CH_LIST    = ["CH1","CH2","CH3","CH4","CH5","CH6","CH7"];

const CHAPTER_MAPPING = {
  "CH1": "CH1 — Introduction à JavaScript",
  "CH2": "CH2 — Variables, types et opérateurs",
  "CH3": "CH3 — Entrées / Sorties interactives",
  "CH4": "CH4 — Chaînes de caractères",
  "CH5": "CH5 — Conditions",
  "CH6": "CH6 — Boucles",
  "CH7": "CH7 — Structures combinées"
};

export class ExamManager {
  constructor() {
    this.container = document.getElementById('examView');
    this.questions = [...Q];
    this.cur = 0;
    this.sel = null;
    this.conf = false;
    this.scores = [];
    this.done = false;
    this.onBackToLobbyCallback = null;
  }

  init(onBackToLobby) {
    this.onBackToLobbyCallback = onBackToLobby;
    this.injectExamViewSkeleton();
  }

  injectExamViewSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="exam-wrapper">
        <div id="examQuizArea"></div>
        <div id="examResultsArea" class="hidden"></div>
      </div>
    `;
  }

  start(disabledChapters = []) {
    // Filtrer les questions basées sur les chapitres désactivés
    this.questions = Q.filter(q => {
      const dbChapterName = CHAPTER_MAPPING[q.ch];
      return !disabledChapters.includes(dbChapterName);
    });

    if (this.questions.length === 0) {
      alert("Aucune question n'est disponible pour les chapitres actuellement actifs.");
      if (this.onBackToLobbyCallback) this.onBackToLobbyCallback();
      return;
    }

    this.cur = 0;
    this.sel = null;
    this.conf = false;
    this.scores = [];
    this.done = false;

    document.getElementById('examQuizArea').classList.remove('hidden');
    document.getElementById('examResultsArea').classList.add('hidden');
    
    this.renderQuestion();
  }

  isExamActive() {
    return !this.done && this.scores.length > 0;
  }

  selectOption(i) {
    if (this.conf) return;
    this.sel = i;
    this.renderQuestion();
  }

  confirmAnswer() {
    if (this.sel === null || this.conf) return;
    this.conf = true;
    const isCorrect = this.sel === this.questions[this.cur].ok;
    this.scores.push(isCorrect);
    this.renderQuestion();
  }

  next() {
    if (this.cur < this.questions.length - 1) {
      this.cur++;
      this.sel = null;
      this.conf = false;
      this.renderQuestion();
    } else {
      this.done = true;
      this.finishExam();
    }
  }

  isCode(opt) {
    return /^["']/.test(opt) || /^[a-z]+\(/.test(opt) || opt.startsWith(".") || /^\d+$/.test(opt);
  }

  renderQuestion() {
    const quizArea = document.getElementById('examQuizArea');
    if (!quizArea) return;

    const q = this.questions[this.cur];
    const total = this.questions.length;
    const pct = Math.round((this.cur / total) * 100);

    const isRight = this.sel === q.ok;

    // Badges classes & icons
    let badgeClass = "badge-info";
    let badgeIcon = "ti-book-2";
    if (q.tp === "code") {
      badgeClass = "badge-success";
      badgeIcon = "ti-player-play";
    } else if (q.tp === "bug") {
      badgeClass = "badge-danger";
      badgeIcon = "ti-bug";
    }

    // Code block
    const codeHtml = q.code ? `<pre class="exam-code-block">${this.escapeHTML(q.code)}</pre>` : "";

    // Options mapping
    const optionsHtml = q.opts.map((opt, i) => {
      let optClass = "exam-opt-card";
      let circClass = "exam-circ";
      let circContent = String.fromCharCode(65 + i);

      if (this.conf) {
        if (i === q.ok) {
          optClass += " opt-correct";
          circClass += " circ-correct";
          circContent = `<span class="ti-check-icon">✓</span>`;
        } else if (i === this.sel) {
          optClass += " opt-incorrect";
          circClass += " circ-incorrect";
          circContent = `<span class="ti-x-icon">✕</span>`;
        } else {
          optClass += " opt-disabled";
        }
      } else if (i === this.sel) {
        optClass += " opt-selected";
        circClass += " circ-selected";
      }

      const fontStyle = this.isCode(opt) ? "font-family: var(--font-mono, monospace);" : "";

      return `
        <div class="${optClass}" role="button" tabindex="${this.conf ? -1 : 0}" data-index="${i}">
          <span class="${circClass}">${circContent}</span>
          <span style="${fontStyle}">${this.escapeHTML(opt)}</span>
        </div>
      `;
    }).join('');

    // Feedback
    let feedbackHtml = "";
    if (this.conf) {
      feedbackHtml = `
        <div class="exam-feedback-box ${isRight ? 'fb-correct' : 'fb-incorrect'}">
          <div class="exam-feedback-header">
            ${isRight ? '✓ Correct !' : '✕ Incorrect'}
          </div>
          <div class="exam-feedback-body">${this.escapeHTML(q.ex)}</div>
        </div>
      `;
    }

    // Action button
    let actionBtnHtml = "";
    if (!this.conf && this.sel !== null) {
      actionBtnHtml = `
        <button id="examConfirmBtn" class="btn-primary">
          Valider
        </button>
      `;
    } else if (this.conf) {
      actionBtnHtml = `
        <button id="examNextBtn" class="btn-primary">
          ${this.cur < total - 1 ? 'Question suivante' : 'Voir les résultats'} ➔
        </button>
      `;
    }

    quizArea.innerHTML = `
      <!-- Progression -->
      <div class="exam-progress-container">
        <div class="exam-progress-text">
          <span>Question ${this.cur + 1} sur ${total}</span>
          <span>${pct}%</span>
        </div>
        <div class="exam-progress-bar-bg">
          <div class="exam-progress-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>

      <!-- Badges -->
      <div class="exam-badge-row">
        <span class="exam-badge badge-secondary">${q.ch}</span>
        <span class="exam-badge ${badgeClass}">
          <span class="exam-badge-icon">${q.tp === "concept" ? "📚" : q.tp === "code" ? "▶️" : "🪲"}</span>
          ${TYPE_LABEL[q.tp]}
        </span>
      </div>

      <!-- Question Text -->
      <div class="exam-question-text">${this.escapeHTML(q.q)}</div>
      ${codeHtml}

      <!-- Options Grid -->
      <div class="exam-options-grid">${optionsHtml}</div>

      <!-- Feedback -->
      ${feedbackHtml}

      <!-- Actions -->
      <div class="exam-action-row">${actionBtnHtml}</div>
    `;

    // Listeners
    quizArea.querySelectorAll('.exam-opt-card').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.getAttribute('data-index'));
        this.selectOption(index);
      });
    });

    const confirmBtn = document.getElementById('examConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmAnswer());
    }

    const nextBtn = document.getElementById('examNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }
  }

  async finishExam() {
    document.getElementById('examQuizArea').classList.add('hidden');
    const resultsArea = document.getElementById('examResultsArea');
    resultsArea.classList.remove('hidden');

    const correct = this.scores.filter(Boolean).length;
    const total = this.scores.length;
    const pct = Math.round((correct / total) * 100);

    let msgColor = "var(--color-text-danger, #ef4444)";
    if (pct >= 70) msgColor = "var(--color-text-success, #22c55e)";
    else if (pct >= 50) msgColor = "var(--color-text-warning, #f59e0b)";

    let evaluationMsg = "Continue à pratiquer, tu y es presque !";
    if (pct >= 80) evaluationMsg = "Excellent — les bases sont solides !";
    else if (pct >= 60) evaluationMsg = "Bien — quelques points à revoir.";

    // Chapter breakdowns
    const chaps = {};
    this.questions.forEach((q, i) => {
      if (!chaps[q.ch]) chaps[q.ch] = { ok: 0, tot: 0 };
      chaps[q.ch].tot++;
      if (this.scores[i]) chaps[q.ch].ok++;
    });

    const chapterBarsHtml = CH_LIST.filter(ch => chaps[ch]).map(ch => {
      const chPct = Math.round((chaps[ch].ok / chaps[ch].tot) * 100);
      let barFillColor = "var(--color-text-danger, #ef4444)";
      if (chaps[ch].ok === chaps[ch].tot) barFillColor = "var(--color-text-success, #22c55e)";
      else if (chaps[ch].ok > chaps[ch].tot / 2) barFillColor = "var(--color-text-warning, #f59e0b)";

      return `
        <div class="exam-result-chapter-row">
          <span class="exam-result-chapter-name">${ch}</span>
          <div class="exam-result-chapter-bar-bg">
            <div class="exam-result-chapter-bar-fill" style="width: ${chPct}%; background-color: ${barFillColor};"></div>
          </div>
          <span class="exam-result-chapter-score">${chaps[ch].ok}/${chaps[ch].tot}</span>
        </div>
      `;
    }).join('');

    // Wrongs review list
    const wrongs = this.questions.filter((_, i) => !this.scores[i]);
    let wrongsHtml = "";
    if (wrongs.length > 0) {
      wrongsHtml = `
        <div class="exam-wrongs-section">
          <div class="exam-wrongs-title">À revoir (${wrongs.length})</div>
          ${this.questions.map((q, i) => !this.scores[i] ? `
            <div class="exam-wrong-item">
              <div class="exam-wrong-item-q"><strong>${q.ch}</strong> — ${this.escapeHTML(q.q)}</div>
              <div class="exam-wrong-item-ans">Bonne réponse : <span>${this.escapeHTML(q.opts[q.ok])}</span></div>
            </div>
          ` : '').join('')}
        </div>
      `;
    }

    resultsArea.innerHTML = `
      <div class="exam-results-card">
        <!-- Hero -->
        <div class="exam-results-hero">
          <div class="exam-results-score" style="color: ${msgColor};">${correct}/${total}</div>
          <div class="exam-results-pct">${pct}%</div>
          <div class="exam-results-msg">${evaluationMsg}</div>
        </div>

        <!-- Breakdown -->
        <div class="exam-results-breakdown-box">
          <div class="exam-results-breakdown-title">Résultats par chapitre</div>
          <div class="exam-results-chapters-list">${chapterBarsHtml}</div>
        </div>

        <!-- Wrongs -->
        ${wrongsHtml}

        <!-- Actions -->
        <button id="examRestartBtn" class="btn-primary" style="width: 100%; margin-top: 16px;">
          🔄 Recommencer l'examen
        </button>
      </div>
    `;

    document.getElementById('examRestartBtn').addEventListener('click', () => {
      this.start();
    });

    // Enregistrer les résultats de l'élève dans Firestore
    try {
      const studentEmail = document.getElementById('userEmail')?.textContent || "anonyme@test.com";
      await addDoc(collection(db, "exam_results"), {
        email_eleve: studentEmail,
        nom_eleve: studentEmail.split('@')[0],
        date: new Date().toISOString(),
        score: correct,
        total: total,
        pct: pct,
        breakdown: chaps
      });
      console.log("📊 Résultats de l'examen enregistrés dans Firestore.");
    } catch (e) {
      console.error("Erreur lors de l'enregistrement des résultats de l'examen:", e);
    }
  }

  escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
