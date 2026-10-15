import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, getFirestoreCoursesList, getCourseModulesFromFirestore, saveCourseStudioBundle } from "./firebase.js";

/**
 * FMTTN 1re — Cours officiel SeGEC / @lt_X intégré par défaut dans la V2
 */
export const FMTTN_COURSE_DEF = {
  id: "fmttn-1re",
  workspaceType: "fmttn",
  title: "Numérique FMTTN 1re (@lt_X)",
  pitch: "Programme officiel SeGEC — Charte, Escape Game, Communication & Collaboration, Sécurité & Traces numériques.",
  systemPrompt: `Tu es le Tuteur Socratique d'@lt_X pour des élèves de 1re secondaire (11-12 ans) en Belgique (programme SeGEC / FMTTN).
Ton rôle :
1. Être chaleureux, encourageant et clair (mots simples, phrases courtes).
2. Ne JAMAIS donner la réponse directement : pose une question guidée ou donne un indice sous forme d'analogie de la vie quotidienne.
3. Rappelle les principes de respect de la vie privée (RGPD), de sécurité et de nétiquette.
4. Si l'élève parle de courriel, rappelle l'astuce de 'Cci' = Invisible, 'Cc' = visible par tous.`,
  theme: {
    primaryColor: "#4f46e5",
    icon: "🤖"
  },
  chapters: [
    { id: "module-0", title: "Module 0 : Bienvenue & Charte informatique" },
    { id: "escape-game", title: "Escape Game : 5 dossiers d'investigation" },
    { id: "ch1-communication", title: "Chapitre 1 : Communication & Collaboration" },
    { id: "ch2-securite", title: "Chapitre 2 : Sécurité & Données personnelles" }
  ]
};

/**
 * Banque d'exercices d'amorce par cours
 */
