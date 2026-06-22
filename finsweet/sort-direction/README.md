# finsweet/sort-direction

Force la **direction de tri** (asc ou desc) sur les sort triggers de **Finsweet List Sort**, en supprimant le comportement de toggle natif. Chaque bouton déclenche une direction fixe — un seul état, un seul clic — avec sélection exclusive et bouton actif par défaut optionnel. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : avoir 3 boutons « Plus récents », « Plus anciens », « Plus populaires » côte à côte, chacun appliquant une direction fixe, avec un seul actif visuellement ; éviter qu'un bouton de tri se mette accidentellement en ordre asc au deuxième clic ; définir un bouton « actif au chargement » qui matche le tri Webflow natif, sans bascule inverse intempestive.

---

## ⚠️ Dépendance

Ce module **étend** Finsweet Attributes v2 (List Sort). Le script Finsweet doit être chargé sur la page **avant** ce module :

```html
<script async type="module"
  src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"
  fs-list>
</script>
```

Voir la [doc Finsweet List Sort](https://finsweet.com/attributes/list-sort).

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/finsweet/sort-direction/sort-direction.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page. À placer **après** le script Finsweet.

### Copier-coller

Copier le contenu de [`sort-direction.js`](./sort-direction.js) entre des balises `<script>…</script>`.

---

## 🧠 Architecture

Ce module **compose avec** le module sort de Finsweet, il ne le remplace pas. C'est important parce que [le sort de Finsweet ne s'initialise que si au moins un `fs-list-element="sort-trigger"` est présent dans le DOM](https://github.com/finsweet/attributes/blob/master/packages/list/src/factory.ts) — sinon le hook `'sort'` interne (qui appelle leur fonction `sortListItems()`) et le watch sur `list.sorting` ne sont jamais branchés, et muter `sorting.value` à la main ne fait littéralement rien.

Du coup chaque bouton porte les **trois** attributs nécessaires :

- `fs-list-element="sort-trigger"` — active le module sort de Finsweet
- `fs-list-field="..."` — déclare le field key à trier
- `wu-sort-direction="asc|desc"` — déclare la direction voulue

Au clic, le module :

1. **Intercepte le clic en phase capture** (`{ capture: true }`) — il s'exécute donc *avant* le listener bubble que Finsweet pose en interne dans [`buttons.ts`](https://github.com/finsweet/attributes/blob/master/packages/list/src/sort/buttons.ts).
2. **Appelle `e.stopImmediatePropagation()`** — bloque définitivement le listener natif Finsweet (qui ferait son toggle asc↔desc).
3. **Mute `listInstance.sorting.value`** avec la direction exacte voulue.
4. Le **watch interne de Finsweet** (`watch(list.sorting, ..., { deep: true })` debouncé à 0ms, posé dans [`sort/index.ts`](https://github.com/finsweet/attributes/blob/master/packages/list/src/sort/index.ts)) détecte le changement et déclenche `triggerHook('sort')` — qui lance leur pipeline : `sortListItems()` → `render`.

Le tri lui-même utilise donc l'implémentation Finsweet (gestion native de `number`/`date`/`text`, valeurs `Array`, animations CSS, scroll-to-anchor, query params…). Ce module ne fait qu'**orienter** le tri ; il ne le réécrit pas.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-sort-direction` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur chaque bouton de tri (Button / Text Link / Link Block)

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `fs-list-element` | `sort-trigger` | ✅ | — |
| `fs-list-field` | nom du field key (ex. `date`, `popular`, `title`) | ✅ | — |
| `wu-sort-direction` | `asc` / `desc` | ✅ | — |
| `wu-sort-direction-instance` | string libre, match `fs-list-instance` | ❌ | instance par défaut |
| `wu-sort-direction-active-class` | classe à appliquer quand actif | ❌ | `is-active` |
| `wu-sort-direction-default` | présent (valeur ignorée) | ❌ | — |

> 💡 Pour le typage des fields (date/number), poser `fs-list-fieldtype="date"` ou `"number"` sur l'élément des items qui porte la valeur — voir la doc Finsweet. Côté boutons, rien à faire de plus.

### Attribut posé automatiquement par le script

| Attribut | Description |
|---|---|
| `wu-sort-direction-applied` | Posé sur chaque bouton traité (valeur vide). Sert à l'idempotence : un bouton déjà traité n'est pas retraité (évite le double listener). |

---

## 🛠️ Mise en place dans Webflow

### 1. Configurer la Collection List côté Finsweet

Sur le **Collection List** : `fs-list-element="list"`.
Sur les éléments des items qui portent les valeurs à trier (ex. la date, le nombre de vues…) : `fs-list-field="date"`, `fs-list-field="popular"`, etc. Ajouter `fs-list-fieldtype="date"` ou `"number"` selon le cas.

### 2. Poser les attributs sur chaque bouton de tri

Sélectionner le bouton → **Settings (D)** → **Custom Attributes** :

- `fs-list-element` = `sort-trigger`
- `fs-list-field` = `date` (le field key correspondant)
- `wu-sort-direction` = `desc` (ou `asc`)

Optionnellement, sur **un seul** bouton par instance :

- `wu-sort-direction-default` = *(laisser vide — la présence suffit)*

### 3. (Optionnel) Styler l'état actif

Le module ajoute la classe `is-active` (ou celle définie via `wu-sort-direction-active-class`) sur le bouton dont le sort est actuellement appliqué.

Dans le Designer : ajouter `is-active` en combo class sur le bouton, styler son état (background, color, border, icône…), puis retirer la combo. Le script l'ajoutera dynamiquement.

### 4. Aligner le tri Webflow natif sur le bouton « default »

Pour éviter un flash visuel au chargement (Webflow rend dans son tri natif, puis Finsweet re-trie selon le bouton default), **aligner le tri natif Webflow sur le bouton marqué `wu-sort-direction-default`** : Collection List → Settings → Sort Order.

### 5. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Collection List Finsweet classique -->
<div fs-list-element="list">
  <div class="w-dyn-items">
    <div class="w-dyn-item">
      <h3 fs-list-field="title">Titre</h3>
      <span fs-list-field="date" fs-list-fieldtype="date">2026-06-20</span>
      <span fs-list-field="popular" fs-list-fieldtype="number">42</span>
    </div>
    <!-- … -->
  </div>
</div>

<!-- Boutons de tri à direction fixe — un seul par "intention" -->
<a fs-list-element="sort-trigger" fs-list-field="date"    wu-sort-direction="desc" wu-sort-direction-default>Plus récents</a>
<a fs-list-element="sort-trigger" fs-list-field="date"    wu-sort-direction="asc">Plus anciens</a>
<a fs-list-element="sort-trigger" fs-list-field="popular" wu-sort-direction="desc">Plus populaires</a>
```

Résultat : au chargement, « Plus récents » est actif (classe `is-active` posée, tri par `date desc` appliqué). Chaque clic ailleurs change le tri et déplace la classe active. Re-cliquer sur le bouton actif ne fait rien.

---

## 🎨 Styling — discriminer asc / desc en CSS

Pas besoin de classes séparées en JS — utilise les sélecteurs d'attribut :

```css
/* État actif générique */
.sort-btn.is-active {
  background: #000;
  color: #fff;
}

/* Style spécifique selon la direction */
.sort-btn.is-active[wu-sort-direction="desc"]::after { content: " ↓"; }
.sort-btn.is-active[wu-sort-direction="asc"]::after  { content: " ↑"; }

/* Ou par field si besoin */
.sort-btn[fs-list-field="date"].is-active    { /* … */ }
.sort-btn[fs-list-field="popular"].is-active { /* … */ }
```

---

## 🔁 Multi-instances

Si plusieurs Lists Finsweet cohabitent sur la même page, chacune doit avoir un `fs-list-instance="…"` sur son wrapper, et les boutons doivent matcher avec `wu-sort-direction-instance` :

```html
<div fs-list-element="list" fs-list-instance="blog">…</div>
<a fs-list-element="sort-trigger" fs-list-field="date"
   wu-sort-direction="desc"
   wu-sort-direction-instance="blog"
   wu-sort-direction-default>Articles récents</a>

<div fs-list-element="list" fs-list-instance="case-studies">…</div>
<a fs-list-element="sort-trigger" fs-list-field="date"
   wu-sort-direction="desc"
   wu-sort-direction-instance="case-studies"
   wu-sort-direction-default>Cas clients récents</a>
```

L'état actif et le bouton par défaut sont gérés indépendamment par instance.

---

## 🎨 Classe active personnalisée

Par défaut, la classe active est `is-active`. Pour utiliser une autre classe (ex. convention BEM type Lumos) :

```html
<a fs-list-element="sort-trigger" fs-list-field="date"
   wu-sort-direction="desc"
   wu-sort-direction-active-class="is-current">Plus récents</a>
```

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour des boutons injectés **après** (modal AJAX, tab lazy-loadé…), relancer le script :

```js
fetch('/api/content').then(/* ... */).then(() => {
  document.querySelector('.modal-body').innerHTML = newHtml;
  window.WU.sortDirection.init();
});
```

Grâce à l'idempotence (attribut `wu-sort-direction-applied`), relancer `init()` n'a **aucun effet** sur les boutons déjà traités. Seuls les nouveaux sont traités. L'effect réactif existant pour l'instance les pickup automatiquement (le bucket d'items est partagé). C'est sans risque, tu peux l'appeler aussi souvent que nécessaire.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| Bouton avec les 3 attributs (`fs-list-element="sort-trigger"`, `fs-list-field`, `wu-sort-direction`) | Bouton configuré, état actif réactif |
| `wu-sort-direction` avec une valeur autre que `asc`/`desc` | Console.warn + ignoré |
| `fs-list-field` ou `fs-list-element="sort-trigger"` manquant | Console.warn + ignoré |
| `wu-sort-direction-instance` ne matche aucune List | Console.warn + ignoré |
| Plusieurs `wu-sort-direction-default` sur la même instance | Premier appliqué, les suivants signalés en warn |
| Re-clic sur le bouton actif | No-op (intercept en capture bloque le handler natif) |
| Sort change via URL params, autre source, ou code externe | Classe active resynchronisée automatiquement |
| Plusieurs boutons même field + même direction | Tous deviennent actifs/inactifs ensemble |
| `init()` appelé plusieurs fois | Idempotent — boutons déjà traités ignorés, effects non dupliqués |

---

## ⚠️ Limitations

- **Dépend de Finsweet List Sort v2** : si Finsweet n'est pas chargé, le callback poussé dans `FinsweetAttributes` n'est jamais exécuté et rien ne se passe (échec silencieux). Vérifier que le script Finsweet est bien présent **avant** ce module.
- **Flash visuel au chargement** : si le tri Webflow natif diffère du bouton `wu-sort-direction-default`, on voit brièvement le tri natif avant que Finsweet ne re-trie. Solution : aligner le sort order natif Webflow sur le bouton default.
- **Pas de toggle, par design** : un bouton = une direction fixe. Pour un toggle classique (1er clic asc, 2e clic desc), utiliser le comportement natif Finsweet directement (sans ce module).
- **Classes natives Finsweet `is-list-asc`/`is-list-desc` non appliquées** : comme on bloque le listener natif Finsweet, leur `activeButton` interne reste vide. Utiliser notre classe (`is-active` ou custom) à la place.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le script Finsweet est-il chargé **avant** ce module ? Inspecter l'ordre des `<script>`.
2. Le bouton a-t-il les **3 attributs** requis : `fs-list-element="sort-trigger"`, `fs-list-field="..."`, `wu-sort-direction="asc|desc"` ?
3. L'attribut `wu-sort-direction-applied` est-il posé après chargement ? Confirmation que le script a traité le bouton.
4. Le `fs-list-field` du bouton correspond-il à un field réellement posé sur les items (`fs-list-field="..."` sur un élément à l'intérieur des items) ?
5. Cas multi-instances : `wu-sort-direction-instance` matche-t-il exactement `fs-list-instance` (sensible à la casse) ?
6. Inspecter en console : `window.WU.sortDirection._instances[0].sorting.value` — l'état du sort interne Finsweet doit refléter ce qui est attendu.
7. Contenu dynamique non traité ? Appeler `window.WU.sortDirection.init()` après l'injection.
8. Le site est-il publié ? Le custom code ne tourne pas en Preview.
9. Console (F12) : un `[wu-sort-direction]` en warn signale les erreurs de config explicitement.

---

## 📄 Changelog

- **v2.0.0** — Refonte de l'architecture après lecture du source code Finsweet. Le module **exige** maintenant `fs-list-element="sort-trigger"` + `fs-list-field` sur chaque bouton (au lieu de les interdire) — c'est requis par Finsweet pour activer son module sort interne. Au clic, on intercepte en phase capture pour bloquer le listener bubble natif (toggle), puis on mute `sorting.value` directement — le watch interne de Finsweet déclenche alors son pipeline complet (sort + render). Ajout de `wu-sort-direction-default` pour définir un bouton actif au chargement. Suppression de `wu-sort-direction-field` (remplacé par `fs-list-field` natif Finsweet, déjà présent sur le bouton pour le sort-trigger).
- **v1.0.0** — Version initiale (approche bypass sans sort-trigger natif). N'avait pas le comportement attendu car Finsweet n'initialise pas son module de sort si aucun `fs-list-element="sort-trigger"` n'est présent dans le DOM.
