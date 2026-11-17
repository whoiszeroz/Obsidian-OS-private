---
title: Self-Improvement
tags: [self-improvement, dashboard]
---

# 🧠 Self-Improvement
← [[Home]] · [[Vision & Identity]] · [[Habits]] · [[Learning & Skills]] · [[Weekly Review]]

> [!quote] North Star
> Build a calm, healthy, interesting life, and finish what I start.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "scorecard"});
```

## 🧍 Who I'm becoming
| Trait | Daily proof |
|---|---|
| **Consistent** | The most important task is done before noon |
| **Curious** | Learn one new thing every week |
| **Calm** | 10-second pause before reacting |

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "habits"});
```

## 🔁 Rhythm
- **Every day:** tick habits on [[Home]]
- **Sunday, 20 min:** [[Weekly Review]]
- **1st of the month:** [[Monthly Money Review]]

---

## ✅ To-dos
