# animation/animate

Anime l'apparition des éléments au scroll — fade, scale, slide — avec support des **groupes en stagger**. Tout est piloté par des **custom attributes** posés dans le Designer, aucune config JS à modifier. Repose sur **GSAP + ScrollTrigger**.

> Cas d'usage typiques : reveal au scroll sur des cards de grille, apparition en cascade d'une liste de features ou d'une navigation, fade-in d'un hero, animation d'entrée d'un titre découpé en plusieurs blocs.

---

## 📦 Installation

Charger GSAP + ScrollTrigger **avant** ce script.

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/animation/animate/animate.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`animate.js`](./animate.js) entre des balises `<script>…</script>`, après les scripts GSAP.

---

## 🧠 Concepts

- **Élément animé** : tout élément portant `wu-animate="<preset>"`. Son état de départ (opacity, position, scale) est fixé immédiatement au chargement, puis animé vers son état final au scroll.
- **Preset** : nom de l'animation (`fade-up`, `scale-in`…), voir la liste plus bas. Chaque preset déclare un état de départ (`from`) et un état d'arrivée (`to`) — `opacity` est toujours géré séparément (universel à tous les presets). Les presets par défaut ne touchent que `x`/`y`/`scale`, mais un preset personnalisé peut déclarer n'importe quelle propriété (voir "Presets personnalisés" plus bas). Rester sur des propriétés qui passent par le compositeur (`transform`, `opacity`, `filter`) plutôt que des propriétés qui déclenchent du reflow (`width`, `top`…) reste recommandé pour la perf, mais n'est plus imposé techniquement par le module.
- **Groupe** : un wrapper portant `wu-animate-group`, contenant plusieurs éléments `wu-animate`. Ils se déclenchent ensemble, en stagger, sur un seul ScrollTrigger posé sur le wrapper — même si les enfants utilisent des presets différents.
- **Élément isolé** (hors groupe) : les éléments qui partagent les mêmes `wu-animate-start`/`wu-animate-once` sont regroupés en interne sur un seul `ScrollTrigger.batch()`, pour éviter de créer un ScrollTrigger par élément sur une page qui en contient beaucoup.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-animate` pour éviter les collisions avec les autres modules `webflow-utils`.

### Sur un élément animé

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-animate` | nom du preset (voir ci-dessous) | ✅ | `fade-up` |
| `wu-animate-duration` | secondes (ex. `1.2`) | ❌ | celle du preset, sinon `0.8` |
| `wu-animate-delay` | secondes | ❌ | `0` |
| `wu-animate-ease` | ease GSAP (ex. `power3.out`) | ❌ | celle du preset, sinon `power2.out` |
| `wu-animate-start` | position ScrollTrigger (ex. `top 90%`) | ❌ | `top 85%` |
| `wu-animate-once` | `true` / `false` | ❌ | `true` |
| `wu-animate-distance` | px — pour `fade-up/down/left/right` | ❌ | `40` |
| `wu-animate-scale` | pour `scale-in` / `zoom-out` / `zoom-in` | ❌ | selon le preset — voir plus bas |
| `wu-animate-blur` | px — pour `blur-in` | ❌ | `12` |

### Sur un wrapper de groupe

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-animate-group` | présence seule, pas de valeur requise | ✅ (pour activer le groupe) | — |
| `wu-animate-stagger` | secondes entre chaque enfant | ❌ | `0.1` |
| `wu-animate-stagger-from` | `start` / `center` / `end` / `edges` / `random` | ❌ | `start` |
| `wu-animate-start` | position ScrollTrigger du groupe | ❌ | `top 85%` |
| `wu-animate-once` | `true` / `false` | ❌ | `true` |
| `wu-animate-ease` | ease GSAP **forcée pour tous les enfants** du groupe | ❌ | — (chaque enfant garde la sienne) |

> Dans un groupe, chaque enfant garde son ease (attribut de l'enfant > ease du preset > `power2.out`). Poser `wu-animate-ease` sur le **wrapper** force la même ease pour tous les enfants. Le stagger reste calculé sur l'ensemble du groupe, même quand les enfants ont des eases différentes.

### Presets disponibles

`fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in`, `scale-in`, `zoom-out`, `zoom-in`, `blur-in`.

Défauts de `wu-animate-scale` selon le preset : `scale-in` → `0.9` (subtil), `zoom-in` → `0.7` (plus marqué), `zoom-out` → `1.15`. Poser `wu-animate-scale` sur l'élément override le défaut, quel que soit le preset.

---

## ✨ Presets personnalisés

`window.WU.animate.presets` est exposé publiquement — on peut y ajouter des presets spécifiques à un site sans toucher au fichier partagé. Un preset est une fonction `(options) => ({ from, to })` où `options` contient les valeurs déjà résolues de l'élément (`distance`, `scale`, etc., issues de ses attributs `wu-animate-*`).

**Où l'ajouter** : dans le Footer Code du site concerné, dans un `<script>` posé **juste après** celui d'`animate.js`. Comme le script s'auto-init sur `DOMContentLoaded` (et jamais avant, tant que le HTML est encore en train de parser), ce second `<script>` a le temps de s'exécuter avant que les éléments ne soient traités.

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/animation/animate/animate.js"></script>
<script>
  // Preset spécifique à ce site — n'existe que sur ce projet
  WU.animate.presets['iskera-blur-in'] = o => ({
    from: { y: o.distance, filter: 'blur(12px)' },
    to: { y: 0, filter: 'blur(0px)' }
  });
</script>
```

