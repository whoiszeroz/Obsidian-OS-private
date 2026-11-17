// LIFE OS vault engine · self · don't edit unless you know JavaScript
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

// ===== SELF-IMPROVEMENT: dv.view(base+"Scripts/self", {base, mode}) =====
// modes: habits · habits-today · habits-stats · habits-manage · scorecard
const { h } = zz;
const B = (input && input.base) || "";
const MODE = (input && input.mode) || "habits";
const HABITS = zz.fix(B + "Self-Improvement/Habits.md");
const HLOG = HABITS; // the habit log table lives at the bottom of the Habits note
const HLOG_T = ["Date", "Habit"];
const key = s => String(s || "").trim().toLowerCase();
const yes = s => /^(yes|y|ja|true|1|✅|x|on)$/i.test(String(s || "").trim());

async function loadHabits() {
  const t = await zz.read(HABITS);
  if (t === null) throw new Error("Missing note: " + HABITS);
  const tb = zz.findTable(t, "Habit");
  if (!tb) throw new Error("No table starting with 'Habit' in " + HABITS);
  return tb.rows.filter(r => r.cells[0]).map(r => ({ name: r.cells[0], emoji: r.cells[1] || "", target: Math.max(1, Math.min(7, parseInt(r.cells[2]) || 7)), active: yes(r.cells[3]) }));
}
async function loadHabitLog() {
  const t = await zz.read(HLOG);
  if (t === null) throw new Error("Missing note: " + HLOG);
  const tb = zz.findTable(t, HLOG_T);
  if (!tb) throw new Error("No habit log table (Date | Habit) in " + HLOG);
  return tb.rows.map(r => ({ line: r.line, raw: r.raw, date: (r.cells[0] || "").trim(), habit: (r.cells[1] || "").trim() })).filter(x => zz.validYmd(x.date) && x.habit);
}
const doneSet = log => new Set(log.map(x => x.date + "|" + key(x.habit)));
const weekDays = (offset = 0) => { const s = zz.weekStart(); s.setDate(s.getDate() + offset * 7); return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return zz.ymd(d); }); };
async function toggle(habit, date, log) {
  const hit = log.filter(x => x.date === date && key(x.habit) === key(habit));
  if (hit.length) { for (const x of hit.sort((a, b) => b.line - a.line)) await zz.deleteRow(HLOG, x.line, x.raw); }
  else await zz.appendRow(HLOG, HLOG_T, [date, habit]);
}
const lbl = x => (x.emoji ? x.emoji + " " : "") + x.name;
function weekCount(set, hb, days) { return days.filter(d => set.has(d + "|" + key(hb.name))).length; }
function streakWeeks(set, hb) { // consecutive finished weeks (before this one) where the target was hit
  let n = 0;
  for (let w = -1; w > -53; w--) { if (weekCount(set, hb, weekDays(w)) >= hb.target) n++; else break; }
  if (weekCount(set, hb, weekDays(0)) >= hb.target) n++;
  return n;
}

// ---------- WEEK GRID (click to tick) ----------
function habitsGrid(r, habits, log, compact) {
  const set = doneSet(log), days = weekDays(0), today = zz.today();
  const act = habits.filter(x => x.active);
  const card = h("div", { class: "zz-card" }, h("h4", {}, compact ? "✅ Habits today" : "✅ Habits this week"));
  if (!act.length) { card.append(h("div", { class: "zz-muted" }, "No active habits. Add some in ", zz.link("Habits", HABITS), ".")); return r.append(card); }
  const t = h("table", { class: "zz-table" });
  const showDays = compact ? [today] : days;
  t.append(h("tr", {}, h("th", {}, "Habit"), showDays.map(d => h("th", { style: "text-align:center" + (d === today ? ";color:var(--interactive-accent)" : "") }, compact ? "Today" : zz.toDate(d).toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2))), h("th", { class: "r" }, "Week"), compact ? null : h("th", { class: "r" }, "Streak")));
  let doneAll = 0, needAll = 0;
  for (const hb of act) {
    const c = weekCount(set, hb, days); doneAll += Math.min(c, hb.target); needAll += hb.target;
    const cells = showDays.map(d => {
      const on = set.has(d + "|" + key(hb.name)), future = d > today;
      const b = h("button", { class: "zz-x", style: `font-size:1.15em;${future ? "opacity:.3" : ""}`, title: future ? "Future day" : (on ? "Done: click to undo" : "Click when done"), disabled: future }, on ? "✅" : "⬜");
      b.addEventListener("click", async () => { b.disabled = true; await toggle(hb.name, d, log); await rerun(); });
      return h("td", { style: "text-align:center" }, b);
    });
    t.append(h("tr", {}, h("td", {}, lbl(hb)), cells, h("td", { class: "r " + (c >= hb.target ? "zz-ok" : "") }, `${c}/${hb.target}`), compact ? null : h("td", { class: "r zz-muted" }, `${streakWeeks(set, hb)} wk`)));
  }
  card.append(t, zz.bar(needAll ? doneAll / needAll * 100 : 0, doneAll >= needAll ? "var(--color-green,#2e9e5b)" : undefined),
    h("div", { class: "zz-muted" }, `${Math.round(needAll ? doneAll / needAll * 100 : 0)}% of this week's targets` + (compact ? "" : " · Streak = weeks in a row the target was hit")));
  r.append(card);
}

