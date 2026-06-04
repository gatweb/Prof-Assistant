/**
 * UAA5 JS Course Synthesis - Interactive Functions
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initCodeBlocks();
  initOperatorPlayground();
  initDomSimulator();
  initValidationFlow();
  initAlgorithmTracer();
  initQuiz();
  initScrollSpy();
});

/* ==========================================================================
   THEME MANAGER (Dark / Light Mode)
   ========================================================================== */
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  
  // Helper to apply theme
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (colorSchemeMeta) {
      colorSchemeMeta.content = theme === 'dark' ? 'dark' : 'light';
    }
    
    // Update button contents
    const textSpan = themeBtn.querySelector('.theme-text');
    const iconContainer = themeBtn.querySelector('.theme-icon');
    
    if (theme === 'dark') {
      textSpan.textContent = 'Mode Clair';
      iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      `;
    } else {
      textSpan.textContent = 'Mode Sombre';
      iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      `;
    }
  }

  // Load from local storage or default to system preference
  let currentTheme = localStorage.getItem('color-scheme');
  if (!currentTheme) {
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(currentTheme);

  // Button click toggle
  themeBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('color-scheme', newTheme);
    applyTheme(newTheme);
  });

  // Listen for system theme changes if user hasn't pinned one
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('color-scheme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/* ==========================================================================
   SIDEBAR & MOBILE NAVIGATION
   ========================================================================== */
function initSidebar() {
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.createElement('div');
  
  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 98;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(overlay);

  function toggleSidebar(open) {
    if (open) {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      setTimeout(() => overlay.style.opacity = '1', 10);
    } else {
      sidebar.classList.remove('open');
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 300);
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');
      toggleSidebar(!isOpen);
    });
  }

  overlay.addEventListener('click', () => toggleSidebar(false));

  // Close sidebar on link click (mobile viewport)
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        toggleSidebar(false);
      }
    });
  });
}

/* ==========================================================================
   SCROLL-SPY & READING PROGRESS
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const progressFill = document.getElementById('progress-fill');
  const progressPercentText = document.getElementById('progress-percent');

  // Track active section and reading progress
  function updateScrollSpy() {
    let currentActiveId = '';
    const scrollPosition = window.scrollY + 120; // offset

    // Active Section Spy
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentActiveId = section.getAttribute('id');
      }
    });

    if (currentActiveId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentActiveId}`) {
          link.classList.add('active');
        }
      });
    }

    // Reading Progress percentage
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    let progressPercent = 0;
    if (documentHeight > windowHeight) {
      progressPercent = Math.min(Math.round((scrollTop / (documentHeight - windowHeight)) * 100), 100);
    }
    
    progressFill.style.width = `${progressPercent}%`;
    progressPercentText.textContent = `${progressPercent}%`;
  }

  window.addEventListener('scroll', updateScrollSpy);
  updateScrollSpy(); // Initial call
}

/* ==========================================================================
   CODE BLOCKS (Copy & Inject into Playground)
   ========================================================================== */
function initCodeBlocks() {
  const codeBtnCopyList = document.querySelectorAll('.btn-copy');
  const codeBtnTestList = document.querySelectorAll('.btn-test');

  // Copy code handler
  codeBtnCopyList.forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('pre');
      const codeElement = pre.querySelector('code');
      // Clean syntax highlight markings out if copying raw
      const rawText = codeElement.textContent;
      
      navigator.clipboard.writeText(rawText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✔ Copié !';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 1500);
      });
    });
  });

  // Test Code handler (loads parameters into interactive widgets)
  codeBtnTestList.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetType = btn.getAttribute('data-test-type');
      const dataA = btn.getAttribute('data-test-a');
      const dataB = btn.getAttribute('data-test-b');
      const dataOp = btn.getAttribute('data-test-op');
      
      if (targetType === 'ops') {
        const inputA = document.getElementById('op-input-a');
        const inputB = document.getElementById('op-input-b');
        const selectOp = document.getElementById('op-select');
        const playCard = document.getElementById('playground-card');
        
        if (inputA && inputB && selectOp) {
          inputA.value = dataA || '';
          inputB.value = dataB || '';
          selectOp.value = dataOp || '===';
          
          // Trigger evaluation
          evaluateOperators();
          
          // Scroll and animate focus
          playCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          playCard.classList.add('blink-focus');
          setTimeout(() => playCard.classList.remove('blink-focus'), 1600);
        }
      } else if (targetType === 'dom') {
        const inputMsg = document.getElementById('dom-input-message');
        const bgSelect = document.getElementById('dom-input-bg');
        const borderSelect = document.getElementById('dom-input-border');
        const sizeSelect = document.getElementById('dom-input-size');
        const domCard = document.getElementById('dom-card');
        
        if (inputMsg) {
          inputMsg.value = btn.getAttribute('data-dom-msg') || 'Texte personnalisé';
          bgSelect.value = btn.getAttribute('data-dom-bg') || '#3b82f6';
          borderSelect.value = btn.getAttribute('data-dom-border') || '#1d4ed8';
          sizeSelect.value = btn.getAttribute('data-dom-size') || '16';
          
          // Trigger application
          applyDomSimulation();
          
          // Scroll and animate focus
          domCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          domCard.classList.add('blink-focus');
          setTimeout(() => domCard.classList.remove('blink-focus'), 1600);
        }
      } else if (targetType === 'val') {
        const inputVal = document.getElementById('val-input');
        const valCard = document.getElementById('validation-card');
        
        if (inputVal) {
          inputVal.value = btn.getAttribute('data-val-saisie') || '';
          
          // Trigger validation
          runValidationSimulation();
          
          // Scroll and animate focus
          valCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          valCard.classList.add('blink-focus');
          setTimeout(() => valCard.classList.remove('blink-focus'), 1600);
        }
      }
    });
  });
}

/* ==========================================================================
   OPERATOR PLAYGROUND (Laboratoire d'Opérateurs)
   ========================================================================== */
function parseInput(val) {
  val = val.trim();
  
  if (val === '') {
    return { value: undefined, type: 'undefined', stringRepr: 'undefined', colorClass: 'hl-comment' };
  }
  if (val === 'null') {
    return { value: null, type: 'object', stringRepr: 'null', colorClass: 'hl-keyword' };
  }
  if (val === 'true') {
    return { value: true, type: 'boolean', stringRepr: 'true', colorClass: 'hl-keyword' };
  }
  if (val === 'false') {
    return { value: false, type: 'boolean', stringRepr: 'false', colorClass: 'hl-keyword' };
  }
  if (val === 'NaN') {
    return { value: NaN, type: 'number', stringRepr: 'NaN', colorClass: 'hl-number' };
  }
  
  // String literal checking e.g. "hello" or 'world'
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    const inner = val.slice(1, -1);
    return { value: inner, type: 'string', stringRepr: `"${inner}"`, colorClass: 'hl-string' };
  }
  
  // Number checking (if it is a numeric sequence)
  const num = Number(val);
  if (!isNaN(num) && val !== '') {
    return { value: num, type: 'number', stringRepr: val, colorClass: 'hl-number' };
  }
  
  // Fallback: treat raw input as standard text (implicit string)
  return { value: val, type: 'string', stringRepr: `"${val}"`, colorClass: 'hl-string' };
}

