---
title: Trips
tags: [money, trips]
budget_summer: 1200
budget_weekend_each: 150
weekend_trips_per_year: 3
---

# ✈️ Trips
← [[Money]] · paid from ✈️ **Summer trip** in [[Savings Goals]]

## 🗓 Every year
| Trip | When | Budget | Status |
|---|---|---|---|
| ☀️ Big summer trip (1–2 weeks) | Jul–Aug (between semesters) | `= "€" + this.budget_summer` | planning |
| 🚗 Weekend trips | all year | `= "€" + this.budget_weekend_each + " × " + this.weekend_trips_per_year` | planned |

## 💶 Can I afford it? (auto)
```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "trips"});
```
*Trip costs come from this note's properties. Savings come from ✈️ Summer trip in [[Savings Goals]] + what I log.*

---

## ✅ To-dos
