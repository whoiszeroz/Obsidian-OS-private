// LIFE OS vault engine · finance · don't edit unless you know JavaScript
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

// ===== MONEY: dv.view(base+"Scripts/finance", {base, mode}) =====
// modes: page · add · month · mini · accounts · manage · accounts-manage · payments · history · savings · food-week · afford · trips · networth · milestones
const { h } = zz;
const B = (input && input.base) || "";
const MODE = (input && input.mode) || "month";
const SETTINGS = zz.fix(B + "Money/Budget Settings.md");
const LOG = zz.fix(B + "Money/Expense Log.md");
const PAY = zz.fix(B + "Money/Monthly Payments.md");
const HIST = zz.fix(B + "Money/Monthly History.md");
const MONEY = zz.fix(B + "Money/Money.md");
const START = (() => { const s = String((dv.page(MONEY) || {}).tracking_start || "").slice(0, 7); return /^\d{4}-\d{2}$/.test(s) ? s : ""; })();
const nowMonth = () => { const c = zz.today().slice(0, 7); return START && c < START ? START : c; };
const RMARK = "🔁 ", SKIP = " (skipped)", TRANSFER = "Transfer";
const TYPES = ["Expense", "Saving", "Income", "Support"];
const TYPE_LABEL = { Expense: "Expenses", Saving: "Savings", Income: "Earned income", Support: "Support (government, family)" };
const GOALS = zz.fix(B + "Money/Savings Goals.md");
const GOAL_H = ["Goal", "Emoji", "Color", "Per month", "Target", "Deadline", "Already saved", "Saved in"];
const CAT_H = ["Category", "Emoji", "Type", "Group", "Color", "Budget / month", "Goal", "Deadline", "Already saved", "Saved in"];
const ACC_H = ["Account", "Emoji", "Starting balance", "Since", "Default"];
const LOG_H = ["Date", "Category", "Amount", "Account", "Note"];
const PAY_H = ["Name", "Category", "Amount", "Account", "Day", "Start", "Active", "What for"];
const SECTIONS = { add: "➕ Quick add", accounts: "🏦 Accounts", month: "📅 This month", food: "🛒 Food this week", afford: "🤔 Can I afford it?", savings: "🎯 Savings goals", history: "📊 Spending per month", milestones: "🚀 Income milestones", networth: "💎 Net worth" };
const DEFAULT_SECTIONS = ["add", "accounts", "month", "food", "afford", "savings", "history", "milestones", "networth"];
const key = s => String(s || "").trim().toLowerCase();
const normType = s => TYPES.find(t => key(t) === key(s)) || "Expense";
const yes = s => /^(yes|y|ja|true|1|✅|x|on)$/i.test(String(s || "").trim());
const validMonth = s => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(s || "").trim());
const validColor = s => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(s || "").trim()) ? String(s).trim() : "";
const label = c => (c.emoji ? c.emoji + " " : "") + c.name;
const isRec = e => String(e.note || "").startsWith(RMARK);
const isTransfer = e => key(e.cat) === key(TRANSFER);
const planned = c => c.budget > 0 || (c.type === "Saving" && c.goal > 0);
const MONTHS = zz.fix(B + "Money/Months");
const GREEN = "var(--color-green,#2e9e5b)", RED = "var(--color-red,#d24343)", ORANGE = "var(--color-orange,#d98a1c)";

// ---------- loading ----------
let ACCOUNTS = [];
async function loadSettings() {
  const text = await zz.read(SETTINGS);
  if (text === null) throw new Error("Missing note: " + SETTINGS);
  const tb = zz.tableObjects(text, "Category");
  if (!tb) throw new Error("No table starting with 'Category' in " + SETTINGS);
  const cats = tb.rows.filter(r => r.category).map((r, i) => {
    const type = normType(r.type);
    return { name: r.category, emoji: r.emoji || "", type, group: (r.group || "").trim() || TYPE_LABEL[type], color: validColor(r.color) || zz.PALETTE[i % zz.PALETTE.length],
      budget: zz.n0(r["budget / month"]), goal: zz.n0(r.goal), deadline: (r.deadline || "").trim(), start: zz.n0(r["already saved"]), savedIn: (r["saved in"] || "").trim(), order: i };
  });
  const gt = zz.getFile(GOALS) ? zz.tableObjects(await zz.read(GOALS), "Goal") : null;
  if (gt) gt.rows.filter(r => r.goal && !cats.some(c => key(c.name) === key(r.goal))).forEach((r, i) => cats.push({ name: r.goal.trim(), emoji: r.emoji || "", type: "Saving", group: "Savings", color: validColor(r.color) || zz.PALETTE[(cats.length + i) % zz.PALETTE.length],
    budget: zz.n0(r["per month"]), goal: zz.n0(r.target), deadline: (r.deadline || "").trim(), start: zz.n0(r["already saved"]), savedIn: (r["saved in"] || "").trim(), order: cats.length, fromGoals: true }));
  const at = zz.tableObjects(text, "Account");
  ACCOUNTS = at ? at.rows.filter(r => r.account).map(r => ({ name: r.account, emoji: r.emoji || "", startBal: zz.n0(r["starting balance"]), since: zz.validYmd(r.since) ? r.since.trim() : "", def: yes(r.default) })) : [];
  return cats;
}
const defaultAccount = () => (ACCOUNTS.find(a => a.def) || ACCOUNTS[0] || { name: "" }).name;
const accLabel = a => (a.emoji ? a.emoji + " " : "") + a.name;
async function loadLog() {
  const tb = zz.tableObjects(await zz.read(LOG), "Date");
  if (!tb) throw new Error("No table starting with 'Date' in " + LOG);
  const out = [];
  for (const r of tb.rows) {
    const amount = zz.num(r.amount);
    if (!zz.validYmd(r.date) || !isFinite(amount) || !r.category) continue;
    out.push({ line: r._line, raw: r._raw, date: r.date.trim(), cat: r.category.trim(), amount, note: r.note || "", account: (r.account || "").trim() });
  }
  return out;
}
async function loadPayments() {
  const tb = zz.tableObjects(await zz.read(PAY), "Name");
  if (!tb) return [];
  return tb.rows.filter(r => r.name).map(r => ({ name: r.name, cat: (r.category || "").trim(), amount: zz.num(r.amount), account: (r.account || "").trim(), day: /work/i.test(r.day || "") ? 0 : Math.min(31, Math.max(1, parseInt(r.day) || 1)), start: (r.start || "").trim(), active: yes(r.active), what: (r["what for"] || "").trim() }));
}
// bring a table to the current column layout (keeps every value, matched by column name)
async function migrate(path, first, canon) {
  const text = await zz.read(path); if (text === null) return false;
  const tb = zz.tableObjects(text, first); if (!tb) return false;
  const want = canon.map(x => x.toLowerCase());
  if (tb.keys.length === want.length && tb.keys.every((k, i) => k === want[i])) return false;
  const rows = tb.rows.filter(r => r._cells.some(c => c)).map(r => want.map(k => r[k] ?? ""));
  await zz.writeTable(path, first, canon, rows);
  return true;
}
const rowFor = o => LOG_H.map(hh => o[hh.toLowerCase()] ?? "");