function explainOperator(a, b, op, result) {
  const typeA = a.type;
  const typeB = b.type;
  const valA = a.value;
  const valB = b.value;
  
  let explanation = '';
  
  switch(op) {
    case '+':
      if (typeA === 'string' || typeB === 'string') {
        explanation = `💡 **Coercion en chaîne (Concaténation)** : Puisque l'un des opérandes est de type \`string\`, JavaScript convertit l'autre opérande en texte et les fusionne. Ici, \`${a.stringRepr}\` + \`${b.stringRepr}\` fusionne pour donner \`"${result}"\`.`;
      } else if (typeA === 'boolean' || typeB === 'boolean') {
        const numValA = typeA === 'boolean' ? (valA ? 1 : 0) : valA;
        const numValB = typeB === 'boolean' ? (valB ? 1 : 0) : valB;
        explanation = `💡 **Coercion de Booléen** : Dans un calcul arithmétique, \`true\` équivaut à \`1\` et \`false\` équivaut à \`0\`. Le calcul devient \`${numValA} + ${numValB}\`, ce qui donne \`${result}\`.`;
      } else {
        explanation = `Addition arithmétique classique entre deux nombres : \`${valA} + ${valB} = ${result}\`.`;
      }
      break;
      
    case '-':
    case '*':
    case '/':
    case '%':
    case '**':
      const opNames = { '-': 'soustraction', '*': 'multiplication', '/': 'division', '%': 'modulo (reste)', '**': 'puissance' };
      if (isNaN(result)) {
        explanation = `⚠️ **Erreur arithmétique (NaN)** : JavaScript a tenté de forcer la conversion des valeurs en nombres pour effectuer la ${opNames[op]}, mais l'une d'elles (ou les deux) ne représente pas un nombre valide (ex. du texte ou \`undefined\`). \`${a.stringRepr} ${op} ${b.stringRepr}\` produit donc \`NaN\` (Not a Number).`;
      } else if (typeA === 'string' || typeB === 'string' || typeA === 'boolean' || typeB === 'boolean' || valA === null || valB === null) {
        const numA = Number(valA);
        const numB = Number(valB);
        explanation = `💡 **Coercion numérique forcée** : Contrairement à l'addition, l'opérateur \`${op}\` n'a pas de double sens (il ne fait pas de concaténation). JavaScript force donc la conversion des valeurs en nombres. La valeur \`${a.stringRepr}\` devient \`${numA}\` et \`${b.stringRepr}\` devient \`${numB}\`. Le calcul réalisé est \`${numA} ${op} ${numB} = ${result}\`.`;
      } else {
        explanation = `Opération arithmétique classique (${opNames[op]}) : \`${valA} ${op} ${valB} = ${result}\`.`;
      }
      break;
      
    case '==':
      if (result === true) {
        if (typeA !== typeB) {
          explanation = `⚠️ **Coercion de type (Égalité faible ==)** : Les types sont différents (\`${typeA}\` et \`${typeB}\`). JavaScript a converti l'un des deux pour comparer uniquement la valeur. Par exemple, la string \`"${valB}"\` a été convertie en nombre \`${Number(valB)}\`. **Règle : Utilisez plutôt === pour éviter cela !**`;
        } else {
          explanation = `Les opérandes ont le même type (\`${typeA}\`) et la même valeur.`;
        }
      } else {
        explanation = `Les valeurs sont différentes. Même après une éventuelle coercion automatique des types, les valeurs ne correspondent pas.`;
      }
      break;
      
    case '===':
      if (result === true) {
        explanation = `✅ **Égalité stricte** : Les deux opérandes ont à la fois la **même valeur** et le **même type** (\`${typeA}\`). C'est la comparaison recommandée en JavaScript !`;
      } else {
        if (typeA !== typeB) {
          explanation = `💡 **Types différents** : Le triple égal \`===\` compare la valeur **ET** le type. Ici, l'opérande A est de type \`${typeA}\` et l'opérande B est de type \`${typeB}\`. Comme les types sont différents, JavaScript renvoie \`false\` directement, sans tenter de conversion.`;
        } else {
          explanation = `Même type (\`${typeA}\`), mais les valeurs sont différentes (\`${valA}\` différent de \`${valB}\`).`;
        }
      }
      break;
      
    case '&&':
      explanation = `💡 **Logique ET (&&)** : Renvoie le premier opérande s'il est *falsy* (évalué à \`false\`), sinon renvoie le second opérande.
      - Opérande A (\`${a.stringRepr}\`) est considéré comme **${valA ? 'truthy' : 'falsy'}**.
      - Résultat retourné : \`${result}\`.`;
      break;
      
    case '||':
      explanation = `💡 **Logique OU (||)** : Renvoie le premier opérande s'il est *truthy* (évalué à \`true\`), sinon renvoie le second opérande.
      - Opérande A (\`${a.stringRepr}\`) est considéré comme **${valA ? 'truthy' : 'falsy'}**.
      - Résultat retourné : \`${result}\`.`;
      break;
  }
  
  return explanation;
}

