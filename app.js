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
// No wording lives here. Within optimization, LP/IP/BP are three answers to the
// same variable-type question (siblings), and NLP/MINLP are two answers to the
// whole-number/yes-no question.
const OPT_BRANCHES = {
  linear: { members: ["LP", "IP", "BP"] },
  nonlinear: { members: ["NLP", "MINLP"] },
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
    // Redraw the tree's connector lines when the viewport changes.
    window.addEventListener("resize", () => {
      const diagram = document.querySelector(".tree-diagram");
      if (diagram) drawTreeConnectors(diagram);
    });
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
  const nodeHref = (token) => {
    const id = model.tokenToId[token];
    return id ? "#/node/" + encodeURIComponent(id) : null;
  };
  const paradigmName = (n) => {
    const p = model.paradigms.find((x) => x.name === n);
    return p ? p.name : n;
  };
  const q = (field) => textOf("Questions", field);
  const grp = (field) => textOf("Groups", field);

  // A neutral question box at a fork. Never clickable.
  const question = (key, field) =>
    `<div class="tnode2 kind-question is-static" data-key="${escapeHtml(key)}">` +
    `<span class="tnode2-title">${escapeHtml(q(field))}</span></div>`;

  // A colored, clickable model box (a destination).
  const modelBox = (key, cls, title, subtitleKey, href) => {
    const subtitle = subtitleKey ? textOf("Tree subtitles", subtitleKey) : "";
    return (
      `<button class="tnode2 kind-model c-${cls}" ` +
      `data-key="${escapeHtml(key)}" data-goto="${escapeHtml(href)}">` +
      `<span class="tnode2-title">${escapeHtml(title)}</span>` +
      (subtitle
        ? `<span class="tnode2-sub">${escapeHtml(subtitle)}</span>`
        : "") +
      `</button>`
    );
  };

  // A small answer chip (Linear / Nonlinear) that labels a branch. Static.
  const chip = (key, label) =>
    `<div class="tnode2 kind-chip c-decide is-static" data-key="${escapeHtml(
      key
    )}"><span class="tnode2-title">${escapeHtml(label)}</span></div>`;

  // A group header. Static label with an optional caption.
  const groupHeader = (key, cls, labelField, captionField) => {
    const caption = grp(captionField);
    return (
      `<div class="group-label kind-grouphdr c-${cls}" ` +
      `data-key="${escapeHtml(key)}">` +
      `<span class="group-label-title">${escapeHtml(grp(labelField))}</span>` +
      (caption
        ? `<span class="group-label-cap">${escapeHtml(caption)}</span>`
        : "") +
      `</div>`
    );
  };

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

      <div class="tree-diagram">
        <svg class="tree-lines" aria-hidden="true"
             preserveAspectRatio="none"></svg>

        <div class="tree-level level-q1">
          ${question("q_need", "What do you need")}
        </div>

        <div class="groups-row">
          <div class="group group-describe">
            ${groupHeader(
              "describe_hdr",
              "describe",
              "Describe label",
              "Describe caption"
            )}
            <div class="group-body">
              ${question("q_uncertain", "Inputs uncertain")}
              <div class="answer-row">
                ${modelBox(
                  "Descriptive",
                  "descriptive",
                  paradigmName("Descriptive"),
                  "Descriptive",
                  nodeHref("Descriptive")
                )}
                ${modelBox(
                  "Simulation",
                  "simulation",
                  paradigmName("Simulation"),
                  "Simulation",
                  nodeHref("Simulation")
                )}
              </div>
            </div>
          </div>

          <div class="group group-decide">
            ${groupHeader(
              "decide_hdr",
              "decide",
              "Decide label",
              "Decide caption"
            )}
            <div class="group-body">
              ${question("q_linear", "Everything linear")}
              <div class="subbranch-row">
                <div class="subbranch">
                  ${chip("Linear", textOf("Optimization overview", "Linear label"))}
                  ${question("q_vartype", "Variable type")}
                  <div class="answer-row">
                    ${modelBox("LP", "optimization", "LP", "LP", nodeHref("LP"))}
                    ${modelBox("IP", "optimization", "IP", "IP", nodeHref("IP"))}
                    ${modelBox("BP", "optimization", "BP", "BP", nodeHref("BP"))}
                  </div>
                </div>
                <div class="subbranch">
                  ${chip(
                    "Nonlinear",
                    textOf("Optimization overview", "Nonlinear label")
                  )}
                  ${question("q_wholeyesno", "Whole number or yes-no")}
                  <div class="answer-row">
                    ${modelBox("NLP", "optimization", "NLP", "NLP", nodeHref("NLP"))}
                    ${modelBox(
                      "MINLP",
                      "optimization",
                      "MINLP",
                      "MINLP",
                      nodeHref("MINLP")
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  wireGoto();

  const diagram = app.querySelector(".tree-diagram");
  // Draw immediately (reading layout forces a synchronous reflow), then again
  // shortly after in case web fonts change box widths. We do not rely on
  // requestAnimationFrame alone, since it does not fire in a backgrounded tab.
  drawTreeConnectors(diagram);
  setTimeout(() => drawTreeConnectors(diagram), 60);
  setTimeout(() => drawTreeConnectors(diagram), 350);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => drawTreeConnectors(diagram));
  }
}

