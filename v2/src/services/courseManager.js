import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase.js";

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
  ]
};

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
   * Charge l'ensemble des cours depuis le manifeste public et y intègre le cours FMTTN 1re
   */
  async loadCoursesCatalogue() {
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

      // Normalisation des cours
      const normalizedLocal = localCourses.map(c => ({
        ...c,
        folder: c.folder || c.id,
        workspaceType: this.normalizeWorkspaceType(c),
        chapters: c.chapters || []
      }));

      // Le cours FMTTN est placé en première position
      const allCourses = [FMTTN_COURSE_DEF, ...normalizedLocal.filter(c => c.id !== "fmttn-1re")];
      this.courses = allCourses;

      // Récupération du cours mémorisé ou défaut sur FMTTN
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
   * Trouve le chapitre du manifeste associé à un libellé ou id provenant de Firestore
   */
  findChapterByDbLabel(course, dbChapterLabel) {
    if (!course || !dbChapterLabel) return null;
    const labelLower = String(dbChapterLabel).toLowerCase();
    return course.chapters?.find(ch => {
      if (ch.id === dbChapterLabel) return true;
      const titleLower = ch.title.toLowerCase();
      return labelLower.includes(titleLower) || titleLower.includes(labelLower);
    }) || null;
  }

  /**
   * Retourne l'URL du fichier Markdown
   */
  getCourseFileUrl(course, fileName) {
    const folder = course.folder || course.id;
    return `/cours/${folder}/${fileName}`;
  }

  /**
   * Charge le fichier Markdown d'un chapitre de cours
   */
  async loadChapterMarkdown(course, chapter) {
    if (!course || !chapter || !chapter.file) return "";
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
   * Récupère les exercices d'un cours depuis Firestore avec repli sur la banque par défaut
   */
  async loadCourseExercisesFromDb(courseId) {
    const defaultList = DEFAULT_EXERCISES_BY_COURSE[courseId] || [];
    try {
      const q = query(
        collection(db, "exercices"),
        where("course_id", "==", courseId)
      );
      const snap = await getDocs(q);
      const dbExercises = [];
      snap.forEach(docSnap => {
        dbExercises.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (dbExercises.length === 0) {
        const qFallback = query(
          collection(db, "exercices"),
          where("id_course", "==", courseId)
        );
        const snapFb = await getDocs(qFallback);
        snapFb.forEach(docSnap => {
          dbExercises.push({ id: docSnap.id, ...docSnap.data() });
        });
      }

      if (dbExercises.length > 0) {
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