function evaluateOperators() {
  const rawA = document.getElementById('op-input-a').value;
  const rawB = document.getElementById('op-input-b').value;
  const op = document.getElementById('op-select').value;
  
  const parsedA = parseInput(rawA);
  const parsedB = parseInput(rawB);
  
  // Show inferred types live
  const typeIndicatorA = document.getElementById('type-indicator-a');
  const typeIndicatorB = document.getElementById('type-indicator-b');
  
  typeIndicatorA.textContent = parsedA.type;
  typeIndicatorA.className = `type-indicator ${parsedA.colorClass}`;
  
  typeIndicatorB.textContent = parsedB.type;
  typeIndicatorB.className = `type-indicator ${parsedB.colorClass}`;
  
  let resultValue;
  const valA = parsedA.value;
  const valB = parsedB.value;
  
  // Safely evaluate expressions
  switch(op) {
    case '+': resultValue = valA + valB; break;
    case '-': resultValue = valA - valB; break;
    case '*': resultValue = valA * valB; break;
    case '/': resultValue = valA / valB; break;
    case '%': resultValue = valA % valB; break;
    case '**': resultValue = valA ** valB; break;
    case '==': resultValue = (valA == valB); break;
    case '===': resultValue = (valA === valB); break;
    case '&&': resultValue = (valA && valB); break;
    case '||': resultValue = (valA || valB); break;
  }
  
  // Display result
  const resValEl = document.getElementById('op-result-val');
  const resTypeEl = document.getElementById('op-result-type');
  const resDescEl = document.getElementById('op-result-desc');
  const resultBox = document.getElementById('op-result-box');
  
  // Format string representations
  let displayValue = resultValue;
  if (typeof resultValue === 'string') {
    displayValue = `"${resultValue}"`;
  } else if (resultValue === undefined) {
    displayValue = 'undefined';
  } else if (resultValue === null) {
    displayValue = 'null';
  } else if (Number.isNaN(resultValue)) {
    displayValue = 'NaN';
  }
  
  resValEl.textContent = displayValue;
  resTypeEl.textContent = typeof resultValue;
  
  // CSS styling for boolean results
  resultBox.className = 'result-box';
  if (resultValue === true) {
    resultBox.classList.add('eval-true');
  } else if (resultValue === false) {
    resultBox.classList.add('eval-false');
  }
  
  // Generate educational markdown-style explanation
  const mdExplanation = explainOperator(parsedA, parsedB, op, resultValue);
  
  // Quick basic HTML formatter for markdown elements (`code` and **bold**)
  resDescEl.innerHTML = mdExplanation
    .replace(/`([^`]+)`/g, '<code style="color:var(--accent-primary)">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function initOperatorPlayground() {
  const inputA = document.getElementById('op-input-a');
  const inputB = document.getElementById('op-input-b');
  const selectOp = document.getElementById('op-select');
  
  if (inputA && inputB && selectOp) {
    inputA.addEventListener('input', evaluateOperators);
    inputB.addEventListener('input', evaluateOperators);
    selectOp.addEventListener('change', evaluateOperators);
    
    // Initial evaluation
    evaluateOperators();
  }
}

/* ==========================================================================
   DOM SIMULATOR (Simulateur de manipulation du DOM)
   ========================================================================== */
function applyDomSimulation() {
  const textVal = document.getElementById('dom-input-message').value;
  const bgVal = document.getElementById('dom-input-bg').value;
  const borderVal = document.getElementById('dom-input-border').value;
  const sizeVal = document.getElementById('dom-input-size').value;
  
  const previewCard = document.getElementById('dom-preview-card');
  const codeWitness = document.getElementById('dom-code-witness');
  
  if (previewCard && codeWitness) {
    // Update preview card styles and text
    previewCard.textContent = textVal;
    previewCard.style.backgroundColor = bgVal;
    previewCard.style.borderColor = borderVal;
    previewCard.style.borderWidth = '3px';
    previewCard.style.borderStyle = 'solid';
    previewCard.style.fontSize = `${sizeVal}px`;
    
    // Auto-adjust font color (contrast) depending on background color (light or dark)
    // Basic helper: if color starts with #, calculate brightness
    let textColor = 'var(--text-primary)';
    if (bgVal.startsWith('#')) {
      const r = parseInt(bgVal.substring(1, 3), 16);
      const g = parseInt(bgVal.substring(3, 5), 16);
      const b = parseInt(bgVal.substring(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      textColor = brightness > 125 ? '#0f172a' : '#f8fafc';
    }
    previewCard.style.color = textColor;
    
    // Update live code text with highlighting
    codeWitness.innerHTML = 
      `<span class="hl-comment">// 1. Sélectionner l'élément dans le document HTML</span>\n` +
      `<span class="hl-keyword">const</span> carte = document.getElementById(<span class="hl-string">"preview-card"</span>);\n\n` +
      `<span class="hl-comment">// 2. Modifier le texte contenu</span>\n` +
      `carte.textContent = <span class="hl-string">"${textVal}"</span>;\n\n` +
      `<span class="hl-comment">// 3. Ajuster les styles CSS en direct</span>\n` +
      `carte.style.backgroundColor = <span class="hl-string">"${bgVal}"</span>;\n` +
      `carte.style.borderColor = <span class="hl-string">"${borderVal}"</span>;\n` +
      `carte.style.fontSize = <span class="hl-string">"${sizeVal}px"</span>;\n` +
      `carte.style.color = <span class="hl-string">"${textColor}"</span>;`;
  }
}

function initDomSimulator() {
  const inputMsg = document.getElementById('dom-input-message');
  const inputBg = document.getElementById('dom-input-bg');
  const inputBorder = document.getElementById('dom-input-border');
  const inputSize = document.getElementById('dom-input-size');
  const btnApply = document.getElementById('dom-btn-apply');
  
  if (inputMsg && inputBg && inputBorder && inputSize) {
    // Active bindings on change / input for live feel
    inputMsg.addEventListener('input', applyDomSimulation);
    inputBg.addEventListener('input', applyDomSimulation);
    inputBorder.addEventListener('input', applyDomSimulation);
    inputSize.addEventListener('input', applyDomSimulation);
    
    if (btnApply) {
      btnApply.addEventListener('click', applyDomSimulation);
    }
    
    // Trigger initial values
    applyDomSimulation();
  }
}

/* ==========================================================================
   VALIDATION SIMULATOR (Visualiseur pédagogique pas-à-pas)
   ========================================================================== */
function runValidationSimulation() {
  const saisieRaw = document.getElementById('val-input').value;
  const cancelCheck = document.getElementById('val-cancel-check');
  const emptyCheck = document.getElementById('val-empty-check');
  const nanCheck = document.getElementById('val-nan-check');
  const rangeCheck = document.getElementById('val-range-check');
  const successBadge = document.getElementById('val-success-badge');
  const resultText = document.getElementById('val-status-result');
  
  // Reset all step styles
  const steps = [cancelCheck, emptyCheck, nanCheck, rangeCheck];
  steps.forEach(step => {
    step.className = 'flow-step status-pending';
    step.querySelector('.step-status-icon').textContent = '•';
  });
  successBadge.style.display = 'none';
  resultText.textContent = '';
  
  // Simulons l'annulation. Dans notre input, on considère que taper "null" ou annuler via prompt simule l'état null
  const isCanceled = (saisieRaw.toLowerCase() === 'null');
  
  // Étape 1 : prompt annulé ?
  if (isCanceled) {
    cancelCheck.className = 'flow-step status-failed';
    cancelCheck.querySelector('.step-status-icon').textContent = '❌ Annulé (Bloqué)';
    resultText.textContent = '❌ Algorithme stoppé : return immédiat (Valeur null).';
    return;
  } else {
    cancelCheck.className = 'flow-step status-passed';
    cancelCheck.querySelector('.step-status-icon').textContent = '✔ OK';
  }
  
  // Étape 2 : vide ? (trim() === "")
  const isTrimmedEmpty = (saisieRaw.trim() === "");
  if (isTrimmedEmpty) {
    emptyCheck.className = 'flow-step status-failed';
    emptyCheck.querySelector('.step-status-icon').textContent = '❌ Vide (Bloqué)';
    resultText.textContent = '❌ Algorithme stoppé : return immédiat (Texte vide).';
    return;
  } else {
    emptyCheck.className = 'flow-step status-passed';
    emptyCheck.querySelector('.step-status-icon').textContent = '✔ OK';
  }
  
  // Étape 3 : pas un nombre ? (isNaN)
  const n = Number(saisieRaw);
  const isNotANumber = isNaN(n);
  if (isNotANumber) {
    nanCheck.className = 'flow-step status-failed';
    nanCheck.querySelector('.step-status-icon').textContent = '❌ Pas un nombre (Bloqué)';
    resultText.textContent = `❌ Algorithme stoppé : return immédiat (la conversion de "${saisieRaw}" en nombre donne NaN).`;
    return;
  } else {
    nanCheck.className = 'flow-step status-passed';
    nanCheck.querySelector('.step-status-icon').textContent = `✔ OK (Converti en ${n})`;
  }
  
  // Étape 4 : hors plage ? (n < 0 || n > 100)
  const isOutOfRange = (n < 0 || n > 100);
  if (isOutOfRange) {
    rangeCheck.className = 'flow-step status-failed';
    rangeCheck.querySelector('.step-status-icon').textContent = '❌ Hors plage (Bloqué)';
    resultText.textContent = `❌ Algorithme stoppé : return immédiat (Le nombre ${n} n'est pas compris entre 0 et 100).`;
    return;
  } else {
    rangeCheck.className = 'flow-step status-passed';
    rangeCheck.querySelector('.step-status-icon').textContent = '✔ OK';
  }
  
  // Tout est validé !
  successBadge.style.display = 'inline-block';
  resultText.innerHTML = `✅ **Entrée validée avec succès !** La variable contient désormais le nombre <strong>${n}</strong> utilisable en toute sécurité dans vos calculs.`;
}