export const DEFAULT_EXERCISES_BY_COURSE = {
  "bureautique-3e": [
    {
      id: "bur-ex1",
      course_id: "bureautique-3e",
      chapitre: "bur-ch2",
      titre: "Mise en page d'un rapport de stage",
      consigne: "Crée un document Google Docs avec un titre principal (**Titre 1**), deux sous-sections (**Titre 2**), des marges standard (2,5 cm) et une table des matières automatique.",
      theorie_md: "### Rappels Google Docs\n\n- Sélectionne ton texte et utilise **Format > Styles de paragraphe** pour appliquer Titre 1 et Titre 2.\n- Insère le sommaire dynamique via **Insertion > Table des matières**.\n- Pense à l'espace insécable `Ctrl+Maj+Espace` avant les deux-points (:).",
      external_tools: [
        { name: "Google Docs", url: "https://docs.google.com" },
        { name: "Google Drive", url: "https://drive.google.com" }
      ],
      submission_type: "drive_link"
    },
    {
      id: "bur-ex2",
      course_id: "bureautique-3e",
      chapitre: "bur-ch1",
      titre: "Organisation & Partage Drive",
      consigne: "Crée une arborescence de dossiers dans Google Drive : `Mon École > 3e Secondaire > Bureautique`. Partage le dossier en mode 'Lecteur' et colle le lien ci-dessous.",
      theorie_md: "### Partage dans Google Drive\n\n- Fais un clic droit sur le dossier > **Partager**.\n- Définis l'accès général sur *Tous les utilisateurs disposant du lien* en mode **Lecteur**.",
      external_tools: [
        { name: "Google Drive", url: "https://drive.google.com" }
      ],
      submission_type: "drive_link"
    }
  ],
  "dactylo-3e": [
    {
      id: "dac-ex1",
      course_id: "dactylo-3e",
      chapitre: "dac-ch1",
      titre: "La ligne de base (QSDF - JKLM)",
      consigne: "Entraîne-toi à taper les lettres de la ligne de base sans baisser les yeux vers le clavier. Objectif : au moins 20 mots/minute avec 90% de précision.",
      theorie_md: "### Posture & Positionnement\n\n- Index gauche sur le **F** (repère tactile), index droit sur le **J**.\n- Dos bien droit, pouces sur la barre d'espace.",
      external_tools: [
        { name: "AgileFingers", url: "https://agilefingers.com/fr" }
      ],
      submission_type: "text"
    }
  ],
  "creation-site-web": [
    {
      id: "web-ex1",
      course_id: "creation-site-web",
      chapitre: "web-ch1",
      titre: "Ma première carte HTML & CSS",
      consigne: "Crée une carte de profil comprenant un titre `<h1>`, une courte description dans un `<p>` et un bouton d'action interactif stylisé avec CSS.",
      theorie_md: "### Structure HTML5\n\n- Utilise des balises sémantiques (`<header>`, `<main>`, `<article>`).\n- En CSS, utilise `display: flex;` pour centrer et aérer tes composants.",
      starter_code: {
        html: `<div class="carte">
  <h1>Mon Portfolio Web</h1>
  <p>Bienvenue sur mon premier projet interactif développé en UAA3 !</p>
  <button id="btnAction">Découvrir mes réalisations</button>
</div>`,
        css: `body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.carte {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 420px;
}
h1 {
  color: #1e293b;
  margin-top: 0;
}
p {
  color: #64748b;
  line-height: 1.6;
}
button {
  background: #e85d2c;
  color: white;
  border: none;
  padding: 12px 24px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}
button:hover {
  background: #c2410c;
  transform: translateY(-2px);
}`,
        js: `document.getElementById('btnAction').addEventListener('click', () => {
  alert('Bravo ! Tu as cliqué sur le bouton avec succès ! 🚀');
});`
      },
      submission_type: "code"
    }
  ],
  "js-uaa5-classic": [
    {
      id: "js-ex1",
      course_id: "js-uaa5-classic",
      chapitre: "ch2",
      titre: "Calculatrice de Prix TTC",
      consigne: "Écris une fonction JavaScript qui calcule le prix TTC à partir d'un montant HT et d'un taux de TVA (par exemple 21%). Affiche le résultat dans la page.",
      theorie_md: "### Formule mathématique\n\n\`\`\`js\nprixTTC = prixHT * (1 + tauxTVA / 100);\n\`\`\`",
      starter_code: {
        html: `<div style="padding: 24px; font-family: sans-serif; max-width: 400px; margin: auto;">
  <h2>Calculateur TTC (21%)</h2>
  <label for="prix">Montant HT (€) :</label>
  <input id="prix" type="number" value="100" style="width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #cbd5e1; border-radius: 6px;" />
  <button id="btnCalculer" style="background: #eab308; color: #1e293b; font-weight: bold; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer;">Calculer le TTC</button>
  <div id="resultat" style="margin-top: 16px; font-weight: bold; color: #0f172a;"></div>
</div>`,
        css: `body { background: #f8fafc; }`,
        js: `document.getElementById('btnCalculer').addEventListener('click', () => {
  const ht = parseFloat(document.getElementById('prix').value) || 0;
  const ttc = (ht * 1.21).toFixed(2);
  document.getElementById('resultat').innerText = 'Montant TTC : ' + ttc + ' €';
});`
      },
      submission_type: "code"
    }
  ],
  "studio-creatif": [
    {
      id: "studio-ex1",
      course_id: "studio-creatif",
      chapitre: "studio-ch1",
      titre: "Affiche & Storytelling de Marque",
      consigne: "Utilise une IA générative d'images (ou Canva) pour concevoir l'affiche promotionnelle d'un projet créatif. Rédige ton prompt et colle le lien de ton travail.",
      theorie_md: "### Formuler un bon prompt créatif\n\n1. **Sujet** : description nette et précise.\n2. **Style** : cinéma, 3D render, aquarelle, photo réaliste...\n3. **Lumière & Ambiance** : néon, coucher de soleil, studio...",
      external_tools: [
        { name: "Google Gemini", url: "https://gemini.google.com" },
        { name: "Canva", url: "https://canva.com" }
      ],
      submission_type: "creative_link"
    }
  ],
  "rap-academy": [
    {
      id: "rap-ex1",
      course_id: "rap-academy",
      chapitre: "rap-ch1",
      titre: "Identité de Label & Cover de Single",
      consigne: "Crée l'identité visuelle de ton label musical : logo, nom de scène, et maquette de cover.",
      theorie_md: "### Direction Artistique\n\nChoisis une palette de 2 à 3 couleurs fortes et une typographie percutante.",
      external_tools: [
        { name: "Canva Studio", url: "https://canva.com" }
      ],
      submission_type: "creative_link"
    }
  ],
  "pilote-redaction": [
    {
      id: "redac-ex1",
      course_id: "pilote-redaction",
      chapitre: "red-mod1",
      titre: "Plaidoyer : Faut-il encadrer l'usage des smartphones à l'école ?",
      consigne: "Rédige un texte argumentatif structuré (environ 80 à 150 mots) comprenant : une **thèse claire**, **deux arguments** illustrés chacun par un exemple concret, des **connecteurs logiques** (*d'abord, en effet, cependant, par conséquent*) et une **conclusion**.",
      theorie_md: "### Structure d'un paragraphe argumenté\n\n1. **Thèse** : L'idée que tu défends.\n2. **Arguments** : Les raisons qui prouvent ta thèse (*D'une part..., D'autre part...*).\n3. **Exemples** : Un fait précis ou vécu (*Par exemple...*).\n4. **Conclusion** : Synthèse finale (*Ainsi, en conclusion...*).",
      submission_type: "redaction"
    }
  ],
  "pilote-langues": [
    {
      id: "lang-ex1",
      course_id: "pilote-langues",
      chapitre: "lang-mod1",
      titre: "Roleplay CECRL A2/B1 : Commander dans un café à Londres & résoudre un imprévu",
      consigne: "Engage la conversation en anglais (ou néerlandais) : commande une boisson et un plat, pose une question sur les ingrédients (allergie ou préférence) et réagis poliment si le serveur s'est trompé dans l'addition.",
      theorie_md: "### Expressions clés (CECRL A2/B1)\n\n- *Could I have ..., please?*\n- *Does this dish contain ...?*\n- *Excuse me, I think there is a small mistake in the bill.*",
      submission_type: "langues"
    }
  ],
  "pilote-sciences": [
    {
      id: "sci-ex1",
      course_id: "pilote-sciences",
      chapitre: "sci-mod1",
      titre: "Théorème de Pythagore & Énergie Cinétique ($E_c = \\frac{1}{2} m v^2$)",
      consigne: "Un cycliste et son vélo ont une masse totale $m = 80\\text{ kg}$ et roulent à une vitesse $v = 5\\text{ m/s}$. Calcule l'énergie cinétique $E_c$ en Joules ($\\text{J}$) en détaillant : les données, la formule utilisée, le calcul et l'unité finale.",
      theorie_md: "### Rappel Scientifique (KaTeX)\n\nL'énergie cinétique d'un corps en mouvement se calcule avec :\n\n$$E_c = \\frac{1}{2} \\cdot m \\cdot v^2$$\n\n- $m$ : masse en kilogrammes ($\\text{kg}$)\n- $v$ : vitesse en mètres par seconde ($\\text{m/s}$)\n- $E_c$ : énergie en Joules ($\\text{J}$)",
      submission_type: "sciences"
    }
  ]
};

