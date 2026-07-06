/**
 * webflow-utils / links/obfuscate-onclick
 * Version simplifiée de l'obfuscation de liens, pour le contrôle de maillage SEO.
 *
 * Objectif : empêcher la transmission de jus SEO vers certaines URLs (pages
 * contact, demande de démo…) en évitant qu'elles soient des <a href> crawlables.
 * L'URL est stockée EN CLAIR dans l'attribut `wu-obfuscate-onclick` et la
 * navigation est câblée en JS au clic — comme la technique <button onclick>,
 * mais posable sur N'IMPORTE QUEL élément (div, span, button, li…).
 *
 * Le HTML publié ne contient aucun <a href> vers ces URLs : Googlebot n'a donc
 * pas de lien à suivre ni à comptabiliser dans le graphe.
 *
 * Dépendance : aucune.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_TARGET = 'wu-obfuscate-onclick';
  const ATTR_BLANK = 'wu-obfuscate-onclick-blank';   // présence => nouvel onglet
  const ATTR_APPLIED = 'wu-obfuscate-onclick-applied';

  function init() {
    const els = document.querySelectorAll(`[${ATTR_TARGET}]`);
    els.forEach(processElement);
  }

  function processElement(el) {
    if (el.hasAttribute(ATTR_APPLIED)) return;

    const href = el.getAttribute(ATTR_TARGET);
    if (!href) {
      console.warn('[wu-obfuscate-onclick] valeur vide sur', el);
      return;
    }

    const blank = el.hasAttribute(ATTR_BLANK);

    // Sémantique + accessibilité si l'élément n'est pas déjà interactif.
    const tag = el.tagName;
    const nativelyInteractive = tag === 'A' || tag === 'BUTTON';
    if (!nativelyInteractive) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    }
    if (!el.style.cursor) el.style.cursor = 'pointer';

    const navigate = function () {
      if (blank) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    };

    el.addEventListener('click', function (e) {
      e.preventDefault();
      navigate();
    });

    // Enter / Espace pour le pilotage clavier.
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        navigate();
      }
    });

    el.setAttribute(ATTR_APPLIED, '');
  }

  // Démarrage compatible avec le chargement Webflow.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose init() pour le contenu injecté dynamiquement (CMS Load, modals, AJAX…).
  window.WU = window.WU || {};
  window.WU.obfuscateOnclick = { init };
})();