function initValidationFlow() {
  const valInput = document.getElementById('val-input');
  if (valInput) {
    valInput.addEventListener('input', runValidationSimulation);
    runValidationSimulation(); // initial
  }
}

/* ==========================================================================
   INTERACTIVE MINI-QUIZ
   ========================================================================== */
const quizQuestions = [
  {
    q: "Qu'affiche l'instruction console.log(\"5\" + 3) dans la console de développement ?",
    a: [
      { text: "8", correct: false },
      { text: "\"53\"", correct: true },
      { text: "NaN", correct: false },
      { text: "Une erreur de syntaxe", correct: false }
    ],
    explanation: "En JavaScript, le signe `+` possède un double sens. Lorsqu'un des opérandes est une chaîne de caractères (comme `\"5\"`), il effectue une concaténation (fusion de textes). Le nombre `3` est donc converti implicitement en chaîne `\"3\"` pour donner \`\"53\"\`.",
    reviewLink: "#ch_ops"
  },
  {
    q: "Quel est le résultat retourné par la comparaison stricte 5 === \"5\" ?",
    a: [
      { text: "true", correct: false },
      { text: "false", correct: true },
      { text: "undefined", correct: false },
      { text: "NaN", correct: false }
    ],
    explanation: "L'opérateur d'égalité stricte `===` vérifie à la fois la valeur ET le type. Ici, nous comparons un type \`number\` (5) avec un type \`string\` (\"5\"). Les types étant différents, JavaScript renvoie immédiatement \`false\`.",
    reviewLink: "#ch_ops"
  },
  {
    q: "Parmi les valeurs suivantes, laquelle est considérée comme falsy dans une condition en JavaScript ?",
    a: [
      { text: "[] (un tableau vide)", correct: false },
      { text: "\"0\" (texte contenant zéro)", correct: false },
      { text: "undefined", correct: true },
      { text: "\"false\" (chaîne contenant false)", correct: false }
    ],
    explanation: "Les 6 valeurs falsy en JavaScript sont : \`false\`, \`0\`, \`\"\"\` (chaîne vide), \`null\`, \`undefined\` et \`NaN\`. Les tableaux vides \`[]\` et objets vides \`{}\` sont toujours considérés comme truthy, tout comme les chaînes de texte non vides (même \`\"0\"\` ou \`\"false\"\`).",
    reviewLink: "#ch5"
  },
  {
    q: "Pour concevoir un algorithme de recherche du minimum parmi des nombres positifs, comment devez-vous initialiser votre variable min ?",
    a: [
      { text: "À 0 (min = 0)", correct: false },
      { text: "À null (min = null)", correct: true },
      { text: "À -1 (min = -1)", correct: false },
      { text: "À 99999 (min = 99999)", correct: false }
    ],
    explanation: "Initialiser `min` à `0` est un piège classique : si toutes les valeurs à analyser sont positives (ex. 10, 25, 5), aucune ne sera inférieure à `0`, et le résultat restera bloqué à `0`. L'initialiser à \`null\` permet de lui assigner la première valeur examinée comme minimum de départ.",
    reviewLink: "#ch7"
  },
  {
    q: "Quelle méthode permet de convertir proprement la saisie textuelle \"12.5\" en un nombre décimal exploitable pour des calculs ?",
    a: [
      { text: "parseInt(\"12.5\")", correct: false },
      { text: "Number(\"12.5\")", correct: true },
      { text: "String(\"12.5\")", correct: false },
      { text: "Math.floor(\"12.5\")", correct: false }
    ],
    explanation: "La fonction globale \`Number()\` (ou \`parseFloat()\`) convertit proprement la chaîne en nombre décimal. \`parseInt()\` tronquerait la partie décimale pour renvoyer le nombre entier \`12\`, tandis que \`String()\` réalise l'opération inverse.",
    reviewLink: "#ch3"
  }
];

let currentQuestionIndex = 0;
let quizScore = 0;
let answered = false;

function initQuiz() {
  const quizCard = document.getElementById('quiz-card');
  if (!quizCard) return;

  renderQuestion();
  
  // Bind reset button
  const btnReset = document.getElementById('quiz-btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', resetQuiz);
  }
}

function renderQuestion() {
  const container = document.getElementById('quiz-question-container');
  const progressText = document.getElementById('quiz-current-idx');
  const totalText = document.getElementById('quiz-total-questions');
  const dotsContainer = document.getElementById('quiz-dots');
  
  // Set question index texts
  progressText.textContent = currentQuestionIndex + 1;
  totalText.textContent = quizQuestions.length;
  
  // Render dot indicators
  dotsContainer.innerHTML = '';
  quizQuestions.forEach((q, idx) => {
    const dot = document.createElement('div');
    dot.className = 'quiz-dot';
    if (idx === currentQuestionIndex) dot.classList.add('active');
    
    // Add history colors to dots
    if (idx < currentQuestionIndex) {
      // Check if they got it right (we'd need historical state, let's keep it simple for now)
      // Just flag as completed
      dot.classList.add('correct');
    }
    dotsContainer.appendChild(dot);
  });
  
  const currentQ = quizQuestions[currentQuestionIndex];
  answered = false;
  
  let optionsHtml = currentQ.a.map((option, idx) => {
    return `<button class="quiz-option" data-idx="${idx}">${option.text}</button>`;
  }).join('');
  
  container.innerHTML = `
    <div class="quiz-question-card active">
      <div class="question-text">${currentQ.q}</div>
      <div class="quiz-options">
        ${optionsHtml}
      </div>
      <div class="quiz-feedback" id="quiz-feedback-box">
        <div class="quiz-feedback-text" id="quiz-feedback-text"></div>
        <div class="feedback-buttons">
          <a href="${currentQ.reviewLink}" class="quiz-btn btn-review">
            📖 Revoir ce chapitre
          </a>
          <button class="quiz-btn btn-next" id="quiz-btn-next" style="display:none">
            Question Suivante ➔
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Bind option clicks
  const options = container.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.addEventListener('click', handleOptionClick);
  });
}

function handleOptionClick(e) {
  if (answered) return; // Prevent double clicking
  answered = true;
  
  const selectedBtn = e.currentTarget;
  const selectedIdx = parseInt(selectedBtn.getAttribute('data-idx'));
  const currentQ = quizQuestions[currentQuestionIndex];
  const isCorrect = currentQ.a[selectedIdx].correct;
  
  const options = document.querySelectorAll('.quiz-option');
  options.forEach((opt, idx) => {
    opt.disabled = true; // Disable further selections
    if (currentQ.a[idx].correct) {
      opt.classList.add('correct'); // Highlight correct answer
    }
  });
  
  const feedbackBox = document.getElementById('quiz-feedback-box');
  const feedbackText = document.getElementById('quiz-feedback-text');
  const btnNext = document.getElementById('quiz-btn-next');
  
  if (isCorrect) {
    selectedBtn.classList.add('correct');
    quizScore++;
    feedbackBox.className = 'quiz-feedback correct';
    feedbackText.innerHTML = `<strong>Félicitations ! 🎉 C'est la bonne réponse.</strong><br>${currentQ.explanation}`;
  } else {
    selectedBtn.classList.add('incorrect');
    feedbackBox.className = 'quiz-feedback incorrect';
    feedbackText.innerHTML = `<strong>Dommage ! ❌ Mauvaise réponse.</strong><br>${currentQ.explanation}`;
  }
  
  // Make Next question or Results button visible
  btnNext.style.display = 'block';
  btnNext.textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Voir mes résultats ➔' : 'Question Suivante ➔';
  
  btnNext.addEventListener('click', () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      showResults();
    }
  });
}

