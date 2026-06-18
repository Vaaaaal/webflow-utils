# ai/ask-ai

Transforme des liens ou boutons en **raccourcis vers une IA** (ChatGPT, Claude, Perplexity, Gemini, Grok) qui ouvre l'outil avec un **prompt pré-formé** demandant de résumer / analyser la page courante. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : ajouter une rangée de boutons « Résumer cet article avec… » sous un post de blog pour faciliter le partage et la citation par les LLM (logique GEO/AEO), offrir aux visiteurs un raccourci « Poser une question à une IA sur cette page », ou pré-remplir un prompt SEO structuré (titre + meta description + plan H2/H3) en un clic depuis n'importe quelle page CMS.

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/ai/ask-ai/ask-ai.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`ask-ai.js`](./ask-ai.js) entre des balises `<script>…</script>`.

---

## 🧠 Concepts

- **Lien** : tout élément portant l'attribut `wu-ask-ai` dont la valeur est une clé de provider (`chatgpt`, `claude`…). Un `<a>` reçoit un `href` ; tout autre élément (bouton, div) reçoit un listener de clic. Au clic, l'IA s'ouvre dans un nouvel onglet avec le prompt encodé dans l'URL.
- **Provider** : l'IA cible. La liste est figée dans le script (infra), pas configurable par attribut : `chatgpt`, `perplexity`, `claude`, `gemini`, `grok`.
- **Prompt** : le texte envoyé à l'IA. Par défaut, un prompt de résumé / analyse SEO baked-in. Surchargeable par un **template nommé**.
- **Template** : un élément **caché** contenant un prompt custom, identifié par un nom (`wu-ask-ai-template="article"`). Un ou plusieurs liens le ciblent par ce nom via `wu-ask-ai-use="article"`. Plusieurs liens (un par IA) partagent ainsi le même prompt sans le dupliquer.
- **Placeholders** : variables remplacées au runtime dans le prompt — `{url}`, `{title}`, `{site}`, `{lang}`.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-ask-ai` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur le lien ou bouton

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-ask-ai` | `chatgpt` / `perplexity` / `claude` / `gemini` / `grok` | ✅ | — |
| `wu-ask-ai-use` | nom d'un template (même valeur que `wu-ask-ai-template`) | ❌ | prompt par défaut |
| `wu-ask-ai-site` | nom du site (string libre) | ❌ | hérité d'un ancêtre, sinon hostname |

### Sur l'élément template (caché)

| Attribut | Valeurs | Obligatoire |
|---|---|---|
| `wu-ask-ai-template` | nom du template (string libre, ex. `article`) | ✅ si un lien le cible |

### Sur un ancêtre (config héritée)

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-ask-ai-site` | nom du site, hérité par tous les liens descendants | ❌ | hostname sans `www.` |

> 💡 `wu-ask-ai-site` se résout en remontant les ancêtres (`closest`). Pose-le **une fois** sur le `<body>` ou un wrapper global, tous les liens en héritent. Un lien peut override en portant son propre `wu-ask-ai-site`.

### Attribut posé automatiquement par le script

| Attribut | Description |
|---|---|
| `wu-ask-ai-applied` | Posé sur chaque élément traité (valeur vide). Sert à l'idempotence : un élément déjà traité n'est pas retraité (évite notamment le double listener sur les boutons). |

---

## 🔤 Placeholders disponibles

À utiliser dans un template custom. Remplacés au runtime :

| Placeholder | Source | Comportement si absent / vide |
|---|---|---|
| `{url}` | `location.href` | **Ajouté automatiquement** à la fin du prompt s'il n'est pas dans le template |
| `{title}` | `document.title` | Remplacé par une chaîne vide |
| `{site}` | `wu-ask-ai-site` → hostname sans `www.` | La **ligne** contenant `{site}` est retirée du prompt |
| `{lang}` | `<html lang>`, converti en nom lisible (`en` → « English ») | Remplacé par « la langue de la page » |

> 💡 `{url}` est garanti : même si un template l'oublie, l'URL est ajoutée en fin de prompt (un message `console.info` le signale, sans bloquer).

---

## 🛠️ Mise en place dans Webflow

### 1. Poser le provider sur les liens

Sélectionner le lien (ou bouton) → **Settings (D)** → **Custom Attributes** :

- Name : `wu-ask-ai`
- Value : `chatgpt` (ou `claude`, `perplexity`, `gemini`, `grok`)

Répéter pour chaque IA proposée. Avec un `<a>`, le module pose `href`, `target="_blank"` et `rel="noopener noreferrer"`. Avec un autre élément, il attache un listener de clic qui ouvre un nouvel onglet.

### 2. (Optionnel) Définir le nom du site

Sur le `<body>` ou un wrapper global → Custom Attributes :

- Name : `wu-ask-ai-site`
- Value : `Orisha`

Si tu ne le poses pas, le module utilise le hostname (sans `www.`) — ex. `orisha.com`.

### 3. (Optionnel) Créer un prompt custom

Si le prompt par défaut ne convient pas :

1. Ajouter un bloc de texte (un simple Div ou Text Block), **pas un Rich Text**.
2. Le masquer : style `display: none` (ou la classe d'utilité de masquage de ton projet).
3. Y poser l'attribut `wu-ask-ai-template` = `article` (nom au choix).
4. Écrire le prompt dans le bloc, en utilisant les placeholders voulus.
5. Sur chaque lien concerné, poser `wu-ask-ai-use` = `article`.

### 4. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

### Cas simple — prompt par défaut

```html
<!-- Nom du site défini une fois, hérité par tous les liens -->
<body wu-ask-ai-site="Orisha">

  <!-- … contenu de l'article … -->

  <a wu-ask-ai="chatgpt">Résumer avec ChatGPT</a>
  <a wu-ask-ai="claude">Résumer avec Claude</a>
  <a wu-ask-ai="perplexity">Résumer avec Perplexity</a>

