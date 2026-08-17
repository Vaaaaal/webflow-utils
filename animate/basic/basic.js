/**
 * wu-animate — Reveal animations driven by data attributes (GSAP + ScrollTrigger)
 * Part of the webflow-utils toolkit — github.com/Vaaaaal/webflow-utils
 *
 * Basic usage:
 *   <div data-wu-animate="fade-up">...</div>
 *
 * Staggered group:
 *   <div data-wu-animate-group data-wu-animate-stagger="0.1">
 *     <div data-wu-animate="fade-up">Item 1</div>
 *     <div data-wu-animate="fade-up">Item 2</div>
 *   </div>
 *
 * Requires GSAP core + ScrollTrigger to be loaded (and registered) before this script.
 * Re-calling WU.animate.init() after injecting new DOM (CMS load, AJAX, Barba, etc.)
 * is safe — already-processed elements are skipped automatically.
 */
(function () {
  "use strict";

  if (typeof window.gsap === "undefined") {
    console.warn("[wu-animate] GSAP not found — skipping init.");
    return;
  }
  if (typeof window.ScrollTrigger === "undefined") {
    console.warn("[wu-animate] ScrollTrigger not found — skipping init.");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var ATTR = "data-wu-animate";
  var APPLIED_ATTR = "data-wu-animate-applied";
  var optionsCache = new WeakMap();

  var DEFAULTS = {
    duration: 0.8,
    ease: "power2.out",
    start: "top 85%",
    distance: 40, // px — used by fade-up / fade-down / fade-left / fade-right
    scale: 0.9 // used by scale-in / zoom-out
  };

  // Presets only ever touch transform + opacity (autoAlpha) — cheap to animate,
  // no layout thrashing. Add your own via WU.animate.presets.myPreset = fn
  // before init() runs (e.g. earlier <script> tag).
  var PRESETS = {
    "fade-up": function (o) { return { x: 0, y: o.distance }; },
    "fade-down": function (o) { return { x: 0, y: -o.distance }; },
    "fade-left": function (o) { return { x: o.distance, y: 0 }; },
    "fade-right": function (o) { return { x: -o.distance, y: 0 }; },
    "fade-in": function () { return { x: 0, y: 0 }; },
    "scale-in": function (o) { return { x: 0, y: 0, scale: o.scale }; },
    "zoom-out": function (o) { return { x: 0, y: 0, scale: o.scale || 1.15 }; }
  };

  function readOptions(el) {
    var d = el.dataset;
    var o = {
      preset: d.wuAnimate || "fade-up",
      duration: parseFloat(d.wuAnimateDuration) || DEFAULTS.duration,
      delay: parseFloat(d.wuAnimateDelay) || 0,
      ease: d.wuAnimateEase || DEFAULTS.ease,
      start: d.wuAnimateStart || DEFAULTS.start,
      once: d.wuAnimateOnce !== "false",
      distance: parseFloat(d.wuAnimateDistance) || DEFAULTS.distance,
      scale: parseFloat(d.wuAnimateScale) || DEFAULTS.scale
    };
    optionsCache.set(el, o);
    return o;
  }

  function setInitialState(el, o) {
    var preset = PRESETS[o.preset] || PRESETS["fade-up"];
    gsap.set(el, Object.assign({ autoAlpha: 0 }, preset(o)));
  }

  function revealInstantly(els) {
    gsap.set(els, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
  }

  // Reads each target's own cached options at tween-render time — lets one
  // gsap.to() call animate a batch of elements that have different
  // duration/delay/ease/preset without splitting them into separate tweens.
  function byOption(key) {
    return function (i, target) {
      return optionsCache.get(target)[key];
    };
  }

  // ---- Grouped / staggered sets -----------------------------------------
  function initGroups(reduced) {
    var groups = document.querySelectorAll(
      "[data-wu-animate-group]:not([" + APPLIED_ATTR + "])"
    );

    groups.forEach(function (group) {
      var children = Array.prototype.slice.call(group.querySelectorAll("[" + ATTR + "]"));
      if (!children.length) return;

      group.setAttribute(APPLIED_ATTR, "true");
      children.forEach(function (el) {
        el.setAttribute(APPLIED_ATTR, "true");
        readOptions(el);
      });

      if (reduced) { revealInstantly(children); return; }

      children.forEach(function (el) { setInitialState(el, optionsCache.get(el)); });

      ScrollTrigger.create({
        trigger: group,
        start: group.dataset.wuAnimateStart || DEFAULTS.start,
        once: group.dataset.wuAnimateOnce !== "false",
        onEnter: function () {
          gsap.to(children, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: byOption("duration"),
            delay: byOption("delay"),
            ease: byOption("ease"),
            stagger: {
              each: parseFloat(group.dataset.wuAnimateStagger) || 0.1,
              from: group.dataset.wuAnimateStaggerFrom || "start"
            }
          });
        }
      });
    });
  }

  // ---- Individual elements, batched by shared scroll config -------------
  // Elements that share the same start/once end up on ONE ScrollTrigger.batch
  // call instead of one ScrollTrigger per element — this is what keeps a page
  // full of "fade-up" cards cheap, per GSAP's own performance guidance.
  function initIndividual(reduced) {
    var els = Array.prototype.slice.call(
      document.querySelectorAll("[" + ATTR + "]:not([" + APPLIED_ATTR + "])")
    );
    if (!els.length) return;

    els.forEach(function (el) {
      el.setAttribute(APPLIED_ATTR, "true");
      readOptions(el);
    });

    if (reduced) { revealInstantly(els); return; }

    els.forEach(function (el) { setInitialState(el, optionsCache.get(el)); });

    var buckets = {};
    els.forEach(function (el) {
      var o = optionsCache.get(el);
      var key = o.start + "|" + o.once;
      (buckets[key] = buckets[key] || { start: o.start, once: o.once, els: [] }).els.push(el);
    });

    Object.keys(buckets).forEach(function (key) {
      var bucket = buckets[key];
      ScrollTrigger.batch(bucket.els, {
        start: bucket.start,
        once: bucket.once,
        onEnter: function (batchEls) {
          gsap.to(batchEls, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: byOption("duration"),
            delay: byOption("delay"),
            ease: byOption("ease"),
            stagger: 0.08,
            overwrite: true
          });
        }
      });
    });
  }

  function init() {
    var reduced = !!(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    initGroups(reduced);
    initIndividual(reduced);
  }

  window.WU = window.WU || {};
  window.WU.animate = { init: init, presets: PRESETS, defaults: DEFAULTS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