function showResults() {
  const quizContent = document.getElementById('quiz-game-content');
  const resultsScreen = document.getElementById('quiz-results-screen');
  const scoreVal = document.getElementById('quiz-score-val');
  const scoreMsg = document.getElementById('quiz-score-msg');
  
  quizContent.style.display = 'none';
  resultsScreen.classList.add('active');
  scoreVal.textContent = `${quizScore}/${quizQuestions.length}`;
  
  let msg = '';
  if (quizScore === quizQuestions.length) {
    msg = 'Parfait ! 🏆 Vous maîtrisez la synthèse UAA5 sur le bout des doigts !';
  } else if (quizScore >= 3) {
    msg = 'Très bien ! 👍 Vous avez de bonnes bases, relisez les quelques chapitres manquants.';
  } else {
    msg = 'Entraînez-vous encore ! 💪 N\'hésitez pas à retenter et à cliquer sur "Revoir ce chapitre" !';
  }
  scoreMsg.textContent = msg;
}

function resetQuiz() {
  currentQuestionIndex = 0;
  quizScore = 0;
  answered = false;
  
  const quizContent = document.getElementById('quiz-game-content');
  const resultsScreen = document.getElementById('quiz-results-screen');
  
  resultsScreen.classList.remove('active');
  quizContent.style.display = 'block';
  
  renderQuestion();
}

/* ==========================================================================
   ALGORITHM LOOP TRACER (Simulateur d'algorithmes & tracé de boucle)
   ========================================================================== */
