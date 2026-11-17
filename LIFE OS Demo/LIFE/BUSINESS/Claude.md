---
title: Claude
tags: [business, claude]
---

# 🤖 Claude in Obsidian
← [[Business]] · prompts: [[Prompt Library]] · rules Claude follows: [[CLAUDE]]

You can give Claude prompts or files and it fills your notes in, in the right place and format. There are two ways.

## Option A: Claudian (Claude inside Obsidian, recommended)
A sidebar chat in Obsidian that runs **Claude Code** with your vault as its folder. It can read and write your notes, and you can attach files and @mention notes.
1. You already have Claude Code installed (`claude` in CMD). Make sure it works: open CMD and run `claude` once (log in with your Claude account if asked).
2. Obsidian → Settings → Community plugins → Browse → **Claudian** → Install → Enable.
3. Open it from the left ribbon. Claude reads [[CLAUDE]] automatically and follows the vault rules.
4. Windows tip from the plugin docs: if it can't find Claude Code, point it to `claude.exe` (not a `.cmd` file) in the plugin settings.

## Option B: the Claude app (what you're using now)
In the Claude desktop app, connect your vault folder  and ask in chat. Claude edits the notes directly, like it built this vault.

## 📥 How to hand Claude things
| You want | Do this |
|---|---|
| Research a business option | Paste prompt 1 from the [[Prompt Library]] |
| Process files (PDFs, screenshots, receipts, exam lists) | Drop them into `Business/Inbox`, then say **"Process my inbox"** |
| Log many expenses at once | Paste the receipt/bank lines + prompt 3 |
| Add exam dates from a PDF | Drop the PDF in the inbox + prompt 4 |
| Plan content | Prompt 5 |

*Claude moves processed files to `Business/Inbox/Done`, so the inbox stays clean.*
