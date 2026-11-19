# links/anchor

Ajoute une ancre (`#id`) à un lien de page Webflow. Dans le Designer, un lien
de type **Page** ne permet pas de viser une section d'une autre page : ce module
complète le `href` au runtime à partir de l'attribut `wu-anchor`.

Avantage par rapport à une URL écrite à la main (`/services#tarifs`) : le lien
reste un vrai lien **Page** Webflow, donc il suit automatiquement les
renommages de slug et les déplacements de page.

## Installation

Colle le script avant `</body>` (Project Settings → Custom Code, ou Page Settings) :

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@anchor-1.0.1/links/anchor/anchor.js"></script>
```

Le tag `anchor-x.y.z` fige la version du module (voir Changelog). Pour suivre
la dernière version en développement, remplacer par `@main` (déconseillé en prod).

## Attributs

| Attribut | Requis | Valeur | Description |
|---|---|---|---|
| `wu-anchor` | ✅ | id de la section | Ancre à ajouter au lien. Le `#` initial est optionnel (`tarifs` ou `#tarifs`). |

> Le module ne cible que les éléments `<a>` (Link Block, Text Link, Button).

## Utilisation

1. Sur la page cible, donne un **ID** à la section (Element Settings → ID), ex. `tarifs`.
2. Sur le lien : choisis **Page** → la page cible.
3. Ajoute le custom attribute `wu-anchor` = `tarifs`.

```html
<!-- Dans le Designer -->
<a href="/services" wu-anchor="tarifs">Voir les tarifs</a>

<!-- Après exécution -->
<a href="/services#tarifs" wu-anchor="tarifs" wu-anchor-applied>Voir les tarifs</a>
```

## Comportement

| `href` d'origine | `wu-anchor` | Résultat |
|---|---|---|
| `/services` | `tarifs` | `/services#tarifs` |
| `/services?ref=nav` | `tarifs` | `/services?ref=nav#tarifs` |
| `/services#faq` | `tarifs` | `/services#tarifs` (ancre remplacée) |
| `#` ou vide | `tarifs` | `/page-courante#tarifs` |
| `https://autre-site.com/page` | `tarifs` | `https://autre-site.com/page#tarifs` |
| `mailto:…`, `tel:…` | `tarifs` | ignoré (un seul warning console) |
| `/services` | *(vide)* | ignoré silencieusement |

- **Valeur vide = ignorée sans bruit** : un composant partagé (ex. Clickable
  avec un champ Anchor vide) écrit `wu-anchor=""` sur chaque lien. C'est le cas
  normal : aucun warning, aucun traitement.
- **Idempotent** : `wu-anchor-applied` évite tout double traitement, même si le
  script est chargé plusieurs fois ou si `init()` est rappelé.
- **Liens internes** : le `href` reste relatif (`/page#id`), comme Webflow le génère.
- **Contenu dynamique** : appeler `window.WU.anchor.init()` après injection
  (CMS Load, modals, AJAX, tabs lazy…).

## Limites

- Sans JS, le lien pointe vers la page sans l'ancre (dégradation propre).
- Le module ne fait pas le scroll lui-même : c'est le navigateur (ou le smooth
  scroll Webflow / CSS `scroll-behavior`) qui gère l'arrivée sur la section.
- Si la section cible est sous une navbar fixe, compense avec
  `scroll-margin-top` sur la section.

## Debug

- **L'ancre n'est pas ajoutée** → vérifier que l'attribut s'appelle bien
  `wu-anchor` et qu'il est posé sur l'élément `<a>` lui-même (pas sur un wrapper).
- **Le lien arrive en haut de page** → l'ID de la section ne correspond pas
  exactement à la valeur de `wu-anchor` (sensible à la casse).
- **Inspecter le lien** : la présence de `wu-anchor-applied` confirme que le
  script est passé.
- **Console** : les messages sont préfixés `[wu-anchor]`.

---

## 📄 Changelog

- **v1.0.1** (tag `anchor-1.0.1`) — Fix : les `wu-anchor` vides sont ignorés silencieusement. Un composant partagé (ex. Clickable avec un champ Anchor non rempli) écrit `wu-anchor=""` sur chaque lien, ce qui générait un warning « valeur vide » par lien à chaque chargement, répété à chaque appel de `WU.anchor.init()` (34 warnings par appel sur l'accueil Intervista). Au passage, les liens `mailto:` / `tel:` / href invalide sont marqués `wu-anchor-applied` après leur warning, pour ne plus être re-signalés à chaque `init()`.
- **v1.0.0** (tag `anchor-1.0.0`) — Version initiale : ajout d'une ancre à un lien Page Webflow via `wu-anchor`, conservation des query strings, remplacement d'une ancre existante, lien vide / `#` → page courante, origine conservée pour les liens externes, `mailto:` / `tel:` / `javascript:` ignorés, idempotence via `wu-anchor-applied`, expose `init()` sur `window.WU.anchor`.
