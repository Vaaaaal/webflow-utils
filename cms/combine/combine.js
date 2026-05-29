// Merge muliples collection list (CMS) together and give the ability to filter & sort them by an attribute (same type : date, string, number)
  (function () {
    'use strict';

    const ATTR_TARGET = 'data-combine';
    const ATTR_SOURCE = 'data-combine-source';
    const ATTR_SORT_VALUE = 'data-sort-value';

    function init() {
      const targets = document.querySelectorAll(`[${ATTR_TARGET}]`);
      if (!targets.length) return;
      targets.forEach(processCombo);
    }

    function processCombo(target) {
      const name = target.getAttribute(ATTR_TARGET);
      if (!name) return;

      const sortType = target.getAttribute('data-combine-sort-type');
      const sortDir = (target.getAttribute('data-combine-sort-dir') || 'asc').toLowerCase();
      const limitRaw = target.getAttribute('data-combine-limit');
      const limit = limitRaw ? parseInt(limitRaw, 10) : null;

      const targetItemsWrap = target.querySelector('.w-dyn-items');
      const sources = document.querySelectorAll(`[${ATTR_SOURCE}="${name}"]`);

      let items = targetItemsWrap ? Array.from(targetItemsWrap.querySelectorAll(':scope > .w-dyn-item')) : [];

      sources.forEach((source) => {
        const sourceItems = source.querySelectorAll('.w-dyn-item');
        items = items.concat(Array.from(sourceItems));
        source.remove();
      });

      if (items.length === 0) {
        target.style.display = 'none';
        return;
      }

      if (sortType) {
        items.sort((a, b) => compare(a.getAttribute(ATTR_SORT_VALUE), b.getAttribute(ATTR_SORT_VALUE), sortType));
        if (sortDir === 'desc') items.reverse();
      }

      if (limit && items.length > limit) {
        items.slice(limit).forEach((el) => el.remove());
        items = items.slice(0, limit);
      }

      if (targetItemsWrap) {
        const frag = document.createDocumentFragment();
        items.forEach((item) => frag.appendChild(item));
        targetItemsWrap.innerHTML = '';
        targetItemsWrap.appendChild(frag);
      }

      const empty = target.querySelector('.w-dyn-empty');
      if (empty) empty.style.display = 'none';
    }

    function compare(a, b, type) {
      if (a == null || a === '') return 1;
      if (b == null || b === '') return -1;
      if (type === 'date') return new Date(a) - new Date(b);
      if (type === 'number') return parseFloat(a) - parseFloat(b);
      return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
