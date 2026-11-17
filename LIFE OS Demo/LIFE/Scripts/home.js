// LIFE OS vault engine · home · don't edit unless you know JavaScript
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

// ===== HOME: dv.view(base+"Scripts/home", {base, mode}) =====
// modes: hero · todos · sections
const { h } = zz;
const B = (input && input.base) || "";
const MODE = (input && input.mode) || "hero";
const key = s => String(s || "").trim().toLowerCase();
const yes = s => /^(yes|y|ja|true|1|✅|x|on)$/i.test(String(s || "").trim());
const open = p => () => zz.APP.workspace.openLinkText(zz.fix(B + p), "", false);

async function moneyNow() {
  const setText = await zz.read(zz.fix(B + "Money/Budget Settings.md"));
  const cat = zz.tableObjects(setText, "Category");
  const lg = zz.tableObjects(await zz.read(zz.fix(B + "Money/Expense Log.md")), "Date");
  if (!cat || !lg) return null;
  const cats = cat.rows.filter(r => r.category).map(r => ({ name: key(r.category), type: key(r.type) || "expense", budget: zz.n0(r["budget / month"]) }));
  const cm = new Map(cats.map(c => [c.name, c]));
  const mk = zz.today().slice(0, 7);
  const rows = lg.rows.map(r => ({ date: (r.date || "").trim(), cat: key(r.category), amount: zz.num(r.amount) })).filter(r => zz.validYmd(r.date) && isFinite(r.amount) && r.cat !== "transfer");
  const per = new Map(); rows.filter(r => r.date.startsWith(mk)).forEach(r => per.set(r.cat, (per.get(r.cat) || 0) + r.amount));
  let income = 0, spent = 0, saved = 0, budget = 0;
  for (const c of cats) {
    const v = per.get(c.name) || 0;
    if (c.type === "income" || c.type === "support") income += v !== 0 ? v : c.budget;
    else if (c.type === "saving") saved += v;
    else { spent += v; budget += c.budget; }
  }
  for (const [k, v] of per) if (!cm.has(k)) spent += v;
  const groc = cats.find(c => c.name === "groceries");
  const ws = zz.ymd(zz.weekStart()), weekly = groc ? groc.budget * 12 / 52 : 0;
  const food = rows.filter(r => r.cat === "groceries" && r.date >= ws && r.date <= zz.today()).reduce((s, r) => s + r.amount, 0);
  // money you actually have = account balances (same rules as the Money page)
  let have = null;
  const at = zz.tableObjects(setText, "Account");
  if (at && at.rows.some(r => r.account)) {
    const accs = at.rows.filter(r => r.account).map(r => ({ k: key(r.account), bal: zz.n0(r["starting balance"]), since: zz.validYmd(r.since) ? r.since.trim() : "", def: /^(y|yes|ja|true|x|✓|1)$/i.test(String(r.default || "").trim()) }));
    const am = new Map(accs.map(a => [a.k, a])), defK = (accs.find(a => a.def) || accs[0]).k;
    const types = new Map(cat.rows.filter(r => r.category).map(r => [key(r.category), { type: key(r.type) || "expense", into: key(r["saved in"] || "") }]));
    const gp = zz.fix(B + "Money/Savings Goals.md"), gt = zz.getFile(gp) ? zz.tableObjects(await zz.read(gp), "Goal") : null;
    if (gt) gt.rows.filter(r => r.goal && !types.has(key(r.goal))).forEach(r => types.set(key(r.goal), { type: "saving", into: key(r["saved in"] || "") }));
    const add = (k, d, v) => { const a = am.get(k); if (!a || (a.since && d < a.since)) return; a.bal += v; };
    for (const r of lg.rows) {
      const d = (r.date || "").trim(), v = zz.num(r.amount); if (!zz.validYmd(d) || !isFinite(v)) continue;
      const acc = key(r.account || "") || defK, c = types.get(key(r.category));
      if (key(r.category) === "transfer") { add(acc, d, v); continue; }
      if (!c || c.type === "expense") add(acc, d, -v);
      else if (c.type === "income" || c.type === "support") add(acc, d, v);
      else if (c.type === "saving") { add(acc, d, -v); if (c.into) add(c.into, d, v); }
    }
    have = accs.reduce((s, a) => s + a.bal, 0);
  }
  return { left: income - spent - saved, have, budgetLeft: budget - spent, spent, budget, foodLeft: weekly - food, weekly };
}
async function trainingNow() {
  const t = zz.tableObjects(await zz.read(zz.fix(B + "Body/Workouts.md")), ["Date", "Session"]);
  const page = dv.page(zz.fix(B + "Body/Workouts")) || {};
  const target = zz.n0(page.sessions_per_week) || 2, ws = zz.ymd(zz.weekStart());
  const a = zz.tableObjects(await zz.read(zz.fix(B + "Body/Workouts.md")), ["Date", "Activity"]);
  const n = new Set([...(t ? t.rows.filter(r => zz.validYmd(r.date) && r.date >= ws).map(r => r.date + r.session) : []), ...(a ? a.rows.filter(r => zz.validYmd(r.date) && r.date >= ws && r.activity).map(r => r.date + "|act|" + r.activity) : [])]).size;
  return { n, target };
}
async function habitsNow() {
  const text = await zz.read(zz.fix(B + "Self-Improvement/Habits.md"));
  const hb = zz.tableObjects(text, "Habit"), lg = zz.tableObjects(text, ["Date", "Habit"]);
  if (!hb) return null;
  const act = hb.rows.filter(r => r.habit && yes(r.active)).map(r => key(r.habit));
  const done = lg ? new Set(lg.rows.filter(r => r.date === zz.today()).map(r => key(r.habit)).filter(x => act.includes(x))).size : 0;
  return { done, total: act.length };
}
// every to-do that matters: tasks in a "To-dos" section of any note + any task with a 📅 date
const SECS = [["📋", "General"], ["🧠", "Self-Improvement"], ["💪", "Body"], ["💶", "Money"], ["🎓", "Uni"], ["💼", "Business"], ["📱", "Social Media"], ["📅", "Calendar"]];
const DASH = ["Self-Improvement/Self-Improvement.md", "Body/Body.md", "Body/Workouts.md", "Body/Golf.md", "Money/Money.md", "Uni/Uni.md", "Business/Business.md", "Business/Part-time Job.md", "Social Media/Social Media.md", "Calendar.md"];
const canonSec = x => { if (/^to-?\s?dos?$/i.test(String(x))) return "General"; const m = SECS.find(y => y[1].toLowerCase() === String(x).toLowerCase()); return m ? m[1] : x; };
const secOf = rel => canonSec(rel.includes("/") ? rel.split("/")[0] : rel.replace(/\.md$/, ""));
async function allTasks() {
  const tasks = [], notes = new Map();
  for (const f of zz.APP.vault.getMarkdownFiles()) {
    if (!f.path.startsWith(B)) continue;
    const rel = f.path.slice(B.length);
    if (/^(Templates|Scripts)\//i.test(rel) || rel === "CLAUDE.md" || rel === "Home.md") continue;
    const text = await zz.APP.vault.cachedRead(f);
    const name = (f.basename || f.name || rel.split("/").pop()).replace(/\.md$/, "");
    const hasTodo = /^#{1,6}\s+.*$/m.test(text) && text.split("\n").some(l => /^#{1,6}\s+/.test(l) && zz.TODO_HEAD.test(l));
    const todoNote = /^to-?\s?dos?$/i.test(name);
    if (hasTodo || todoNote || DASH.some(d => d.toLowerCase() === rel.toLowerCase())) notes.set(f.path, { path: f.path, name, sec: secOf(rel) });
    if (!/[-*+] \[/.test(text)) continue;
    for (const t of zz.parseTasks(text)) if (t.inTodo || t.due || todoNote) tasks.push({ ...t, path: f.path, name, sec: secOf(rel) });
  }
  return { tasks, notes: [...notes.values()] };
}
async function tasksNow() {
  const today = zz.today(), { tasks } = await allTasks();
  const open = tasks.filter(t => !t.done && t.due);
  return { due: open.filter(t => t.due === today).length, late: open.filter(t => t.due < today).length };
}
// Part-time Job: this week's to-dos (weekly ones + one-offs) live in tables in the Part-time Job note
const FF = zz.fix(B + "Business/Part-time Job.md");
async function ffWeek() {
  const text = await zz.read(FF); if (text === null) return { week: "", list: [] };
  const week = zz.ymd(zz.weekStart());
  const rec = zz.tableObjects(text, "Weekly task"), todo = zz.tableObjects(text, ["Week", "Task"]);
  const rows = todo ? todo.rows.filter(r => (r.week || "").trim() === week && r.task) : [];
  const list = [];
  if (rec) for (const r of rec.rows.filter(r => r["weekly task"] && yes(r.active))) { const row = rows.find(x => key(x.task) === key(r["weekly task"])); list.push({ task: r["weekly task"].trim(), done: !!(row && yes(row.done)), row, recurring: true }); }
  for (const r of rows.filter(x => !list.some(l => key(l.task) === key(x.task)))) list.push({ task: r.task.trim(), done: yes(r.done), row: r, recurring: false });
  return { week, list };
}
async function ffToggle(week, t, done) {
  if (t.row) await zz.write(FF, text => { const tb = zz.tableObjects(text, ["Week", "Task"]); if (!tb) return text; const row = tb.t.rows.find(x => x.line === t.row._line && x.raw === t.row._raw) || tb.t.rows.find(x => x.raw === t.row._raw); if (!row) return text; row.cells[tb.keys.indexOf("done")] = done ? "yes" : "no"; tb.t.lines[row.line] = zz.makeRow(row.cells); return tb.t.lines.join("\n"); });
  else await zz.appendRow(FF, ["Week", "Task"], [week, t.task, done ? "yes" : "no"]);
}

async function hero(r) {
  const d = new Date(), hr = d.getHours();
  const hol = zz.holidaysAT(d.getFullYear())[zz.today()];
  const greet = hr < 5 ? "Late night" : hr < 11 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const [money, train, habits, tasks, items] = await Promise.all([moneyNow().catch(() => null), trainingNow().catch(() => null), habitsNow().catch(() => null), tasksNow().catch(() => ({ due: 0, late: 0 })), zz.collect(B, zz.today(), zz.ymd(new Date(Date.now() + 7 * 864e5)), { noTasks: true }).catch(() => [])]);
  const nowT = `${zz.pad(hr)}:${zz.pad(d.getMinutes())}`;
  const agenda = items.filter(it => !["workout", "golf", "payment"].includes(it.kind) && !(it.kind === "holiday" && it.date !== zz.today()));
  const next = agenda.find(it => it.kind !== "holiday" && (it.date > zz.today() || !it.time || it.time >= nowT));
  const btn = (txt, p) => h("button", { class: "zz-btn", style: "background:rgba(255,255,255,.18);color:#fff;border:none", onclick: open(p) }, txt);
  r.append(h("div", { class: "zz-hero" },
    h("div", { style: "font-size:1.6em;font-weight:800" }, `${greet} 👋`),
    h("div", { class: "zz-muted" }, d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + (hol ? ` · 🇦🇹 ${hol}` : "")),
    h("div", { style: "margin-top:6px;font-style:italic;opacity:.9" }, "One step at a time."),
    h("div", { class: "zz-row", style: "margin-top:10px" }, btn("💶 Money", "Money/Money.md"), btn("🏋️ Workout", "Body/Workouts.md"), btn("📅 Calendar", "Calendar.md"), btn("🎓 Uni", "Uni/Uni.md"), btn("🕹 Part-time Job", "Business/Part-time Job.md"))));
  const tile = (label, value, sub, cls, p) => h("div", { class: "zz-tile", onclick: p ? open(p) : null }, h("div", { class: "zz-muted" }, label), h("div", { class: "zz-v " + (cls || "") }, value), sub ? h("div", { class: "zz-muted" }, sub) : null);
  const dayLbl = s => s === zz.today() ? "today" : zz.daysUntil(s) === 1 ? "tomorrow" : zz.toDate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  r.append(h("div", { class: "zz-tiles" },
    tile("⏭ Next up", next ? `${next.icon} ${next.time || ""}`.trim() : "—", next ? `${next.text} · ${dayLbl(next.date)}` : "nothing planned", "", "Calendar.md"),
    tile("☑️ Tasks today", String(tasks.due), tasks.late ? `${tasks.late} overdue` : "nothing overdue", tasks.late ? "zz-bad" : "", null),
    money ? (money.have !== null ? tile("💶 Money now", zz.eur(money.have), `budget left this month ${zz.eur0(money.budgetLeft)}`, money.have < 0 ? "zz-bad" : "zz-ok", "Money/Money.md")
                                 : tile("💶 Budget left", zz.eur0(money.budgetLeft), `spent ${zz.eur0(money.spent)} of ${zz.eur0(money.budget)}`, money.budgetLeft < 0 ? "zz-bad" : "zz-ok", "Money/Money.md")) : null,
    money && money.weekly ? tile("🛒 Food left (week)", zz.eur0(money.foodLeft), `of ${zz.eur0(money.weekly)}`, money.foodLeft < 0 ? "zz-bad" : "", "Money/Money.md") : null,
    train ? tile("🏋️ Workouts", `${train.n} / ${train.target}`, "this week", train.n >= train.target ? "zz-ok" : "", "Body/Workouts.md") : null,
    habits && habits.total ? tile("✅ Habits today", `${habits.done} / ${habits.total}`, habits.done === habits.total ? "all done 🎉" : "tick them below", habits.done === habits.total ? "zz-ok" : "", "Self-Improvement/Habits.md") : null));
  // agenda
  const card = h("div", { class: "zz-card" }, h("h4", {}, "📅 Today & next 7 days"));
  if (!agenda.length) card.append(h("div", { class: "zz-muted" }, "Nothing scheduled. Add events in ", zz.link("Calendar", zz.fix(B + "Calendar.md")), "."));
  let last = "";
  for (const it of agenda.slice(0, 18)) {
    if (it.date !== last) { last = it.date; card.append(h("div", { class: "zz-agenda-day" }, it.date === zz.today() ? "Today" : zz.daysUntil(it.date) === 1 ? "Tomorrow" : zz.toDate(it.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }))); }
    const past = it.date === zz.today() && it.time && it.time < nowT;
    card.append(h("div", { class: "zz-agenda-item", style: (past || it.done ? "opacity:.5;" : "") + (it.kind === "exam" ? "background:color-mix(in srgb,var(--color-red,#d24343) 12%,transparent)" : "") }, h("span", { class: "zz-muted", style: "min-width:44px" }, it.time || "·"), h("span", {}, it.icon + " ", it.link ? zz.link(it.text, it.link) : it.text)));
  }
  r.append(card);
}

// ---------- TO-DO BOARD ----------
const MEM = (window.__zzMem = window.__zzMem || {});
const store = { get: k => { try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) { } return MEM[k] ?? null; }, set: (k, v) => { MEM[k] = v; try { localStorage.setItem(k, v); } catch (e) { } } };
function dueChip(due) {
  if (!due) return null;
  const n = zz.daysUntil(due);
  const txt = n < 0 ? `${-n} d late` : n === 0 ? "today" : n === 1 ? "tomorrow" : n < 7 ? zz.toDate(due).toLocaleDateString("en-GB", { weekday: "short" }) : zz.toDate(due).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return h("span", { class: "zz-chip", style: n < 0 ? "color:var(--color-red,#d24343)" : n === 0 ? "color:var(--color-orange,#d98a1c)" : "" }, "📅 " + txt);
}
async function todos(r) {
  const today = zz.today(), wEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 6); return zz.ymd(d); })();
  const [{ tasks, notes }, ff] = await Promise.all([allTasks(), ffWeek().catch(() => ({ week: "", list: [] }))]);
  const open = tasks.filter(t => !t.done).sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  const recent = tasks.filter(t => t.done && t.doneDate && zz.daysBetween(t.doneDate, today) <= 14).sort((a, b) => b.doneDate.localeCompare(a.doneDate));
  const late = open.filter(t => t.due && t.due < today), now = open.filter(t => t.due === today), week = open.filter(t => t.due && t.due > today && t.due <= wEnd);
  const ffOpen = ff.list.filter(t => !t.done);
  let F = store.get("zz-todo-f") || "all";
  const MK = "todo:" + B, msg = zz.msgEl(MK);
  const card = h("div", { class: "zz-card" });
  const rerender = async () => { r.innerHTML = ""; await todos(r); };
  const pass = t => F === "all" ? true : F === "today" ? (t.due && t.due <= today) : F === "week" ? (t.due && t.due <= wEnd) : F === "decision" ? t.tags.includes("decision") : true;
  const fbtn = (k, label) => h("button", { class: "zz-fbtn" + (F === k ? " on" : ""), onclick: () => { store.set("zz-todo-f", k); rerender(); } }, label);
  card.append(h("div", { class: "zz-row", style: "justify-content:space-between" }, h("h4", { style: "margin:0" }, "☑️ To-dos"),
    h("div", { class: "zz-row", style: "margin:0" }, fbtn("all", `All ${open.length + ffOpen.length}`), fbtn("today", `Today & late ${late.length + now.length}`), fbtn("week", `This week ${late.length + now.length + week.length + ffOpen.length}`), fbtn("decision", `🤔 Decisions ${open.filter(t => t.tags.includes("decision")).length}`))));
  if (late.length) card.append(h("div", { class: "zz-bad", style: "font-size:.9em" }, `⚠️ ${late.length} overdue: ` + late.slice(0, 3).map(t => t.text).join(" · ") + (late.length > 3 ? " …" : "")));
  // add a to-do straight into a note's To-dos section
  const secRank = s => { const i = SECS.findIndex(x => x[1] === s); return i < 0 ? 99 : i; };
  const choices = notes.slice().sort((a, b) => secRank(a.sec) - secRank(b.sec) || a.sec.localeCompare(b.sec) || (a.name === a.sec ? -1 : b.name === b.sec ? 1 : a.name.localeCompare(b.name)));
  const last = store.get("zz-todo-note");
  const sel = h("select", { title: "Which note it belongs to" }, choices.map(n => h("option", { value: n.path, selected: n.path === last }, n.name === n.sec ? n.name : `${n.sec} › ${n.name}`)));
  const txt = h("input", { type: "text", placeholder: "New to-do…", style: "flex:1;min-width:180px" }), dIn = h("input", { type: "date", title: "Due date (optional)" });
  const dec = h("input", { type: "checkbox", title: "Mark as a decision" });
  const add = async () => {
    const v = txt.value.trim(); if (!v) return zz.flash(msg, "Type the to-do first", false);
    if (dIn.value && !zz.validYmd(dIn.value)) return zz.flash(msg, "Invalid date", false);
    try { await zz.addTask(sel.value, v, dIn.value, dec.checked ? "decision" : ""); store.set("zz-todo-note", sel.value); zz.say(msg, MK, `✅ Added to ${sel.options[sel.selectedIndex].text}`); await rerender(); }
    catch (e) { zz.flash(msg, "⚠️ " + e.message, false); }
  };
  txt.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
  card.append(h("div", { class: "zz-row" }, txt, "in", sel, dIn, h("label", { class: "zz-muted", title: "Shows under 🤔 Decisions" }, dec, " decision"), h("button", { class: "zz-btn mod-cta", onclick: add }, "＋ Add"), msg));
  // one card per section
  const row = (t, sibs) => {
    const cb = h("input", { type: "checkbox", checked: t.done });
    cb.addEventListener("change", async () => { cb.disabled = true; await zz.toggleTask(t.path, t.line, t.raw, cb.checked); await rerender(); });
    if (sibs) sibs = sibs.filter(x => x.section === t.section);
    const i = sibs ? sibs.indexOf(t) : -1;
    const mv = d => h("button", { class: "zz-x", title: d < 0 ? "Move up" : "Move down", disabled: i < 0 || !sibs[i + d], onclick: async () => { await zz.moveTask(t.path, t.line, t.raw, d); await rerender(); } }, d < 0 ? "▲" : "▼");
    const pinned = t.tags.includes("home");
    const pin = t.done ? null : h("button", { class: "zz-x", title: pinned ? "Shown on Home: click to remove it from Home" : "Show this to-do on Home", style: pinned ? "opacity:1" : "opacity:.35", onclick: async () => { await zz.setTaskTag(t.path, t.line, t.raw, "home", !pinned); await rerender(); } }, "📌");
    return h("div", { class: "zz-todo" + (t.done ? " done" : "") }, sibs ? h("span", { class: "zz-mv" }, mv(-1), mv(1)) : null, h("label", {}, cb, " ", t.text), pin, t.tags.includes("decision") ? h("span", { class: "zz-chip" }, "🤔") : null, t.done ? h("span", { class: "zz-chip" }, "✅ " + t.doneDate.slice(5)) : dueChip(t.due));
  };
  const grid = h("div", { class: "zz-cols" });
  const hp = dv.page(zz.fix(B + "Home")) || {};
  const secs = [...new Set([...[].concat(hp.todo_order || []).map(String), ...SECS.map(x => x[1]), ...open.map(t => t.sec)])];
  const visible = secs.filter(sec => open.some(t => t.sec === sec && pass(t)) || (sec === "Business" && ff.list.length && (F === "all" || F === "week")));
  const moveSec = async (sec, d) => { const order = visible.slice(), i = order.indexOf(sec), j = i + d; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; await zz.frontmatter(zz.fix(B + "Home.md"), fm => { fm.todo_order = [...order, ...secs.filter(x => !order.includes(x))]; }); await rerender(); };
  let shownAny = false;
  for (const sec of secs) {
    const list = open.filter(t => t.sec === sec && pass(t));
    const ffl = sec === "Business" && (F === "all" || F === "week") ? ff.list : [];
    if (!list.length && !ffl.length) continue;
    shownAny = true;
    const icon = (SECS.find(x => x[1] === sec) || ["🗂"])[0];
    const vi = visible.indexOf(sec);
    const c = h("div", { class: "zz-card", style: "background:var(--background-primary);margin:0" }, h("div", { style: "font-weight:700;margin-bottom:4px" }, `${icon} ${sec} `, h("span", { class: "zz-muted" }, String(list.length + ffl.filter(t => !t.done).length)),
      h("span", { class: "zz-secmv" }, h("button", { class: "zz-x", title: "Move this section earlier", disabled: vi <= 0, onclick: () => moveSec(sec, -1) }, "◀"), h("button", { class: "zz-x", title: "Move this section later", disabled: vi >= visible.length - 1, onclick: () => moveSec(sec, 1) }, "▶"))));
    const files = [...new Set(list.map(t => t.path))];
    let n = 0, hidden = 0; const more = [];
    for (const p of files) {
      const ft = list.filter(t => t.path === p);
      const head = h("div", { class: "zz-sub" }, zz.link(ft[0].name, p));
      const sib = list.filter(t => t.path === p);
      if (n >= 8) { more.push(head, ...ft.map(t => row(t, sib))); hidden += ft.length; } else c.append(head, ...ft.map(t => row(t, sib)));
      n += ft.length;
    }
    if (more.length) c.append(h("details", {}, h("summary", { class: "zz-muted" }, `+${hidden} more`), ...more));
    if (ffl.length) {
      c.append(h("div", { class: "zz-sub" }, zz.link("Part-time Job · this week", FF)));
      for (const t of ffl) { const cb = h("input", { type: "checkbox", checked: t.done }); cb.addEventListener("change", async () => { cb.disabled = true; await ffToggle(ff.week, t, cb.checked); await rerender(); }); c.append(h("div", { class: "zz-todo" + (t.done ? " done" : "") }, h("label", {}, cb, " ", t.task), t.recurring ? h("span", { class: "zz-chip" }, "🔁") : null)); }
    }
    grid.append(c);
  }
  card.append(shownAny ? grid : h("div", { class: "zz-muted", style: "margin:8px 0" }, F === "all" ? "Nothing open. 🎉" : "Nothing here for this filter."));
  card.append(h("div", { class: "zz-muted", style: "margin-top:6px" }, "Every note has its own ✅ To-dos list; this board shows all of them. Tick here or in the note, it's the same list. 📌 puts a to-do on Home · ▲▼ moves a to-do (in its note too) · ◀ ▶ moves a whole section."));
  r.append(card);
}