```html
<div wu-animate="iskera-blur-in" wu-animate-distance="30">Contenu qui apparaît en se démasquant</div>
```

Préfixer le nom du preset par le nom du site (`iskera-*`) évite les collisions si un bout de code est recopié d'un projet à l'autre.

### Ease et durée par défaut d'un preset

Un preset peut aussi déclarer son `ease` et sa `duration` par défaut, à côté de `from`/`to`. Utile quand l'animation n'a de sens qu'avec une ease précise (élastique, back…) : plus besoin de répéter l'attribut sur chaque élément.

```html
<script>
  WU.animate.presets['pop'] = o => ({
    from: { y: 8, scale: o.scale ?? 0.7 },
    to: { y: 0, scale: 1 },
    ease: 'elastic.out(1, 0.6)',
    duration: 0.8
  });
</script>
```

```html
<div wu-animate="pop">Apparaît avec un léger rebond</div>
<div wu-animate="pop" wu-animate-ease="back.out(1.7)">Override ponctuel</div>
```

Priorité : attribut `wu-animate-ease` / `wu-animate-duration` > valeur du preset > défaut du module. `ease` doit être une **string** (une fonction est ignorée avec un `console.warn`, voir Changelog v1.0.1).

**Comportement dans un lot mixte** : si un élément d'un groupe ou d'un batch ne déclare pas une propriété que d'autres éléments du même lot utilisent (ex. un `fade-up` classique à côté d'un `iskera-blur-in`), le module retombe sur la valeur actuelle de cet élément pour cette propriété — un no-op sûr, jamais une erreur.

---

## 🛠️ Mise en place dans Webflow

### 1. Poser l'attribut sur un élément simple

Sélectionner l'élément → **Settings (D)** → **Custom Attributes** :

- `wu-animate` = `fade-up`

### 2. Poser un groupe en stagger

Sélectionner le **wrapper** parent → Custom Attributes :

- `wu-animate-group` = *(laisser vide)*
- `wu-animate-stagger` = `0.1`

Puis, sur chaque enfant direct à animer :

- `wu-animate` = `fade-up` *(ou un preset différent par enfant si besoin)*

### 3. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Élément isolé -->
<div wu-animate="fade-up" wu-animate-duration="1" wu-animate-distance="60">
  Contenu qui apparaît au scroll
</div>

<!-- Groupe en stagger -->
<div wu-animate-group wu-animate-stagger="0.12" wu-animate-stagger-from="start">
  <div wu-animate="fade-up">Feature 1</div>
  <div wu-animate="fade-up">Feature 2</div>
  <div wu-animate="scale-in">Feature 3</div>
