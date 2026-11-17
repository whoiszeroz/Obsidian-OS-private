---
title: Uni
tags: [uni, dashboard]
semester: WS 2026/27
ects_total_needed: 180
goal_average: 2.5
goal_applications: 5
---

# 🎓 Uni: Bachelor in Business
← [[Home]] · 🧑‍💼 [[Internship Tracker]] · 📅 [[Calendar]]

**Goal:** pass every exam on the first try, average under 2.5.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/uni", {base: B, mode: "dashboard"});
```

> [!info]- 📁 How courses work
> - **Every course is a folder** in `Uni`: the course page + `Documents` (PDFs, slides, exercise sheets) + `Notes` (your lecture notes).
> - **On each course page:** 📝 one lecture note per class (＋ Notes next to the class makes it) · 🗒 General notes about the course · 📒 Study log (lectures, self-study, exam prep with minutes) · ✅ To-dos.
> - **Add courses:** import your timetable (.ics from your university) above. New courses get their folder automatically, existing ones get their times updated. No timetable? Use *Or by hand*.
> - **Remove a course:** 🗑 on its card (click twice). The whole folder goes to the system trash, so you can restore it.
> - **Classes and exams show up in [[Calendar]] and on [[Home]]** automatically.
> - **Grades:** set status + grade on the course page when you get it; the average and ECTS above update.

## 📚 Study system
- Lecture + 30-min review on the **same day**
- One **deep study block** per uni day, phone in another room 
- Exam prep starts **3 weeks** before each exam
- Old exams first, theory second

---

## ✅ To-dos
