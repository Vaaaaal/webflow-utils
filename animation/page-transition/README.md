# animation/page-transition

Transitions de page **sans Barba** : le module intercepte les clics sur les liens internes, joue une animation de sortie (un overlay animé avec GSAP), puis laisse le navigateur charger la page suivante normalement. La page d'arrivée joue l'animation d'entrée. Tout est piloté par des **custom attributes**, aucune config JS à modifier.

> Pourquoi pas Barba ? Barba remplace le contenu de la page sans la recharger : IX2, Finsweet, les formulaires Webflow et les scripts propres à chaque page ne se relancent pas, et il faut tout ré-initialiser à la main. Ici, chaque page est un **vrai chargement** : tout se relance tout seul, comme sans transition.

---

## 📦 Installation

Il faut **deux morceaux** : un snippet dans le `<head>` et le script en footer.

### 1. Snippet `<head>` (obligatoire, à coller inline)

À coller dans **Project Settings → Custom Code → Head Code**. Il doit rester **inline** (pas de `<script src>`) : il s'exécute avant le premier rendu pour que la page d'arrivée soit couverte sans flash. Le contenu est aussi dispo dans [`head.html`](./head.html).

```html
<style>
  [wu-transition="overlay"] { position: fixed; inset: 0; visibility: hidden; pointer-events: none; }
  html.wu-transition-pending [wu-transition="overlay"] { visibility: visible; pointer-events: auto; }
</style>
<script>
  (function () {
    var d = document.documentElement, s = document.currentScript, k = 'wu-transition', t = 0;
    window.WU = window.WU || {};
    WU._transitionHead = true;
    try { t = +sessionStorage.getItem(k) || 0; sessionStorage.removeItem(k); } catch (e) {}
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var first = s && s.hasAttribute('wu-transition-first-load') && s.getAttribute('wu-transition-first-load') !== 'false';
    if (Date.now() - t < 10000 || first) {
      d.classList.add('wu-transition-pending');
      WU._transitionFallback = setTimeout(function () { d.classList.remove('wu-transition-pending'); }, 4000);
    }
  })();
</script>
```

### 2. Script en footer (via jsDelivr, recommandé)

Charger GSAP **avant** ce script.

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/animation/page-transition/page-transition.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code** (le module doit tourner sur toutes les pages).

---

## 🧠 Concepts

- **Overlay** : l'élément qui couvre l'écran pendant la transition (`wu-transition="overlay"`). Tu le styles librement dans Webflow (couleur, logo, texte…). Son état « couvrant » = l'overlay tel que stylé (plein écran, sans transform) ; le module gère sa position, son opacité et son clip-path selon le preset.
- **Sortie (leave)** : au clic sur un lien interne, l'overlay passe de caché à couvrant, puis le navigateur charge la page suivante.
- **Entrée (enter)** : la page d'arrivée s'affiche **déjà couverte** (grâce au snippet `<head>`), puis l'overlay se retire.
- **Page** (optionnel) : un wrapper `wu-transition="page"` qui bouge légèrement en même temps que l'overlay (presets `slide-*` et `wipe-*`).