function initAlgorithmTracer() {
  const algoSelect = document.getElementById('algo-select');
  const algoInput = document.getElementById('algo-input-array');
  const arrayContainer = document.getElementById('algo-array-container');
  const indexPointer = document.getElementById('algo-index-pointer');
  const indexValText = document.getElementById('algo-index-val');
  
  const btnInit = document.getElementById('algo-btn-init');
  const btnStep = document.getElementById('algo-btn-step');
  const btnPlay = document.getElementById('algo-btn-play');
  const speedSelect = document.getElementById('algo-speed');
  
  const varI = document.getElementById('var-i');
  const varVal = document.getElementById('var-val');
  const varSomme = document.getElementById('var-somme');
  const varMin = document.getElementById('var-min');
  const varCount = document.getElementById('var-count');
  const varFound = document.getElementById('var-found');
  const varIndexTrouve = document.getElementById('var-indexTrouve');
  
  const explanationBox = document.getElementById('algo-step-explanation');
  const codeWitness = document.getElementById('algo-code-witness');
  
  if (!algoSelect || !algoInput || !arrayContainer) return;
  
  let notes = [];
  let i = undefined;
  let note = undefined;
  let currentState = 'NOT_STARTED';
  
  // Algorithmic memory variables
  let somme = 0;
  let min = null;
  let nombreElements = 0;
  let found = false;
  let indexTrouve = -1;
  
  let playInterval = null;
  let isPlaying = false;
  
  const algoCodes = {
    somme: [
      `<div class="code-line" id="algo-line-0"><span class="hl-keyword">let</span> somme = <span class="hl-number">0</span>;</div>`,
      `<div class="code-line" id="algo-line-1"><span class="hl-keyword">for</span> (<span class="hl-keyword">let</span> i = <span class="hl-number">0</span>; i &lt; notes.length; i++) {</div>`,
      `<div class="code-line" id="algo-line-2">    <span class="hl-keyword">let</span> note = notes[i];</div>`,
      `<div class="code-line" id="algo-line-3">    somme += note;</div>`,
      `<div class="code-line" id="algo-line-4">}</div>`
    ],
    min: [
      `<div class="code-line" id="algo-line-0"><span class="hl-keyword">let</span> min = <span class="hl-keyword">null</span>;</div>`,
      `<div class="code-line" id="algo-line-1"><span class="hl-keyword">for</span> (<span class="hl-keyword">let</span> i = <span class="hl-number">0</span>; i &lt; notes.length; i++) {</div>`,
      `<div class="code-line" id="algo-line-2">    <span class="hl-keyword">let</span> note = notes[i];</div>`,
      `<div class="code-line" id="algo-line-3">    <span class="hl-keyword">if</span> (min === <span class="hl-keyword">null</span> || note &lt; min) {</div>`,
      `<div class="code-line" id="algo-line-4">        min = note;</div>`,
      `<div class="code-line" id="algo-line-5">    }</div>`,
      `<div class="code-line" id="algo-line-6">}</div>`
    ],
    filtrage: [
      `<div class="code-line" id="algo-line-0"><span class="hl-keyword">let</span> nombreElements = <span class="hl-number">0</span>;</div>`,
      `<div class="code-line" id="algo-line-1"><span class="hl-keyword">for</span> (<span class="hl-keyword">let</span> i = <span class="hl-number">0</span>; i &lt; notes.length; i++) {</div>`,
      `<div class="code-line" id="algo-line-2">    <span class="hl-keyword">let</span> note = notes[i];</div>`,
      `<div class="code-line" id="algo-line-3">    <span class="hl-keyword">if</span> (note &gt;= <span class="hl-number">10</span>) {</div>`,
      `<div class="code-line" id="algo-line-4">        nombreElements++;</div>`,
      `<div class="code-line" id="algo-line-5">    }</div>`,
      `<div class="code-line" id="algo-line-6">}</div>`
    ],
    recherche: [
      `<div class="code-line" id="algo-line-0"><span class="hl-keyword">let</span> found = <span class="hl-keyword">false</span>;</div>`,
      `<div class="code-line" id="algo-line-1"><span class="hl-keyword">let</span> indexTrouve = -<span class="hl-number">1</span>;</div>`,
      `<div class="code-line" id="algo-line-2"><span class="hl-keyword">for</span> (<span class="hl-keyword">let</span> i = <span class="hl-number">0</span>; i &lt; notes.length; i++) {</div>`,
      `<div class="code-line" id="algo-line-3">    <span class="hl-keyword">let</span> note = notes[i];</div>`,
      `<div class="code-line" id="algo-line-4">    <span class="hl-keyword">if</span> (note === <span class="hl-number">20</span>) {</div>`,
      `<div class="code-line" id="algo-line-5">        found = <span class="hl-keyword">true</span>;</div>`,
      `<div class="code-line" id="algo-line-6">        indexTrouve = i;</div>`,
      `<div class="code-line" id="algo-line-7">        <span class="hl-keyword">break</span>;</div>`,
      `<div class="code-line" id="algo-line-8">    }</div>`,
      `<div class="code-line" id="algo-line-9">}</div>`
    ]
  };
  
  // Render visual cells representing the array values
  function renderArrayCells() {
    arrayContainer.innerHTML = '';
    notes.forEach((val, idx) => {
      const cell = document.createElement('div');
      cell.className = 'algo-cell';
      cell.id = `cell-${idx}`;
      cell.textContent = val;
      arrayContainer.appendChild(cell);
    });
  }
  
  // Position the index arrow pointer below the active cell dynamically
  function updateIndexPointer(index) {
    if (index === undefined || index < 0 || index >= notes.length) {
      indexPointer.classList.remove('visible');
      return;
    }
    
    const cell = document.getElementById(`cell-${index}`);
    if (cell) {
      const wrapper = document.querySelector('.algo-array-wrapper');
      const wrapperRect = wrapper.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      
      // Calculate relative horizontal center offset
      const leftOffset = cellRect.left - wrapperRect.left + cellRect.width / 2;
      indexPointer.style.left = `${leftOffset}px`;
      indexPointer.classList.add('visible');
      indexValText.textContent = index;
    } else {
      indexPointer.classList.remove('visible');
    }
  }
  
  // Window resize listener to prevent arrow misalignment
  window.addEventListener('resize', () => {
    if (currentState !== 'NOT_STARTED' && currentState !== 'END') {
      updateIndexPointer(i);
    }
  });
  
  // Highlight an executing code line inside the visual code witness
  function highlightLine(lineIndex) {
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('line-active'));
    const line = document.getElementById(`algo-line-${lineIndex}`);
    if (line) {
      line.classList.add('line-active');
    }
  }
  
  // Update state variables inside HTML panel view
  function updateVariablesUi() {
    varI.textContent = i === undefined ? 'undefined' : i;
    varVal.textContent = note === undefined ? 'undefined' : note;
    
    varSomme.textContent = somme;
    varMin.textContent = min === null ? 'null' : min;
    varCount.textContent = nombreElements;
    varFound.textContent = found ? 'true' : 'false';
    varIndexTrouve.textContent = indexTrouve;
  }
  
  // Toggle variable display rows based on chosen algorithm
  function toggleTraceRows(algo) {
    document.querySelectorAll('.dynamic-var').forEach(row => row.style.display = 'none');
    if (algo === 'somme') {
      document.getElementById('row-somme').style.display = 'flex';
    } else if (algo === 'min') {
      document.getElementById('row-min').style.display = 'flex';
    } else if (algo === 'filtrage') {
      document.getElementById('row-count').style.display = 'flex';
    } else if (algo === 'recherche') {
      document.getElementById('row-found').style.display = 'flex';
      document.getElementById('row-indexTrouve').style.display = 'flex';
    }
  }
  
  // Parse array notes safely from comma-separated input field
  function parseInputArray() {
    const raw = algoInput.value.trim();
    if (raw === '') {
      return [12, 8, 15, 6, 20];
    }
    const parts = raw.split(',');
    const parsed = parts
      .map(p => parseFloat(p.trim()))
      .filter(n => !isNaN(n));
    return parsed.length > 0 ? parsed : [12, 8, 15, 6, 20];
  }
  
  // Reset tracer simulation to starting conditions
  function resetSimulation() {
    stopPlaying();
    
    notes = parseInputArray();
    currentState = 'NOT_STARTED';
    i = undefined;
    note = undefined;
    
    somme = 0;
    min = null;
    nombreElements = 0;
    found = false;
    indexTrouve = -1;
    
    const selectedAlgo = algoSelect.value;
    
    // Draw elements
    renderArrayCells();
    codeWitness.innerHTML = algoCodes[selectedAlgo].join('');
    toggleTraceRows(selectedAlgo);
    updateVariablesUi();
    updateIndexPointer(undefined);
    
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('line-active'));
    
    explanationBox.innerHTML = `🏁 **Simulateur initialisé**. Tableau de données chargé avec <strong>${notes.length}</strong> valeurs : <code>[${notes.join(', ')}]</code>.<br>Cliquez sur "Pas Suivant" ou "Lecture Auto" pour démarrer le tracé.`;
    algoInput.disabled = false;
    algoSelect.disabled = false;
  }
  
  // Advance state machine one logical step
  function stepSimulation() {
    algoInput.disabled = true;
    algoSelect.disabled = true;
    
    const algo = algoSelect.value;
    
    if (algo === 'somme') {
      runSommeStep();
    } else if (algo === 'min') {
      runMinStep();
    } else if (algo === 'filtrage') {
      runFiltrageStep();
    } else if (algo === 'recherche') {
      runRechercheStep();
    }
  }
  
  /* --- STEP LOGIC FOR ACCUMULATION (SOMME) --- */
  function runSommeStep() {
    switch(currentState) {
      case 'NOT_STARTED':
        currentState = 'INIT';
        somme = 0;
        highlightLine(0);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 1** : On initialise la somme cumulative : <code>let somme = 0;</code>.`;
        break;
        
      case 'INIT':
        i = 0;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 2** : Initialisation de la boucle <code>i = 0</code>. On vérifie la condition de continuation <code>i < notes.length</code> (0 < ${notes.length}), qui est vraie. On entre !`;
        break;
        
      case 'LOOP_CHECK':
        if (i < notes.length) {
          currentState = 'EVAL_ITEM';
          note = notes[i];
          highlightLine(2);
          updateVariablesUi();
          
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          const cell = document.getElementById(`cell-${i}`);
          if (cell) cell.classList.add('active');
          
          explanationBox.innerHTML = `➡️ **Ligne 3** : On récupère la note à l'index <code>i = ${i}</code>, soit la valeur <code>${note}</code>, et on l'enregistre temporairement dans la variable locale <code>note</code>.`;
        } else {
          currentState = 'END';
          highlightLine(4);
          updateIndexPointer(undefined);
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          explanationBox.innerHTML = `➡️ **Ligne 5** : L'index <code>i = ${i}</code> n'est plus inférieur à la taille du tableau (${notes.length}). La boucle est terminée !`;
          stopPlaying();
        }
        break;
        
      case 'EVAL_ITEM':
        currentState = 'ACTION';
        const oldSomme = somme;
        somme += note;
        highlightLine(3);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 4** : On accumule la note (<code>${note}</code>) dans la variable <code>somme</code> (qui passe de ${oldSomme} à <strong>${somme}</strong>).`;
        break;
        
      case 'ACTION':
        currentState = 'INCREMENT';
        highlightLine(1);
        explanationBox.innerHTML = `➡️ **Ligne 2** : Fin du bloc d'instructions de la boucle. On remonte au bloc d'incrémentation <code>i++</code>.`;
        break;
        
      case 'INCREMENT':
        document.querySelectorAll('.algo-cell').forEach((c, idx) => {
          if (idx === i) c.classList.add('passed');
          c.classList.remove('active');
        });
        
        i++;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        
        if (i < notes.length) {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index <code>i</code> est incrémenté à <strong>${i}</strong>. Le test logique <code>i < notes.length</code> (${i} < ${notes.length}) est vrai.`;
        } else {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index <code>i</code> est incrémenté à <strong>${i}</strong>. Le test logique <code>i < notes.length</code> (${i} < ${notes.length}) est faux.`;
        }
        break;
        
      case 'END':
        explanationBox.innerHTML = `🏁 **Algorithme terminé !** La somme totale cumulée des notes est de <strong>${somme}</strong>.`;
        break;
    }
  }
  
  /* --- STEP LOGIC FOR MINIMUM --- */
  function runMinStep() {
    switch(currentState) {
      case 'NOT_STARTED':
        currentState = 'INIT';
        min = null;
        highlightLine(0);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 1** : On initialise la variable minimum à <code>null</code> : <code>let min = null;</code>.`;
        break;
        
      case 'INIT':
        i = 0;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 2** : Initialisation de la boucle <code>i = 0</code>. On vérifie <code>i < notes.length</code> (0 < ${notes.length}). Vrai !`;
        break;
        
      case 'LOOP_CHECK':
        if (i < notes.length) {
          currentState = 'EVAL_ITEM';
          note = notes[i];
          highlightLine(2);
          updateVariablesUi();
          
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          const cell = document.getElementById(`cell-${i}`);
          if (cell) cell.classList.add('active');
          
          explanationBox.innerHTML = `➡️ **Ligne 3** : On stocke la note courante à l'index <code>i = ${i}</code> (qui vaut <code>${note}</code>) dans la variable locale <code>note</code>.`;
        } else {
          currentState = 'END';
          highlightLine(6);
          updateIndexPointer(undefined);
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          explanationBox.innerHTML = `➡️ **Ligne 7** : Fin de la boucle. Toutes les notes ont été scannées.`;
          stopPlaying();
        }
        break;
        
      case 'EVAL_ITEM':
        currentState = 'CHECK_COND';
        highlightLine(3);
        
        const isMinCondTrue = (min === null || note < min);
        explanationBox.innerHTML = `➡️ **Ligne 4** : Évaluation de la condition <code>min === null || note < min</code>.<br>` +
          `* Est-ce que min est null ? (<code>${min === null}</code>)<br>` +
          `* Est-ce que note (${note}) < min (${min}) ? (<code>${min !== null && note < min}</code>)<br>` +
          `👉 Résultat : <strong>${isMinCondTrue ? 'VRAI (Entrée dans le bloc)' : 'FAUX (Bloc ignoré)'}</strong>.`;
        break;
        
      case 'CHECK_COND':
        const isMinTrue = (min === null || note < min);
        if (isMinTrue) {
          currentState = 'ACTION';
          min = note;
          highlightLine(4);
          updateVariablesUi();
          explanationBox.innerHTML = `➡️ **Ligne 5** : La condition était vraie. On définit la note courante <code>${note}</code> comme le nouveau minimum : <code>min = note;</code>.`;
        } else {
          currentState = 'INCREMENT';
          highlightLine(1);
          explanationBox.innerHTML = `➡️ **Ligne 2** : Condition fausse. La note <code>${note}</code> n'étant pas plus petite que le minimum (<code>${min}</code>), on ignore le bloc.`;
        }
        break;
        
      case 'ACTION':
        currentState = 'INCREMENT';
        highlightLine(1);
        explanationBox.innerHTML = `➡️ **Ligne 2** : Bloc if exécuté, on se prépare à exécuter l'incrément <code>i++</code>.`;
        break;
        
      case 'INCREMENT':
        document.querySelectorAll('.algo-cell').forEach((c, idx) => {
          if (idx === i) c.classList.add('passed');
          c.classList.remove('active');
        });
        
        i++;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        
        if (i < notes.length) {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est toujours vraie.`;
        } else {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est fausse.`;
        }
        break;
        
      case 'END':
        explanationBox.innerHTML = `🏁 **Algorithme terminé !** La note la plus basse (minimum) de la liste est de <strong>${min}</strong>.`;
        break;
    }
  }
  
  /* --- STEP LOGIC FOR FILTRAGE (COUNT) --- */
  function runFiltrageStep() {
    switch(currentState) {
      case 'NOT_STARTED':
        currentState = 'INIT';
        nombreElements = 0;
        highlightLine(0);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 1** : On initialise le compteur de réussites : <code>let nombreElements = 0;</code>.`;
        break;
        
      case 'INIT':
        i = 0;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 2** : Initialisation de la boucle <code>i = 0</code>. On vérifie <code>i < notes.length</code> (0 < ${notes.length}). Vrai !`;
        break;
        
      case 'LOOP_CHECK':
        if (i < notes.length) {
          currentState = 'EVAL_ITEM';
          note = notes[i];
          highlightLine(2);
          updateVariablesUi();
          
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          const cell = document.getElementById(`cell-${i}`);
          if (cell) cell.classList.add('active');
          
          explanationBox.innerHTML = `➡️ **Ligne 3** : On extrait la note <code>note = notes[${i}]</code> (qui vaut <code>${note}</code>) dans la variable locale <code>note</code>.`;
        } else {
          currentState = 'END';
          highlightLine(6);
          updateIndexPointer(undefined);
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          explanationBox.innerHTML = `➡️ **Ligne 7** : Fin de la boucle. Toutes les notes ont été scannées.`;
          stopPlaying();
        }
        break;
        
      case 'EVAL_ITEM':
        currentState = 'CHECK_COND';
        highlightLine(3);
        
        const condPassed = (note >= 10);
        explanationBox.innerHTML = `➡️ **Ligne 4** : Évaluation de la condition <code>note >= 10</code>. Est-ce que la note <code>${note} >= 10</code> ? <br>` +
          `👉 Résultat : <strong>${condPassed ? 'VRAI (Note >= 10)' : 'FAUX (Note < 10)'}</strong>.`;
        break;
        
      case 'CHECK_COND':
        const isPassed = (note >= 10);
        if (isPassed) {
          currentState = 'ACTION';
          nombreElements++;
          highlightLine(4);
          updateVariablesUi();
          explanationBox.innerHTML = `➡️ **Ligne 5** : Condition vraie. On incrémente le compteur de réussites : <code>nombreElements++;</code> (nouvelle valeur : <strong>${nombreElements}</strong>).`;
        } else {
          currentState = 'INCREMENT';
          highlightLine(1);
          explanationBox.innerHTML = `➡️ **Ligne 2** : Condition fausse. La note <code>${note}</code> étant en échec (< 10), on passe à la suite sans incrémenter.`;
        }
        break;
        
      case 'ACTION':
        currentState = 'INCREMENT';
        highlightLine(1);
        explanationBox.innerHTML = `➡️ **Ligne 2** : Fin d'exécution du bloc if. On se prépare à l'incrément <code>i++</code>.`;
        break;
        
      case 'INCREMENT':
        document.querySelectorAll('.algo-cell').forEach((c, idx) => {
          if (idx === i) c.classList.add('passed');
          c.classList.remove('active');
        });
        
        i++;
        currentState = 'LOOP_CHECK';
        highlightLine(1);
        updateIndexPointer(i);
        updateVariablesUi();
        
        if (i < notes.length) {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est toujours vraie.`;
        } else {
          explanationBox.innerHTML = `➡️ **Ligne 2 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est fausse.`;
        }
        break;
        
      case 'END':
        explanationBox.innerHTML = `🏁 **Algorithme terminé !** On a trouvé <strong>${nombreElements}</strong> notes de réussite (>= 10) sur un total de ${notes.length} notes.`;
        break;
    }
  }
  
  /* --- STEP LOGIC FOR RECHERCHE ANTICIPÉE (BREAK) --- */
  function runRechercheStep() {
    switch(currentState) {
      case 'NOT_STARTED':
        currentState = 'INIT_1';
        found = false;
        highlightLine(0);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 1** : On initialise le drapeau de réussite <code>let found = false;</code>.`;
        break;
        
      case 'INIT_1':
        currentState = 'INIT_2';
        indexTrouve = -1;
        highlightLine(1);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 2** : On initialise l'index de réussite : <code>let indexTrouve = -1;</code>. L'index vaut -1 tant qu'aucun 20 n'a été trouvé.`;
        break;
        
      case 'INIT_2':
        i = 0;
        currentState = 'LOOP_CHECK';
        highlightLine(2);
        updateIndexPointer(i);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 3** : Initialisation de la boucle <code>i = 0</code>. On vérifie <code>i < notes.length</code> (0 < ${notes.length}). Vrai !`;
        break;
        
      case 'LOOP_CHECK':
        if (i < notes.length) {
          currentState = 'EVAL_ITEM';
          note = notes[i];
          highlightLine(3);
          updateVariablesUi();
          
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          const cell = document.getElementById(`cell-${i}`);
          if (cell) cell.classList.add('active');
          
          explanationBox.innerHTML = `➡️ **Ligne 4** : On charge la note d'index <code>i = ${i}</code>, soit la valeur <code>${note}</code>, pour l'évaluer.`;
        } else {
          currentState = 'END';
          highlightLine(9);
          updateIndexPointer(undefined);
          document.querySelectorAll('.algo-cell').forEach(c => c.classList.remove('active'));
          explanationBox.innerHTML = `➡️ **Ligne 10** : Fin de la boucle. Toutes les notes ont été scannées et aucun 20/20 n'est présent.`;
          stopPlaying();
        }
        break;
        
      case 'EVAL_ITEM':
        currentState = 'CHECK_COND';
        highlightLine(4);
        
        const has20 = (note === 20);
        explanationBox.innerHTML = `➡️ **Ligne 5** : On vérifie si la note courante vaut 20 (<code>note === 20</code>).<br>` +
          `👉 Résultat : <strong>${has20 ? 'VRAI ! (Élément cible localisé)' : 'FAUX (On continue)'}</strong>.`;
        break;
        
      case 'CHECK_COND':
        const is20 = (note === 20);
        if (is20) {
          currentState = 'ACTION_1';
          found = true;
          highlightLine(5);
          updateVariablesUi();
          explanationBox.innerHTML = `➡️ **Ligne 6** : Condition vraie ! On passe le drapeau de recherche à <code>found = true;</code>.`;
        } else {
          currentState = 'INCREMENT';
          highlightLine(2);
          explanationBox.innerHTML = `➡️ **Ligne 3** : Note égale à <code>${note}</code>. Ce n'est pas un 20. On court-circuite le bloc interne et on incrémente l'index.`;
        }
        break;
        
      case 'ACTION_1':
        currentState = 'ACTION_2';
        indexTrouve = i;
        highlightLine(6);
        updateVariablesUi();
        explanationBox.innerHTML = `➡️ **Ligne 7** : On enregistre la position actuelle de la cible : <code>indexTrouve = i;</code> (index <strong>${indexTrouve}</strong>).`;
        break;
        
      case 'ACTION_2':
        currentState = 'ACTION_BREAK';
        highlightLine(7);
        
        // Color green for success cell
        const successCell = document.getElementById(`cell-${i}`);
        if (successCell) {
          successCell.classList.remove('active');
          successCell.classList.add('found-cell');
        }
        
        explanationBox.innerHTML = `➡️ **Ligne 8** : Instruction <strong><code>break;</code></strong> atteinte ! Elle interrompt instantanément la boucle <code>for</code>. Les éléments suivants ne seront plus scannés en mémoire.`;
        break;
        
      case 'ACTION_BREAK':
        currentState = 'END';
        highlightLine(9);
        updateIndexPointer(undefined);
        document.querySelectorAll('.algo-cell').forEach(c => {
          if (!c.classList.contains('found-cell')) c.classList.remove('active');
        });
        explanationBox.innerHTML = `➡️ **Ligne 10** : Le break nous a éjecté hors de la boucle. On arrive à la fin du script.`;
        stopPlaying();
        break;
        
      case 'INCREMENT':
        document.querySelectorAll('.algo-cell').forEach((c, idx) => {
          if (idx === i) c.classList.add('passed');
          c.classList.remove('active');
        });
        
        i++;
        currentState = 'LOOP_CHECK';
        highlightLine(2);
        updateIndexPointer(i);
        updateVariablesUi();
        
        if (i < notes.length) {
          explanationBox.innerHTML = `➡️ **Ligne 3 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est vraie.`;
        } else {
          explanationBox.innerHTML = `➡️ **Ligne 3 (Vérification)** : L'index passe à <strong>${i}</strong>. Condition <code>${i} < ${notes.length}</code> est fausse.`;
        }
        break;
        
      case 'END':
        if (found) {
          explanationBox.innerHTML = `🏁 **Algorithme terminé (Arrêt anticipé) !** Un 20/20 a été localisé à l'index <strong>${indexTrouve}</strong>.`;
        } else {
          explanationBox.innerHTML = `🏁 **Algorithme terminé !** La recherche a échoué : aucun 20/20 n'a été détecté dans le tableau.`;
        }
        break;
    }
  }
  
  // Start autoplay looping
  function startPlaying() {
    isPlaying = true;
    btnPlay.innerHTML = `
      <span id="algo-play-icon" style="display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        Pause
      </span>
    `;
    btnPlay.classList.add('btn-control-primary');
    
    const intervalTime = parseInt(speedSelect.value);
    
    playInterval = setInterval(() => {
      if (currentState === 'END') {
        stopPlaying();
      } else {
        stepSimulation();
      }
    }, intervalTime);
  }
  
  // Stop autoplay looping
  function stopPlaying() {
    isPlaying = false;
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    btnPlay.innerHTML = `
      <span id="algo-play-icon" style="display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Lecture Auto
      </span>
    `;
    btnPlay.classList.remove('btn-control-primary');
  }
  
  // Event Bindings
  btnInit.addEventListener('click', resetSimulation);
  btnStep.addEventListener('click', () => {
    stopPlaying();
    stepSimulation();
  });
  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      if (currentState === 'END') {
        resetSimulation();
      }
      startPlaying();
    }
  });
  
  algoSelect.addEventListener('change', resetSimulation);
  algoInput.addEventListener('input', resetSimulation);
  
  speedSelect.addEventListener('change', () => {
    if (isPlaying) {
      stopPlaying();
      startPlaying();
    }
  });
  
  // Initial run
  resetSimulation();
}

