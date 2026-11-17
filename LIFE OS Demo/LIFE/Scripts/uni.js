// LIFE OS vault engine · uni · don't edit unless you know JavaScript
// ===== LIFE OS vault engine: shared helpers (auto-included in every script) =====
const zz = (() => {
  const APP = (typeof app !== "undefined") ? app : window.app;
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const now = () => new Date();
  const today = () => ymd(now());
  const parseYmd = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim().slice(0, 10));
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return (d.getMonth() === +m[2] - 1) ? d : null; // rejects 2026-02-31
  };
  const validYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim()) && !!parseYmd(s);
  const toDate = x => {
    if (x === null || x === undefined || x === "") return null;
    if (x.toJSDate) { const d = x.toJSDate(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    if (x instanceof Date) return new Date(x.getFullYear(), x.getMonth(), x.getDate());
    return parseYmd(String(x).slice(0, 10));
  };
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
  const daysUntil = x => { const d = toDate(x); return d ? daysBetween(today(), d) : null; };
  const monthKey = d => ymd(d).slice(0, 7);
  const addMonths = (mk, n) => { const [y, m] = mk.split("-").map(Number); return monthKey(new Date(y, m - 1 + n, 1)); };
  const monthName = mk => { const [y, m] = mk.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" }); };
  const weekStart = (d = now()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; };
  const num = x => {
    if (x === null || x === undefined) return NaN;
    if (typeof x === "number") return x;
    const s = String(x).replace(/[€\s]/g, "").replace(",", ".");
    if (s === "" || !/^[-+]?\d*\.?\d+$/.test(s)) return NaN;
    return Number(s);
  };
  const n0 = x => { const v = num(x); return isFinite(v) ? v : 0; };
  const round2 = x => Math.round(x * 100) / 100;
  // € formatting, Austrian style: €1.234,50 (no dependence on system locale)
  const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const eur = x => { const v = Math.abs(round2(x)); const [i, d] = v.toFixed(2).split("."); return (round2(x) < 0 ? "−" : "") + "€" + group(i) + "," + d; };
  const eur0 = x => { const v = round2(x); return Number.isInteger(v) ? (v < 0 ? "−" : "") + "€" + group(String(Math.abs(v))) : eur(v); };
  const fmt = (x, dec = 2) => { const r = Number(x.toFixed(dec)); const [i, d] = Math.abs(r).toFixed(dec).split("."); return (r < 0 ? "−" : "") + group(i) + (d ? "," + d : ""); };
  const plain = x => String(round2(x)); // for writing into files: 12.4 → "12.4"

  // ---- files ----
  // finds the real path even if a folder was renamed with different capitals (Uni → UNI)
  let FIXMAP = null, FIXT = 0;
  function fix(p) {
    if (!p || APP.vault.getAbstractFileByPath(p)) return p;
    if (!FIXMAP || Date.now() - FIXT > 3000) { FIXMAP = new Map(); for (const f of (APP.vault.getAllLoadedFiles ? APP.vault.getAllLoadedFiles() : APP.vault.getFiles())) if (f.path) FIXMAP.set(f.path.toLowerCase(), f.path); FIXT = Date.now(); }
    const hit = FIXMAP.get(p.toLowerCase()) || FIXMAP.get((p + ".md").toLowerCase());
    if (hit) return p.toLowerCase() === hit.toLowerCase() ? hit : hit.replace(/\.md$/, "");
    const parts = p.split("/");
    for (let i = parts.length - 1; i > 0; i--) { const pre = FIXMAP.get(parts.slice(0, i).join("/").toLowerCase()); if (pre) return pre + "/" + parts.slice(i).join("/"); }
    return p;
  }
  const getFile = p => APP.vault.getAbstractFileByPath(p) || APP.vault.getAbstractFileByPath(fix(p));
  async function read(p) { const f = getFile(p); if (!f) return null; return await APP.vault.read(f); }
  async function write(p, fn) {
    const f = getFile(p);
    if (!f) throw new Error("File not found: " + p);
    if (APP.vault.process) return await APP.vault.process(f, fn);
    const t = await APP.vault.read(f); await APP.vault.modify(f, fn(t));
  }
  async function ensureFolder(folder) {
    if (!folder) return;
    const parts = folder.split("/"); let cur = "";
    for (const p of parts) { cur = cur ? cur + "/" + p : p; if (!getFile(cur)) { try { await APP.vault.createFolder(cur); } catch (e) { /* exists */ } } }
  }
  // create a note; adds " (2)", " (3)"… if the name is taken. Returns the path used.
  async function createFile(path, content) {
    const dot = path.lastIndexOf("."), base = path.slice(0, dot), ext = path.slice(dot);
    let p = path, i = 2;
    while (getFile(p)) p = `${base} (${i++})${ext}`;
    await ensureFolder(p.split("/").slice(0, -1).join("/"));
    await APP.vault.create(p, content);
    return p;
  }
  const safeName = s => String(s || "").replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled";
  // clickable internal link
  function link(text, target) {
    const a = h("a", { class: "internal-link", "data-href": target, href: target }, text);
    a.addEventListener("click", ev => { ev.preventDefault(); try { APP.workspace.openLinkText(target, "", false); } catch (e) { } });
    return a;
  }
  async function frontmatter(p, fn) {
    const f = getFile(p);
    if (!f) throw new Error("File not found: " + p);
    await APP.fileManager.processFrontMatter(f, fn);
  }

  // ---- markdown tables ----
  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => c.trim());
  }
  const isSep = line => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
  const isRow = line => /^\s*\|/.test(line);
  const normH = s => String(s || "").replace(/\*/g, "").trim().toLowerCase();
  function headMatches(head, want) {
    const w = [].concat(want);
    return w.every((x, i) => normH(head[i]) === normH(x));
  }
  function findTable(text, firstHeader, fromLine = 0) {
    const lines = text.split("\n");
    for (let i = fromLine; i < lines.length - 1; i++) {
      if (isRow(lines[i]) && isSep(lines[i + 1])) {
        const head = splitRow(lines[i]);
        if (headMatches(head, firstHeader)) {
          let j = i + 2; const rows = [];
          while (j < lines.length && isRow(lines[j])) { rows.push({ line: j, cells: splitRow(lines[j]), raw: lines[j] }); j++; }
          return { lines, head, start: i, end: j, rows };
        }
      }
    }
    return null;
  }
  const cell = v => String(v === null || v === undefined ? "" : v).replace(/\|/g, "/").replace(/[\r\n]+/g, " ").trim();
  const makeRow = cells => "| " + cells.map(cell).join(" | ") + " |";
  // append a row at the end of the table whose first header is `firstHeader`
  async function appendRow(path, firstHeader, cells) {
    let ok = false;
    await write(path, text => {
      const t = findTable(text, firstHeader);
      if (!t) return text;
      // drop trailing completely-empty rows so new rows go where they belong
      let end = t.end;
      while (end > t.start + 2 && splitRow(t.lines[end - 1]).every(c => c === "")) end--;
      t.lines.splice(end, 0, makeRow(cells)); ok = true;
      return t.lines.join("\n");
    });
    if (!ok) throw new Error(`Table "${[].concat(firstHeader).join(" | ")}" not found in ${path}`);
  }
  // read a table as objects keyed by (lower-case) header name
  function tableObjects(text, firstHeader) {
    const t = text === null || text === undefined ? null : findTable(text, firstHeader);
    if (!t) return null;
    const keys = t.head.map(normH);
    const rows = t.rows.map(r => { const o = { _line: r.line, _raw: r.raw, _cells: r.cells }; keys.forEach((k, i) => { o[k] = (r.cells[i] ?? "").trim(); }); return o; });
    return { t, keys, rows };
  }
  async function readTable(path, firstHeader) { const tx = await read(path); return tx === null ? null : tableObjects(tx, firstHeader); }
  // replace a whole table (header + rows); if missing, append it under `heading`
  function setTable(text, firstHeader, headers, rows, heading) {
    const t = findTable(text, firstHeader);
    const block = [makeRow(headers), "|" + headers.map(() => "---|").join(""), ...rows.map(makeRow)];
    if (!t) return text.trimEnd() + "\n\n" + (heading ? heading + "\n" : "") + block.join("\n") + "\n";
    t.lines.splice(t.start, t.end - t.start, ...block);
    return t.lines.join("\n");
  }
  async function writeTable(path, firstHeader, headers, rows, heading) { await write(path, text => setTable(text, firstHeader, headers, rows, heading)); }
  async function trash(path) { const f = getFile(path); if (!f) return false; if (APP.vault.trash) await APP.vault.trash(f, true); else await APP.vault.delete(f, true); return true; }
  // delete one exact row (line number + content must match, otherwise search by content)
  async function deleteRow(path, line, raw) {
    let ok = false;
    await write(path, text => {
      const lines = text.split("\n");
      let i = (lines[line] === raw) ? line : lines.lastIndexOf(raw);
      if (i >= 0) { lines.splice(i, 1); ok = true; }
      return lines.join("\n");
    });
    return ok;
  }

  // ---- UI ----
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "style") e.setAttribute("style", v);
      else if (k === "class") e.className = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (k === "value") e.value = v;
      else if (k === "selected" || k === "checked") e[k] = !!v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      e.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return e;
  }
  const CSS = `
.zz{font-size:var(--font-ui-medium,15px)}
.zz-card{background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:10px;padding:12px 14px;margin:8px 0}
.zz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.zz-stat{background:var(--background-primary);border-radius:8px;padding:8px 10px}
.zz-stat .zz-v{font-size:1.25em;font-weight:700}
.zz-muted{color:var(--text-muted);font-size:.88em}
.zz-ok{color:var(--color-green,#2e9e5b)} .zz-bad{color:var(--color-red,#d24343)} .zz-warn{color:var(--color-orange,#d98a1c)}
.zz-bar{height:8px;border-radius:4px;background:var(--background-modifier-border);overflow:hidden;min-width:60px}
.zz-bar>div{height:100%;border-radius:4px}
.zz-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
.zz input,.zz select{font-size:.95em;padding:3px 6px;border-radius:6px;max-width:100%}
.zz-btn{cursor:pointer;padding:4px 12px;border-radius:6px}
.zz-btn.mod-cta{background:var(--interactive-accent);color:var(--text-on-accent)}
.zz-x{cursor:pointer;color:var(--text-muted);border:none;background:none;padding:0 6px;box-shadow:none}
.zz-x:hover{color:var(--color-red,#d24343)}
.zz-table{width:100%;border-collapse:collapse;margin:6px 0}
.zz-table td,.zz-table th{padding:4px 6px;border-bottom:1px solid var(--background-modifier-border);text-align:left;vertical-align:middle}
.zz-table th{font-size:.85em;color:var(--text-muted);font-weight:600}
.zz-table td.r,.zz-table th.r{text-align:right;white-space:nowrap}
.zz h4{margin:6px 0}
.zz-msg{font-size:.9em;margin-left:6px}
.zz-card{box-shadow:0 1px 3px rgba(0,0,0,.08)}
.zz-donut{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.zz-legend>div{display:flex;align-items:center;gap:6px;margin:3px 0}
.zz-sw{width:12px;height:12px;border-radius:3px;display:inline-block;flex:none}
.zz-chip{display:inline-block;padding:1px 8px;border-radius:10px;font-size:.8em;background:var(--background-modifier-hover)}
.zz-hero{background:linear-gradient(135deg,var(--interactive-accent),color-mix(in srgb,var(--interactive-accent) 55%,#000));color:#fff;border-radius:14px;padding:18px 20px;margin:6px 0 10px}
.zz-hero .zz-muted{color:rgba(255,255,255,.8)}
.zz-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:8px 0}
.zz-tile{background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:12px;padding:10px 12px;cursor:pointer}
.zz-tile:hover{border-color:var(--interactive-accent)}
.zz-tile .zz-v{font-size:1.4em;font-weight:800;margin:2px 0}
.zz-tile .zz-bar{margin-top:6px}
.zz-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.zz-sec{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px}
.zz-sec a.zz-seccard{display:block;text-decoration:none;color:var(--text-normal);background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:12px;padding:12px}
.zz-sec a.zz-seccard:hover{border-color:var(--interactive-accent)}
.zz-badge{float:right;font-size:.75em;color:var(--color-orange,#d98a1c)}
.zz-home{--file-line-width:1100px}
.zz-home .metadata-container,.zz-home .inline-title{display:none}
.zz-home h2{margin-top:1.2em;font-size:1.15em}
.zz-hero .zz-btn:hover{background:rgba(255,255,255,.3)!important}
.zz-agenda-day{margin:10px 0 2px;font-weight:700;font-size:.9em;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}
.zz-agenda-item{display:flex;gap:10px;padding:5px 8px;border-radius:8px}
.zz-agenda-item:hover{background:var(--background-modifier-hover)}
.zz-todo{display:flex;align-items:flex-start;gap:6px;padding:3px 0;font-size:.95em}
.zz-todo label{flex:1;min-width:0;cursor:pointer}
.zz-todo input{margin-top:3px}
.zz-todo .zz-chip{flex:none;white-space:nowrap}
.zz-todo .zz-mv{flex:none;display:flex;flex-direction:column;line-height:.9}
.zz-todo .zz-mv button{padding:0 3px;font-size:.62em;opacity:.35}
.zz-todo:hover .zz-mv button:not([disabled]){opacity:1}
.zz-secmv{float:right;font-weight:400}
.zz-secmv button{font-size:.8em;opacity:.45}
.zz-secmv button:hover{opacity:1}
.zz-todo.done label{text-decoration:line-through;opacity:.55}
.zz-sub{font-size:.75em;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin:8px 0 2px}
.zz-sub a{color:var(--text-muted)}
.zz-fbtn{cursor:pointer;border:1px solid var(--background-modifier-border);background:none;border-radius:14px;padding:2px 10px;font-size:.82em;box-shadow:none}
.zz-fbtn.on{background:var(--interactive-accent);color:var(--text-on-accent);border-color:transparent}
`;
  const cssStr = s => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  // count open things per note: open tasks "- [ ]" + ⏳ markers (outside code blocks)
  function openCount(text) {
    const t = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");
    return (t.match(/^\s*[-*+] \[ \]/gm) || []).length + (t.match(/⏳/g) || []).length;
  }
  async function computeOpen(base) {
    const out = new Map();
    for (const f of APP.vault.getMarkdownFiles()) {
      if (base && !f.path.startsWith(base)) continue;
      const rel = f.path.slice(base.length);
      if (/^(Templates|Scripts)\//.test(rel) || rel === "CLAUDE.md") continue;
      const n = openCount(await APP.vault.cachedRead(f));
      if (n) out.set(f.path, n);
    }
    return out;
  }
  async function sidebar(base) {
    const W = window;
    if (W.__zzSideT && Date.now() - W.__zzSideT < 15000) return;
    W.__zzSideT = Date.now();
    try {
      const files = await computeOpen(base || "");
      const folders = new Map();
      for (const [p, n] of files) { const parts = p.split("/"); for (let i = 1; i < parts.length; i++) { const f = parts.slice(0, i).join("/"); if (base && (f + "/").length <= base.length) continue; folders.set(f, (folders.get(f) || 0) + n); } }
      const css = [];
      const hide = ["Scripts", "Templates"].map(x => (base || "") + x);
      hide.forEach(x => css.push(`.nav-folder:has(> .nav-folder-title[data-path="${cssStr(x)}"]){display:none}`));
      css.push(`.nav-file:has(> .nav-file-title[data-path="${cssStr((base || "") + "CLAUDE.md")}"]){display:none}`);
      const badge = "margin-left:auto;padding-left:6px;font-size:.78em;color:var(--color-orange,#d98a1c);white-space:nowrap;";
      for (const [p, n] of files) css.push(`.nav-file-title[data-path="${cssStr(p)}"]::after{content:"⏳${n}";${badge}}`);
      for (const [p, n] of folders) css.push(`.nav-folder-title[data-path="${cssStr(p)}"]::after{content:"⏳${n}";${badge}}`);
      let st = document.getElementById("zz-side");
      if (!st) { st = h("style", { id: "zz-side" }); document.head.append(st); }
      st.textContent = css.join("\n");
    } catch (e) { console.warn("LIFE OS sidebar:", e); }
  }
  function root() {
    if (!document.getElementById("zz-style-v3")) { const old = document.getElementById("zz-style"); if (old) old.remove(); document.head.append(h("style", { id: "zz-style-v3" }, CSS)); }
    try { const B0 = (typeof input !== "undefined" && input && input.base) || ""; setTimeout(() => sidebar(B0), 50); } catch (e) { }
    const r = h("div", { class: "zz" });
    dv.container.append(r);
    return r;
  }
  function bar(pc, color) {
    const p = Math.max(0, Math.min(100, pc));
    const c = color || (pc > 100 ? "var(--color-red,#d24343)" : pc > 85 ? "var(--color-orange,#d98a1c)" : "var(--interactive-accent)");
    return h("div", { class: "zz-bar" }, h("div", { style: `width:${p}%;background:${c}` }));
  }
  const stat = (label, value, sub, cls) => h("div", { class: "zz-stat" }, h("div", { class: "zz-muted" }, label), h("div", { class: "zz-v " + (cls || "") }, value), sub ? h("div", { class: "zz-muted" }, sub) : null);
  function flash(el, text, good = true) { el.textContent = text; el.className = "zz-msg " + (good ? "zz-ok" : "zz-bad"); }
  // messages that survive a Dataview re-render for a few seconds
  const MSGS = (window.__zzMsgs = window.__zzMsgs || {});
  function msgEl(k) { const el = h("span", { class: "zz-msg" }); const m = MSGS[k]; if (m && Date.now() - m.t < 8000) flash(el, m.text, m.good); return el; }
  function say(el, k, text, good = true) { MSGS[k] = { text, good, t: Date.now() }; flash(el, text, good); }
  function confirmBtn(label, onConfirm, cls = "zz-x") {
    let armed = false, timer;
    const b = h("button", { class: cls, title: "Click twice to confirm" }, label);
    b.addEventListener("click", async () => {
      if (!armed) { armed = true; b.textContent = "sure?"; timer = setTimeout(() => { armed = false; b.textContent = label; }, 3000); return; }
      clearTimeout(timer); b.disabled = true; await onConfirm();
    });
    return b;
  }
  function errorBox(e) { const r = root(); r.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + (e && e.message ? e.message : e))); }
  function lineChart(points, opts = {}) {
    // points: [{x: Date, y: number}], opts: {target, unit, height}
    const W = 600, H = opts.height || 160, P = 28;
    if (points.length < 2) return h("div", { class: "zz-muted" }, "Chart appears after 2+ entries.");
    const xs = points.map(p => +p.x), ys = points.map(p => p.y);
    if (isFinite(opts.target)) ys.push(opts.target);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (x1 === x0) x1 = x0 + 1; if (y1 === y0) { y1 += 1; y0 -= 1; }
    const pad = (y1 - y0) * 0.1; y0 -= pad; y1 += pad;
    const X = x => P + (x - x0) / (x1 - x0) * (W - 2 * P), Y = y => H - P / 2 - (y - y0) / (y1 - y0) * (H - P);
    const ns = "http://www.w3.org/2000/svg", s = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", style: "max-height:220px" });
    if (isFinite(opts.target)) svg.append(s("line", { x1: P, x2: W - P, y1: Y(opts.target), y2: Y(opts.target), stroke: "var(--color-green,#2e9e5b)", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
    svg.append(s("polyline", { points: points.map(p => `${X(+p.x)},${Y(p.y)}`).join(" "), fill: "none", stroke: "var(--interactive-accent)", "stroke-width": 2.5 }));
    points.forEach(p => svg.append(s("circle", { cx: X(+p.x), cy: Y(p.y), r: 3.5, fill: "var(--interactive-accent)" })));
    const lab = (txt, x, y, anchor) => { const t = s("text", { x, y, "font-size": 12, fill: "var(--text-muted)", "text-anchor": anchor || "start" }); t.textContent = txt; return t; };
    svg.append(lab(`${round2(Math.max(...points.map(p => p.y)))}${opts.unit || ""}`, 2, 12));
    svg.append(lab(ymd(new Date(x0)), P, H - 2), lab(ymd(new Date(x1)), W - P, H - 2, "end"));
    return svg;
  }
  function barChart(data, opts = {}) {
    // data: [{label, v}], opts: {budget}
    const W = 600, H = 190, P = 30, ns = "http://www.w3.org/2000/svg";
    const s = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    if (!data.length) return h("div", { class: "zz-muted" }, "No data yet.");
    const max = Math.max(1, ...data.map(d => d.v), opts.budget || 0) * 1.1;
    const bw = (W - 2 * P) / data.length;
    const Y = v => H - P - v / max * (H - 2 * P);
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", style: "max-height:240px" });
    data.forEach((d, i) => {
      const x = P + i * bw + bw * 0.15, w = bw * 0.7, over = opts.budget > 0 && d.v > opts.budget;
      svg.append(s("rect", { x, y: Y(d.v), width: w, height: Math.max(0, H - P - Y(d.v)), rx: 3, fill: over ? "var(--color-red,#d24343)" : "var(--interactive-accent)" }));
      const t = s("text", { x: x + w / 2, y: Y(d.v) - 4, "font-size": 11, "text-anchor": "middle", fill: "var(--text-normal)" }); t.textContent = d.v ? Math.round(d.v) : ""; svg.append(t);
      const lb = s("text", { x: x + w / 2, y: H - P + 14, "font-size": 11, "text-anchor": "middle", fill: "var(--text-muted)" }); lb.textContent = d.label; svg.append(lb);
    });
    if (opts.budget > 0) svg.append(s("line", { x1: P, x2: W - P, y1: Y(opts.budget), y2: Y(opts.budget), stroke: "var(--color-green,#2e9e5b)", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
    return svg;
  }
  // donut: segments [{label, value, color}], centre text
  function donut(segments, opts = {}) {
    const S = opts.size || 180, R = S / 2 - 8, W = opts.width || 22, ns = "http://www.w3.org/2000/svg";
    const s = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = s("svg", { viewBox: `0 0 ${S} ${S}`, width: S, height: S, style: "flex:none" });
    const total = segments.reduce((a, x) => a + Math.max(0, x.value), 0);
    const C = 2 * Math.PI * R; let off = 0;
    svg.append(s("circle", { cx: S / 2, cy: S / 2, r: R, fill: "none", stroke: "var(--background-modifier-border)", "stroke-width": W }));
    if (total > 0) for (const x of segments) {
      const v = Math.max(0, x.value); if (!v) continue;
      const len = v / total * C;
      svg.append(s("circle", { cx: S / 2, cy: S / 2, r: R, fill: "none", stroke: x.color, "stroke-width": W, "stroke-dasharray": `${len} ${C - len}`, "stroke-dashoffset": -off, transform: `rotate(-90 ${S / 2} ${S / 2})` }));
      off += len;
    }
    const t1 = s("text", { x: S / 2, y: S / 2 - 2, "text-anchor": "middle", "font-size": opts.big || 22, "font-weight": 700, fill: "var(--text-normal)" }); t1.textContent = opts.center || "";
    const t2 = s("text", { x: S / 2, y: S / 2 + 18, "text-anchor": "middle", "font-size": 12, fill: "var(--text-muted)" }); t2.textContent = opts.sub || "";
    svg.append(t1, t2);
    const legend = h("div", { class: "zz-legend" }, segments.filter(x => x.label).map(x => h("div", {}, h("span", { class: "zz-sw", style: `background:${x.color}` }), `${x.label}`, x.text ? h("span", { class: "zz-muted" }, " " + x.text) : null)));
    return h("div", { class: "zz-donut" }, svg, legend);
  }
  const PALETTE = ["#4f8cff", "#2e9e5b", "#d98a1c", "#a259ff", "#e5484d", "#14b8a6", "#f472b6", "#84cc16", "#64748b", "#eab308", "#06b6d4", "#fb7185"];
  // Austrian public holidays
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), hh = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7, m = Math.floor((a + 11 * hh + 22 * l) / 451), mo = Math.floor((hh + l - 7 * m + 114) / 31), da = ((hh + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  function holidaysAT(y) {
    const E = easter(y), off = n => { const d = new Date(E); d.setDate(d.getDate() + n); return ymd(d); };
    const f = (m, d) => `${y}-${pad(m)}-${pad(d)}`;
    return { [f(1, 1)]: "Neujahr", [f(1, 6)]: "Heilige Drei Könige", [off(1)]: "Ostermontag", [f(5, 1)]: "Staatsfeiertag", [off(39)]: "Christi Himmelfahrt", [off(50)]: "Pfingstmontag", [off(60)]: "Fronleichnam", [f(8, 15)]: "Mariä Himmelfahrt", [f(10, 26)]: "Nationalfeiertag", [f(11, 1)]: "Allerheiligen", [f(12, 8)]: "Mariä Empfängnis", [f(12, 25)]: "Christtag", [f(12, 26)]: "Stefanitag" };
  }

  // ---------- everything with a date (calendar, home) ----------
  const nextDay = s => { const d = toDate(s); d.setDate(d.getDate() + 1); return ymd(d); };
  const timeStr = t => {
    if (t === null || t === undefined || t === "") return "";
    if (typeof t === "number") { const m = Math.round(t); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
    const m = /^(\d{1,2}):(\d{2})/.exec(String(t)); return m ? `${pad(+m[1])}:${m[2]}` : "";
  };
  // ---------- to-do lists inside notes ----------
  const TODO_HEAD = /to-?\s?dos?\b|\btodo\b/i;
  function parseTasks(text) {
    const lines = String(text || "").split("\n"), out = [];
    let inCode = false, head = "", inTodo = false;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (/^\s*```/.test(ln)) { inCode = !inCode; continue; }
      if (inCode) continue;
      const hm = /^(#{1,6})\s+(.*)$/.exec(ln);
      if (hm) { head = hm[2].trim(); inTodo = TODO_HEAD.test(head); continue; }
      const m = /^\s*[-*+] \[(.)\] (.*)$/.exec(ln);
      if (!m) continue;
      const body = m[2];
      const due = (/📅\s*(\d{4}-\d{2}-\d{2})/.exec(body) || [])[1] || "";
      const doneDate = (/✅\s*(\d{4}-\d{2}-\d{2})/.exec(body) || [])[1] || "";
      const tags = (body.match(/(^|\s)#[\w/-]+/g) || []).map(t => t.trim().slice(1).toLowerCase());
      const clean = body.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a).replace(/(^|\s)#[\w/-]+/g, " ")
        .replace(/(📅|✅|⏳|🛫|➕|⏫|🔼|🔽)️?\s*\d{4}-\d{2}-\d{2}/gu, " ").replace(/🔁\s*[^📅✅⏳🛫➕]*/gu, " ").replace(/\s+/g, " ").trim();
      out.push({ line: i, raw: ln, done: m[1] !== " ", text: clean || body.trim(), due, doneDate, tags, section: head, inTodo });
    }
    return out;
  }
  async function toggleTask(path, line, raw, done) {
    let ok = false;
    await write(path, text => {
      const lines = text.split("\n");
      const i = lines[line] === raw ? line : lines.indexOf(raw);
      if (i < 0) return text;
      let t = lines[i];
      if (done) { t = t.replace(/^(\s*[-*+] )\[ \]/, "$1[x]"); if (!/✅\s*\d{4}-\d{2}-\d{2}/.test(t)) t = t.replace(/\s+$/, "") + " ✅ " + today(); }
      else t = t.replace(/^(\s*[-*+] )\[[^ ]\]/, "$1[ ]").replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/, "");
      lines[i] = t; ok = true;
      return lines.join("\n");
    });
    return ok;
  }
  // moves an open to-do one place up (-1) or down (+1) among the open to-dos of the same list
  async function moveTask(path, line, raw, dir) {
    let ok = false;
    await write(path, text => {
      const lines = text.split("\n"), tasks = parseTasks(text);
      const me = tasks.find(t => t.line === line && t.raw === raw) || tasks.find(t => t.raw === raw);
      if (!me) return text;
      const same = tasks.filter(t => !t.done && t.section === me.section);
      const o = same[same.indexOf(me) + dir];
      if (!o) return text;
      [lines[me.line], lines[o.line]] = [lines[o.line], lines[me.line]]; ok = true;
      return lines.join("\n");
    });
    return ok;
  }
  // adds or removes a #tag on one to-do line (used for 📌 "show on Home")
  async function setTaskTag(path, line, raw, tag, on) {
    let ok = false;
    await write(path, text => {
      const lines = text.split("\n"); const i = lines[line] === raw ? line : lines.indexOf(raw);
      if (i < 0) return text;
      const re = new RegExp("\\s#" + tag + "(?=\\s|$)", "g");
      let t = lines[i].replace(re, "");
      if (on) { const m = /\s(📅|✅)/u.exec(t); t = m ? t.slice(0, m.index) + " #" + tag + t.slice(m.index) : t.replace(/\s+$/, "") + " #" + tag; }
      lines[i] = t; ok = true; return lines.join("\n");
    });
    return ok;
  }
  // adds "- [ ] text #tag 📅 due" to the end of the note's To-dos section (creates the section if missing)
  async function addTask(path, text, due, tag) {
    const task = "- [ ] " + String(text).replace(/[\r\n]+/g, " ").trim() + (tag ? " #" + String(tag).replace(/^#/, "") : "") + (due ? " 📅 " + due : "");
    await write(path, t => {
      const lines = t.split("\n");
      let inCode = false, start = -1, lvl = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*```/.test(lines[i])) { inCode = !inCode; continue; }
        if (inCode) continue;
        const hm = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
        if (hm && TODO_HEAD.test(hm[2])) { start = i; lvl = hm[1].length; break; }
      }
      if (start < 0) return t.replace(/\s+$/, "") + "\n\n## ✅ To-dos\n" + task + "\n";
      let end = lines.length; inCode = false;
      for (let i = start + 1; i < lines.length; i++) {
        if (/^\s*```/.test(lines[i])) inCode = !inCode;
        if (inCode) continue;
        const hm = /^(#{1,6})\s/.exec(lines[i]);
        if ((hm && hm[1].length <= lvl) || /^(---|\*\*\*)\s*$/.test(lines[i])) { end = i; break; }
      }
      let at = -1;
      for (let i = start + 1; i < end; i++) if (/^\s*[-*+] \[.\] /.test(lines[i])) at = i + 1;
      if (at < 0) { at = start + 1; while (at < end && lines[at].trim() !== "") at++; }
      lines.splice(at, 0, task);
      return lines.join("\n");
    });
    return task;
  }
  // make sure a table exists (adds it under a heading at the end of the note)
  async function ensureTable(path, firstHeader, headers, heading) {
    const t = await read(path);
    if (t === null) throw new Error("Missing note: " + path);
    if (findTable(t, firstHeader)) return false;
    await write(path, text => findTable(text, firstHeader) ? text : setTable(text, firstHeader, headers, [], heading));
    return true;
  }

  // ---------- Apple Calendar (through the Full Calendar Remastered plugin) ----------
  const FC_IDS = ["full-calendar-remastered", "full-calendar"];
  const FC_REMOTE = ["caldav", "ical", "google", "outlook"];
  function fcPlugin() {
    const P = APP.plugins && APP.plugins.plugins; if (!P) return null;
    for (const id of FC_IDS) if (P[id] && P[id].api && typeof P[id].api.withToken === "function") return P[id];
    return null;
  }
  function fcApi(B) {
    const pl = fcPlugin(); if (!pl) return null;
    const pg = dv.page(fix((B || "") + "Calendar"));
    const tok = window.__zzFCtok || (pg && pg.fullcalendar_token ? String(pg.fullcalendar_token) : "");
    if (!tok) return null;
    const C = (window.__zzFC = window.__zzFC || {});
    if (!(tok in C)) { try { C[tok] = pl.api.withToken(tok) || null; } catch (e) { C[tok] = null; } }
    return C[tok];
  }
  // "none" = plugin not installed/enabled · "off" = installed, not allowed yet · "on" = connected
  function fcState(B) { return !fcPlugin() ? "none" : fcApi(B) ? "on" : "off"; }
  async function fcConnect(B) {
    const pl = fcPlugin(); if (!pl) throw new Error("Install and enable Full Calendar Remastered first.");
    const tok = await pl.api.requestAccess("zero-z-vault", "Show your Apple Calendar in the vault's Calendar page and on Home, and let the vault's ＋ Add event form save events to it.", ["events:read", "events:write", "providers:read"]);
    if (!tok) return false;
    window.__zzFCtok = tok;
    await frontmatter(fix((B || "") + "Calendar.md"), fm => { fm.fullcalendar_token = tok; });
    return true;
  }
  function fcCalendars(B) {
    const api = fcApi(B); if (!api) return [];
    try { return (api.getCalendarSources() || []).filter(c => FC_REMOTE.includes(c.type)).map(c => ({ id: c.id, name: c.name || c.type, type: c.type, color: c.color })); }
    catch (e) { return []; }
  }
  async function fcCreate(B, calendarId, ev) {
    const api = fcApi(B); if (!api) throw new Error("Apple Calendar isn't connected");
    return await api.createEvent(calendarId, ev);
  }
  const isoDay = s => { const m = /(\d{4})-?(\d{2})-?(\d{2})/.exec(String(s || "")); return m ? `${m[1]}-${m[2]}-${m[3]}` : ""; };
  const WDAY = { U: 0, M: 1, T: 2, W: 3, R: 4, F: 5, S: 6 }, BYDAY = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const nthOk = (d, n) => { const day = d.getDate(), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return n > 0 ? Math.ceil(day / 7) === n : Math.ceil((last - day + 1) / 7) === -n; };
  const monthsDiff = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  // dates (YYYY-MM-DD) on which an event happens between from and to
  function occurrences(ev, from, to) {
    const out = [], skip = new Set([].concat(ev.skipDates || []).map(isoDay));
    const type = ev.type || "single";
    if (type === "single") {
      const s = isoDay(ev.date); if (!s) return out;
      let e = isoDay(ev.endDate) || s; if (e < s) e = s;
      let x = s, g = 0; while (x <= e && g++ < 400) { if (x >= from && x <= to) out.push(x); if (x > to) break; x = nextDay(x); }
      return out;
    }
    let match, start, until = to, count = Infinity;
    if (type === "recurring") {
      start = isoDay(ev.startRecur) || from; if (ev.endRecur && isoDay(ev.endRecur) < until) until = isoDay(ev.endRecur);
      const iv = Math.max(1, +ev.repeatInterval || 1), s0 = toDate(start), ws0 = weekStart(s0);
      const dows = (ev.daysOfWeek || []).map(x => WDAY[x]).filter(x => x !== undefined);
      match = d => {
        if (ev.fcrDaily) return daysBetween(s0, d) % iv === 0;
        if (dows.length) return dows.includes(d.getDay()) && Math.round((weekStart(d) - ws0) / 6048e5) % iv === 0;
        if (ev.repeatOn) return d.getDay() === ev.repeatOn.weekday && nthOk(d, ev.repeatOn.week) && monthsDiff(s0, d) % iv === 0;
        if (ev.dayOfMonth) return d.getDate() === +ev.dayOfMonth && (ev.month ? d.getMonth() + 1 === +ev.month : monthsDiff(s0, d) % iv === 0);
        return false;
      };
    } else if (type === "rrule") {
      start = isoDay(ev.startDate); if (!start) return out;
      const line = (String(ev.rrule || "").split(/\n/).find(l => /FREQ=/i.test(l)) || "").replace(/^RRULE:/i, "");
      const P = {}; line.split(";").forEach(kv => { const [k, v] = kv.split("="); if (k && v) P[k.toUpperCase()] = v; });
      const freq = (P.FREQ || "").toUpperCase(), iv = Math.max(1, +P.INTERVAL || 1), s0 = toDate(start), ws0 = weekStart(s0);
      if (P.UNTIL) { const u = isoDay(P.UNTIL); if (u && u < until) until = u; }
      if (P.COUNT) count = +P.COUNT;
      const byday = (P.BYDAY || "").split(",").filter(Boolean).map(x => { const m = /^([+-]?\d+)?([A-Z]{2})$/i.exec(x.trim()); return m ? { n: m[1] ? +m[1] : 0, wd: BYDAY[m[2].toUpperCase()] } : null; }).filter(Boolean);
      const bymd = (P.BYMONTHDAY || "").split(",").filter(Boolean).map(Number), bymonth = (P.BYMONTH || "").split(",").filter(Boolean).map(Number);
      const dayRule = d => {
        if (bymd.length) { const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return bymd.some(n => n > 0 ? d.getDate() === n : d.getDate() === last + n + 1); }
        if (byday.length) return byday.some(b => b.wd === d.getDay() && (!b.n || nthOk(d, b.n)));
        return d.getDate() === s0.getDate();
      };
      match = d => {
        if (bymonth.length && !bymonth.includes(d.getMonth() + 1)) return false;
        if (freq === "DAILY") return daysBetween(s0, d) % iv === 0 && (!byday.length || byday.some(b => b.wd === d.getDay()));
        if (freq === "WEEKLY") return Math.round((weekStart(d) - ws0) / 6048e5) % iv === 0 && (byday.length ? byday.some(b => b.wd === d.getDay()) : d.getDay() === s0.getDay());
        if (freq === "MONTHLY") return monthsDiff(s0, d) % iv === 0 && dayRule(d);
        if (freq === "YEARLY") return (d.getFullYear() - s0.getFullYear()) % iv === 0 && (bymonth.length || d.getMonth() === s0.getMonth()) && dayRule(d);
        return false;
      };
    } else return out;
    if (start > until) return out;
    // walk day by day from the start (needed for COUNT), capped at ~20 years
    let x = start, n = 0, g = 0;
    while (x <= until && g++ < 7400) {
      const d = toDate(x);
      if (match(d)) { n++; if (n > count) break; if (x >= from && !skip.has(x)) out.push(x); }
      x = nextDay(x);
    }
    return out;
  }
  function fcItems(B, from, to) {
    const api = fcApi(B); if (!api) return [];
    const cals = new Map(fcCalendars(B).map(c => [c.id, c]));
    if (!cals.size) return [];
    const items = [], moved = new Set();
    const sources = (api.getAllEvents() || []).filter(src => cals.has(src.id));
    for (const src of sources) for (const x of src.events || []) { const ev = x.event || {}; if (ev.recurrenceId && ev.uid) moved.add(ev.uid + "|" + isoDay(ev.recurrenceId)); }
    for (const src of sources) {
      const cal = cals.get(src.id);
      for (const x of src.events || []) {
        const ev = x.event || {};
        if (ev.isTask || (ev.completed !== undefined && ev.completed !== null) || ev.display === "none") continue;
        for (const d of occurrences(ev, from, to)) {
          if ((ev.type === "rrule" || ev.type === "recurring") && ev.uid && moved.has(ev.uid + "|" + d)) continue;
          items.push({ date: d, time: ev.allDay ? "" : timeStr(ev.startTime), icon: "🍎", text: (ev.title || "(no title)") + (ev.location ? " · " + ev.location : ""), link: null, kind: "apple", calendar: cal.name, color: src.color || cal.color });
        }
      }
    }
    return items;
  }

  async function collect(B, from, to, opts = {}) {
    const items = [];
    const add = (date, o) => { if (date && date >= from && date <= to) items.push({ date, time: "", ...o }); };
    const yesv = s => /^(yes|y|ja|true|1|✅|x|on)$/i.test(String(s || "").trim());
    // events
    for (const p of dv.pages(`"${B}Calendar/Events"`)) {
      const d = toDate(p.date); if (!d) continue;
      const s = ymd(d), e = p.endDate && toDate(p.endDate) ? ymd(toDate(p.endDate)) : s;
      let x = s, guard = 0;
      while (x <= e && x <= to && guard++ < 366) { add(x, { time: p.allDay === true ? "" : timeStr(p.startTime), icon: "📌", text: p.title || p.file.name, link: p.file.path, kind: "event" }); x = nextDay(x); }
    }
    // tasks with 📅
    if (!opts.noTasks) {
      for (const f of APP.vault.getMarkdownFiles()) {
        if (!f.path.startsWith(B) || /^(Templates|Scripts)\//.test(f.path.slice(B.length))) continue;
        const t = await APP.vault.cachedRead(f);
        if (!t.includes("📅")) continue;
        for (const line of t.split("\n")) {
          const m = /^\s*[-*+] \[([ \/])\] (.+?)\s*📅\s*(\d{4}-\d{2}-\d{2})/.exec(line);
          if (!m) continue;
          const text = m[2].replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a).replace(/(^|\s)#[\w/-]+/g, "").replace(/[⏳🛫➕🔁⏫🔼🔽]\s*\S*/g, "").replace(/\s+/g, " ").trim();
          add(m[3], { icon: "☑️", text, link: f.path, kind: "task" });
        }
      }
    }
    // uni: sessions table inside each course note + exam_date
    for (const c of dv.pages("#course").where(p => p.file && p.file.path.startsWith(B))) {
      if (c.status === "removed") continue;
      const name = c.short || c.title || c.file.name;
      const tb = tableObjects(await read(c.file.path), ["Date", "Start"]);
      let examInTable = false;
      if (tb) for (const r of tb.rows) {
        if (!validYmd(r.date)) continue;
        const exam = /exam|prüfung|klausur/i.test(r.type || "");
        if (exam) examInTable = true;
        add(r.date.trim(), { time: timeStr(r.start), icon: exam ? "📝" : "🎓", text: (exam ? "Exam: " : "") + name + (r.room ? ` · ${r.room}` : ""), link: c.file.path, kind: exam ? "exam" : "class", done: exam && c.status === "passed" });
      }
      if (!examInTable && c.exam_date && toDate(c.exam_date)) add(ymd(toDate(c.exam_date)), { icon: "📝", text: "Exam: " + name, link: c.file.path, kind: "exam", done: c.status === "passed" });
    }
    // content
    for (const v of dv.pages(`"${B}Social Media/Content"`)) if (v.publish_date && toDate(v.publish_date)) add(ymd(toDate(v.publish_date)), { icon: v.stage === "published" ? "✅" : "🎬", text: v.title || v.file.name, link: v.file.path, kind: "content", done: v.stage === "published" });
    // monthly payments
    if (!opts.noPayments) {
      const tb = tableObjects(await read(fix(B + "Money/Monthly Payments.md")), "Name");
      if (tb) for (const r of tb.rows) {
        if (!r.name || !yesv(r.active) || !/^\d{4}-\d{2}$/.test(r.start || "")) continue;
        let mk = from.slice(0, 7), guard = 0;
        while (mk <= to.slice(0, 7) && guard++ < 36) {
          if (mk >= r.start) { const [y, m] = mk.split("-").map(Number); const last = new Date(y, m, 0).getDate(); add(`${mk}-${pad(Math.min(parseInt(r.day) || 1, last))}`, { icon: "🔁", text: `${r.name} ${eur(n0(r.amount))}`, link: fix(B + "Money/Monthly Payments.md"), kind: "payment" }); }
          mk = addMonths(mk, 1);
        }
      }
    }
    // workouts, golf, Part-time Job shifts (what you did / planned)
    const seen = new Set();
    const wt = tableObjects(await read(fix(B + "Body/Workouts.md")), ["Date", "Session"]);
    if (wt) for (const r of wt.rows) if (validYmd(r.date) && !seen.has(r.date + r.session)) { seen.add(r.date + r.session); add(r.date.trim(), { icon: "🏋️", text: r.session || "Workout", link: fix(B + "Body/Workouts.md"), kind: "workout", done: true }); }
    const gt = tableObjects(await read(fix(B + "Body/Golf.md")), ["Date", "Course"]);
    if (gt) for (const r of gt.rows) if (validYmd(r.date)) add(r.date.trim(), { icon: "⛳", text: `Golf ${r.score || ""}${r.course ? " · " + r.course : ""}`, link: fix(B + "Body/Golf.md"), kind: "golf", done: true });
    const ft = tableObjects(await read(fix(B + "Business/Part-time Job.md")), ["Date", "Start"]);
    if (ft) for (const r of ft.rows) if (validYmd(r.date)) add(r.date.trim(), { time: timeStr(r.start), icon: "🕹", text: `Part-time Job ${r.hours ? r.hours + " h" : ""}`, link: fix(B + "Business/Part-time Job.md"), kind: "shift" });
    // Apple Calendar (Full Calendar Remastered, if connected)
    if (!opts.noApple) { try { for (const it of fcItems(B, from, to)) if (it.date >= from && it.date <= to) items.push(it); } catch (e) { console.warn("LIFE OS Apple Calendar:", e); } }
    // deadlines
    const biz = dv.page(fix(B + "Business/Business")); if (biz && biz.decision_deadline && !biz.chosen_option) add(ymd(toDate(biz.decision_deadline)), { icon: "💼", text: "Business decision", link: fix(B + "Business/Business.md"), kind: "deadline" });
    const golf = dv.page(fix(B + "Body/Golf")); if (golf && golf.deadline) add(ymd(toDate(golf.deadline)), { icon: "⛳", text: "Handicap < 10 deadline", link: fix(B + "Body/Golf.md"), kind: "deadline" });
    for (let y = +from.slice(0, 4); y <= +to.slice(0, 4); y++) for (const [d, n] of Object.entries(holidaysAT(y))) add(d, { icon: "🇦🇹", text: n, kind: "holiday" });
    const order = { holiday: 0, exam: 1, event: 2, apple: 2, class: 3, shift: 4, deadline: 5, content: 6, task: 7, payment: 8, workout: 9, golf: 10 };
    return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99").localeCompare(b.time || "99") || order[a.kind] - order[b.kind]);
  }
  return { APP, pad, ymd, today, parseYmd, validYmd, toDate, daysBetween, daysUntil, monthKey, addMonths, monthName, weekStart, num, n0, round2, eur, eur0, fmt, plain, getFile, read, write, frontmatter, ensureFolder, createFile, safeName, link, tableObjects, readTable, setTable, writeTable, trash, openCount, computeOpen, sidebar, splitRow, findTable, makeRow, appendRow, deleteRow, h, root, bar, stat, flash, msgEl, say, confirmBtn, errorBox, lineChart, barChart, donut, PALETTE, collect, timeStr, easter, holidaysAT, parseTasks, toggleTask, moveTask, setTaskTag, addTask, ensureTable, fcPlugin, fcApi, fcState, fcConnect, fcCalendars, fcCreate, occurrences, isoDay, TODO_HEAD, fix };
})();
// ===== end shared helpers =====

// ===== UNI: dv.view(base+"Scripts/uni", {base, mode}) =====
// modes: dashboard · course · week
const { h } = zz;
const B = (input && input.base) || "";
const MODE = (input && input.mode) || "dashboard";
const UNI = zz.fix(B + "Uni");
const SESS_T = ["Date", "Start"], SESS_H = ["Date", "Start", "End", "Room", "Type"];
const LOG_T = ["Date", "What"], LOG_H = ["Date", "What", "Minutes", "Note"];
const LOG_KINDS = ["Lecture", "Tutorial / exercise class", "Self-study", "Exercises / homework", "Reading", "Exam prep", "Group work", "Other"];
const key = s => String(s || "").trim().toLowerCase();

// ---------- ICS parsing ----------
function icsUnescape(v) { return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\"); }
function icsDate(prop) {
  // returns {date:"YYYY-MM-DD", time:"HH:MM"|""}
  if (!prop) return null;
  const v = prop.value.trim();
  let m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(v);
  if (m) {
    if (m[7] === "Z") { const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])); return { date: zz.ymd(d), time: `${zz.pad(d.getHours())}:${zz.pad(d.getMinutes())}` }; }
    return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
  }
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  return m ? { date: `${m[1]}-${m[2]}-${m[3]}`, time: "" } : null;
}
function parseICS(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const evs = []; let cur = null;
  for (const ln of lines) {
    if (ln === "BEGIN:VEVENT") { cur = {}; continue; }
    if (ln === "END:VEVENT") { if (cur) evs.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = ln.indexOf(":"); if (i < 0) continue;
    const k = ln.slice(0, i), name = k.split(";")[0].toUpperCase();
    cur[name] = { params: k, value: icsUnescape(ln.slice(i + 1)) };
  }
  const out = [];
  for (const e of evs) {
    const s = icsDate(e.DTSTART), en = icsDate(e.DTEND); if (!s) continue;
    const uid = e.UID ? e.UID.value : "", desc = e.DESCRIPTION ? e.DESCRIPTION.value : "", title = (e.SUMMARY ? e.SUMMARY.value : "").trim(), room = (e.LOCATION ? e.LOCATION.value : "").trim();
    const code = (/^\s*(\d{3,6})\s*[–—-]/.exec(desc) || /^(?:WS|SS)\d{2}:(\d{3,6}):/.exec(uid) || [])[1] || "";
    const sem = /^(WS|SS)(\d{2})/.exec(uid);
    const semester = sem ? (sem[1] === "WS" ? `WS 20${sem[2]}/${+sem[2] + 1}` : `SS 20${sem[2]}`) : "";
    const exam = /prüfung|pruefung|exam|klausur|test\b/i.test(room + " " + title);
    out.push({ title, code, room, semester, date: s.date, start: s.time, end: en ? en.time : "", type: exam ? "Exam" : "Class", url: e.URL ? e.URL.value : "" });
  }
  return out;
}
function shortName(t) {
  if (t.length <= 24) return t;
  const words = t.split(/\s+/).filter(w => !/^(in|and|of|the|for|to|und|der|die|das|für|&)$/i.test(w));
  return words.map(w => /^[IVX]+$/.test(w) ? " " + w : w[0].toUpperCase()).join("").trim();
}

// ---------- courses ----------
function courses() {
  return dv.pages("#course").where(p => p.file && p.file.path.startsWith(UNI + "/") && p.status !== "removed").array()
    .sort((a, b) => String(a.title || a.file.name).localeCompare(String(b.title || b.file.name)));
}
async function sessionsOf(path) {
  const tb = zz.tableObjects(await zz.read(path), SESS_T);
  if (!tb) return [];
  return tb.rows.filter(r => zz.validYmd(r.date)).map(r => ({ date: r.date.trim(), start: zz.timeStr(r.start), end: zz.timeStr(r.end), room: r.room || "", type: r.type || "Class" })).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}
function courseNote({ title, code, semester, ects, exam, url, sessions }) {
  const q = s => JSON.stringify(s || "");
  const fm = ["---", `title: ${q(title)}`, `short: ${q(shortName(title))}`, `code: ${q(code)}`, "tags: [course]", `semester: ${q(semester)}`, `ects: ${ects || ""}`, `exam_date: ${exam || ""}`, "status: ongoing", "grade:", url ? `url: ${q(url)}` : null, "---"].filter(x => x !== null).join("\n");
  const P = "```dataviewjs\nconst P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith(\"Scripts/home.js\")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? \"\";\nawait dv.view(B + \"Scripts/uni\", {base: B, mode: \"course\"});\n```";
  const table = [zz.makeRow(SESS_H), "|---|---|---|---|---|", ...(sessions || []).map(s => zz.makeRow([s.date, s.start, s.end, s.room, s.type]))].join("\n");
  return `${fm}\n\n# 📘 ${title}\n← [[Uni]]\n\n${P}\n\n## ✅ To-dos\n*This course's to-dos (they also show on Home).*\n\n## 🗒 General notes\n*How the course works: grading, exam format, professor, important links, anything else.*\n- \n\n---\n\n## 📒 Study log\n*Filled by ＋ Log on this page (lectures, self-study, exercises, exam prep). Minutes as a number.*\n\n${[zz.makeRow(LOG_H), "|---|---|---|---|"].join("\n")}\n\n## 🗓 Sessions\n*Filled from the uni timetable. Importing a new timetable file replaces this table. You can also add rows by hand (Type = Class or Exam).*\n\n${table}\n`;
}
async function createCourse(c) {
  const folder = `${UNI}/${zz.safeName(c.title)}`;
  if (zz.getFile(`${folder}/${zz.safeName(c.title)}.md`)) throw new Error(`"${c.title}" already exists`);
  await zz.ensureFolder(`${folder}/Documents`); await zz.ensureFolder(`${folder}/Notes`);
  return await zz.createFile(`${folder}/${zz.safeName(c.title)}.md`, courseNote(c));
}
async function importICS(text) {
  const evs = parseICS(text);
  if (!evs.length) throw new Error("No events found in that file.");
  const groups = new Map();
  for (const e of evs) { const k = e.code || key(e.title); if (!groups.has(k)) groups.set(k, { title: e.title, code: e.code, semester: e.semester, url: e.url, sessions: [] }); groups.get(k).sessions.push(e); }
  const existing = courses();
  const report = [];
  for (const g of groups.values()) {
    g.sessions.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const exam = g.sessions.find(s => s.type === "Exam");
    const found = existing.find(p => (g.code && String(p.code || "") === g.code) || key(p.title || p.file.name) === key(g.title));
    if (found) {
      const mine = await sessionsOf(found.file.path); // keep rows you marked as Exam yourself
      const rows = g.sessions.map(s => [s.date, s.start, s.end, s.room, mine.some(m => m.date === s.date && m.start === s.start && /exam/i.test(m.type)) ? "Exam" : s.type]);
      await zz.write(found.file.path, t => zz.setTable(t, SESS_T, SESS_H, rows, "## 🗓 Sessions"));
      if (exam && (!found.exam_date || found.exam_auto)) await zz.frontmatter(found.file.path, fm => { fm.exam_date = exam.date; fm.exam_auto = true; });
      report.push(`🔄 ${g.title}: ${g.sessions.length} sessions updated`);
    } else {
      const p = await createCourse({ ...g, exam: exam ? exam.date : "", ects: "" });
      if (exam) await zz.frontmatter(p, fm => { fm.exam_auto = true; });
      report.push(`＋ ${g.title}: ${g.sessions.length} sessions${exam ? `, exam ${exam.date}` : ""}`);
    }
  }
  return report;
}

async function studyLog(path) {
  const tb = zz.tableObjects(await zz.read(path), LOG_T);
  return tb ? tb.rows.filter(r => zz.validYmd(r.date)).map(r => ({ line: r._line, raw: r._raw, date: r.date.trim(), what: (r.what || "").trim(), min: zz.n0(r.minutes), note: r.note || "" })).sort((a, b) => b.date.localeCompare(a.date) || b.line - a.line) : [];
}
const hrs = m => (Math.round(m / 6) / 10).toString().replace(".", ",") + " h";

// ---------- DASHBOARD ----------
async function dashboard(r) {
  const page = dv.page(zz.fix(B + "Uni/Uni")) || {};
  const list = courses();
  const today = zz.today(), nowT = `${zz.pad(new Date().getHours())}:${zz.pad(new Date().getMinutes())}`;
  // stats
  const passed = list.filter(c => +c.grade >= 1 && +c.grade <= 4);
  const ects = passed.reduce((s, c) => s + zz.n0(c.ects), 0);
  const avg = ects ? passed.reduce((s, c) => s + zz.n0(c.ects) * zz.n0(c.grade), 0) / ects : null;
  const goalAvg = zz.n0(page.goal_average) || 2.5, need = zz.n0(page.ects_total_needed) || 180;
  const semEcts = list.filter(c => c.status !== "passed").reduce((s, c) => s + zz.n0(c.ects), 0);
  const ws = zz.ymd(zz.weekStart()), logs = new Map();
  for (const c of list) logs.set(c.file.path, await studyLog(c.file.path));
  const weekMin = [...logs.values()].flat().filter(x => x.date >= ws && x.date <= today).reduce((s, x) => s + x.min, 0);
  const goalH = zz.n0(page.study_hours_per_week);
  r.append(h("div", { class: "zz-tiles" },
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Grade average"), h("div", { class: "zz-v " + (avg && avg <= goalAvg ? "zz-ok" : "") }, avg ? avg.toFixed(2) : "—"), h("div", { class: "zz-muted" }, `goal ≤ ${goalAvg}`)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "ECTS passed"), h("div", { class: "zz-v" }, `${ects} / ${need}`), zz.bar(ects / need * 100)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "This semester"), h("div", { class: "zz-v" }, `${list.length} courses`), h("div", { class: "zz-muted" }, `${semEcts} ECTS open`)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "⏱ Studied this week"), h("div", { class: "zz-v" }, hrs(weekMin)), goalH ? zz.bar(weekMin / 60 / goalH * 100) : h("div", { class: "zz-muted" }, "log it on each course page"))));
  // courses
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📚 My courses"));
  if (!list.length) card.append(h("div", { class: "zz-muted" }, "No courses yet. Import your uni timetable below or add one by hand."));
  const grid = h("div", { class: "zz-tiles" });
  for (const c of list) {
    const ses = await sessionsOf(c.file.path);
    const next = ses.find(s => s.type !== "Exam" && (s.date > today || (s.date === today && (s.end || s.start) >= nowT)));
    const exam = ses.find(s => s.type === "Exam") || (c.exam_date ? { date: zz.ymd(zz.toDate(c.exam_date)) } : null);
    const n = exam ? zz.daysUntil(exam.date) : null;
    const removeBtn = zz.confirmBtn("🗑", async () => {
      const folder = c.file.folder, isOwn = folder.split("/").pop() === c.file.name;
      await zz.trash(isOwn ? folder : c.file.path);
      setTimeout(() => render(), 400);
    });
    removeBtn.title = "Remove course: moves its folder to the system trash (click twice)";
    grid.append(h("div", { class: "zz-tile", style: "cursor:default" },
      h("div", { style: "display:flex;justify-content:space-between;gap:6px" }, h("strong", {}, zz.link(c.short || c.title || c.file.name, c.file.path)), removeBtn),
      h("div", { class: "zz-muted" }, [c.code ? "#" + c.code : null, c.ects ? c.ects + " ECTS" : "⏳ ECTS", c.status].filter(Boolean).join(" · ")),
      h("div", {}, next ? `🎓 ${zz.toDate(next.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ${next.start}` : h("span", { class: "zz-muted" }, "no more classes")),
      next && next.room ? h("div", { class: "zz-muted", style: "font-size:.85em" }, "📍 " + next.room) : null,
      exam ? h("div", { class: n !== null && n >= 0 && n <= 21 ? "zz-warn" : "zz-muted" }, `📝 Exam ${exam.date}` + (n !== null ? (n >= 0 ? ` · in ${n} d` : " · done") : "")) : h("div", { class: "zz-muted" }, "📝 exam date ⏳"),
      (() => { const L = logs.get(c.file.path) || []; const tot = L.reduce((s, x) => s + x.min, 0); return tot ? h("div", { class: "zz-muted" }, `⏱ ${hrs(tot)} studied` + (L[0] ? ` · last ${L[0].date.slice(5)}` : "")) : null; })(),
      c.grade ? h("div", { class: "zz-ok" }, "Grade: " + c.grade) : null));
  }
  card.append(grid);
  r.append(card);
  await weekView(r, 0);
  // add / import
  const MK = "uni:" + B, msg = zz.msgEl(MK);
  const fileIn = h("input", { type: "file", accept: ".ics,text/calendar" });
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files && fileIn.files[0]; if (!f) return;
    try { const text = await f.text(); const rep = await importICS(text); zz.say(msg, MK, "✅ " + rep.join(" · ")); setTimeout(() => render(), 500); }
    catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  });
  const vaultIcs = zz.APP.vault.getFiles().filter(f => f.path.startsWith(UNI + "/") && /\.ics$/i.test(f.path));
  const name = h("input", { type: "text", placeholder: "Course name", style: "width:220px" }), code = h("input", { type: "text", placeholder: "Code (opt.)", style: "width:80px" });
  const ectsIn = h("input", { type: "number", placeholder: "ECTS", style: "width:65px" }), examIn = h("input", { type: "date", title: "Exam date (optional)" });
  const addBtn = h("button", { class: "zz-btn", onclick: async () => {
    const t = name.value.trim(); if (!t) return zz.flash(msg, "Course name?", false);
    if (/\|/.test(t)) return zz.flash(msg, "No | in names", false);
    try { await createCourse({ title: t, code: code.value.trim(), semester: page.semester || "", ects: ectsIn.value, exam: examIn.value, sessions: [] }); zz.say(msg, MK, `✅ Created "${t}" with its own folder`); setTimeout(() => render(), 400); }
    catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  } }, "＋ Add course");
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "➕ Add or update courses"),
    h("div", { class: "zz-row" }, h("strong", {}, "📥 Import uni timetable (.ics):"), fileIn),
    vaultIcs.length ? h("div", { class: "zz-row" }, "Or from the vault:", vaultIcs.map(f => h("button", { class: "zz-btn", onclick: async () => { try { const rep = await importICS(await zz.APP.vault.read(f)); zz.say(msg, MK, "✅ " + rep.join(" · ")); setTimeout(() => render(), 500); } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); } } }, "📥 " + f.name))) : null,
    h("div", { class: "zz-muted" }, "Download it from your university's timetable page (export it as .ics). New courses get their own folder (with Documents + Notes); existing ones get their class times updated. Run it again whenever your timetable changes."),
    h("div", { class: "zz-row", style: "margin-top:10px" }, h("strong", {}, "Or by hand:"), name, code, ectsIn, examIn, addBtn),
    h("div", { class: "zz-row" }, msg),
    h("div", { class: "zz-muted" }, "🗑 on a course card (click twice) removes the course: its folder goes to your system trash, so you can still restore it.")));
}

// ---------- WEEK TIMETABLE ----------
async function weekView(r, offset) {
  const ws = zz.weekStart(); ws.setDate(ws.getDate() + 7 * offset);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return zz.ymd(d); });
  const all = [];
  for (const c of courses()) for (const s of await sessionsOf(c.file.path)) if (s.date >= days[0] && s.date <= days[6]) all.push({ ...s, c });
  const card = h("div", { class: "zz-card" });
  const box = h("div", { style: "display:grid;grid-template-columns:repeat(5,minmax(110px,1fr));gap:6px;overflow-x:auto" });
  const wk = days.slice(0, 5).concat(days.slice(5).filter(d => all.some(x => x.date === d)));
  box.style.gridTemplateColumns = `repeat(${wk.length},minmax(110px,1fr))`;
  for (const d of wk) {
    const list = all.filter(x => x.date === d).sort((a, b) => a.start.localeCompare(b.start));
    box.append(h("div", { style: `background:var(--background-primary);border-radius:8px;padding:6px;${d === zz.today() ? "outline:2px solid var(--interactive-accent)" : ""}` },
      h("div", { class: "zz-muted", style: "font-weight:700" }, zz.toDate(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })),
      list.length ? list.map(x => h("div", { style: `margin:4px 0;padding:4px 6px;border-radius:6px;font-size:.85em;background:${x.type === "Exam" ? "color-mix(in srgb,var(--color-red,#d24343) 20%,transparent)" : "var(--background-secondary)"}` },
        h("div", { style: "font-weight:700" }, `${x.start}–${x.end}`), zz.link((x.type === "Exam" ? "📝 " : "") + (x.c.short || x.c.title), x.c.file.path), x.room ? h("div", { class: "zz-muted" }, x.room) : null)) : h("div", { class: "zz-muted", style: "font-size:.85em" }, "free")));
  }
  card.append(h("div", { class: "zz-row" }, h("strong", {}, offset === 0 ? "🗓 This week at uni" : `🗓 Week of ${days[0]}`)), box);
  r.append(card);
}

// ---------- COURSE PAGE ----------
async function coursePage(r) {
  const c = dv.current();
  const ses = await sessionsOf(c.file.path), today = zz.today();
  const upcoming = ses.filter(s => s.date >= today), next = upcoming.find(s => s.type !== "Exam"), exam = ses.find(s => s.type === "Exam");
  const examDate = exam ? exam.date : (c.exam_date ? zz.ymd(zz.toDate(c.exam_date)) : null), n = examDate ? zz.daysUntil(examDate) : null;
  const folder = c.file.folder, own = folder.split("/").pop() === c.file.name;
  r.append(h("div", { class: "zz-tiles" },
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Next class"), h("div", { class: "zz-v", style: "font-size:1.05em" }, next ? zz.toDate(next.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " " + next.start : "—"), h("div", { class: "zz-muted" }, next ? "📍 " + next.room : "")),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Exam"), h("div", { class: "zz-v " + (n !== null && n >= 0 && n <= 21 ? "zz-warn" : "") }, examDate ? (n >= 0 ? `in ${n} d` : "done") : "⏳"), h("div", { class: "zz-muted" }, examDate ? examDate + (exam && exam.room ? " · " + exam.room : "") : "set exam_date")),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Classes left"), h("div", { class: "zz-v" }, String(upcoming.filter(s => s.type !== "Exam").length)), h("div", { class: "zz-muted" }, `of ${ses.filter(s => s.type !== "Exam").length}`)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "ECTS · status"), h("div", { class: "zz-v", style: "font-size:1.05em" }, `${c.ects || "⏳"} · ${c.status || "ongoing"}`), h("div", { class: "zz-muted" }, c.grade ? "grade " + c.grade : ""))));
  // edit
  const st = h("select", {}, ["ongoing", "studying", "exam done", "passed", "failed"].map(x => h("option", { value: x, selected: x === (c.status || "ongoing") }, x)));
  const gr = h("select", {}, ["", "1", "2", "3", "4", "5"].map(x => h("option", { value: x, selected: String(c.grade || "") === x }, x || "grade")));
  const ec = h("input", { type: "number", value: c.ects || "", placeholder: "ECTS", style: "width:65px" }), ex = h("input", { type: "date", value: examDate || "" });
  const MK = "course:" + c.file.path, msg = zz.msgEl(MK);
  const save = async () => { try { await zz.frontmatter(c.file.path, fm => { fm.status = st.value; fm.grade = gr.value ? +gr.value : null; fm.ects = ec.value ? +ec.value : null; if (ex.value) { fm.exam_date = ex.value; fm.exam_auto = false; } }); zz.say(msg, MK, "✅ Saved"); } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); } };
  r.append(h("div", { class: "zz-card" }, h("div", { class: "zz-row" }, "Status", st, "Grade", gr, "ECTS", ec, "Exam", ex, h("button", { class: "zz-btn mod-cta", onclick: save }, "💾"), msg)));
  // ---------- lecture notes: one per class ----------
  const notesRoot = own ? folder : folder + "/" + zz.safeName(c.file.name);
  const files = zz.APP.vault.getFiles().filter(f => f.path.startsWith(folder + "/") && f.path !== c.file.path);
  const mdFiles = files.filter(f => f.extension === "md"), docs = files.filter(f => f.extension !== "md");
  const notePages = dv.pages(`"${notesRoot}/Notes"`).array();
  const short = c.short || c.title || c.file.name;
  const sameDay = d => ses.filter(x => x.date === d).length;
  const noteFor = x => notePages.find(p => p.date && zz.ymd(zz.toDate(p.date)) === x.date && (!p.time || zz.timeStr(p.time) === x.start || sameDay(x.date) === 1));
  const makeNote = async x => {
    const name = `${x.date} ${zz.safeName(short)}` + (x.start && sameDay(x.date) > 1 ? ` ${x.start.replace(":", "-")}` : "");
    const body = `---\ntags: [lecture-note]\ncourse: "[[${c.file.name}]]"\ndate: ${x.date}\n${x.start ? `time: "${x.start}"\n` : ""}${x.room ? `room: ${JSON.stringify(x.room)}\n` : ""}---\n\n# ${short} · ${zz.toDate(x.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${x.start ? " " + x.start : ""}\n← [[${c.file.name}]]\n\n## 🎯 Topic\n\n\n## 🔑 Key points\n- \n\n## ❓ Questions / unclear\n- \n\n## 🔁 Review\n*Summary in 3 lines, written after the lecture (same day).*\n\n`;
    const p = await zz.createFile(`${notesRoot}/Notes/${name}.md`, body);
    zz.APP.workspace.openLinkText(p, "", false);
    return p;
  };
  const used = new Set();
  const ln = h("table", { class: "zz-table" }, h("tr", {}, ["Class", "Room", "Lecture notes"].map(x => h("th", {}, x))));
  const classes = ses.filter(x => x.type !== "Exam");
  const nextIdx = classes.findIndex(x => x.date >= today);
  const shown = classes.filter((x, i) => x.date <= today || i === nextIdx);
  for (const x of shown.slice().reverse()) {
    const p = noteFor(x); if (p) used.add(p.file.path);
    const future = x.date > today;
    ln.append(h("tr", {}, h("td", {}, zz.toDate(x.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + ` ${x.start}` + (future ? " · next" : "")), h("td", { class: "zz-muted" }, x.room),
      h("td", {}, p ? zz.link("📝 " + (p.file.name), p.file.path) : h("button", { class: future ? "zz-btn" : "zz-btn mod-cta", onclick: () => makeNote(x).catch(e => zz.flash(msg, "⚠️ " + e.message, false)) }, future ? "＋ Prepare notes" : "＋ Notes"))));
  }
  const others = mdFiles.filter(f => !used.has(f.path)).sort((a, b) => b.path.localeCompare(a.path));
  const later = classes.length - shown.length;
  r.append(h("div", { class: "zz-card" }, h("h4", {}, `📝 Lecture notes (${mdFiles.length})`),
    classes.length ? h("div", { style: "overflow-x:auto" }, ln) : h("div", { class: "zz-muted" }, "No classes in the timetable yet."),
    later > 0 ? h("div", { class: "zz-muted" }, `${later} more class${later > 1 ? "es" : ""} later in the semester.`) : null,
    others.length ? h("div", { style: "margin-top:6px" }, h("div", { class: "zz-sub" }, "Other notes"), others.map(f => h("div", {}, zz.link(f.basename || f.name.replace(/\.md$/, ""), f.path)))) : null,
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => makeNote({ date: today, start: "", room: "" }).catch(e => zz.flash(msg, "⚠️ " + e.message, false)) }, "＋ Extra note (today)"), h("span", { class: "zz-muted" }, "General notes about the course go in 🗒 General notes below."))));

  // ---------- study log ----------
  const L = await studyLog(c.file.path);
  const ws = zz.ymd(zz.weekStart()), tot = L.reduce((s, x) => s + x.min, 0), wk = L.filter(x => x.date >= ws && x.date <= today).reduce((s, x) => s + x.min, 0);
  const lDate = h("input", { type: "date", value: today }), lWhat = h("select", {}, LOG_KINDS.map(k => h("option", { value: k }, k))), lMin = h("input", { type: "number", min: 5, step: 5, placeholder: "min", style: "width:75px" }), lNote = h("input", { type: "text", placeholder: "What exactly? (chapter, sheet…)", style: "width:200px" });
  const addLog = async () => {
    const m = zz.num(lMin.value);
    if (!zz.validYmd(lDate.value)) return zz.flash(msg, "Pick a date", false);
    if (!(m > 0)) return zz.flash(msg, "How many minutes?", false);
    try { await zz.ensureTable(c.file.path, LOG_T, LOG_H, "## 📒 Study log"); await zz.appendRow(c.file.path, LOG_T, [lDate.value, lWhat.value, Math.round(m), lNote.value.trim()]); zz.say(msg, MK, `✅ Logged ${Math.round(m)} min`); setTimeout(() => render(), 300); }
    catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const byKind = new Map(); L.forEach(x => byKind.set(x.what, (byKind.get(x.what) || 0) + x.min));
  const lt = h("table", { class: "zz-table" }, h("tr", {}, ["Date", "What", "Time", "Note", ""].map(x => h("th", {}, x))));
  L.slice(0, 8).forEach(x => lt.append(h("tr", {}, h("td", {}, x.date), h("td", {}, x.what), h("td", { class: "r" }, x.min + " min"), h("td", { class: "zz-muted" }, x.note), h("td", {}, zz.confirmBtn("✕", async () => { await zz.deleteRow(c.file.path, x.line, x.raw); render(); })))));
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "📒 Study log"),
    h("div", { class: "zz-row" }, lDate, lWhat, lMin, lNote, h("button", { class: "zz-btn mod-cta", onclick: addLog }, "＋ Log")),
    h("div", { class: "zz-row zz-muted" }, `Total ${hrs(tot)} · this week ${hrs(wk)} · ${L.length} entries`, [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => h("span", { class: "zz-chip" }, `${k} ${hrs(v)}`))),
    L.length ? h("div", { style: "overflow-x:auto" }, lt) : h("div", { class: "zz-muted" }, "Nothing logged yet. Log every lecture and study block, it adds up."),
    L.length > 8 ? h("div", { class: "zz-muted" }, `All ${L.length} entries are in the 📒 Study log table at the bottom of this note.`) : null));

  // ---------- documents ----------
  r.append(h("div", { class: "zz-card" }, h("h4", {}, `📎 Documents (${docs.length})`), docs.length ? docs.map(f => h("div", {}, zz.link(f.name, f.path))) : h("div", { class: "zz-muted" }, `Drop PDFs, slides and exercise sheets into ${notesRoot.split("/").pop()}/Documents.`)));
  const exams = ses.filter(x => x.type === "Exam");
  if (exams.length) r.append(h("div", { class: "zz-muted" }, "📝 Exam: " + exams.map(x => `${x.date} ${x.start}–${x.end} · ${x.room}`).join(" · ")));
}

// ---------- RUN ----------
const R = zz.root();
async function render() {
  R.innerHTML = "";
  try {
    if (MODE === "dashboard") await dashboard(R);
    else if (MODE === "course") await coursePage(R);
    else if (MODE === "week") await weekView(R, 0);
    else R.append(h("div", { class: "zz-bad" }, "Unknown mode: " + MODE));
  } catch (e) { R.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + e.message)); }
}
await render();
