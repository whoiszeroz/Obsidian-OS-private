---
title: Business
tags: [business, dashboard]
decision_deadline: 2027-06-30
chosen_option:
---

# 💼 Business
← [[Home]] · 🤖 [[Claude]] · 📚 [[Prompt Library]] · 🕹 [[Part-time Job]]

**Goal:** test 3 side-project ideas and pick **ONE** by **30 Jun 2027**.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/business", {base: B, mode: "options"});
```

## 🔍 How to decide
Each option has its own research note in `Business/Research` with the same checklist:
1. Who exactly pays, and how much?
2. Can I get **1 paying customer in 30 days**?
3. What do I need to learn or build first?
4. Legal setup (registration, taxes)
5. Hours per week vs. my week in [[Calendar]]

Then score it (0–10) in its properties: **fit** · **fast money** · **real wealth** · **first customer in 30 days**. The table above adds it up.
When you've decided, write the name into `chosen_option` (top of this note).

**Rule until the deadline:** new business ideas don't get time in my week. Finish the research first.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/business", {base: B, mode: "inbox"});
```

## 🤖 Use Claude for the research
Drop PDFs, screenshots or notes into `Business/Inbox`, or paste a prompt from the [[Prompt Library]], and Claude fills the research notes for you. Setup: [[Claude]].

---

## ✅ To-dos
- [ ] Talk to 3 people who would pay for idea A #business
