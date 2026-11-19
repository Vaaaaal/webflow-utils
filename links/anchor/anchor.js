/**
 * webflow-utils / links/anchor
 * Ajoute une ancre (#id) à un lien de page Webflow.
 *
 * Dans le Designer, un lien de type « Page » ne permet pas de viser une section
 * d'une autre page. Ce module complète le href au runtime : on garde le lien
 * Page natif (Webflow met à jour le chemin si la page est renommée / déplacée)
 * et on lui ajoute l'ancre définie dans `wu-anchor`.
 *
 *   <a href="/services" wu-anchor="tarifs">  →  href="/services#tarifs"
 *
 * Gère aussi :
 *  - les query strings existantes   /page?ref=x   → /page?ref=x#tarifs
 *  - une ancre déjà présente        /page#old     → /page#tarifs (remplacée)
 *  - les liens vides / « # »        href="#"      → /page-courante#tarifs
 *  - les liens externes             l'origine est conservée
 *
 * Les liens mailto:, tel:, javascript:… sont ignorés.
 *
 * Dépendance : aucune.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_TARGET = 'wu-anchor';
  const ATTR_APPLIED = 'wu-anchor-applied';

  function warn() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[wu-anchor]');
    console.warn.apply(console, args);
  }

  function init() {
    // Les valeurs vides sont exclues d'office : un composant partagé (ex. un
    // Clickable dont le champ Anchor n'est pas rempli) écrit wu-anchor="" sur
    // chaque lien — c'est le cas normal, pas une erreur.
    const links = document.querySelectorAll(`a[${ATTR_TARGET}]:not([${ATTR_TARGET}=""])`);
    if (!links.length) return;

    links.forEach(processLink);
  }

  function processLink(a) {
    if (a.hasAttribute(ATTR_APPLIED)) return;

    const id = (a.getAttribute(ATTR_TARGET) || '').trim().replace(/^#/, '');
    if (!id) return; // valeur blanche (espaces / « # » seul) : ignorée sans bruit

    // href absent ou « # » seul (lien vide Webflow) → page courante.
    const rawHref = (a.getAttribute('href') || '').trim();
    const base = rawHref && rawHref !== '#' ? rawHref : location.pathname + location.search;

    let url;
    try {
      url = new URL(base, location.href);
    } catch (e) {
      warn('href invalide:', rawHref, a);
      a.setAttribute(ATTR_APPLIED, ''); // évite de re-signaler à chaque init()
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      warn('protocole non supporté (' + url.protocol + ') — lien ignoré.', a);
      a.setAttribute(ATTR_APPLIED, ''); // évite de re-signaler à chaque init()
      return;
    }

    url.hash = id;

    // Lien interne : on garde un href relatif (comme Webflow).
    // Lien externe : on conserve l'URL complète.
    const href = url.origin === location.origin
      ? url.pathname + url.search + url.hash
      : url.href;

    a.setAttribute('href', href);
    a.setAttribute(ATTR_APPLIED, '');
  }

  // Démarrage compatible avec le chargement Webflow.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose init() pour le contenu injecté dynamiquement
  // (CMS Load, modals, AJAX, tabs avec contenu lazy…).
  window.WU = window.WU || {};
  window.WU.anchor = { init };
})();
