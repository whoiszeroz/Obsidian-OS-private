// LIFE OS vault engine · fitness · don't edit unless you know JavaScript
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

// ===== BODY: dv.view(base+"Scripts/fitness", {base, mode}) =====
// modes: log · history · progress · plan · week · body-form · body-chart · golf-log · golf-stats
const { h } = zz;
const B = (input && input.base) || "";
const MODE = (input && input.mode) || "log";
const WORK = zz.fix(B + "Body/Workouts.md");       // plan table + workout log live here
const BODY = zz.fix(B + "Body/Body.md");           // weight log lives here
const GOLF = zz.fix(B + "Body/Golf.md");           // golf rounds live here
const BLOG = BODY, GLOG = GOLF;
const PLAN_T = ["Session", "Exercise"], WLOG_T = ["Date", "Session"], BLOG_T = ["Date", "Weight kg"], GLOG_T = ["Date", "Course"];
const PLAN_H = ["Session", "Exercise", "Sets", "Reps", "Rest", "Notes"];
const WLOG_H = ["Date", "Session", "Exercise", "kg", "Reps", "Note"];
const ACT_T = ["Activity", "Emoji"], ACT_H = ["Activity", "Emoji"], ALOG_T = ["Date", "Activity"], ALOG_H = ["Date", "Activity", "Minutes", "Note"];
const DEFAULT_ACTS = [["Judo", "🥋"], ["Calisthenics", "🤸"], ["Snowboard", "🏂"], ["Ski", "⛷"], ["Running", "🏃"], ["Swimming", "🏊"], ["Hiking", "🥾"], ["Bouldering", "🧗"], ["Football", "⚽"], ["Cycling", "🚴"]];
const WNOTE_T = ["Date", "Workout"], WNOTE_H = ["Date", "Workout", "Notes"];
// notes for a whole workout ("How did it go?") live in their own small table in Workouts
async function loadWorkoutNotes() {
  const tb = zz.tableObjects(await zz.read(WORK), WNOTE_T);
  return tb ? tb.rows.filter(r => zz.validYmd(r.date)).map(r => ({ date: r.date.trim(), workout: (r.workout || "").trim(), text: String(r.notes || "").replace(/<br>/g, "\n") })) : [];
}
async function saveWorkoutNote(date, workout, text) {
  const v = String(text || "").trim().replace(/\|/g, "/").replace(/\r?\n/g, "<br>");
  await zz.write(WORK, t => {
    const tb = zz.tableObjects(t, WNOTE_T);
    const rows = tb ? tb.rows.filter(r => zz.validYmd(r.date)).map(r => [r.date.trim(), (r.workout || "").trim(), r.notes || ""]) : [];
    const i = rows.findIndex(r => r[0] === date && key(r[1]) === key(workout));
    if (i >= 0) { if (v) rows[i][2] = v; else rows.splice(i, 1); } else if (v) rows.push([date, workout, v]);
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    return zz.setTable(t, WNOTE_T, WNOTE_H, rows, "## 📝 Workout notes");
  });
}
const key = s => String(s || "").trim().toLowerCase();

// ---------- other activities (judo, calisthenics, snowboard …) ----------
async function loadActs() {
  const tb = zz.tableObjects(await zz.read(WORK), ACT_T);
  const rows = tb ? tb.rows.filter(r => r.activity && !/^-+$/.test(r.activity)).map(r => ({ name: r.activity.trim(), emoji: (r.emoji || "").trim() })) : null;
  return rows && rows.length ? rows : DEFAULT_ACTS.map(([name, emoji]) => ({ name, emoji, dflt: true }));
}
async function loadActLog() {
  const tb = zz.tableObjects(await zz.read(WORK), ALOG_T);
  if (!tb) return [];
  return tb.rows.map(r => ({ line: r._line, raw: r._raw, date: (r.date || "").trim(), activity: (r.activity || "").trim(), minutes: zz.num(r.minutes), note: r.note || "" }))
    .filter(r => zz.validYmd(r.date) && r.activity).sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
}
async function saveActs(acts) {
  await zz.ensureTable(WORK, ACT_T, ACT_H, "## 🤸 Other activities\n*The choices besides your gym sessions in Log a workout. Add or remove rows freely.*");
  await zz.writeTable(WORK, ACT_T, ACT_H, acts.map(a => [a.name, a.emoji]));
}
const actLabel = (acts, name) => { const a = acts.find(x => key(x.name) === key(name)); return (a && a.emoji ? a.emoji + " " : "") + name; };

