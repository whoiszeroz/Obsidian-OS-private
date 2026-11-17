---
title: Workouts
tags: [body, training]
sessions_per_week: 2
block_start: 2026-10-05
block_weeks: 12
---

# 🏋️ Workouts
← [[Body]] · ⛳ [[Golf]] · 🍽 [[Food]]

**Log a workout** below (with notes for each exercise and for the whole session), then see everything in 📒 All workouts.

**Block 1:** Mon 5 Oct 2026 → Sun 27 Dec 2026 · **2 full-body gym sessions per week**, 60 min each, alternating A → B. **Home (backup)** is for weeks you can't get to the gym.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "week"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "log"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "history"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "progress"});
```

## 🛠 My plan
*Make it yours: add or remove sessions and exercises, change sets, reps and rest, ▲▼ to reorder, then 💾 Save plan. The log above always uses this plan.*

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "plan"});
```

> [!tip]- 🔥 Warm-up (every session, 8–10 min), mobility
> 1. 2 min easy cardio (bike / rower / jump rope)
> 2. Cat-cow × 8
> 3. Open books × 8 per side
> 4. 90/90 hip switches × 8 per side
> 5. World's greatest stretch × 5 per side
> 6. Band pull-aparts × 15
> 7. 2 ramp-up sets of the first exercise (empty bar → ~70%)

> [!tip]- 📈 How to progress (double progression)
> 1. Every exercise has a **rep range** (e.g. 5–8).
> 2. Use the same weight until **all sets hit the top** of the range (e.g. 8/8/8).
> 3. Then add weight next time: **+5 kg** squat/deadlifts/RDL · **+2.5 kg** bench, rows, presses · **+1–2 kg** dumbbells and isolation.
> 4. The logger above checks this for you and says when to go up.
>
> **Effort:** finish each set with **1–2 reps left in the tank** (weeks 1–2: 3 reps left while I learn the weights).

## ✅ To-dos

---

## 📋 The plan
*The engine reads this table. Easiest to change with 🛠 My plan above, but editing here works too (one row per exercise).*

| Session | Exercise | Sets | Reps | Rest | Notes |
|---|---|---|---|---|---|
| A · Strength | Back Squat | 3 | 5–8 | 2–3 min | Below parallel, brace hard |
| A · Strength | Bench Press | 3 | 5–8 | 2–3 min | Shoulder blades back, feet planted |
| A · Strength | Chest-Supported Row | 3 | 8–10 | 90 s | Pull to lower ribs, pause 1 s |
| A · Strength | Romanian Deadlift | 2 | 8–10 | 2 min | Hips back, bar close to legs |
| A · Strength | Lateral Raise | 3 | 12–15 | 60 s | Superset with curls |
| A · Strength | EZ-Bar Curl | 2 | 8–12 | 60 s | No swinging |
| A · Strength | Hanging Leg Raise | 3 | 10–15 | 60 s | Lower abs: curl the pelvis up |
| B · Size | Trap Bar Deadlift | 3 | 5–8 | 2–3 min | Or conventional deadlift |
| B · Size | Incline Dumbbell Press | 3 | 8–12 | 2 min | Upper chest, 30° bench |
| B · Size | Pull-Up | 3 | 6–10 | 2 min | Add weight once 3 × 10 is easy |
| B · Size | Seated Dumbbell Shoulder Press | 2 | 8–12 | 90 s | Full range |
| B · Size | Bulgarian Split Squat | 2 | 8–10 | 90 s | Per leg, dumbbells |
| B · Size | Cable Fly | 2 | 12–15 | 60 s | Superset with pushdowns |
| B · Size | Triceps Pushdown | 2 | 10–15 | 60 s | Elbows fixed |
| B · Size | Incline Dumbbell Curl | 2 | 10–12 | 60 s | Long head biceps stretch |
| Home (backup) | Pull-Up | 4 | max−1 | 2 min | Stop 1 rep before failure |
| Home (backup) | Push-Up | 4 | max−2 | 90 s | Feet on a chair when 25+ is easy |
| Home (backup) | Pike Push-Up | 3 | 8–12 | 90 s | Shoulders |
| Home (backup) | Bodyweight Bulgarian Split Squat | 3 | 12–15 | 60 s | Per leg |
| Home (backup) | Hanging Knee Raise | 3 | 12–15 | 60 s | Lower abs |
| Home (backup) | Plank | 3 | 30–60 s | 45 s | Squeeze glutes |

## 📒 Workout log
*Every saved workout lands here, one row per exercise: date YYYY-MM-DD, kg = number or BW, reps per set like 8/8/7.*

