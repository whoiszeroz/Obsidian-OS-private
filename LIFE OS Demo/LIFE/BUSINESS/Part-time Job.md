---
title: Part-time Job
tags: [business, work]
---

# 🕹 Part-time Job
← [[Business]] · 💶 pay is in [[Money]]

Part-time job, about 8 hours a week. Mostly **tasks I get each week**, sometimes a shift.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/business", {base: B, mode: "ff-week"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/business", {base: B, mode: "ff-history"});
```

---

## ✅ To-dos
*Every task until it's ticked (also on Home). Add with ＋ above or write one here: `- [ ] task #job`.*
- [x] Update the weekly schedule #job ✅ 2026-10-28
- [x] Order new cups #job ✅ 2026-10-30
- [ ] Write the social media post for the weekend #job
- [ ] Count the stock on Friday #job

---

## ⚙️ Behind the scenes
*The tables below are filled by the page above.*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/business", {base: B, mode: "ff-manage"});
```

### 🔁 Weekly tasks
| Weekly task | Active |
|---|---|
| Send hours to the manager | yes |

### ☑️ Weekly task log
| Week | Task | Done |
|---|---|---|
| 2026-10-26 | Send hours to the manager | yes |

### 🕹 Jumped in
| Date | Start | End | Hours | Note |
|---|---|---|---|---|
| 2026-10-31 | 16:00 | 20:00 | 4 | Covered a shift |

### 📩 Weekly messages / notes
| Week of | Notes |
|---|---|
| 2026-10-26 | New stock arrives Thursday. Weekend post about the new menu. |

### 📒 Weekly summary
| Summary week | Done | Still open |
|---|---|---|
