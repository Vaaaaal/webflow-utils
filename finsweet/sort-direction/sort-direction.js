/**
 * webflow-utils / finsweet/sort-direction
 * Force la direction (asc/desc) des sort triggers Finsweet List Sort,
 * sans toggle, avec sélection exclusive.
 *
 * Architecture :
 * Chaque bouton porte fs-list-element="sort-trigger" + fs-list-field (pour
 * activer le module de sort Finsweet sur la page) + wu-sort-direction pour
 * la direction voulue.
 *
 * Au clic, on intercepte en phase CAPTURE pour bloquer le listener natif
 * de Finsweet (qui ferait son toggle), et on mute listInstance.sorting.value
 * directement. Le watch interne de Finsweet (deep: true, debounce 0) détecte
 * le changement et déclenche son pipeline : sortListItems() → render.
 *
 * Le sort lui-même utilise donc l'implémentation Finsweet (number/date/text,
 * gestion des Array values, animations CSS, scroll-to-anchor, query params…).
 *
 * Dépendance : Finsweet Attributes v2 (List Sort).
 * Debug : poser window.WU_DEBUG = true avant le script.
 */
(function () {
  'use strict';

  const DEBUG = false;

  const ATTR_DIRECTION = 'wu-sort-direction';
  const ATTR_INSTANCE = 'wu-sort-direction-instance';
  const ATTR_ACTIVE_CLASS = 'wu-sort-direction-active-class';
  const ATTR_APPLIED = 'wu-sort-direction-applied';
  const ATTR_FS_ELEMENT = 'fs-list-element';
  const ATTR_FS_FIELD = 'fs-list-field';

  const DEFAULT_ACTIVE_CLASS = 'is-active';
  const VALID_DIRECTIONS = ['asc', 'desc'];

  const itemsPerInstance = new WeakMap();
  const effectsAttached = new WeakSet();

  function log() {
    if (!DEBUG && !window.WU_DEBUG) return;
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[wu-sort-direction]');
    console.log.apply(console, args);
  }

  function warn() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[wu-sort-direction]');
    console.warn.apply(console, args);
  }

  function init() {
    const triggers = document.querySelectorAll(`[${ATTR_DIRECTION}]`);
    log('init() — triggers found:', triggers.length);
    if (!triggers.length) return;

    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push([
      'list',
      function (listInstances) {
        log('🟢 Finsweet ready —', listInstances.length, 'instance(s)');
        window.WU = window.WU || {};
        window.WU.sortDirection = window.WU.sortDirection || {};
        window.WU.sortDirection._instances = listInstances;
        triggers.forEach(function (t) { processTrigger(t, listInstances); });
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

    log('trigger configuré:', { fieldKey: fieldKey, direction: direction, instance: instanceKey || '(default)' });

    if (!itemsPerInstance.has(listInstance)) itemsPerInstance.set(listInstance, []);
    itemsPerInstance.get(listInstance).push({
      trigger: trigger,
      fieldKey: fieldKey,
      direction: direction,
      activeClass: activeClass
    });

    attachActiveStateEffect(listInstance);

    // ─── Click handler en phase CAPTURE ──────────────────────────────
    // S'exécute AVANT le listener bubble de Finsweet (cf. buttons.ts).
    // stopImmediatePropagation bloque le listener natif → pas de toggle.
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      const current = listInstance.sorting.value || {};
      const isAlreadyActive =
        current.fieldKey === fieldKey &&
        current.direction === direction;

      if (isAlreadyActive) {
        log('CLICK no-op (déjà actif):', fieldKey, direction);
        return;
      }

      log('CLICK →', fieldKey, direction);

      // Réassignation complète de .value (comme le fait Finsweet en interne,
      // cf. buttons.ts). Le watch interne deep:true détecte le changement
      // et déclenche triggerHook('sort') debounced.
      listInstance.sorting.value = {
        fieldKey: fieldKey,
        direction: direction,
        interacted: true
      };
    }, { capture: true });

    trigger.setAttribute(ATTR_APPLIED, '');
  }

  /**
   * Effect réactif unique par instance pour gérer la classe active sur les
   * boutons. Réagit à TOUT changement de sorting (clic, URL params, code
   * externe), donc l'état actif reste synchronisé.
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
