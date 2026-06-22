/**
 * webflow-utils / finsweet/sort-direction
 * Force la direction (asc/desc) des sort triggers Finsweet List Sort,
 * sans toggle, avec sélection exclusive et bouton actif par défaut optionnel.
 *
 * Architecture :
 * Chaque bouton porte fs-list-element="sort-trigger" + fs-list-field (pour
 * activer le module de sort Finsweet) + wu-sort-direction pour la direction
 * voulue. Au clic, on intercepte en phase CAPTURE pour bloquer le listener
 * natif de Finsweet (qui ferait son toggle), et on mute sorting.value
 * directement. Le watch interne de Finsweet (deep: true, debounce 0) détecte
 * le changement et déclenche son pipeline sort + render.
 *
 * Dépendance : Finsweet Attributes v2 (List Sort).
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_DIRECTION = 'wu-sort-direction';
  const ATTR_INSTANCE = 'wu-sort-direction-instance';
  const ATTR_ACTIVE_CLASS = 'wu-sort-direction-active-class';
  const ATTR_DEFAULT = 'wu-sort-direction-default';
  const ATTR_APPLIED = 'wu-sort-direction-applied';
  const ATTR_FS_ELEMENT = 'fs-list-element';
  const ATTR_FS_FIELD = 'fs-list-field';

  const DEFAULT_ACTIVE_CLASS = 'is-active';
  const VALID_DIRECTIONS = ['asc', 'desc'];

  const itemsPerInstance = new WeakMap();
  const effectsAttached = new WeakSet();

  function warn() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[wu-sort-direction]');
    console.warn.apply(console, args);
  }

  function init() {
    const triggers = document.querySelectorAll(`[${ATTR_DIRECTION}]`);
    if (!triggers.length) return;

    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push([
      'list',
      function (listInstances) {
        window.WU = window.WU || {};
        window.WU.sortDirection = window.WU.sortDirection || {};
        window.WU.sortDirection._instances = listInstances;

        triggers.forEach(function (t) { processTrigger(t, listInstances); });
        applyDefaultSorts(triggers, listInstances);
      }
    ]);
  }

  function processTrigger(trigger, listInstances) {
    if (trigger.hasAttribute(ATTR_APPLIED)) return;

    const direction = trigger.getAttribute(ATTR_DIRECTION);
    if (VALID_DIRECTIONS.indexOf(direction) === -1) {
      warn('direction invalide:', direction, trigger);
      return;
    }

    const fieldKey = trigger.getAttribute(ATTR_FS_FIELD);
    if (!fieldKey) {
      warn(
        'fs-list-field manquant sur', trigger,
        '— le bouton doit avoir fs-list-element="sort-trigger" + fs-list-field="..."'
      );
      return;
    }

    if (trigger.getAttribute(ATTR_FS_ELEMENT) !== 'sort-trigger') {
      warn(
        'fs-list-element="sort-trigger" manquant sur', trigger,
        '— requis pour activer le module sort de Finsweet'
      );
      return;
    }

    const instanceKey = trigger.getAttribute(ATTR_INSTANCE) || null;
    const activeClass = trigger.getAttribute(ATTR_ACTIVE_CLASS) || DEFAULT_ACTIVE_CLASS;

    const listInstance = listInstances.find(function (li) {
      return (li.instance || null) === instanceKey;
    });
    if (!listInstance) {
      warn('aucune List instance ne matche', instanceKey || '(default)', 'pour', trigger);
      return;
    }

    if (!itemsPerInstance.has(listInstance)) itemsPerInstance.set(listInstance, []);
    itemsPerInstance.get(listInstance).push({
      trigger: trigger,
      fieldKey: fieldKey,
      direction: direction,
      activeClass: activeClass
    });

    attachActiveStateEffect(listInstance);

    // Click handler en phase capture : bloque le listener bubble natif de
    // Finsweet (qui ferait un toggle), et mute sorting.value directement.
    // Le watch interne deep:true de Finsweet trigge alors le sort + render.
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      const current = listInstance.sorting.value || {};
      const isAlreadyActive =
        current.fieldKey === fieldKey &&
        current.direction === direction;

      if (isAlreadyActive) return;

      listInstance.sorting.value = {
        fieldKey: fieldKey,
        direction: direction,
        interacted: true
      };
    }, { capture: true });

    trigger.setAttribute(ATTR_APPLIED, '');
  }

  /**
   * Pour chaque instance, applique le tri du premier trigger marqué
   * wu-sort-direction-default. `interacted: false` pour ne pas déclencher
   * le scroll-to-anchor ni le reset de pagination au chargement.
   */
  function applyDefaultSorts(triggers, listInstances) {
    const seenInstances = new Set();

    triggers.forEach(function (trigger) {
      if (!trigger.hasAttribute(ATTR_DEFAULT)) return;

      const instanceKey = trigger.getAttribute(ATTR_INSTANCE) || null;
      if (seenInstances.has(instanceKey)) {
        warn(
          'plusieurs', ATTR_DEFAULT, 'pour l\'instance', instanceKey || '(default)',
          '— seul le premier est appliqué.', trigger
        );
        return;
      }
      seenInstances.add(instanceKey);

      const listInstance = listInstances.find(function (li) {
        return (li.instance || null) === instanceKey;
      });
      if (!listInstance) return;

      const direction = trigger.getAttribute(ATTR_DIRECTION);
      const fieldKey = trigger.getAttribute(ATTR_FS_FIELD);
      if (VALID_DIRECTIONS.indexOf(direction) === -1 || !fieldKey) return;

      const current = listInstance.sorting.value || {};
      if (current.fieldKey === fieldKey && current.direction === direction) return;

      listInstance.sorting.value = {
        fieldKey: fieldKey,
        direction: direction,
        interacted: false
      };
    });
  }

  /**
   * Effect réactif unique par instance. Pose/retire la classe active sur
   * chaque bouton selon le sorting courant. Réagit à TOUT changement (clic,
   * default au chargement, URL params, code externe).
   */
  function attachActiveStateEffect(listInstance) {
    if (effectsAttached.has(listInstance)) return;
    effectsAttached.add(listInstance);

    listInstance.effect(function () {
      const items = itemsPerInstance.get(listInstance);
      if (!items) return;
      const current = listInstance.sorting.value || {};
      items.forEach(function (item) {
        const isActive =
          current.fieldKey === item.fieldKey &&
          current.direction === item.direction;
        item.trigger.classList.toggle(item.activeClass, isActive);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WU = window.WU || {};
  window.WU.sortDirection = window.WU.sortDirection || {};
  window.WU.sortDirection.init = init;
})();
