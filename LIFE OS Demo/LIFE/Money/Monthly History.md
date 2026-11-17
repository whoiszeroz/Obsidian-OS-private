---
title: Monthly History
tags: [money, history]
---

# 📚 Monthly History
← [[Money]] · [[Monthly Money Review]]

Your catalog of every month: how much came in, how much went out, per category. **It updates itself** from the [[Expense Log]] and is saved right here as normal tables, so it stays readable even without plugins.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "history"});
```

<!-- zz:history:start -->
<!-- zz:history:end -->

*Don't type between the two hidden markers above: that part gets rewritten automatically. Write your own notes below.*

## My notes per month
-