// ---------- STATS ----------
function habitsStats(r, habits, log) {
  const set = doneSet(log);
  const act = habits.filter(x => x.active);
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📊 Last 4 weeks"));
  const weeks = [-3, -2, -1, 0].map(weekDays);
  const t = h("table", { class: "zz-table" }, h("tr", {}, h("th", {}, "Habit"), weeks.map((w, i) => h("th", { class: "r" }, i === 3 ? "This wk" : zz.toDate(w[0]).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))), h("th", { class: "r" }, "Targets hit")));
  for (const hb of act) {
    const counts = weeks.map(w => weekCount(set, hb, w));
    const hit = counts.slice(0, 3).filter(c => c >= hb.target).length;
    t.append(h("tr", {}, h("td", {}, lbl(hb)), counts.map(c => h("td", { class: "r " + (c >= hb.target ? "zz-ok" : "") }, `${c}/${hb.target}`)), h("td", { class: "r" }, `${hit}/3 weeks`)));
  }
  card.append(act.length ? t : h("div", { class: "zz-muted" }, "No active habits yet."));
  r.append(card);
}

// ---------- MANAGE HABITS ----------
function habitsManage(r, habits, log) {
  const rows = habits.map(x => ({ ...x, orig: x.name, deleted: false }));
  const MK = "hab:" + B, msg = zz.msgEl(MK), tbody = h("tbody");
  function draw() {
    tbody.innerHTML = "";
    rows.forEach(row => {
      if (row.deleted) return;
      const act = h("input", { type: "checkbox", checked: row.active }); act.onchange = () => row.active = act.checked;
      const emo = h("input", { type: "text", value: row.emoji, style: "width:40px" }); emo.oninput = () => row.emoji = emo.value;
      const name = h("input", { type: "text", value: row.name, placeholder: "e.g. Read 20 min", style: "width:180px" }); name.oninput = () => row.name = name.value;
      const tg = h("input", { type: "number", min: 1, max: 7, value: row.target, style: "width:55px" }); tg.oninput = () => row.target = tg.value;
      tbody.append(h("tr", {}, h("td", {}, act), h("td", {}, emo), h("td", {}, name), h("td", {}, tg, " ×/week"), h("td", {}, zz.confirmBtn("✕", () => { row.deleted = true; draw(); zz.flash(msg, "Removed. Click Save to confirm (old ticks stay in the log)"); }))));
    });
  }
  draw();
  const save = async () => {
    const live = rows.filter(x => !x.deleted), names = new Set();
    for (const x of live) {
      const n = String(x.name || "").trim();
      if (!n) return zz.flash(msg, "Every habit needs a name", false);
      if (/\|/.test(n)) return zz.flash(msg, "No | in names", false);
      if (names.has(key(n))) return zz.flash(msg, "Duplicate: " + n, false);
      names.add(key(n));
      const tg = parseInt(x.target); if (!(tg >= 1 && tg <= 7)) return zz.flash(msg, `${n}: times per week must be 1–7`, false);
    }
    const renames = new Map(live.filter(x => x.orig && key(x.orig) !== key(x.name)).map(x => [key(x.orig), String(x.name).trim()]));
    await zz.write(HABITS, text => {
      const t = zz.findTable(text, "Habit");
      const body = live.map(x => zz.makeRow([String(x.name).trim(), x.emoji, parseInt(x.target), x.active ? "yes" : "no"]));
      t.lines.splice(t.start, t.end - t.start, "| Habit | Emoji | Per week | Active |", "|---|---|---|---|", ...body);
      return t.lines.join("\n");
    });
    if (renames.size) await zz.write(HLOG, text => { const t = zz.findTable(text, HLOG_T); if (!t) return text; for (const row of t.rows) { const nn = renames.get(key(row.cells[1])); if (nn) { row.cells[1] = nn; t.lines[row.line] = zz.makeRow(row.cells); } } return t.lines.join("\n"); });
    zz.say(msg, MK, "✅ Saved" + (renames.size ? " · renamed in the log too" : ""));
    await rerun();
  };
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "⚙️ My habits"),
    h("table", { class: "zz-table" }, h("tr", {}, ["On", "", "Habit", "Target", ""].map(x => h("th", {}, x))), tbody),
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { rows.push({ name: "", emoji: "", target: 3, active: true, orig: "", deleted: false }); draw(); } }, "＋ New habit"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg)));
}

