/**
 * webflow-utils / cms/combine
 * Combine deux (ou plusieurs) collections Webflow en une seule liste,
 * avec tri et limite optionnels, via custom attributes.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_TARGET = 'wu-combine';
  const ATTR_SOURCE = 'wu-combine-source';
  const ATTR_SORT_VALUE = 'wu-combine-sort-value';
  const ATTR_SORT_TYPE = 'wu-combine-sort-type';
  const ATTR_SORT_DIR = 'wu-combine-sort-dir';
  const ATTR_LIMIT = 'wu-combine-limit';

  function init() {
    const targets = document.querySelectorAll(`[${ATTR_TARGET}]`);
    if (!targets.length) return;

    targets.forEach(processCombo);
  }

  function processCombo(target) {
    const name = target.getAttribute(ATTR_TARGET);
    if (!name) return;

    const sortType = target.getAttribute(ATTR_SORT_TYPE); // date | number | string | null
    const sortDir = (target.getAttribute(ATTR_SORT_DIR) || 'asc').toLowerCase();
    const limitRaw = target.getAttribute(ATTR_LIMIT);
    const limit = limitRaw ? parseInt(limitRaw, 10) : null;

    // Conteneur d'items dans la cible (Webflow utilise .w-dyn-items)
    const targetItemsWrap = target.querySelector('.w-dyn-items');

    // Récupérer toutes les sources qui partagent le même nom
    const sources = document.querySelectorAll(`[${ATTR_SOURCE}="${name}"]`);

    // Items de la cible (s'il y en a)
    let items = targetItemsWrap
      ? Array.from(targetItemsWrap.querySelectorAll(':scope > .w-dyn-item'))
      : [];

    // Items des sources (puis on supprime les listes sources du DOM)
    sources.forEach(source => {
      const sourceItems = source.querySelectorAll('.w-dyn-item');
      items = items.concat(Array.from(sourceItems));
      source.remove();
    });

    // Cas : tout est vide → on cache la cible
    if (items.length === 0) {
      target.style.display = 'none';
      return;
    }

    // Tri
    if (sortType) {
      items.sort((a, b) => compare(
        a.getAttribute(ATTR_SORT_VALUE),
        b.getAttribute(ATTR_SORT_VALUE),
        sortType
      ));
      if (sortDir === 'desc') items.reverse();
    }

    // Limite (suppression du DOM des items en trop)
    if (limit && items.length > limit) {
      items.slice(limit).forEach(el => el.remove());
      items = items.slice(0, limit);
    }

    // Vider le conteneur cible et réinjecter dans l'ordre
    if (targetItemsWrap) {
      const frag = document.createDocumentFragment();
      items.forEach(item => frag.appendChild(item));
      targetItemsWrap.innerHTML = '';
      targetItemsWrap.appendChild(frag);
    }

    // Masquer le "empty state" de Webflow si présent
    const empty = target.querySelector('.w-dyn-empty');
    if (empty) empty.style.display = 'none';
  }

  function compare(a, b, type) {
    // Valeurs nulles ou vides à la fin
    if (a == null || a === '') return 1;
    if (b == null || b === '') return -1;

    if (type === 'date') {
      return new Date(a) - new Date(b);
    }
    if (type === 'number') {
      return parseFloat(a) - parseFloat(b);
    }
    // string (par défaut)
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  }

  // Démarrage compatible avec le chargement Webflow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
