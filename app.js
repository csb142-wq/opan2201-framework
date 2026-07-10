/*
 * OPAN 2201 model selection framework — rendering machinery.
 *
 * This file contains NO profile wording. All written content is read at load
 * time from content/tool_profiles.md, parsed, and rendered. Changing a word in
 * that file and reloading is the only action ever needed to change the site's
 * text.
 */

const CONTENT_URL = "content/tool_profiles.md";

// The three paradigms are the only level-1 headings that begin real content.
// Everything before the first of these (doc title, "File structure" notes) is
// front matter and is skipped by the parser.
const PARADIGMS = ["Descriptive", "Optimization", "Simulation"];

// The four always-visible core fields, in the order they must be shown.
// (Recommended tool lives last in the file but is shown as a core field.)
const CORE_ORDER = [
  "Definition",
  "When to use it",
  "When to use a different model",
  "Recommended tool",
];

const app = document.getElementById("app");

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

boot();

async function boot() {
  try {
    const text = await fetchContent();
    const model = parseContent(text);
    window.__framework = model; // handy for inspection; not required
    window.addEventListener("hashchange", () => route(model));
    route(model);
  } catch (err) {
    app.innerHTML =
      '<div class="error"><h2>Could not load the framework content.</h2>' +
      "<p>The page reads its content from <code>" +
      CONTENT_URL +
      "</code> using <code>fetch()</code>, which needs the site to be " +
      "<em>served</em> rather than opened directly from disk.</p>" +
      "<p>Run a static server in this folder, e.g. " +
      "<code>python -m http.server</code>, then open the address it prints. " +
      "GitHub Pages serves it correctly in production.</p>" +
      '<p class="detail">' +
      escapeHtml(String(err && err.message ? err.message : err)) +
      "</p></div>";
  }
}

async function fetchContent() {
  const res = await fetch(CONTENT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + CONTENT_URL);
  return res.text();
}

// ---------------------------------------------------------------------------
// Parser: Markdown -> { paradigms:[...], nodes:[...], byId, tokenToId }
// ---------------------------------------------------------------------------