| Date | Session | Exercise | kg | Reps | Note |
|---|---|---|---|---|---|
| 2026-10-05 | A · Strength | Back Squat | 50.0 | 8/7/7 |  |
| 2026-10-05 | A · Strength | Bench Press | 40.0 | 8/7/7 |  |
| 2026-10-05 | A · Strength | Chest-Supported Row | 30.0 | 7/7/6 |  |
| 2026-10-05 | A · Strength | Romanian Deadlift | 50.0 | 7/7/6 |  |
| 2026-10-08 | B · Size | Trap Bar Deadlift | 70 | 8/8/7 |  |
| 2026-10-08 | B · Size | Incline Dumbbell Press | 16 | 8/7/7 |  |
| 2026-10-08 | B · Size | Pull-Up | BW | 7/7/6 |  |
| 2026-10-08 | B · Size | Bulgarian Split Squat | 12 | 7/7/6 |  |
| 2026-10-12 | A · Strength | Back Squat | 50.0 | 8/7/7 |  |
| 2026-10-12 | A · Strength | Bench Press | 40.0 | 7/7/6 |  |
| 2026-10-12 | A · Strength | Chest-Supported Row | 30.0 | 8/8/8 |  |
| 2026-10-12 | A · Strength | Romanian Deadlift | 50.0 | 7/7/6 |  |
| 2026-10-15 | B · Size | Trap Bar Deadlift | 70 | 7/7/6 |  |
| 2026-10-15 | B · Size | Incline Dumbbell Press | 16 | 8/7/7 |  |
| 2026-10-15 | B · Size | Pull-Up | BW | 8/7/7 |  |
| 2026-10-15 | B · Size | Bulgarian Split Squat | 12 | 8/8/7 |  |
| 2026-10-19 | A · Strength | Back Squat | 52.5 | 8/7/7 |  |
| 2026-10-19 | A · Strength | Bench Press | 42.5 | 8/7/7 |  |
| 2026-10-19 | A · Strength | Chest-Supported Row | 32.5 | 8/7/7 |  |
| 2026-10-19 | A · Strength | Romanian Deadlift | 52.5 | 8/8/7 |  |
| 2026-10-22 | B · Size | Trap Bar Deadlift | 75 | 8/7/7 |  |
| 2026-10-22 | B · Size | Incline Dumbbell Press | 17 | 8/8/8 |  |
| 2026-10-22 | B · Size | Pull-Up | BW | 8/8/8 |  |
| 2026-10-22 | B · Size | Bulgarian Split Squat | 13 | 8/8/7 |  |
| 2026-10-26 | A · Strength | Back Squat | 52.5 | 7/7/6 |  |
| 2026-10-26 | A · Strength | Bench Press | 42.5 | 8/8/8 |  |
| 2026-10-26 | A · Strength | Chest-Supported Row | 32.5 | 8/8/8 |  |
| 2026-10-26 | A · Strength | Romanian Deadlift | 52.5 | 8/7/7 |  |
| 2026-10-29 | B · Size | Trap Bar Deadlift | 75 | 7/7/6 |  |
| 2026-10-29 | B · Size | Incline Dumbbell Press | 17 | 7/7/6 |  |
| 2026-10-29 | B · Size | Pull-Up | BW | 7/7/6 |  |
| 2026-10-29 | B · Size | Bulgarian Split Squat | 13 | 7/7/6 |  |
| 2026-11-02 | A · Strength | Back Squat | 55.0 | 8/8/7 |  |
| 2026-11-02 | A · Strength | Bench Press | 45.0 | 7/7/6 |  |
| 2026-11-02 | A · Strength | Chest-Supported Row | 35.0 | 7/7/6 |  |
| 2026-11-02 | A · Strength | Romanian Deadlift | 55.0 | 8/8/7 |  |

## 📝 Workout notes
*One row per workout: how it went (energy, sleep, pain, what to change). Filled by the log form and 📝 in All workouts.*

| Date | Workout | Notes |
|---|---|---|
| 2026-10-05 | A · Strength | Short on time, kept rest short |
| 2026-10-08 | B · Size | Felt strong today |
| 2026-10-12 | A · Strength | Felt strong today |
| 2026-10-15 | B · Size | Slept badly, still ok |
| 2026-10-19 | A · Strength | Short on time, kept rest short |
| 2026-10-22 | B · Size | Slept badly, still ok |
| 2026-10-26 | A · Strength | Good energy |
| 2026-10-29 | B · Size | Short on time, kept rest short |
| 2026-11-02 | A · Strength | Slept badly, still ok |
