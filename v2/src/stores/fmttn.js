import chapterData from '../data/chapitre-1-communication.json';
import chapter2Data from '../data/chapitre-2-securite.json';
import competencesData from '../data/competences-fmttn.json';
import module0Data from '../data/module-0-introduction.json';
import altxBank from '../data/altx-bank.json';
import escapeGameData from '../data/escape-game-data.json';
import { marked } from 'marked';
import { savePresentationConfig } from '../services/firebase.js';

/**
 * Mélange de façon déterministe ou aléatoire par session un tableau d'options
 * pour que la bonne réponse ne soit JAMAIS systématiquement en première position.
 */
function shuffleChoicesArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Pré-mélanger une fois par session toutes les questions de altxBank (Chapitre 1 & Chapitre 2)
Object.values(altxBank.comm || {}).forEach(sub => {
  (sub.questions || []).forEach(q => {
    if (Array.isArray(q.choices) && q.choices.length > 1) {
      q.choices = shuffleChoicesArray(q.choices);
    }
  });
});
Object.values(altxBank.secu || {}).forEach(sub => {
  (sub.questions || []).forEach(q => {
    if (Array.isArray(q.choices) && q.choices.length > 1) {
      q.choices = shuffleChoicesArray(q.choices);
    }
  });
});

/**
 * Convertit le texte brut `lecon` de altxBank en cartes HTML visuelles et aérées pour des élèves de 11-12 ans,
 * avec mise en évidence des encadrés officiels @lt_X : 🧠 Cerveau, 💡 Le savais-tu ?, 💼 Métier, 🤖 IA.
 */
function formatAltxLeconHtml(rawLecon) {
  if (!rawLecon) return '';
  const blocks = String(rawLecon).trim().split(/\n\s*\n/);

  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const firstLine = lines[0].trim();

    // Si le bloc commence par un titre en **gras**
    const titleMatch = firstLine.match(/^\*\*(.+?)\*\*$/);
    if (titleMatch) {
      const titleText = titleMatch[1];
      const bodyLines = lines.slice(1);

      if (bodyLines.length === 0) {
        return `<div class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-2xs">${titleText}</div>`;
      }

      // Détection des encadrés pédagogiques officiels @lt_X
      const isCerveau = titleText.includes('🧠') || titleText.toLowerCase().includes('cerveau');
      const isSavaisTu = titleText.includes('💡') || titleText.toLowerCase().includes('savais-tu');
      const isMetier = titleText.includes('💼') || titleText.toLowerCase().includes('métier');
      const isIA = titleText.includes('🤖') || titleText.toLowerCase().includes('ia');

      let cardClasses = 'bg-slate-50 border-slate-200/90';
      let headerClasses = 'text-indigo-950 border-slate-200/70';
      let dotColor = 'bg-blue-600';
      let bulletColor = 'text-blue-600';

      if (isCerveau) {
        cardClasses = 'bg-purple-50/80 border-purple-200';
        headerClasses = 'text-purple-950 border-purple-200/70';
        dotColor = 'bg-purple-600';
        bulletColor = 'text-purple-600';
      } else if (isSavaisTu) {
        cardClasses = 'bg-amber-50/80 border-amber-200';
        headerClasses = 'text-amber-950 border-amber-200/70';
        dotColor = 'bg-amber-500';
        bulletColor = 'text-amber-600';
      } else if (isMetier) {
        cardClasses = 'bg-emerald-50/80 border-emerald-200';
        headerClasses = 'text-emerald-950 border-emerald-200/70';
        dotColor = 'bg-emerald-600';
        bulletColor = 'text-emerald-600';
      } else if (isIA) {
        cardClasses = 'bg-indigo-50/80 border-indigo-200';
        headerClasses = 'text-indigo-950 border-indigo-200/70';
        dotColor = 'bg-indigo-600';
        bulletColor = 'text-indigo-600';
      }

      const itemsHtml = bodyLines.map(l => {
        const clean = l.trim().replace(/^(→|•)\s*/, '');
        const formatted = clean
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-extrabold">$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 font-mono text-[11px] text-indigo-900">$1</code>');
        if (l.trim().startsWith('→') || l.trim().startsWith('•')) {
          return `<li class="flex items-start gap-2 py-0.5"><span class="${bulletColor} font-black mt-0.5">▸</span><span>${formatted}</span></li>`;
        }
        return `<p class="text-slate-700 leading-relaxed">${formatted}</p>`;
      }).join('');

      const hasList = bodyLines.some(l => l.trim().startsWith('→') || l.trim().startsWith('•'));
      return `<div class="p-3.5 rounded-2xl border space-y-1.5 ${cardClasses}">
        <div class="font-black text-xs flex items-center gap-1.5 border-b pb-1.5 ${headerClasses}">
          <span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
          <span>${titleText}</span>
        </div>
        ${hasList ? `<ul class="space-y-1 text-xs text-slate-700 pt-0.5">${itemsHtml}</ul>` : `<div class="text-xs text-slate-700 pt-0.5 space-y-1">${itemsHtml}</div>`}
      </div>`;
    }

    // Bloc sur une seule ligne de type "**Terme :** définition"
    const singleFormatted = block
      .replace(/^\*\*(.+?)\*\*\s*(.*)$/gm, '<div class="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs"><strong class="text-blue-950 font-black">$1</strong> <span class="text-slate-700">$2</span></div>')
      .replace(/^→\s*(.+)$/gm, '<div class="flex items-start gap-2 text-xs text-slate-700 pl-2"><span class="text-blue-600 font-bold">▸</span><span>$1</span></div>');

    return singleFormatted;
  }).join('');
}

