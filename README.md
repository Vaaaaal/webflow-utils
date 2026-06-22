# webflow-utils

Collection de scripts JavaScript prêts à l'emploi pour étendre les capacités de Webflow. Chaque module est **autonome**, **piloté par custom attributes** (pas de config JS à modifier), et **conçu pour cohabiter avec d'autres scripts** sur la même page.

Les modules sont organisés par **catégorie** (CMS, UI, forms, etc.) pour rester lisibles à mesure que le repo grandit.

---

## 🧰 Modules disponibles

### CMS

| Module | Description | Doc |
|---|---|---|
| [`cms/combine`](./cms/combine) | Fusionne deux Collection Lists Webflow en une seule, avec tri et limite optionnels. | [README](./cms/combine/README.md) |

### Finsweet

Extensions et helpers pour [Finsweet Attributes](https://finsweet.com/attributes).

| Module | Description | Doc |
|---|---|---|
| [`finsweet/sort-direction`](./finsweet/sort-direction) | Force la direction (asc/desc) des sort triggers Finsweet List Sort — un bouton = une direction fixe, sans toggle, avec état actif réactif. | [README](./finsweet/sort-direction/README.md) |

### Rich Text

| Module | Description | Doc |
|---|---|---|
| [`rich-text/list-variants`](./rich-text/list-variants) | Transforme les listes d'un Rich Text en variantes stylées (checkmarks, flèches, étoiles) via un marqueur textuel. | [README](./rich-text/list-variants/README.md) |
| [`rich-text/blockquote-author`](./rich-text/blockquote-author) | Transforme les blockquotes d'un Rich Text en `<figure>` + `<figcaption>` pour citer un auteur, via un séparateur textuel. | [README](./rich-text/blockquote-author/README.md) |

### AI

| Module | Description | Doc |
|---|---|---|
| [`ai/ask-ai`](./ai/ask-ai) | Transforme des liens/boutons en raccourcis vers une IA (ChatGPT, Claude, Perplexity, Gemini, Grok) avec un prompt pré-formé pour résumer ou analyser la page courante. | [README](./ai/ask-ai/README.md) |

> D'autres catégories et modules seront ajoutés au fil des besoins.

---

## 🚀 Utilisation

Trois façons d'intégrer un module dans Webflow, du plus simple au plus propre.

### Option 1 — Copier-coller (le plus simple)

1. Ouvrir le fichier `.js` du module sur GitHub (ex. `cms/combine/combine.js`).
2. Copier le contenu.
3. Dans Webflow : **Project Settings → Custom Code → Footer Code**, ou **Page Settings → Before `</body>` tag**.
4. Coller entre des balises `<script>…</script>`.

### Option 2 — Via jsDelivr (CDN, recommandé)

Permet de garder une seule source de vérité : si tu modifies le script dans GitHub, le site Webflow récupère automatiquement la dernière version.

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/cms/combine/combine.js"></script>
```

Pour fixer une version spécifique (recommandé en prod pour éviter les surprises), utiliser un tag Git :

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@v1.0.0/cms/combine/combine.js"></script>
```

### Option 3 — Self-hosted

Télécharger le fichier, l'héberger sur ton propre CDN (Cloudflare, S3, etc.) et le servir depuis là.

---

## 📐 Conventions

Tous les modules de ce repo suivent les mêmes principes :

- **IIFE strict** : chaque script est enveloppé dans `(function () { 'use strict'; … })();` pour éviter la pollution du scope global et les collisions avec d'autres scripts (Webflow IX2, Finsweet, GSAP, etc.).
- **Pilotage par custom attributes** : aucune configuration JS à modifier. Tout se règle dans le Designer via les Custom Attributes.
- **Préfixe `wu-` + namespace par module** : tous les attributs commencent par `wu-` (pour "webflow-utils"), suivi du nom du module. Exemple pour le module `combine` : `wu-combine`, `wu-combine-source`, `wu-combine-sort-value`, etc. Ce préfixe sans `data-` suit la convention de l'écosystème Webflow (Finsweet `fs-`) et des libs modernes (Alpine `x-`, HTMX `hx-`, Vue `v-`). Note : techniquement signalé comme invalide par le validator HTML W3C, sans impact réel sur les navigateurs, le SEO ou l'accessibilité.
- **Démarrage adaptatif** : `DOMContentLoaded` si la page charge encore, exécution immédiate sinon.
- **Échecs silencieux** : si un attribut manque ou si un élément n'est pas trouvé, le script s'arrête proprement sans planter la page.
- **Compatible Webflow natif** : ne casse ni les Collection Lists, ni les Interactions IX2, ni la pagination native (sauf mention contraire dans le README du module).
- **Namespace global `window.WU`** : chaque module expose au minimum sa fonction `init()` sur `window.WU.{nomDuModule}` pour permettre une ré-init après injection dynamique de contenu (CMS Load, modals, AJAX). Le namespace `WU` matche le préfixe d'attribut `wu-`.

---

## 📂 Structure du repo

```
webflow-utils/
├── README.md                       ← ce fichier (index global)
├── LICENSE                         ← MIT
├── ai/                             ← catégorie : outillage IA / GEO
│   └── ask-ai/
├── cms/                            ← catégorie : manipulation CMS
│   └── combine/
├── finsweet/                       ← catégorie : extensions Finsweet Attributes
│   └── sort-direction/
│       ├── sort-direction.js
│       └── README.md
├── rich-text/                      ← catégorie : helpers Rich Text
│   ├── list-variants/
│   └── blockquote-author/
└── …
```

**Règles d'organisation :**
- **2 niveaux maximum** : `catégorie/module/`. Pas de sous-sous-catégorie.
- **Un module = un dossier** contenant `[nom].js` + `README.md`. Le fichier JS porte le nom du module (ex. `combine.js`, pas `index.js`) pour rester lisible quand il est référencé en URL dans le custom code Webflow.
- **Un module appartient à une seule catégorie**. Si un module touche plusieurs domaines, choisir la catégorie principale.
- **README de catégorie** : dès qu'une catégorie contient 3 modules ou plus, ajouter un `README.md` à la racine de la catégorie pour lister ses modules.

**Catégories envisagées :**

| Catégorie | Pour quoi |
|---|---|
| `cms/` | Manipulation de Collection Lists (combine, filter, sort, search) |
| `ui/` | Composants d'interface (tabs, modals, accordions, sliders) |
| `forms/` | Helpers de formulaire (masking, multistep, validation) |
| `animations/` | Wrappers GSAP, scroll, hover |
| `seo/` | Schema.org, meta, breadcrumbs |
| `integrations/` | Tiers (Cal.com, Brevo, HubSpot) |
| `utils/` | Helpers génériques (lazyload, copy-to-clipboard) |
| `rich-text/` | Helpers Rich Text Webflow (variantes de listes, injection de CTA, etc.) |
| `ai/` | Outillage IA / GEO (raccourcis prompts, assistants, génération) |
| `finsweet/` | Extensions et helpers pour Finsweet Attributes (List Filter, List Sort, List Load…) |

Les catégories sont créées à la demande : pas besoin de toutes les avoir d'avance.

---

## ✍️ Ajouter un nouveau module

Pour rester cohérent avec l'existant :

1. Identifier la **catégorie** (créer le dossier si elle n'existe pas).
2. Créer un sous-dossier `nom-du-module/` dans la catégorie.
3. Y placer `nom-du-module.js` (même nom que le dossier) qui respecte les conventions ci-dessus. Tous les attributs du module doivent être préfixés par `wu-nom-du-module-` (ex. `wu-combine`, `wu-combine-limit`). Le module doit exposer sa fonction `init()` sur `window.WU.{nomDuModule}` en fin d'IIFE.
4. Y placer `README.md` documentant :
   - Description courte
   - Installation (lien jsDelivr inclus, avec le chemin complet `catégorie/module/module.js`)
   - Tableau des attributs (cible, source, items)
   - Exemple HTML complet
   - Comportement / cas limites
   - Limitations
   - Section debug
5. Ajouter une ligne dans le tableau de la catégorie correspondante du README global.
6. Si la catégorie atteint 3 modules ou plus, créer un `README.md` à la racine de la catégorie listant ses modules.

---

## 🐛 Debug général

Si un module ne fonctionne pas :

1. **Vérifier que le site est publié** — le custom code Webflow ne s'exécute pas en mode Preview du Designer.
2. **Ouvrir la console** (F12) — chercher une erreur JavaScript.
3. **Inspecter les custom attributes** sur l'élément concerné — vérifier qu'ils sont bien présents et orthographiés correctement (sensible à la casse).
4. **Vérifier l'ordre des scripts** — si le module dépend d'une lib externe (GSAP, jQuery), elle doit être chargée avant.
5. Consulter le README du module pour les checks spécifiques.

---

## 📄 Licence

[MIT](./LICENSE) — utilisation libre, personnelle ou commerciale, modification autorisée. Aucune garantie.

---

## 👤 Auteur

[Valentin Cassus](https://vaaal.fr) — Webflow developer, Digidop & Freelance.

Suggestions et retours bienvenus via les [Issues](https://github.com/Vaaaaal/webflow-utils/issues).