// ---------- MONTHLY PAYMENTS (recurring) ----------
function firstWorkday(mk) { const y = +mk.slice(0, 4), hol = zz.holidaysAT(y); for (let d = 1; d <= 10; d++) { const s = `${mk}-${zz.pad(d)}`, wd = zz.toDate(s).getDay(); if (wd !== 0 && wd !== 6 && !hol[s]) return s; } return `${mk}-01`; }
const isPayGroup = g => /monthly payments?/i.test(String(g || ""));
const dayLabel = d => d === 0 ? "1st working day" : String(d);
function dueDate(mk, day) { if (day === 0) return firstWorkday(mk); const [y, m] = mk.split("-").map(Number); const last = new Date(y, m, 0).getDate(); return `${mk}-${zz.pad(Math.min(day, last))}`; }
function missingRecurring(text, pays) {
  const tb = zz.tableObjects(text, "Date");
  if (!tb) return { t: null, rows: [] };
  const today = zz.today(), cur = today.slice(0, 7);
  const have = new Set(tb.rows.filter(r => zz.validYmd(r.date)).map(r => r.date.slice(0, 7) + "|" + key(String(r.note || "").replace(SKIP, ""))));
  const rows = [];
  for (const p of pays) {
    let mk = p.start, guard = 0;
    while (mk <= cur && guard++ < 240) {
      const d = dueDate(mk, p.day), note = RMARK + p.name;
      if (d <= today && !have.has(mk + "|" + key(note))) { rows.push(rowFor({ date: d, category: p.cat, amount: zz.plain(p.amount), account: p.account || defaultAccount(), note })); have.add(mk + "|" + key(note)); }
      mk = zz.addMonths(mk, 1);
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  return { t: tb.t, rows };
}
async function applyRecurring() {
  const pays = (await loadPayments()).filter(p => p.active && isFinite(p.amount) && p.amount !== 0 && p.cat && validMonth(p.start));
  if (!pays.length) return 0;
  const text = await zz.read(LOG);
  if (text === null || !missingRecurring(text, pays).rows.length) return 0;
  let added = 0;
  await zz.write(LOG, cur => {
    const { t, rows } = missingRecurring(cur, pays);
    if (!t || !rows.length) return cur;
    let end = t.end;
    while (end > t.start + 2 && zz.splitRow(t.lines[end - 1]).every(c => c === "")) end--;
    t.lines.splice(end, 0, ...rows.map(zz.makeRow)); added = rows.length;
    return t.lines.join("\n");
  });
  return added;
}

// ---------- stats ----------
function catMap(cats) { const m = new Map(); cats.forEach(c => m.set(key(c.name), c)); return m; }
function monthStats(cats, log, mk) {
  const m = catMap(cats);
  const rows = log.filter(r => r.date.startsWith(mk) && !isTransfer(r));
  const per = new Map(cats.map(c => [key(c.name), 0]));
  const unknown = new Map();
  for (const r of rows) {
    if (m.has(key(r.cat))) per.set(key(r.cat), per.get(key(r.cat)) + r.amount);
    else unknown.set(r.cat, (unknown.get(r.cat) || 0) + r.amount);
  }
  const sumT = (t, f) => cats.filter(c => c.type === t).reduce((s, c) => s + f(c), 0);
  const unknownSum = [...unknown.values()].reduce((a, b) => a + b, 0);
  const st = {
    rows, per, unknown,
    expPlan: sumT("Expense", c => c.budget), expSpent: sumT("Expense", c => per.get(key(c.name))) + unknownSum,
    savePlan: sumT("Saving", c => c.budget), saved: sumT("Saving", c => per.get(key(c.name))),
    incPlan: sumT("Income", c => c.budget) + sumT("Support", c => c.budget),
    incGot: sumT("Income", c => per.get(key(c.name))) + sumT("Support", c => per.get(key(c.name))),
  };
  const eff = c => { const v = per.get(key(c.name)); return v !== 0 ? v : c.budget; };
  st.income = sumT("Income", eff) + sumT("Support", eff);
  st.earned = sumT("Income", eff);
  st.incPending = cats.filter(c => (c.type === "Income" || c.type === "Support") && per.get(key(c.name)) === 0 && c.budget > 0).length;
  st.left = st.income - st.expSpent - st.saved;
  return st;
}
function savingBalance(c, log) { return c.start + log.filter(r => key(r.cat) === key(c.name)).reduce((s, r) => s + r.amount, 0); }
function monthsBetween(a, b) { const d1 = zz.toDate(a), d2 = zz.toDate(b); if (!d1 || !d2) return null; return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + (d2.getDate() - d1.getDate()) / 30.44; }
function accountBalances(cats, log) {
  const cm = catMap(cats), def = defaultAccount();
  const bal = new Map(ACCOUNTS.map(a => [key(a.name), a.startBal]));
  const since = new Map(ACCOUNTS.map(a => [key(a.name), a.since]));
  const addTo = (acc, d, v) => { const k = key(acc); if (!bal.has(k)) return; if (since.get(k) && d < since.get(k)) return; bal.set(k, bal.get(k) + v); };
  for (const r of log) {
    const acc = r.account || def, c = cm.get(key(r.cat));
    if (isTransfer(r)) { addTo(acc, r.date, r.amount); continue; }
    if (!c || c.type === "Expense") addTo(acc, r.date, -r.amount);
    else if (c.type === "Income" || c.type === "Support") addTo(acc, r.date, r.amount);
    else if (c.type === "Saving") { addTo(acc, r.date, -r.amount); if (c.savedIn) addTo(c.savedIn, r.date, r.amount); }
  }
  return bal;
}
async function rewriteEntry(e, fn) {
  await zz.write(LOG, text => {
    const tb = zz.tableObjects(text, "Date"); if (!tb) return text;
    const lines = text.split("\n");
    const i = lines[e.line] === e.raw ? e.line : lines.lastIndexOf(e.raw);
    if (i < 0) return text;
    const cells = zz.splitRow(lines[i]); const idx = n => tb.keys.indexOf(n);
    fn(cells, idx); lines[i] = zz.makeRow(cells);
    return lines.join("\n");
  });
}

// ---------- MONTHLY HISTORY (persisted catalog) ----------
const H_START = "<!-- zz:history:start -->", H_END = "<!-- zz:history:end -->";
function historyMonths(log) { const cur = nowMonth(); const ms = new Set(log.filter(r => !isTransfer(r)).map(r => r.date.slice(0, 7)).filter(m => m <= cur && (!START || m >= START))); ms.add(cur); return [...ms].sort().reverse(); }
const shortMonth = mk => { const [y, m] = mk.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString("en-GB", { month: "short" }) + " " + y; };
function historyMarkdown(cats, log) {
  const cur = zz.today().slice(0, 7), months = historyMonths(log), L = [];
  L.push(`*Updated automatically · last update ${zz.today()} · current month marked 🔄 (still running)*`, "");
  L.push("📒 **Month logs:** " + months.map(mk => `[[${mk} ${zz.monthName(mk)}|${shortMonth(mk)}]]`).join(" · "), "");
  L.push("### Summary per month", "", "| Month | Income | Spent | Budget | vs budget | Saved | Left | Entries |", "|---|---|---|---|---|---|---|---|");
  for (const mk of months) {
    const st = monthStats(cats, log, mk), diff = st.expSpent - st.expPlan;
    L.push(zz.makeRow([shortMonth(mk) + (mk === cur ? " 🔄" : ""), zz.eur(st.income), zz.eur(st.expSpent), zz.eur(st.expPlan), (diff > 0 ? "🔴 +" : "🟢 ") + zz.eur(Math.abs(diff)).replace("−", ""), zz.eur(st.saved), zz.eur(st.left), st.rows.length]));
  }
  const shown = months.slice(0, 12), closed = shown.filter(m => m !== cur), avgOver = closed.length ? closed : shown;
  L.push("", "### Spent per category" + (shown.length > 1 ? " (newest first)" : ""), "");
  L.push("| Category | Group | " + shown.map(m => shortMonth(m) + (m === cur ? " 🔄" : "")).join(" | ") + ` | Ø ${avgOver.length > 1 ? avgOver.length + " months" : "month"} | Budget |`);
  L.push("|---|---|" + shown.map(() => "---|").join("") + "---|---|");
  const stats = new Map(shown.map(m => [m, monthStats(cats, log, m)]));
  const unknown = new Set(); shown.forEach(m => stats.get(m).unknown.forEach((v, k) => unknown.add(k)));
  const lines = [...cats.filter(c => c.type === "Expense").map(c => ({ lbl: label(c), grp: c.group, k: key(c.name), budget: c.budget })), ...[...unknown].map(u => ({ lbl: u + " (not in settings)", grp: "", k: null, name: u, budget: 0 }))];
  const val = (m, x) => { const st = stats.get(m); return x.k !== null ? (st.per.get(x.k) || 0) : (st.unknown.get(x.name) || 0); };
  for (const x of lines) {
    const vals = shown.map(m => val(m, x));
    if (vals.every(v => v === 0) && x.budget === 0) continue;
    L.push(zz.makeRow([x.lbl, x.grp, ...vals.map(v => v ? zz.eur(v) : "–"), zz.eur(avgOver.reduce((s, m) => s + val(m, x), 0) / avgOver.length), zz.eur0(x.budget)]));
  }
  const tot = m => stats.get(m).expSpent;
  L.push(zz.makeRow(["**Total spent**", "", ...shown.map(m => "**" + zz.eur(tot(m)) + "**"), "**" + zz.eur(avgOver.reduce((s, m) => s + tot(m), 0) / avgOver.length) + "**", "**" + zz.eur0(cats.filter(c => c.type === "Expense").reduce((s, c) => s + c.budget, 0)) + "**"]));
  return L.join("\n");
}
async function syncHistory(cats, log) {
  const text = await zz.read(HIST);
  if (text === null) return false;
  const a = text.indexOf(H_START), b = text.indexOf(H_END);
  if (a < 0 || b < a) return false;
  const body = "\n" + historyMarkdown(cats, log) + "\n";
  const strip = s => s.replace(/last update \d{4}-\d{2}-\d{2}/, "");
  if (strip(text.slice(a + H_START.length, b)) === strip(body)) return false;
  await zz.write(HIST, cur => { const i = cur.indexOf(H_START), j = cur.indexOf(H_END); return (i < 0 || j < i) ? cur : cur.slice(0, i + H_START.length) + body + cur.slice(j); });
  return true;
}
const monthLogPath = mk => `${MONTHS}/${mk} ${zz.monthName(mk)}.md`;
const M_START = "<!-- zz:month:start -->", M_END = "<!-- zz:month:end -->";
function monthLogMarkdown(cats, log, mk) {
  const st = monthStats(cats, log, mk), m = catMap(cats), cur = zz.today().slice(0, 7);
  const L = [`*Written automatically from the Expense Log · ${mk === cur ? "month still running 🔄" : "month closed"} · last update ${zz.today()}*`, ""];
  L.push("| Income | Spent | Budget | Saved | Left |", "|---|---|---|---|---|", zz.makeRow([zz.eur(st.income), zz.eur(st.expSpent), zz.eur0(st.expPlan), zz.eur(st.saved), zz.eur(st.left)]), "");
  const rows = cats.filter(c => planned(c) || (st.per.get(key(c.name)) || 0) !== 0);
  if (rows.length) {
    L.push("### Per category", "", "| Category | Type | This month | Budget | Left |", "|---|---|---|---|---|");
    for (const c of rows) { const v = st.per.get(key(c.name)) || 0; L.push(zz.makeRow([label(c), c.type, zz.eur(v), c.budget ? zz.eur0(c.budget) : "–", c.type === "Expense" && c.budget ? zz.eur(c.budget - v) : ""])); }
    for (const [k, v] of st.unknown) L.push(zz.makeRow([k + " (not in settings)", "Expense", zz.eur(v), "–", ""]));
    L.push("");
  }
  const entries = log.filter(e => e.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
  L.push(`### All entries (${entries.length})`, "");
  if (entries.length) { L.push("| Date | Category | Amount | Account | Note |", "|---|---|---|---|---|"); entries.forEach(e => { const c = m.get(key(e.cat)); L.push(zz.makeRow([e.date, c ? label(c) : (isTransfer(e) ? "↔ Transfer" : e.cat), zz.eur(e.amount), e.account || defaultAccount(), e.note])); }); }
  else L.push("*Nothing logged yet.*");
  return L.join("\n");
}
async function syncMonthLogs(cats, log) {
  const cur = zz.today().slice(0, 7);
  const months = new Set(log.filter(e => e.date.slice(0, 7) <= cur && (!START || e.date.slice(0, 7) >= START)).map(e => e.date.slice(0, 7))); if (!START || cur >= START) months.add(cur);
  const strip = t => t.replace(/last update \d{4}-\d{2}-\d{2}/, "");
  for (const mk of months) {
    const p = monthLogPath(mk), body = "\n" + monthLogMarkdown(cats, log, mk) + "\n";
    const text = await zz.read(p);
    if (text === null) {
      await zz.createFile(p, `---\ntitle: "${zz.monthName(mk)}"\ntags: [money, month-log]\nmonth: "${mk}"\n---\n\n# 📒 ${zz.monthName(mk)}\n← [[Money]] · [[Monthly History]]\n\n${M_START}${body}${M_END}\n\n*The part above updates itself from the Expense Log. Write your own notes below.*\n\n## 📝 My notes\n- \n`);
      continue;
    }
    const a = text.indexOf(M_START), b = text.indexOf(M_END);
    if (a < 0 || b < a || strip(text.slice(a + M_START.length, b)) === strip(body)) continue;
    await zz.write(p, t => { const i = t.indexOf(M_START), j = t.indexOf(M_END); return (i < 0 || j < i) ? t : t.slice(0, i + M_START.length) + body + t.slice(j); });
  }
}
function sync() {
  const L = (window.__zzSync = window.__zzSync || {});
  if (L[B]) return L[B];
  L[B] = (async () => {
    try {
      await migrate(LOG, "Date", LOG_H); await migrate(PAY, "Name", PAY_H); await migrate(SETTINGS, "Category", CAT_H);
      await loadSettings();
      await applyRecurring(); const cs = await loadSettings(), lg = await loadLog(); await syncHistory(cs, lg); await syncMonthLogs(cs, lg);
    } catch (e) { console.warn("LIFE OS sync:", e); }
    finally { setTimeout(() => { L[B] = null; }, 0); }
  })();
  return L[B];
}

// ---------- ADD ----------
function addForm(r, cats, log, opts = {}) {
  const card = h("div", { class: "zz-card" });
  const date = h("input", { type: "date", value: zz.today() });
  const sel = h("select", {});
  for (const t of TYPES) {
    const list = cats.filter(c => c.type === t && planned(c) && !isPayGroup(c.group));
    if (!list.length) continue;
    sel.append(h("optgroup", { label: TYPE_LABEL[t] }, list.map(c => h("option", { value: c.name }, label(c)))));
  }
  const payList = cats.filter(c => planned(c) && isPayGroup(c.group));
  if (payList.length) sel.append(h("optgroup", { label: "🔁 Monthly payments (logged automatically)" }, payList.map(c => h("option", { value: c.name }, label(c)))));
  const rest = cats.filter(c => !planned(c));
  if (rest.length) sel.append(h("optgroup", { label: "Not in my budget" }, rest.map(c => h("option", { value: c.name }, label(c)))));
  if (ACCOUNTS.length > 1) sel.append(h("optgroup", { label: "Move money" }, h("option", { value: "__transfer__" }, "↔ Transfer between accounts")));
  if (opts.defaultCat) sel.value = opts.defaultCat;
  const accSel = h("select", { title: "Account" }, ACCOUNTS.map(a => h("option", { value: a.name, selected: a.name === defaultAccount() }, accLabel(a))));
  const toSel = h("select", { title: "To account", style: "display:none" }, ACCOUNTS.map(a => h("option", { value: a.name }, "→ " + accLabel(a))));
  const amt = h("input", { type: "text", inputmode: "decimal", placeholder: "Amount €", style: "width:110px" });
  const note = h("input", { type: "text", placeholder: "Note (shop, what…)", style: "width:170px" });
  const MK = "add:" + B, msg = zz.msgEl(MK);
  sel.addEventListener("change", () => { toSel.style.display = sel.value === "__transfer__" ? "" : "none"; if (sel.value === "__transfer__" && toSel.value === accSel.value) { const o = ACCOUNTS.find(a => a.name !== accSel.value); if (o) toSel.value = o.name; } });
  const add = async () => {
    const a = zz.num(amt.value);
    if (!isFinite(a) || a === 0) return zz.flash(msg, "Enter an amount (e.g. 12,40)", false);
    if (!zz.validYmd(date.value)) return zz.flash(msg, "Pick a valid date", false);
    if (!sel.value) return zz.flash(msg, "Add a category first (Budget Settings)", false);
    try {
      if (sel.value === "__transfer__") {
        if (a <= 0) return zz.flash(msg, "Transfer amount must be positive", false);
        if (accSel.value === toSel.value) return zz.flash(msg, "Pick two different accounts", false);
        await zz.appendRow(LOG, "Date", rowFor({ date: date.value, category: TRANSFER, amount: zz.plain(-a), account: accSel.value, note: `→ ${toSel.value} ${note.value}`.trim() }));
        await zz.appendRow(LOG, "Date", rowFor({ date: date.value, category: TRANSFER, amount: zz.plain(a), account: toSel.value, note: `← ${accSel.value} ${note.value}`.trim() }));
        zz.say(msg, MK, `✅ Moved ${zz.eur(a)}: ${accSel.value} → ${toSel.value}`);
      } else {
        await zz.appendRow(LOG, "Date", rowFor({ date: date.value, category: sel.value, amount: zz.plain(a), account: accSel.value || "", note: note.value }));
        zz.say(msg, MK, `✅ Added ${zz.eur(a)} → ${sel.value}`);
      }
      amt.value = ""; note.value = "";
      if (opts.after) await opts.after();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  amt.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
  note.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
  const manual = log.filter(e => !isRec(e)).sort((a, b) => a.line - b.line);
  const last = manual.length ? manual[manual.length - 1] : null;
  const pair = last && isTransfer(last) ? manual.slice(0, -1).reverse().find(e => isTransfer(e) && e.date === last.date && zz.round2(e.amount) === zz.round2(-last.amount)) : null;
  const undo = last ? zz.confirmBtn(`↶ Undo last (${last.date} · ${pair ? "↔ Transfer" : last.cat} · ${zz.eur(pair ? Math.abs(last.amount) : last.amount)})`, async () => {
    const ok = await zz.deleteRow(LOG, last.line, last.raw);
    if (ok && pair) await zz.deleteRow(LOG, pair.line, pair.raw);
    zz.say(msg, MK, ok ? "↶ Removed last entry" : "Couldn't find that entry", ok);
    if (opts.after) await opts.after();
  }, "zz-btn") : null;
  card.append(h("h4", {}, "➕ Quick add"),
    h("div", { class: "zz-row" }, date, sel, ACCOUNTS.length ? accSel : null, toSel, amt, note, h("button", { class: "zz-btn mod-cta", onclick: add }, "＋ Add"), msg),
    h("div", { class: "zz-muted" }, "Spending, saving and income all go here. Negative amount = refund or money taken out of savings."),
    undo ? h("div", { class: "zz-row" }, undo) : "");
  r.append(card);
}

// ---------- ACCOUNTS ----------
function accountsView(r, cats, log) {
  const card = h("div", { class: "zz-card" }, h("h4", {}, "🏦 Accounts"));
  if (!ACCOUNTS.length) { card.append(h("div", { class: "zz-muted" }, "No accounts yet. Add them in ", zz.link("Budget Settings", SETTINGS), ".")); return r.append(card); }
  const bal = accountBalances(cats, log);
  const total = ACCOUNTS.reduce((s, a) => s + bal.get(key(a.name)), 0);
  card.append(h("div", { class: "zz-tiles" }, ACCOUNTS.map(a => { const v = bal.get(key(a.name)); return h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, accLabel(a) + (a.def ? " · default" : "")), h("div", { class: "zz-v " + (v < 0 ? "zz-bad" : "") }, zz.eur(v)), h("div", { class: "zz-muted" }, a.since ? `since ${a.since}` : "")); }),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Total"), h("div", { class: "zz-v" }, zz.eur(total)), h("div", { class: "zz-muted" }, `${ACCOUNTS.length} accounts`))));
  if (ACCOUNTS.some(a => !a.startBal)) card.append(h("div", { class: "zz-warn" }, "⏳ Some accounts have no starting balance yet: set it in ", zz.link("Budget Settings", SETTINGS), "."));
  r.append(card);
}

// ---------- MONTH ----------
function spendDonut(cats, st) {
  const pv = cats.filter(c => c.type === "Expense" && isPayGroup(c.group)).reduce((s, c) => s + (st.per.get(key(c.name)) || 0), 0);
  const segs = cats.filter(c => c.type === "Expense" && !isPayGroup(c.group)).map(c => ({ label: label(c), value: st.per.get(key(c.name)) || 0, color: c.color, text: zz.eur(st.per.get(key(c.name)) || 0) })).concat(pv ? [{ label: "🔁 Monthly payments", value: pv, color: "#7c3aed", text: zz.eur(pv) }] : []).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const unk = [...st.unknown.values()].reduce((a, b) => a + b, 0);
  if (unk > 0) segs.push({ label: "Not in settings", value: unk, color: "#888", text: zz.eur(unk) });
  return zz.donut(segs.slice(0, 8).concat(segs.length > 8 ? [{ label: `+${segs.length - 8} more`, value: segs.slice(8).reduce((s, x) => s + x.value, 0), color: "#999" }] : []), { center: zz.eur0(st.expSpent), sub: `of ${zz.eur0(st.expPlan)} budget` });
}
function monthView(r, cats, log, mk, rerender, compact = false) {
  const st = monthStats(cats, log, mk);
  const card = h("div", { class: "zz-card" });
  if (!compact) card.append(h("div", { class: "zz-row" },
    h("button", { class: "zz-btn", onclick: () => rerender(zz.addMonths(mk, -1)) }, "←"), h("strong", { style: "min-width:140px;text-align:center" }, zz.monthName(mk)),
    h("button", { class: "zz-btn", onclick: () => rerender(zz.addMonths(mk, 1)) }, "→"),
    mk !== nowMonth() ? h("button", { class: "zz-btn", onclick: () => rerender(nowMonth()) }, "Today") : null,
    zz.getFile(monthLogPath(mk)) ? zz.link("📒 " + zz.monthName(mk) + " log", monthLogPath(mk)) : null));
  else card.append(h("h4", {}, "💶 " + zz.monthName(mk)));
  const incSub = st.incPending === 0 ? `all received` : st.incGot !== 0 ? `${zz.eur0(st.incGot)} received + rest planned` : "planned";
  card.append(h("div", { class: "zz-tiles" },
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Income"), h("div", { class: "zz-v" }, zz.eur0(st.income)), h("div", { class: "zz-muted" }, incSub)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Spent"), h("div", { class: "zz-v " + (st.expSpent > st.expPlan ? "zz-bad" : "") }, zz.eur0(st.expSpent)), h("div", { class: "zz-muted" }, `of ${zz.eur0(st.expPlan)} budget`), zz.bar(st.expPlan ? st.expSpent / st.expPlan * 100 : 0)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Saved"), h("div", { class: "zz-v" }, zz.eur0(st.saved)), h("div", { class: "zz-muted" }, `of ${zz.eur0(st.savePlan)} planned`)),
    h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Budget left"), h("div", { class: "zz-v " + (st.expPlan - st.expSpent < 0 ? "zz-bad" : "zz-ok") }, zz.eur0(st.expPlan - st.expSpent)), h("div", { class: "zz-muted" }, "budget − spent this month"))));
  const body = h("div", { class: "zz-cols" });
  body.append(h("div", {}, spendDonut(cats, st)));
  // grouped expense table
  const t = h("table", { class: "zz-table" });
  const shownCat = c => planned(c) || (st.per.get(key(c.name)) || 0) !== 0;
  const groups = [...new Set(cats.filter(c => c.type === "Expense" && shownCat(c)).map(c => c.group))];
  for (const g of groups) {
    const list = cats.filter(c => c.type === "Expense" && c.group === g && shownCat(c));
    const gs = list.reduce((s, c) => s + (st.per.get(key(c.name)) || 0), 0), gb = list.reduce((s, c) => s + c.budget, 0);
    if (isPayGroup(g)) {
      const due = firstWorkday(mk), paid = gb > 0 && gs >= gb - 0.005, past = due <= zz.today();
      t.append(h("tr", {}, h("th", {}, g), h("th", { class: "r" }, zz.eur(gs)), h("th", { class: "r" }, gb ? "/ " + zz.eur0(gb) : ""), h("th", {}, "")));
      t.append(h("tr", {}, h("td", { colspan: 2, class: "zz-muted", title: list.map(c => `${label(c)} ${zz.eur(c.budget)}`).join("\n") }, `${list.length} payments · ${list.map(c => c.emoji || c.name).join(" ")}`),
        h("td", { class: "r " + (paid ? "zz-ok" : "zz-muted") }, paid ? "✅ paid" : past ? "⏳ not logged yet" : "due " + zz.toDate(due).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })),
        h("td", { class: "zz-muted", style: "font-size:.85em" }, "every 1st working day")));
      continue;
    }
    const shown = compact ? list.filter(c => st.per.get(key(c.name))) : list;
    if (compact && !shown.length) continue;
    t.append(h("tr", {}, h("th", {}, g), h("th", { class: "r" }, zz.eur(gs)), h("th", { class: "r" }, gb ? "/ " + zz.eur0(gb) : ""), h("th", {}, "")));
    for (const c of shown) {
      const v = st.per.get(key(c.name)) || 0, left = c.budget - v, pc = c.budget > 0 ? v / c.budget * 100 : (v > 0 ? 101 : 0);
      t.append(h("tr", {}, h("td", {}, h("span", { class: "zz-sw", style: `background:${c.color};margin-right:6px` }), label(c)), h("td", { class: "r" }, zz.eur(v)),
        h("td", { class: "r " + (left < 0 ? "zz-bad" : "zz-muted") }, !c.budget && v ? "not planned" : c.budget || v ? (left < 0 ? "over " + zz.eur(-left) : zz.eur(left) + " left") : ""), h("td", { style: "width:22%" }, zz.bar(pc))));
    }
  }
  body.append(h("div", { style: "overflow-x:auto" }, t));
  card.append(body);
  const over = cats.filter(c => c.type === "Expense" && c.budget > 0 && (st.per.get(key(c.name)) || 0) > c.budget);
  const unplanned = cats.filter(c => c.type === "Expense" && !c.budget && (st.per.get(key(c.name)) || 0) > 0);
  if (over.length) card.append(h("div", { class: "zz-bad" }, "⚠️ Over budget: " + over.map(label).join(", ")));
  if (unplanned.length && !compact) card.append(h("div", { class: "zz-muted" }, "Spent without a budget: " + unplanned.map(label).join(", ") + ". Give them a budget in ", zz.link("Budget Settings", SETTINGS), " if they're regular."));
  if (st.unknown.size) card.append(h("div", { class: "zz-warn" }, "⚠️ Category not in Budget Settings (counted as spending): " + [...st.unknown.entries()].map(([k, v]) => `${k} ${zz.eur(v)}`).join(", ")));
  if (!compact) {
    for (const tp of ["Saving", "Income", "Support"]) {
      const list = cats.filter(c => c.type === tp && (planned(c) || (st.per.get(key(c.name)) || 0) !== 0)); if (!list.length) continue;
      const tt = h("table", { class: "zz-table" }, h("tr", {}, h("th", {}, TYPE_LABEL[tp]), h("th", { class: "r" }, "This month"), h("th", { class: "r" }, "Plan"), h("th", {}, "")));
      list.forEach(c => { const v = st.per.get(key(c.name)) || 0, pc = c.budget ? v / c.budget * 100 : 0; tt.append(h("tr", {}, h("td", {}, label(c)), h("td", { class: "r" }, zz.eur(v)), h("td", { class: "r zz-muted" }, zz.eur0(c.budget)), h("td", { style: "width:22%" }, zz.bar(pc, pc >= 100 ? GREEN : undefined)))); });
      card.append(tt);
    }
    const m = catMap(cats);
    const entries = log.filter(e => e.date.startsWith(mk)).sort((a, b) => b.date.localeCompare(a.date) || b.line - a.line);
    const et = h("table", { class: "zz-table" }, h("tr", {}, ["Date", "Category", "Amount", ACCOUNTS.length ? "Account" : null, "Note", ""].filter(x => x !== null).map(x => h("th", {}, x))));
    entries.forEach(e => {
      const c = m.get(key(e.cat));
      const amt = h("input", { type: "text", inputmode: "decimal", value: String(zz.round2(e.amount)).replace(".", ","), style: "width:80px;text-align:right", title: "Change the amount and press Enter" });
      const saveAmt = async () => { const v = zz.num(amt.value); if (!isFinite(v)) { amt.style.outline = "2px solid " + RED; return; } if (zz.round2(v) === zz.round2(e.amount)) return; await rewriteEntry(e, (cells, idx) => { cells[idx("amount")] = zz.plain(v); }); await rerender(mk); };
      amt.addEventListener("keydown", ev => { if (ev.key === "Enter") saveAmt(); }); amt.addEventListener("change", saveAmt);
      const del = isRec(e)
        ? (e.note.endsWith(SKIP) ? h("span", { class: "zz-muted" }, "skipped") : zz.confirmBtn("✕", async () => { await rewriteEntry(e, (cells, idx) => { cells[idx("amount")] = "0"; cells[idx("note")] = e.note + SKIP; }); await rerender(mk); }))
        : zz.confirmBtn("✕", async () => { await zz.deleteRow(LOG, e.line, e.raw); await rerender(mk); });
      if (isRec(e)) del.title = "Automatic monthly payment: ✕ sets it to 0 for this month (skipped)";
      et.append(h("tr", {}, h("td", {}, e.date), h("td", {}, c ? label(c) : (isTransfer(e) ? "↔ Transfer" : e.cat)), h("td", { class: "r" }, amt, " €"), ACCOUNTS.length ? h("td", { class: "zz-muted" }, e.account || defaultAccount()) : null, h("td", { class: "zz-muted" }, e.note), h("td", {}, del)));
    });
    card.append(h("details", {}, h("summary", {}, `All entries this month (${entries.length})`), entries.length ? et : h("div", { class: "zz-muted" }, "No entries yet.")));
  }
  r.append(card);
}

// ---------- MANAGE CATEGORIES ----------
function manageView(r, cats, log, rerender) {
  const card = h("div", { class: "zz-card" });
  const counts = new Map(); log.forEach(e => counts.set(key(e.cat), (counts.get(key(e.cat)) || 0) + 1));
  const rows = cats.filter(c => !c.fromGoals).map(c => ({ ...c, orig: c.name, deleted: false }));
  const hasSave = rows.some(x => x.type === "Saving");
  const MK = "manage:" + B, msg = zz.msgEl(MK), tbody = h("tbody");
  const groupsList = h("datalist", { id: "zz-groups" });
  const inp = (v, w, ph) => h("input", { type: "text", value: v === 0 ? "0" : (v || ""), placeholder: ph || "", style: `width:${w}px` });
  function draw() {
    tbody.innerHTML = ""; groupsList.innerHTML = "";
    [...new Set(rows.filter(x => !x.deleted).map(x => x.group).filter(Boolean))].forEach(g => groupsList.append(h("option", { value: g })));
    const live = rows.filter(x => !x.deleted);
    live.forEach((row, li) => {
      const name = inp(row.name, 140, "Name"), emo = inp(row.emoji, 36, "🙂"), grp = h("input", { type: "text", value: row.group || "", list: "zz-groups", placeholder: "Group", style: "width:110px" });
      const col = h("input", { type: "color", value: validColor(row.color) && row.color.length === 7 ? row.color : "#4f8cff", style: "width:34px;padding:0;border:none" });
      const bud = inp(row.budget, 64, "€/month"), goal = inp(row.goal || "", 64, "goal €"), dl = inp(row.deadline, 96, "YYYY-MM-DD"), st = inp(row.start || "", 60, "€");
      const type = h("select", {}, TYPES.filter(t => t !== "Saving" || row.type === "Saving").map(t => h("option", { value: t, selected: t === row.type }, t)));
      const into = h("select", {}, h("option", { value: "" }, "—"), ACCOUNTS.map(a => h("option", { value: a.name, selected: key(a.name) === key(row.savedIn) }, a.name)));
      name.oninput = () => row.name = name.value; emo.oninput = () => row.emoji = emo.value; grp.oninput = () => row.group = grp.value; col.oninput = () => row.color = col.value;
      bud.oninput = () => row.budget = bud.value; goal.oninput = () => row.goal = goal.value; dl.oninput = () => row.deadline = dl.value; st.oninput = () => row.start = st.value; into.onchange = () => row.savedIn = into.value;
      type.onchange = () => { row.type = type.value; draw(); };
      const step = d => () => { const v = Math.max(0, zz.round2(zz.n0(bud.value) + d)); bud.value = String(v); row.budget = v; };
      const move = d => () => { const i = rows.indexOf(row), j = (() => { let k = i + d; while (k >= 0 && k < rows.length && rows[k].deleted) k += d; return k; })(); if (j < 0 || j >= rows.length) return; [rows[i], rows[j]] = [rows[j], rows[i]]; draw(); };
      const isSave = row.type === "Saving", n = counts.get(key(row.orig)) || 0;
      tbody.append(h("tr", {},
        h("td", { style: "white-space:nowrap" }, h("button", { class: "zz-x", title: "Move up", onclick: move(-1), disabled: li === 0 }, "▲"), h("button", { class: "zz-x", title: "Move down", onclick: move(1), disabled: li === live.length - 1 }, "▼")),
        h("td", {}, col), h("td", {}, emo), h("td", {}, name), h("td", {}, type), h("td", {}, grp),
        h("td", { style: "white-space:nowrap" }, h("button", { class: "zz-x", title: "−10", onclick: step(-10) }, "−"), bud, h("button", { class: "zz-x", title: "+10", onclick: step(10) }, "+")),
        hasSave ? [h("td", {}, isSave ? goal : ""), h("td", {}, isSave ? dl : ""), h("td", {}, isSave ? st : ""), h("td", {}, isSave && ACCOUNTS.length ? into : "")] : null,
        h("td", { class: "zz-muted" }, n ? n + " entries" : ""),
        h("td", {}, zz.confirmBtn("✕", () => { row.deleted = true; draw(); zz.flash(msg, `Removed "${row.name}". Click Save to confirm` + (n ? ` (its ${n} entries stay)` : ""), true); }))));
    });
  }
  draw();
  const save = async () => {
    const live = rows.filter(x => !x.deleted), names = new Set();
    for (const x of live) {
      const nm = String(x.name || "").trim();
      if (!nm) return zz.flash(msg, "Every category needs a name", false);
      if (/\|/.test(nm)) return zz.flash(msg, `"${nm}": no | in names`, false);
      if (key(nm) === key(TRANSFER)) return zz.flash(msg, `"${TRANSFER}" is reserved for moving money between accounts`, false);
      if (names.has(key(nm))) return zz.flash(msg, `Duplicate name: ${nm}`, false);
      names.add(key(nm));
      for (const [f, v] of [["budget", x.budget], ["goal", x.goal], ["already saved", x.start]]) if (String(v ?? "").trim() !== "" && !isFinite(zz.num(v))) return zz.flash(msg, `${nm}: ${f} must be a number`, false);
      if (x.type === "Saving" && String(x.deadline || "").trim() && !zz.validYmd(x.deadline)) return zz.flash(msg, `${nm}: deadline must be YYYY-MM-DD`, false);
    }
    const renames = new Map(live.filter(x => x.orig && key(x.orig) !== key(x.name)).map(x => [key(x.orig), String(x.name).trim()]));
    try {
      await zz.writeTable(SETTINGS, "Category", CAT_H, live.map(x => [String(x.name).trim(), x.emoji, x.type, x.group || "", validColor(x.color), zz.n0(x.budget),
        x.type === "Saving" && zz.n0(x.goal) ? zz.n0(x.goal) : "", x.type === "Saving" ? (x.deadline || "") : "", x.type === "Saving" && zz.n0(x.start) ? zz.n0(x.start) : "", x.type === "Saving" ? (x.savedIn || "") : ""]));
      if (renames.size) {
        const ren = async (path, first, col) => { if (!zz.getFile(path)) return; await zz.write(path, text => { const tb = zz.tableObjects(text, first); if (!tb) return text; const i = tb.keys.indexOf(col); for (const row of tb.t.rows) { const nn = renames.get(key(row.cells[i])); if (nn) { row.cells[i] = nn; tb.t.lines[row.line] = zz.makeRow(row.cells); } } return tb.t.lines.join("\n"); }); };
        await ren(PAY, "Name", "category"); await ren(LOG, "Date", "category");
      }
      zz.say(msg, MK, "✅ Saved" + (renames.size ? ` · renamed in the log + payments too` : ""));
      await rerender();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const plan = t => cats.filter(c => c.type === t).reduce((s, c) => s + c.budget, 0);
  const inc = plan("Income") + plan("Support"), out = plan("Expense") + plan("Saving");
  card.append(h("h4", {}, "⚙️ Categories, groups & budgets"), groupsList,
    h("div", { style: "overflow-x:auto" }, h("table", { class: "zz-table" }, h("tr", {}, ["Order", "Colour", "", "Name", "Type", "Group", "€ / month", ...(hasSave ? ["Goal €", "Deadline", "Saved", "Saved in"] : []), "", ""].map(x => h("th", {}, x))), tbody)),
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { rows.push({ name: "", emoji: "", type: "Expense", group: "", color: zz.PALETTE[rows.length % zz.PALETTE.length], budget: 0, goal: 0, deadline: "", start: 0, savedIn: "", orig: "", deleted: false }); draw(); } }, "＋ New category"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg),
    h("div", { class: "zz-muted" }, `Planned income ${zz.eur0(inc)} − budgets ${zz.eur0(plan("Expense"))} − savings ${zz.eur0(plan("Saving"))} = `, h("strong", { class: inc - out < 0 ? "zz-bad" : "zz-ok" }, zz.eur0(inc - out)), inc - out < 0 ? " ⚠️ plan spends more than comes in" : " unplanned buffer"),
    h("div", { class: "zz-muted" }, "▲▼ order · colour = used in charts · Group = how categories are bundled on the Money page (e.g. Fixed, Living, Fun) · − / + = €10 · Saved in = the account savings go to. Renaming also renames old entries."));
  r.append(card);
}

// ---------- MANAGE ACCOUNTS ----------
function accountsManage(r, cats, log, rerender) {
  const nowBal = accountBalances(cats, log);
  const rows = ACCOUNTS.map(a => ({ ...a, orig: a.name, deleted: false, cur: nowBal.get(key(a.name)), now: "" }));
  const MK = "acc:" + B, msg = zz.msgEl(MK), tbody = h("tbody");
  const used = new Map(); log.forEach(e => { const k = key(e.account || defaultAccount()); used.set(k, (used.get(k) || 0) + 1); });
  function draw() {
    tbody.innerHTML = "";
    rows.forEach(row => {
      if (row.deleted) return;
      const emo = h("input", { type: "text", value: row.emoji, style: "width:36px" }), name = h("input", { type: "text", value: row.name, placeholder: "e.g. Bank, Cash, Revolut", style: "width:140px" });
      const bal = h("input", { type: "text", inputmode: "decimal", value: row.startBal ? String(row.startBal).replace(".", ",") : "", placeholder: "€", style: "width:90px" });
      const curTxt = row.cur !== undefined ? String(zz.round2(row.cur)).replace(".", ",") : "";
      const nowIn = h("input", { type: "text", inputmode: "decimal", value: row.now !== "" ? row.now : curTxt, placeholder: "€", style: "width:100px;font-weight:600" });
      nowIn.oninput = () => row.now = nowIn.value;
      const since = h("input", { type: "date", value: row.since || "" }), def = h("input", { type: "radio", name: "zz-defacc", checked: row.def });
      emo.oninput = () => row.emoji = emo.value; name.oninput = () => row.name = name.value; bal.oninput = () => row.startBal = bal.value; since.onchange = () => row.since = since.value;
      def.onchange = () => rows.forEach(x => x.def = x === row);
      const n = used.get(key(row.orig)) || 0;
      tbody.append(h("tr", {}, h("td", {}, emo), h("td", {}, name), h("td", {}, nowIn), h("td", { style: "text-align:center" }, def), h("td", { class: "zz-muted" }, n ? n + " entries" : ""), h("td", {}, zz.confirmBtn("✕", () => { row.deleted = true; draw(); }))));
    });
  }
  draw();
  const save = async () => {
    const live = rows.filter(x => !x.deleted), names = new Set();
    for (const x of live) {
      const nm = String(x.name || "").trim();
      if (!nm) return zz.flash(msg, "Every account needs a name", false);
      if (/\|/.test(nm)) return zz.flash(msg, "No | in names", false);
      if (names.has(key(nm))) return zz.flash(msg, "Duplicate: " + nm, false); names.add(key(nm));
      if (String(x.startBal ?? "").trim() !== "" && !isFinite(zz.num(x.startBal))) return zz.flash(msg, `${nm}: starting balance must be a number`, false);
      if (String(x.now ?? "").trim() !== "" && !isFinite(zz.num(x.now))) return zz.flash(msg, `${nm}: "right now" must be a number`, false);
    }
    // "Right now" typed → shift the starting balance so the account shows exactly that amount today
    for (const x of live) {
      if (String(x.now ?? "").trim() === "") continue;
      const want = zz.num(x.now);
      if (x.cur !== undefined && Math.abs(want - zz.round2(x.cur)) < 0.005) continue;
      if (x.cur === undefined || !x.orig) { x.startBal = want; x.since = x.since || zz.today(); continue; }
      const startChanged = zz.n0(x.startBal) - zz.n0(ACCOUNTS.find(a => a.name === x.orig)?.startBal);
      x.startBal = zz.round2(zz.n0(x.startBal) + (want - (x.cur + startChanged)));
    }
    if (live.length && !live.some(x => x.def)) live[0].def = true;
    const renames = new Map(live.filter(x => x.orig && key(x.orig) !== key(x.name)).map(x => [key(x.orig), String(x.name).trim()]));
    try {
      await zz.writeTable(SETTINGS, "Account", ACC_H, live.map(x => [String(x.name).trim(), x.emoji, zz.n0(x.startBal), x.since || "", x.def ? "yes" : ""]), "## 🏦 Accounts");
      if (renames.size) {
        const ren = async (path, first, col) => { if (!zz.getFile(path)) return; await zz.write(path, text => { const tb = zz.tableObjects(text, first); if (!tb) return text; const i = tb.keys.indexOf(col); if (i < 0) return text; for (const row of tb.t.rows) { const nn = renames.get(key(row.cells[i])); if (nn) { row.cells[i] = nn; tb.t.lines[row.line] = zz.makeRow(row.cells); } } return tb.t.lines.join("\n"); }); };
        await ren(LOG, "Date", "account"); await ren(PAY, "Name", "account"); await ren(SETTINGS, "Category", "saved in");
      }
      zz.say(msg, MK, "✅ Accounts saved"); await rerender();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "🏦 My accounts"),
    h("table", { class: "zz-table" }, h("tr", {}, ["", "Account", "💰 I have right now", "Default", "", ""].map(x => h("th", {}, x))), tbody),
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { rows.push({ name: "", emoji: "", startBal: "", since: zz.today(), def: false, orig: "", deleted: false }); draw(); } }, "＋ New account"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg),
    h("div", { class: "zz-muted" }, "Type what's really in each account right now → 💾 Save. That's the number you'll see everywhere, and every entry you add after that changes it. Default = pre-selected in Quick add.")));
}

// ---------- PAYMENTS EDITOR ----------
async function paymentsView(r, cats, log, rerender) {
  const card = h("div", { class: "zz-card" });
  if (!zz.getFile(PAY)) { card.append(h("div", { class: "zz-bad" }, "Missing note: " + PAY)); return r.append(card); }
  const rows = (await loadPayments()).map(p => ({ ...p, amount: isFinite(p.amount) ? p.amount : "", deleted: false }));
  const MK = "pay:" + B, msg = zz.msgEl(MK), tbody = h("tbody"), cm = catMap(cats), curMonth = zz.today().slice(0, 7);
  function draw() {
    tbody.innerHTML = "";
    rows.forEach(row => {
      if (row.deleted) return;
      const name = h("input", { type: "text", value: row.name, placeholder: "e.g. Spotify", style: "width:140px" });
      const cat = h("select", {}, h("option", { value: "" }, "— category —"), TYPES.map(t => { const l = cats.filter(c => c.type === t); return l.length ? h("optgroup", { label: TYPE_LABEL[t] }, l.map(c => h("option", { value: c.name, selected: key(c.name) === key(row.cat) }, label(c)))) : null; }));
      const acc = h("select", {}, ACCOUNTS.map(a => h("option", { value: a.name, selected: key(a.name) === key(row.account || defaultAccount()) }, a.name)));
      const amt = h("input", { type: "text", inputmode: "decimal", value: row.amount === "" ? "" : String(row.amount).replace(".", ","), style: "width:70px;text-align:right" });
      const day = h("select", {}, h("option", { value: "0", selected: row.day === 0 || row.day === "0" }, "1st working day"), Array.from({ length: 31 }, (_, i) => h("option", { value: String(i + 1), selected: String(row.day) === String(i + 1) }, String(i + 1))));
      const start = h("input", { type: "text", value: row.start, placeholder: "YYYY-MM", style: "width:80px" });
      const act = h("input", { type: "checkbox", checked: row.active });
      const what = h("input", { type: "text", value: row.what || "", placeholder: "what it is / what for", style: "width:180px" }); what.oninput = () => row.what = what.value;
      name.oninput = () => row.name = name.value; cat.onchange = () => row.cat = cat.value; acc.onchange = () => row.account = acc.value; amt.oninput = () => row.amount = amt.value;
      day.onchange = () => row.day = day.value; start.oninput = () => row.start = start.value; act.onchange = () => row.active = act.checked;
      const step = d => () => { const v = Math.max(0, zz.round2(zz.n0(amt.value) + d)); amt.value = String(v).replace(".", ","); row.amount = v; };
      tbody.append(h("tr", {}, h("td", {}, act), h("td", {}, name), h("td", {}, cat), ACCOUNTS.length ? h("td", {}, acc) : null,
        h("td", { style: "white-space:nowrap" }, h("button", { class: "zz-x", title: "−1", onclick: step(-1) }, "−"), amt, h("button", { class: "zz-x", title: "+1", onclick: step(1) }, "+")),
        h("td", {}, day), h("td", {}, start), h("td", {}, what), h("td", {}, zz.confirmBtn("✕", () => { row.deleted = true; draw(); zz.flash(msg, `Removed "${row.name}". Click Save to confirm (past entries stay)`); }))));
    });
  }
  draw();
  const save = async () => {
    const live = rows.filter(x => !x.deleted), names = new Set();
    for (const x of live) {
      const nm = String(x.name || "").trim();
      if (!nm) return zz.flash(msg, "Every payment needs a name", false);
      if (/\|/.test(nm)) return zz.flash(msg, `"${nm}": no | in names`, false);
      if (names.has(key(nm))) return zz.flash(msg, `Duplicate name: ${nm}`, false); names.add(key(nm));
      if (!x.cat || !cm.has(key(x.cat))) return zz.flash(msg, `${nm}: pick a category`, false);
      if (!isFinite(zz.num(x.amount))) return zz.flash(msg, `${nm}: amount must be a number`, false);
      const d = parseInt(x.day); if (!(d >= 0 && d <= 31)) return zz.flash(msg, `${nm}: day must be 1–31`, false);
      if (!validMonth(x.start)) return zz.flash(msg, `${nm}: start month must look like ${curMonth}`, false);
    }
    try {
      await zz.writeTable(PAY, "Name", PAY_H, live.map(x => [String(x.name).trim(), x.cat, zz.plain(zz.num(x.amount)), x.account || defaultAccount(), dayLabel(parseInt(x.day)), String(x.start).trim(), x.active ? "yes" : "no", String(x.what || "").replace(/\|/g, "/").trim()]));
      zz.say(msg, MK, "✅ Saved. Due payments are added to the log automatically"); await rerender();
    } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  const sum = t => rows.filter(x => !x.deleted && x.active && cm.get(key(x.cat)) && cm.get(key(x.cat)).type === t).reduce((s, x) => s + zz.n0(x.amount), 0);
  const inc = cats.filter(c => c.type === "Income" || c.type === "Support").reduce((s, c) => s + c.budget, 0), fixed = sum("Expense");
  card.append(h("h4", {}, "🔁 Monthly payments"),
    h("div", { style: "overflow-x:auto" }, h("table", { class: "zz-table" }, h("tr", {}, ["On", "Name", "Category", ACCOUNTS.length ? "Account" : null, "€ / month", "Day", "Start", "What for", ""].filter(x => x !== null).map(x => h("th", {}, x))), tbody)),
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { rows.push({ name: "", cat: "", account: defaultAccount(), amount: "", day: 1, start: curMonth, active: true, what: "", deleted: false }); draw(); } }, "＋ New payment"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), msg),
    h("div", { class: "zz-tiles" },
      h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Fixed costs / month"), h("div", { class: "zz-v" }, zz.eur(fixed)), h("div", { class: "zz-muted" }, inc ? `${Math.round(fixed / inc * 100)}% of planned income` : "")),
      h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Automatic savings"), h("div", { class: "zz-v" }, zz.eur(sum("Saving")))),
      h("div", { class: "zz-tile" }, h("div", { class: "zz-muted" }, "Automatic income"), h("div", { class: "zz-v" }, zz.eur(sum("Income") + sum("Support"))))),
    h("div", { class: "zz-muted" }, "On the due day each active payment is added to the Expense Log (note starts with 🔁), from the Start month on. − / + = €1. To skip one month: ✕ next to that entry on the Money page."));
  r.append(card);
}

