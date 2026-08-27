# cms/localize-date

Corrige l'affichage des dates Webflow — **toujours rendues en anglais** dans le Designer, et **non traduites par Webflow Localization** — en les reformatant selon la langue courante de la page, via `Intl.DateTimeFormat`. Tout est piloté par des **custom attributes** posés dans le Designer — aucune config JS à modifier.

> Cas d'usage typiques : blog CMS multilingue avec Webflow Localization (FR/EN/ES…), site mono-langue non-anglais où les dates CMS doivent apparaître dans la langue du site, date de publication, date d'événement, date de mise à jour affichée dans un Rich Text ou un champ dynamique.

---

## 📦 Installation

### Via jsDelivr (recommandé)

```html
<script src="https://cdn.jsdelivr.net/gh/Vaaaaal/webflow-utils@main/cms/localize-date/localize-date.js"></script>
```

À coller dans **Project Settings → Custom Code → Footer Code**, ou dans **Page Settings → Before `</body>` tag** si le module n'est utilisé que sur une page.

### Copier-coller

Copier le contenu de [`localize-date.js`](./localize-date.js) entre des balises `<script>…</script>`.

---

## 🧠 Concepts

- **Le problème** : les formats de date proposés dans le Designer (`January 1, 2024`, `1 Jan 2024`…) sont toujours en anglais, et Webflow Localization ne les traduit pas — le mois et le jour restent en anglais même sur une page localisée en FR, ES, DE, etc.
- **La solution** : au lieu d'afficher le champ Date CMS formaté nativement, on bind sa valeur **brute au format ISO** (`YYYY-MM-DD`) dans un custom attribute. Le script la parse et la reformate côté navigateur avec `Intl.DateTimeFormat`, qui sait localiser les noms de mois/jours dans n'importe quelle langue.
- **Résolution de la langue**, dans cet ordre :
  1. `wu-localize-date-locale` posé sur l'élément (override manuel) ;
  2. l'attribut `<html lang="…">` de la page — c'est celui que **Webflow Localization** met à jour automatiquement selon la langue visitée ;
  3. `navigator.language` (langue du navigateur du visiteur) ;
  4. `en` en dernier recours.

---

## 🏷️ Attributs

Tous les attributs sont préfixés par `wu-localize-date` pour éviter les collisions avec les autres modules `webflow-utils`.

| Attribut | Valeurs | Obligatoire | Défaut |
|---|---|---|---|
| `wu-localize-date` | date brute ISO (`YYYY-MM-DD` ou datetime ISO complet), bindée depuis le champ CMS | ✅ | — |
| `wu-localize-date-style` | `full` / `long` / `medium` / `short` | ❌ | `long` |
| `wu-localize-date-locale` | code langue/locale (ex. `fr`, `fr-FR`, `es-ES`) — force une langue indépendamment de `<html lang>` | ❌ | `<html lang>` |
| `wu-localize-date-applied` | posé automatiquement par le script après traitement (idempotence) — ne pas renseigner manuellement | — | — |

> 💡 L'attribut `wu-localize-date` porte **la date brute**, pas le texte affiché : le script réécrit le `textContent` de l'élément qui le porte.

---

## 🛠️ Mise en place dans Webflow

### 1. Exposer le champ CMS en ISO

Sur ton champ **Date** (dans le champ texte ou le binding), clique sur l'icône ⚙️ à côté du champ Date dans le panneau de droite et choisis le format **ISO 8601** (`YYYY-MM-DD`). C'est ce format qui doit être injecté dans l'attribut, pas un format "humain".

### 2. Poser l'attribut sur l'élément affichant la date

Sélectionner l'élément (Text Block, div…) → **Settings (D)** → **Custom Attributes** → **+** :

- Name : `wu-localize-date`
- Value : cliquer sur l'icône violette → **Get value from** → le champ Date, format ISO

### 3. (Optionnel) Choisir un style

- `wu-localize-date-style` = `medium` (par exemple, pour un format plus court)

### 4. (Optionnel) Forcer une locale précise

Utile uniquement si tu veux une langue différente de celle de la page (rare). Sinon, laisser vide : le script suit `<html lang>` posé par Webflow Localization.

### 5. Publier et tester

Le custom code ne s'exécute que sur le site **publié** (pas en Preview).

---

## 📝 Exemple HTML complet