export const MULTI_SUBJECT_PILOT_COURSES = [
  {
    id: "pilote-redaction",
    workspaceType: "redaction",
    title: "Français & Histoire : Rédaction & Argumentation",
    pitch: "Pilote Multi-Matières — Structure tes idées, rédige des textes argumentés avec connecteurs logiques et reçois un guidage socratique.",
    systemPrompt: "Tu es un professeur de français, d'histoire et d'argumentation socratique et bienveillant. Aide l'élève à structurer sa pensée (thèse, arguments, exemples précis, connecteurs logiques, conclusion) sans jamais rédiger le paragraphe à sa place.",
    theme: { primaryColor: "#be123c", icon: "✍️" },
    chapters: [
      {
        id: "red-mod1",
        title: "Module 1 : Construire une argumentation solide",
        theorie_md: "# Construire une argumentation solide\n\nArgumenter, c'est défendre un point de vue (**la thèse**) à l'aide de preuves logiques (**les arguments**) illustrées par des **exemples concrets**.\n\n### Les connecteurs logiques indispensables\n- **Introduire** : *Tout d'abord, en premier lieu...*\n- **Ajouter** : *De plus, par ailleurs, en outre...*\n- **Nuancer** : *Cependant, toutefois, néanmoins...*\n- **Conclure** : *En conclusion, par conséquent, ainsi...*"
      }
    ]
  },
  {
    id: "pilote-langues",
    workspaceType: "langues",
    title: "Langues Vivantes : Jeux de Rôle CECRL (EN / NL)",
    pitch: "Pilote Multi-Matières — Pratique l'anglais et le néerlandais en situation réelle (niveaux A1 à B2) avec écoute vocale et feedback communicatif.",
    systemPrompt: "Tu es un tuteur de langues vivantes dynamique (cadre européen CECRL A1 à B2). Engage l'élève dans un jeu de rôle immersif, encourage-le à s'exprimer dans la langue cible et reformule avec douceur ses erreurs grammaticales ou lexicales.",
    theme: { primaryColor: "#0284c7", icon: "🗣️" },
    chapters: [
      {
        id: "lang-mod1",
        title: "Module 1 : Interactions du quotidien (CECRL A2 / B1)",
        theorie_md: "# Interactions du quotidien (CECRL A2 / B1)\n\nDans ce module, tu pratiques la langue en situation authentique.\n\n### Astuces pour réussir ton jeu de rôle\n1. Utilise des formules de politesse (*Could you..., Zou u...*).\n2. Fais des phrases complètes avec des mots de liaison (*because, however, omdat, maar*).\n3. Relis ta production à voix haute grâce au bouton 🔊."
      }
    ]
  },
  {
    id: "pilote-sciences",
    workspaceType: "sciences",
    title: "Sciences & Maths : Raisonnement & Formules (KaTeX)",
    pitch: "Pilote Multi-Matières — Résous des problèmes scientifiques et mathématiques étape par étape avec rendu de formules LaTeX/KaTeX en direct.",
    systemPrompt: "Tu es un professeur de mathématiques et de sciences socratique et rigoureux. Guide l'élève étape par étape dans son raisonnement scientifique (données connues, formule en LaTeX/KaTeX, unités du Système International) sans donner le résultat final.",
    theme: { primaryColor: "#059669", icon: "🔬" },
    chapters: [
      {
        id: "sci-mod1",
        title: "Module 1 : Méthode de résolution & Formules physiques",
        theorie_md: "# Méthode de résolution en Sciences & Mathématiques\n\nChaque problème scientifique se résout en **4 étapes rigoureuses** :\n\n1. **Données connues** (converties dans le Système International).\n2. **Formule littérale** : par exemple le théorème de Pythagore $a^2 + b^2 = c^2$ ou l'énergie cinétique :\n\n$$E_c = \\frac{1}{2} \\cdot m \\cdot v^2$$\n\n3. **Calcul détaillé**.\n4. **Résultat final avec son unité** ($\\text{J}$, $\\text{m/s}$, $\\text{N}$...)."
      }
    ]
  }
];

