# finsweet/sort-direction

Force la **direction de tri** (asc ou desc) sur les sort triggers de **Finsweet List Sort**, en supprimant le comportement de toggle natif. Chaque bouton déclenche une direction fixe — un seul état, un seul clic. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : avoir 3 boutons « Plus récents », « Plus anciens », « Prix décroissant » côte à côte, chacun appliquant une direction fixe, avec un seul actif visuellement ; éviter qu'un bouton de tri se mette accidentellement en ordre asc au deuxième clic ; permettre à un utilisateur de **revenir** à un tri en cliquant à nouveau dessus, sans bascule inverse intempestive.

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

## 🧠 Concepts

- **Trigger** : un élément (bouton, link block, text link) portant `wu-sort-direction`. Au clic, il applique sa direction fixe sur le sort de la List Finsweet associée. **Ne pas** poser `fs-list-element="sort-trigger"` sur ces boutons : ça réactiverait le toggle natif de Finsweet par-dessus.
- **List instance** : la List Finsweet ciblée (CMS Collection List ou liste statique structurée). Par défaut, le module cible l'instance sans nom. Pour une page multi-instances, préciser `wu-sort-direction-instance` qui doit matcher `fs-list-instance`.
- **État actif réactif** : le module branche un effect sur le sorting de la List. Dès que le tri change (clic, URL params, ou n'importe quelle source externe), la classe active est synchronisée sur tous les boutons concernés — un seul actif à la fois par instance.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-sort-direction` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur le bouton / link / link block

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-sort-direction` | `asc` / `desc` | ✅ | — |
| `wu-sort-direction-field` | field key (même que `fs-list-field` sur les items) | ✅ | — |
| `wu-sort-direction-instance` | string libre, match `fs-list-instance` | ❌ | instance par défaut |
| `wu-sort-direction-active-class` | nom de classe à appliquer quand actif | ❌ | `is-active` |

### Attribut posé automatiquement par le script

| Attribut | Description |
|---|---|
| `wu-sort-direction-applied` | Posé sur chaque bouton traité (valeur vide). Sert à l'idempotence : un bouton déjà traité n'est pas retraité (évite le double listener). |

---

## 🛠️ Mise en place dans Webflow

### 1. Configurer Finsweet List Sort normalement (sans sort-trigger natif)

Sur la Collection List : `fs-list-element="list"`.
Sur les items à sortable : `fs-list-field="date"` (+ `fs-list-fieldtype="date"` si nécessaire).

**Ne pas** poser `fs-list-element="sort-trigger"` sur tes boutons : on les pilote nous-mêmes.

### 2. Poser les attributs sur chaque bouton

Sélectionner le bouton → **Settings (D)** → **Custom Attributes** :

- `wu-sort-direction` = `desc` (ou `asc`)
- `wu-sort-direction-field` = `date` (le field key Finsweet correspondant)

Dupliquer le bouton pour les autres directions / fields.

### 3. (Optionnel) Styler l'état actif

Le module ajoute la classe `is-active` (ou celle que tu choisis via `wu-sort-direction-active-class`) sur le bouton dont le sort est actuellement appliqué.

Dans le Designer : ajouter une combo class `is-active` sur le bouton, styler son état (background, color, border…), puis retirer la combo. Le script l'ajoutera dynamiquement.

### 4. Publier et tester

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
      <span fs-list-field="price" fs-list-fieldtype="number">99.90</span>
    </div>
    <!-- … -->
  </div>
</div>

<!-- Boutons de tri à direction fixe -->
<button wu-sort-direction="desc" wu-sort-direction-field="date">Plus récents</button>
<button wu-sort-direction="asc"  wu-sort-direction-field="date">Plus anciens</button>
<button wu-sort-direction="desc" wu-sort-direction-field="price">Prix ↓</button>
<button wu-sort-direction="asc"  wu-sort-direction-field="price">Prix ↑</button>
```

Résultat : chaque clic applique exactement la direction inscrite. Le bouton actif reçoit la classe `is-active`, les autres la perdent.

---

## 🔁 Multi-instances

Si plusieurs Lists Finsweet cohabitent sur la même page, chacune doit avoir un `fs-list-instance="…"` sur son wrapper, et les boutons doivent matcher avec `wu-sort-direction-instance` :

```html
<div fs-list-element="list" fs-list-instance="blog">…</div>
<button wu-sort-direction="desc"
        wu-sort-direction-field="date"
        wu-sort-direction-instance="blog">Articles récents</button>

<div fs-list-element="list" fs-list-instance="case-studies">…</div>
<button wu-sort-direction="desc"
        wu-sort-direction-field="date"
        wu-sort-direction-instance="case-studies">Cas clients récents</button>
```

L'état actif est géré indépendamment par instance.

---

## 🎨 Classe active personnalisée

Par défaut, la classe active est `is-active`. Pour utiliser une autre classe (ex. si tu suis une convention BEM type Lumos) :

```html
<button wu-sort-direction="desc"
        wu-sort-direction-field="date"
        wu-sort-direction-active-class="is-current">Plus récents</button>
```

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour des boutons injectés **après** (modal AJAX, tab lazy-loadé…), relancer le script :

```js
// Après n'importe quelle injection AJAX
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
| `wu-sort-direction` avec `asc` ou `desc` + `wu-sort-direction-field` présent | Bouton configuré, état actif réactif |
| `wu-sort-direction` avec une autre valeur | Ignoré silencieusement |
| `wu-sort-direction-field` manquant | Ignoré silencieusement |
| `wu-sort-direction-instance` ne matche aucune List | Ignoré silencieusement |
| Sort change via URL params, autre déclencheur, ou code externe | Classe active resynchronisée automatiquement |
| Plusieurs boutons même field + même direction (doublons) | Tous deviennent actifs/inactifs ensemble — comportement attendu |
| Bouton **aussi** porteur de `fs-list-element="sort-trigger"` | Conflit : Finsweet réapplique son toggle par-dessus → à ne pas mélanger |
| `init()` appelé plusieurs fois | Idempotent — boutons déjà traités ignorés ; effects non dupliqués par instance |

---

## ⚠️ Limitations

- **Dépend de Finsweet List Sort v2** : si Finsweet n'est pas chargé, le callback poussé dans `FinsweetAttributes` n'est jamais exécuté et rien ne se passe (échec silencieux). Vérifier que le script Finsweet est bien présent et chargé **avant** ce module.
- **Pas compatible avec `fs-list-element="sort-trigger"` sur le même bouton** : les deux mécanismes se chevauchent, le bouton finira par toggler comme du Finsweet natif. Garder une stricte séparation : soit le bouton est piloté par ce module, soit par Finsweet, jamais les deux.
- **L'idempotence est par-élément, pas par-instance** : si tu supprimes un bouton du DOM et le réinjectes plus tard, il sera retraité (et c'est ce qu'on veut). En revanche, son ancien listener n'est pas nettoyé — mais comme l'élément est détaché, ça ne pose pas de problème mémoire en pratique.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le script Finsweet est-il chargé **avant** ce module ? Inspecter le `<head>` / `<body>` et l'ordre des `<script>`.
2. Le bouton a-t-il bien `wu-sort-direction` avec la valeur `asc` ou `desc` exactement (sensible à la casse) ?
3. Le bouton a-t-il bien `wu-sort-direction-field` avec un field key qui existe dans la collection ?
4. L'attribut `wu-sort-direction-applied` est-il posé sur le bouton après chargement ? Confirmation que le script l'a traité.
5. Cas multi-instances : `wu-sort-direction-instance` matche-t-il exactement `fs-list-instance` (sensible à la casse) ?
6. Le tri ne s'applique pas ? Vérifier qu'aucun `fs-list-element="sort-trigger"` n'est posé en parallèle sur le bouton (conflit).
7. Contenu dynamique non traité ? Voir [Contenu injecté dynamiquement](#-contenu-injecté-dynamiquement-cms-load-modals-ajax) — appeler `window.WU.sortDirection.init()` après l'injection.
8. Le site est-il publié ? Le custom code ne tourne pas en Preview.
9. Console (F12) : une erreur JavaScript ?

---

## 📄 Changelog

- **v1.0.0** — Version initiale : direction de tri fixe par bouton (asc ou desc), bypass du toggle natif Finsweet, support multi-instances, classe active réactive synchronisée sur tous les boutons d'une instance (mise à jour automatique si le sort change ailleurs), classe active personnalisable, idempotence via `wu-sort-direction-applied`, expose `init()` sur `window.WU.sortDirection`.
