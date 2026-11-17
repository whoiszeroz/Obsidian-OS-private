---
title: Body
tags: [body, dashboard]
height_cm: 180
weight_now_kg: 71.6
weight_target_kg: 75
pullups_max: 8
pushups_max: 30
---

# 💪 Body
← [[Home]] · 🏋️ [[Workouts]] · ⛳ [[Golf]] · 🍽 [[Food]]

**12-month goals:** 71 → **75 kg** · stronger · **2 gym sessions every week**.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "week"});
```

## ⚖️ Weight & tests
```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "body-form"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "body-chart"});
```

## ✅ To-dos

---

## 📒 Weight log
| Date | Weight kg | Pull-ups | Push-ups | Note |
|---|---|---|---|---|
| 2026-09-28 | 70.2 | 6 | 25 |  |
| 2026-10-05 | 70.5 |  |  |  |
| 2026-10-12 | 70.9 |  |  |  |
| 2026-10-19 | 71.0 | 7 | 28 |  |
| 2026-10-26 | 71.4 |  |  |  |
| 2026-11-02 | 71.6 | 8 | 30 |  |
