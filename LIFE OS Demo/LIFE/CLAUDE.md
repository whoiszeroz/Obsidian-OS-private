# Rules for Claude in this vault

This is a personal life-planning vault (Obsidian). Claude works in it through Claudian (Claude Code inside Obsidian) or the Claude app. Write in **English**, short and direct.

## Structure (one dashboard per folder, same name as the folder)
- `Home.md`: daily page (incl. the to-do board). `Calendar.md`: calendar. `Calendar/Events/`: one note per event.
- `Self-Improvement/`: Self-Improvement (scorecard), Vision & Identity, Habits (habit table + habit log at the bottom), Learning & Skills, Weekly Review
- `Body/`: Body (weight log at the bottom), Workouts (plan + workout log at the bottom), Golf (rounds log at the bottom), Food
- `Money/`: Money (dashboard), Budget Settings (categories + accounts), Monthly Payments, Savings Goals, Shopping List, Monthly History (auto), Trips, Monthly Money Review, Expense Log
- `Uni/`: Uni dashboard, Internship Tracker, one folder per course: `Uni/<Course>/<Course>.md` + `Documents/` + `Notes/`
- `Business/`: Business, `Research/` (one note per idea), Claude, Prompt Library, Part-time Job, `Inbox/`
- `Social Media/`: dashboard (stats log at the bottom), `Content/` (one note per video), Production Guide, Content Ideas, X Posts, Filming Gear
- `Scripts/`: dashboard engine. **Never edit unless explicitly asked.**

## Data formats (the dashboards read these; keep them exact)
- All dates `YYYY-MM-DD`. Amounts with a dot (`12.4`), no € sign. Tables are read by their column names.
- **Expense Log**: `| Date | Category | Amount | Account | Note |`. Category must match Budget Settings exactly.
- **Habit log**: `| Date | Habit |`. **Weight log**: `| Date | Weight kg | Pull-ups | Push-ups | Note |`.
- **Workout log**: `| Date | Session | Exercise | kg | Reps | Note |`.
- **Course notes**: `## 📒 Study log` (`| Date | What | Minutes | Note |`) and `## 🗓 Sessions` (`| Date | Start | End | Room | Type |`).
- Tasks: `- [ ] text #tag 📅 YYYY-MM-DD` inside the note's `## ✅ To-dos` section.
- Append rows to the **end** of a table; never reorder existing rows.

## When asked to "process my inbox"
For each file in `Business/Inbox/`: read it, put the information into the right note, then move it to `Business/Inbox/Done/`. Finish with a short list: file → where it went.
