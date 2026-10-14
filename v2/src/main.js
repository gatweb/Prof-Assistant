import './style.css';
import Alpine from 'alpinejs';
import { createAuthStore } from './stores/auth.js';
import { createCourseStore } from './stores/course.js';
import { createFmttnStore } from './stores/fmttn.js';
import { createTutorStore } from './stores/tutor.js';
import { createTeacherStore } from './stores/teacher.js';
import { createClassroomStore } from './stores/classroom.js';
import { createFormsStore } from './stores/forms.js';

window.Alpine = Alpine;

Alpine.data('profAssistantApp', () => ({
  ...createAuthStore(),
  ...createCourseStore(),
  ...createFmttnStore(),
  ...createTutorStore(),
  ...createTeacherStore(),
  ...createClassroomStore(),
  ...createFormsStore(),

  async init() {
    console.log('ProfAssistant V3 initialisé — Architecture modulaire (Phase 8).');

    // 1. Initialisation du catalogue multi-cours et lecture des liens profonds (?course=&ex=)
    await this.initCoursesCatalogue();

    // 2. Écoute réactive de l'état d'authentification Firebase (Prof ou Élève)
    this.initAuthListener();
  }
}));

Alpine.start();