function parseContent(text) {
  const lines = text.split(/\r?\n/);

  const paradigms = []; // { name, intro, nodeIds:[] }
  const nodes = []; // { id, title, tag, category, paradigm, fields:[] }

  let curParadigm = null;
  let curNode = null;
  let curField = null; // { label, expandable, lines:[] }

  const isHeading = (l) => /^#{1,6}\s/.test(l);

  const flushField = () => {
    if (curNode && curField) {
      curField.content = curField.lines.join("\n").trim();
      delete curField.lines;
      curNode.fields.push(curField);
    }
    curField = null;
  };

  for (const raw of lines) {
    const line = raw;

    // Level-1 heading: a paradigm section (only the whitelisted names count).
    const h1 = line.match(/^#\s+(.+?)\s*$/);
    if (h1) {
      const name = h1[1].trim();
      if (PARADIGMS.includes(name)) {
        flushField();
        curNode = null;
        curParadigm = { name, intro: [], nodeIds: [] };
        paradigms.push(curParadigm);
      } else {
        // Doc title or other h1 in front matter: ignore, stay out of content.
        flushField();
        curNode = null;
      }
      continue;
    }

    // Level-2 heading: a model node — but only once inside a paradigm, so the
    // documentation "## File structure" in the front matter is ignored.
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      if (!curParadigm) continue;
      flushField();
      const title = h2[1].trim();
      curNode = {
        id: slug(title),
        title,
        tag: "",
        category: "",
        paradigm: curParadigm.name,
        fields: [],
      };
      nodes.push(curNode);
      curParadigm.nodeIds.push(curNode.id);
      continue;
    }

    // Level-4 heading: a field within the current node.
    const h4 = line.match(/^####\s+(.+?)\s*$/);
    if (h4) {
      if (!curNode) continue;
      flushField();
      let label = h4[1].trim();
      const expandable = /\(expandable\)\s*$/i.test(label);
      label = label.replace(/\s*\(expandable\)\s*$/i, "").trim();
      curField = { label, expandable, lines: [] };
      continue;
    }

    // Any other heading level (### etc.) ends the current field's content.
    if (isHeading(line)) {
      flushField();
      continue;
    }

    // The italic tag line directly under a node title.
    const tag = line.match(/^\*Tag:\s*(.+?)\s*\*\s*$/i);
    if (tag && curNode && !curField && curNode.fields.length === 0) {
      curNode.tag = tag[1].trim();
      curNode.category = curNode.tag.split("/")[0].trim();
      continue;
    }

    // Horizontal rules separate sections; drop them.
    if (/^-{3,}\s*$/.test(line)) {
      flushField();
      continue;
    }

    // Otherwise accumulate content into the current field, or into the
    // paradigm intro if we're between a paradigm heading and its first node.
    if (curField) {
      curField.lines.push(line);
    } else if (curNode) {
      // Loose text under a node before its first field — rare; ignore quietly.
    } else if (curParadigm) {
      curParadigm.intro.push(line);
    }
  }
  flushField();

  // Finalise paradigm intros.
  for (const p of paradigms) p.intro = p.intro.join("\n").trim();

  // Index nodes by id, and build a token -> node-id map from the tags so the
  // "use LP / use Simulation" links can resolve to real nodes.
  const byId = {};
  const tokenToId = {};
  for (const n of nodes) {
    byId[n.id] = n;
    const parts = n.tag.split("/").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      tokenToId[parts[1]] = n.id; // e.g. LP, IP, BP, NLP, MINLP
    } else if (parts.length === 1) {
      tokenToId[capitalize(parts[0])] = n.id; // Descriptive, Simulation
    }
  }

  return { paradigms, nodes, byId, tokenToId };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function route(model) {
  const hash = location.hash.replace(/^#\/?/, "");
  const m = hash.match(/^node\/(.+)$/);
  if (m && model.byId[decodeURIComponent(m[1])]) {
    renderProfile(model, model.byId[decodeURIComponent(m[1])]);
  } else {
    renderTree(model);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  app.focus?.();
}

// ---------------------------------------------------------------------------
// View: decision tree
// ---------------------------------------------------------------------------

function renderTree(model) {
  // The tree SHAPE is navigation scaffolding (which model sits under which
  // paradigm). Every displayed name comes from the parsed file: paradigm
  // names are the level-1 headings, node names are the level-2 headings.
  const optNodes = model.paradigms.find((p) => p.name === "Optimization");
  const linear = [];
  const nonlinear = [];
  if (optNodes) {
    for (const id of optNodes.nodeIds) {
      const n = model.byId[id];
      // Linear vs nonlinear is read from the node's own tag token:
      // NLP and MINLP contain "NLP"; LP, IP, BP do not.
      if (/NLP/i.test(tokenOf(n))) {
        nonlinear.push(n);
      } else {
        linear.push(n);
      }
    }
  }

  const descriptive = model.paradigms.find((p) => p.name === "Descriptive");
  const simulation = model.paradigms.find((p) => p.name === "Simulation");

  const paradigmNode = (p, cls) => {
    if (!p || !p.nodeIds.length) return "";
    const n = model.byId[p.nodeIds[0]];
    return (
      `<button class="tnode paradigm ${cls}" data-goto="${n.id}">` +
      `<span class="tnode-kind">Paradigm</span>` +
      `<span class="tnode-title">${escapeHtml(p.name)}</span>` +
      `</button>`
    );
  };

  const leaf = (n) =>
    `<button class="tnode opt-leaf" data-goto="${n.id}">` +
    `<span class="tnode-badge">${escapeHtml(tokenOf(n))}</span>` +
    `<span class="tnode-title">${escapeHtml(n.title)}</span>` +
    `</button>`;

  const html = `
    <section class="tree" aria-label="Model selection decision tree">
      <div class="tree-head">
        <h2>Decision tree</h2>
        <p>Two questions decide the branch. First, what are you trying to do?
        Then, only inside optimization, is the relationship linear, and must a
        variable be a whole number or a yes-or-no?</p>
      </div>

      <div class="tree-row layer1">
        <div class="branch descriptive-branch">
          ${paradigmNode(descriptive, "c-descriptive")}
        </div>

        <div class="branch optimization-branch">
          ${paradigmNode(
            model.paradigms.find((p) => p.name === "Optimization"),
            "c-optimization"
          )}
          <div class="connector"></div>
          <div class="opt-groups">
            <div class="opt-group">
              <div class="group-label">Linear</div>
              <div class="opt-leaves">
                ${linear.map(leaf).join("")}
              </div>
            </div>
            <div class="opt-group">
              <div class="group-label">Nonlinear</div>
              <div class="opt-leaves">
                ${nonlinear.map(leaf).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="branch simulation-branch">
          ${paradigmNode(simulation, "c-simulation")}
        </div>
      </div>
    </section>
  `;

  app.innerHTML = html;
  app.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => {
      location.hash = "#/node/" + encodeURIComponent(el.dataset.goto);
    });
  });
}

// ---------------------------------------------------------------------------
// View: a single node profile
// ---------------------------------------------------------------------------