// ---------- plan ----------
function parseEx(r) {
  const reps = String(r.reps || "").trim(), nums = reps.match(/\d+/g), timed = /\bs\b|sec|min/i.test(reps);
  return { name: r.exercise.replace(/\*\*/g, "").trim(), sets: parseInt(r.sets) || 0, reps, rest: r.rest || "", how: r.notes || "", top: (/max/i.test(reps) || timed || !nums) ? null : +nums[nums.length - 1], timed };
}
async function loadPlan() {
  const tb = zz.tableObjects(await zz.read(WORK), PLAN_T);
  if (!tb) throw new Error("No plan table (Session | Exercise …) in " + WORK);
  const sessions = [];
  for (const r of tb.rows) {
    if (!r.session || !r.exercise) continue;
    let s = sessions.find(x => key(x.name) === key(r.session));
    if (!s) { s = { name: r.session.trim(), key: r.session.trim(), title: r.session.trim(), exercises: [] }; sessions.push(s); }
    s.exercises.push(parseEx(r));
  }
  return sessions;
}
const parseReps = s => (String(s || "").match(/\d+/g) || []).map(Number);
async function loadWorkouts() {
  const tb = zz.tableObjects(await zz.read(WORK), WLOG_T);
  if (!tb) throw new Error("No workout log table (Date | Session …) in " + WORK);
  return tb.rows.map(r => ({ line: r._line, raw: r._raw, date: (r.date || "").trim(), session: (r.session || "").trim(), ex: (r.exercise || "").trim(), kg: zz.num(r.kg), reps: parseReps(r.reps), note: r.note || "" }))
    .filter(r => zz.validYmd(r.date) && r.ex && r.reps.length)
    .sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
}
async function loadBody() {
  const tb = zz.tableObjects(await zz.read(BLOG), BLOG_T);
  if (!tb) throw new Error("No weight log table (Date | Weight kg …) in " + BLOG);
  return tb.rows.map(r => ({ line: r._line, raw: r._raw, date: (r.date || "").trim(), weight: zz.num(r["weight kg"]), pullups: zz.num(r["pull-ups"]), pushups: zz.num(r["push-ups"]), note: r.note || "" }))
    .filter(r => zz.validYmd(r.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
}
const isBW = r => !isFinite(r.kg) || r.kg <= 0;
const e1rm = r => isBW(r) ? r.reps.reduce((a, b) => a + b, 0) : Math.max(...r.reps.map(x => r.kg * (1 + x / 30)));
const fmtSet = r => `${isBW(r) ? "BW" : zz.round2(r.kg) + " kg"} × ${r.reps.join("/")}`;
function increment(name) {
  if (/split squat|lunge/i.test(name)) return 2;
  if (/squat|deadlift|leg press|romanian|rdl|hip thrust/i.test(name)) return 5;
  if (/dumbbell|db\b|lateral|curl|fly/i.test(name)) return 1;
  return 2.5;
}
function suggestion(ex, hist) {
  const last = hist[hist.length - 1];
  if (!last) return { text: "First time: pick a weight you can do with 2–3 reps left", cls: "zz-muted" };
  if (ex.top === null) return { text: ex.timed ? "Hold a bit longer than last time" : "Beat last time's total reps", cls: "zz-muted" };
  const hitAll = last.reps.length >= ex.sets && last.reps.slice(0, ex.sets).every(x => x >= ex.top);
  if (hitAll) return isBW(last) ? { text: `↑ All sets hit ${ex.top}: add weight or a harder variation`, cls: "zz-ok" } : { text: `↑ All sets hit ${ex.top}: go ${zz.round2(last.kg + increment(ex.name))} kg`, cls: "zz-ok" };
  return { text: isBW(last) ? "Same: add a rep where you can" : `Stay at ${zz.round2(last.kg)} kg, add a rep where you can`, cls: "zz-muted" };
}
const histOf = (log, name) => log.filter(r => key(r.ex) === key(name));
function nextSession(plan, log) {
  const rot = plan.filter(s => !/home|backup|optional/i.test(s.name));
  const pool = rot.length ? rot : plan;
  if (!pool.length) return null;
  const last = log.slice().reverse().find(r => pool.some(s => key(s.name) === key(r.session)));
  if (!last) return pool[0];
  const i = pool.findIndex(s => key(s.name) === key(last.session));
  return pool[(i + 1) % pool.length];
}
const perWeek = () => { const p = dv.page(WORK); return zz.n0(p && p.sessions_per_week) || zz.n0(input.target) || 2; };

// ---------- PLAN BUILDER ----------
function planBuilder(r, plan, log) {
  const sessions = plan.map(s => ({ name: s.name, orig: s.name, exercises: s.exercises.map(e => ({ name: e.name, sets: e.sets || "", reps: e.reps, rest: e.rest, notes: e.how })) }));
  const MK = "plan:" + B, msg = zz.msgEl(MK), box = h("div", {});
  const inp = (o, k, w, ph, type = "text") => { const i = h("input", { type, value: o[k] ?? "", placeholder: ph, style: `width:${w}px` }); i.oninput = () => o[k] = i.value; return i; };
  function draw() {
    box.innerHTML = "";
    sessions.forEach((s, si) => {
      const t = h("table", { class: "zz-table" }, h("tr", {}, ["", "Exercise", "Sets", "Reps", "Rest", "Notes", ""].map(x => h("th", {}, x))));
      s.exercises.forEach((e, ei) => {
        const mv = d => () => { const j = ei + d; if (j < 0 || j >= s.exercises.length) return; [s.exercises[ei], s.exercises[j]] = [s.exercises[j], s.exercises[ei]]; draw(); };
        t.append(h("tr", {}, h("td", { style: "white-space:nowrap" }, h("button", { class: "zz-x", onclick: mv(-1), disabled: ei === 0 }, "▲"), h("button", { class: "zz-x", onclick: mv(1), disabled: ei === s.exercises.length - 1 }, "▼")),
          h("td", {}, inp(e, "name", 170, "e.g. Bench Press")), h("td", {}, inp(e, "sets", 45, "3", "number")), h("td", {}, inp(e, "reps", 70, "8–12")), h("td", {}, inp(e, "rest", 70, "90 s")), h("td", {}, inp(e, "notes", 160, "how / cues")),
          h("td", {}, zz.confirmBtn("✕", () => { s.exercises.splice(ei, 1); draw(); }))));
      });
      const smv = d => () => { const j = si + d; if (j < 0 || j >= sessions.length) return; [sessions[si], sessions[j]] = [sessions[j], sessions[si]]; draw(); };
      box.append(h("div", { class: "zz-card", style: "background:var(--background-primary)" },
        h("div", { class: "zz-row" }, h("strong", {}, "Session"), inp(s, "name", 200, "e.g. A – Strength"), h("span", { class: "zz-muted" }, `${s.exercises.length} exercises`),
          h("button", { class: "zz-x", onclick: smv(-1), disabled: si === 0, title: "Move session up" }, "▲"), h("button", { class: "zz-x", onclick: smv(1), disabled: si === sessions.length - 1, title: "Move session down" }, "▼"),
          zz.confirmBtn("🗑 session", () => { sessions.splice(si, 1); draw(); })),
        h("div", { style: "overflow-x:auto" }, t),
        h("button", { class: "zz-btn", onclick: () => { s.exercises.push({ name: "", sets: 3, reps: "8–12", rest: "90 s", notes: "" }); draw(); } }, "＋ Exercise")));
    });
  }
  draw();
  const save = async () => {
    const names = new Set();
    for (const s of sessions) {
      const n = String(s.name || "").trim();
      if (!n) return zz.flash(msg, "Every session needs a name", false);
      if (/\|/.test(n)) return zz.flash(msg, "No | in names", false);
      if (names.has(key(n))) return zz.flash(msg, "Two sessions with the same name: " + n, false); names.add(key(n));
      if (!s.exercises.length) return zz.flash(msg, `Session "${n}" has no exercises`, false);
      for (const e of s.exercises) {
        if (!String(e.name || "").trim()) return zz.flash(msg, `Session "${n}": an exercise has no name`, false);
        if (/\|/.test(e.name + e.reps + e.rest + e.notes)) return zz.flash(msg, "No | characters please", false);
        const st = parseInt(e.sets); if (!(st >= 1 && st <= 20)) return zz.flash(msg, `${e.name}: sets must be 1–20`, false);
      }
    }
    const renames = new Map(sessions.filter(s => s.orig && key(s.orig) !== key(s.name)).map(s => [key(s.orig), String(s.name).trim()]));
    try {
      await zz.writeTable(WORK, PLAN_T, PLAN_H, sessions.flatMap(s => s.exercises.map(e => [String(s.name).trim(), String(e.name).trim(), parseInt(e.sets), e.reps, e.rest, e.notes])));
      const ren = (first, col) => text => { const tb = zz.tableObjects(text, first); if (!tb) return text; const i = tb.keys.indexOf(col); if (i < 0) return text; for (const row of tb.t.rows) { const nn = renames.get(key(row.cells[i])); if (nn) { row.cells[i] = nn; tb.t.lines[row.line] = zz.makeRow(row.cells); } } return tb.t.lines.join("\n"); };
      if (renames.size) { await zz.write(WORK, ren(WLOG_T, "session")); await zz.write(WORK, ren(WNOTE_T, "workout")); }
      zz.say(msg, MK, "✅ Plan saved" + (renames.size ? " · renamed in your log too" : "")); await rerun();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "🛠 My training plan"),
    h("div", { class: "zz-muted" }, "Build your own sessions: name them, add exercises, sets, reps, rest. ▲▼ to reorder. Sessions with 'home' or 'backup' in the name don't count in the A → B rotation."),
    box,
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { sessions.push({ name: "", orig: "", exercises: [{ name: "", sets: 3, reps: "8–12", rest: "90 s", notes: "" }] }); draw(); } }, "＋ New session"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save plan"), msg)));
}

// ---------- LOG FORM ----------
function logForm(r, plan, log, acts) {
  const card = h("div", { class: "zz-card" });
  const date = h("input", { type: "date", value: zz.today() });
  const nxt = nextSession(plan, log);
  const sel = h("select", {},
    plan.length ? h("optgroup", { label: "🏋️ Gym plan" }, plan.map(s => h("option", { value: s.name, selected: nxt && s.name === nxt.name }, s.name))) : null,
    h("optgroup", { label: "🤸 Other activities" }, acts.map(a => h("option", { value: "act:" + a.name, selected: !plan.length && a === acts[0] }, (a.emoji ? a.emoji + " " : "") + a.name)), h("option", { value: "act:+" }, "＋ New activity…")));
  let act = null;
  const body = h("div", {}), MK = "wlog:" + B, msg = zz.msgEl(MK);
  let fields = [];
  function draw() {
    body.innerHTML = ""; fields = []; act = null;
    if (sel.value.startsWith("act:")) {
      const isNew = sel.value === "act:+";
      act = { isNew, name: isNew ? h("input", { type: "text", placeholder: "Activity (e.g. Boxing)", style: "width:160px" }) : sel.value.slice(4),
        emoji: isNew ? h("input", { type: "text", placeholder: "🥊", style: "width:44px" }) : null, min: h("input", { type: "text", inputmode: "numeric", placeholder: "Minutes", style: "width:90px" }) };
      body.append(h("div", { class: "zz-row" }, isNew ? act.name : null, isNew ? act.emoji : null, act.min, h("span", { class: "zz-muted" }, "minutes (optional)")));
      return;
    }
    const s = plan.find(x => x.name === sel.value);
    const t = h("table", { class: "zz-table" }, h("tr", {}, ["Exercise", "Target", "Last time", "Next step", "kg", "Reps", "Note"].map(x => h("th", {}, x))));
    s.exercises.forEach(ex => {
      const hist = histOf(log, ex.name), last = hist[hist.length - 1], sug = suggestion(ex, hist);
      const kg = h("input", { type: "text", inputmode: "decimal", placeholder: last && !isBW(last) ? String(zz.round2(last.kg)) : "kg / BW", style: "width:70px" });
      const reps = h("input", { type: "text", placeholder: `e.g. ${Array(Math.max(1, ex.sets)).fill(ex.top || 10).join(" ")}`, style: "width:110px" });
      const nt = h("input", { type: "text", placeholder: "note", title: "Note for this exercise (e.g. felt heavy, new grip)", style: "width:120px" });
      fields.push({ name: ex.name, kg, reps, note: nt });
      t.append(h("tr", {}, h("td", {}, h("strong", {}, ex.name), ex.how ? h("div", { class: "zz-muted" }, ex.how) : null), h("td", { class: "zz-muted" }, `${ex.sets} × ${ex.reps}` + (ex.rest ? ` · ${ex.rest}` : "")),
        h("td", { class: "zz-muted" }, last ? `${fmtSet(last)} (${last.date.slice(5)})` + (last.note ? ` · ${last.note}` : "") : "—"), h("td", { class: sug.cls }, sug.text), h("td", {}, kg), h("td", {}, reps), h("td", {}, nt)));
    });
    // one free row for an extra exercise
    const xn = h("input", { type: "text", placeholder: "+ extra exercise (optional)", style: "width:170px" }), xk = h("input", { type: "text", placeholder: "kg / BW", style: "width:70px" }), xr = h("input", { type: "text", placeholder: "reps", style: "width:110px" }), xnt = h("input", { type: "text", placeholder: "note", style: "width:120px" });
    fields.push({ extra: xn, kg: xk, reps: xr, note: xnt });
    t.append(h("tr", {}, h("td", {}, xn), h("td", {}), h("td", {}), h("td", {}), h("td", {}, xk), h("td", {}, xr), h("td", {}, xnt)));
    body.append(h("div", { style: "overflow-x:auto" }, t));
  }
  sel.addEventListener("change", draw); draw();
  const save = async () => {
    if (!zz.validYmd(date.value)) return zz.flash(msg, "Pick a valid date", false);
    if (act) {
      const name = act.isNew ? act.name.value.trim() : act.name;
      if (!name) return zz.flash(msg, "Name the activity", false);
      if (/\|/.test(name + wnote.value)) return zz.flash(msg, "No | please", false);
      const m = act.min.value.trim(); if (m && !(zz.num(m) > 0)) return zz.flash(msg, "Minutes must be a number", false);
      try {
        if (act.isNew || acts.some(a => a.dflt)) {
          const list = acts.filter(a => !act.isNew || key(a.name) !== key(name)).map(a => ({ name: a.name, emoji: a.emoji }));
          if (act.isNew) list.push({ name, emoji: act.emoji.value.trim() });
          await saveActs(list);
        }
        await zz.ensureTable(WORK, ALOG_T, ALOG_H, "## 🤸 Activity log\n*Judo, calisthenics, snowboard … (filled by Log a workout). They count as workouts this week.*");
        await zz.appendRow(WORK, ALOG_T, [date.value, name, m ? zz.plain(zz.num(m)) : "", wnote.value.replace(/\n/g, " ").trim()]);
        zz.say(msg, MK, `✅ ${name} saved${m ? ` (${m} min)` : ""}. Nice 💪`); await rerun();
      } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
      return;
    }
    const rows = [];
    for (const f of fields) {
      const name = f.extra ? f.extra.value.trim() : f.name, repsTxt = f.reps.value.trim(), kgTxt = f.kg.value.trim();
      if (!repsTxt && !kgTxt) continue;
      if (!name) return zz.flash(msg, "Give the extra exercise a name", false);
      const reps = parseReps(repsTxt);
      if (!reps.length || repsTxt.replace(/[\d\s,/;x×-]/gi, "") !== "") return zz.flash(msg, `${name}: enter reps like "8 8 7"`, false);
      let kg = "BW";
      if (kgTxt && !/^bw$/i.test(kgTxt)) { const k = zz.num(kgTxt); if (!isFinite(k) || k < 0) return zz.flash(msg, `${name}: kg must be a number (or BW)`, false); kg = zz.plain(k); }
      rows.push([date.value, sel.value, name, kg, reps.join("/"), f.note ? f.note.value.trim() : ""]);
    }
    if (!rows.length) return zz.flash(msg, "Fill in at least one exercise", false);
    try {
      for (const row of rows) await zz.appendRow(WORK, WLOG_T, row);
      if (wnote.value.trim()) await saveWorkoutNote(date.value, sel.value, wnote.value);
      zz.say(msg, MK, `✅ Saved ${rows.length} exercise${rows.length > 1 ? "s" : ""}${wnote.value.trim() ? " + your notes" : ""}. Good session 💪`); await rerun();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const wnote = h("textarea", { rows: 2, style: "width:100%", placeholder: "📝 How did it go? Energy, sleep, pain, what to change next time…" });
  card.append(h("h4", {}, "🏋️ Log a workout"), h("div", { class: "zz-row" }, date, sel, nxt ? h("span", { class: "zz-chip" }, "suggested: " + nxt.name) : null), body, wnote,
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save workout"), msg),
    h("div", { class: "zz-muted" }, "Gym session: reps per set separated by spaces (8 8 7), kg empty or BW = bodyweight. Other activity (judo, snowboard …): just the minutes + how it went. Both count as a workout this week."));
  r.append(card);
}

// ---------- HISTORY (all workouts) ----------
function historyView(r, log, notes, alog = [], acts = []) {
  const groups = [];
  for (const a of alog) groups.push({ k: a.date + "|act|" + a.line, date: a.date, session: actLabel(acts, a.activity), rows: [], act: a });
  for (const x of log) { const k = x.date + "|" + key(x.session); let g = groups.find(y => y.k === k); if (!g) { g = { k, date: x.date, session: x.session, rows: [] }; groups.push(g); } g.rows.push(x); }
  // a note can exist for a day without exercises (e.g. "skipped, sick"): show it too
  for (const n of notes) if (!groups.some(g => !g.act && g.date === n.date && key(g.session) === key(n.workout))) groups.push({ k: n.date + "|" + key(n.workout), date: n.date, session: n.workout, rows: [] });
  groups.sort((a, b) => b.date.localeCompare(a.date));
  const card = h("div", { class: "zz-card" }, h("h4", {}, `📒 All workouts (${groups.filter(g => g.rows.length || g.act).length})`));
  if (!groups.length) { card.append(h("div", { class: "zz-muted" }, "No workouts logged yet.")); return r.append(card); }
  const MK = "whist:" + B, msg = zz.msgEl(MK);
  const item = g => {
    if (g.act) return h("div", { style: "border-bottom:1px solid var(--background-modifier-border);padding:6px 0" },
      h("div", { class: "zz-row", style: "margin:0" }, h("strong", {}, zz.toDate(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })), h("span", { class: "zz-chip" }, g.session),
        h("span", { class: "zz-muted" }, isFinite(g.act.minutes) ? `${g.act.minutes} min` : "activity"),
        zz.confirmBtn("✕", async () => { await zz.deleteRow(WORK, g.act.line, g.act.raw); await rerun(); })),
      g.act.note ? h("div", { style: "font-size:.9em;margin-top:3px;border-left:3px solid var(--interactive-accent);padding-left:8px" }, "📝 " + g.act.note) : null);
    const note = notes.find(n => n.date === g.date && key(n.workout) === key(g.session));
    const box = h("div", {});
    const showNote = () => { box.innerHTML = ""; if (note && note.text) box.append(h("div", { style: "font-size:.9em;margin-top:3px;white-space:pre-wrap;border-left:3px solid var(--interactive-accent);padding-left:8px" }, "📝 " + note.text)); };
    const edit = () => {
      box.innerHTML = "";
      const ta = h("textarea", { rows: 3, style: "width:100%", placeholder: "How did it go? Energy, sleep, pain, what to change…" }); ta.value = note ? note.text : "";
      box.append(ta, h("div", { class: "zz-row" }, h("button", { class: "zz-btn mod-cta", onclick: async () => { try { await saveWorkoutNote(g.date, g.session, ta.value); zz.say(msg, MK, "✅ Note saved"); await rerun(); } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); } } }, "💾 Save note"), h("button", { class: "zz-btn", onclick: showNote }, "Cancel")));
      ta.focus && ta.focus();
    };
    showNote();
    return h("div", { style: "border-bottom:1px solid var(--background-modifier-border);padding:6px 0" },
      h("div", { class: "zz-row", style: "margin:0" }, h("strong", {}, zz.toDate(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })), h("span", { class: "zz-chip" }, g.session),
        h("span", { class: "zz-muted" }, g.rows.length ? `${g.rows.length} exercises · ${g.rows.reduce((s, x) => s + x.reps.length, 0)} sets` : "note only"),
        h("button", { class: "zz-x", title: note ? "Edit the note" : "Add a note to this workout", onclick: edit }, note ? "📝 edit" : "📝 add note"),
        zz.confirmBtn("✕", async () => { for (const x of g.rows.slice().sort((a, b) => b.line - a.line)) await zz.deleteRow(WORK, x.line, x.raw); if (note) await saveWorkoutNote(g.date, g.session, ""); await rerun(); })),
      g.rows.length ? h("div", { class: "zz-muted", style: "font-size:.88em" }, g.rows.map(x => `${x.ex}: ${fmtSet(x)}` + (x.note ? ` (${x.note})` : "")).join(" · ")) : null, box);
  };
  groups.slice(0, 6).forEach(g => card.append(item(g)));
  if (groups.length > 6) card.append(h("details", {}, h("summary", {}, `Older workouts (${groups.length - 6})`), groups.slice(6).map(item)));
  card.append(h("div", { class: "zz-row zz-muted" }, "📝 adds or edits the notes of a workout · ✕ (twice) deletes a whole workout.", msg));
  r.append(card);
}