// ---------- HOME: three small boxes with the to-dos you picked (📌) ----------
async function pinnedView(r) {
  const { tasks } = await allTasks();
  const open = tasks.filter(t => !t.done).sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  const BOXES = [["🎓", "Uni", t => t.sec === "Uni"], ["📱", "Social Media", t => t.sec === "Social Media"], ["📋", "General", t => t.sec !== "Uni" && t.sec !== "Social Media"]];
  const TODO = (zz.APP.vault.getMarkdownFiles().find(f => f.path.startsWith(B) && /^to-?\s?dos?$/i.test((f.basename || f.name).replace(/\.md$/, ""))) || { path: zz.fix(B + "TO DO.md") }).path;
  const rerender = async () => { r.innerHTML = ""; await pinnedView(r); };
  const grid = h("div", { class: "zz-cols" });
  for (const [icon, name, test] of BOXES) {
    const mine = open.filter(test), pinned = mine.filter(t => t.tags.includes("home")), rest = mine.filter(t => !t.tags.includes("home"));
    const box = h("div", { class: "zz-card", style: "background:var(--background-primary);margin:0" }, h("div", { style: "font-weight:700;margin-bottom:4px" }, `${icon} ${name} `, h("span", { class: "zz-muted" }, `${pinned.length}`)));
    for (const t of pinned) {
      const cb = h("input", { type: "checkbox" });
      cb.addEventListener("change", async () => { cb.disabled = true; await zz.toggleTask(t.path, t.line, t.raw, true); await rerender(); });
      box.append(h("div", { class: "zz-todo" }, h("label", {}, cb, " ", t.text), dueChip(t.due), h("button", { class: "zz-x", title: "Remove from Home (stays in its note)", onclick: async () => { await zz.setTaskTag(t.path, t.line, t.raw, "home", false); await rerender(); } }, "✕")));
    }
    if (!pinned.length) box.append(h("div", { class: "zz-muted", style: "font-size:.85em" }, "Nothing picked yet."));
    if (rest.length) {
      const sel = h("select", { style: "max-width:100%;margin-top:6px" }, h("option", { value: "" }, "＋ Pick a to-do…"), rest.map((t, i) => h("option", { value: String(i) }, (t.sec === name || name === "General" && t.sec !== "TO DO" ? "" : "") + t.text + (t.due ? ` (📅 ${t.due.slice(5)})` : ""))));
      sel.addEventListener("change", async () => { const t = rest[+sel.value]; if (!t) return; sel.disabled = true; await zz.setTaskTag(t.path, t.line, t.raw, "home", true); await rerender(); });
      box.append(sel);
    }
    grid.append(box);
  }
  r.append(h("div", { class: "zz-card" }, h("div", { class: "zz-row", style: "justify-content:space-between" }, h("h4", { style: "margin:0" }, "☑️ My to-dos"), zz.link("All to-dos →", TODO)), grid,
    h("div", { class: "zz-muted", style: "margin-top:4px" }, "Pick to-dos with ＋ (or 📌 in TO DO). Ticking here ticks them in their note too. ✕ only removes them from Home.")));
}

