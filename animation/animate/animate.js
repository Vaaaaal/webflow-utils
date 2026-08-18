/**
 * webflow-utils / animation/animate
 * Anime l'apparition des éléments au scroll (fade, scale…) via des
 * custom attributes, avec support des groupes en stagger. Repose sur
 * GSAP + ScrollTrigger (à charger avant ce script).
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  if (typeof window.gsap === 'undefined') {
    console.warn('[wu-animate] GSAP introuvable — initialisation annulée.');
    return;
  }
  if (typeof window.ScrollTrigger === 'undefined') {
    console.warn('[wu-animate] ScrollTrigger introuvable — initialisation annulée.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const ATTR_ANIMATE = 'wu-animate';
  const ATTR_GROUP = 'wu-animate-group';
  const ATTR_APPLIED = 'wu-animate-applied';
  const ATTR_DURATION = 'wu-animate-duration';
  const ATTR_DELAY = 'wu-animate-delay';
  const ATTR_EASE = 'wu-animate-ease';
  const ATTR_START = 'wu-animate-start';
  const ATTR_ONCE = 'wu-animate-once';
  const ATTR_DISTANCE = 'wu-animate-distance';
  const ATTR_SCALE = 'wu-animate-scale';
  const ATTR_STAGGER = 'wu-animate-stagger';
  const ATTR_STAGGER_FROM = 'wu-animate-stagger-from';

  const DEFAULTS = {
    duration: 0.8,
    ease: 'power2.out',
    start: 'top 85%',
    distance: 40, // px — utilisé par fade-up / fade-down / fade-left / fade-right
    scale: 0.9 // utilisé par scale-in / zoom-out
  };

  // Chaque preset ne touche que transform + opacity (autoAlpha) — rien qui
  // déclenche du reflow. Pour ajouter un preset perso, étendre cet objet
  // avant l'appel à init() (ex. dans un <script> chargé juste après).
  const PRESETS = {
    'fade-up': o => ({ x: 0, y: o.distance }),
    'fade-down': o => ({ x: 0, y: -o.distance }),
    'fade-left': o => ({ x: o.distance, y: 0 }),
    'fade-right': o => ({ x: -o.distance, y: 0 }),
    'fade-in': () => ({ x: 0, y: 0 }),
    'scale-in': o => ({ x: 0, y: 0, scale: o.scale }),
    'zoom-out': o => ({ x: 0, y: 0, scale: o.scale || 1.15 })
  };

  // Cache des options lues par élément, pour ne pas re-parser les attributs
  // à chaque tween et pour permettre à un seul gsap.to() d'animer un lot
  // d'éléments qui n'ont pas forcément les mêmes duration/delay/preset.
  const optionsCache = new WeakMap();

  function readOptions(el) {
    const options = {
      preset: el.getAttribute(ATTR_ANIMATE) || 'fade-up',
      duration: parseFloat(el.getAttribute(ATTR_DURATION)) || DEFAULTS.duration,
      delay: parseFloat(el.getAttribute(ATTR_DELAY)) || 0,
      ease: el.getAttribute(ATTR_EASE) || DEFAULTS.ease,
      start: el.getAttribute(ATTR_START) || DEFAULTS.start,
      once: el.getAttribute(ATTR_ONCE) !== 'false',
      distance: parseFloat(el.getAttribute(ATTR_DISTANCE)) || DEFAULTS.distance,
      scale: parseFloat(el.getAttribute(ATTR_SCALE)) || DEFAULTS.scale
    };
    optionsCache.set(el, options);
    return options;
  }

  function setInitialState(el, options) {
    const preset = PRESETS[options.preset] || PRESETS['fade-up'];
    gsap.set(el, Object.assign({ autoAlpha: 0 }, preset(options)));
  }

  function revealInstantly(els) {
    gsap.set(els, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
  }

  // Lit, au moment où le tween se joue, l'option de CHAQUE cible dans le
  // cache — permet à un seul gsap.to(elements, {...}) d'animer des
  // éléments avec des réglages différents plutôt que de créer un tween
  // par élément.
  //
  // ⚠️ NE JAMAIS utiliser ça pour `ease` : contrairement à duration/delay/
  // x/y/scale, GSAP traite une fonction passée à `ease` comme une courbe
  // d'accélération personnalisée (appelée à CHAQUE frame avec la progression
  // 0→1, pas une fois par cible avec (index, target)). Lui passer une
  // fonction "resolver" comme celle-ci casse le rendu à chaque frame. Voir
  // le README, section Debug.
  function byOption(key) {
    return (i, target) => optionsCache.get(target)[key];
  }

  // ---- Groupes en stagger -------------------------------------------------
  function initGroups(reduced) {
    const groups = document.querySelectorAll(`[${ATTR_GROUP}]:not([${ATTR_APPLIED}])`);

    groups.forEach(group => {
      const children = Array.from(group.querySelectorAll(`[${ATTR_ANIMATE}]`));
      if (!children.length) return;

      // Idempotence : le wrapper ET ses enfants sont marqués tout de suite,
      // pour que initIndividual() ne les retraite pas juste après.
      group.setAttribute(ATTR_APPLIED, 'true');
      children.forEach(el => {
        el.setAttribute(ATTR_APPLIED, 'true');
        readOptions(el);
      });

      if (reduced) {
        revealInstantly(children);
        return;
      }

      children.forEach(el => setInitialState(el, optionsCache.get(el)));

      // L'ease est partagée par tout le groupe (limitation GSAP, voir
      // byOption ci-dessus) : posée sur le wrapper via wu-animate-ease,
      // sinon celle du DEFAULTS. Les wu-animate-ease individuels des
      // enfants sont ignorés pour l'ease (mais gardés pour duration/delay).
      const groupEase = group.getAttribute(ATTR_EASE) || DEFAULTS.ease;

      // Un seul ScrollTrigger pour tout le groupe, posé sur le wrapper —
      // le déclenchement individuel de chaque enfant n'a pas de sens ici.
      ScrollTrigger.create({
        trigger: group,
        start: group.getAttribute(ATTR_START) || DEFAULTS.start,
        once: group.getAttribute(ATTR_ONCE) !== 'false',
        onEnter: () => {
          gsap.to(children, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: byOption('duration'),
            delay: byOption('delay'),
            ease: groupEase,
            stagger: {
              each: parseFloat(group.getAttribute(ATTR_STAGGER)) || 0.1,
              from: group.getAttribute(ATTR_STAGGER_FROM) || 'start'
            }
          });
        }
      });
    });
  }

  // ---- Éléments isolés, regroupés par config partagée ---------------------
  // Les éléments qui partagent le même start/once/ease finissent sur UN SEUL
  // ScrollTrigger.batch() au lieu d'un ScrollTrigger par élément — c'est ce
  // qui garde une page pleine de "fade-up" légère (cf. recommandations GSAP
  // sur les listes d'éléments animés de la même façon). `ease` fait partie
  // de la clé de regroupement (et non une function-based value, voir
  // byOption ci-dessus) : chaque bucket reste homogène et reçoit une string
  // simple.
  function initIndividual(reduced) {
    const els = Array.from(
      document.querySelectorAll(`[${ATTR_ANIMATE}]:not([${ATTR_APPLIED}])`)
    );
    if (!els.length) return;

    els.forEach(el => {
      el.setAttribute(ATTR_APPLIED, 'true');
      readOptions(el);
    });

    if (reduced) {
      revealInstantly(els);
      return;
    }

    els.forEach(el => setInitialState(el, optionsCache.get(el)));

    const buckets = {};
    els.forEach(el => {
      const options = optionsCache.get(el);
      const key = `${options.start}|${options.once}|${options.ease}`;
      (buckets[key] = buckets[key] || {
        start: options.start,
        once: options.once,
        ease: options.ease,
        els: []
      }).els.push(el);
    });

    Object.keys(buckets).forEach(key => {
      const bucket = buckets[key];
      ScrollTrigger.batch(bucket.els, {
        start: bucket.start,
        once: bucket.once,
        onEnter: batchEls => {
          gsap.to(batchEls, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: byOption('duration'),
            delay: byOption('delay'),
            ease: bucket.ease,
            stagger: 0.08,
            overwrite: true
          });
        }
      });
    });
  }

  function init() {
    const reduced = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    initGroups(reduced);
    initIndividual(reduced);
  }

  // Démarrage compatible avec le chargement Webflow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose init() pour le contenu injecté dynamiquement
  // (CMS Load, modals, AJAX, tabs avec contenu lazy…) — idempotent grâce
  // à wu-animate-applied, seuls les nouveaux éléments sont traités.
  window.WU = window.WU || {};
  window.WU.animate = { init, presets: PRESETS };
})();