Comment la page d'arrivée sait qu'elle doit arriver couverte : juste avant de naviguer, le module écrit un horodatage dans `sessionStorage`. Le snippet `<head>` de la page suivante le lit (et l'efface) : s'il date de moins de 10 s, la page arrive couverte. Une arrivée directe (URL tapée, lien externe, refresh) n'est donc **pas** couverte, sauf avec `wu-transition-first-load` (voir plus bas).

---

## 🏷️ Attributs

### Sur l'overlay

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-transition` | `overlay` | ✅ | — |
| `wu-transition-preset` | nom du preset (voir ci-dessous) | ❌ | `fade` |
| `wu-transition-duration` | secondes (ex. `1`) | ❌ | celle du preset, sinon `0.8` |
| `wu-transition-ease` | ease GSAP (ex. `expo.inOut`) | ❌ | celle du preset, sinon `power3.inOut` |
| `wu-transition-enter-delay` | secondes pendant lesquelles l'overlay reste affiché avant de se retirer (pour laisser voir un logo par ex.) | ❌ | `0` |
| `wu-transition-wait` | `dom` / `load` : à l'arrivée, attendre le HTML (`dom`) ou aussi les images et polices (`load`, 5 s maximum) | ❌ | `dom` |
| `wu-transition-prefetch` | `true` / `false` : précharge la page au survol d'un lien | ❌ | `true` |

### Sur un wrapper de contenu (optionnel)

| Attribut | Valeurs | Défaut |
|---|---|---|
| `wu-transition` | `page` | — |

### Sur un lien (ou un de ses parents)

| Attribut | Valeurs | Défaut |
|---|---|---|
| `wu-transition-ignore` | présence seule : ce lien (ou tous les liens du bloc) navigue sans transition | — |

### Sur la balise `<script>` du snippet `<head>`

| Attribut | Valeurs | Défaut |
|---|---|---|
| `wu-transition-first-load` | présence seule : couvre aussi les arrivées directes (effet « loader » à chaque chargement) | absent |

```html
<script wu-transition-first-load>
  (function () { … })();
</script>
```

### Presets disponibles

| Preset | Sortie | Entrée |
|---|---|---|
| `fade` | fondu de l'overlay | fondu inverse |
| `slide-up` | monte depuis le bas | part vers le haut |
| `slide-down` | descend depuis le haut | part vers le bas |
| `slide-left` | arrive depuis la droite | part vers la gauche |
| `slide-right` | arrive depuis la gauche | part vers la droite |
| `wipe-up` | se dévoile de bas en haut (clip-path, l'overlay ne bouge pas) | se replie vers le haut |
| `wipe-down` | se dévoile de haut en bas | se replie vers le bas |
| `circle` | cercle qui s'ouvre **depuis le point cliqué** | cercle qui se referme au centre |

---

## 🛠️ Mise en place dans Webflow

### 1. Créer l'overlay

1. Ajouter un **Div Block** (idéalement dans un **composant** posé sur toutes les pages, ou dans un composant global type navbar/footer).
2. Le styler comme l'écran de transition : couleur de fond, logo centré, etc. Il n'est pas nécessaire de le passer en `position: fixed`, le snippet `<head>` s'en charge.
3. Lui donner un **z-index élevé** (ex. `9999`) pour qu'il passe au-dessus de la navbar.
4. **Settings (D) → Custom Attributes** :
   - `wu-transition` = `overlay`
   - `wu-transition-preset` = `slide-up` *(optionnel)*

> 💡 Pour qu'il ne gêne pas dans le Designer, passe sa **classe** en **Visibility: Hidden** dans le **Style panel** (Effects). Le module gère la visibilité lui-même sur le site publié.
>
> ⚠️ **Ne pas utiliser** :
> - le réglage **Visibility** de l'onglet **Settings (D)** (l'icône œil « Hidden » des conditions de visibilité) : Webflow **retire alors l'élément du HTML publié**, le module ne le trouve pas et aucune transition ne se joue ;
> - `display: none` sur la classe : l'overlay ne pourrait pas s'afficher.

### 2. (Optionnel) Marquer le wrapper de contenu

Sur le wrapper principal de la page (ex. `main` ou `.page-wrapper`) :

- `wu-transition` = `page`

### 3. Coller les deux snippets, publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview, ni dans le Designer ou l'Editor).

---

## 📝 Exemple HTML complet

```html
<div class="transition-overlay" wu-transition="overlay" wu-transition-preset="slide-up" wu-transition-enter-delay="0.2">
  <img src="logo.svg" alt="">
</div>

<main wu-transition="page">
  <a href="/about">À propos</a>                       <!-- transition -->
  <a href="/contact#form">Contact</a>                 <!-- transition, puis scroll vers #form -->
  <a href="#faq">FAQ</a>                              <!-- ancre de la page : pas de transition -->
  <a href="https://exemple.com">Externe</a>           <!-- autre domaine : pas de transition -->
  <a href="/brochure.pdf" wu-transition-ignore>PDF</a> <!-- exclu manuellement -->
</main>
```

---

## 🔗 Quels liens déclenchent une transition ?

Un clic déclenche la transition seulement si **toutes** ces conditions sont remplies :

- lien interne (même domaine), en `http`/`https` ;
- pas une ancre vers la page courante (`#section`, lightbox, tabs Webflow…) ;
- pas de `target="_blank"` (ni autre target que `_self`), pas d'attribut `download` ;
- pas de Cmd / Ctrl / Shift / Alt enfoncé, clic gauche uniquement (le clic molette et Cmd+clic ouvrent toujours un nouvel onglet normalement) ;
- pas de `wu-transition-ignore` sur le lien ou un parent ;
- aucun autre script n'a déjà annulé le clic (`preventDefault`) : un lightbox, un slider ou Finsweet gardent la main ;
- on n'est pas dans l'Editor Webflow.

---

## 🧩 API JavaScript

```js
WU.transition.go('/contact');   // navigation avec transition (ex. depuis un bouton, un formulaire)
WU.transition.ready;            // Promise résolue quand l'entrée est terminée (ou immédiatement s'il n'y en a pas)
WU.transition.isTransitioning;  // true pendant une sortie ou une entrée
WU.transition.init();           // relit l'overlay et ses attributs (utile si tu le modifies dynamiquement)
WU.transition.presets;          // presets, extensibles (voir plus bas)
```

`go()` reste utilisable même sans GSAP ni overlay : il navigue alors normalement, sans animation.

### Événements

Émis sur `document` :

| Événement | Quand | `event.detail` |
|---|---|---|
| `wu:transition:leave` | au début de la sortie | `{ timeline, url, overlay, page }` |
| `wu:transition:enter` | au début de l'entrée | `{ timeline, overlay, page }` |
| `wu:transition:enter-complete` | overlay retiré, page utilisable | `{ overlay, page }` |

`timeline` est une timeline GSAP **en pause au moment de l'événement** : tu peux y ajouter tes propres tweens avant qu'elle démarre. À la sortie, la navigation part à la fin de la timeline **complète**, tweens ajoutés compris.

```html
<script>
  // Fait apparaître le logo de l'overlay une fois qu'il couvre l'écran
  document.addEventListener('wu:transition:leave', function (e) {
    e.detail.timeline.from(e.detail.overlay.querySelector('img'), { opacity: 0, y: 20, duration: 0.3 }, '>');
  });
</script>
```

### Classes sur `<html>` (pour du CSS)

| Classe | Présente |
|---|---|
| `wu-transition-pending` | entre le premier rendu et la prise en main du script (posée par le snippet `<head>`) |
| `wu-transition-leaving` | pendant la sortie |
| `wu-transition-entering` | pendant l'entrée |

---

## ✨ Presets personnalisés

Même principe que `animate` : `WU.transition.presets` est exposé, on y ajoute des presets propres à un site dans un `<script>` posé **juste après** `page-transition.js`.

Un preset est une fonction `(o) => ({ leave, enter, page?, ease?, duration? })` :

- `leave: { from, to }` : de caché à couvrant ;
- `enter: { from, to }` : de couvrant à caché ;
- `page: { leave, enter }` *(optionnel)* : `leave` = état d'arrivée du wrapper `page` à la sortie, `enter` = son état de départ à l'entrée ;
- `o` contient `{ x, y, width, height }` : la position du clic (centre de l'écran à l'entrée) et la taille du viewport.

```html
<script>
  WU.transition.presets['iskera-skew'] = o => ({
    leave: { from: { yPercent: 100, skewY: 6 }, to: { yPercent: 0, skewY: 0 } },
    enter: { from: { yPercent: 0 }, to: { yPercent: -100 } },
    page: { leave: { y: -100, opacity: 0.4 }, enter: { y: 100 } },
    ease: 'expo.inOut',
    duration: 1
  });
</script>
```

Priorité : attribut `wu-transition-ease` / `wu-transition-duration` > valeur du preset > défaut du module. `ease` doit être une **string**. Un preset inconnu ou qui plante retombe sur `fade` (avec un `console.warn`) : la navigation n'est jamais bloquée.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| `prefers-reduced-motion: reduce` | Aucun clic intercepté, aucune page couverte : navigation normale. Le prefetch reste actif. |
| GSAP absent | `console.warn`, rien n'est intercepté, la page n'est jamais laissée couverte |
| Pas d'overlay sur la page | Le module ne fait rien sur cette page (les liens naviguent normalement) |
| `page-transition.js` ne charge pas | Le snippet `<head>` découvre la page tout seul au bout de 4 s |
| Snippet `<head>` absent | La sortie fonctionne, mais la page d'arrivée n'est pas couverte au premier rendu (`console.info`) |
| Bouton retour (bfcache Safari/Chrome) | La page revient figée en fin de sortie : le module rejoue l'entrée au lieu de laisser l'écran couvert |
| Onglet passé en arrière-plan pendant la sortie | Filet de sécurité : la navigation part quand même à la fin de la durée prévue |
| Plusieurs clics pendant une transition | Ignorés, seul le premier compte |
| Serveur lent | L'overlay reste couvrant jusqu'à l'arrivée de la page suivante (il sert d'écran de chargement) |

