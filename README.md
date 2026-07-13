# OPAN 2201 — Model selection framework

A small static website that helps OPAN 2201 students decide which modeling tool
to use for a business problem, and why. It presents a guided decision tree and a
profile for each modeling tool.

## The one rule

**Every visible word on the site lives in the two files under [`content/`](content/):**

- [`content/site_text.md`](content/site_text.md) — the page's own chrome: the
  header, intros, section headings, button labels, and breadcrumb text.
- [`content/tool_profiles.md`](content/tool_profiles.md) — the profile for each
  modeling tool.

The site fetches both files at load time, parses them, and renders from them. No
page wording is stored in the HTML, CSS, or JavaScript. To change any wording on
the site, edit the relevant file and reload. That is the only step — no build, no
code changes.

## Editing the page chrome — `content/site_text.md`

Open it in any text editor. It is organised into `## Section` groups, each with
`#### Field` entries. **Keep the `##` and `####` headings as they are; change only
the text beneath a `####` heading.** For example, to change the site's main
heading, edit the text under `#### Title` in the `## Header` section. The
`## Next-step offers` section holds the conditions shown when one model leads to a
more specific one (the `####` heading there is the target model's abbreviation).

## Editing the model profiles — `content/tool_profiles.md`

Its structure is fixed and the site relies on it:

- `#` heading — a paradigm: **Descriptive**, **Optimization**, or **Simulation**.
- `##` heading — a model (a node), e.g. `Linear programming (LP)`.
- `*Tag: ...*` — the italic line under a model title. Used for grouping and
  colour (and to resolve the "use LP / use IP" navigation links). Not shown as
  prose.
- `####` heading — a field inside a model. The text under it, up to the next
  heading, is that field's content.
- A field whose heading ends with `(expandable)` is collapsed by default; the
  `(expandable)` marker is stripped from the label shown on the site.
- The four fields **without** that marker are the always-visible core fields:
  Definition, When to use it, When to use a different model, Recommended tool.
- Items in **When to use a different model** are written as
  `If [condition], use [MODEL].` The model name(s) become links that jump to the
  right profile — so keep names as `LP`, `IP`, `BP`, `NLP`, `MINLP`,
  `Descriptive`, `Optimization`, `Simulation`.

You can add, remove, or reword expandable sections freely; the site renders
whatever expandable fields a model contains, in the order they appear. You do not
have to touch any code.

## How the site is navigated

- The landing page shows the three paradigms: **Descriptive**, **Optimization**,
  and **Simulation**.
- Descriptive and Simulation open their single model profile directly.
- Optimization opens an **overview page** (built from the Optimization intro in
  the profiles file) that offers two paths: **Linear** → LP, and **Nonlinear** →
  NLP. From LP the site offers IP and BP; from NLP it offers MINLP.
- Every model page shows a **breadcrumb trail** (e.g. *Decision tree ›
  Optimization › Linear › LP › IP*) so a student can see how they arrived and step
  back up.

## Previewing locally

The page loads its content with `fetch()`, which browsers block when a file is
opened directly from disk (`file://`). So the site must be **served**. From this
folder:

```
python -m http.server
```

Then open the address it prints (usually <http://localhost:8000>). Any static
server works; for example, with Node installed: `npx serve`.

**No Python or Node installed?** A tiny zero-install server written in Windows
PowerShell is included at `.claude/serve.ps1`. From this folder, run:

```
powershell -ExecutionPolicy Bypass -File .claude/serve.ps1
```

Then open <http://localhost:8123>. (This script is only a local-preview
convenience and is not part of the site itself.)

Opening `index.html` by double-clicking will show a load error explaining this —
that is expected.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*,
   choose your branch (e.g. `main`) and the `/ (root)` folder, and save.
4. GitHub Pages serves the site correctly — `fetch()` works in production, so no
   build step is required.

After it is published, editing either file in `content/` on GitHub (or pushing a
change to it) updates the live site on reload. Nothing else needs to run.

## Files

```
index.html            Page shell (no content).
styles.css            Visual layer.
app.js                Fetches, parses, and renders the content. No wording.
content/
  site_text.md        The page's own chrome (header, labels, headings) — edit this.
  tool_profiles.md    The per-model profiles — edit this.
vendor/
  marked.min.js       Markdown parser (renders the prose inside each field).
README.md             This file.
```

The Markdown parser is [marked](https://marked.js.org/). It is vendored as a
single local file (`vendor/marked.min.js`) rather than loaded from a CDN, so the
site has no external dependency: it works offline, in any sandbox, and does not
break if a CDN is unavailable. There is still no build step.