// ---------- HISTORY CHART ----------
function historyView(r, cats, log) {
  const months = historyMonths(log).slice(0, 12).reverse(), cur = zz.today().slice(0, 7);
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📊 Spending per month"));
  const pick = h("select", {}, h("option", { value: "" }, "All expenses"), [...new Set(cats.filter(c => c.type === "Expense").map(c => c.group))].map(g => h("option", { value: "g:" + g }, "Group: " + g)), cats.filter(c => c.type === "Expense" && planned(c)).map(c => h("option", { value: c.name }, label(c))));
  const box = h("div", {});
  const draw = () => {
    box.innerHTML = "";
    const v = pick.value, isG = v.startsWith("g:"), c = cats.find(x => x.name === v);
    const inSel = x => isG ? x.group === v.slice(2) : (c ? x === c : true);
    const sel = cats.filter(x => x.type === "Expense" && inSel(x));
    const data = months.map(m => { const st = monthStats(cats, log, m); return { label: shortMonth(m) + (m === cur ? " 🔄" : ""), v: v ? sel.reduce((s, x) => s + (st.per.get(key(x.name)) || 0), 0) : st.expSpent }; });
    const budget = sel.reduce((s, x) => s + x.budget, 0);
    box.append(zz.barChart(data, { budget }));
    const closed = data.filter((d, i) => months[i] !== cur), base = closed.length ? closed : data;
    box.append(h("div", { class: "zz-muted" }, `Average${closed.length ? " (finished months)" : ""}: ${zz.eur(base.reduce((s, d) => s + d.v, 0) / base.length)} · budget ${zz.eur0(budget)} (dashed line). Full catalog: `, zz.link("Monthly History", HIST)));
  };
  pick.addEventListener("change", draw); draw();
  card.append(h("div", { class: "zz-row" }, "Show:", pick), box);
  r.append(card);
}