</body>
```

Chaque lien ouvre l'IA correspondante avec le prompt de résumé par défaut, contextualisé sur l'URL, le titre, le site (`Orisha`) et la langue de la page.

### Cas avancé — prompt custom partagé

```html
<body wu-ask-ai-site="Orisha">

  <!-- Template caché, ciblé par son nom "article" -->
  <div wu-ask-ai-template="article" style="display:none">
    Résume cet article pour un lecteur pressé : {url}
    Titre : {title} — Source : {site}
    Réponds en {lang}, en 5 points clés maximum.
  </div>

  <!-- Les trois liens partagent le même template -->
  <a wu-ask-ai="chatgpt"    wu-ask-ai-use="article">Résumer avec ChatGPT</a>
  <a wu-ask-ai="claude"     wu-ask-ai-use="article">Résumer avec Claude</a>
  <a wu-ask-ai="perplexity" wu-ask-ai-use="article">Résumer avec Perplexity</a>

</body>
```

### Plusieurs templates sur une même page

```html
<!-- Un template pour les articles -->
<div wu-ask-ai-template="article" style="display:none">Résume cet article : {url}…</div>
<a wu-ask-ai="chatgpt" wu-ask-ai-use="article">Résumer l'article</a>

<!-- Un autre pour les pages produit -->
<div wu-ask-ai-template="produit" style="display:none">Analyse cette page produit : {url}…</div>
<a wu-ask-ai="chatgpt" wu-ask-ai-use="produit">Analyser le produit</a>
```

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour des liens injectés **après** (pagination Finsweet CMS Load, modal AJAX, tab lazy-loadé…), relancer le script :

```js
// Exemple avec Finsweet CMS Load
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsload',
  (listInstances) => {
    listInstances[0].on('renderitems', () => {
      window.WU.askAi.init();
    });
  },
]);