// ---------- PROGRESS ----------
function progressView(r, plan, log) {
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📈 Strength progress"));
  const names = [...new Set([...plan.flatMap(s => s.exercises.map(e => e.name)), ...log.map(l => l.ex)])].filter(n => histOf(log, n).length);
  if (!names.length) { card.append(h("div", { class: "zz-muted" }, "Log a workout to see progress.")); return r.append(card); }
  const t = h("table", { class: "zz-table" }, h("tr", {}, ["Exercise", "Sessions", "Last", "Best est. 1RM", "Change"].map((x, i) => h("th", { class: i === 1 || i >= 3 ? "r" : "" }, x))));
  for (const n of names) {
    const hist = histOf(log, n), first = e1rm(hist[0]), lastV = e1rm(hist[hist.length - 1]), best = Math.max(...hist.map(e1rm)), bw = isBW(hist[hist.length - 1]), ch = first > 0 ? (lastV - first) / first * 100 : 0;
    t.append(h("tr", {}, h("td", {}, n), h("td", { class: "r" }, hist.length), h("td", { class: "zz-muted" }, `${fmtSet(hist[hist.length - 1])} · ${hist[hist.length - 1].date}`), h("td", { class: "r" }, bw ? `${best} reps total` : `${zz.round2(best).toFixed(1)} kg`), h("td", { class: "r " + (ch > 0 ? "zz-ok" : ch < 0 ? "zz-bad" : "") }, (ch > 0 ? "+" : "") + ch.toFixed(0) + "%")));
  }
  const pick = h("select", {}, names.map(n => h("option", { value: n }, n))), chart = h("div", {});
  const draw = () => { chart.innerHTML = ""; const hist = histOf(log, pick.value); chart.append(zz.lineChart(hist.map(x => ({ x: zz.toDate(x.date), y: zz.round2(e1rm(x)) })), { unit: isBW(hist[hist.length - 1]) ? " reps" : " kg" })); };
  pick.addEventListener("change", draw); draw();
  card.append(h("div", { style: "overflow-x:auto" }, t), h("div", { class: "zz-row" }, "Chart:", pick), chart, h("div", { class: "zz-muted" }, "Est. 1RM = weight × (1 + reps ÷ 30) from your best set. Bodyweight exercises show total reps."));
  r.append(card);
}

