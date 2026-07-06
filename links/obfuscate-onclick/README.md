# links/obfuscate-onclick

Version simplifiée de l'obfuscation de liens pour le **contrôle de maillage SEO**.
Empêche la transmission de jus SEO vers certaines URLs (pages contact, demande de
démo…) en évitant qu'elles soient des `<a href>` crawlables.

L'URL est stockée **en clair** dans l'attribut `wu-obfuscate-onclick`, et la
navigation est câblée en JS au clic — la technique classique du `<button onclick>`,
mais posable sur **n'importe quel élément** (div, span, button, li…).

## Différence avec `links/obfuscate`

| | `obfuscate-onclick` (ce module) | `obfuscate` |
|---|---|---|
| URL dans le HTML | en clair | encodée en Base64 |
| Force d'obfuscation | standard (technique reconnue) | renforcée (URL absente du source) |
| Encodage préalable | aucun | Base64 requis |
| Cas d'usage | consigne SEO "technique onclick" | maillage renforcé + anti-spam email/tél |

Choisir ce module quand un audit SEO demande explicitement la technique `onclick`
ou que l'URL doit rester lisible dans le source (tracking, audits tiers).

## Attributs

| Attribut | Requis | Valeur | Description |
|---|---|---|---|
| `wu-obfuscate-onclick` | ✅ | URL en clair | Destination vers laquelle naviguer au clic. |
| `wu-obfuscate-onclick-blank` | | *(présence)* | Ouvre dans un nouvel onglet (`noopener noreferrer`). |

## Utilisation

Sur n'importe quel élément :

```html
<div wu-obfuscate-onclick="https://www.exemple.com/es/solicita-demo/">
  Book a demo
</div>
```

Nouvel onglet :

```html
<span wu-obfuscate-onclick="https://www.exemple.com/contact"
      wu-obfuscate-onclick-blank>
  Nous contacter
</span>
```

## Comportement

- **N'importe quel élément** : `role="link"`, `tabindex="0"` et curseur pointer
  sont ajoutés automatiquement si l'élément n'est pas déjà un `<a>` ou `<button>`.
- **Clavier** : Enter / Espace déclenchent la navigation.
- **Idempotent** : `wu-obfuscate-onclick-applied` évite tout double traitement.
- **Contenu dynamique** : appeler `window.WU.obfuscateOnclick.init()` après
  injection (CMS Load, modals, AJAX, tabs lazy…).

## Intégration Webflow

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/links/obfuscate-onclick/obfuscate-onclick.js"></script>
```

⚠️ **Ne pas partir d'un Link Block Webflow** : son `href` natif contournerait
l'obfuscation. Utiliser un Div Block (ou tout élément non-lien) stylé en bouton,
puis y poser l'attribut `wu-obfuscate-onclick`.

## Limites

- L'URL est en clair dans le HTML : Google ne la suit pas comme un lien (pas de
  `<a href>`), mais elle reste lisible dans le source. Pour une obfuscation plus
  forte (URL absente du source), utiliser `links/obfuscate`.
- Sans JS, l'élément n'est pas cliquable (choix assumé du procédé).