function renderProfile(model, node) {
  const findField = (label) =>
    node.fields.find(
      (f) => f.label.toLowerCase() === label.toLowerCase()
    );

  // Core fields, in the required order.
  const coreHtml = CORE_ORDER.map((label) => {
    const f = findField(label);
    if (!f) return "";
    const isTool = label.toLowerCase() === "recommended tool";
    const isRoute = label.toLowerCase() === "when to use a different model";
    const body = isRoute
      ? linkifyModels(f.content, model)
      : md(f.content);
    return (
      `<section class="field core ${isTool ? "recommended" : ""}">` +
      `<h3>${escapeHtml(f.label)}</h3>` +
      `<div class="field-body">${body}</div>` +
      `</section>`
    );
  }).join("");

  // Expandable fields, in file order, collapsed by default.
  const expandHtml = node.fields
    .filter((f) => f.expandable)
    .map(
      (f) =>
        `<details class="field expandable">` +
        `<summary>${escapeHtml(f.label)}</summary>` +
        `<div class="field-body">${md(f.content)}</div>` +
        `</details>`
    )
    .join("");

  app.innerHTML = `
    <article class="profile card c-${categoryClass(node)}">
      <nav class="crumbs">
        <a href="#/" data-home>← Decision tree</a>
        <span class="crumb-sep">/</span>
        <span class="crumb-paradigm">${escapeHtml(node.paradigm)}</span>
      </nav>

      <header class="profile-head">
        <span class="profile-tag">${escapeHtml(node.tag || node.paradigm)}</span>
        <h2>${escapeHtml(node.title)}</h2>
      </header>

      <div class="core-fields">${coreHtml}</div>

      ${
        expandHtml
          ? `<div class="expandables">
               <p class="expandables-note">The reasoning — limitations,
               tradeoffs, ethics, and model-specific detail. Open what you need.</p>
               ${expandHtml}
             </div>`
          : ""
      }

      <div class="profile-foot">
        <a href="#/" data-home>← Back to the decision tree</a>
      </div>
    </article>
  `;

  app.querySelectorAll("[data-home]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "#/";
    })
  );

  // Wire up the in-content model links produced by linkifyModels().
  app.querySelectorAll("[data-node]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "#/node/" + encodeURIComponent(el.dataset.node);
    })
  );
  app.querySelectorAll("[data-paradigm-link]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "#/";
    })
  );
}

// ---------------------------------------------------------------------------
// "When to use a different model" -> navigation links
// ---------------------------------------------------------------------------

// Render the field's markdown, then wrap each model token (LP, IP, BP, NLP,
// MINLP, Descriptive, Optimization, Simulation) in a link to that node. We
// operate on rendered text nodes so we never touch tag attributes.
function linkifyModels(markdownText, model) {
  const container = document.createElement("div");
  container.innerHTML = md(markdownText);

  // Longest tokens first so MINLP wins before NLP, etc.
  const tokens = Object.keys(model.tokenToId)
    .concat(["Optimization"]) // paradigm group: routes back to the tree
    .sort((a, b) => b.length - a.length);

  const pattern = new RegExp(
    "\\b(" + tokens.map(escapeRegex).join("|") + ")\\b",
    "g"
  );

  walkText(container, (textNode) => {
    const value = textNode.nodeValue;
    if (!pattern.test(value)) return;
    pattern.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = pattern.exec(value)) !== null) {
      const token = m[1];
      if (m.index > last) {
        frag.appendChild(
          document.createTextNode(value.slice(last, m.index))
        );
      }
      const a = document.createElement("a");
      a.className = "model-link";
      a.textContent = token;
      const id = model.tokenToId[token];
      if (id) {
        a.href = "#/node/" + encodeURIComponent(id);
        a.dataset.node = id;
      } else {
        // "Optimization" — no single node; route to the tree.
        a.href = "#/";
        a.dataset.paradigmLink = "1";
      }
      frag.appendChild(a);
      last = m.index + token.length;
    }
    if (last < value.length) {
      frag.appendChild(document.createTextNode(value.slice(last)));
    }
    textNode.parentNode.replaceChild(frag, textNode);
  });

  return container.innerHTML;
}

function walkText(node, fn) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      fn(child);
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "A") {
      walkText(child, fn);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function md(text) {
  if (!text) return "";
  // marked returns block HTML; that's what we want for field bodies.
  return marked.parse(text, { mangle: false, headerIds: false });
}

function tokenOf(node) {
  const parts = node.tag.split("/").map((s) => s.trim());
  return parts.length >= 2 ? parts[1] : capitalize(parts[0] || node.title);
}

function categoryClass(node) {
  const base = (node.category || node.paradigm || "").toLowerCase();
  if (base.startsWith("optim")) return "optimization";
  if (base.startsWith("desc")) return "descriptive";
  if (base.startsWith("sim")) return "simulation";
  return "optimization";
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