</div>
```

---

## 🔁 Plusieurs groupes sur une même page

Aucune coordination nécessaire : chaque wrapper `wu-animate-group` obtient son propre ScrollTrigger, indépendant des autres.

```html
<div wu-animate-group wu-animate-stagger="0.1">…</div>
<div wu-animate-group wu-animate-stagger="0.2">…</div>
```

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour du contenu injecté après coup (Finsweet CMS Load, modal AJAX, tab lazy-loadée), relance le script :

```js
window.WU.animate.init();
```

✅ Contrairement à `combine`, le module `animate` **est idempotent** (comme `list-variants`) : les éléments déjà traités portent `wu-animate-applied` et sont ignorés lors d'un nouvel appel. Seuls les nouveaux éléments sont pris en compte.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| `prefers-reduced-motion: reduce` activé côté OS | Tous les éléments s'affichent instantanément, aucun ScrollTrigger créé |
| GSAP ou ScrollTrigger absent du DOM | Le script s'arrête proprement (`console.warn`), rien n'est masqué |
| Élément `wu-animate` sans preset reconnu | Retombe sur `fade-up` |
| Enfants d'un groupe avec des presets différents | Animés ensemble, en stagger, chacun vers son propre état final |
| Éléments isolés avec le même `start`/`once` | Regroupés sur un seul `ScrollTrigger.batch()` |

---

## ⚠️ Limitations

- **FOUC possible** : les éléments ne sont masqués qu'au moment où le script tourne (`gsap.set()`). Si GSAP charge tard, prévoir un fallback CSS critique dans le `<head>` :

  ```html
  <style>
    @media (prefers-reduced-motion: no-preference) {
      html:not(.wf-design-mode) [wu-animate] { opacity: 0; }
    }
  </style>
  ```

  La media query évite de masquer inutilement les utilisateurs en `prefers-reduced-motion: reduce`, qui voient de toute façon l'élément révélé instantanément par le script (voir Comportement ci-dessus). Le `html:not(.wf-design-mode)` évite que la règle s'applique **dans le Designer** : `.wf-design-mode` est la classe posée par Webflow sur `<html>` en mode édition — sans cette exclusion, les éléments resteraient invisibles en permanence dans le canvas, puisque le custom code (donc `animate.js`) n'y tourne jamais.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. GSAP et ScrollTrigger sont-ils bien chargés **avant** `animate.js` ? Vérifier dans la console : `window.gsap` et `window.ScrollTrigger` doivent être définis.
2. L'élément a-t-il bien `wu-animate="…"` avec un nom de preset valide ?
3. Le site est-il publié ? Le custom code ne tourne pas en Preview.
4. Rien ne s'anime dans un groupe ? Vérifier que `wu-animate-group` est bien sur le **wrapper direct** des enfants `wu-animate`.
5. Console (F12) : une erreur JavaScript, ou le warning `[wu-animate] GSAP introuvable` ?
6. Erreur `Cannot read properties of undefined (reading 'ease')` dans la console ? C'était un bug de la v1.0.0 (voir Changelog v1.0.1) — mettre à jour vers la dernière version du fichier.

---

## 📄 Changelog

- **v1.2.0** — Un preset peut déclarer son `ease` et sa `duration` par défaut (`{ from, to, ease, duration }`), utilisés quand l'élément ne pose pas l'attribut correspondant. Dans un groupe, chaque enfant garde maintenant son ease (attribut ou preset) au lieu de toujours prendre `power2.out` : le module crée un tween par ease distincte et calcule le stagger sur tout le groupe (`gsap.utils.distribute`), donc le rythme ne change pas. `wu-animate-ease` sur le wrapper force toujours la même ease pour tout le groupe. Changement de comportement : un `wu-animate-ease` posé sur un enfant de groupe, auparavant ignoré, est désormais appliqué.
- **v1.1.2** — Nouveau preset `zoom-in` (défaut `wu-animate-scale` : `0.7`). Fix au passage : `zoom-out` avait un fallback à `1.15` dans son code qui n'était en réalité jamais atteint (`wu-animate-scale` était déjà résolu à `0.9` avant même d'arriver au preset) — `zoom-out` se comportait donc comme `scale-in` par défaut. Chaque preset `scale-*`/`zoom-*` a maintenant son propre défaut, réellement appliqué quand `wu-animate-scale` n'est pas posé.
- **v1.1.1** — Nouveau preset `blur-in` (fondu + défloutage, propriété `filter`) et attribut `wu-animate-blur` (défaut `12` px). Confirme au passage l'intérêt du format `{ from, to }` introduit en v1.1.0 : aucune modification du core n'a été nécessaire pour l'ajouter.
- **v1.1.0** — Les presets déclarent maintenant `{ from, to }` au lieu de seulement l'état de départ, ce qui débloque des propriétés custom (`filter`, `rotation`…) au-delà de `x`/`y`/`scale` — voir "Presets personnalisés". **Breaking change** pour tout preset custom déjà écrit avant cette version : l'ancien format `o => ({x, y, scale})` doit devenir `o => ({ from: {x, y, scale}, to: {x: 0, y: 0, scale: 1} })`. Les presets fournis par le module (`fade-up`, `scale-in`…) sont déjà à jour.
- **v1.0.1** — Fix : `ease` provoquait `Cannot read properties of undefined (reading 'ease')` et bloquait l'animation (élément resté invisible). Cause : contrairement à `duration`/`delay`, GSAP traite une fonction passée à `ease` comme une courbe d'accélération personnalisée (rappelée à chaque frame avec la progression 0→1), pas comme une "function-based value" résolue une fois par cible. `ease` fait maintenant partie de la clé de regroupement des éléments isolés (comme `start`/`once`) et est passée en string simple ; pour un groupe, elle se pose sur le wrapper (`wu-animate-ease`) plutôt que sur chaque enfant.
- **v1.0.0** — Version initiale : presets fade/scale, groupes en stagger, batching des éléments isolés, support `prefers-reduced-motion`, idempotence via `wu-animate-applied`.
