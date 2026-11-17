# 🧭 LIFE OS: an Obsidian vault for running your whole life

A ready-to-use Obsidian vault that puts **habits, fitness, money, uni, side business and content creation** into one place. Each area has its own live dashboard, and **Home** gives you the daily overview.

The dashboards are built with **Dataview JS**, so the vault behaves like an app: you get quick-add forms, progress tiles, calendars and budgets. Your data still stays in plain Markdown tables that you own.

> ⚠️ All data in this demo (expenses, workouts, events, courses) is **made up**. Delete it or overwrite it with your own.

---

## ✨ Features

- **🏠 Home dashboard**: what's next, a 7-day agenda, today's habits, quick-add for spending, and **one to-do board** that collects the to-dos from every note
- **📅 Calendar**: a month grid showing uni sessions, tasks, payments and events (one note per event)
- **🧠 Self-Improvement**: life-goals scorecard, vision & identity, habit tracker, learning & skills, weekly review
- **💪 Body**: weight & strength tests, your own workout plan plus a log of every session, golf rounds, food
- **💶 Money**: a customisable budget page with accounts, categories, monthly payments that add themselves, monthly history, savings goals, a "Can I afford it?" check, trips and a shopping list
- **🎓 Uni**: one folder per course (notes, documents, study log, timetable), exams, grades, internship tracker
- **💼 Business**: idea research, a prompt library, a part-time-job tracker and an **inbox** Claude can sort for you
- **📱 Social Media**: content board (one note per video), production guide, content ideas, X posts, filming gear
- **⏳ Open-task badges** in the sidebar show how much is still unfinished in each note or folder

## 🗂 Structure

```
LIFE/
├── Home.md                 ← daily dashboard (opens on start)
├── Calendar.md  +  Calendar/Events/
├── 00 Start Here.md        ← setup guide & rules
├── CLAUDE.md               ← rules for AI assistants working in the vault
├── Self-Improvement/
├── Body/
├── Money/
├── UNI/<Course>/{Notes, Documents}
├── BUSINESS/{Research, Inbox}
├── Social Media/Content/
├── Templates/
└── Scripts/                ← the dashboard engine (JS, hidden in sidebar)
```

**One rule:** every folder has one dashboard note with the same name as the folder. Logs sit as a table at the **bottom of the note they belong to**, so you don't need separate data folders.

## 🔌 Requirements

| Plugin | Why | Setting |
|---|---|---|
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | powers every dashboard & form | **Enable JavaScript Queries** = on |
| [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) | tick to-dos inside notes (adds the done date) | – |
| [Homepage](https://github.com/mirnovov/obsidian-homepage) | opens `Home` on start | homepage = `Home` |
| Claudian *(optional)* | Claude inside Obsidian | see `BUSINESS/Claude.md` |

## 🚀 Getting started

1. Download or clone this repo.
2. In Obsidian, choose **Open folder as vault** and select it.
3. Trust the vault and enable community plugins.
4. Make sure Dataview's **Enable JavaScript Queries** is on.
5. Open **`00 Start Here`**, then clear the demo data and start logging.

## 🔁 Suggested rhythm

- **Daily (2 min):** Home → tick habits, log spending, check tasks
- **Sunday (20 min):** Weekly Review
- **1st of the month (30 min):** Monthly Money Review + life-goals scorecard

## 🤖 Works with Claude

`CLAUDE.md` tells an AI assistant how the vault is built and which data formats to keep. Drop receipts, PDFs or screenshots into `BUSINESS/Inbox/` and say **"process my inbox"**. Claude files each item into the right note and moves the original to `Done/`.

## 📏 Keep it working

- Don't rename the section folders or the dashboard notes
- Don't change table column names (adding rows is fine)
- Dates are always `YYYY-MM-DD`; amounts use a dot (`12.4`)
- Leave `Scripts/` alone unless you know what you're changing

**Seeing code instead of dashboards?** Dataview's *Enable JavaScript Queries* is off.

---

Made by **ZERO-Z** · If this helps you, leave a ⭐