// ---------- SAVINGS (you set the goals here) ----------
function savingsView(r, cats, log, rerender) {
  const card = h("div", { class: "zz-card" });
  const list = cats.filter(c => c.type === "Saving");
  const MK = "save:" + B, msg = zz.msgEl(MK);
  const show = () => {
    card.innerHTML = "";
    card.append(h("div", { class: "zz-row", style: "justify-content:space-between" }, h("h4", { style: "margin:0" }, "🎯 Savings goals"), h("button", { class: "zz-btn", onclick: edit }, "✏️ Set my goals"), msg));
    if (!list.length) { card.append(h("div", { class: "zz-muted" }, "No savings goals yet. Click ✏️ Set my goals.")); return; }
    const grid = h("div", { class: "zz-tiles" });
    let total = 0;
    for (const c of list) {
      const bal = savingBalance(c, log); total += bal;
      const lines = [];
      if (c.goal > 0 && bal >= c.goal) lines.push(["✅ reached", "zz-ok"]);
      else {
        if (c.budget > 0) { const months = c.goal > 0 ? Math.ceil((c.goal - bal) / c.budget) : null; lines.push([`${zz.eur0(c.budget)}/month` + (months ? ` → ${zz.monthName(zz.addMonths(zz.today().slice(0, 7), months))}` : ""), "zz-muted"]); }
        else lines.push([c.goal > 0 ? "no monthly amount set" : "no goal set", "zz-muted"]);
        if (c.goal > 0 && c.deadline && zz.validYmd(c.deadline)) { const ml = monthsBetween(zz.today(), c.deadline); lines.push([ml > 0 ? `goal date ${c.deadline}` : `goal date ${c.deadline} has passed`, "zz-muted"]); }
      }
      const pc = c.goal > 0 ? Math.min(100, bal / c.goal * 100) : 0;
      grid.append(h("div", { class: "zz-tile", style: "cursor:default" }, h("div", { class: "zz-donut", style: "gap:10px;flex-wrap:nowrap" },
        zz.donut([{ value: Math.max(0, Math.min(bal, c.goal || bal)), color: c.color }, { value: Math.max(0, (c.goal || 0) - bal), color: "var(--background-modifier-border)" }], { size: 80, width: 10, center: c.goal ? Math.round(pc) + "%" : "", big: 14 }).firstChild,
        h("div", { style: "min-width:0" }, h("div", { style: "font-weight:700" }, label(c)), h("div", {}, zz.eur(bal) + (c.goal ? " / " + zz.eur0(c.goal) : "")), lines.map(([t, cl]) => h("div", { class: cl }, t))))));
    }
    card.append(grid, h("div", {}, "Total in savings: ", h("strong", {}, zz.eur(total))));
  };
  const edit = () => {
    const rows = list.map(c => ({ name: c.name, orig: c.name, emoji: c.emoji, goal: c.goal || "", deadline: c.deadline || "", budget: c.budget || "", start: c.start || "", del: false }));
    const tb = h("tbody");
    const inp = (o, k, w, ph, type = "text") => { const i = h("input", { type, value: o[k] ?? "", placeholder: ph, style: `width:${w}px` }); i.oninput = () => o[k] = i.value; i.onchange = () => o[k] = i.value; return i; };
    const draw = () => { tb.innerHTML = ""; rows.filter(x => !x.del).forEach(x => tb.append(h("tr", {}, h("td", {}, inp(x, "emoji", 36, "🙂")), h("td", {}, inp(x, "name", 150, "e.g. New bike")), h("td", {}, inp(x, "goal", 80, "€")), h("td", {}, inp(x, "deadline", 130, "", "date")), h("td", {}, inp(x, "budget", 75, "€")), h("td", {}, inp(x, "start", 75, "€")), h("td", {}, zz.confirmBtn("✕", () => { x.del = true; draw(); }))))); };
    draw();
    const save = async () => {
      const live = rows.filter(x => !x.del), names = new Set(cats.filter(c => c.type !== "Saving").map(c => key(c.name)));
      for (const x of live) {
        const n = String(x.name || "").trim();
        if (!n) return zz.flash(msg, "Every goal needs a name", false);
        if (/\|/.test(n) || key(n) === key(TRANSFER)) return zz.flash(msg, `"${n}" can't be used as a name`, false);
        if (names.has(key(n))) return zz.flash(msg, `"${n}" already exists`, false); names.add(key(n));
        for (const [f, v] of [["goal", x.goal], ["€ per month", x.budget], ["already saved", x.start]]) if (String(v).trim() !== "" && !(zz.num(v) >= 0)) return zz.flash(msg, `${n}: ${f} must be a number`, false);
        if (String(x.deadline).trim() && !zz.validYmd(x.deadline)) return zz.flash(msg, `${n}: pick a valid date`, false);
      }
      try {
        const old = new Map(list.map(c => [key(c.name), c]));
        const out = rows.filter(x => !x.del).map(x => { const o = old.get(key(x.orig)) || {}; return [String(x.name).trim(), x.emoji || "", validColor(o.color) || "", zz.n0(x.budget) || "", zz.n0(x.goal) || "", x.deadline || "", zz.n0(x.start) || "", o.savedIn || ""]; });
        if (!zz.getFile(GOALS)) await zz.createFile(GOALS, GOALS_NOTE);
        await zz.writeTable(GOALS, "Goal", GOAL_H, out);
        await zz.write(SETTINGS, text => { const tb2 = zz.tableObjects(text, "Category"); if (!tb2 || !tb2.rows.some(r0 => normType(r0.type) === "Saving")) return text;
          return zz.setTable(text, "Category", CAT_H, tb2.rows.filter(r0 => r0._cells.some(v => v) && normType(r0.type) !== "Saving").map(r0 => CAT_H.map(hh => r0[hh.toLowerCase()] ?? ""))); });
        const ren = new Map(rows.filter(x => x.orig && !x.del && key(x.orig) !== key(x.name)).map(x => [key(x.orig), String(x.name).trim()]));
        if (ren.size) for (const [path, first] of [[LOG, "Date"], [PAY, "Name"]]) if (zz.getFile(path)) await zz.write(path, text => { const t2 = zz.tableObjects(text, first); if (!t2) return text; const i = t2.keys.indexOf("category"); for (const row of t2.t.rows) { const nn = ren.get(key(row.cells[i])); if (nn) { row.cells[i] = nn; t2.t.lines[row.line] = zz.makeRow(row.cells); } } return t2.t.lines.join("\n"); });
        zz.say(msg, MK, "✅ Goals saved");
        if (rerender) await rerender(); else show();
      } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
    };
    card.innerHTML = "";
    card.append(h("h4", {}, "✏️ My savings goals"),
      h("div", { style: "overflow-x:auto" }, h("table", { class: "zz-table" }, h("tr", {}, ["", "Name", "Goal €", "Goal date", "€ per month", "Already saved €", ""].map(x => h("th", {}, x))), tb)),
      h("div", { class: "zz-row" }, h("button", { class: "zz-btn", onclick: () => { rows.push({ name: "", orig: "", emoji: "", goal: "", deadline: "", budget: "", start: "", del: false }); draw(); } }, "＋ New goal"), h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save"), h("button", { class: "zz-btn", onclick: show }, "Cancel"), msg),
      h("div", { class: "zz-muted" }, "Leave a field empty if you don't want it. € per month = what you plan to put aside each month. Money you put in still goes through ➕ Quick add."));
  };
  show();
  r.append(card);
}

const GOALS_NOTE = `---\ntitle: Savings Goals\ntags: [money, savings]\n---\n\n# 🎯 Savings Goals\n← [[Money]] · [[Budget Settings]]\n\n## The table (the engine reads this)\n| Goal | Emoji | Color | Per month | Target | Deadline | Already saved | Saved in |\n|---|---|---|---|---|---|---|---|\n`;

// ---------- SHOPPING LIST ----------
const SHOP = zz.fix(B + "Money/Shopping List.md");
async function shoppingView(r) {
  const tb = zz.tableObjects(await zz.read(SHOP), "Item");
  const items = tb ? tb.rows.filter(x => x.item) : [];
  const MK = "shop:" + B, msg = zz.msgEl(MK);
  const card = h("div", { class: "zz-card" }, h("h4", {}, `🛍 To buy (${items.length})`));
  const total = items.reduce((s, x) => s + zz.n0(x["price €"]), 0);
  if (!items.length) card.append(h("div", { class: "zz-muted" }, "Nothing on the list."));
  for (const x of items) {
    const link = String(x["link / where"] || "").trim(), m = /\]\((https?:[^)]+)\)|^(https?:\S+)$/.exec(link), url = m ? (m[1] || m[2]) : "";
    card.append(h("div", { class: "zz-row", style: "margin:3px 0" },
      zz.confirmBtn("✓ Bought", async () => { await zz.deleteRow(SHOP, x._line, x._raw); await render(); }, "zz-btn"),
      h("strong", {}, x.item), zz.n0(x["price €"]) ? h("span", {}, zz.eur(zz.n0(x["price €"]))) : null,
      url ? h("a", { href: url, class: "external-link" }, "link") : link ? h("span", { class: "zz-muted" }, link) : null));
  }
  if (total) card.append(h("div", { class: "zz-muted" }, "Total: ", h("strong", {}, zz.eur(total))));
  const it = h("input", { type: "text", placeholder: "Item", style: "width:170px" }), pr = h("input", { type: "text", inputmode: "decimal", placeholder: "Price €", style: "width:80px" }), ln = h("input", { type: "text", placeholder: "Link / where", style: "width:170px" });
  const add = async () => {
    const v = it.value.trim(); if (!v) return zz.flash(msg, "Type an item", false);
    if (/\|/.test(v + ln.value)) return zz.flash(msg, "No | please", false);
    const p = pr.value.trim() ? zz.num(pr.value) : ""; if (p !== "" && !isFinite(p)) return zz.flash(msg, "Price must be a number", false);
    await zz.appendRow(SHOP, "Item", [v, p === "" ? "" : zz.plain(p), ln.value.trim()]); await render();
  };
  [it, pr, ln].forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") add(); }));
  card.append(h("div", { class: "zz-row", style: "margin-top:8px" }, it, pr, ln, h("button", { class: "zz-btn mod-cta", onclick: add }, "＋ Add"), msg),
    h("div", { class: "zz-muted" }, "✓ Bought takes it off the list. Log what you paid with ➕ Quick add on the Money page."));
  r.append(card);
}

