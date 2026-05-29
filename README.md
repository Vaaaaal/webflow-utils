# webflow-utils

Collection de scripts JavaScript prêts à l'emploi pour étendre les capacités de Webflow. Chaque module est **autonome**, **piloté par data attributes** (pas de config JS à modifier), et **conçu pour cohabiter avec d'autres scripts** sur la même page.

Les modules sont organisés par **catégorie** (CMS, UI, forms, etc.) pour rester lisibles à mesure que le repo grandit.

---

## 🧰 Modules disponibles

### CMS

| Module | Description | Doc |
|---|---|---|
| [`cms/combine`](./cms/combine) | Fusionne deux Collection Lists Webflow en une seule, avec tri et limite optionnels. | [README](./cms/combine/README.md) |

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
- **Pilotage par data attributes** : aucune configuration JS à modifier. Tout se règle dans le Designer via les Custom Attributes.
- **Préfixe de namespace** : les attributs principaux d'un module sont préfixés par son nom (`data-combine`, `data-combine-source`, etc.) pour éviter les collisions entre modules.
- **Démarrage adaptatif** : `DOMContentLoaded` si la page charge encore, exécution immédiate sinon.
- **Échecs silencieux** : si un attribut manque ou si un élément n'est pas trouvé, le script s'arrête proprement sans planter la page.
- **Compatible Webflow natif** : ne casse ni les Collection Lists, ni les Interactions IX2, ni la pagination native (sauf mention contraire dans le README du module).

---

## 📂 Structure du repo

```
webflow-utils/
├── README.md                       ← ce fichier (index global)
├── cms/                            ← catégorie : manipulation CMS
│   ├── README.md                   ← (à venir) index de la catégorie
│   └── combine/
│       ├── combine.js              ← le script
│       └── README.md               ← doc complète du module
├── ui/                             ← catégorie : composants d'interface (à venir)
├── forms/                          ← catégorie : helpers de formulaire (à venir)
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

Les catégories sont créées à la demande : pas besoin de toutes les avoir d'avance.

---

## ✍️ Ajouter un nouveau module

Pour rester cohérent avec l'existant :

1. Identifier la **catégorie** (créer le dossier si elle n'existe pas).
2. Créer un sous-dossier `nom-du-module/` dans la catégorie.
3. Y placer `nom-du-module.js` (même nom que le dossier) qui respecte les conventions ci-dessus.
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
3. **Inspecter les data attributes** sur l'élément concerné — vérifier qu'ils sont bien présents et orthographiés correctement (sensible à la casse).
4. **Vérifier l'ordre des scripts** — si le module dépend d'une lib externe (GSAP, jQuery), elle doit être chargée avant.
5. Consulter le README du module pour les checks spécifiques.

---

## 📄 Licence

MIT — utilisation libre, personnelle ou commerciale, modification autorisée. Aucune garantie.

---

## 👤 Auteur

[Valentin Cassus](https://vaaal.fr) — Webflow developer, Digidop & Freelance.

Suggestions et retours bienvenus via les [Issues](https://github.com/Vaaaaal/webflow-utils/issues).
