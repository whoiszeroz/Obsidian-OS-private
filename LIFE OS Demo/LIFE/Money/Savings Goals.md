---
title: Savings Goals
tags: [money, savings]
---

# 🎯 Savings Goals
← [[Money]] · [[Budget Settings]] · [[Monthly Payments]]

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "savings"});
```

> [!info]- How it works
> - **✏️ Set my goals** to add, change or remove a goal: target €, goal date, € per month and what's already saved.
> - Putting money aside: ➕ Quick add with the goal as category. Taking it out: a negative amount.
> - € per month counts as planned savings in your monthly budget.

## The table (the engine reads this)
| Goal | Emoji | Color | Per month | Target | Deadline | Already saved | Saved in |
|---|---|---|---|---|---|---|---|
| Emergency fund | 🛟 | #e5484d | 100 | 3000 |  | 1000 |  |
| New laptop | 💻 | #4f8cff | 80 | 1500 | 2027-06-30 | 300 |  |
| Summer trip | ✈️ | #06b6d4 | 100 | 1200 | 2027-07-15 |  |  |
