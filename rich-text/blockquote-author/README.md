# rich-text/blockquote-author

Transforme les `<blockquote>` d'un Rich Text Webflow contenant un **séparateur textuel** (par défaut `///`) en structure sémantique `<figure><blockquote>…</blockquote><figcaption>Auteur</figcaption></figure>`. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : afficher proprement des citations clients avec leur auteur dans des articles de blog ou des landing pages, permettre à un rédacteur de saisir une citation + son auteur directement depuis le Rich Text natif Webflow (sans composant custom ni CMS dédié), produire un HTML sémantique correct pour le SEO et l'accessibilité (la combinaison `<figure>` + `<blockquote>` + `<figcaption>` est la structure recommandée par MDN pour citer un auteur).

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/rich-text/blockquote-author/blockquote-author.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`blockquote-author.js`](./blockquote-author.js) entre des balises `<script>…</script>`.

---

## 🧠 Concepts

- **Scope** : un élément (typiquement le wrapper d'un Rich Text, ou n'importe quel ancêtre) qui porte l'attribut `wu-blockquote-author`. Le script ne traite que les blockquotes situés à l'intérieur d'un scope — les autres blockquotes du site sont ignorés.
- **Séparateur** : une chaîne placée dans le texte de la citation, qui sépare le contenu cité (à gauche) de l'auteur (à droite). Par défaut : `///`. Les espaces autour du séparateur sont absorbés automatiquement.
- **Figure / figcaption** : structure HTML sémantique générée à partir du blockquote. Le `<blockquote>` est wrappé dans un `<figure>`, et l'auteur extrait est injecté dans un `<figcaption>` frère.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-blockquote-author` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur le scope (Rich Text ou ancêtre)

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-blockquote-author` | présent (valeur ignorée) | ✅ | — |
| `wu-blockquote-author-separator` | string libre (ex. `--`, `—`, `>>`) | ❌ | `///` |

### Dans le Rich Text (côté éditeur)

Aucun attribut à poser. Le rédacteur tape simplement le séparateur entre la citation et l'auteur dans son `<blockquote>` :

```
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. /// Lucía Ferrer, Operations Director at Meliã
```

### Attribut posé automatiquement par le script

| Attribut | Description |
|---|---|
| `wu-blockquote-author-applied` | Posé sur chaque `<figure>` généré (valeur vide). Sert à l'idempotence : un blockquote déjà encapsulé n'est pas retraité. |

---

## 🛠️ Mise en place dans Webflow

### 1. Activer le module sur le Rich Text

Sélectionner le **Rich Text Element** (ou un wrapper parent) → **Settings (D)** → **Custom Attributes** :

- Name : `wu-blockquote-author`
- Value : *(laisser vide)*

### 2. Styler `<figure>` et `<figcaption>` dans le CSS global

Webflow ne style pas nativement `<figure>` et `<figcaption>` à l'intérieur d'un Rich Text. Ajouter dans **Project Settings → Custom Code → Head Code** (ou dans un fichier CSS hébergé) :

```css
.w-richtext figure {
  margin: 2rem 0;
}

.w-richtext figure blockquote {
  margin-bottom: 0.5rem;
}

.w-richtext figure figcaption {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.w-richtext figure figcaption::before {
  content: "— ";
}
```

À adapter selon ton design system.

### 3. Saisir la citation dans le Rich Text

Dans l'éditeur Webflow, créer un blockquote (raccourci `"` ou toolbar) et taper le texte de la citation, suivi de `///` puis du nom de l'auteur :

```
Lorem ipsum dolor sit amet. /// John Doe, CEO at Acme
```

### 4. Documenter la convention pour les rédacteurs

Fournir un mémo aux personnes qui éditent le contenu :

> Dans une citation (blockquote), tape `///` puis le nom de l'auteur à la fin. Exemple :
> *"Cette solution a transformé notre business. /// Marie Dupont, Directrice chez Acme"*

### 5. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Rich Text avec blockquote-author activé -->
<div class="w-richtext" wu-blockquote-author>

  <p>Texte d'introduction de l'article…</p>

  <!-- Sera transformé -->
  <blockquote>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. /// Lucía Ferrer, Operations Director at Meliã
  </blockquote>

  <p>Suite de l'article…</p>

  <!-- Pas de séparateur → reste tel quel -->
  <blockquote>
    Citation sans auteur, restera inchangée.
  </blockquote>

</div>
```

Résultat après exécution :

```html
<div class="w-richtext" wu-blockquote-author>
  <p>Texte d'introduction de l'article…</p>

  <figure wu-blockquote-author-applied>
    <blockquote>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </blockquote>
    <figcaption>Lucía Ferrer, Operations Director at Meliã</figcaption>
  </figure>

  <p>Suite de l'article…</p>

  <blockquote>
    Citation sans auteur, restera inchangée.
  </blockquote>
