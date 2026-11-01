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

    // 🎨 SCHÉMAS INTERACTIFS & EXPLORATEURS VISUELS (@lt_X Tome 1a)
    activeEmailAnatomyKey: 'cci',
    emailAnatomyZones: {
      identifiant: {
        badge: '1. Identifiant',
        titre: 'Identifiant personnel (ex. lucas.dupont2)',
        couleur: 'blue',
        explication: 'C\'est la partie avant le @ qui désigne la boîte précise de l\'utilisateur. Pas d\'espace, pas d\'accent (é, è, à), uniquement lettres, chiffres, points ou tirets (@lt_X p. 13).'
      },
      arrobase: {
        badge: '2. Symbole @',
        titre: 'L\'arrobase (@) — « chez » (at)',
        couleur: 'rose',
        explication: 'Indispensable dans toute adresse e-mail : il sépare le nom de l\'utilisateur du serveur (domaine) qui héberge sa boîte aux lettres numérique.'
      },
      domaine: {
        badge: '3. Domaine',
        titre: 'Nom de domaine & extension (ex. ecole.be / proton.me)',
        couleur: 'emerald',
        explication: 'Indique l\'organisation ou le service webmail (gmail.com, outlook.com, icloud.com, proton.me) suivi de l\'extension géographique (.be pour la Belgique) ou générique (.com).'
      },
      destinataire_a: {
        badge: 'Champ [ À ]',
        titre: 'Destinataire principal (Pour / À)',
        couleur: 'blue',
        explication: 'La ou les personnes directement concernées de qui tu attends une action ou une réponse.'
      },
      cc: {
        badge: 'Champ [ Cc ]',
        titre: 'Copie Carbone (visible par tous)',
        couleur: 'indigo',
        explication: 'Pour informer quelqu\'un en transparence (ex. ton binôme d\'exposé). Attention : toutes les adresses en Cc sont visibles par tous les destinataires !'
      },
      cci: {
        badge: 'Champ [ Cci ] 🛡️',
        titre: 'Copie Carbone Invisible (Protection RGPD)',
        couleur: 'emerald',
        explication: 'Règle d\'or @lt_X (p. 37 & 64) : obligatoire dès que tu envoies un mail groupé à toute une classe ou à des personnes qui ne se connaissent pas, pour masquer leurs adresses et empêcher le spam.'
      },
      objet: {
        badge: 'Objet',
        titre: 'Objet du courriel (court et précis)',
        couleur: 'amber',
        explication: 'C\'est le titre du message (ex. « Question exposé Histoire - Classe 1A »). On n\'écrit JAMAIS tout son message dans l\'objet et on ne le laisse jamais vide !'
      },
      piece_jointe: {
        badge: '📎 Pièce jointe',
        titre: 'Trombone (Téléverser un fichier ≤ 25 Mo)',
        couleur: 'purple',
        explication: 'Permet de téléverser (Upload ⬆️) un document depuis ton ordinateur vers le mail. Au-delà de 25 Mo, on partage un lien Cloud (Drive/WeTransfer).'
      }
    },

    e2eeVisualMode: 'e2ee', // 'e2ee' | 'plain'
    activeCcLicenseKey: 'BY',
    ccLicensesData: {
      BY: {
        code: 'BY',
        icon: '👤',
        nom: 'Attribution (Obligatoire dans toutes les licences CC)',
        regle: 'Tu dois TOUJOURS citer le nom de l\'auteur original, le titre de l\'œuvre et le lien vers la licence.',
        exemple: 'Tu utilises une photo de Wikimedia Commons dans ton diaporama d\'histoire : tu ajoutes « Photo : M. Peeters (CC BY) » en bas de la diapo.'
      },
      NC: {
        code: 'NC',
        icon: '💶🚫',
        nom: 'Non Commercial (Pas d\'utilisation commerciale)',
        regle: 'Tu peux utiliser l\'œuvre gratuitement pour l\'école ou ton usage personnel, mais INTERDICTION de la vendre ou de gagner de l\'argent avec (ex. vidéo monétisée ou t-shirt vendu).',
        exemple: 'Une musique CC BY-NC peut illustrer ton exposé en classe, mais pas une publicité payante.'
      },
      SA: {
        code: 'SA',
        icon: '🔄',
        nom: 'Share Alike (Partage dans les mêmes conditions)',
        regle: 'Si tu modifies ou remixes l\'œuvre, tu dois obligatoirement publier ta nouvelle création sous la MÊME licence libre.',
        exemple: 'Si tu traduis ou améliores un schéma CC BY-SA, ton nouveau schéma reste libre en CC BY-SA.'
      },
      ND: {
        code: 'ND',
        icon: '🟰',
        nom: 'No Derivatives (Pas de modification)',
        regle: 'Tu peux partager l\'œuvre telle quelle (en citant l\'auteur), mais tu n\'as PAS le droit de la recadrer, la retoucher ou la modifier.',
        exemple: 'Interdit d\'ajouter un filtre ou de couper une illustration sous licence CC BY-ND.'
      }
    },

    activeIcebergLayer: 'passive', // 'active' | 'passive'
    activePegiBienvuTab: 'pegi', // 'pegi' | 'bienvu'
    selectedPictoCode: 'pegi-12',
    pegiPictosData: [
      { code: 'pegi-3', label: 'PEGI 3', color: 'bg-emerald-600', desc: 'Convient à tous les âges. Aucun son ou image susceptible d\'effrayer de jeunes enfants.' },
      { code: 'pegi-7', label: 'PEGI 7', color: 'bg-emerald-500', desc: 'Scènes ou sons pouvant effrayer les plus jeunes (violence très légère / non réaliste type cartoon).' },
      { code: 'pegi-12', label: 'PEGI 12', color: 'bg-amber-500', desc: 'Violence légèrement plus graphique envers des personnages imaginaires ou langage grossier léger.' },
      { code: 'pegi-16', label: 'PEGI 16', color: 'bg-orange-600', desc: 'Violence ou activité sexuelle semblable à la réalité, langage grossier, tabac/alcool ou jeux de hasard.' },
      { code: 'pegi-18', label: 'PEGI 18', color: 'bg-rose-700', desc: 'Réservé aux adultes : violence crue ou motivée par la cruauté, réservé aux 18 ans et plus.' },
      { code: 'pegi-inapp', label: '💳 Achats intégrés', color: 'bg-indigo-700', desc: 'Attention piège : le jeu permet de dépenser du VRAI argent (skins, lootboxes, V-Bucks, gemmes) !' },
      { code: 'pegi-peur', label: '🕷️ Peur / Violence', color: 'bg-slate-800', desc: 'Descripteur de contenu précisant pourquoi la limite d\'âge a été attribuée (peur, violence, langage, en ligne).' }
    ],
    bienvuPictosData: [
      { code: 'bv-tous', label: 'Tous publics', color: 'bg-emerald-600', desc: 'Signalétique belge BienVu (mars 2026) : programme TV/cinéma adapté à tous les spectateurs.' },
      { code: 'bv-6', label: 'BienVu 6', color: 'bg-emerald-500', desc: 'Déconseillé aux moins de 6 ans (peut troubler les tout-petits).' },
      { code: 'bv-9', label: 'BienVu 9', color: 'bg-teal-600', desc: 'Déconseillé aux moins de 9 ans (thèmes ou scènes demandant un premier recul).' },
      { code: 'bv-12', label: 'BienVu 12', color: 'bg-amber-500', desc: 'Déconseillé aux moins de 12 ans (âge d\'entrée en 1re secondaire).' },
      { code: 'bv-14', label: 'BienVu 14', color: 'bg-orange-500', desc: 'Déconseillé aux moins de 14 ans (tensions psychologiques ou violence marquée).' },
      { code: 'bv-16', label: 'BienVu 16', color: 'bg-rose-600', desc: 'Déconseillé aux moins de 16 ans.' },
      { code: 'bv-18', label: 'BienVu 18', color: 'bg-rose-800', desc: 'Déconseillé aux moins de 18 ans (contenus réservés aux adultes).' }
    ],

    // 🎮 MINI-DÉFIS LUDIQUES & PÉDAGOGIQUES (@lt_X Tome 1a — 1 seule récompense XP par défi maîtrisé)
    defisLudiques: {
      // Défi 1 (Ch.1) : Le Traducteur Nétiquette & Citoyenneté (p. 43 & 59)
      netiquette: {
        choices: { s1: null, s2: null, s3: null },
        validated: false,
        score: 0,
        feedback: ''
      },
      // Défi 2 (Ch.2) : Inspecteur de Profil — Le compte de Lucas (p. 125)
      lucasProfil: {
        fixedFlaws: [], // ['visibilite', 'photo_ecole', 'date_naissance', 'telephone', 'statut_absent']
        completed: false
      },
      // Défi 3 (Ch.2) : Révélateur de Permissions — L'appli Lampe de poche de Lina (p. 114)
      linaPermissions: {
        perms: {
          flash_led: true,
          microphone: true,
          contacts: true,
          gps: true,
          galerie: true
        },
        validated: false,
        isCorrect: false,
        feedback: ''
      }
    },

    netiquetteScenarios: [
      {
        id: 's1',
        contexte: 'Il est 22h30 et Yassine n\'arrive pas à ouvrir le PDF de l\'exercice. Il veut écrire à son professeur :',
        messageToxique: '« HÉ MONSIEUR LE FICHIER MARCHE PAS C\'EST QUOI CE TRUC ?? RÉPONDEZ VITE SVP !! »',
        options: [
          { id: 'a', label: 'Renvoyer le même message 5 fois d\'affilée pour faire sonner son téléphone.', correct: false },
          { id: 'b', label: 'Objet précis + « Bonjour Monsieur, je n\'arrive pas à ouvrir le PDF de la p. 14. Pourriez-vous m\'aider demain en classe ? Cordialement, Yassine (1A) ».', correct: true },
          { id: 'c', label: 'Écrire uniquement dans l\'objet : « Monsieur le fichier est cassé aidez-moi » sans texte ni signature.', correct: false }
        ]
      },
      {
        id: 's2',
        contexte: 'Sur le groupe WhatsApp de la classe 1B, un élève poste une photo floue et embarrassante d\'un camarade prise à la cantine :',
        messageToxique: '« 😂😂 Regardez sa tête à midi, partagez à toute l\'école !! »',
        options: [
          { id: 'a', label: 'Mettre un émoji 😂 et transférer au groupe d\'une autre classe (effet boule de neige).', correct: false },
          { id: 'b', label: 'Refuser de partager (droit à l\'image), demander le retrait bienveillant du message et soutenir le camarade.', correct: true },
          { id: 'c', label: 'Insulter violemment l\'auteur en MAJUSCULES sur le groupe public (Flaming).', correct: false }
        ]
      },
      {
        id: 's3',
        contexte: 'La déléguée de classe doit envoyer le lien du sondage de fin d\'année à 28 parents d\'élèves qui ne se connaissent pas :',
        messageToxique: 'Elle met les 28 adresses e-mail privées dans le champ [ À ] visible par tout le monde.',
        options: [
          { id: 'a', label: 'Placer les 28 adresses dans le champ [ Cci ] (Copie Carbone Invisible) pour protéger la vie privée (RGPD).', correct: true },
          { id: 'b', label: 'Placer les 28 adresses dans le champ [ Cc ] (Copie Carbone).', correct: false },
          { id: 'c', label: 'Publier la liste des 28 adresses e-mail en story publique sur Instagram.', correct: false }
        ]
      }
    ],

    lucasProfileFlawsData: [
      {
        id: 'visibilite',
        icon: '🌍',
        dangerLabel: 'Compte en mode PUBLIC (Tout Internet peut voir ses photos)',
        safeLabel: '🔒 Compte basculé en mode PRIVÉ (Amis proches uniquement)',
        explication: 'Sur un réseau social, un profil public permet à de parfaits inconnus, des recruteurs ou des personnes malveillantes de collecter tes photos et informations (@lt_X p. 94 & 125).'
      },
      {
        id: 'photo_ecole',
        icon: '🏫',
        dangerLabel: 'Photo de profil devant le panneau « Collège Saint-Jean - Bruxelles » avec son badge',
        safeLabel: '🎨 Avatar illustré neutre sans nom d\'école ni uniforme identifiable',
        explication: 'Afficher le nom exact de ton école ou de ton club de sport permet à un inconnu de savoir exactement où te trouver dans la vie réelle.'
      },
      {
        id: 'date_naissance',
        icon: '🎂',
        dangerLabel: 'Bio : « Né le 14/05/2013 • Mot de passe préféré : Lucas2013 »',
        safeLabel: '🛡️ Date complète et indice de mot de passe supprimés de la bio',
        explication: 'Ta date de naissance complète facilite l\'usurpation d\'identité et permet de deviner tes mots de passe faibles en 1 seconde !'
      },
      {
        id: 'telephone',
        icon: '📱',
        dangerLabel: 'Contact public : « Mon GSM : 0470 / 12 34 56 — Ajoutez-moi ! »',
        safeLabel: '📵 Numéro de téléphone personnel masqué',
        explication: 'Ne publie jamais ton numéro de GSM ou ton adresse postale en public : risque de spam, d\'arnaques (smishing) et de harcèlement.'
      },
      {
        id: 'statut_absent',
        icon: '🏠',
        dangerLabel: 'Story publique : « Seul à la maison tout le week-end au 12 rue des Lilas ! 🎉 »',
        safeLabel: '🔕 Adresse domicile et absence supprimées',
        explication: 'Annoncer publiquement son adresse et qu\'on est seul chez soi (ou en vacances) est une invitation directe aux cambriolages et aux risques physiques.'
      }
    ],

    getAltxMasteryBadges() {
      const c = this.eleveCompetences || {};
      const badges = [
        {
          id: 'badge-charte',
          icon: '📜',
          title: 'Citoyen de la Charte',
          subtitle: 'Module 0 • Règles & Déconnexion',
          unlocked: Boolean(this.charteState?.finished && this.charteState?.score >= 40)
        },
        {
          id: 'badge-eg',
          icon: '🕵️',
          title: 'Détective des 5 Dossiers',
          subtitle: 'Escape Game • Serveur restauré',
          unlocked: Boolean(this.egState?.finished)
        },
        {
          id: 'badge-ch1',
          icon: '✉️',
          title: 'Maître de la Com\' & E2EE',
          subtitle: 'Chapitre 1 • Courriel, Nétiquette & Cloud',
          unlocked: Boolean(c['NUM-1.P2'] === 'acquis' && (this.defisLudiques?.netiquette?.validated || c['NUM-1.M1'] === 'acquis'))
        },
        {
          id: 'badge-ch2',
          icon: '🛡️',
          title: 'Gardien Cyber & 3P',
          subtitle: 'Chapitre 2 • HTTPS, Traces & Protection',
          unlocked: Boolean(
            c['NUM-2.D4'] === 'acquis' &&
            (this.defisLudiques?.lucasProfil?.completed || this.defisLudiques?.linaPermissions?.isCorrect || c['NUM-2.M1'] === 'acquis')
          )
        }
      ];
      return badges;
    },

    getUnlockedAltxBadgesIds() {
      return this.getAltxMasteryBadges().filter(b => b.unlocked).map(b => b.id);
    },

    choisirReponseDefiNetiquette(scenarioId, optionId) {
      if (!this.defisLudiques?.netiquette) return;
      this.defisLudiques.netiquette.choices[scenarioId] = optionId;
    },

    validerDefiNetiquette() {
      const ch = this.defisLudiques.netiquette.choices;
      if (!ch.s1 || !ch.s2 || !ch.s3) {
        alert('Réponds aux 3 situations avant de valider ton défi Nétiquette !');
        return;
      }
      let score = 0;
      this.netiquetteScenarios.forEach(sc => {
        const picked = sc.options.find(o => o.id === ch[sc.id]);
        if (picked?.correct) score++;
      });
      this.defisLudiques.netiquette.score = score;
      this.defisLudiques.netiquette.validated = (score === 3);
      if (score === 3) {
        this.defisLudiques.netiquette.feedback = '🎉 Sans-faute (3/3) ! Tu maîtrises la Nétiquette, le respect du droit à l\'image et le champ Cci (RGPD) !';
        this.eleveCompetences['NUM-1.D6'] = 'acquis';
        this.eleveCompetences['NUM-1.P6'] = 'acquis';
        this.eleveCompetences['NUM-1.P7'] = 'acquis';
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique('defi:netiquette-ch1', 25, 'Défi Nétiquette & Citoyenneté');
        }
      } else {
        this.defisLudiques.netiquette.feedback = `Score : ${score}/3. Relis bien chaque situation : évite les MAJUSCULES agressives, refuse de relayer une photo humiliante et protège les adresses e-mail avec le champ Cci.`;
      }
      this.syncCurrentStudentProgress();
    },

    corrigerFailleProfilLucas(flawId) {
      if (!this.defisLudiques?.lucasProfil) return;
      const arr = this.defisLudiques.lucasProfil.fixedFlaws || [];
      if (!arr.includes(flawId)) {
        arr.push(flawId);
        this.defisLudiques.lucasProfil.fixedFlaws = [...arr];
      }
      if (this.defisLudiques.lucasProfil.fixedFlaws.length >= 5 && !this.defisLudiques.lucasProfil.completed) {
        this.defisLudiques.lucasProfil.completed = true;
        this.eleveCompetences['NUM-2.D1'] = 'acquis';
        this.eleveCompetences['NUM-2.P4'] = 'acquis';
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique('defi:lucas-profil', 25, 'Inspecteur de Profil (Lucas)');
        }
      }
      this.syncCurrentStudentProgress();
    },

    isLucasFlawFixed(flawId) {
      return Boolean(this.defisLudiques?.lucasProfil?.fixedFlaws?.includes(flawId));
    },

    basculerPermissionLina(permKey) {
      if (!this.defisLudiques?.linaPermissions?.perms) return;
      this.defisLudiques.linaPermissions.perms[permKey] = !this.defisLudiques.linaPermissions.perms[permKey];
    },

    validerDefiPermissionsLina() {
      const p = this.defisLudiques.linaPermissions.perms;
      const isOk = Boolean(p.flash_led && !p.microphone && !p.contacts && !p.gps && !p.galerie);
      this.defisLudiques.linaPermissions.validated = true;
      this.defisLudiques.linaPermissions.isCorrect = isOk;
      if (isOk) {
        this.defisLudiques.linaPermissions.feedback = '🎉 Bravo ! Une application « Lampe de poche » n\'a besoin QUE du Flash LED de l\'appareil photo. Tu as coupé le micro, le GPS, les contacts et la galerie : tes données passives sont protégées !';
        this.eleveCompetences['NUM-2.D4'] = 'acquis';
        this.eleveCompetences['NUM-2.P4'] = 'acquis';
        if (typeof this.attribuerXpUnique === 'function') {
          this.attribuerXpUnique('defi:lina-permissions', 25, 'Révélateur de Permissions (Lina)');
        }
      } else {
        this.defisLudiques.linaPermissions.feedback = '⚠️ Attention ! Réfléchis : de quel unique composant matériel une simple lampe de poche a-t-elle vraiment besoin pour éclairer ? Coupe tous les autres capteurs espions !';
      }
      this.syncCurrentStudentProgress();
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
        const charteKey = `charte:sit-${sit.id || this.charteState.currentIndex}`;
        this.attribuerXpUnique(charteKey, 15, `Situation Charte #${this.charteState.currentIndex + 1}`);
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
        this.attribuerXpUnique('eg:dossier-5', 50, 'Escape Game : Dossier 5 restauré');
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
          this.attribuerXpUnique('eg:dossier-1', 25, 'Escape Game : Dossier 1');
          this.debloquerDossierSuivant(2);
        } else {
          this.egState.feedback = 'Code incorrect. Indice : assemble les 2 parties ("COMM" du chat + radio morse "UNIQUER").';
        }
      } else if (current === 2) {
        if (code === '7319') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Alerte neutralisée ! Le Dossier 2 (SÉCURITÉ) est déverrouillé !';
          this.attribuerXpUnique('eg:dossier-2', 25, 'Escape Game : Dossier 2');
          this.debloquerDossierSuivant(3);
        } else {
          this.egState.feedback = 'Code erroné. Repère les 4 indices suspects dans le mail de phishing.';
        }
      } else if (current === 3) {
        if (code === 'FER') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Exact ! L\'Atomium est un cristal de fer, pas de cuivre ! Dossier 3 (IA) débloqué.';
          this.attribuerXpUnique('eg:dossier-3', 25, 'Escape Game : Dossier 3');
          this.debloquerDossierSuivant(4);
        } else {
          this.egState.feedback = 'Indice : quel matériau compose réellement le cristal de l\'Atomium ?';
        }
      } else if (current === 4) {
        if (code === 'AURORE.PNG' || code === 'AURORE') {
          this.egState.isSuccess = true;
          this.egState.feedback = 'Fichier fantôme identifié avec succès (aurore.png) ! Dossier 4 (DONNÉES) déverrouillé.';
          this.attribuerXpUnique('eg:dossier-4', 25, 'Escape Game : Dossier 4');
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
        const bankKey = `bank:comm:${this.activeSubthemeKey}:q${this.bankQuestionIndex}`;
        const granted = this.attribuerXpUnique(bankKey, 10, `QCM ${this.activeSubthemeKey} Q${this.bankQuestionIndex + 1}`);
        if (granted) this.bankScore += 10;
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
        this.attribuerXpUnique('atelier:email-sim', 20, 'Simulateur Courriel Professionnel');
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
      this.attribuerXpUnique('atelier:mission-app', 30, 'Mission Créative Chapitre 1');
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
        const bankSecuKey = `bank:secu:${this.activeSubthemeKeySecu}:q${this.bankQuestionIndexSecu}`;
        const granted = this.attribuerXpUnique(bankSecuKey, 10, `QCM Sécurité ${this.activeSubthemeKeySecu} Q${this.bankQuestionIndexSecu + 1}`);
        if (granted) this.bankScoreSecu += 10;
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
        this.attribuerXpUnique('atelier:http-banque', 15, 'Inspecteur HTTPS & Certificat TLS');
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
        this.attribuerXpUnique('atelier:tri-donnees', 25, 'Tri Actif vs Passif (6/6)');
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
      this.attribuerXpUnique('atelier:mission-secu', 30, 'Campagne Stop Cyberharcèlement');
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
