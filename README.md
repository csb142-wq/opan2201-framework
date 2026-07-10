# OPAN 2201 — Model selection framework

A small static website that helps OPAN 2201 students decide which modeling tool
to use for a business problem, and why. It presents a two-layer decision tree and
a profile for each modeling tool.

## The one rule

**All written content lives in [`content/tool_profiles.md`](content/tool_profiles.md).**
The site fetches that Markdown file at load time, parses it, and renders it. No
profile wording is stored in the HTML, CSS, or JavaScript.

To change any wording on the site, edit `content/tool_profiles.md` and reload.
That is the only step. No build, no code changes.

## Editing the content

Open `content/tool_profiles.md` in any text editor. Its structure is fixed and
the site relies on it:

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

After it is published, editing `content/tool_profiles.md` on GitHub (or pushing a
change to it) updates the live site on reload. Nothing else needs to run.

## Files

```
index.html            Page shell (no content).
styles.css            Visual layer.
app.js                Fetches, parses, and renders the Markdown. No content.
content/
  tool_profiles.md    The single source of all written content — edit this.
README.md             This file.
```

The Markdown parser [marked](https://marked.js.org/) is loaded from a CDN to turn
the prose inside each field into HTML.
