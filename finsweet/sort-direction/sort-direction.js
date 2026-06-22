/**
 * webflow-utils / finsweet/sort-direction
 * Force la direction (asc/desc) des sort triggers Finsweet List Sort.
 * Chaque bouton applique une direction fixe — pas de toggle.
 *
 * Dépendance : Finsweet Attributes v2 (List Sort) doit être chargé sur la page.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_DIRECTION = 'wu-sort-direction';                  // sur le bouton : asc | desc
  const ATTR_FIELD = 'wu-sort-direction-field';                // sur le bouton : field key (date, price…)
  const ATTR_INSTANCE = 'wu-sort-direction-instance';          // optionnel : match fs-list-instance
  const ATTR_ACTIVE_CLASS = 'wu-sort-direction-active-class';  // optionnel : classe active (défaut is-active)
  const ATTR_APPLIED = 'wu-sort-direction-applied';            // posé par le script : garde d'idempotence

  const DEFAULT_ACTIVE_CLASS = 'is-active';
  const VALID_DIRECTIONS = ['asc', 'desc'];

  // État partagé entre les appels à init() (pour supporter le re-init dynamique)
  const itemsPerInstance = new WeakMap();   // listInstance → [{trigger, fieldKey, direction, activeClass}]
  const effectsAttached = new WeakSet();    // instances dont l'effect réactif est déjà branché

  function init() {
    const triggers = document.querySelectorAll(`[${ATTR_DIRECTION}]`);
    if (!triggers.length) return;

    // On délègue le travail à un callback Finsweet : il est invoqué une fois
    // que les List instances sont prêtes. Re-init OK : un nouveau push relance
    // simplement la passe sur les triggers (les anciens sont skip par l'idempotence).
    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push([
      'list',
      function (listInstances) {
        triggers.forEach(function (trigger) {
          processTrigger(trigger, listInstances);
        });
      }
    ]);
  }

  function processTrigger(trigger, listInstances) {
    // Idempotence : un bouton déjà traité n'est jamais retouché.
    if (trigger.hasAttribute(ATTR_APPLIED)) return;

    const direction = trigger.getAttribute(ATTR_DIRECTION);
    const fieldKey = trigger.getAttribute(ATTR_FIELD);

    if (VALID_DIRECTIONS.indexOf(direction) === -1) return; // direction inconnue → ignoré silencieusement
    if (!fieldKey) return;                                  // pas de field → ignoré silencieusement

    const instanceKey = trigger.getAttribute(ATTR_INSTANCE) || null;
    const activeClass = trigger.getAttribute(ATTR_ACTIVE_CLASS) || DEFAULT_ACTIVE_CLASS;

    const listInstance = listInstances.find(function (li) {
      return (li.instance || null) === instanceKey;
    });
    if (!listInstance) return; // aucune List ne matche → ignoré silencieusement

    // Enregistrer le trigger dans le bucket de son instance, puis brancher
    // l'effect réactif si pas déjà fait pour cette instance.
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
      listInstance.sorting.value = {
        fieldKey: fieldKey,
        direction: direction,
        interacted: true
      };
    });

    trigger.setAttribute(ATTR_APPLIED, '');
  }

  /**
   * Branche un seul effect réactif par instance, qui synchronise la classe
   * active de tous ses boutons avec le sorting courant. Robuste au re-init :
   * l'effect lit le bucket à chaque exécution, donc les boutons ajoutés plus
   * tard sont automatiquement gérés sans rebrancher d'effect.
   */
  function attachActiveStateEffect(listInstance) {
    if (effectsAttached.has(listInstance)) return;
    effectsAttached.add(listInstance);

    listInstance.effect(function () {
      const items = itemsPerInstance.get(listInstance);
      if (!items) return;

      const current = listInstance.sorting.value;
      items.forEach(function (item) {
        const isActive =
          current.fieldKey === item.fieldKey &&
          current.direction === item.direction;
        item.trigger.classList.toggle(item.activeClass, isActive);
      });
    });
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
  window.WU.sortDirection = { init: init };
})();
