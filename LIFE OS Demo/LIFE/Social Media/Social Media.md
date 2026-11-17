---
title: Social Media
tags: [social, dashboard]
handle: mychannel
youtube_status: active
x_status: active
instagram_status: later
tiktok_status: later
yt_subscribers: 87
yt_views: 2140
x_followers: 34
ig_followers: 0
tiktok_followers: 0
goal_yt_subscribers: 1000
goal_date: 2027-10-26
goal_videos: 26
---

# 📱 Social Media: My Channel
← [[Home]] · 🎬 [[Production Guide]] · 💡 [[Content Ideas]] · 🐦 [[X Posts]] · 🎒 [[Filming Gear]]

> Documenting what I learn and build, one video a week.

**@mychannel**

> [!important] For now: everything is for YouTube
> First goal: **build up a library of videos on YouTube**. **X** = updates on the journey. Instagram + TikTok come later (same videos, own captions).

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/social", {base: B, mode: "platforms"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/social", {base: B, mode: "board"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/social", {base: B, mode: "new"});
```

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/social", {base: B, mode: "growth"});
```

## 🧱 Content pillars
| Pillar | Example content |
|---|---|
| 🎓 Study | Study systems, exam weeks |
| 🛠 Building | Tools, automations, this vault |
| 💪 Gym | Training progress |

## 🗺 Platform plan
| Platform | Status | What goes there |
|---|---|---|
| 📺 YouTube | ✅ now | **1 long video (16:9) every Wednesday.** No Shorts. |
| 🐦 X / Twitter | ✅ now | **3 posts per week**: progress, numbers, lessons, behind the scenes → [[X Posts]] |
| 📸 Instagram | later | Start after 10 YouTube videos |
| 🎵 TikTok | later | Start after 10 YouTube videos |

*To start Instagram or TikTok: change `instagram_status` / `tiktok_status` to `active` in the properties at the top.*

---

## ✅ To-dos
- [ ] Design a new thumbnail style #social

---

## 📒 Stats log
*Filled by the Update form above. Platform = youtube, x, instagram or tiktok.*

| Date | Platform | Followers | Views |
|---|---|---|---|
| 2026-10-05 | youtube | 12 | 140 |
| 2026-10-12 | x | 10 |  |
| 2026-10-12 | youtube | 25 | 420 |
| 2026-10-19 | youtube | 41 | 880 |
| 2026-10-26 | x | 22 |  |
| 2026-10-26 | youtube | 63 | 1510 |
| 2026-11-02 | x | 34 |  |
| 2026-11-02 | youtube | 87 | 2140 |
