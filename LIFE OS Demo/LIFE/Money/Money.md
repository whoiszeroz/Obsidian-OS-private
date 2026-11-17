---
tracking_start: 2026-10
title: Money
tags: [money, dashboard]
page_sections: [add, accounts, month, food, afford, savings, history, milestones, networth]
income_milestones:
  - "Summer 2027: 800"
  - "End 2027: 1500"
---

# 💶 Money
← [[Home]] · ⚙️ [[Budget Settings]] · 🔁 [[Monthly Payments]] · 📚 [[Monthly History]] · ✈️ [[Trips]] · 🗓 [[Monthly Money Review]] · 🛍 [[Shopping List]]

**Money = freedom + time.**

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "page", hourly: 13});
```

> [!info]- 🧭 How it works
> - **Spent / saved / got paid?** ➕ Quick add (here or on [[Home]]), pick the account it came from. Savings categories count as *saved*, not spent.
> - **Moved money** (bank → cash, bank → savings account)? Pick *↔ Transfer* in Quick add.
> - **Wrong amount?** *This month* → change the amount and press Enter, or ✕ twice to delete.
> - **Fixed monthly costs** add themselves: [[Monthly Payments]]. **Every month's totals** are kept in [[Monthly History]].
> - **Categories, groups, colours, budgets, accounts:** [[Budget Settings]].
> - **What this page shows:** ⚙️ *Customise this page* at the bottom (tick, ▲▼, Save).
> - **Income milestones:** edit `income_milestones` in this note's properties.

## 🔁 Paycheck routine
1. **Pay myself first:** put savings aside right away (log them as Savings).
2. **Log the income** in Quick add (or turn on income in [[Monthly Payments]]).
3. Spend from what's left; this page shows each category's budget.

## 📜 Money rules
- Save first, spend what's left
- Wait 48 h before any purchase over €100

## 🛒 Big purchases
When something big comes up, add a Saving category with a goal + deadline in [[Budget Settings]], then check it with 🤔 *Can I afford it?* above.

---

## ✅ To-dos
- [ ] Compare phone plans #money 📅 2026-12-13