// Draw the elbow connector lines between parent and child boxes, measured from
// the rendered layout so they stay correct at any width.
function drawTreeConnectors(diagram) {
  const svg = diagram.querySelector(".tree-lines");
  if (!svg) return;
  const box = diagram.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.setAttribute("width", box.width);
  svg.setAttribute("height", box.height);

  const at = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - box.left,
      top: r.top - box.top,
      bottom: r.bottom - box.top,
    };
  };
  const get = (key) =>
    diagram.querySelector(`[data-key="${cssEscape(key)}"]`);

  // Centre the first question over its two group headers (the groups have
  // unequal widths, so its natural centre would sit off to one side). Use
  // `left` (the box is position:relative) rather than transform, which the
  // node's transition would animate/override.
  const q1 = get("q_need");
  const dh = get("describe_hdr");
  const eh = get("decide_hdr");
  if (q1 && dh && eh) {
    q1.style.left = "0px";
    const mid = (at(dh).x + at(eh).x) / 2;
    q1.style.left = `${round(mid - at(q1).x)}px`;
  }

  // parent key -> child keys, following the question-and-answer flow.
  const edges = [
    ["q_need", ["describe_hdr", "decide_hdr"]],
    ["describe_hdr", ["q_uncertain"]],
    ["q_uncertain", ["Descriptive", "Simulation"]],
    ["decide_hdr", ["q_linear"]],
    ["q_linear", ["Linear", "Nonlinear"]],
    ["Linear", ["q_vartype"]],
    ["Nonlinear", ["q_wholeyesno"]],
    ["q_vartype", ["LP", "IP", "BP"]],
    ["q_wholeyesno", ["NLP", "MINLP"]],
  ];

  const segs = [];
  for (const [pk, cks] of edges) {
    const p = get(pk);
    if (!p) continue;
    const pc = at(p);
    const kids = cks.map(get).filter(Boolean).map(at);
    if (!kids.length) continue;
    const busY = (pc.bottom + Math.min(...kids.map((k) => k.top))) / 2;
    segs.push([pc.x, pc.bottom, pc.x, busY]); // parent stem
    if (kids.length > 1 || Math.abs(kids[0].x - pc.x) > 0.5) {
      const xs = kids.map((k) => k.x).concat(pc.x);
      segs.push([Math.min(...xs), busY, Math.max(...xs), busY]); // bus
    }
    for (const k of kids) segs.push([k.x, busY, k.x, k.top]); // child drop
  }

  svg.innerHTML = segs
    .map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(
          x2
        )}" y2="${round(y2)}" />`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// View: Optimization overview (the first level inside optimization)
// ---------------------------------------------------------------------------

function renderOptimizationOverview(model) {
  const paradigm = model.paradigms.find((p) => p.name === "Optimization");
  if (!paradigm) return renderTree(model);

  // Each branch lists its member models as clickable chips (LP/IP/BP are
  // co-equal answers to the variable-type question; NLP/MINLP likewise).
  const pathCard = (branchKey, labelField, descField) => {
    const members = OPT_BRANCHES[branchKey].members
      .map((t) => model.tokenToId[t] && model.byId[model.tokenToId[t]])
      .filter(Boolean);
    const chips = members
      .map((m) => {
        const href = "#/node/" + encodeURIComponent(m.id);
        return (
          `<a class="opt-chip" href="${href}" data-goto="${href}">` +
          `<span class="tnode-badge">${escapeHtml(tokenOf(m))}</span>` +
          `<span class="opt-chip-title">${escapeHtml(m.title)}</span></a>`
        );
      })
      .join("");
    return (
      `<div class="path-card">` +
      `<span class="path-label">${escapeHtml(
        textOf("Optimization overview", labelField)
      )}</span>` +
      `<span class="path-desc">${htmlOf(
        "Optimization overview",
        descField
      )}</span>` +
      `<span class="path-leads">` +
      `<span class="path-leads-label">${escapeHtml(
        textOf("Optimization overview", "Options label")
      )}</span>` +
      `<span class="opt-chips">${chips}</span>` +
      `</span>` +
      `</div>`
    );
  };

  app.innerHTML = `
    <article class="overview card c-optimization">
      ${breadcrumbHtml([
        { label: textOf("Model page", "Back to tree"), href: "#/" },
        { label: paradigm.name, current: true },
      ])}
      <header class="profile-head">
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

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

// Build the trail of crumbs for a node: Decision tree > [Optimization > branch >]
// self. Node crumbs are links; the branch label is plain text. Within
// optimization the five models are leaves of their branch (LP/IP/BP under
// linear, NLP/MINLP under nonlinear), so there is no model-to-model ancestry.
function breadcrumbTrail(model, node) {
  const crumbs = [{ label: textOf("Model page", "Back to tree"), href: "#/" }];
  const token = tokenOf(node);

  let branchKey = null;
  for (const [key, d] of Object.entries(OPT_BRANCHES)) {
    if (d.members.includes(token)) branchKey = key;
  }

  if (branchKey) {
    // The paradigm name comes from the profiles file (node.paradigm), not code.
    crumbs.push({ label: node.paradigm, href: "#/overview/optimization" });
    const branchLabel =
      branchKey === "linear"
        ? textOf("Optimization overview", "Linear label")
        : textOf("Optimization overview", "Nonlinear label");
    crumbs.push({ label: branchLabel }); // category label, not a link
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

function cssEscape(s) {
  return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
}

function round(n) {
  return Math.round(n * 10) / 10;
}