// ---------- LIFE GOALS SCORECARD ----------
async function table(path, first) { const t = await zz.read(path); if (t === null) return []; const tb = zz.findTable(t, first); return tb ? tb.rows : []; }
async function scorecard(r) {
  const rows = [];
  const pg = p => dv.page(zz.fix(B + p + ".md"));
  const add = (icon, area, linkTo, goal, now, pc, status, good) => rows.push({ icon, area, linkTo, goal, now, pc, status, good });
  // Uni: weighted grade average
  const courses = dv.pages("#course").where(c => c.ects && c.file.path.startsWith(B)).array();
  const passed = courses.filter(c => +c.grade >= 1 && +c.grade <= 4);
  const ects = passed.reduce((s, c) => s + zz.n0(c.ects), 0);
  const avg = ects ? passed.reduce((s, c) => s + zz.n0(c.ects) * zz.n0(c.grade), 0) / ects : null;
  const uni = pg("Uni/Uni") || {};
  const goalAvg = zz.n0(uni.goal_average) || 2.5;
  add("🎓", "Uni", zz.fix(B + "Uni/Uni.md"), `Average ≤ ${goalAvg}`, avg ? avg.toFixed(2) : "no grades yet", avg ? Math.min(100, goalAvg / avg * 100) : 0, avg ? (avg <= goalAvg ? "on target" : "above target") : "waiting for first grade", avg ? avg <= goalAvg : null);
  add("🎓", "Uni", zz.fix(B + "Uni/Uni.md"), "ECTS toward 180", `${ects}`, ects / 180 * 100, `${Math.round(ects / 180 * 100)}% of the degree`, null);
  // Internships
  const itT = zz.tableObjects(await zz.read(zz.fix(B + "Uni/Internship Tracker.md")), "Company");
  const it = itT ? itT.rows.filter(x => x.company) : [];
  const sent = it.filter(x => /applied|interview|offer|rejected/i.test(x.status || "")).length;
  const goalApps = zz.n0(uni.goal_applications) || 15;
  add("🧑‍💼", "Internship", zz.fix(B + "Uni/Internship Tracker.md"), `${goalApps} applications by summer 2027`, `${sent} sent`, sent / goalApps * 100, it.some(x => /offer/i.test(x.status || "")) ? "🎉 offer!" : `${goalApps - sent} to go`, sent >= goalApps);
  // Business
  const biz = pg("Business/Business") || {};
  if (biz.chosen_option) add("💼", "Business", zz.fix(B + "Business/Business.md"), "Choose ONE business", String(biz.chosen_option), 100, "decided ✅", true);
  else { const n = zz.daysUntil(biz.decision_deadline); add("💼", "Business", zz.fix(B + "Business/Business.md"), "Choose ONE business", "not decided", 0, n === null ? "" : n >= 0 ? `${n} days left` : `${-n} days late`, n !== null && n < 0 ? false : null); }
  // Money: earned income this month (logged Income rows, else planned)
  const catT = zz.tableObjects(await zz.read(zz.fix(B + "Money/Budget Settings.md")), "Category");
  const cats = catT ? catT.rows.filter(x => x.category).map(x => ({ name: x.category, type: (x.type || "").trim().toLowerCase(), budget: zz.n0(x["budget / month"]), goal: zz.n0(x.goal), start: zz.n0(x["already saved"]) })) : [];
  const logT = zz.tableObjects(await zz.read(zz.fix(B + "Money/Expense Log.md")), "Date");
  const log = logT ? logT.rows.map(x => ({ date: (x.date || "").trim(), cat: key(x.category), amount: zz.num(x.amount) })).filter(x => zz.validYmd(x.date) && isFinite(x.amount)) : [];
  const mk = zz.today().slice(0, 7);
  const earned = cats.filter(c => c.type === "income").reduce((s, c) => { const got = log.filter(x => x.cat === key(c.name) && x.date.startsWith(mk)).reduce((a, x) => a + x.amount, 0); return s + (got !== 0 ? got : c.budget); }, 0);
  add("💶", "Money", zz.fix(B + "Money/Money.md"), "€800/month earned by summer 2027", zz.eur0(earned), earned / 2000 * 100, `${Math.round(earned / 2000 * 100)}%`, earned >= 2000);
  const saves = cats.filter(c => c.type === "saving" && c.goal > 0);
  if (saves.length) {
    const bal = c => c.start + log.filter(x => x.cat === key(c.name)).reduce((a, x) => a + x.amount, 0);
    const got = saves.reduce((s, c) => s + Math.min(bal(c), c.goal), 0), need = saves.reduce((s, c) => s + c.goal, 0);
    add("🏦", "Savings", zz.fix(B + "Money/Money.md"), `Savings goals (${zz.eur0(need)})`, zz.eur0(saves.reduce((s, c) => s + bal(c), 0)), got / need * 100, `${saves.filter(c => bal(c) >= c.goal).length}/${saves.length} goals reached`, got >= need);
  }
  // Body
  const body = pg("Body/Body") || {};
  const blT = zz.tableObjects(await zz.read(zz.fix(B + "Body/Body.md")), ["Date", "Weight kg"]);
  const bl = (blT ? blT.rows : []).map(x => ({ date: (x.date || "").trim(), w: zz.num(x["weight kg"]) })).filter(x => zz.validYmd(x.date) && isFinite(x.w)).sort((a, b) => a.date.localeCompare(b.date));
  const wNow = bl.length ? bl[bl.length - 1].w : zz.n0(body.weight_now_kg), wStart = bl.length ? bl[0].w : wNow, wGoal = zz.n0(body.weight_target_kg);
  if (wGoal) add("⚖️", "Body", zz.fix(B + "Body/Body.md"), `Weight ${wGoal} kg`, `${wNow} kg`, wGoal > wStart ? (wNow - wStart) / (wGoal - wStart) * 100 : 100, wNow >= wGoal ? "reached ✅" : `+${zz.round2(wGoal - wNow)} kg to go`, wNow >= wGoal);
  const wlT = zz.tableObjects(await zz.read(zz.fix(B + "Body/Workouts.md")), ["Date", "Session"]);
  const wl = (wlT ? wlT.rows : []).map(x => ({ date: (x.date || "").trim(), s: x.session })).filter(x => zz.validYmd(x.date));
  const target = zz.n0((pg("Body/Workouts") || {}).sessions_per_week) || 2;
  const ws = zz.ymd(zz.weekStart()); const sess = new Set(wl.filter(x => x.date >= ws).map(x => x.date + x.s)).size;
  add("🏋️", "Training", zz.fix(B + "Body/Workouts.md"), `${target} sessions every week`, `${sess} this week`, sess / target * 100, sess >= target ? "minimum hit ✅" : `${target - sess} to go`, sess >= target);
  const golf = pg("Body/Golf") || {};
  if (golf.handicap_start) { const s = zz.n0(golf.handicap_start), n = zz.n0(golf.handicap_now), t = zz.n0(golf.handicap_target) || 9.9; add("⛳", "Golf", zz.fix(B + "Body/Golf.md"), `Handicap < ${Math.ceil(t)}`, String(n), (s - n) / (s - t) * 100, n <= t ? "reached ✅" : `${(n - t).toFixed(1)} to drop`, n <= t); }
  // Social
  const soc = pg("Social Media/Social Media") || {};
  const subs = zz.n0(soc.yt_subscribers), gs = zz.n0(soc.goal_yt_subscribers) || 1000;
  add("📺", "YouTube", zz.fix(B + "Social Media/Social Media.md"), `${gs} subscribers`, String(subs), subs / gs * 100, `${Math.round(subs / gs * 100)}%`, subs >= gs);
  const content = dv.pages(`"${B}Social Media/Content"`).where(p => p.stage).array();
  const pub = content.filter(p => p.stage === "published").length, gv = zz.n0(soc.goal_videos) || 26;
  add("🎬", "Content", zz.fix(B + "Social Media/Social Media.md"), `${gv} videos published`, String(pub), pub / gv * 100, `${content.length - pub} in the pipeline`, pub >= gv);
  // Habits
  try {
    const habits = (await loadHabits()).filter(x => x.active), hl = await loadHabitLog(), set = doneSet(hl), days = weekDays(0);
    const done = habits.reduce((s, hb) => s + Math.min(weekCount(set, hb, days), hb.target), 0), need = habits.reduce((s, hb) => s + hb.target, 0);
    if (need) add("✅", "Habits", HABITS, "Hit weekly habit targets", `${done}/${need}`, done / need * 100, `${Math.round(done / need * 100)}% this week`, done >= need);
  } catch (e) { }
  const card = h("div", { class: "zz-card" }, h("h4", {}, "🎯 Life goals: live scorecard"));
  const t = h("table", { class: "zz-table" }, h("tr", {}, ["Area", "Goal", "Now", "", "Status"].map(x => h("th", {}, x))));
  for (const x of rows) t.append(h("tr", {}, h("td", {}, x.icon + " ", zz.link(x.area, x.linkTo)), h("td", {}, x.goal), h("td", { class: "r" }, x.now), h("td", { style: "width:22%" }, zz.bar(Math.max(0, Math.min(100, x.pc || 0)), x.good ? "var(--color-green,#2e9e5b)" : undefined)), h("td", { class: x.good === true ? "zz-ok" : x.good === false ? "zz-bad" : "zz-muted" }, x.status)));
  card.append(h("div", { style: "overflow-x:auto" }, t), h("div", { class: "zz-muted" }, "Every number comes live from its section. Nothing to type here."));
  r.append(card);
}

