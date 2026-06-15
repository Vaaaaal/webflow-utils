# rich-text/list-variants

Transforme les listes (`<ul>`/`<ol>`) d'un Rich Text Webflow en **variantes stylées** (checkmarks, flèches, étoiles, etc.) via un **marqueur textuel** placé au début du premier `<li>`. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : afficher une liste à checkmarks dans une section "features" sans sortir du Rich Text, faire cohabiter plusieurs styles de listes dans un même article CMS (puces classiques + checkmarks + flèches), permettre à un rédacteur de choisir le style d'une liste sans passer par un développeur.

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/rich-text/list-variants/list-variants.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body> tag`** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`list-variants.js`](./list-variants.js) entre des balises `<script>…</script>`.

---

## 🧠 Concepts

- **Scope** : un élément (typiquement le wrapper d'un Rich Text, ou n'importe quel ancêtre) qui porte l'attribut `wu-list-variants`. Le script ne traite que les listes situées à l'intérieur d'un scope — les autres listes du site gardent leur style natif.
- **Marqueur** : une chaîne placée au tout début du **premier `<li>`** d'une liste, qui indique la variante voulue. Par défaut : `// nom-variante` (ex. `// check`, `// arrow`). Le marqueur est **retiré du texte affiché** au runtime.
- **Variante** : le nom capturé par le marqueur. Le script ajoute la classe CSS `is-{variant}` sur le `<ul>`/`<ol>` parent — c'est cette classe que tu stylises dans ton CSS global.

---

## 🏷️ Attributs

Tous les attributs du module sont préfixés par `wu-list-variants` pour éviter les collisions avec les autres modules `webflow-utils` ou avec les `data-*` natifs de Webflow.

### Sur le scope (Rich Text ou ancêtre)

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-list-variants` | présent (valeur ignorée) | ✅ | — |
| `wu-list-variants-marker` | regex personnalisée avec **un groupe de capture** (ex. `^@@\s*(\S+)\s*`) | ❌ | `^\/\/\s*(\S+)\s*` |

### Dans le Rich Text (côté éditeur)

Aucun attribut à poser. Le rédacteur tape simplement le marqueur au début du **premier item** de la liste qu'il veut transformer :

```
// check  Premier item
Deuxième item
Troisième item
```

Les items suivants n'ont pas besoin de marqueur — c'est toute la liste qui change de style.

### Attribut posé automatiquement par le script

| Attribut | Description |
|---|---|
| `wu-list-variants-applied` | Posé sur chaque `<ul>`/`<ol>` traité (valeur = nom de la variante). Sert à l'idempotence : une liste déjà transformée n'est pas retraitée. |

---

## 🛠️ Mise en place dans Webflow

### 1. Activer le module sur le Rich Text

Sélectionner le **Rich Text Element** (ou un wrapper parent) → **Settings (D)** → **Custom Attributes** :

- Name : `wu-list-variants`
- Value : *(laisser vide)*

### 2. Styler les variantes dans le CSS global

Ajouter dans **Project Settings → Custom Code → Head Code** (ou dans un fichier CSS hébergé) :

```css
/* Les listes sans variante gardent leur style natif Webflow */

/* Variante : checkmark jaune */
.w-richtext ul.is-check {
  list-style: none;
  padding-left: 0;
}

.w-richtext ul.is-check li {
  position: relative;
  padding-left: 2.5rem;
  margin-bottom: 1rem;
}

.w-richtext ul.is-check li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.3em;
  width: 1.5rem;
  height: 1.5rem;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='12' fill='%23F5C518'/><path d='M7 12l3.5 3.5L17 9' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-size: contain;
}

/* Ajoute autant de variantes que nécessaire : .is-arrow, .is-star, .is-dot… */
```

### 3. Documenter la convention pour les rédacteurs

Fournir un mémo aux personnes qui éditent le contenu :

| Marqueur     | Style                |
|--------------|----------------------|
| `// check`   | Checkmark jaune      |
| `// arrow`   | Flèche vers la droite |
| `// star`    | Étoile               |