// ---------- FOOD WEEK ----------
function foodWeek(r, cats, log) {
  const names = (input.categories || ["Groceries"]).map(key);
  const list = cats.filter(c => names.includes(key(c.name)));
  const weekly = input.weekly ? zz.n0(input.weekly) : list.reduce((s, c) => s + c.budget, 0) * 12 / 52;
  const ws = zz.weekStart(), we = new Date(ws); we.setDate(we.getDate() + 6);
  const from = zz.ymd(ws), to = zz.ymd(we);
  const spent = log.filter(e => names.includes(key(e.cat)) && e.date >= from && e.date <= to).reduce((s, e) => s + e.amount, 0);
  const daysLeft = Math.max(1, zz.daysBetween(zz.today(), to) + 1), left = weekly - spent;
  r.append(h("div", { class: "zz-card" }, h("h4", {}, `🛒 Food this week (${from.slice(5)} → ${to.slice(5)})`),
    h("div", { class: "zz-donut" }, zz.donut([{ label: "Spent", value: spent, color: list[0] ? list[0].color : "#4f8cff", text: zz.eur(spent) }, { label: left >= 0 ? "Left" : "Over", value: Math.abs(left), color: left >= 0 ? GREEN : RED, text: zz.eur(Math.abs(left)) }], { size: 120, width: 16, center: zz.eur0(left), sub: left >= 0 ? `≈ ${zz.eur(left / daysLeft)}/day` : "over", big: 18 }).childNodes[0],
      h("div", {}, h("div", {}, `Spent ${zz.eur(spent)} of ${zz.eur(weekly)}`), h("div", { class: "zz-muted" }, left >= 0 ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left this week` : "over budget this week"))),
    list.length ? null : h("div", { class: "zz-warn" }, "No Groceries category found in Budget Settings.")));
}

// ---------- AFFORD ----------
function affordView(r, cats, log) {
  const st = monthStats(cats, log, zz.today().slice(0, 7));
  const price = h("input", { type: "text", inputmode: "decimal", placeholder: "Price €", style: "width:120px;font-size:1.1em" });
  const sel = h("select", {}, cats.filter(c => (c.type === "Expense" || c.type === "Saving") && planned(c)).map(c => h("option", { value: c.name }, label(c))));
  const out = h("div", {});
  const hourly = zz.n0(input.hourly) || 0;
  const calc = () => {
    out.innerHTML = "";
    const p = zz.num(price.value), c = cats.find(x => x.name === sel.value);
    if (!c) return;
    const isSave = c.type === "Saving";
    const spent = isSave ? 0 : (st.per.get(key(c.name)) || 0), budget = isSave ? savingBalance(c, log) : c.budget;
    const pp = isFinite(p) && p > 0 ? p : 0;
    const leftAfter = budget - spent - pp;
    const segs = isSave
      ? [{ label: "This purchase", value: Math.min(pp, Math.max(0, budget)), color: ORANGE, text: zz.eur(pp) }, { label: leftAfter >= 0 ? "Left in savings" : "Missing", value: Math.abs(leftAfter), color: leftAfter >= 0 ? GREEN : RED, text: zz.eur(Math.abs(leftAfter)) }]
      : [{ label: "Already spent", value: spent, color: "#4f8cff", text: zz.eur(spent) }, { label: "This purchase", value: pp, color: ORANGE, text: zz.eur(pp) }, { label: leftAfter >= 0 ? "Left after" : "Over budget", value: Math.abs(leftAfter), color: leftAfter >= 0 ? GREEN : RED, text: zz.eur(Math.abs(leftAfter)) }];
    const fitsCat = leftAfter >= 0, fitsMonth = st.left - pp >= 0;
    const verdict = !pp ? null : isSave ? (fitsCat ? ["✅ Yes, you have enough saved for it.", "zz-ok"] : [`❌ Not enough saved yet: ${zz.eur(-leftAfter)} missing. Keep saving or wait.`, "zz-bad"]) : fitsCat && fitsMonth ? ["✅ Yes, it fits.", "zz-ok"] : !fitsCat && fitsMonth ? ["⚠️ Not in this category's budget, but the month still has room. Move budget from another category or wait.", "zz-warn"] : ["❌ Doesn't fit this month. Wait or save for it.", "zz-bad"];
    const monthSegs = [{ label: "Spent", value: Math.max(0, st.expSpent), color: "#4f8cff", text: zz.eur(st.expSpent) }, { label: "Saved", value: Math.max(0, st.saved), color: "#a259ff", text: zz.eur(st.saved) }, { label: "This purchase", value: pp, color: ORANGE, text: zz.eur(pp) }, { label: st.left - pp >= 0 ? "Free after" : "Short", value: Math.abs(st.left - pp), color: st.left - pp >= 0 ? GREEN : RED, text: zz.eur(Math.abs(st.left - pp)) }];
    out.append(
      verdict ? h("div", { class: verdict[1], style: "font-size:1.15em;font-weight:700;margin:8px 0" }, verdict[0]) : h("div", { class: "zz-muted" }, "Type a price to see if it fits."),
      h("div", { class: "zz-cols" },
        h("div", {}, h("div", { class: "zz-muted", style: "margin-bottom:4px" }, isSave ? `${label(c)}: savings balance` : `${label(c)}: budget ${zz.eur0(c.budget)} this month`), zz.donut(segs, { center: zz.eur0(leftAfter), sub: leftAfter >= 0 ? "left after" : "over", big: 20 })),
        h("div", {}, h("div", { class: "zz-muted", style: "margin-bottom:4px" }, `Whole month: income ${zz.eur0(st.income)}`), zz.donut(monthSegs, { center: zz.eur0(st.left - pp), sub: "free this month", big: 20 }))),
      pp ? h("div", { class: "zz-row zz-muted" }, `${(pp / Math.max(1, st.income) * 100).toFixed(1)}% of monthly income`, hourly ? ` · ${(pp / hourly).toFixed(1)} h at Part-time Job` : "", pp > 50 ? " · 48-hour rule: wait 2 days before buying" : "") : "");
  };
  price.addEventListener("input", calc); sel.addEventListener("change", calc); calc();
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "🤔 Can I afford it?"), h("div", { class: "zz-row" }, price, "from", sel), out));
}

// ---------- TRIPS / NET WORTH / MILESTONES ----------
function tripsView(r, cats, log) {
  const tp = dv.page(zz.fix(B + "Money/Trips")); const n = x => zz.n0(tp ? tp[x] : 0);
  const total = n("budget_summer") + n("budget_ski") + n("budget_golf") + n("budget_weekend_each") * n("weekend_trips_per_year") + n("budget_moto_camping");
  const c = cats.find(x => x.type === "Saving" && /trip/i.test(x.name));
  const card = h("div", { class: "zz-card" }, h("h4", {}, "✈️ Trips vs. savings"));
  if (!c) { card.append(h("div", { class: "zz-warn" }, "Add a Saving category with 'Trip' in its name in Budget Settings.")); return r.append(card); }
  const bal = savingBalance(c, log), yearly = c.budget * 12;
  card.append(h("table", { class: "zz-table" },
    h("tr", {}, h("td", {}, "All planned trips per year"), h("td", { class: "r" }, zz.eur0(total))),
    h("tr", {}, h("td", {}, `${label(c)}: saving per year`), h("td", { class: "r" }, `${zz.eur0(yearly)} (${zz.eur0(c.budget)}/month)`)),
    h("tr", {}, h("td", {}, `${label(c)}: saved so far`), h("td", { class: "r" }, zz.eur(bal))),
    h("tr", {}, h("td", {}, yearly >= total ? "✅ Plan covers all trips" : "⚠️ Gap per year"), h("td", { class: "r " + (yearly >= total ? "zz-ok" : "zz-bad") }, zz.eur0(yearly - total)))));
  r.append(card);
}
function networthView(r, cats, log) {
  const mp = dv.page(MONEY); const g = x => zz.n0(mp ? mp[x] : 0);
  const accBal = accountBalances(cats, log);
  const accs = ACCOUNTS.map(a => [accLabel(a), accBal.get(key(a.name))]);
  const saves = cats.filter(c => c.type === "Saving" && !c.savedIn).map(c => [label(c), savingBalance(c, log)]);
  const assets = [["🥇 Gold", "gold_value"], ["⌚ Watch", "watch_value"], ["🏍 Motorcycle", "motorcycle_value"], ["📈 Investments", "investments"]].filter(([, k]) => mp && mp[k] !== undefined && mp[k] !== null).map(([l, k]) => [l, g(k)]);
  const all = [...accs, ...saves, ...assets], total = all.reduce((s, x) => s + x[1], 0);
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "💎 Net worth"),
    h("div", { class: "zz-cols" }, zz.donut(all.filter(x => x[1] > 0).map((x, i) => ({ label: x[0], value: x[1], color: zz.PALETTE[i % zz.PALETTE.length], text: zz.eur0(x[1]) })), { center: zz.eur0(total), sub: "net worth", big: 18 }),
      h("table", { class: "zz-table" }, all.map(([a, v], i) => h("tr", {}, h("td", {}, a), h("td", { class: "r" }, i >= accs.length + saves.length && !v ? "⏳ enter value" : zz.eur0(v)))))),
    h("div", { class: "zz-muted" }, "Accounts and savings are calculated" + (assets.length ? "; other things you own come from the Money note's properties." : "."))));
}
function milestonesView(r, cats, log) {
  const st = monthStats(cats, log, zz.today().slice(0, 7)), earned = st.earned;
  const mp = dv.page(MONEY) || {};
  const goals = [].concat(mp.income_milestones || ["Summer 2027: 2000", "End 2027: 5000", "End of BBE (2029): 10000", "Age 25: 25000", "Age 30: 50000"]).map(s => { const m = /^(.*):\s*([\d.,]+)\s*$/.exec(String(s)); return m ? [m[1].trim(), zz.num(m[2])] : null; }).filter(Boolean);
  r.append(h("div", { class: "zz-card" }, h("h4", {}, `🚀 Earned income: ${zz.eur0(earned)}/month`),
    h("table", { class: "zz-table" }, goals.map(([l, v]) => h("tr", {}, h("td", {}, l), h("td", { class: "r" }, zz.eur0(v)), h("td", { style: "width:40%" }, zz.bar(earned / v * 100, earned >= v ? GREEN : undefined)), h("td", { class: "r" }, Math.min(100, Math.round(earned / v * 100)) + "%")))),
    h("div", { class: "zz-muted" }, "Only Income-type categories count (money you earn). Edit the milestones in the Money note's properties (income_milestones).")));
}

// ---------- PAGE (customisable Money page) ----------
function monthsView(r, cats, log) {
  const months = historyMonths(log);
  const card = h("div", { class: "zz-card" }, h("h4", {}, `📒 Every month (${months.length})`));
  const t = h("table", { class: "zz-table" }, h("tr", {}, ["Month", "Income", "Spent", "Budget", "Saved", "Entries"].map((x, i) => h("th", { class: i ? "r" : "" }, x))));
  const cur = zz.today().slice(0, 7);
  for (const mk of months) {
    const st = monthStats(cats, log, mk), n = log.filter(e => e.date.startsWith(mk)).length, p = monthLogPath(mk);
    t.append(h("tr", {}, h("td", {}, zz.getFile(p) ? zz.link(zz.monthName(mk) + (mk === cur ? " 🔄" : ""), p) : zz.monthName(mk)),
      h("td", { class: "r" }, zz.eur0(st.income)), h("td", { class: "r " + (st.expPlan && st.expSpent > st.expPlan ? "zz-bad" : "") }, zz.eur0(st.expSpent)), h("td", { class: "r" }, zz.eur0(st.expPlan)), h("td", { class: "r" }, zz.eur0(st.saved)), h("td", { class: "r" }, String(n))));
  }
  card.append(h("div", { style: "overflow-x:auto" }, t), h("div", { class: "zz-muted" }, "Click a month to open its own log: every expense of that month, grouped per category. A new one starts by itself each month (in Money/Months). 🔄 = month still running."));
  r.append(card);
}
async function pageView(r, cats, log, mk, rerender) {
  const mp = dv.page(MONEY) || {};
  const saved = [].concat(mp.page_sections || DEFAULT_SECTIONS).map(String).filter(x => SECTIONS[x]);
  const order = [...saved, ...Object.keys(SECTIONS).filter(x => !saved.includes(x))];
  const on = new Set(saved);
  for (const s of saved) {
    const box = h("div", {}); r.append(box);
    if (s === "add") addForm(box, cats, log, { after: () => rerender(mk) });
    else if (s === "accounts") accountsView(box, cats, log);
    else if (s === "month") monthView(box, cats, log, mk, rerender);
    else if (s === "food") foodWeek(box, cats, log);
    else if (s === "afford") affordView(box, cats, log);
    else if (s === "savings") savingsView(box, cats, log, () => rerender(mk));
    else if (s === "history") historyView(box, cats, log);
    else if (s === "milestones") milestonesView(box, cats, log);
    else if (s === "networth") networthView(box, cats, log);
  }
  monthsView(r, cats, log);
  // customise panel
  const list = h("div", {});
  const state = order.map(k => ({ k, on: on.has(k) }));
  const MK = "page:" + B, msg = zz.msgEl(MK);
  const draw = () => { list.innerHTML = ""; state.forEach((x, i) => { const cb = h("input", { type: "checkbox", checked: x.on }); cb.onchange = () => x.on = cb.checked; list.append(h("div", { class: "zz-row" }, h("button", { class: "zz-x", disabled: i === 0, onclick: () => { [state[i - 1], state[i]] = [state[i], state[i - 1]]; draw(); } }, "▲"), h("button", { class: "zz-x", disabled: i === state.length - 1, onclick: () => { [state[i + 1], state[i]] = [state[i], state[i + 1]]; draw(); } }, "▼"), h("label", {}, cb, " " + SECTIONS[x.k]))); }); };
  draw();
  const save = async () => { try { await zz.frontmatter(MONEY, fm => { fm.page_sections = state.filter(x => x.on).map(x => x.k); }); zz.say(msg, MK, "✅ Page layout saved"); await rerender(mk); } catch (e) { zz.flash(msg, "⚠️ " + e.message, false); } };
  r.append(h("details", { class: "zz-card" }, h("summary", {}, "⚙️ Customise this page"), h("div", { class: "zz-muted" }, "Tick what to show, ▲▼ to reorder, then Save."), list,
    h("div", { class: "zz-row" }, h("button", { class: "zz-btn mod-cta", onclick: save }, "💾 Save layout"), h("button", { class: "zz-btn", onclick: () => { state.splice(0, state.length, ...DEFAULT_SECTIONS.map(k => ({ k, on: true }))); draw(); } }, "Reset"), msg)));
}

// ---------- RUN ----------
const R = zz.root();
async function render(mk) {
  R.innerHTML = "";
  try {
    if (MODE === "shopping") return await shoppingView(R);
    if (!input.noSync) await sync();
    const cats = await loadSettings();
    const log = await loadLog();
    const m = mk || nowMonth();
    const re = async x => render(x === undefined ? m : x);
    if (MODE === "page") await pageView(R, cats, log, m, re);
    else if (MODE === "add") addForm(R, cats, log, { after: () => render(m), defaultCat: input.defaultCat });
    else if (MODE === "month") monthView(R, cats, log, m, re);
    else if (MODE === "mini") monthView(R, cats, log, nowMonth(), re, true);
    else if (MODE === "accounts") accountsView(R, cats, log);
    else if (MODE === "manage") manageView(R, cats, log, re);
    else if (MODE === "accounts-manage") accountsManage(R, cats, log, re);
    else if (MODE === "payments") await paymentsView(R, cats, log, re);
    else if (MODE === "history") historyView(R, cats, log);
    else if (MODE === "months") monthsView(R, cats, log);
    else if (MODE === "savings") savingsView(R, cats, log, re);
    else if (MODE === "food-week") foodWeek(R, cats, log);
    else if (MODE === "afford") affordView(R, cats, log);
    else if (MODE === "trips") tripsView(R, cats, log);
    else if (MODE === "networth") networthView(R, cats, log);
    else if (MODE === "milestones") milestonesView(R, cats, log);
    else R.append(h("div", { class: "zz-bad" }, "Unknown mode: " + MODE));
  } catch (e) { R.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + e.message)); }
}
await render();