// ---------- WEEKLY REVIEWS (one saved note per week) ----------
const REVIEWS = zz.fix(B + "Self-Improvement/Reviews");
function isoWeek(d) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return { y, w: Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7) }; }
async function reviewsView(r) {
  const { y, w } = isoWeek(new Date()), ws = zz.weekStart(), we = new Date(ws); we.setDate(we.getDate() + 6);
  const name = `${y}-W${zz.pad(w)} Weekly Review`, path = `${REVIEWS}/${name}.md`;
  const list = zz.APP.vault.getMarkdownFiles().filter(f => f.path.startsWith(REVIEWS + "/")).sort((a, b) => b.path.localeCompare(a.path));
  const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const MK = "rev:" + B, msg = zz.msgEl(MK);
  const start = async () => {
    try {
      if (!zz.getFile(path)) {
        const src = (await zz.read(zz.fix(B + "Self-Improvement/Weekly Review.md"))) || "";
        const i = src.indexOf("## 2."), body = i >= 0 ? src.slice(i) : "## Update\n\n## Score the week\n\n## Next week\n";
        await zz.createFile(path, `---\ntags: [review]\nweek: "${y}-W${zz.pad(w)}"\nfrom: ${zz.ymd(ws)}\nto: ${zz.ymd(we)}\n---\n\n# 🔁 Week ${w}: ${fmt(ws)} – ${fmt(we)} ${y}\n← [[Weekly Review]]\n\n${body}`);
      }
      zz.APP.workspace.openLinkText(path, "", false);
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const has = list.some(f => f.path === path);
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "📚 My weekly reviews"),
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn mod-cta", onclick: start }, has ? `📝 Open this week's review (week ${w})` : `＋ Start this week's review (week ${w})`), msg),
    list.length ? h("div", {}, list.map(f => h("div", {}, zz.link((f.basename || f.name).replace(/\.md$/, ""), f.path)))) : h("div", { class: "zz-muted" }, "No reviews saved yet. Each Sunday, press the button: it makes a note for that week, so all your weeks are kept in Self-Improvement/Reviews.")));
}

// ---------- RUN ----------
const R = zz.root();
async function rerun() { await render(); }
async function render() {
  R.innerHTML = "";
  try {
    if (MODE === "scorecard") return await scorecard(R);
    if (MODE === "reviews") return await reviewsView(R);
    const habits = await loadHabits(), log = await loadHabitLog();
    if (MODE === "habits") habitsGrid(R, habits, log, false);
    else if (MODE === "habits-today") habitsGrid(R, habits, log, true);
    else if (MODE === "habits-stats") habitsStats(R, habits, log);
    else if (MODE === "habits-manage") habitsManage(R, habits, log);
    else R.append(h("div", { class: "zz-bad" }, "Unknown mode: " + MODE));
  } catch (e) { R.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + e.message)); }
}
await render();