export class CourseManagerV2 {
  constructor() {
    this.courses = [];
    this.activeCourse = null;
    this.activeChapter = null;
    this.storageKey = "profassistant_active_course_id";
  }

  /**
   * Normalise le type d'atelier d'un cours
   */
  normalizeWorkspaceType(c) {
    if (c.workspaceType) {
      if (c.workspaceType === "bureautique") return "office";
      return c.workspaceType;
    }
    if (c.id === "creation-site-web" || c.id === "js-uaa5-classic") return "coding";
    if (c.id === "rap-academy" || c.id === "studio-creatif") return "creative";
    if (c.id === "bureautique-3e" || c.id === "dactylo-3e") return "office";
    return "office";
  }

  /**
   * Charge l'ensemble des cours :
   * 1. En priorité depuis Firestore `cours/{id}` (Phase 10)
   * 2. En secours / fusion depuis `public/cours/manifest.json`
   * 3. Intègre le cours FMTTN 1re
   */
  async loadCoursesCatalogue(includeDrafts = false) {
    try {
      let localCourses = [];
      try {
        const res = await fetch("/cours/manifest.json");
        if (res.ok) {
          localCourses = await res.json();
        }
      } catch (err) {
        console.warn("[CourseManagerV2] Erreur lecture manifest.json :", err);
      }

      const firestoreCourses = await getFirestoreCoursesList(includeDrafts);
      const fsMap = new Map();
      firestoreCourses.forEach(fc => {
        fsMap.set(fc.id, {
          ...fc,
          folder: fc.folder || fc.id,
          workspaceType: this.normalizeWorkspaceType(fc),
          chapters: fc.chapters || [],
          source: 'firestore'
        });
      });

      // Normalisation des cours statiques (utilisés en secours si absents de Firestore)
      const normalizedLocal = localCourses.map(c => {
        if (fsMap.has(c.id)) {
          const fsCourse = fsMap.get(c.id);
          fsMap.delete(c.id);
          return fsCourse;
        }
        return {
          ...c,
          folder: c.folder || c.id,
          workspaceType: this.normalizeWorkspaceType(c),
          chapters: c.chapters || [],
          source: 'static'
        };
      });

      const customFirestoreCourses = Array.from(fsMap.values()).filter(c => c.id !== "fmttn-1re");
      const fmttnCourse = fsMap.get("fmttn-1re") || FMTTN_COURSE_DEF;

      const allCourses = [
        fmttnCourse,
        ...normalizedLocal.filter(c => c.id !== "fmttn-1re"),
        ...customFirestoreCourses,
        ...MULTI_SUBJECT_PILOT_COURSES.filter(pc => !fsMap.has(pc.id) && !normalizedLocal.some(nl => nl.id === pc.id))
      ];
      this.courses = allCourses;

      const savedCourseId = localStorage.getItem(this.storageKey);
      if (savedCourseId) {
        this.activeCourse = this.courses.find(c => c.id === savedCourseId) || this.courses[0];
      } else {
        this.activeCourse = this.courses[0];
      }

      if (this.activeCourse?.chapters?.length) {
        this.activeChapter = this.activeCourse.chapters[0];
      }

      return this.courses;
    } catch (e) {
      console.error("[CourseManagerV2] Erreur chargement catalogue :", e);
      this.courses = [FMTTN_COURSE_DEF];
      this.activeCourse = FMTTN_COURSE_DEF;
      return this.courses;
    }
  }

