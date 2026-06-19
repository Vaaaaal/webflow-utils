# ai/ask-ai — snippets

Prompts prêts à l'emploi pour le module [`ask-ai`](../README.md). Chaque fichier `.txt` contient un prompt en texte brut, à copier dans un **bloc de texte caché** Webflow portant l'attribut `wu-ask-ai-template="nom"`.

Les fichiers sont en texte brut (pas de Markdown) pour que la mise en forme soit collée telle quelle, sans transformation.

## Langues

- [`en/`](./en) — prompts en anglais
- [`fr/`](./fr) — prompts en français

> La langue du fichier est celle des **instructions** du prompt. Le placeholder `{lang}` reste indépendant : il fait répondre l'IA dans la langue de la page (`<html lang>`), quelle que soit la langue des instructions.

## Prompts disponibles

| Fichier (en / fr) | Usage |
|---|---|
| `summarize-article` / `resume-article` | Résumé d'un article de blog + points clés |
| `seo-geo` / `seo-geo` | Audit SEO/GEO : titre, meta, plan Hn, pistes de citation IA |
| `product-page` / `page-produit` | Analyse d'une page produit/service (bénéfices, cible, différenciation) |
| `explain-simply` / `explication-simple` | Vulgarisation du contenu pour un néophyte |
| `key-points` / `points-cles` | Extraction ultra-courte (5 puces max) |
| `qa-aeo` / `qa-aeo` | Génération d'une FAQ optimisée AEO à partir de la page |
| `about-company` / `a-propos-entreprise` | Présentation de l'entreprise/marque (« qui est ce client, que fait-il ») |

## Placeholders

Tous les prompts utilisent les placeholders du module, remplacés au runtime :
`{url}`, `{title}`, `{site}`, `{lang}`. Voir le [README du module](../README.md#-placeholders-disponibles).

## Utilisation rapide

1. Copier le contenu d'un `.txt`.
2. Le coller dans un bloc de texte Webflow caché (`display:none`).
3. Poser l'attribut `wu-ask-ai-template="article"` (nom au choix) sur ce bloc.
4. Poser `wu-ask-ai-use="article"` sur chaque lien d'IA.

> 💡 Adapte librement les prompts à ton client / contexte. Ce sont des points de départ, pas des versions figées.