</div>
```

---

## 🎨 Séparateur personnalisé

Si `///` pose problème (par ex. contenu technique avec des chemins type `path/to///file`), on peut override le séparateur sur le scope :

```html
<div class="w-richtext" wu-blockquote-author wu-blockquote-author-separator="—">
  <blockquote>
    Citation avec un tiret cadratin comme séparateur. — John Doe
  </blockquote>
</div>
```

Contrairement à `list-variants`, le séparateur est une **chaîne brute** (pas une regex). Tous les caractères spéciaux sont échappés automatiquement, donc `--`, `—`, `>>`, `::`, etc. fonctionnent directement sans configuration.

---

## 🔄 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour du contenu injecté **après** (pagination Finsweet CMS Load, modal qui charge un Rich Text en AJAX, tab dont le contenu est lazy-loadé…), il faut relancer le script.

Le module expose `init()` sur `window.WU.blockquoteAuthor` pour ça :

```js
// Exemple avec Finsweet CMS Load
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsload',
  (listInstances) => {
    listInstances[0].on('renderitems', () => {
      window.WU.blockquoteAuthor.init();
    });
  },
]);

// Ou plus simplement, après n'importe quelle injection AJAX
fetch('/api/article').then(/* ... */).then(() => {
  document.querySelector('.modal-body').innerHTML = newHtml;
  window.WU.blockquoteAuthor.init();
});
```

Grâce à l'idempotence (attribut `wu-blockquote-author-applied` posé sur le `<figure>`), relancer `init()` n'a **aucun effet** sur les blockquotes déjà transformés. Seuls les nouveaux sont traités. C'est sans risque, tu peux l'appeler aussi souvent que nécessaire.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| Blockquote sans séparateur | Pas de transformation, reste tel quel |
| Séparateur trouvé | Wrapping dans `<figure>` + `<figcaption>`, séparateur retiré du texte |
| Séparateur en début (citation vide) | Skip — protège contre une saisie erronée |
| Séparateur en fin (auteur vide) | Skip — idem |
| Blockquote multi-paragraphes (`<blockquote><p>…</p><p>… /// Auteur</p></blockquote>`) | Le `<p>` contenant le séparateur est tronqué ou supprimé proprement, pas de `<p>` vide laissé dans le DOM |
| Citation avec formatage inline (`<em>`, `<strong>`, lien) | Le formatage est préservé dans la citation. L'auteur est extrait en texte brut |
| `init()` appelé plusieurs fois | Idempotent — les blockquotes déjà dans un `<figure wu-blockquote-author-applied>` sont ignorés |

---

## ⚠️ Limitations

- **Séparateur visible dans le Webflow Editor** : le rédacteur voit `///` dans l'éditeur, il est retiré seulement côté front. Bien documenter la convention pour éviter la confusion.
- **SEO / accessibilité du séparateur** : le séparateur reste présent dans le HTML servi (il est retiré au runtime par JS). Si un crawler n'exécute pas le JS, il verra `///` dans le texte de la citation. Impact mineur en pratique (Google exécute le JS), mais à connaître.
- **Auteur en texte brut** : si l'auteur contient du formatage (lien vers son LinkedIn, gras, etc.), le formatage est **perdu** lors de l'extraction dans le `<figcaption>`. Pour des cas avancés (lien vers l'auteur), passer par un composant CMS dédié plutôt que ce module.
- **Un seul auteur par blockquote** : le premier séparateur trouvé est utilisé. Si plusieurs `///` sont présents, tout ce qui suit le premier devient l'auteur.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le scope a-t-il bien l'attribut `wu-blockquote-author` ?
2. Le séparateur est-il bien `///` (ou ce que tu as défini via `wu-blockquote-author-separator`) ?
3. Y a-t-il du texte des deux côtés du séparateur ? Si l'un des deux est vide, le blockquote est volontairement ignoré.
4. Le `<blockquote>` est-il bien remplacé par un `<figure>` après chargement ? Si oui, le script s'exécute bien — le problème est CSS.
5. L'attribut `wu-blockquote-author-applied` est-il posé sur le `<figure>` ? Idem, confirmation que le script a tourné.
6. Contenu dynamique non traité ? Voir [Contenu injecté dynamiquement](#-contenu-injecté-dynamiquement-cms-load-modals-ajax) — il faut appeler `window.WU.blockquoteAuthor.init()` après l'injection.
7. Le site est-il publié ? Le custom code ne tourne pas en Preview.
8. Console (F12) : une erreur JavaScript ?

---

## 📄 Changelog

- **v1.0.0** — Version initiale : transformation `<blockquote>` → `<figure>` + `<figcaption>` via séparateur textuel, scope par attribut, séparateur custom, gestion robuste des blockquotes multi-paragraphes, préservation du formatage inline de la citation, idempotence, expose `init()` sur `window.WU.blockquoteAuthor` pour ré-init après injection dynamique.
