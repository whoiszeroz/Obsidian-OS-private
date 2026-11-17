# ✅ TO DO
All to-dos from every note in one place. 📌 one to put it on Home.

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/home", {base: B, mode: "todos"});
```

---

*General to-dos (they're on the board above as 📋 General):*

## ✅ To-dos
- [ ] Call the dentist for a check-up
- [ ] Renew bike lock
- [ ] Clean up the downloads folder #home