export function createFmttnStore() {
  return {
    selectedModuleId: 'module-0',
    activeTab: 'decouvre',

    module0: module0Data,
    chapter: chapterData,
    chapter2: chapter2Data,
    competences: competencesData.chapitres[0].competences,
    competencesCh2: competencesData.chapitres[1]?.competences,
    altxBank: altxBank,
    escapeGame: escapeGameData,

    activeSlideIndex: 0,
    notebooklmUrl: 'https://notebooklm.google.com',

    activeSubthemeKey: 'reseaux',
    bankQuestionIndex: 0,
    bankUserSelection: null,
    bankSubmitted: false,
    bankIsCorrect: false,
    bankScore: 0,

    eleveCompetences: {
      'NUM-1.D1': 'en_cours',
      'NUM-1.D2': 'en_cours',
      'NUM-1.D3': 'en_cours',
      'NUM-1.D4': 'en_cours',
      'NUM-1.D5': 'en_cours',
      'NUM-1.D6': 'en_cours',
      'NUM-1.D7': 'en_cours',
      'NUM-1.D8': 'en_cours',
      'NUM-1.P1': 'en_cours',
      'NUM-1.P2': 'en_cours',
      'NUM-1.P3': 'en_cours',
      'NUM-1.P4': 'en_cours',
      'NUM-1.P5': 'en_cours',
      'NUM-1.P6': 'en_cours',
      'NUM-1.P7': 'en_cours',
      'NUM-1.P8': 'en_cours',
      'NUM-1.P9': 'en_cours',
      'NUM-1.M1': 'en_cours',
      'NUM-2.D1': 'en_cours',
      'NUM-2.D2': 'en_cours',
      'NUM-2.D3': 'en_cours',
      'NUM-2.D4': 'en_cours',
      'NUM-2.D5': 'en_cours',
      'NUM-2.D6': 'en_cours',
      'NUM-2.D7': 'en_cours',
      'NUM-2.D8': 'en_cours',
      'NUM-2.D9': 'en_cours',
      'NUM-2.P1': 'en_cours',
      'NUM-2.P2': 'en_cours',
      'NUM-2.P3': 'en_cours',
      'NUM-2.P4': 'en_cours',
      'NUM-2.P5': 'en_cours',
      'NUM-2.M1': 'en_cours',
      'NUM-2.M2': 'en_cours'
    },

    bilanPersonnel: {
      'NUM-1.D1': 'bien',
      'NUM-1.D2': 'bien',
      'NUM-1.D3': 'moyen',
      'NUM-1.D4': 'bien',
      'NUM-1.D5': 'moyen',
      'NUM-1.D6': 'bien',
      'NUM-1.D7': 'bien',
      'NUM-1.D8': 'moyen',
      'NUM-1.P1': 'bien',
      'NUM-1.P2': 'moyen',
      'NUM-1.P5': 'bien',
      'NUM-1.P7': 'bien',
      'NUM-1.P9': 'moyen',
      'NUM-1.M1': 'moyen'
    },

    charteState: {
      currentIndex: 0,
      userChoice: null,
      hasAnswered: false,
      score: 0,
      finished: false
    },

    egState: {
      teamName: 'Équipe Nexus',
      activeDossier: 1,
      dossierUnlocked: [1],
      inputCode: '',
      feedback: '',
      isSuccess: false,
      timer: '38:42',
      finished: false,
      foundPhish: new Set(),
      phishDigits: ['_', '_', '_', '_'],
      searchFile: '',
      selectedFile: null,
      dossier5Selections: {
        'histoire.docx': '',
        'paysage.png': '',
        'jingle.mp3': '',
        'expose.pptx': ''
      }
    },

    emailSim: {
      destinataire: 'secretariat@ecole.be',
      cc: '',
      cci: 'direction@ecole.be, professeur@ecole.be',
      objet: 'Demande de renseignement concernant la sortie scolaire',
      corps: 'Bonjour Madame, Monsieur,\n\nJe vous écris pour savoir à quelle heure est prévu le retour de la visite vendredi.\n\nEn vous remerciant d\'avance,\nCordialement,\nLucas Moreau (1A)',
      hasAttachment: false,
      validationResults: null
    },

    missionApp: {
      nom: 'ClasseConnect 1A',
      cible: 'Élèves et professeurs de l\'école pour les devoirs',
      fonctionUnique: 'Mode silence qui bloque les notifications de jeux pendant les révisions de 17h à 19h.',
      reglesUsage: 'Respect absolu de la vie privée, interdiction de partager les photos sans accord écrit, modération bienveillante.',
      isSubmitted: false,
      aiFeedback: ''
    },

    activeSubthemeKeySecu: 'profil',
    bankQuestionIndexSecu: 0,
    bankUserSelectionSecu: null,
    bankSubmittedSecu: false,
    bankIsCorrectSecu: false,
    bankScoreSecu: 0,

    httpSim: {
      scenarioActif: 'ecole',
      scenarios: {
        ecole: {
          titre: 'Portail de l\'école (Wi-Fi public)',
          url: 'http://connexion-college.be/login.php',
          isHttps: false,
          protocole: 'HTTP',
          statut: 'Non sécurisé ⚠️',
          couleur: 'rose',
          explication: 'Alerte ! Ce site utilise HTTP sans chiffrement. Si tu te connectes sur le Wi-Fi de l\'école ou un hotspot public, ton mot de passe passe en texte clair (comme une carte postale) et peut être intercepté par n\'importe qui !'
        },
        banque: {
          titre: 'Espace Bancaire & Scolaire',
          url: 'https://banque-securisee.be/espace-client',
          isHttps: true,
          protocole: 'HTTPS',
          statut: 'Chiffré & Certifié 🔒',
          couleur: 'emerald',
          explication: 'Excellent ! Le cadenas et le "S" de HTTPS confirment que la communication est chiffrée avec un certificat SSL/TLS. Les données sont illisibles pendant le transport.'
        },
        piege: {
          titre: 'Site Promo Cadeaux Gratuits',
          url: 'https://cadeaux-gratuits-gagne-un-iphone.xyz/',
          isHttps: true,
          protocole: 'HTTPS',
          statut: 'Chiffré mais frauduleux ⚠️',
          couleur: 'amber',
          explication: 'Attention au piège classique (@lt_X p. 106-107) ! Le cadenas HTTPS prouve que personne n\'intercepte les données en route, mais cela ne prouve PAS que le site est honnête ! Un escroc peut très bien obtenir un certificat HTTPS gratuit pour son site de phishing.'
        }
      }
    },

    triDonnees: {
      items: [
        { id: 1, label: "Une photo de mon chat postée en story publique ou un formulaire rempli", typeReel: "active", choixEleve: null, icone: "📸" },
        { id: 2, label: "Les métadonnées cachées d'une photo (heure, GPS, modèle de smartphone)", typeReel: "passive", choixEleve: null, icone: "🌐" },
        { id: 3, label: "Mon commentaire ou ma réponse à un sondage en ligne", typeReel: "active", choixEleve: null, icone: "💬" },
        { id: 4, label: "Les cookies publicitaires et le temps exact passé sur une vidéo", typeReel: "passive", choixEleve: null, icone: "⏱️" },
        { id: 5, label: "Mon historique de navigation et ma géolocalisation en arrière-plan", typeReel: "passive", choixEleve: null, icone: "📍" },
        { id: 6, label: "Le message privé envoyé volontairement à mon binôme de classe", typeReel: "active", choixEleve: null, icone: "✉️" }
      ],
      score: 0,
      valide: false,
      feedback: ''
    },

    bilanPersonnelCh2: {
      'NUM-2.D1': 'bien',
      'NUM-2.D2': 'bien',
      'NUM-2.D3': 'moyen',
      'NUM-2.D4': 'moyen',
      'NUM-2.D5': 'bien',
      'NUM-2.D6': 'bien',
      'NUM-2.D7': 'bien',
      'NUM-2.D8': 'moyen',
      'NUM-2.D9': 'bien',
      'NUM-2.P1': 'bien',
      'NUM-2.P2': 'moyen',
      'NUM-2.P3': 'moyen',
      'NUM-2.P4': 'bien',
      'NUM-2.P5': 'bien',
      'NUM-2.M1': 'moyen',
      'NUM-2.M2': 'moyen'
    },

    missionSecu: {
      typeCampagne: 'cyberharcelement',
      slogan: 'L\'écran n\'est pas un masque : ce que tu ne dirais pas en face, ne l\'écris pas en ligne !',
      reflexe1: 'Faire une capture d\'écran immédiate comme preuve avant toute suppression.',
      reflexe2: 'Bloquer le compte harceleur et signaler le comportement aux modérateurs.',
      reflexe3: 'En parler immédiatement à un adulte de confiance ou appeler le 103 (Écoute-Enfants) / 116 000 (Child Focus).',
      isSubmitted: false,
      aiFeedback: ''
    },

    getAllCompetencesCh1() {
      const c = this.competences || {};
      return [...(c.je_decouvre || []), ...(c.je_pratique || []), ...(c.je_maitrise || [])];
    },

    getAllCompetencesCh2() {
      const c = this.competencesCh2 || {};
      return [...(c.je_decouvre || []), ...(c.je_pratique || []), ...(c.je_maitrise || [])];
    },

    getCurrentCharteSituation() {
      const situations = this.module0?.parties?.[1]?.situations || [];
      return situations[this.charteState.currentIndex] || { 
        id: "none", 
        scenario: "Théo termine son travail, se déconnecte de sa session et éteint l'écran de l'ordinateur.", 
        est_ok: true, 
        explication: "Bravo ! Théo respecte le matériel et protège ses données personnelles en fermant sa session." 
      };
    },

    repondreCharte(choice) {
      if (this.charteState.hasAnswered) return;
      const sit = this.getCurrentCharteSituation();
      this.charteState.userChoice = choice;
      this.charteState.hasAnswered = true;

      if (choice === sit.est_ok) {
        this.charteState.score += 10;
        this.user.xp += 15;
        this.tutorMood = 'happy';
      } else {
        this.tutorMood = 'thinking';
      }

      this.syncCurrentStudentProgress();
    },

    charteSuivante() {
      const situations = this.module0?.parties?.[1]?.situations || [];
      if (this.charteState.currentIndex < situations.length - 1) {
        this.charteState.currentIndex++;
        this.charteState.userChoice = null;
        this.charteState.hasAnswered = false;
      } else {
        this.charteState.finished = true;
        this.syncCurrentStudentProgress();
      }
    },

    situationCharteSuivante() {
      this.charteSuivante();
    },

    recommencerCharte() {
      this.charteState.currentIndex = 0;
      this.charteState.userChoice = null;
      this.charteState.hasAnswered = false;
      this.charteState.score = 0;
      this.charteState.finished = false;
    },

    reinitialiserCharte() {
      this.recommencerCharte();
    },

    clickPhishSusp(key) {
      if (this.egState.foundPhish.has(key)) return;
      this.egState.foundPhish.add(key);
      const order = ['sender', 'urgent', 'password', 'link'];
      const map = { sender: '7', urgent: '3', password: '1', link: '9' };
      this.egState.phishDigits = order.map(k => this.egState.foundPhish.has(k) ? map[k] : '_');
    },

    getFichiersServeurFiltres() {
      const list = this.escapeGame?.dossiers?.[3]?.fichiers_serveur || [];
      const q = (this.egState.searchFile || '').toLowerCase().trim();
      if (!q) return list;
      return list.filter(f => 
        f.nom.toLowerCase().includes(q) || 
        f.proprio.toLowerCase().includes(q) || 
        f.type.toLowerCase().includes(q)
      );
    },

    selectionnerFichierDossier4(fichier) {
      this.egState.selectedFile = fichier;
      this.egState.inputCode = fichier.nom;
    },

    validerDossier5() {
      const sel = this.egState.dossier5Selections;
      const correct = (
        sel['histoire.docx'] === 'Traitement de texte' &&
        sel['paysage.png'] === 'Éditeur d\'image' &&
        sel['jingle.mp3'] === 'Lecteur audio' &&
        sel['expose.pptx'] === 'Logiciel de présentation'
      );

      if (correct) {
        this.egState.isSuccess = true;
        this.egState.feedback = 'Bravo ! Tu as associé chaque extension au bon outil numérique ! Dossier 5 restauré 🎉';
        this.egState.finished = true;
        this.user.xp += 50;
        this.syncCurrentStudentProgress();
      } else {
        this.egState.feedback = 'Certaines associations sont incorrectes. Vérifie : .docx pour le texte, .png pour l\'image, .mp3 pour le son et .pptx pour la présentation.';
      }
    },

    validerCodeDossier() {
      const code = this.egState.inputCode.trim().toUpperCase().replace(/\s/g, '');
      const current = this.egState.activeDossier;

      if (current === 1) {
        if (code === 'COMMUNIQUER') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Bravo ! Le Dossier 1 (COMMUNICATION) est déverrouillé !';
          this.user.xp += 25;
          this.debloquerDossierSuivant(2);
        } else {
          this.egState.feedback = 'Code incorrect. Indice : assemble les 2 parties ("COMM" du chat + radio morse "UNIQUER").';
        }
      } else if (current === 2) {
        if (code === '7319') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Alerte neutralisée ! Le Dossier 2 (SÉCURITÉ) est déverrouillé !';
          this.user.xp += 25;
          this.debloquerDossierSuivant(3);
        } else {
          this.egState.feedback = 'Code erroné. Repère les 4 indices suspects dans le mail de phishing.';
        }
      } else if (current === 3) {
        if (code === 'FER') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Exact ! L\'Atomium est un cristal de fer, pas de cuivre ! Dossier 3 (IA) débloqué.';
          this.user.xp += 25;
          this.debloquerDossierSuivant(4);
        } else {
          this.egState.feedback = 'Indice : quel matériau compose réellement le cristal de l\'Atomium ?';
        }
      } else if (current === 4) {
        if (code === 'AURORE.PNG' || code === 'AURORE') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Fichier fantôme identifié avec succès (aurore.png) ! Dossier 4 (DONNÉES) déverrouillé.';
          this.user.xp += 25;
          this.debloquerDossierSuivant(5);
        } else {
          this.egState.feedback = 'Vérifie dans l\'explorateur : Image de Sam du 12/09 pesant plus de 5 Mo.';
        }
      }
    },

    debloquerDossierSuivant(num) {
      if (!this.egState.dossierUnlocked.includes(num)) {
        this.egState.dossierUnlocked.push(num);
      }
      this.syncCurrentStudentProgress();

      setTimeout(() => {
        this.egState.activeDossier = num;
        this.egState.inputCode = '';
        this.egState.feedback = '';
        this.egState.isSuccess = false;
      }, 1500);
    },

    getActiveSubtheme() {
      return this.altxBank.comm[this.activeSubthemeKey] || this.altxBank.comm.reseaux;
    },

    getFormattedActiveLecon() {
      return formatAltxLeconHtml(this.getActiveSubtheme()?.lecon || '');
    },

    getCurrentBankQuestion() {
      const st = this.getActiveSubtheme();
      return st.questions[this.bankQuestionIndex] || st.questions[0];
    },

    selectBankChoice(choice) {
      if (this.bankSubmitted) return;
      this.bankUserSelection = choice;
    },

    validerBankReponse() {
      if (!this.bankUserSelection) return;
      const q = this.getCurrentBankQuestion();
      this.bankSubmitted = true;
      this.bankIsCorrect = (this.bankUserSelection === q.rep);

      if (this.bankIsCorrect) {
        this.bankScore += 10;
        this.user.xp += 10;
        this.tutorMood = 'happy';

        if (this.activeSubthemeKey === 'reseaux') {
          this.eleveCompetences['NUM-1.D1'] = 'acquis';
          this.eleveCompetences['NUM-1.D2'] = 'acquis';
        }
        if (this.activeSubthemeKey === 'messagerie') {
          this.eleveCompetences['NUM-1.D5'] = 'acquis';
          this.eleveCompetences['NUM-1.P1'] = 'acquis';
        }
        if (this.activeSubthemeKey === 'ethique') {
          this.eleveCompetences['NUM-1.D6'] = 'acquis';
          this.eleveCompetences['NUM-1.D7'] = 'acquis';
          this.eleveCompetences['NUM-1.D8'] = 'acquis';
          this.eleveCompetences['NUM-1.P5'] = 'acquis';
          this.eleveCompetences['NUM-1.P7'] = 'acquis';
        }
        if (this.activeSubthemeKey === 'collaboration') {
          this.eleveCompetences['NUM-1.D3'] = 'acquis';
          this.eleveCompetences['NUM-1.D4'] = 'acquis';
          this.eleveCompetences['NUM-1.P9'] = 'acquis';
        }
      } else {
        this.tutorMood = 'thinking';
      }

      this.syncCurrentStudentProgress();
    },

    bankQuestionSuivante() {
      const st = this.getActiveSubtheme();
      if (this.bankQuestionIndex < st.questions.length - 1) {
        this.bankQuestionIndex++;
        this.bankUserSelection = null;
        this.bankSubmitted = false;
        this.bankIsCorrect = false;
      } else {
        alert(`Entraînement terminé ! Score : ${this.bankScore} points.`);
        this.bankQuestionIndex = 0;
        this.bankUserSelection = null;
        this.bankSubmitted = false;
      }
    },

    changeSubtheme(key) {
      this.activeSubthemeKey = key;
      this.bankQuestionIndex = 0;
      this.bankUserSelection = null;
      this.bankSubmitted = false;
      this.bankIsCorrect = false;
    },

    analyserEmailSimule() {
      const text = this.emailSim.corps.toLowerCase();
      const obj = this.emailSim.objet.trim();
      const cci = this.emailSim.cci.trim();

      const results = {
        objetOk: obj.length >= 5 && obj.length <= 80,
        politesseDebut: text.includes('bonjour') || text.includes('madame') || text.includes('monsieur') || text.includes('cher'),
        politesseFin: text.includes('cordialement') || text.includes('salutations') || text.includes('bien à vous') || text.includes('merci'),
        signature: text.includes(this.user.nom.toLowerCase().split(' ')[0]) || text.includes('moreau') || text.includes(this.user.classe.toLowerCase()),
        cciProtege: cci.includes('@'),
        pasMajuscules: !/[A-Z]{8,}/.test(this.emailSim.corps)
      };

      results.scoreGlobal = Object.values(results).filter(Boolean).length;
      this.emailSim.validationResults = results;

      if (results.scoreGlobal >= 5) {
        this.eleveCompetences['NUM-1.P2'] = 'acquis';
        this.eleveCompetences['NUM-1.P6'] = 'acquis';
        this.eleveCompetences['NUM-1.P8'] = 'acquis';
        this.user.xp += 20;
      } else {
        this.eleveCompetences['NUM-1.P2'] = 'en_cours';
      }

      this.syncCurrentStudentProgress();
    },

    setBilanItem(code, niveau) {
      this.bilanPersonnel[code] = niveau;
      this.syncCurrentStudentProgress();
    },

    soumettreMissionApp() {
      this.missionApp.isSubmitted = true;
      this.missionApp.aiFeedback = `Excellente proposition pour ton outil "${this.missionApp.nom}" ! L'idée du ${this.missionApp.fonctionUnique} répond parfaitement à l'objectif de concentration numérique. Tes règles d'éthique sont claires et conformes à la nétiquette @lt_X. Compétence NUM-1.M1 validée !`;
      this.eleveCompetences['NUM-1.M1'] = 'acquis';
      this.user.xp += 30;
      this.syncCurrentStudentProgress();
    },

    getActiveSubthemeSecu() {
      return this.altxBank.secu[this.activeSubthemeKeySecu] || this.altxBank.secu.profil;
    },

    getFormattedActiveLeconSecu() {
      return formatAltxLeconHtml(this.getActiveSubthemeSecu()?.lecon || '');
    },

    getCurrentBankQuestionSecu() {
      const st = this.getActiveSubthemeSecu();
      return st.questions[this.bankQuestionIndexSecu] || st.questions[0];
    },

    selectBankChoiceSecu(choice) {
      if (this.bankSubmittedSecu) return;
      this.bankUserSelectionSecu = choice;
    },

    validerBankReponseSecu() {
      if (!this.bankUserSelectionSecu) return;
      const q = this.getCurrentBankQuestionSecu();
      this.bankSubmittedSecu = true;
      this.bankIsCorrectSecu = (this.bankUserSelectionSecu === q.rep);

      if (this.bankIsCorrectSecu) {
        this.bankScoreSecu += 10;
        this.user.xp += 10;
        this.tutorMood = 'happy';

        if (this.activeSubthemeKeySecu === 'profil') {
          this.eleveCompetences['NUM-2.D1'] = 'acquis';
          this.eleveCompetences['NUM-2.P4'] = 'acquis';
        }
        if (this.activeSubthemeKeySecu === 'signaletique') {
          this.eleveCompetences['NUM-2.D2'] = 'acquis';
          this.eleveCompetences['NUM-2.D3'] = 'acquis';
        }
        if (this.activeSubthemeKeySecu === 'cyber') {
          this.eleveCompetences['NUM-2.D6'] = 'acquis';
          this.eleveCompetences['NUM-2.D7'] = 'acquis';
          this.eleveCompetences['NUM-2.D9'] = 'acquis';
          this.eleveCompetences['NUM-2.P2'] = 'acquis';
        }
        if (this.activeSubthemeKeySecu === 'confidentialite') {
          this.eleveCompetences['NUM-2.D5'] = 'acquis';
          this.eleveCompetences['NUM-2.P1'] = 'acquis';
          this.eleveCompetences['NUM-2.P3'] = 'acquis';
          this.eleveCompetences['NUM-2.P5'] = 'acquis';
        }
        if (this.activeSubthemeKeySecu === 'identite') {
          this.eleveCompetences['NUM-2.D4'] = 'acquis';
          this.eleveCompetences['NUM-2.D8'] = 'acquis';
          this.eleveCompetences['NUM-2.M2'] = 'acquis';
        }
      } else {
        this.tutorMood = 'thinking';
      }

      this.syncCurrentStudentProgress();
    },

    bankQuestionSuivanteSecu() {
      const st = this.getActiveSubthemeSecu();
      if (this.bankQuestionIndexSecu < st.questions.length - 1) {
        this.bankQuestionIndexSecu++;
        this.bankUserSelectionSecu = null;
        this.bankSubmittedSecu = false;
        this.bankIsCorrectSecu = false;
      } else {
        alert(`Entraînement Sécurité terminé ! Score : ${this.bankScoreSecu} points.`);
        this.bankQuestionIndexSecu = 0;
        this.bankUserSelectionSecu = null;
        this.bankSubmittedSecu = false;
      }
    },

    changeSubthemeSecu(key) {
      this.activeSubthemeKeySecu = key;
      this.bankQuestionIndexSecu = 0;
      this.bankUserSelectionSecu = null;
      this.bankSubmittedSecu = false;
      this.bankIsCorrectSecu = false;
    },

    choisirScenarioHttp(key) {
      this.httpSim.scenarioActif = key;
      if (key === 'banque') {
        this.eleveCompetences['NUM-2.D3'] = 'acquis';
        this.user.xp += 15;
        this.syncCurrentStudentProgress();
      }
    },

    classerDonneeTri(itemId, typeChoisi) {
      const item = this.triDonnees.items.find(i => i.id === itemId);
      if (item) {
        item.choixEleve = typeChoisi;
      }
    },

    validerTriDonnees() {
      let score = 0;
      let toutRempli = true;
      this.triDonnees.items.forEach(item => {
        if (!item.choixEleve) toutRempli = false;
        if (item.choixEleve === item.typeReel) score++;
      });

      if (!toutRempli) {
        alert('Veuillez classer les 6 éléments avant de valider.');
        return;
      }

      this.triDonnees.score = score;
      this.triDonnees.valide = true;
      if (score === 6) {
        this.triDonnees.feedback = 'Bravo ! 6/6 sans faute ! Tu distingues parfaitement ce que tu publies (données actives / explicites) des traces automatiques (données passives / implicites : métadonnées, cookies, GPS). Compétence NUM-2.D4 validée ! 🎉';
        this.user.xp += 25;
        this.eleveCompetences['NUM-2.D4'] = 'acquis';
      } else {
        this.triDonnees.feedback = `Score : ${score}/6. Rappel (@lt_X p. 114-115) : les données passives sont celles récoltées automatiquement sans que tu tapes du texte (métadonnées GPS/heure d'une photo, cookies, adresse IP, temps d'écran).`;
        this.eleveCompetences['NUM-2.D4'] = 'en_cours';
      }
      this.syncCurrentStudentProgress();
    },

    setBilanItemCh2(code, niveau) {
      this.bilanPersonnelCh2[code] = niveau;
      this.syncCurrentStudentProgress();
    },

    soumettreMissionSecu() {
      this.missionSecu.isSubmitted = true;
      this.missionSecu.aiFeedback = `Excellente campagne citoyenne ! Ton slogan "${this.missionSecu.slogan}" est percutant et responsabilisant pour des élèves de 1re. Tes 3 réflexes (conserver la preuve par capture d'écran, bloquer & signaler, alerter un adulte ou le 103 Écoute-Enfants / 116 000 Child Focus) respectent exactement le protocole de prévention FWB / SeGEC et l'article 442bis du Code pénal belge. Compétences NUM-2.M1 et NUM-2.M2 validées !`;
      this.user.xp += 30;
      this.eleveCompetences['NUM-2.M1'] = 'acquis';
      this.eleveCompetences['NUM-2.M2'] = 'acquis';
      this.syncCurrentStudentProgress();
    },

    getCurrentModuleSlides() {
      if (this.selectedModuleId === 'module-0') {
        return this.module0?.support_cours?.slides || [];
      }
      if (this.selectedModuleId === 'ch2-securite') {
        return this.chapter2?.support_cours?.slides || [];
      }
      return this.chapter?.support_cours?.slides || [];
    },

    getCurrentSlide() {
      const slides = this.getCurrentModuleSlides();
      return slides[this.activeSlideIndex] || slides[0] || { titre: "Présentation", contenu: "Support en cours de préparation." };
    },

    nextSlide() {
      const slides = this.getCurrentModuleSlides();
      if (this.activeSlideIndex < slides.length - 1) {
        this.activeSlideIndex++;
      } else {
        this.activeSlideIndex = 0;
      }
    },

    prevSlide() {
      const slides = this.getCurrentModuleSlides();
      if (this.activeSlideIndex > 0) {
        this.activeSlideIndex--;
      } else {
        this.activeSlideIndex = slides.length - 1;
      }
    },

    getNotebookLMUrl() {
      if (this.selectedModuleId === 'module-0') {
        return this.module0?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
      }
      if (this.selectedModuleId === 'ch2-securite') {
        return this.chapter2?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
      }
      return this.chapter?.support_cours?.notebooklm_url || 'https://notebooklm.google.com';
    },

    async sauvegarderNotebookLMConfig(moduleId, newUrl) {
      if (!newUrl) return;
      if (moduleId === 'module-0') {
        if (!this.module0.support_cours) this.module0.support_cours = {};
        this.module0.support_cours.notebooklm_url = newUrl;
      } else if (moduleId === 'ch2-securite') {
        if (!this.chapter2.support_cours) this.chapter2.support_cours = {};
        this.chapter2.support_cours.notebooklm_url = newUrl;
      } else {
        if (!this.chapter.support_cours) this.chapter.support_cours = {};
        this.chapter.support_cours.notebooklm_url = newUrl;
      }
      await savePresentationConfig(moduleId, { notebooklm_url: newUrl });
      alert('Lien NotebookLM enregistré avec succès dans Firestore !');
    }
  };
}