  selectCourse(courseId) {
    const found = this.courses.find(c => c.id === courseId);
    if (found) {
      this.activeCourse = found;
      this.activeChapter = found.chapters?.[0] || null;
      localStorage.setItem(this.storageKey, found.id);
      return found;
    }
    return null;
  }

  selectChapter(chapterId) {
    if (!this.activeCourse || !this.activeCourse.chapters) return null;
    const found = this.activeCourse.chapters.find(ch => ch.id === chapterId);
    if (found) {
      this.activeChapter = found;
      return found;
    }
    return null;
  }

  /**
   * Trouve le chapitre/module du cours associé à un exercice ou un libellé Firestore
   */
  findChapterByDbLabel(course, dbChapterLabel, exId = "") {
    if (!course || !Array.isArray(course.chapters) || course.chapters.length === 0) return null;
    const rawLabel = String(dbChapterLabel || "").toLowerCase().trim();
    const rawExId = String(exId || "").toLowerCase().trim();

    // 1. Correspondance exacte d'identifiant
    const exact = course.chapters.find(ch => String(ch.id || "").toLowerCase() === rawLabel);
    if (exact) return exact;

    // 2. Correspondance par inclusion de titre (ex: "Module 1 : La posture..." <-> "Module 1")
    for (const ch of course.chapters) {
      const chTitle = String(ch.title || "").toLowerCase().trim();
      const chId = String(ch.id || "").toLowerCase().trim();
      if (rawLabel && chTitle && (rawLabel.includes(chTitle) || chTitle.includes(rawLabel))) {
        return ch;
      }
      if (rawExId && chId && rawExId.startsWith(chId)) {
        return ch;
      }
    }

    // 3. Correspondance par numéro de module/chapitre/niveau (ex: "CH1", "ch01", "Module 2", "Niveau 3", "dac-ch1")
    const extractNum = (str) => {
      const m = String(str).match(/(?:module|chapitre|ch|niveau|mod|niv)[\s\-_]*0*([1-9][0-9]*)/i);
      return m ? Number(m[1]) : null;
    };

    const targetNum = extractNum(rawLabel) || extractNum(rawExId);
    if (targetNum !== null) {
      for (let i = 0; i < course.chapters.length; i++) {
        const ch = course.chapters[i];
        const chNum = extractNum(ch.id) || extractNum(ch.title) || (i + 1);
        if (chNum === targetNum) {
          return ch;
        }
      }
    }

    // 4. Correspondance par mots-clés significatifs du titre (ex: "ligne supérieure", "flexbox", "tableaux")
    const stopWords = new Set(['module', 'chapitre', 'niveau', 'dans', 'avec', 'pour', 'les', 'des', 'une', 'sur', 'par', 'aux', 'introduction', 'base', 'bases']);
    const tokenize = (s) => String(s)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 4 && !stopWords.has(w));

