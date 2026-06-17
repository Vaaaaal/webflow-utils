/**
 * webflow-utils / rich-text/blockquote-author
 * Transforme les blockquotes d'un Rich Text Webflow contenant un
 * séparateur (`///` par défaut) en structure sémantique
 * <figure><blockquote>…</blockquote><figcaption>Auteur</figcaption></figure>.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_SCOPE = 'wu-blockquote-author';
  const ATTR_SEPARATOR = 'wu-blockquote-author-separator';
  const ATTR_APPLIED = 'wu-blockquote-author-applied';
  const DEFAULT_SEPARATOR = '///';

  function init() {
    const scopes = document.querySelectorAll(`[${ATTR_SCOPE}]`);
    if (!scopes.length) return;

    scopes.forEach(processScope);
  }

  function processScope(scope) {
    const separator = scope.getAttribute(ATTR_SEPARATOR) || DEFAULT_SEPARATOR;
    const regex = buildSeparatorRegex(separator);

    const blockquotes = scope.querySelectorAll('blockquote');
    blockquotes.forEach(bq => processBlockquote(bq, regex));
  }

  function processBlockquote(blockquote, regex) {
    // Idempotence : skip si déjà encapsulé dans un <figure> traité
    if (blockquote.parentElement && blockquote.parentElement.matches(`figure[${ATTR_APPLIED}]`)) return;

    const fullText = blockquote.textContent;
    const match = fullText.match(regex);
    if (!match) return;

    // On skip si rien avant (citation vide) ou rien après (pas d'auteur)
    const beforeText = fullText.slice(0, match.index).trim();
    const author = fullText.slice(match.index + match[0].length).trim();
    if (!beforeText || !author) return;

    // Localiser le text node contenant le séparateur + offset local
    const sep = findSeparatorPosition(blockquote, match.index);
    if (!sep) return;

    // Tronquer le contenu du blockquote au point du séparateur
    truncateAt(blockquote, sep.node, sep.offset);

    // Wrapper dans <figure> + <figcaption>
    const figure = document.createElement('figure');
    figure.setAttribute(ATTR_APPLIED, '');

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = author;

    blockquote.parentNode.insertBefore(figure, blockquote);
    figure.appendChild(blockquote);
    figure.appendChild(figcaption);
  }

  /**
   * Localise le text node contenant le séparateur en parcourant les nœuds
   * texte dans l'ordre et en cumulant leurs longueurs. Renvoie le nœud et
   * l'offset local où commence le séparateur.
   */
  function findSeparatorPosition(container, globalOffset) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let cumulative = 0;
    let node;

    while ((node = walker.nextNode())) {
      const len = node.textContent.length;
      if (cumulative + len > globalOffset) {
        return { node, offset: globalOffset - cumulative };
      }
      cumulative += len;
    }

    return null;
  }

  /**
   * Tronque le contenu du `container` à partir de `node`/`offset` :
   * - coupe le texte du `node` à `offset` (puis trim à droite)
   * - supprime tous les nœuds frères suivants, en remontant les ancêtres
   * - nettoie les ancêtres devenus vides (ex. <p> vide) sans toucher au container
   */
  function truncateAt(container, node, offset) {
    node.textContent = node.textContent.slice(0, offset).replace(/\s+$/, '');

    let current = node;
    while (current && current !== container) {
      let sibling = current.nextSibling;
      while (sibling) {
        const next = sibling.nextSibling;
        sibling.remove();
        sibling = next;
      }
      current = current.parentNode;
    }

    cleanupEmpty(node, container);
  }

  /**
   * Supprime `node` et ses ancêtres vides en remontant, jusqu'à atteindre
   * un nœud non vide ou le container (qu'on ne supprime jamais).
   */
  function cleanupEmpty(node, container) {
    let current = node;
    while (current && current !== container && !current.textContent.trim()) {
      const parent = current.parentNode;
      current.remove();
      current = parent;
    }
  }

  /**
   * Construit une regex à partir du séparateur custom (string), avec
   * espaces optionnels autour pour gérer ` /// `, `///`, `  ///  `, etc.
   */
  function buildSeparatorRegex(separator) {
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\s*${escaped}\\s*`);
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
  window.WU.blockquoteAuthor = { init };
})();