// Ou après n'importe quelle injection AJAX
fetch('/api/content').then(/* ... */).then(() => {
  document.querySelector('.modal-body').innerHTML = newHtml;
  window.WU.askAi.init();
});
```

Grâce à l'idempotence (attribut `wu-ask-ai-applied`), relancer `init()` n'a **aucun effet** sur les liens déjà traités. Seuls les nouveaux sont traités. C'est sans risque, tu peux l'appeler aussi souvent que nécessaire.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| `wu-ask-ai` avec un provider connu | Lien/bouton configuré pour ouvrir l'IA avec le prompt |
| `wu-ask-ai` avec un provider inconnu | Ignoré silencieusement |
| Élément `<a>` | `href` + `target="_blank"` + `rel="noopener noreferrer"` posés |
| Élément non-`<a>` (bouton, div) | Listener de clic → `window.open` nouvel onglet |
| `wu-ask-ai-use` absent | Prompt par défaut (résumé / analyse SEO) |
| `wu-ask-ai-use` pointant un template introuvable ou vide | Fallback silencieux sur le prompt par défaut |
| Template sans `{url}` | URL ajoutée automatiquement en fin de prompt (`console.info`) |
| `wu-ask-ai-site` absent partout | Hostname sans `www.` (ex. `orisha.com`) |
| `{site}` sans valeur résolue (cas limite) | La ligne contenant `{site}` est retirée du prompt |
| `<html lang>` présent | `{lang}` = nom de la langue dans sa propre langue (`en` → « English », `es` → « español ») |
| `<html lang>` absent | `{lang}` remplacé par « la langue de la page » |
| `init()` appelé plusieurs fois | Idempotent — les éléments déjà traités (`wu-ask-ai-applied`) sont ignorés |

---

## ⚠️ Limitations

- **Deep-links non officiels (« best effort »)** : les URL de pré-remplissage (`?q=`, `?text=`) ne sont **pas** des API publiques garanties par les éditeurs. Elles fonctionnent aujourd'hui mais peuvent changer ou cesser de fonctionner sans préavis, particulièrement pour Grok (X) et Gemini. Tester régulièrement chaque provider et considérer ce module comme un confort, pas une intégration robuste.
- **Longueur d'URL** : le prompt est encodé dans l'URL. Les prompts très longs (ou enrichis de beaucoup de contenu) peuvent dépasser les limites pratiques d'URL (~2000–8000 caractères selon le navigateur et la destination) et être tronqués. Garder les templates concis.
- **Connexion requise côté IA** : l'utilisateur doit être connecté à l'outil cible pour que le prompt se lance ; sinon il atterrit sur une page de login et le prompt peut être perdu.
- **Le contenu de la page n'est pas envoyé** : seule l'URL est transmise. C'est à l'IA de fetch la page (ce que toutes ne font pas de façon fiable). Le module ne scrape pas et n'envoie pas le texte de l'article.
- **Template = texte brut** : le prompt custom est lu via `textContent`. Utiliser un bloc de texte simple masqué, **pas un Rich Text** (les sauts de ligne et espaces parasites du Rich Text peuvent dégrader le prompt). Le formatage HTML est ignoré.
- **`href` figé après traitement** : avec le garde universel, un `<a>` déjà traité n'est pas recalculé si l'URL ou le titre de la page changent sans rechargement (contexte SPA-like). Sans impact sur Webflow, où la navigation recharge la page.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le lien a-t-il bien `wu-ask-ai` avec une valeur de provider **connue** (`chatgpt`, `perplexity`, `claude`, `gemini`, `grok`, sensible à la casse) ?
2. Pour un `<a>` : inspecter l'élément après chargement — le `href` est-il bien réécrit vers l'URL de l'IA ? Si oui, le script a tourné.
3. L'attribut `wu-ask-ai-applied` est-il posé sur l'élément ? Confirmation que le script l'a traité.
4. Prompt custom non pris en compte ? Vérifier que `wu-ask-ai-use` (sur le lien) et `wu-ask-ai-template` (sur le bloc caché) ont **exactement** le même nom (sensible à la casse).
5. Le bloc template est-il un **bloc de texte simple** et non un Rich Text ? Inspecter son `textContent` dans la console.
6. Le prompt arrive tronqué dans l'IA ? Probable dépassement de longueur d'URL — raccourcir le template.
7. L'IA ouvre mais ne pré-remplit pas le prompt ? Probable changement du deep-link côté éditeur (cf. Limitations) ou utilisateur non connecté.
8. Contenu dynamique non traité ? Voir [Contenu injecté dynamiquement](#-contenu-injecté-dynamiquement-cms-load-modals-ajax) — appeler `window.WU.askAi.init()` après l'injection.
9. Le site est-il publié ? Le custom code ne tourne pas en Preview.
10. Console (F12) : une erreur JavaScript, ou un `console.info [wu-ask-ai]` signalant un `{url}` manquant ?

---

## 📄 Changelog

- **v1.0.1** — `{lang}` : conversion du code `<html lang>` en nom de langue lisible via `Intl.DisplayNames` (`en` → « English »), au lieu d'injecter le code brut. Fallback sur le code brut si la conversion échoue.
- **v1.0.0** — Version initiale : raccourcis vers 5 providers (ChatGPT, Perplexity, Claude, Gemini, Grok), prompt par défaut de résumé / analyse SEO, templates custom nommés via `wu-ask-ai-template` / `wu-ask-ai-use`, placeholders `{url}` / `{title}` / `{site}` / `{lang}`, ajout automatique de `{url}` si absent, nom de site hérité via `closest` avec fallback hostname, support `<a>` et éléments cliquables, idempotence via `wu-ask-ai-applied`, expose `init()` sur `window.WU.askAi`.
