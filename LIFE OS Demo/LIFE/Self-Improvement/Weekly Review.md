---
title: Weekly Review
tags: [self-improvement, review]
---

# 🔁 Weekly Review: every Sunday, 20 min
← [[Self-Improvement]]

*Go through it top to bottom. Write answers in your own notes or straight below.*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "reviews"});
```

*Press the button every Sunday: it saves this week's review as its own note in Self-Improvement/Reviews (the checklist below is the template).*

## 1. Look at the numbers (they're live)
```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/self", {base: B, mode: "habits"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "week", target: 2});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "food-week", categories: ["Groceries"]});
```

## 2. Update
- ☐ Every expense of the week is in Quick add ([[Money]])
- ☐ Weigh-in logged ([[Body]])
- ☐ Followers / subscribers updated ([[Social Media]])
- ☐ Job week checked off ([[Part-time Job]])

## 3. Score the week (1–10)
| Area | Score | One line |
|---|---|---|
| 🎓 Uni | | |
| 📱 Social Media | | |
| 💪 Body | | |
| 📱 Phone / time | | |

## 4. Minimums hit? ⭐
- ☐ This week's job tasks done
- ☐ 1 content block
- ☐ 2 workouts
- ☐ 2× range

## 5. Next week
- The ONE thing that matters most:
- Biggest thing to avoid:
- Which trait do I focus on? Consistent · Curious · Calm
