# links/

Modules de manipulation de liens : obfuscation, contrôle du maillage, ancres.

| Module | Description | Doc |
|---|---|---|
| [`links/obfuscate`](./obfuscate) | Obfusque des liens (URL, email, tél.) en gardant la destination hors du HTML (Base64, décodage au runtime) : contrôle du maillage SEO renforcé + protection anti-spam. | [README](./obfuscate/README.md) |
| [`links/obfuscate-onclick`](./obfuscate-onclick) | Obfuscation SEO simplifiée (technique onclick, URL en clair) posable sur n'importe quel élément — empêche la transmission de jus vers les pages ciblées. | [README](./obfuscate-onclick/README.md) |
| [`links/anchor`](./anchor) | Ajoute une ancre (`#id`) à un lien de page Webflow via `wu-anchor`, pour viser une section d'une autre page tout en gardant un lien Page natif. | [README](./anchor/README.md) |