// ---------- DONE HISTORY ----------
async function doneView(r) {
  const { tasks } = await allTasks();
  const done = tasks.filter(t => t.done).sort((a, b) => (b.doneDate || "").localeCompare(a.doneDate || "") || a.path.localeCompare(b.path));
  const card = h("div", { class: "zz-card" }, h("h4", {}, `✔️ Everything I finished (${done.length})`));
  if (!done.length) { card.append(h("div", { class: "zz-muted" }, "Nothing ticked off yet. Every to-do you finish anywhere in the vault lands here, grouped by month.")); return r.append(card); }
  const groups = new Map();
  for (const t of done) { const k = t.doneDate ? t.doneDate.slice(0, 7) : ""; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
  for (const [k, list] of groups) {
    card.append(h("div", { class: "zz-agenda-day" }, (k ? zz.monthName(k) : "Date not recorded") + ` · ${list.length}`));
    for (const t of list) card.append(h("div", { class: "zz-todo done" }, h("span", { class: "zz-chip" }, t.doneDate ? "✅ " + zz.toDate(t.doneDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "✅"), h("span", { style: "flex:1" }, t.text), h("span", { class: "zz-muted", style: "font-size:.85em" }, zz.link(t.name, t.path))));
  }
  r.append(card);
}

async function sections(r) {
  const counts = await zz.computeOpen(B);
  const sum = folder => { const f = zz.fix(B + folder); let n = 0; for (const [p, c] of counts) if (p.startsWith(f + "/") || p === f + ".md") n += c; return n; };
  const S = [["🧠", "Self-Improvement", "Self-Improvement/Self-Improvement.md", "Goals, habits, vision"], ["💪", "Body", "Body/Body.md", "Workouts, weight, golf, food"], ["💶", "Money", "Money/Money.md", "Budget, accounts, savings"], ["🎓", "Uni", "Uni/Uni.md", "Courses, exams, timetable"], ["💼", "Business", "Business/Business.md", "Options, Part-time Job, Claude"], ["📱", "Social Media", "Social Media/Social Media.md", "YouTube + X"], ["📅", "Calendar", "Calendar.md", "Everything with a date"]];
  const grid = h("div", { class: "zz-sec" });
  for (const [icon, name, p, sub] of S) {
    const n = name === "Calendar" ? (counts.get(zz.fix(B + "Calendar.md")) || 0) : sum(name);
    const a = h("a", { class: "zz-seccard", href: zz.fix(B + p) }, n ? h("span", { class: "zz-badge" }, `⏳${n}`) : null, h("div", { style: "font-size:1.5em" }, icon), h("div", { style: "font-weight:700" }, name), h("div", { class: "zz-muted", style: "font-size:.85em" }, sub));
    a.addEventListener("click", ev => { ev.preventDefault(); open(p)(); });
    grid.append(a);
  }
  r.append(h("div", { class: "zz-card" }, h("h4", {}, "🧭 Sections"), grid, h("div", { class: "zz-muted", style: "margin-top:6px" }, "⏳ = open tasks and unfinished spots in that section (also shown in the sidebar).")));
}

const R = zz.root();
try {
  if (MODE === "hero") await hero(R);
  else if (MODE === "sections") await sections(R);
  else if (MODE === "todos") await todos(R);
  else if (MODE === "pinned") await pinnedView(R);
  else if (MODE === "done") await doneView(R);
  else R.append(h("div", { class: "zz-bad" }, "Unknown mode: " + MODE));
} catch (e) { R.append(h("div", { class: "zz-card zz-bad" }, "⚠️ " + e.message)); }
