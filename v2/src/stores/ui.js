/**
 * Boîtes de dialogue de l'application (remplacent `alert` / `confirm` du navigateur).
 * - `notify(message)` : information, se ferme avec OK / Échap / Entrée.
 * - `confirmDialog(message)` : renvoie une promesse `true` (confirmé) ou `false` (annulé).
 * Accessibles au clavier et aux lecteurs d'écran (role="alertdialog", focus piégé puis rendu).
 */
function inferTone(message, fallback) {
  const m = String(message || '').trimStart();
  if (/^(erreur|❌|⚠️)/i.test(m)) return 'error';
  if (/^(✅|✨|🏆|bravo)/i.test(m) || /succès|terminé/i.test(m)) return 'success';
  return fallback;
}

const TITLES = {
  error: 'Une erreur est survenue',
  success: 'C\'est fait !',
  info: 'À savoir',
  question: 'Confirmer l\'action',
  danger: 'Action définitive'
};

export function createUiStore() {
  return {
    uiDialog: {
      open: false,
      mode: 'notify', // 'notify' | 'confirm'
      tone: 'info',
      title: '',
      message: '',
      confirmLabel: 'OK',
      cancelLabel: 'Annuler'
    },
    _uiDialogResolve: null,
    _uiDialogReturnFocus: null,

    _openUiDialog(config) {
      // Une boîte déjà ouverte est considérée comme annulée.
      if (this._uiDialogResolve) {
        const previous = this._uiDialogResolve;
        this._uiDialogResolve = null;
        previous(false);
      } else if (typeof document !== 'undefined') {
        this._uiDialogReturnFocus = document.activeElement;
      }
      Object.assign(this.uiDialog, config, { open: true });
      const focusPrimary = () => {
        const btn = document.getElementById(config.tone === 'danger' ? 'ui-dialog-cancel' : 'ui-dialog-confirm')
          || document.getElementById('ui-dialog-confirm');
        if (btn) btn.focus();
      };
      // La boîte n'est focalisable qu'une fois affichée (x-show + transition).
      setTimeout(focusPrimary, 60);
      setTimeout(() => {
        const active = document.activeElement;
        if (this.uiDialog.open && !(active && String(active.id).startsWith('ui-dialog-'))) focusPrimary();
      }, 250);
      return new Promise(resolve => { this._uiDialogResolve = resolve; });
    },

    notify(message, options = {}) {
      const tone = options.tone || inferTone(message, 'info');
      return this._openUiDialog({
        mode: 'notify',
        tone,
        title: options.title || TITLES[tone],
        message: String(message ?? ''),
        confirmLabel: options.confirmLabel || 'OK',
        cancelLabel: ''
      });
    },

    confirmDialog(message, options = {}) {
      const destructive = options.danger ?? /supprim|retirer|définitiv|purge|remise à zéro/i.test(String(message || ''));
      const tone = destructive ? 'danger' : 'question';
      return this._openUiDialog({
        mode: 'confirm',
        tone,
        title: options.title || TITLES[tone],
        message: String(message ?? ''),
        confirmLabel: options.confirmLabel || (destructive ? 'Oui, continuer' : 'Confirmer'),
        cancelLabel: options.cancelLabel || 'Annuler'
      });
    },

    closeUiDialog(result = false) {
      if (!this.uiDialog.open) return;
      this.uiDialog.open = false;
      const resolve = this._uiDialogResolve;
      this._uiDialogResolve = null;
      const back = this._uiDialogReturnFocus;
      this._uiDialogReturnFocus = null;
      if (back && typeof back.focus === 'function') {
        try { back.focus(); } catch (_) {}
      }
      if (resolve) resolve(Boolean(result));
    },

    /** Garde le focus dans la boîte tant qu'elle est ouverte (Tab / Maj+Tab). */
    trapUiDialogFocus(event) {
      const ids = this.uiDialog.mode === 'confirm' ? ['ui-dialog-cancel', 'ui-dialog-confirm'] : ['ui-dialog-confirm'];
      const els = ids.map(id => document.getElementById(id)).filter(Boolean);
      if (!els.length) return;
      event.preventDefault();
      const idx = els.indexOf(document.activeElement);
      const next = event.shiftKey ? (idx <= 0 ? els.length - 1 : idx - 1) : (idx + 1) % els.length;
      els[next].focus();
    }
  };
}
