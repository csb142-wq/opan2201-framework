/*
 * OPAN 2201 model selection framework — rendering machinery.
 *
 * This file contains NO page wording. Every visible string is read at load time
 * from one of two content files:
 *   - content/site_text.md      the page's own chrome (labels, headings, intros)
 *   - content/tool_profiles.md  the per-model profiles
 * Changing a word in either file and reloading is the only action ever needed to
 * change the site's text. (The only strings hardcoded below are the last-resort
 * error message shown when the content itself cannot be loaded.)
 */

const PROFILES_URL = "content/tool_profiles.md";
const TEXT_URL = "content/site_text.md";

// The three paradigms are the only level-1 headings that begin real content.
const PARADIGMS = ["Descriptive", "Optimization", "Simulation"];

// The four always-visible core fields, in the order they must be shown.
const CORE_ORDER = [
  "Definition",
  "When to use it",
  "When to use a different model",
  "Recommended tool",
];

// The guided two-level structure inside Optimization. This is navigation
// SCAFFOLDING (which model leads to which), keyed by the stable tag tokens
// (LP, IP, ...) rather than by titles, and resolved to nodes at render time.
// No wording lives here.
const OPT_BRANCHES = {
  linear: { head: "LP", childrenOf: { LP: ["IP", "BP"] } },
  nonlinear: { head: "NLP", childrenOf: { NLP: ["MINLP"] } },
};

const app = document.getElementById("app");

let SITE = {}; // parsed site_text.md: { section: { field: value } }

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

boot();

async function boot() {
  try {
    const [profilesText, siteText] = await Promise.all([
      fetchText(PROFILES_URL),
      fetchText(TEXT_URL),
    ]);
    SITE = parseSiteText(siteText);
    const model = parseProfiles(profilesText);
    window.__framework = model; // handy for inspection; not required

    fillStaticText();
    window.addEventListener("hashchange", () => route(model));
    route(model);
  } catch (err) {
    app.innerHTML =
      '<div class="error"><h2>Could not load the site content.</h2>' +
      "<p>The page reads its content from the files in <code>content/</code> " +
      "using <code>fetch()</code>, which needs the site to be <em>served</em> " +
      "rather than opened directly from disk.</p>" +
      "<p>Run a static server in this folder (see the README), then open the " +
      "address it prints. GitHub Pages serves it correctly in production.</p>" +
      '<p class="detail">' +
      escapeHtml(String(err && err.message ? err.message : err)) +
      "</p></div>";
  }
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return res.text();
}

// ---------------------------------------------------------------------------
// Site-text lookup helpers
// ---------------------------------------------------------------------------

// Raw string for a "Section::Field" (or section, field) lookup; "" if missing.
function textOf(section, field) {
  if (field === undefined) [section, field] = section.split("::");
  return (SITE[section] && SITE[section][field]) || "";
}

// Inline-markdown HTML for a field (handles code, emphasis, dashes; no <p>).
function htmlOf(section, field) {
  return marked.parseInline(textOf(section, field));
}

// Fill every element carrying data-text / data-text-md from site_text.md, and
// set the document title and meta description.
function fillStaticText() {
  document.querySelectorAll("[data-text]").forEach((el) => {
    el.textContent = textOf(el.dataset.text);
  });
  document.querySelectorAll("[data-text-md]").forEach((el) => {
    el.innerHTML = htmlOf.apply(null, el.dataset.textMd.split("::"));
  });
  const title = textOf("Page", "Browser tab title");
  if (title) document.title = title;
  const meta = document.getElementById("meta-description");
  if (meta) meta.setAttribute("content", textOf("Page", "Page description"));
}

// ---------------------------------------------------------------------------
// Parser: site_text.md -> { section: { field: value } }
// ---------------------------------------------------------------------------