---

## 🤝 Avec les autres modules

- **`animation/animate`** : les éléments déjà visibles au chargement (hero) s'animent pendant que l'overlay couvre encore la page, donc l'animation peut passer inaperçue. Pour des animations très courtes en haut de page, ajoute un `wu-animate-delay` équivalent à la durée de l'entrée. Faire attendre `WU.transition.ready` à `animate` serait une petite évolution d'`animate.js` à prévoir.
- **Interactions IX2 « Page load »** : même remarque, elles démarrent sous l'overlay.
- **`links/anchor`** : compatible. Le lien pointe vers une autre page avec une ancre : la transition se joue, puis le navigateur scrolle vers l'ancre.
- **`links/obfuscate-onclick`** : ces éléments naviguent via `window.location` et ne passent donc pas par la transition. Pour l'avoir, ils peuvent appeler `WU.transition.go(url)`.

---

## ⚠️ Limitations

- **Transform sur le wrapper `page`** : pendant l'animation, un `transform` est appliqué au wrapper `wu-transition="page"`. Les éléments en `position: fixed` **à l'intérieur** (navbar fixe, bouton flottant) se calent alors sur le wrapper au lieu de l'écran le temps de la transition. Place ces éléments en dehors du wrapper, ou n'utilise pas `wu-transition="page"`.
- **Le bouton retour du navigateur** ne joue pas de sortie (impossible d'intercepter cette navigation). La page précédente s'affiche directement.
- **Prefetch** : `<link rel="prefetch">` n'est pas pris en charge par Safari. Ce n'est pas bloquant, la page se charge simplement sans préchargement. Le prefetch est désactivé en mode « économie de données » et en 2G.
- **Validation HTML W3C** : les attributs `wu-` sans `data-` sont signalés comme invalides, sans impact réel (même approche que Finsweet, Alpine.js, HTMX).

---

## 🐛 Debug

1. GSAP est-il chargé **avant** `page-transition.js` ? `window.gsap` doit être défini dans la console.
2. Le snippet `<head>` est-il bien collé **inline** dans le Head Code ? `WU._transitionHead` doit valoir `true` dans la console.
3. L'overlay est-il bien présent dans le HTML publié ? `document.querySelector('[wu-transition="overlay"]')` ne doit pas renvoyer `null`. Si c'est le cas, vérifie qu'il n'est pas masqué via **Settings → Visibility** (ce réglage le retire du HTML) et qu'il n'a pas de `display: none`.
4. L'overlay passe sous la navbar ? Augmente son z-index.
5. Un lien ne déclenche rien ? Vérifie la liste « Quels liens déclenchent une transition ? » : un autre script annule peut-être déjà le clic.
6. Le site est-il publié ? Le custom code ne tourne pas en Preview.

---

## 📄 Changelog

- **v1.0.0** : Version initiale. Interception des liens internes, 8 presets (`fade`, `slide-*`, `wipe-*`, `circle`), snippet `<head>` anti-flash avec sécurité de 4 s, gestion du bfcache, prefetch au survol, timelines extensibles via événements, API `WU.transition`, support `prefers-reduced-motion`.
