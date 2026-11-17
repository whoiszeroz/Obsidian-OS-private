---
title: Calendar
tags: [calendar]
---

# 📅 Calendar
← [[Home]] · 🎓 [[Uni]] · 🕹 [[Part-time Job]]

Everything with a date in one place: your events, **uni classes + exams**, tasks with a 📅 date, content publish dates, monthly payments, job shifts, workouts, golf rounds, deadlines and public holidays.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/calendar", {base: B, mode: "month"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/calendar", {base: B, mode: "add"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/calendar", {base: B, mode: "agenda", days: 14});
```

## 🗓 My normal week
| Block | Hours / week | Minimum ⭐ |
|---|---|---|
| 🎓 Uni (lectures + study) | 25 | every lecture + 1 review per subject |
| 🕹 Part-time job | 8 | this week's tasks done |
| 📱 Content | 5 | 1 filming or editing block |
| 🏋️ Workout | 2 sessions | 2 |
