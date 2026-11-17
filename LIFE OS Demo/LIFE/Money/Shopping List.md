---
title: Shopping List
tags: [money, shopping]
---

# 🛍 Shopping List
← [[Money]]

*Things I want to buy. Only on this page: not on Home, not in the to-dos, not in the budget.*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "shopping"});
```

## The list (the page reads this)
| Item | Price € | Link / where |
|---|---|---|
| Desk lamp | 35 | IKEA |
| Running shoes | 110 |  |
| Noise-cancelling headphones | 199 |  |