// ---------- WEEK ----------
function weekView(r, plan, log, body, alog = []) {
  const ws = zz.ymd(zz.weekStart()), we = new Date(zz.weekStart()); we.setDate(we.getDate() + 6);
  const days = [...new Set([...log.filter(x => x.date >= ws && x.date <= zz.ymd(we)).map(x => x.date + "|" + x.session), ...alog.filter(x => x.date >= ws && x.date <= zz.ymd(we)).map(x => x.date + "|act|" + x.activity)])];
  const target = perWeek(), nxt = nextSession(plan, log);
  const lastW = body.filter(b => isFinite(b.weight)).slice(-1)[0];
  const bp = dv.page(BODY), goalW = bp ? zz.n0(bp.weight_target_kg) : 0;
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "💪 This week"),
    h("div", { class: "zz-tiles" },
      h("div", { class: "zz-tile", onclick: () => zz.APP.workspace.openLinkText(WORK, "", false) }, h("div", { class: "zz-muted" }, "Sessions"), h("div", { class: "zz-v " + (days.length >= target ? "zz-ok" : "") }, `${days.length} / ${target}`), zz.bar(days.length / target * 100, days.length >= target ? "var(--color-green,#2e9e5b)" : undefined)),
      h("div", { class: "zz-tile", onclick: () => zz.APP.workspace.openLinkText(WORK, "", false) }, h("div", { class: "zz-muted" }, "Next session"), h("div", { class: "zz-v", style: "font-size:1.1em" }, nxt ? nxt.name : "—"), h("div", { class: "zz-muted" }, nxt ? `${nxt.exercises.length} exercises` : "build your plan")),
      h("div", { class: "zz-tile", onclick: () => zz.APP.workspace.openLinkText(BODY, "", false) }, h("div", { class: "zz-muted" }, "Weight"), h("div", { class: "zz-v" }, lastW ? `${lastW.weight} kg` : "—"), h("div", { class: "zz-muted" }, goalW ? `goal ${goalW} kg` + (lastW ? ` · ${zz.round2(goalW - lastW.weight) > 0 ? "+" : ""}${zz.round2(goalW - lastW.weight)}` : "") : "")))));
}

