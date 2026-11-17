---
title: Budget Settings
tags: [money, settings]
---
 
# ⚙️ Budget Settings
← [[Money]] · 🔁 [[Monthly Payments]] · 🎯 [[Savings Goals]] · 📚 [[Monthly History]]

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "manage"});
```

> [!info]- How to use it
> - **＋ / ✕** add or remove a category · **− / +** change a budget (€10 per click) · then 💾 Save.
> - **Group** puts categories together on the Money page (e.g. all transport in *🚗 Getting around*). Type any name to make a new group.
> - **Colour** is the colour in the charts. **▲▼** sets the order everywhere.
> - **Type:** Expense = spending · Income = money I earn (counts for the milestones) · Support = government/family money.
> - **Savings goals** are on their own page: [[Savings Goals]].
> - Renaming a category also renames it in every old entry.

## 🔁 Monthly payments
*The fixed things I pay every month. Each one is its own category in the group **🔁 Monthly payments**, with the same amount as budget. Edit here or on [[Monthly Payments]].*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "payments"});
```

## 🏦 Accounts
*Where your money sits. Every entry in Quick add belongs to an account (the default one if you don't pick). Enter what's in each account today as **Starting balance** and today's date as **Since**.*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "accounts-manage"});
```


## ✅ To-dos

---

## The tables (the engine reads these)
| Category | Emoji | Type | Group | Color | Budget / month | Goal | Deadline | Already saved | Saved in |
|---|---|---|---|---|---|---|---|---|---|
| Part-time job | 🕹 | Income | Earned income | #2e9e5b | 600 |  |  |  |  |
| Parents | 👪 | Support | Support | #a259ff | 400 |  |  |  |  |
| Groceries | 🛒 | Expense | 🍽 Food | #2e9e5b | 250 |  |  |  |  |
| Eating out | 🍔 | Expense | 🍽 Food | #84cc16 | 60 |  |  |  |  |
| Spotify | 🎵 | Expense | 🔁 Monthly payments | #1db954 | 10.99 |  |  |  |  |
| Phone | 📱 | Expense | 🔁 Monthly payments | #06b6d4 | 15 |  |  |  |  |
| Gym membership | 🏋️ | Expense | 🔁 Monthly payments | #a259ff | 29.9 |  |  |  |  |
| Public transport | 🚇 | Expense | 🔁 Monthly payments | #4f8cff | 30 |  |  |  |  |
| Going out | 🎉 | Expense | 🎉 Life & fun | #e5484d | 80 |  |  |  |  |
| Clothes | 👕 | Expense | 🎉 Life & fun | #eab308 | 40 |  |  |  |  |
| Tech | 💻 | Expense | 🎉 Life & fun | #d98a1c | 30 |  |  |  |  |
| Other | 📦 | Expense | 📦 Other | #888888 | 30 |  |  |  |  |

| Account | Emoji | Starting balance | Since | Default |
|---|---|---|---|---|
| Bank | 🏦 | 1200 | 2026-10-01 | yes |
| Cash | 💵 | 80 | 2026-10-01 |  |
