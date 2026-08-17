# wu-animate

Reveal animations for Webflow, driven entirely by `data-` attributes. Built on GSAP + ScrollTrigger, no build step, no other dependencies.

## Install

Load GSAP + ScrollTrigger, then this script, in **Footer code** (before `</body>`):

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@X.Y.Z/animate/wu-animate.js"></script>
```

Pin to a tag (`@X.Y.Z`) rather than `@latest` for cache stability, same as the other webflow-utils modules.

The script self-initializes on `DOMContentLoaded`. For content injected later (Finsweet CMS Load, AJAX, page transitions), just call `WU.animate.init()` again — already-processed elements are skipped.

## Single element

```html
<div data-wu-animate="fade-up">Reveals on scroll</div>
```

## Staggered group

```html
<div data-wu-animate-group data-wu-animate-stagger="0.1" data-wu-animate-stagger-from="start">
  <div data-wu-animate="fade-up">Item 1</div>
  <div data-wu-animate="fade-up">Item 2</div>
  <div data-wu-animate="fade-up">Item 3</div>
</div>
```

Children can mix presets — they still animate together on one ScrollTrigger tied to the group wrapper.

## Attributes

| Attribute | Where | Default | Notes |
|---|---|---|---|
| `data-wu-animate` | any element | `fade-up` | preset name (see below) |
| `data-wu-animate-duration` | element | `0.8` | seconds |
| `data-wu-animate-delay` | element | `0` | seconds |
| `data-wu-animate-ease` | element | `power2.out` | any GSAP ease string |
| `data-wu-animate-start` | element or group | `top 85%` | ScrollTrigger `start` |
| `data-wu-animate-once` | element or group | `true` | set `"false"` to replay on re-enter |
| `data-wu-animate-distance` | element | `40` | px, for `fade-up/down/left/right` |
| `data-wu-animate-scale` | element | `0.9` | for `scale-in` / `zoom-out` |
| `data-wu-animate-group` | wrapper | — | marks a staggered set |
| `data-wu-animate-stagger` | wrapper | `0.1` | seconds between children |
| `data-wu-animate-stagger-from` | wrapper | `start` | `start / center / end / edges / random` |

## Presets

`fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in`, `scale-in`, `zoom-out`.

Add a custom one before the script's `init()` runs (or before the CDN `<script>` tag if you add it as an earlier inline block):

```html
<script>
  window.WU = window.WU || {};
  window.WU.animate = window.WU.animate || {};
</script>
```

then, once the library has loaded:

```js
WU.animate.presets["blur-in"] = function () {
  return { x: 0, y: 0 }; // extend the .js file itself to add a filter/blur tween if needed
};
```

(For anything beyond opacity/x/y/scale — e.g. `filter: blur()` — add the property inside the library's `setInitialState`/`gsap.to` calls directly, since presets currently only return transform + position values.)

## Notes

- Only `autoAlpha`, `x`, `y`, `scale` are ever animated — no layout-triggering properties, per GSAP's performance guidance.
- Elements without `prefers-reduced-motion: reduce` support get instantly revealed, no ScrollTrigger created.
- Individual (non-grouped) elements sharing the same `start`/`once` are combined into a single `ScrollTrigger.batch()` — a page with 40 fade-up cards creates a handful of ScrollTriggers, not 40.
- Possible FOUC: elements are hidden via `gsap.set()` only once this script runs. If it loads late, add a tiny critical-CSS fallback, e.g. `[data-wu-animate]{opacity:0}` in the `<head>`, and let the script take over from there.