    const labelTokens = tokenize(`${rawLabel} ${rawExId}`);
    if (labelTokens.length > 0) {
      let bestChapter = null;
      let bestScore = 0;
      for (const ch of course.chapters) {
        const chTokens = new Set(tokenize(`${ch.title} ${ch.file || ''}`));
        let score = 0;
        labelTokens.forEach(t => {
          if (chTokens.has(t)) score++;
        });
        if (score > bestScore) {
          bestScore = score;
          bestChapter = ch;
        }
      }
      if (bestScore > 0 && bestChapter) {
        return bestChapter;
      }
    }

    return null;
  }

  /**
   * Retourne l'URL du fichier Markdown
   */
  getCourseFileUrl(course, fileName) {
    const folder = course.folder || course.id;
    return `/cours/${folder}/${fileName}`;
  }

  /**
   * Charge le contenu Markdown d'un module/chapitre :
   * 1. En priorité depuis Firestore `cours/{id}/modules/{mid}` (`theorie_md`)
   * 2. En secours depuis `public/cours/<folder>/<file>.md`
   */
  async loadChapterMarkdown(course, chapter) {
    if (!course || !chapter) return "";

    if (typeof chapter.theorie_md === "string" && chapter.theorie_md.trim()) {
      return chapter.theorie_md;
    }

    if (course.id && chapter.id) {
      try {
        const modSnap = await getDoc(doc(db, "cours", course.id, "modules", chapter.id));
        if (modSnap.exists() && modSnap.data()?.theorie_md) {
          return modSnap.data().theorie_md;
        }
      } catch (_) {}
    }

    if (!chapter.file) {
      return `# ${chapter.title}\n\n*Support de cours éditable dans le Course Studio.*`;
    }

    const url = this.getCourseFileUrl(course, chapter.file);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      console.warn(`[CourseManagerV2] Impossible de charger le cours ${url} :`, e);
      return `# ${chapter.title}\n\n*Le support de cours est accessible dans votre manuel ou en ligne.*`;
    }
  }

  /**
   * Migre les 6 cours statiques (`public/cours/manifest.json`) vers Firestore (`cours/{id}`, `modules/{mid}`, `exercices`)
   */
  async migrateStaticCoursesToFirestore() {
    const res = await fetch("/cours/manifest.json");
    if (!res.ok) throw new Error("Impossible de lire manifest.json");
    const staticCourses = await res.json();
    let migratedCount = 0;

    for (const c of staticCourses) {
      const modules = [];
      for (let i = 0; i < (c.chapters || []).length; i++) {
        const ch = c.chapters[i];
        let md = "";
        if (ch.file) {
          try {
            const mdRes = await fetch(`/cours/${c.folder || c.id}/${ch.file}`);
            if (mdRes.ok) md = await mdRes.text();
          } catch (_) {}
        }
        modules.push({
          id: ch.id || `mod-${i + 1}`,
          title: ch.title || `Module ${i + 1}`,
          order: i + 1,
          file: ch.file || '',
          theorie_md: md
        });
      }

      const defaultMissions = DEFAULT_EXERCISES_BY_COURSE[c.id] || [];
      await saveCourseStudioBundle({
        course: {
          ...c,
          workspaceType: this.normalizeWorkspaceType(c),
          status: 'published'
        },
        modules,
        missions: defaultMissions
      });
      migratedCount++;
    }

    return migratedCount;
  }

  /**
   * Normalise un exercice provenant de Firestore (V1 ou V2) pour que tous les champs
   * (`titre`, `consigne`, `enonce_md`, `theorie_md`, `starter_code`, `questions`, `isQuizz`) soient toujours définis.
   */
  normalizeExerciseDoc(id, raw = {}) {
    const consigneText = raw.consigne || raw.enonce_md || raw.enonce || raw.instructions || raw.description || "";
    const titreText = raw.titre || raw.title || "Activité";
    const starterCode = raw.starter_code || raw.code_depart || null;
    const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
    const isQuizz = raw.type === 'quizz' || raw.type === 'quiz' || raw.submission_type === 'quizz' || rawQuestions.length > 0;

    return {
      ...raw,
      id,
      titre: titreText,
      title: titreText,
      consigne: consigneText,
      enonce_md: raw.enonce_md || consigneText,
      theorie_md: raw.theorie_md || raw.theorie || "",
      chapitre: raw.chapitre || raw.chapitre_id || raw.module_id || "",
      starter_code: starterCode,
      isQuizz,
      questions: rawQuestions
    };
  }

  /**
   * Récupère les exercices d'un cours depuis Firestore avec repli sur la banque par défaut
   */
  async loadCourseExercisesFromDb(courseId) {
    const defaultList = (DEFAULT_EXERCISES_BY_COURSE[courseId] || []).map(ex => this.normalizeExerciseDoc(ex.id, ex));
    try {
      const q = query(
        collection(db, "exercices"),
        where("course_id", "==", courseId)
      );
      const snap = await getDocs(q);
      const dbExercises = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!d.is_hidden) {
          dbExercises.push(this.normalizeExerciseDoc(docSnap.id, d));
        }
      });

      if (dbExercises.length === 0) {
        const qFallback = query(
          collection(db, "exercices"),
          where("id_course", "==", courseId)
        );
        const snapFb = await getDocs(qFallback);
        snapFb.forEach(docSnap => {
          const d = docSnap.data();
          if (!d.is_hidden) {
            dbExercises.push(this.normalizeExerciseDoc(docSnap.id, d));
          }
        });
      }

      if (dbExercises.length > 0) {
        dbExercises.sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
        return dbExercises;
      }
      return defaultList;
    } catch (e) {
      console.warn("[CourseManagerV2] Erreur lecture exercices Firestore, utilisation de la banque par défaut :", e);
      return defaultList;
    }
  }
}

export const courseManagerV2 = new CourseManagerV2();
