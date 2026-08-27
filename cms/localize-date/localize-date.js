/**
 * webflow-utils / cms/localize-date
 * Corrige l'affichage des dates Webflow (toujours rendues en anglais,
 * même avec Webflow Localization) en les reformattant selon la langue
 * courante de la page, via Intl.DateTimeFormat et un custom attribute
 * contenant la date brute au format ISO.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_DATE = 'wu-localize-date';
  const ATTR_LOCALE = 'wu-localize-date-locale';
  const ATTR_STYLE = 'wu-localize-date-style';
  const ATTR_APPLIED = 'wu-localize-date-applied';
  const VALID_STYLES = ['full', 'long', 'medium', 'short'];
  const DEFAULT_STYLE = 'long';
  const DEFAULT_LOCALE = 'en';

  function init() {
    const elements = document.querySelectorAll(`[${ATTR_DATE}]`);
    if (!elements.length) return;

    elements.forEach(processElement);
  }

  function processElement(el) {
    // Idempotence : ne pas retraiter un élément déjà formaté
    if (el.hasAttribute(ATTR_APPLIED)) return;

    const raw = el.getAttribute(ATTR_DATE);
    const date = parseISODate(raw);
    if (!date) return;

    const locale = resolveLocale(el);
    const style = resolveStyle(el);

    const formatted = formatDate(date, locale, style);
    if (!formatted) return;

    el.textContent = formatted;
    el.setAttribute(ATTR_APPLIED, `${locale}:${style}`);
  }

  /**
   * Parse une date ISO (YYYY-MM-DD, ou datetime ISO complet) en objet
   * Date construit à partir des composants locaux, pour éviter le
   * décalage d'un jour causé par l'interprétation UTC de new Date(string).
   */
  function parseISODate(raw) {
    if (!raw) return null;

    const [datePart] = raw.trim().split('T');
    const parts = datePart.split('-').map(Number);
    const [year, month, day] = parts;

    if (!year || !month || !day || parts.some(isNaN)) return null;

    const date = new Date(year, month - 1, day);
    return isNaN(date) ? null : date;
  }

  function resolveLocale(el) {
    return (
      el.getAttribute(ATTR_LOCALE) ||
      document.documentElement.lang ||
      navigator.language ||
      DEFAULT_LOCALE
    );
  }

  function resolveStyle(el) {
    const style = el.getAttribute(ATTR_STYLE);
    return VALID_STYLES.includes(style) ? style : DEFAULT_STYLE;
  }

  /**
   * Formate la date avec Intl.DateTimeFormat. Retombe sur la locale par
   * défaut si la locale fournie est invalide, sans planter la page.
   */
  function formatDate(date, locale, style) {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(date);
    } catch (err) {
      try {
        return new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: style }).format(date);
      } catch (fallbackErr) {
        return null;
      }
    }
  }

  // Démarrage compatible avec le chargement Webflow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose init() pour le contenu injecté dynamiquement
  // (CMS Load, modals, AJAX, tabs avec contenu lazy…)
  window.WU = window.WU || {};
  window.WU.localizeDate = { init };
})();