function bodyForm(r, body) {
  const date = h("input", { type: "date", value: zz.today() });
  const w = h("input", { type: "text", inputmode: "decimal", placeholder: "Weight kg", style: "width:90px" });
  const pu = h("input", { type: "text", inputmode: "numeric", placeholder: "Max pull-ups", style: "width:100px" });
  const ps = h("input", { type: "text", inputmode: "numeric", placeholder: "Max push-ups", style: "width:100px" });
  const note = h("input", { type: "text", placeholder: "Note", style: "width:140px" });
  const MK = "body:" + B;
  const msg = zz.msgEl(MK);
  const save = async () => {
    if (!zz.validYmd(date.value)) return zz.flash(msg, "Pick a valid date", false);
    const vals = { w: w.value.trim(), pu: pu.value.trim(), ps: ps.value.trim() };
    if (!vals.w && !vals.pu && !vals.ps) return zz.flash(msg, "Enter at least one number", false);
    const W = vals.w ? zz.num(vals.w) : NaN, PU = vals.pu ? zz.num(vals.pu) : NaN, PS = vals.ps ? zz.num(vals.ps) : NaN;
    if (vals.w && (!isFinite(W) || W < 30 || W > 250)) return zz.flash(msg, "Weight looks wrong (kg)", false);
    if (vals.pu && (!isFinite(PU) || PU < 0 || PU % 1)) return zz.flash(msg, "Pull-ups must be a whole number", false);
    if (vals.ps && (!isFinite(PS) || PS < 0 || PS % 1)) return zz.flash(msg, "Push-ups must be a whole number", false);
    try {
      await zz.appendRow(BLOG, BLOG_T, [date.value, vals.w ? zz.plain(W) : "", vals.pu ? PU : "", vals.ps ? PS : "", note.value]);
      const isLatest = !body.some(b => b.date > date.value);
      if (isLatest && zz.getFile(BODY)) await zz.frontmatter(BODY, fm => { if (vals.w) fm.weight_now_kg = W; if (vals.pu) fm.pullups_max = PU; if (vals.ps) fm.pushups_max = PS; });
      zz.say(msg, MK, "✅ Saved" + (isLatest ? " · Body note updated" : ""));
      await rerun();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const last = body.slice().sort((a, b) => a.line - b.line)[body.length - 1];
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "⚖️ Log body numbers"),
    h("div", { class: "zz-row" }, date, w, pu, ps, note, h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg),
    h("div", { class: "zz-muted" }, "Weigh in once a week: same day, morning, before eating. Test pull-ups/push-ups every 4 weeks. Fill in only what you measured."),
    last ? h("div", { class: "zz-row" }, zz.confirmBtn(`↶ Undo last (${last.date})`, async () => { await zz.deleteRow(BLOG, last.line, last.raw); await rerun(); }, "zz-btn")) : null));
}
function bodyChart(r, body) {
  const bp = dv.page(BODY);
  const goal = bp ? zz.n0(bp.weight_target_kg) : NaN;
  const pts = body.filter(b => isFinite(b.weight)).map(b => ({ x: zz.toDate(b.date), y: b.weight }));
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📉 Weight trend"), zz.lineChart(pts, { target: goal || NaN, unit: " kg" }));
  if (pts.length >= 2) {
    const days = zz.daysBetween(zz.ymd(pts[0].x), zz.ymd(pts[pts.length - 1].x));
    const perWeek = days > 0 ? (pts[pts.length - 1].y - pts[0].y) / days * 7 : 0;
    const left = goal - pts[pts.length - 1].y;
    let txt = `Average change: ${perWeek >= 0 ? "+" : ""}${perWeek.toFixed(2)} kg/week.`;
    if (goal && left > 0 && perWeek > 0.05) txt += ` At this pace: goal in ~${Math.ceil(left / perWeek)} weeks.`;
    else if (goal && left > 0) txt += " Not gaining yet: add ~200 kcal/day (see Food).";
    else if (goal && left <= 0) txt += " 🎯 Goal weight reached!";
    card.append(h("div", { class: "zz-muted" }, txt));
  }
  card.append(h("div", { class: "zz-muted" }, "Dashed line = goal weight."));
  r.append(card);
}




