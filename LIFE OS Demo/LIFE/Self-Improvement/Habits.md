---
title: Habits
tags: [self-improvement, habits]
---

# ✅ Habits
← [[Self-Improvement]]

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "habits"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "habits-stats"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "habits-manage"});
```

> [!info] How it works
> Tick a habit on [[Home]] (today) or above (any day this week). Each tick is one row in the habit log at the bottom of this note.

## The table (the engine reads this)
| Habit | Emoji | Per week | Active |
|---|---|---|---|
| Make bed | 🛏 | 7 | yes |
| Drink 2 L water | 💧 | 7 | yes |
| Read 20 min | 📖 | 5 | yes |
| 10k steps | 🚶 | 5 | yes |
| Plan tomorrow | 📝 | 7 | yes |
| No phone after 23:00 | 📵 | 5 | yes |

---

## ✅ To-dos

---

## 📒 Habit log
*Filled by the ✅ tick boxes. One row = one habit done on one day.*

| Date | Habit |
|---|---|
| 2026-10-20 | Make bed |
| 2026-10-20 | Drink 2 L water |
| 2026-10-20 | 10k steps |
| 2026-10-20 | Plan tomorrow |
| 2026-10-20 | No phone after 23:00 |
| 2026-10-21 | Make bed |
| 2026-10-21 | Drink 2 L water |
| 2026-10-21 | Read 20 min |
| 2026-10-21 | 10k steps |
| 2026-10-21 | Plan tomorrow |
| 2026-10-21 | No phone after 23:00 |
| 2026-10-22 | Make bed |
| 2026-10-22 | Drink 2 L water |
| 2026-10-22 | Read 20 min |
| 2026-10-22 | 10k steps |
| 2026-10-22 | Plan tomorrow |
| 2026-10-23 | Make bed |
| 2026-10-23 | Drink 2 L water |
| 2026-10-23 | 10k steps |
| 2026-10-23 | No phone after 23:00 |
| 2026-10-24 | Make bed |
| 2026-10-24 | Drink 2 L water |
| 2026-10-24 | Read 20 min |
| 2026-10-24 | Plan tomorrow |
| 2026-10-24 | No phone after 23:00 |
| 2026-10-25 | Make bed |
| 2026-10-25 | Drink 2 L water |
| 2026-10-25 | Read 20 min |
| 2026-10-25 | 10k steps |
| 2026-10-25 | Plan tomorrow |
| 2026-10-25 | No phone after 23:00 |
| 2026-10-26 | Make bed |
| 2026-10-26 | Drink 2 L water |
| 2026-10-26 | Read 20 min |
| 2026-10-26 | 10k steps |
| 2026-10-26 | Plan tomorrow |
| 2026-10-26 | No phone after 23:00 |
| 2026-10-27 | Make bed |
| 2026-10-27 | Drink 2 L water |
| 2026-10-27 | Read 20 min |
| 2026-10-27 | 10k steps |
| 2026-10-27 | Plan tomorrow |
| 2026-10-28 | Make bed |
| 2026-10-28 | Drink 2 L water |
| 2026-10-28 | 10k steps |
| 2026-10-28 | Plan tomorrow |
| 2026-10-29 | Make bed |
| 2026-10-29 | Drink 2 L water |
| 2026-10-29 | Read 20 min |
| 2026-10-29 | Plan tomorrow |
| 2026-10-29 | No phone after 23:00 |
| 2026-10-30 | Drink 2 L water |
| 2026-10-30 | 10k steps |
| 2026-10-30 | Plan tomorrow |
| 2026-10-30 | No phone after 23:00 |
| 2026-10-31 | Make bed |
| 2026-10-31 | Read 20 min |
| 2026-10-31 | Plan tomorrow |
| 2026-11-01 | Make bed |
| 2026-11-01 | 10k steps |
| 2026-11-01 | Plan tomorrow |
| 2026-11-02 | Make bed |
| 2026-11-02 | Drink 2 L water |
| 2026-11-02 | Read 20 min |
| 2026-11-02 | 10k steps |
| 2026-11-02 | Plan tomorrow |
