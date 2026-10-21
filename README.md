<p align="center">
  <a href="https://mangiapanejohn-dev.github.io/mira-voss/"><img src="media/github/banner.jpg" alt="Mira Voss, the Cartographer of Rovelle: a girl with a short black-and-white bob at a harbor railing in a storm" width="100%" /></a>
</p>

<p align="center">
  <b>English</b>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="#install"><b>Install</b></a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#sign-in"><b>Sign in</b></a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#working-with-mira"><b>Use</b></a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="#the-stories"><b>Stories</b></a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://mangiapanejohn-dev.github.io/mira-voss/"><b>Website</b></a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="https://www.npmjs.com/package/mira-voss"><b>npm</b></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mira-voss"><img alt="npm version" src="https://img.shields.io/npm/v/mira-voss?style=flat-square&label=npm&color=c8aa6e&labelColor=0a1428" /></a>
  <img alt="macOS on Apple silicon" src="https://img.shields.io/badge/macOS-Apple%20silicon-c8aa6e?style=flat-square&labelColor=0a1428" />
  <img alt="Node.js 22 or newer" src="https://img.shields.io/badge/node-22%2B-c8aa6e?style=flat-square&labelColor=0a1428" />
  <img alt="Proprietary" src="https://img.shields.io/badge/licence-proprietary-a09b8c?style=flat-square&labelColor=0a1428" />
</p>

<br />

<p align="center"><b>An agent at your terminal.</b> She reads your project, edits files, runs commands and reports back, in the folder you start her in, and asks before she changes anything unless you tell her otherwise. She is also a seventeen-year-old cartographer from a harbor city, and her stories are here.</p>

<p align="center">
  <a href="https://github.com/mangiapanejohn-dev/mira-voss/stargazers"><img alt="Star Mira Voss on GitHub" src="https://img.shields.io/github/stars/mangiapanejohn-dev/mira-voss?style=for-the-badge&logo=github&label=Star%20Mira&labelColor=1e2328&color=785a28" /></a>
  <br />
  <sub>If she is useful to you, or her story is, a star helps the next person find her.</sub>
</p>

<br />

<p align="center">
  <img src="media/github/cli-first-run.png" alt="Mira Voss 1.0.0 in a terminal on first launch: a sign-in list of plans (Claude, ChatGPT) and API keys (Anthropic, OpenAI, Google Gemini, OpenRouter, DeepSeek, Kimi, GLM, Qwen, MiniMax, Doubao and more), with the input line below in default mode" width="820" />
  <br />
  <sub>First launch, as version 1.0.0 draws it.</sub>
</p>

<br />

<a href="https://mangiapanejohn-dev.github.io/mira-voss/agent.html"><img src="media/github/agent.jpg" alt="The Agent" width="100%" /></a>

<a id="install"></a>

## Install

```bash
npm install -g mira-voss
```

Then, in the folder you want to work in:

```bash
mira
```

`mobius` starts her too. You need:

- **macOS on Apple silicon.** Version 1.0.0 is built for this system only; on others the package installs but says it is not made for that system yet.
- **Node.js 22 or newer**, with npm.
- **A model to work through**: a Claude or ChatGPT plan you already pay for, or an API key. See [Sign in](#sign-in).

<details>
<summary><b>Update, check or remove</b></summary>

```bash
npm install -g mira-voss@latest    # update
mira -v                            # the installed version
mira doctor                        # what a turn needs, each checked
npm uninstall -g mira-voss         # remove
```

If `mira` is not found after installing, npm's global folder is not on your `PATH`. Everything Mira keeps, your accounts, sessions and history, is under `~/.mobius`.

</details>

<a id="sign-in"></a>

## Sign in

The first time, she asks how to reach a model. You can be signed in to several accounts at once and move between them with `/model`; `mira logout` or `/logout` signs one out.

| Plan or key | How you sign in | |
| :-- | :-- | :-- |
| **Claude plan** <br /><sub>Pro · Max</sub> | Claude Code's own sign-in | Claude Code must be installed and on your `PATH`. Her turns on this plan run through it, under your account; Mira never sees or keeps the sign-in. |
| **ChatGPT plan** <br /><sub>Plus · Pro · Business</sub> | In your browser, through the MØBIUS kernel | The kernel comes with her on macOS on Apple silicon. |
| **API key** | Paste it when asked | Anthropic, OpenAI, Google Gemini, OpenRouter; DeepSeek, Kimi, GLM, Qwen, MiniMax and Doubao on their China addresses; xAI, Mistral, Groq, or any OpenAI-compatible address. A key is kept in `~/.mobius`, readable only by you. |

<a id="working-with-mira"></a>

## Working with Mira

**Modes.** `shift+tab` moves between them.

| Mode | What she does without asking |
| :-- | :-- |
| `default` | Nothing. She asks before each change. |
| `accept-edits` | Edits to files. |
| `full` | Everything except what reaches outside this machine. |
| `plan` | She changes nothing, and plans. |

**When she asks.** A request comes as a card: `ctrl+y` yes, `ctrl+n` no, or say why not. `/god_damn` allows everything she asks for the rest of the session you have open, after a card that says what that means; anything your settings deny is still refused.

**Keys.**

| Key | |
| :-- | :-- |
| `⏎` | Send |
| `shift+⏎`, `ctrl+j` | A new line |
| `↑`, `ctrl+r` | What you said before |
| `@` | Name a file of the project |
| `!` at the start of a line | Run the line in your own shell |
| `ctrl+g` | Write in your editor |
| `esc` `esc`, `/rewind` | Back to before a turn: the code, the conversation, or both |
| `/model` | Choose the model and how hard it reasons |
| `?`, `/` | Every key, every command |

`/vim` turns on vim's keys and `/theme` changes the colours.

**Without the interface.** One turn, printed, for scripts and pipelines:

```bash
mira -p "explain what this repository does"
mira -p "fix the failing test" --yes --output-format json
```

Output is `text`, `json` or `stream-json`. Anything she would ask is refused, with exit code 2, unless you pass `--yes`. `-c` continues the folder's newest session.

**Settings.**

| File | |
| :-- | :-- |
| `MOBIUS.md` at a project's root | What the project asks of her. Where there is none, she reads `AGENTS.md`. |
| `~/.mobius/MOBIUS.md` | What you ask of her everywhere. |
| `~/.mobius/settings.json`, `.mobius/settings.json` | `permissions` (`allow`, `ask`, `deny`), the `sandbox`, your `mcpServers` and `hooks`. |

**When something is wrong.** `mira doctor` checks what a turn here needs: the model and its key or plan, Claude Code for the Claude plan, the kernel, the sandbox, your settings, and whether a newer Mira Voss is out. She looks on npm at most once a day and says so quietly; `MIRA_NO_UPDATE_NOTICE=1` turns that off. Report a problem through the [issue templates](https://github.com/mangiapanejohn-dev/mira-voss/issues/new/choose), with keys and private paths removed.

<br />

<a id="the-stories"></a>

<a href="https://mangiapanejohn-dev.github.io/mira-voss/stories.html"><img src="media/github/stories.jpg" alt="The Stories" width="100%" /></a>

<table>
  <tr>
    <td width="200"><a href="https://mangiapanejohn-dev.github.io/mira-voss/read.html?work=unfinished-chart"><img src="site/assets/art/cover-rovelle.webp" alt="The Grey Sea breaking on Rovelle's harbor wall at dusk" width="190" /></a></td>
    <td><b>Rovelle: The Unfinished Chart</b><br /><sub>BOOK ONE · PROLOGUE + 7 CHAPTERS · v3.0</sub><br /><br />A winter current is coming, and the city wants to use Mira's tidal chart beyond the conditions it was tested in. To correct the record she has to make its limits public, and let other people into a decision that cannot be hers alone.<br /><br /><a href="https://mangiapanejohn-dev.github.io/mira-voss/read.html?work=unfinished-chart">Read online</a> · <a href="lore/en/README.md">English text</a> · <a href="lore/zh/README.md">Chinese original</a> · <a href="lore/en/character-profile.md">Character profile</a></td>
  </tr>
  <tr>
    <td width="200"><a href="https://mangiapanejohn-dev.github.io/mira-voss/read.html?work=only-one-side"><img src="media/github/cover-mobius.jpg" alt="A paper tape loop with a half twist, drawn in gold over a cold northern sky" width="190" /></a></td>
    <td><b>MØBIUS: Only One Side</b><br /><sub>SHORT STORY · 4 PARTS · v1.0 · NEW</sub><br /><br />Three days north of Ailan, a station without a name keeps its deep-water record on a paper loop twisted half a turn. For nineteen winters, part of the sea in it was written off as ink bleeding through the paper.<br /><br /><a href="https://mangiapanejohn-dev.github.io/mira-voss/read.html?work=only-one-side">Read online</a> · <a href="lore/en/only-one-side/README.md">English text</a> · <a href="lore/zh/only-one-side/README.md">Chinese original</a></td>
  </tr>
</table>

The stories are written in Chinese and translated into English; the website reads both, chapter by chapter, and remembers where you stopped.

<p align="center"><i>Some places can only be charted after someone arrives.</i><br /><sub>— <i>The Unfinished Chart</i>, Chapter VII</sub></p>

<br />

<a href="https://mangiapanejohn-dev.github.io/mira-voss/world.html"><img src="media/github/world.jpg" alt="The World" width="100%" /></a>

Rovelle is built between a headland and two rivers, facing the Grey Sea. It records its tides, checks its instruments, and rings three bells when the water turns: the first warns, the second restricts the channels, the third closes them. Three days north of Ailan, on a cape beside Vard Light, stands the research station that came to be called **MØBIUS**.

<a href="https://mangiapanejohn-dev.github.io/mira-voss/world.html"><img src="media/github/chart.jpg" alt="A reader's chart of Rovelle: Cape Ward, the Pilot Station, North Reef, Channel Six, the Outer and Inner Harbors, the Old Salt Docks, the South Flats and the Tide Office" width="100%" /></a>

[Rovelle](lore/rovelle.md) · [MØBIUS Station](lore/mobius-station.md) · [Mira Voss](lore/mira-voss.md) · [Canon and continuity](lore/canon.md)

The stories give Mira a face and a voice; they do not describe the software. What the CLI does is defined by its code, the model and provider you choose, your settings and the permissions you give. See [product vs. fiction](docs/product-vs-fiction.md).

<br />

## Star history

<a href="https://star-history.com/#mangiapanejohn-dev/mira-voss&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=mangiapanejohn-dev/mira-voss&type=Date&theme=dark" />
    <img alt="Stars of mangiapanejohn-dev/mira-voss over time" src="https://api.star-history.com/svg?repos=mangiapanejohn-dev/mira-voss&type=Date" width="100%" />
  </picture>
</a>

## In this repository

| Path | What it holds |
| :-- | :-- |
| [`docs/`](docs/README.md) | Installation, first launch, FAQ, product and fiction |
| [`lore/`](lore/README.md) | The stories, in Chinese and in English, the world and the canon notes |
| [`site/`](site/README.md) | The website at [mangiapanejohn-dev.github.io/mira-voss](https://mangiapanejohn-dev.github.io/mira-voss/) |
| [`media/`](media/README.md) | The original logo, the approved art and these README images |
| [`scripts/`](scripts/build-stories.mjs) | The story build for the website |

The agent itself is distributed through npm; this repository holds none of its code. Security issues go through [private vulnerability reporting](https://github.com/mangiapanejohn-dev/mira-voss/security/advisories/new).

## Licence

**Mira Voss is proprietary.** You may install her from npm and use her, for your own work and your organisation's; you may not copy, redistribute, decompile or reverse-engineer her. The full terms are in the `LICENSE` file inside the npm package. What she carries of others' work stays under its own licence, listed in the package's `NOTICE`: the MØBIUS kernel is a fork of OpenAI's Codex (Apache-2.0), and the program runs on Bun.

The stories, art and documentation in this repository are public to read, not to reuse; see the [notice](NOTICE.md). Mira Voss, Rovelle and MØBIUS Station are fiction.

<p align="center"><sub>© 2026 ELLINGTON MARC. All rights reserved.</sub></p>