function parseSiteText(text) {
  const out = {};
  let section = null;
  let field = null;
  let buf = [];

  const flush = () => {
    if (section && field) {
      out[section] = out[section] || {};
      out[section][field] = buf.join("\n").trim();
    }
    buf = [];
  };

  for (const line of text.split(/\r?\n/)) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h4 = line.match(/^####\s+(.+?)\s*$/);
    if (h2 && !/^#{3,}/.test(line)) {
      flush();
      section = h2[1].trim();
      field = null;
      continue;
    }
    if (h4) {
      flush();
      field = h4[1].trim();
      continue;
    }
    if (/^#\s/.test(line)) {
      // Document title / front matter between sections: ends any open field.
      flush();
      field = null;
      continue;
    }
    if (field) buf.push(line);
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------
// Parser: tool_profiles.md -> { paradigms, nodes, byId, tokenToId }
// ---------------------------------------------------------------------------

function parseProfiles(text) {
  const lines = text.split(/\r?\n/);
  const paradigms = []; // { name, intro, nodeIds:[] }
  const nodes = []; // { id, title, tag, category, paradigm, fields:[] }

  let curParadigm = null;
  let curNode = null;
  let curField = null;

  const isHeading = (l) => /^#{1,6}\s/.test(l);

  const flushField = () => {
    if (curNode && curField) {
      curField.content = curField.lines.join("\n").trim();
      delete curField.lines;
      curNode.fields.push(curField);
    }
    curField = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+?)\s*$/);
    if (h1) {
      const name = h1[1].trim();
      flushField();
      curNode = null;
      if (PARADIGMS.includes(name)) {
        curParadigm = { name, intro: [], nodeIds: [] };
        paradigms.push(curParadigm);
      }
      continue;
    }

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

    if (isHeading(line)) {
      flushField();
      continue;
    }

    const tag = line.match(/^\*Tag:\s*(.+?)\s*\*\s*$/i);
    if (tag && curNode && !curField && curNode.fields.length === 0) {
      curNode.tag = tag[1].trim();
      curNode.category = curNode.tag.split("/")[0].trim();
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      flushField();
      continue;
    }

    if (curField) {
      curField.lines.push(line);
    } else if (curParadigm && !curNode) {
      curParadigm.intro.push(line);
    }
  }
  flushField();

  for (const p of paradigms) p.intro = p.intro.join("\n").trim();

  const byId = {};
  const tokenToId = {};
  for (const n of nodes) {
    byId[n.id] = n;
    const parts = n.tag.split("/").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) tokenToId[parts[1]] = n.id;
    else if (parts.length === 1) tokenToId[capitalize(parts[0])] = n.id;
  }

  return { paradigms, nodes, byId, tokenToId };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function route(model) {
  const hash = location.hash.replace(/^#\/?/, "");
  const node = hash.match(/^node\/(.+)$/);
  const overview = hash.match(/^overview\/(.+)$/);

  if (node && model.byId[decodeURIComponent(node[1])]) {
    renderProfile(model, model.byId[decodeURIComponent(node[1])]);
  } else if (overview && decodeURIComponent(overview[1]) === "optimization") {
    renderOptimizationOverview(model);
  } else {
    renderTree(model);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  app.focus?.();
}

function goto(hash) {
  location.hash = hash;
}

// Where a paradigm card should lead: single-node paradigms open their node;
// Optimization opens its overview page.
function paradigmTarget(model, paradigm) {
  if (paradigm.name === "Optimization") return "#/overview/optimization";
  const id = paradigm.nodeIds[0];
  return id ? "#/node/" + encodeURIComponent(id) : "#/";
}

// ---------------------------------------------------------------------------
// View: decision tree (landing)
// ---------------------------------------------------------------------------

function renderTree(model) {
  const card = (paradigm) => {
    if (!paradigm) return "";
    const cls = paradigmClass(paradigm.name);
    return (
      `<button class="tnode paradigm c-${cls}" ` +
      `data-goto="${escapeHtml(paradigmTarget(model, paradigm))}">` +
      `<span class="tnode-kind">${escapeHtml(
        textOf("Decision tree section", "Paradigm label")
      )}</span>` +
      `<span class="tnode-title">${escapeHtml(paradigm.name)}</span>` +
      `</button>`
    );
  };

  const byName = (n) => model.paradigms.find((p) => p.name === n);

  app.innerHTML = `
    <section class="tree" aria-label="${escapeHtml(
      textOf("Decision tree section", "Accessible label")
    )}">
      <div class="tree-head">
        <h2>${escapeHtml(textOf("Decision tree section", "Heading"))}</h2>
        <div class="tree-intro">${htmlOf(
          "Decision tree section",
          "Intro"
        )}</div>
      </div>
      <div class="tree-row layer1">
        ${card(byName("Descriptive"))}
        ${card(byName("Optimization"))}
        ${card(byName("Simulation"))}
      </div>
    </section>
  `;
  wireGoto();
}

// ---------------------------------------------------------------------------
// View: Optimization overview (the first level inside optimization)
// ---------------------------------------------------------------------------

function renderOptimizationOverview(model) {
  const paradigm = model.paradigms.find((p) => p.name === "Optimization");
  if (!paradigm) return renderTree(model);

  const pathCard = (branchKey, labelField, descField) => {
    const def = OPT_BRANCHES[branchKey];
    const headId = model.tokenToId[def.head];
    if (!headId) return "";
    const head = model.byId[headId];
    const kids = (def.childrenOf[def.head] || [])
      .map((t) => model.tokenToId[t] && model.byId[model.tokenToId[t]])
      .filter(Boolean);

    const narrows = kids.length
      ? `<span class="path-narrows">${escapeHtml(
          textOf("Optimization overview", "Narrows to label")
        )} ${kids
          .map((k) => `<em>${escapeHtml(tokenOf(k))}</em>`)
          .join(", ")}</span>`
      : "";

    return (
      `<button class="path-card" data-goto="#/node/${encodeURIComponent(
        head.id
      )}">` +
      `<span class="path-label">${escapeHtml(
        textOf("Optimization overview", labelField)
      )}</span>` +
      `<span class="path-desc">${htmlOf(
        "Optimization overview",
        descField
      )}</span>` +
      `<span class="path-leads">` +
      `<span class="path-leads-label">${escapeHtml(
        textOf("Optimization overview", "Leads to label")
      )}</span> ` +
      `<span class="path-head"><span class="tnode-badge">${escapeHtml(
        tokenOf(head)
      )}</span> ${escapeHtml(head.title)}</span> ${narrows}` +
      `</span>` +
      `</button>`
    );
  };

  app.innerHTML = `
    <article class="overview card c-optimization">
      ${breadcrumbHtml([
        { label: textOf("Model page", "Back to tree"), href: "#/" },
        { label: paradigm.name, current: true },
      ])}
      <header class="profile-head">
        <span class="profile-tag">${escapeHtml(
          textOf("Decision tree section", "Paradigm label")
        )}</span>
        <h2>${escapeHtml(paradigm.name)}</h2>
      </header>
      <div class="overview-intro field-body">${md(paradigm.intro)}</div>
      <h3 class="paths-heading">${escapeHtml(
        textOf("Optimization overview", "Choose a path heading")
      )}</h3>
      <div class="paths">
        ${pathCard("linear", "Linear label", "Linear description")}
        ${pathCard("nonlinear", "Nonlinear label", "Nonlinear description")}
      </div>
    </article>
  `;
  wireGoto();
}

// ---------------------------------------------------------------------------
// View: a single node profile
// ---------------------------------------------------------------------------

function renderProfile(model, node) {
  const findField = (label) =>
    node.fields.find((f) => f.label.toLowerCase() === label.toLowerCase());

  const coreHtml = CORE_ORDER.map((label) => {
    const f = findField(label);
    if (!f) return "";
    const isTool = label.toLowerCase() === "recommended tool";
    const isRoute = label.toLowerCase() === "when to use a different model";
    const body = isRoute ? linkifyModels(f.content, model) : md(f.content);
    return (
      `<section class="field core ${isTool ? "recommended" : ""}">` +
      `<h3>${escapeHtml(f.label)}</h3>` +
      `<div class="field-body">${body}</div>` +
      `</section>`
    );
  }).join("");

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
    <article class="profile card c-${paradigmClass(
      categoryOf(node)
    )}">
      ${breadcrumbHtml(breadcrumbTrail(model, node))}

      <header class="profile-head">
        <span class="profile-tag">${escapeHtml(node.tag || node.paradigm)}</span>
        <h2>${escapeHtml(node.title)}</h2>
      </header>

      <div class="core-fields">${coreHtml}</div>

      ${nextStepsHtml(model, node)}

      ${
        expandHtml
          ? `<div class="expandables">
               <p class="expandables-note">${escapeHtml(
                 textOf("Model page", "Reasoning note")
               )}</p>
               ${expandHtml}
             </div>`
          : ""
      }
    </article>
  `;

  wireGoto();
  wireModelLinks();
}

// The guided "narrow further" section: for a branch head (LP, NLP), offer its
// children (IP/BP, MINLP) with the condition text from site_text.md.
function nextStepsHtml(model, node) {
  const token = tokenOf(node);
  let children = null;
  for (const def of Object.values(OPT_BRANCHES)) {
    if (def.childrenOf[token]) children = def.childrenOf[token];
  }
  if (!children || !children.length) return "";

  const cards = children
    .map((t) => {
      const id = model.tokenToId[t];
      if (!id) return "";
      const child = model.byId[id];
      const condition = textOf("Next-step offers", t);
      return (
        `<button class="offer-card" data-goto="#/node/${encodeURIComponent(
          id
        )}">` +
        `<span class="tnode-badge">${escapeHtml(tokenOf(child))}</span>` +
        `<span class="offer-body">` +
        `<span class="offer-title">${escapeHtml(child.title)}</span>` +
        `<span class="offer-cond">${escapeHtml(condition)}</span>` +
        `</span>` +
        `<span class="offer-arrow">→</span>` +
        `</button>`
      );
    })
    .join("");

  return (
    `<div class="next-steps">` +
    `<h3 class="next-steps-heading">${escapeHtml(
      textOf("Model page", "Where to go next heading")
    )}</h3>` +
    `<div class="offer-cards">${cards}</div>` +
    `</div>`
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

// Build the trail of crumbs for a node: Decision tree > [Optimization > branch >
// ancestors >] self. Node crumbs are links; the branch label is plain text.
function breadcrumbTrail(model, node) {
  const crumbs = [{ label: textOf("Model page", "Back to tree"), href: "#/" }];
  const token = tokenOf(node);

  // Which optimization branch (if any) does this node belong to?
  let branchKey = null;
  let def = null;
  for (const [key, d] of Object.entries(OPT_BRANCHES)) {
    if (d.head === token || Object.values(d.childrenOf).flat().includes(token)) {
      branchKey = key;
      def = d;
    }
  }

  if (branchKey) {
    // The paradigm name comes from the profiles file (node.paradigm), not code.
    crumbs.push({ label: node.paradigm, href: "#/overview/optimization" });
    const branchLabel =
      branchKey === "linear"
        ? textOf("Optimization overview", "Linear label")
        : textOf("Optimization overview", "Nonlinear label");
    crumbs.push({ label: branchLabel }); // category label, not a link

    // Ancestor head (for children like IP, BP, MINLP).
    const isHead = def.head === token;
    if (!isHead) {
      const headId = model.tokenToId[def.head];
      if (headId) {
        crumbs.push({
          label: tokenOf(model.byId[headId]),
          href: "#/node/" + encodeURIComponent(headId),
        });
      }
    }
  }

  crumbs.push({ label: tokenOf(node), current: true });
  return crumbs;
}

function breadcrumbHtml(crumbs) {
  const sep = escapeHtml(textOf("Model page", "Breadcrumb separator") || "›");
  const parts = crumbs.map((c) => {
    if (c.current) return `<span class="crumb current">${escapeHtml(c.label)}</span>`;
    if (c.href)
      return `<a class="crumb" href="${escapeHtml(
        c.href
      )}" data-goto="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a>`;
    return `<span class="crumb label">${escapeHtml(c.label)}</span>`;
  });
  return (
    `<nav class="crumbs" aria-label="Breadcrumb">` +
    parts.join(`<span class="crumb-sep">${sep}</span>`) +
    `</nav>`
  );
}

// ---------------------------------------------------------------------------
// "When to use a different model" -> navigation links
// ---------------------------------------------------------------------------

function linkifyModels(markdownText, model) {
  const container = document.createElement("div");
  container.innerHTML = md(markdownText);

  const tokens = Object.keys(model.tokenToId)
    .concat(["Optimization"])
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
      if (m.index > last)
        frag.appendChild(document.createTextNode(value.slice(last, m.index)));
      const a = document.createElement("a");
      a.className = "model-link";
      a.textContent = token;
      const id = model.tokenToId[token];
      if (id) {
        a.href = "#/node/" + encodeURIComponent(id);
        a.dataset.goto = "#/node/" + encodeURIComponent(id);
      } else {
        a.href = "#/overview/optimization";
        a.dataset.goto = "#/overview/optimization";
      }
      frag.appendChild(a);
      last = m.index + token.length;
    }
    if (last < value.length)
      frag.appendChild(document.createTextNode(value.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  });

  return container.innerHTML;
}

function walkText(node, fn) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) fn(child);
    else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "A")
      walkText(child, fn);
  }
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

function wireGoto() {
  app.querySelectorAll("[data-goto]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goto(el.dataset.goto);
    })
  );
}

function wireModelLinks() {
  // model-links carry data-goto too, so wireGoto handles them; kept for clarity.
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function md(text) {
  if (!text) return "";
  return marked.parse(text, { mangle: false, headerIds: false });
}

function tokenOf(node) {
  const parts = node.tag.split("/").map((s) => s.trim());
  return parts.length >= 2 ? parts[1] : capitalize(parts[0] || node.title);
}

function categoryOf(node) {
  return node.category || node.paradigm || "";
}

function paradigmClass(name) {
  const base = (name || "").toLowerCase();
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
