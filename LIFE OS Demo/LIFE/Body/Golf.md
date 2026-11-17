---
title: Golf
tags: [body, golf]
handicap_start: 26.4
handicap_now: 24.1
handicap_target: 18
start_date: 2026-04-01
deadline: 2027-09-30
typical_score_vs_par: 18
best_score_vs_par: 11
---

# ⛳ Golf
← [[Body]] · 🏋️ [[Workouts]] · rounds log at the bottom

**Goal:** handicap **under 18** by **Sep 2027**.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "golf-stats"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/fitness", {base: B, mode: "golf-log"});
```

## 📅 Weekly rhythm
| What | How often |
|---|---|
| Rounds | 1–2 per week (depends on the week) |
| Range | **at least 2x per week** |
| Golf mobility warm-up (10 min) | before every round and range session |

## 🏌️ Practice plan
Weakest part: **everything for now**, so every range session covers all 4 areas, with one main focus that rotates each week:

| Week | Main focus (half the session) | Rest of the session |
|---|---|---|
| 1 | 🏌️ Driving | irons, chipping, putting |
| 2 | 🎯 Irons | driving, chipping, putting |
| 3 | 🪃 Short game (chips, pitches, bunkers) | full swing, putting |
| 4 | ⛳ Putting | full swing, chipping |

---

## ✅ To-dos
- [ ] Book 2 range sessions #golf

---

## 📒 Rounds log
*Filled by ⛳ Log a round above. You can edit by hand: date YYYY-MM-DD, Counting = yes/no.*

| Date | Course | Holes | Score | Par | Counting | Hcp after | Note |
|---|---|---|---|---|---|---|---|
| 2026-05-10 | Home course | 18 | 98 | 72 | yes | 26.0 |  |
| 2026-06-14 | Lake course | 9 | 47 | 36 | no |  | Windy |
| 2026-07-19 | Home course | 18 | 95 | 72 | yes | 25.2 |  |
| 2026-08-23 | Home course | 18 | 92 | 72 | yes | 24.6 | Best drive ever |
| 2026-09-27 | Forest course | 18 | 94 | 71 | yes | 24.1 |  |