// ---------- GOLF ----------
async function loadRounds() {
  const t = await zz.read(GLOG);
  if (t === null) throw new Error("Missing note: " + GLOG);
  const tb = zz.findTable(t, GLOG_T);
  if (!tb) throw new Error("No golf rounds table (Date | Course …) in " + GLOG);
  return tb.rows.map(r => { const [date, course, holes, score, par, counting, hcp, note] = r.cells; return { line: r.line, raw: r.raw, date: (date || "").trim(), course: course || "", holes: parseInt(holes) || 18, score: zz.num(score), par: zz.num(par), counting: /^(yes|y|ja|x|✅|true)$/i.test((counting || "").trim()), hcp: zz.num(hcp), note: note || "" }; })
    .filter(r => zz.validYmd(r.date) && isFinite(r.score))
    .sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
}
function golfForm(r, rounds) {
  const g = dv.page(GOLF);
  const date = h("input", { type: "date", value: zz.today() });
  const course = h("input", { type: "text", placeholder: "Course", style: "width:150px", value: rounds.length ? rounds[rounds.length - 1].course : "" });
  const holes = h("select", {}, h("option", { value: "18" }, "18 holes"), h("option", { value: "9" }, "9 holes"));
  const score = h("input", { type: "text", inputmode: "numeric", placeholder: "Score", style: "width:70px" });
  const par = h("input", { type: "text", inputmode: "numeric", placeholder: "Par", style: "width:60px", value: "72" });
  const counting = h("input", { type: "checkbox" });
  const hcp = h("input", { type: "text", inputmode: "decimal", placeholder: "New hcp (optional)", style: "width:130px" });
  const note = h("input", { type: "text", placeholder: "Note", style: "width:140px" });
  holes.addEventListener("change", () => { if (par.value === "72" && holes.value === "9") par.value = "36"; else if (par.value === "36" && holes.value === "18") par.value = "72"; });
  const MK = "golf:" + B, msg = zz.msgEl(MK);
  const save = async () => {
    if (!zz.validYmd(date.value)) return zz.flash(msg, "Pick a valid date", false);
    const S = zz.num(score.value), P = zz.num(par.value), H = hcp.value.trim() ? zz.num(hcp.value) : NaN;
    if (!(S >= 18 && S <= 200) || S % 1) return zz.flash(msg, "Score must be a whole number", false);
    if (!(P >= 27 && P <= 80)) return zz.flash(msg, "Par looks wrong", false);
    if (hcp.value.trim() && !(H >= -10 && H <= 54)) return zz.flash(msg, "Handicap must be between -10 and 54", false);
    try {
      await zz.appendRow(GLOG, GLOG_T, [date.value, course.value, holes.value, S, P, counting.checked ? "yes" : "no", isFinite(H) ? zz.plain(H) : "", note.value]);
      if (isFinite(H) && zz.getFile(GOLF)) await zz.frontmatter(GOLF, fm => { fm.handicap_now = H; });
      zz.say(msg, MK, `✅ Saved: ${S} (${S - P >= 0 ? "+" : ""}${S - P})` + (isFinite(H) ? ` · handicap now ${H}` : ""));
      await rerun();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "⛳ Log a round"),
    h("div", { class: "zz-row" }, date, course, holes, score, "par", par),
    h("div", { class: "zz-row" }, h("label", {}, counting, " counts for handicap"), hcp, note, h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg),
    h("div", { class: "zz-muted" }, "Enter the new handicap from your club / ÖGV app after a counting round; it updates the Golf note automatically.")));
}
function golfStats(r, rounds) {
  const g = dv.page(GOLF) || {};
  const start = zz.n0(g.handicap_start), now = zz.n0(g.handicap_now), target = zz.n0(g.handicap_target) || 9.9;
  const dl = g.deadline ? zz.daysUntil(g.deadline) : null;
  const pc = start > target ? Math.max(0, Math.min(100, (start - now) / (start - target) * 100)) : 0;
  const full = rounds.filter(x => x.holes === 18);
  const vs = full.map(x => x.score - x.par);
  const last5 = vs.slice(-5);
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
  const fmtVs = v => isFinite(v) ? (v > 0 ? "+" : "") + (Math.round(v * 10) / 10) : "—";
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📈 Golf progress"),
    h("div", { class: "zz-grid" },
      zz.stat("Handicap", String(now || "—"), `start ${start} → goal < ${Math.ceil(target)}`),
      zz.stat("Still to drop", start ? (Math.max(0, now - target)).toFixed(1) : "—", dl !== null ? `${dl} days left · ${(Math.max(0, now - target) / Math.max(1, dl / 30.44)).toFixed(1)}/month needed` : ""),
      zz.stat("Rounds logged", String(rounds.length), `${rounds.filter(x => x.counting).length} counting`),
      zz.stat("Avg vs par (18)", fmtVs(avg(vs)), `last 5: ${fmtVs(avg(last5))} · best ${vs.length ? fmtVs(Math.min(...vs)) : "—"}`)),
    zz.bar(pc, pc >= 100 ? "var(--color-green,#2e9e5b)" : undefined));
  const pts = full.map(x => ({ x: zz.toDate(x.date), y: x.score - x.par }));
  card.append(h("div", { class: "zz-muted", style: "margin-top:6px" }, "Score vs par per 18-hole round (lower is better):"), zz.lineChart(pts, { unit: "" }));
  if (rounds.length) {
    const t = h("table", { class: "zz-table" }, h("tr", {}, ["Date", "Course", "Holes", "Score", "vs par", "Counting", "Hcp", ""].map(x => h("th", {}, x))));
    rounds.slice().reverse().slice(0, 8).forEach(x => t.append(h("tr", {}, h("td", {}, x.date), h("td", {}, x.course), h("td", {}, x.holes), h("td", {}, x.score), h("td", {}, fmtVs(x.score - x.par)), h("td", {}, x.counting ? "✅" : ""), h("td", {}, isFinite(x.hcp) ? x.hcp : ""),
      h("td", {}, zz.confirmBtn("✕", async () => { await zz.deleteRow(GLOG, x.line, x.raw); await rerun(); })))));
    card.append(h("details", {}, h("summary", {}, `Last rounds (${Math.min(8, rounds.length)})`), t));
  }
  r.append(card);
}

