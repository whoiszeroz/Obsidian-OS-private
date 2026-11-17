---
title: Monthly Payments
tags: [money, settings]
---

# 🔁 Monthly Payments
← [[Money]] · categories: [[Budget Settings]] · history: [[Monthly History]]

Only the things I **pay** every month (4 payments, €85.89 total). On the due day they're added to the [[Expense Log]] automatically (from the account you pick), so you don't type them each month.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "payments"});
```

> [!info] How it works
> - **On** ✅ = added automatically every month on **Day** (*1st working day* = first Mon–Fri that isn't a holiday), starting from **Start** (YYYY-MM).
> - **− / +** changes the amount by €1 (or type any number) → 💾 Save. New amounts count from the next entry; past months stay as they were.
> - **Skip one month:** in [[Money]] → *All entries this month* → ✕ next to the 🔁 entry → it becomes €0 (skipped) and won't come back.
> - **Stop a payment:** untick **On** (past entries stay) or ✕ it here.
> - Everything starts **October 2026**.

## The table (the engine reads this)
| Name | Category | Amount | Account | Day | Start | Active | What for |
|---|---|---|---|---|---|---|---|
| Spotify | Spotify | 10.99 | Bank | 1st working day | 2026-10 | yes | Music |
| Phone | Phone | 15 | Bank | 1st working day | 2026-10 | yes | Phone plan |
| Gym membership | Gym membership | 29.9 | Bank | 1st working day | 2026-10 | yes | Gym |
| Public transport | Public transport | 30 | Bank | 1st working day | 2026-10 | yes | Monthly pass |
