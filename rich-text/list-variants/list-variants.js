/**
 * webflow-utils / rich-text/list-variants
 * Transforme les listes (<ul>/<ol>) d'un Rich Text Webflow en variantes
 * stylées (checkmarks, flèches, étoiles…) via un marqueur textuel posé
 * au début du premier <li>.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_SCOPE = 'wu-list-variants';
  const ATTR_MARKER = 'wu-list-variants-marker';
  const ATTR_APPLIED = 'wu-list-variants-applied';
  const DEFAULT_MARKER_REGEX = /^\/\/\s*(\S+)\s*/;

  function init() {
    const scopes = document.querySelectorAll(`[${ATTR_SCOPE}]`);
    if (!scopes.length) return;

    scopes.forEach(processScope);
  }

  function processScope(scope) {
    const customPattern = scope.getAttribute(ATTR_MARKER);
    const regex = customPattern ? safeRegex(customPattern) : DEFAULT_MARKER_REGEX;

    const lists = scope.querySelectorAll('ul, ol');
    lists.forEach(list => processList(list, regex));
  }

  function processList(list, regex) {
    // Idempotence : ne pas retraiter une liste déjà transformée
    if (list.hasAttribute(ATTR_APPLIED)) return;

    const firstItem = list.querySelector(':scope > li');
    if (!firstItem) return;

    const match = firstItem.textContent.match(regex);
    if (!match) return;

    const marker = match[0];
    const variant = match[1];
    if (!variant) return;

    stripLeading(firstItem, marker.length);
    list.classList.add(`is-${variant}`);
    list.setAttribute(ATTR_APPLIED, variant);
  }

  /**
   * Retire les `length` premiers caractères d'un élément en répartissant
   * la suppression sur ses nœuds texte. Préserve le formatage inline
   * (bold, italique, lien) si le marqueur a été stylé par mégarde.
   */
  function stripLeading(element, length) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let remaining = length;
    let node;

    while (remaining > 0 && (node = walker.nextNode())) {
      const text = node.textContent;
      if (text.length <= remaining) {
        remaining -= text.length;
        node.textContent = '';
      } else {
        node.textContent = text.slice(remaining);
        remaining = 0;
      }
    }
  }

  /**
   * Construit une RegExp à partir d'une chaîne. Pattern invalide → on
   * retombe sur la regex par défaut, sans casser la page.
   */
  function safeRegex(pattern) {
    try {
      return new RegExp(pattern);
    } catch (err) {
      return DEFAULT_MARKER_REGEX;
    }
  }

  // Démarrage compatible avec le chargement Webflow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