// ---------- RUN ----------


// ---------- RUN ----------
const R = zz.root();
async function rerun() { await render(); }
async function render() {
  R.innerHTML = "";
  try {
    if (MODE === "body-form") return bodyForm(R, await loadBody());
    if (MODE === "body-chart") return bodyChart(R, await loadBody());
    if (MODE === "golf-log") return golfForm(R, await loadRounds());
    if (MODE === "golf-stats") return golfStats(R, await loadRounds());
    const plan = await loadPlan();
    const log = await loadWorkouts();
    if (MODE === "log") logForm(R, plan, log, await loadActs());
    else if (MODE === "history") historyView(R, log, await loadWorkoutNotes(), await loadActLog(), await loadActs());
    else if (MODE === "progress") progressView(R, plan, log);
    else if (MODE === "plan") planBuilder(R, plan, log);
    else if (MODE === "week") weekView(R, plan, log, zz.getFile(BODY) ? await loadBody().catch(() => []) : [], await loadActLog());
    else if (MODE === "plan-check") R.append(h("div", { class: "zz-card" }, plan.map(s => h("div", {}, `Session ${s.name}: ${s.exercises.length} exercises`))));
    else R.append(h("div", { class: "zz-bad" }, "Unknown mode: " + MODE));
  } catch (e) { R.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + e.message)); }
}
await render();
