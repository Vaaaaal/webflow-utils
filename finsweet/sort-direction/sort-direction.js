/**
 * webflow-utils / finsweet/sort-direction
 * Force la direction (asc/desc) des sort triggers Finsweet List Sort.
 * Chaque bouton applique une direction fixe — pas de toggle.
 *
 * Dépendance : Finsweet Attributes v2 (List Sort) doit être chargé sur la page.
 *
 * Debug : poser window.WU_DEBUG = true avant le script, ou flipper la constante
 * DEBUG ci-dessous, pour activer les logs verbeux.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const DEBUG = false;

  const ATTR_DIRECTION = 'wu-sort-direction';
  const ATTR_FIELD = 'wu-sort-direction-field';
  const ATTR_INSTANCE = 'wu-sort-direction-instance';
  const ATTR_ACTIVE_CLASS = 'wu-sort-direction-active-class';
  const ATTR_APPLIED = 'wu-sort-direction-applied';

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
    log('init() called — triggers found:', triggers.length, triggers);
    if (!triggers.length) return;

    if (!window.FinsweetAttributes) {
      warn('window.FinsweetAttributes introuvable au moment du init(). ' +
           'Vérifier que le script Finsweet est chargé AVANT ce module.');
    }

    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push([
      'list',
      function (listInstances) {
        log('Finsweet callback fired — listInstances:', listInstances.length, listInstances);

        // Expose pour debug console : window.WU.sortDirection._instances[0].sorting.value
        window.WU = window.WU || {};
        window.WU.sortDirection = window.WU.sortDirection || {};
        window.WU.sortDirection._instances = listInstances;

        triggers.forEach(function (trigger) {
          processTrigger(trigger, listInstances);
        });
      }
    ]);
  }

  function processTrigger(trigger, listInstances) {
    if (trigger.hasAttribute(ATTR_APPLIED)) {
      log('skip (déjà traité):', trigger);
      return;
    }

    const direction = trigger.getAttribute(ATTR_DIRECTION);
    const fieldKey = trigger.getAttribute(ATTR_FIELD);

    if (VALID_DIRECTIONS.indexOf(direction) === -1) {
      warn('direction invalide:', direction, '→ attendu "asc" ou "desc"', trigger);
      return;
    }
    if (!fieldKey) {
      warn('field manquant (wu-sort-direction-field) sur', trigger);
      return;
    }

    const instanceKey = trigger.getAttribute(ATTR_INSTANCE) || null;
    const activeClass = trigger.getAttribute(ATTR_ACTIVE_CLASS) || DEFAULT_ACTIVE_CLASS;

    const listInstance = listInstances.find(function (li) {
      return (li.instance || null) === instanceKey;
    });
    if (!listInstance) {
      warn('aucune List instance ne matche', instanceKey || '(default)', 'pour', trigger,
           '— instances disponibles:', listInstances.map(function (li) { return li.instance || '(default)'; }));
      return;
    }

    log('trigger configuré:', { trigger: trigger, fieldKey: fieldKey, direction: direction, instance: instanceKey || '(default)' });

    if (!itemsPerInstance.has(listInstance)) itemsPerInstance.set(listInstance, []);
    itemsPerInstance.get(listInstance).push({
      trigger: trigger,
      fieldKey: fieldKey,
      direction: direction,
      activeClass: activeClass
    });

    attachActiveStateEffect(listInstance);

    trigger.addEventListener('click', function (e) {
      e.preventDefault();

      log('CLICK sur', trigger);
      log('  sorting AVANT mutation:', JSON.parse(JSON.stringify(listInstance.sorting.value)));
      log('  items dans la list AVANT:', listInstance.items.value.length);

      // ⚠️ Mutation IN-PLACE des propriétés (pas de remplacement de l'objet entier).
      // C'est ce que montre la doc Finsweet et c'est probablement ce que leur
      // watcher interne attend pour déclencher le re-render de la liste.
      listInstance.sorting.value.fieldKey = fieldKey;
      listInstance.sorting.value.direction = direction;
      listInstance.sorting.value.interacted = true;

      log('  sorting APRÈS mutation:', JSON.parse(JSON.stringify(listInstance.sorting.value)));

      // Filet de sécurité : si pour une raison X le re-sort ne se déclenche pas
      // automatiquement, on force le hook. No-op si le sort tourne déjà.
      if (typeof listInstance.triggerHook === 'function') {
        listInstance.triggerHook('sort');
        log('  triggerHook("sort") appelé');
      }
    });

    trigger.setAttribute(ATTR_APPLIED, '');
  }

  function attachActiveStateEffect(listInstance) {
    if (effectsAttached.has(listInstance)) return;
    effectsAttached.add(listInstance);
    log('attachActiveStateEffect — branchement de l\'effect réactif pour l\'instance', listInstance.instance || '(default)');

    listInstance.effect(function () {
      const items = itemsPerInstance.get(listInstance);
      if (!items) return;

      const current = listInstance.sorting.value;
      log('effect tick — sorting actuel:', JSON.parse(JSON.stringify(current)),
          '| items à check:', items.length);

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