```html
<!-- Champ Date CMS bindé en ISO -->
<div wu-localize-date="2025-03-15">March 15, 2025</div>

<!-- Avec un style plus court -->
<div wu-localize-date="2025-03-15" wu-localize-date-style="medium">March 15, 2025</div>

<!-- Locale forcée, indépendamment de la langue de la page -->
<div wu-localize-date="2025-03-15" wu-localize-date-locale="es-ES">March 15, 2025</div>
```

Le texte de départ (`March 15, 2025`) n'a pas d'importance : il est **remplacé** au chargement. Sur une page avec `<html lang="fr">` (posé par Webflow Localization), le premier exemple devient `15 mars 2025` ; sur `<html lang="en">`, il reste `March 15, 2025`.

---

## ⚙️ Comportement

Exemple pour la date du 15 mars 2025 selon le style et la locale :

| Style | `en-US` | `fr-FR` |
|---|---|---|
| `full` | Saturday, March 15, 2025 | samedi 15 mars 2025 |
| `long` | March 15, 2025 | 15 mars 2025 |
| `medium` | Mar 15, 2025 | 15 mars 2025 |
| `short` | 3/15/25 | 15/03/2025 |

| Situation | Résultat |
|---|---|
| Attribut `wu-localize-date` absent | Élément ignoré |
| Valeur non parsable (pas de format ISO) | Élément ignoré, texte d'origine conservé |
| `wu-localize-date-style` invalide ou absent | Repli sur `long` |
| Locale invalide (typo, code inexistant) | Repli sur `en` |
| Élément déjà traité (`wu-localize-date-applied` présent) | Pas de retraitement |

---

## 🔁 Contenu injecté dynamiquement (CMS Load, modals, AJAX)

Le script tourne à `DOMContentLoaded` et traite tout ce qui est présent dans le DOM à ce moment-là. Pour du contenu injecté après coup :

```js
window.WU.localizeDate.init();
```

✅ Contrairement à `combine`, ce module **est idempotent** : les éléments déjà formatés sont ignorés grâce à `wu-localize-date-applied`, donc rappeler `init()` plusieurs fois (ou après chaque injection CMS Load / Finsweet) est sans risque.

---

## ⚠️ Limitations

- **Ne gère que la date**, pas l'heure (pas de `timeStyle`). À étendre si besoin d'afficher aussi l'heure localisée.
- **Nécessite un champ CMS exposé en ISO 8601** (`YYYY-MM-DD`). Un format Webflow "humain" (`March 15, 2025`) dans l'attribut ne sera pas parsé.
- **Dépend de `<html lang>`** pour suivre automatiquement la langue de la page : nécessite Webflow Localization correctement configuré (locale primaire + sous-domaines/sous-dossiers de langue). Sur un site mono-langue sans Localization, poser `wu-localize-date-locale` en dur ou accepter le repli sur `navigator.language` (moins fiable : dépend du navigateur du visiteur, pas du contenu de la page).
- **Compatibilité navigateur** : `Intl.DateTimeFormat` avec `dateStyle` nécessite un navigateur relativement récent (Chrome 91+, Firefox 90+, Safari 14.1+, Edge 91+) — couvre la quasi-totalité du trafic actuel.
- **Validation HTML W3C** : les attributs préfixés `wu-` sont signalés comme invalides par le validator, sans impact réel sur les navigateurs, le SEO ou l'accessibilité — même principe que les autres modules du repo.

---

## 🐛 Debug

1. L'élément a-t-il bien `wu-localize-date="…"` avec une valeur au format ISO (`YYYY-MM-DD`) ?
2. Le champ CMS est-il bien exposé en ISO via l'icône ⚙️ dans le Designer (et pas en format "humain") ?
3. `<html lang="…">` est-il bien posé sur la page (vérifier dans l'inspecteur) ? Sinon, le script retombe sur `navigator.language` ou `en`.
4. Le site est-il publié ? Le custom code ne tourne pas en Preview.
5. Console (F12) : une erreur JavaScript ?
6. L'élément a-t-il déjà `wu-localize-date-applied` ? Si oui et que le résultat est incorrect, vérifier la valeur (`locale:style`) pour diagnostiquer une locale ou un style mal résolu.

---

## 📄 Changelog

- **v1.0.0** — Version initiale : formatage de date localisé via `Intl.DateTimeFormat`, résolution de locale (`wu-localize-date-locale` > `<html lang>` > `navigator.language` > `en`), styles `full`/`long`/`medium`/`short`, idempotence via `wu-localize-date-applied`.
