---
title: Expense Log
tags: [log, money]
---

# 📒 Expense Log
← [[Money]]


```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "months"});
```

*Filled by ➕ Quick add on [[Home]] and [[Money]]. Everything goes here: expenses, money put into savings, income, transfers.*
*Editing by hand is fine: date YYYY-MM-DD, category exactly as in [[Budget Settings]], amount like 12.40 (negative = refund or money taken out of savings), account as in Budget Settings (empty = default).*

| Date | Category | Amount | Account | Note |
|---|---|---|---|---|
| 2026-10-01 | Spotify | 10.99 | Bank | 🔁 Spotify |
| 2026-10-01 | Phone | 15 | Bank | 🔁 Phone |
| 2026-10-01 | Gym membership | 29.9 | Bank | 🔁 Gym membership |
| 2026-10-01 | Public transport | 30 | Bank | 🔁 Public transport |
| 2026-10-01 | Parents | 400 | Bank | October |
| 2026-10-02 | Going out | 13.08 | Cash | Friday night |
| 2026-10-03 | Groceries | 23.01 | Bank | Supermarket |
| 2026-10-06 | Groceries | 20.64 | Bank | Bakery |
| 2026-10-07 | Eating out | 9.0 | Bank | Lunch |
| 2026-10-09 | Going out | 14.42 | Cash | Friday night |
| 2026-10-10 | Groceries | 20.44 | Bank | Market |
| 2026-10-11 | Clothes | 34.99 | Bank | Hoodie |
| 2026-10-13 | Groceries | 32.73 | Bank | Supermarket |
| 2026-10-16 | Going out | 21.83 | Cash | Friday night |
| 2026-10-17 | Groceries | 21.57 | Bank | Market |
| 2026-10-18 | Tech | 24.9 | Bank | USB-C hub |
| 2026-10-20 | Groceries | 40.93 | Bank | Bakery |
| 2026-10-21 | Eating out | 9.86 | Bank | Lunch |
| 2026-10-23 | Going out | 25.58 | Cash | Friday night |
| 2026-10-24 | Groceries | 41.83 | Bank | Market |
| 2026-10-24 | Other | 12.5 | Bank | Birthday card + gift wrap |
| 2026-10-27 | Groceries | 29.53 | Bank | Market |
| 2026-10-28 | Eating out | 9.72 | Bank | Lunch |
| 2026-10-30 | Part-time job | 584.5 | Bank | October pay |
| 2026-10-30 | Going out | 17.48 | Cash | Friday night |
| 2026-10-31 | Groceries | 24.35 | Bank | Bakery |
| 2026-10-31 | Emergency fund | 100 | Bank | Monthly saving |
| 2026-10-31 | New laptop | 80 | Bank | Monthly saving |
| 2026-10-31 | Summer trip | 100 | Bank | Monthly saving |
| 2026-11-01 | Parents | 400 | Bank | November |
| 2026-11-02 | Spotify | 10.99 | Bank | 🔁 Spotify |
| 2026-11-02 | Phone | 15 | Bank | 🔁 Phone |
| 2026-11-02 | Gym membership | 29.9 | Bank | 🔁 Gym membership |
| 2026-11-02 | Public transport | 30 | Bank | 🔁 Public transport |
