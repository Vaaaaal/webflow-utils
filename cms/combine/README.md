# cms/combine

Fusionne deux (ou plusieurs) Collection Lists Webflow en une seule liste, avec **tri** et **limite** optionnels. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : combiner une collection "featured" avec une collection "standard" sur une homepage, mixer deux types de contenu (articles + études de cas) dans un même flux, fusionner deux sources de produits, ou afficher côte à côte des éléments issus de plusieurs collections tout en gardant un tri chronologique global.

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/cms/combine/combine.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`combine.js`](./combine.js) entre des balises `<script>…</script>`.

---

## 🧠 Concepts

- **Liste cible** : la première Collection List, celle qui restera dans le DOM et qui recevra les items des sources.
- **Liste source** : la seconde Collection List (ou les suivantes). Ses items sont déplacés dans la cible, puis son wrapper est supprimé du DOM.
- **Nom de combo** : identifiant arbitraire qui apparie une cible à ses sources. Permet d'avoir plusieurs combos sur la même page sans qu'ils se mélangent.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-combine-` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur la liste cible (Collection List Wrapper #1)

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-combine` | nom du combo (string libre, ex. `articles`) | ✅ | — |
| `wu-combine-sort-type` | `date` / `number` / `string` | ❌ | pas de tri |
| `wu-combine-sort-dir` | `asc` / `desc` | ❌ | `asc` |
| `wu-combine-limit` | entier (ex. `6`) | ❌ | pas de limite |

### Sur la liste source (Collection List Wrapper #2)

| Attribut | Valeurs | Obligatoire |
|---|---|---|
| `wu-combine-source` | même nom que `wu-combine` de la cible | ✅ |

### Sur chaque item (dans les deux collections)

| Attribut | Valeurs | Obligatoire |
|---|---|---|
| `wu-combine-sort-value` | valeur à utiliser pour le tri, bindée depuis un champ CMS | ✅ si tri activé |

> 💡 Format recommandé pour les dates : `YYYY-MM-DD` (ISO). Compatible avec `new Date()`.

---

## 🛠️ Mise en place dans Webflow

### 1. Préparer les champs CMS

Dans chacune des **deux collections** à combiner, assure-toi d'avoir un champ commun pour le tri (généralement une Date).

### 2. Poser les attributs sur la liste cible

Sélectionner le **Collection List Wrapper** de la première collection → **Settings (D)** → **Custom Attributes** :

- `wu-combine` = `articles`
- `wu-combine-sort-type` = `date`
- `wu-combine-sort-dir` = `desc`
- `wu-combine-limit` = `6`

### 3. Poser l'attribut sur la liste source

Sélectionner le **Collection List Wrapper** de la seconde collection → Custom Attributes :

- `wu-combine-source` = `articles` *(exactement le même nom)*

### 4. Poser `wu-combine-sort-value` sur les items des deux collections

Sélectionner le **Collection Item** → Custom Attributes → **+** :

- Name : `wu-combine-sort-value`
- Value : cliquer sur l'icône violette → **Get value from** → champ Date → format ISO `YYYY-MM-DD`

Répéter dans la seconde collection.

### 5. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Liste cible : première collection -->
<div class="w-dyn-list"
     wu-combine="articles"
     wu-combine-sort-type="date"
     wu-combine-sort-dir="desc"
     wu-combine-limit="6">
  <div role="list" class="w-dyn-items">
    <div role="listitem" class="w-dyn-item" wu-combine-sort-value="2025-03-15">
      <!-- contenu de l'item -->
    </div>
  </div>
</div>

<!-- Liste source : seconde collection -->
<div class="w-dyn-list" wu-combine-source="articles">
  <div role="list" class="w-dyn-items">
    <div role="listitem" class="w-dyn-item" wu-combine-sort-value="2025-04-02">
      <!-- contenu de l'item -->
    </div>
  </div>
</div>
```

Résultat après exécution :
- Les items des deux listes fusionnés dans la cible.
- Tri par date décroissante.
- Maximum 6 items, surplus supprimé du DOM.
- Liste source retirée du DOM.

---

## 🔁 Plusieurs combos sur une même page

Utiliser un nom différent pour chaque combo :

```html
<div class="w-dyn-list" wu-combine="featured">…</div>
<div class="w-dyn-list" wu-combine-source="featured">…</div>

<div class="w-dyn-list" wu-combine="latest">…</div>
<div class="w-dyn-list" wu-combine-source="latest">…</div>
```

Le script traite chaque combo indépendamment, sans interférence.

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour des combos injectés après coup (modal AJAX, contenu lazy-loadé), relance le script :

```js
window.WU.combine.init();
```

⚠️ Attention : à la différence de `list-variants`, le module `combine` **n'est pas idempotent** — les listes sources déjà supprimées du DOM ne peuvent pas être re-traitées. Cette ré-init est utile uniquement quand de **nouveaux** combos (cibles + sources) apparaissent dans le DOM après chargement initial.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| Une seule liste vide | Les items de l'autre liste s'affichent normalement |
| Les deux listes vides | La liste cible est masquée (`display: none`) |
| `wu-combine-sort-type` absent | Pas de tri, concaténation simple (cible d'abord, puis source) |
| `wu-combine-limit` absent | Tous les items sont conservés |
| Item sans `wu-combine-sort-value` (avec tri activé) | Renvoyé en fin de liste |

---

## ⚠️ Limitations

- **Filtres / tri natif Webflow** : appliqués **avant** le script. Le script reçoit déjà les items filtrés. Utiliser le tri Webflow par défaut pour préfiltrer, et le script pour fusionner.
- **Pagination Webflow** : non compatible. Désactiver la pagination ou utiliser "Show all".
- **Interactions IX2** : les interactions sur les items réinjectés peuvent ne pas se déclencher. Solution : poser les triggers sur des éléments parents stables.
- **Listes imbriquées (nested collections)** : la cible utilise `:scope >` pour ne pas attraper les items des collections imbriquées. Les sources, en revanche, attrapent tous les `.w-dyn-item` descendants. Adapter le script si besoin.
- **CMS limit** : Webflow limite chaque Collection List à 100 items max.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le wrapper cible a-t-il bien `wu-combine="…"` ?
2. Le wrapper source a-t-il bien `wu-combine-source="…"` avec le **même** nom (sensible à la casse) ?
3. Chaque item a-t-il un `wu-combine-sort-value` non vide (si tri activé) ? Inspecter dans la console.
4. Le site est-il publié ? Le custom code ne tourne pas en Preview.
5. La liste source disparaît-elle du DOM après chargement ? Si oui, le script s'exécute bien.
6. Console (F12) : une erreur JavaScript ?

---

## 📄 Changelog

- **v1.0.0** — Version initiale : fusion, tri (date/number/string), limite, support multi-combos. Attributs préfixés `wu-combine-`.
- **v1.1.0** — Expose `init()` sur `window.WU.combine` pour ré-init après injection dynamique.
