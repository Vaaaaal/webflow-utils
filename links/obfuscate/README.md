# links/obfuscate

Contrôle le maillage interne/externe pour le SEO en masquant des liens aux
moteurs de recherche, tout en les gardant fonctionnels pour les visiteurs.
La destination réelle n'est **jamais présente dans le HTML publié** : elle est
encodée en Base64 dans l'attribut `wu-obfuscate` et décodée uniquement au runtime.
Comme aucun `href` n'existe dans le source, Googlebot ne voit aucun lien à suivre.

## Cas d'usage

- **Contrôle du maillage (SEO)** — préserver le *link equity* et économiser le
  *crawl budget* en empêchant les moteurs de suivre certains liens : pages
  légales, liens de tri/filtres, liens affiliés ou externes qu'on ne veut pas
  endosser. Sans `href` dans le HTML, ces liens sont invisibles au crawl.
- **Anti-spam email / téléphone** — publier un `mailto:` ou `tel:` cliquable sans
  exposer l'adresse aux harvesters, qui ne lisent que le HTML statique.

## Attributs

| Attribut | Requis | Valeur | Description |
|---|---|---|---|
| `wu-obfuscate` | ✅ | chaîne Base64 | Destination encodée (URL, email ou numéro selon le type). |
| `wu-obfuscate-type` | | `url` \| `email` \| `tel` | Type de lien. Défaut : `url`. |
| `wu-obfuscate-blank` | | *(présence)* | Ouvre dans un nouvel onglet (`_blank` + `noopener noreferrer`). |
| `wu-obfuscate-rebuild` | | *(présence)* | Reconstruit un vrai `<a href>` natif après décodage (clic milieu, Ctrl+clic, menu contextuel). L'URL n'apparaît en DOM qu'après le JS. |

## Encoder la valeur

Le module attend du **Base64 UTF-8**. Génère-le une fois puis colle le résultat.

**Helper intégré** (une fois le script chargé, dans la console du navigateur) :
```js
WU.obfuscate.encode('https://exemple.com/page-privee')
// => "aHR0cHM6Ly9leGVtcGxlLmNvbS9wYWdlLXByaXZlZQ=="

WU.obfuscate.encode('contact@exemple.com')
// => "Y29udGFjdEBleGVtcGxlLmNvbQ=="
```

**Sans le script** (console ou Node, encodage manuel) :
```js
btoa(unescape(encodeURIComponent('contact@exemple.com')))
```

## Utilisation

### Lien classique
```html
<span wu-obfuscate="aHR0cHM6Ly9leGVtcGxlLmNvbS9wYWdl">Voir la page</span>
```

### Email (mailto)
```html
<span wu-obfuscate="Y29udGFjdEBleGVtcGxlLmNvbQ==" wu-obfuscate-type="email">
  Nous écrire
</span>
```

### Téléphone (tel)
```html
<span wu-obfuscate="KzMzNjEyMzQ1Njc4" wu-obfuscate-type="tel">Appeler</span>
```

### Nouvel onglet + lien natif reconstruit
```html
<div wu-obfuscate="aHR0cHM6Ly9leGVtcGxlLmNvbQ=="
     wu-obfuscate-blank
     wu-obfuscate-rebuild>
  Site partenaire
</div>
```

## Comportement

- **Mode par défaut** : l'élément reçoit `role="link"`, `tabindex="0"`, un curseur
  pointer, et se pilote au clavier (Enter / Espace). La navigation se fait en JS ;
  aucun `href` n'existe jamais dans le DOM.
- **Mode `rebuild`** : un vrai `<a href>` est injecté après décodage pour un
  comportement 100 % natif. L'URL reste absente du source statique.
- **Idempotent** : `wu-obfuscate-applied` évite tout double traitement.
- **Contenu dynamique** : appeler `window.WU.obfuscate.init()` après injection
  (CMS Load, modals, AJAX, tabs lazy…).

## Intégration Webflow

Colle le script avant `</body>` (Project Settings → Custom Code, ou via jsDelivr) :
```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils/links/obfuscate/obfuscate.js"></script>
```

## Limites

- Protège contre les harvesters basiques (source-only), pas contre un humain ou
  un bot qui exécute le JS. C'est un filtre anti-spam, pas du chiffrement.
- Sans JS, le lien n'est pas fonctionnel (choix assumé du procédé).
