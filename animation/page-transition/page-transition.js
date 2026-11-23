/**
 * webflow-utils / animation/page-transition
 * Transitions de page sans Barba : intercepte les clics sur les liens
 * internes, joue une animation de sortie (overlay GSAP), puis laisse le
 * navigateur charger la page suivante normalement. La page d'arrivée joue
 * l'animation d'entrée. Comme chaque page est un VRAI chargement, IX2,
 * Finsweet, les formulaires et les autres modules wu- se ré-initialisent
 * tout seuls — aucun "re-init" à gérer.
 *
 * Repose sur GSAP (à charger avant ce script) + un snippet à poser dans
 * le <head> (voir README.md) pour couvrir la page dès le premier rendu.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const html = document.documentElement;

  const ATTR = 'wu-transition'; // "overlay" | "page"
  const ATTR_PRESET = 'wu-transition-preset';
  const ATTR_DURATION = 'wu-transition-duration';
  const ATTR_EASE = 'wu-transition-ease';
  const ATTR_ENTER_DELAY = 'wu-transition-enter-delay';
  const ATTR_WAIT = 'wu-transition-wait';
  const ATTR_PREFETCH = 'wu-transition-prefetch';
  const ATTR_IGNORE = 'wu-transition-ignore';

  const CLASS_PENDING = 'wu-transition-pending'; // posée par le snippet <head>
  const CLASS_LEAVING = 'wu-transition-leaving';
  const CLASS_ENTERING = 'wu-transition-entering';

  // Doit rester identique à la clé utilisée par le snippet <head>.
  const STORAGE_KEY = 'wu-transition';

  const DEFAULTS = {
    preset: 'fade',
    duration: 0.8,
    ease: 'power3.inOut',
    loadTimeout: 5 // s — plafond d'attente quand wu-transition-wait="load"
  };

  // Chaque preset décrit l'overlay dans deux phases :
  //  - leave : de "caché" → "couvrant" (avant de quitter la page)
  //  - enter : de "couvrant" → "caché" (à l'arrivée sur la page suivante)
  // L'état "couvrant" = l'overlay tel que stylé dans Webflow (plein écran,
  // sans transform). Optionnel : `page` anime l'élément wu-transition="page"
  // en parallèle (`leave` = état d'arrivée en sortie, `enter` = état de
  // départ à l'entrée), et `ease` / `duration` par défaut du preset.
  //
  // `o` contient { x, y, width, height } : x/y = position du clic (centre
  // de l'écran à l'entrée ou sans clic), width/height = taille du viewport.
  const PRESETS = {
    fade: () => ({
      leave: { from: { opacity: 0 }, to: { opacity: 1 } },
      enter: { from: { opacity: 1 }, to: { opacity: 0 } },
      ease: 'power1.inOut',
      duration: 0.5
    }),
    'slide-up': () => ({
      leave: { from: { yPercent: 100 }, to: { yPercent: 0 } },
      enter: { from: { yPercent: 0 }, to: { yPercent: -100 } },
      page: { leave: { y: -80 }, enter: { y: 80 } }
    }),
    'slide-down': () => ({
      leave: { from: { yPercent: -100 }, to: { yPercent: 0 } },
      enter: { from: { yPercent: 0 }, to: { yPercent: 100 } },
      page: { leave: { y: 80 }, enter: { y: -80 } }
    }),
    'slide-left': () => ({
      leave: { from: { xPercent: 100 }, to: { xPercent: 0 } },
      enter: { from: { xPercent: 0 }, to: { xPercent: -100 } },
      page: { leave: { x: -80 }, enter: { x: 80 } }
    }),
    'slide-right': () => ({
      leave: { from: { xPercent: -100 }, to: { xPercent: 0 } },
      enter: { from: { xPercent: 0 }, to: { xPercent: 100 } },
      page: { leave: { x: 80 }, enter: { x: -80 } }
    }),
    // Les clip-path gardent toujours 4 valeurs dans le même ordre/unité :
    // c'est ce qui permet à GSAP d'interpoler la string nombre par nombre.
    'wipe-up': () => ({
      leave: { from: { clipPath: 'inset(100% 0% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } },
      enter: { from: { clipPath: 'inset(0% 0% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 100% 0%)' } },
      page: { leave: { y: -60 }, enter: { y: 60 } }
    }),
    'wipe-down': () => ({
      leave: { from: { clipPath: 'inset(0% 0% 100% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } },
      enter: { from: { clipPath: 'inset(0% 0% 0% 0%)' }, to: { clipPath: 'inset(100% 0% 0% 0%)' } },
      page: { leave: { y: 60 }, enter: { y: -60 } }
    }),
    // Cercle qui part du point cliqué (sortie) et se referme au centre (entrée).
    circle: o => {
      const r = Math.ceil(Math.hypot(Math.max(o.x, o.width - o.x), Math.max(o.y, o.height - o.y)));
      const at = `at ${o.x}px ${o.y}px`;
      return {
        leave: { from: { clipPath: `circle(0px ${at})` }, to: { clipPath: `circle(${r}px ${at})` } },
        enter: { from: { clipPath: `circle(${r}px ${at})` }, to: { clipPath: `circle(0px ${at})` } },
        ease: 'power2.inOut',
        duration: 0.9
      };
    }
  };

  // ---- API exposée dès maintenant ------------------------------------------
  // Même si GSAP manque ou qu'il n'y a pas d'overlay, WU.transition.go()
  // doit rester appelable par d'autres scripts (il navigue alors sans
  // animation) et WU.transition.ready doit finir par se résoudre.
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  window.WU = window.WU || {};
  window.WU.transition = {
    init,
    go: publicGo,
    presets: PRESETS,
    ready,
    get isTransitioning() { return state.transitioning; }
  };

  const state = {
    overlay: null,
    page: null,
    options: null,
    bound: false,
    transitioning: false,
    navigated: false,
    navTimer: null,
    lastEnter: null, // preset résolu de la dernière entrée (pour le cleanup)
    prefetched: new Set()
  };

  const reduced = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Le snippet <head> pose une sécurité qui retire wu-transition-pending
  // au bout de quelques secondes si ce script ne prend jamais la main.
  // Dès qu'on la prend, on l'annule.
  function clearHeadFallback() {
    if (window.WU._transitionFallback) {
      clearTimeout(window.WU._transitionFallback);
      window.WU._transitionFallback = null;
    }
  }

  function release() {
    clearHeadFallback();
    html.classList.remove(CLASS_PENDING);
  }

  function dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  if (typeof window.gsap === 'undefined') {
    console.warn('[wu-transition] GSAP introuvable — transitions désactivées.');
    release();
    resolveReady();
    return;
  }

  // ---- Options & presets ----------------------------------------------------
  function parseOptionalFloat(el, attr) {
    if (!el.hasAttribute(attr)) return undefined;
    const n = parseFloat(el.getAttribute(attr));
    return Number.isNaN(n) ? undefined : n;
  }

  function readOptions(overlay) {
    return {
      preset: overlay.getAttribute(ATTR_PRESET) || DEFAULTS.preset,
      duration: parseOptionalFloat(overlay, ATTR_DURATION),
      ease: overlay.getAttribute(ATTR_EASE) || undefined,
      enterDelay: Math.max(0, parseOptionalFloat(overlay, ATTR_ENTER_DELAY) || 0),
      wait: overlay.getAttribute(ATTR_WAIT) === 'load' ? 'load' : 'dom',
      prefetch: overlay.getAttribute(ATTR_PREFETCH) !== 'false'
    };
  }

  // Résout un preset avec repli sur "fade" si le nom est inconnu ou si un
  // preset custom renvoie quelque chose d'invalide : une transition ratée
  // ne doit jamais bloquer la navigation.
  // Priorité : attribut wu-transition-* > valeur du preset > DEFAULTS.
  function resolvePreset(point) {
    const opts = state.options;
    const ctx = {
      x: point ? point.x : window.innerWidth / 2,
      y: point ? point.y : window.innerHeight / 2,
      width: window.innerWidth,
      height: window.innerHeight
    };

    let resolved;
    try {
      resolved = (PRESETS[opts.preset] || PRESETS[DEFAULTS.preset])(ctx);
    } catch (err) {
      console.warn(`[wu-transition] preset "${opts.preset}" en erreur — repli sur "fade".`, err);
    }
    if (!resolved || !resolved.leave || !resolved.enter) {
      if (!PRESETS[opts.preset]) {
        console.warn(`[wu-transition] preset "${opts.preset}" inconnu — repli sur "fade".`);
      }
      resolved = PRESETS[DEFAULTS.preset](ctx);
    }

    const presetDuration = typeof resolved.duration === 'number' && resolved.duration > 0
      ? resolved.duration
      : undefined;

    return {
      leave: { from: resolved.leave.from || {}, to: resolved.leave.to || {} },
      enter: { from: resolved.enter.from || {}, to: resolved.enter.to || {} },
      page: resolved.page || null,
      duration: opts.duration ?? presetDuration ?? DEFAULTS.duration,
      // ease doit être une string (une fonction serait prise par GSAP pour
      // une courbe custom — même piège que dans animate, voir son README).
      ease: opts.ease || (typeof resolved.ease === 'string' ? resolved.ease : DEFAULTS.ease)
    };
  }

  // ---- Filtrage des liens ---------------------------------------------------
  // Renvoie l'URL à atteindre si le lien doit passer par une transition,
  // null sinon (le navigateur garde alors son comportement normal).
  function getEligibleUrl(link) {
    if (!link || link.hasAttribute('download')) return null;
    if (link.closest(`[${ATTR_IGNORE}]`)) return null;

    const target = link.getAttribute('target');
    if (target && target !== '_self') return null;

    const raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return null; // ancres, lightbox, tabs Webflow…

    let url;
    try {
      url = new URL(raw, window.location.href);
    } catch (err) {
      return null;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null; // mailto:, tel:, javascript:…
    if (url.origin !== window.location.origin) return null;

    // Ancre vers la page courante (même chemin + même query) : on laisse
    // le navigateur scroller, pas de transition.
    if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) {
      return null;
    }
    return url;
  }

  function isWebflowEditor() {
    try {
      return !!(window.Webflow && typeof window.Webflow.env === 'function' && window.Webflow.env('editor'));
    } catch (err) {
      return false;
    }
  }

  // ---- Sortie ---------------------------------------------------------------
  function navigate(href) {
    if (state.navigated) return;
    state.navigated = true;
    clearTimeout(state.navTimer);
    window.location.assign(href);
  }

  function leave(href, point) {
    if (state.transitioning) return;
    state.transitioning = true;
    state.navigated = false;

    // Signal lu par le snippet <head> de la page suivante : "arrive couverte".
    try { sessionStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (err) { /* navigation privée */ }

    const preset = resolvePreset(point);
    const { overlay, page } = state;

    html.classList.add(CLASS_LEAVING);
    gsap.killTweensOf(overlay);
    gsap.set(overlay, Object.assign({ visibility: 'visible', pointerEvents: 'auto' }, preset.leave.from));

    // Timeline en pause : les écouteurs de wu:transition:leave peuvent y
    // ajouter leurs propres tweens avant qu'elle démarre. La navigation
    // part à la fin de la timeline complète, tweens ajoutés compris.
    const tl = gsap.timeline({ paused: true, onComplete: () => navigate(href) });
    tl.to(overlay, Object.assign({ duration: preset.duration, ease: preset.ease }, preset.leave.to), 0);
    if (page && preset.page && preset.page.leave) {
      tl.to(page, Object.assign({ duration: preset.duration, ease: preset.ease }, preset.page.leave), 0);
    }

    dispatch('wu:transition:leave', { timeline: tl, url: href, overlay, page });
    tl.play();

    // Filet de sécurité : onglet passé en arrière-plan (GSAP se met en
    // pause avec requestAnimationFrame), écouteur qui casse la timeline…
    // On navigue quoi qu'il arrive.
    state.navTimer = setTimeout(() => navigate(href), (tl.duration() + 1.5) * 1000);
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // nouvel onglet / fenêtre / téléchargement
    if (!(e.target instanceof Element)) return;

    const link = e.target.closest('a[href]');
    const url = getEligibleUrl(link);
    if (!url || isWebflowEditor()) return;

    e.preventDefault();
    leave(url.href, { x: e.clientX, y: e.clientY });
  }

  // Navigation programmatique : WU.transition.go('/contact')
  function publicGo(href) {
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      console.warn(`[wu-transition] URL invalide : "${href}"`);
      return;
    }
    const samePageAnchor = url.hash &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (!state.overlay || reduced || url.origin !== window.location.origin || samePageAnchor) {
      window.location.assign(url.href);
      return;
    }
    leave(url.href, null);
  }

  // ---- Entrée ---------------------------------------------------------------
  // Prise en main immédiate : l'overlay est figé en état "couvrant" via des
  // styles inline, puis la classe du <head> peut être retirée sans flash.
  function takeOver(preset) {
    gsap.set(state.overlay, Object.assign({ visibility: 'visible', pointerEvents: 'auto' }, preset.enter.from));
    release();
  }

  function playEnter(preset) {
    const { overlay, page } = state;
    state.transitioning = true;
    state.lastEnter = preset;
    html.classList.add(CLASS_ENTERING);
    html.classList.remove(CLASS_LEAVING);

    const delay = state.options.enterDelay;
    const tl = gsap.timeline({ paused: true, onComplete: finishEnter });
    tl.to(overlay, Object.assign({ duration: preset.duration, ease: preset.ease }, preset.enter.to), delay);
    if (page && preset.page && preset.page.enter) {
      tl.from(page, Object.assign({
        duration: preset.duration,
        ease: preset.ease,
        clearProps: Object.keys(preset.page.enter).join(',')
      }, preset.page.enter), delay);
    }

    dispatch('wu:transition:enter', { timeline: tl, overlay, page });
    tl.play();
  }

  function finishEnter() {
    const preset = state.lastEnter;
    // Retour à l'état "couvrant" naturel mais invisible, prêt pour la
    // prochaine sortie (qui repartira de son propre état leave.from).
    gsap.set(state.overlay, {
      visibility: 'hidden',
      pointerEvents: 'none',
      clearProps: preset ? Object.keys(preset.enter.to).join(',') : ''
    });
    html.classList.remove(CLASS_ENTERING);
    state.transitioning = false;
    dispatch('wu:transition:enter-complete', { overlay: state.overlay, page: state.page });
    resolveReady();
  }

  function whenPageReady(fn) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      requestAnimationFrame(fn);
    };
    if (state.options.wait === 'load' && document.readyState !== 'complete') {
      window.addEventListener('load', run, { once: true });
      setTimeout(run, DEFAULTS.loadTimeout * 1000);
    } else {
      run();
    }
  }

  // Retour arrière depuis le bfcache (Safari, Chrome) : la page revient
  // figée dans son état de fin de sortie, overlay couvrant. On rejoue
  // l'entrée au lieu de laisser l'utilisateur devant un écran plein.
  function onPageShow(e) {
    if (!e.persisted || !state.overlay) return;
    clearTimeout(state.navTimer);
    state.navigated = false;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }

    if (!html.classList.contains(CLASS_LEAVING)) return;
    gsap.killTweensOf([state.overlay, state.page].filter(Boolean));
    const preset = resolvePreset(null);
    if (state.page && preset.page && preset.page.leave) {
      gsap.set(state.page, { clearProps: Object.keys(preset.page.leave).join(',') });
    }
    state.transitioning = false;
    takeOver(preset);
    playEnter(preset);
  }

  // ---- Prefetch au survol ---------------------------------------------------
  function onIntent(e) {
    if (!state.options || !state.options.prefetch) return;
    if (!(e.target instanceof Element)) return;

    const url = getEligibleUrl(e.target.closest('a[href]'));
    if (!url) return;

    const key = url.href.split('#')[0];
    if (key === window.location.href.split('#')[0] || state.prefetched.has(key)) return;

    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

    state.prefetched.add(key);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = key;
    document.head.appendChild(link);
  }

  // ---- Init -----------------------------------------------------------------
  function bindOnce() {
    if (state.bound) return;
    state.bound = true;
    // Sans animation (prefers-reduced-motion), on ne touche pas aux clics :
    // le navigateur navigue normalement. Le prefetch reste utile.
    if (!reduced) document.addEventListener('click', onClick);
    document.addEventListener('mouseover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    window.addEventListener('pageshow', onPageShow);
  }

  function init() {
    state.overlay = document.querySelector(`[${ATTR}="overlay"]`);
    state.page = document.querySelector(`[${ATTR}="page"]`);

    if (!state.overlay) {
      release();
      resolveReady();
      return;
    }

    state.options = readOptions(state.overlay);
    bindOnce();

    if (!window.WU._transitionHead) {
      console.info('[wu-transition] snippet <head> absent : la sortie fonctionne, mais la page d\'arrivée ne sera pas couverte dès le premier rendu (voir README).');
    }

    const pending = html.classList.contains(CLASS_PENDING);
    if (pending && !reduced && !state.transitioning) {
      const preset = resolvePreset(null);
      takeOver(preset);
      whenPageReady(() => playEnter(preset));
    } else {
      release();
      // Sécurité si le snippet <head> n'est pas là : l'overlay ne doit
      // jamais rester visible par-dessus la page au repos.
      if (!state.transitioning) {
        gsap.set(state.overlay, { visibility: 'hidden', pointerEvents: 'none' });
      }
      resolveReady();
    }
  }

  // Démarrage compatible avec le chargement Webflow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