### 4. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Rich Text avec list-variants activé -->
<div class="w-richtext" wu-list-variants>

  <!-- Liste classique : pas de marqueur → style natif -->
  <ul>
    <li>Un item normal</li>
    <li>Un autre item normal</li>
  </ul>

  <p>Texte intermédiaire…</p>

  <!-- Liste avec marqueur → devient .is-check -->
  <ul>
    <li>// check Fill out the form, and one of our experts will contact you</li>
    <li>All the information you need to start using CoverManager</li>
    <li>Live demonstration of the solution that best fits your business</li>
  </ul>

</div>
```

Résultat après exécution :
- La première `<ul>` garde ses puces natives.
- La seconde `<ul>` reçoit la classe `is-check` et le marqueur `// check` est retiré du texte.

---

## 🎨 Marqueur personnalisé

Si `//` pose problème (par ex. contenu technique avec des commentaires JS), on peut override la regex sur le scope :

```html
<div class="w-richtext" wu-list-variants wu-list-variants-marker="^@@\s*(\S+)\s*">
  <ul>
    <li>@@ check Premier item avec marqueur custom</li>
    <li>Deuxième item</li>
  </ul>
</div>
```

La regex **doit** contenir exactement **un groupe de capture** : le nom de la variante. Si le pattern est invalide, le script retombe silencieusement sur la regex par défaut.

---

## ⚙️ Comportement

| Situation | Résultat |
|---|---|
| Liste sans marqueur sur le premier item | Pas de transformation, style natif conservé |
| Marqueur reconnu | `is-{variant}` ajouté sur le `<ul>`/`<ol>`, marqueur retiré du texte |
| Marqueur dans une liste imbriquée | Traité aussi (toutes les `<ul>`/`<ol>` du scope sont scannées) |
| Marqueur sur du texte formaté (`**// check**`) | Le marqueur est retiré proprement, le formatage du reste du texte est préservé |
| Script appelé deux fois sur la même page | Idempotent — les listes déjà traitées (`wu-list-variants-applied` présent) sont ignorées |
| Pattern regex invalide | Fallback silencieux sur la regex par défaut |

---

## ⚠️ Limitations

- **Contenu CMS dynamique (pagination, modals, AJAX)** : le script tourne à `DOMContentLoaded`. Pour du contenu injecté après coup, il faudra exposer une fonction `init()` au global (non fourni par défaut pour rester aligné sur les autres modules `webflow-utils`).
- **Marqueur visible dans le Webflow Editor** : le rédacteur voit `// check` dans l'éditeur, il est retiré seulement côté front. Bien documenter la convention pour éviter la confusion.
- **SEO / accessibilité du marqueur** : le marqueur reste présent dans le HTML servi (il est retiré au runtime par JS). Si un crawler n'exécute pas le JS, il verra `// check` dans le texte. Impact mineur en pratique (Google exécute le JS), mais à connaître.
- **Le premier item ne doit pas commencer par du contenu non-textuel** (image, embed) avant le marqueur — le marqueur doit être dans le tout premier nœud texte de la liste.
- **Validation HTML W3C** : les attributs préfixés `wu-` (sans `data-`) sont signalés comme invalides par le validator W3C. Aucun impact réel sur les navigateurs, le SEO, le rendu ou l'accessibilité — c'est la même approche que Finsweet, Alpine.js, HTMX et Vue.

---

## 🐛 Debug

1. Le scope a-t-il bien l'attribut `wu-list-variants` ?
2. Le marqueur est-il bien au tout début du premier `<li>` (pas d'espace ou de caractère invisible avant) ?
3. Le nom de la variante est-il correct (sensible à la casse) ? `// check` donne `.is-check`, pas `.is-Check`.
4. La règle CSS `.w-richtext ul.is-check` est-elle bien chargée ? Inspecter dans la console.
5. Le `<ul>` reçoit-il bien la classe `is-check` après chargement ? Si oui, le script s'exécute bien — le problème est CSS.
6. L'attribut `wu-list-variants-applied="check"` est-il posé sur le `<ul>` ? Idem, confirmation que le script a tourné.
7. Le site est-il publié ? Le custom code ne tourne pas en Preview.
8. Console (F12) : une erreur JavaScript ?

---

## 📄 Changelog

- **v1.0.0** — Version initiale : transformation par marqueur, scope par attribut, marqueur custom via regex, stripping robuste sur formatage inline, idempotence.
