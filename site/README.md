# The website

The static site published at [mangiapanejohn-dev.github.io/mira-voss](https://mangiapanejohn-dev.github.io/mira-voss/). It contains no runtime code.

| Page | What it is |
| :-- | :-- |
| `index.html` | Home: Mira, the newest story, and the way into everything else |
| `mira.html` | The character: biography, her life so far, her people, her art |
| `stories.html` | The library, built from [`lore/catalog.json`](../lore/catalog.json) |
| `read.html` | The reader: `read.html?work=<id>&chapter=<id>`, remembers where you stopped |
| `world.html` | A reader's chart of Rovelle, the three bells, MØBIUS Station, canon |
| `agent.html` | The terminal agent: abilities, first launch, FAQ |
| `story.html` | Redirects old reader links to `read.html` |

Shared styles are in `base.css` (tokens, page moods, top bar, buttons, the tide transition, halftone and atmosphere layers) and `pages.css`; the reader adds `reader.css` and `reader.js`; `site.js` switches features on from markup.

## Stories

`data/library.js`, `data/text/*.js`, the work list in `stories.html` and the newest-story section of `index.html` are generated. After changing anything under `lore/`, run from the repository root:

```bash
node scripts/build-stories.mjs
```

The Pages workflow runs the same build before it deploys. To add a story, put its Markdown in `lore/zh/`, add an entry to `lore/catalog.json`, and run the build.

## Preview

```bash
python3 -m http.server 8080 --directory site
```

Then open `http://localhost:8080/`.

## Art in `assets/`

- `mira-rovell-splash-v2.*`, `art/*.webp`: the approved harbor splash and crops of it.
- `mira-logo-cutout.webp`, `favicon.png`: the original logo with only its outer paper removed ([source](../media/identity/mira-logo-cutout.png)).
- `bg/*.webp`: blurred, graded pieces of the splash used as section atmospheres.
- `art/rovelle-chart.svg`, `art/mobius-loop.svg`, `chart-lines.svg`: drawn for the site.
