---
title: Food
tags: [body, food]
age: 22
activity_factor: 1.55
surplus_kcal: 300
protein_g_per_kg: 1.8
---

# 🍽 Food
← [[Body]] (71 → 75 kg) · groceries budget in [[Money]]

**Two goals at once:** gain lean weight to 75 kg **and** stay at or under **€60/week** (Groceries budget in [[Budget Settings]]).

```dataviewjs
const P = dv.current().file.path, H = app.vault.getFiles().map(f => f.path).filter(p => p.endsWith("Scripts/home.js")).map(p => p.slice(0, -15)).sort((a, b) => b.length - a.length), B = H.find(b => P.startsWith(b)) ?? H[0] ?? "";
await dv.view(B + "Scripts/finance", {base: B, mode: "food-week", categories: ["Groceries"]});
```

## 🎯 Daily targets (auto, from [[Body]])
```dataviewjs
const p=dv.current(), b=dv.page(p.file.folder + "/Body"); const n=x=>Number(x)||0;
const w=n(b?.weight_now_kg), h=n(b?.height_cm), a=n(p.age);
const bmr=10*w+6.25*h-5*a+5;
const maint=bmr*n(p.activity_factor), target=maint+n(p.surplus_kcal);
const prot=w*n(p.protein_g_per_kg);
const wk=(n(b?.weight_target_kg)-w);
dv.table(["",""],[
 ["Maintenance (estimate)", Math.round(maint/50)*50+" kcal/day"],
 ["**Target to gain**", "**"+Math.round(target/50)*50+" kcal/day**"],
 ["**Protein**", "**"+Math.round(prot/5)*5+" g/day**"],
 ["Expected pace", "~0.25–0.5 kg/week → +"+wk+" kg in ~"+Math.round(wk/0.35)+" weeks"],
]);
```
*Estimates (Mifflin-St Jeor formula). If the scale doesn't move in 3 weeks, raise `surplus_kcal` by 200.*

## 🍳 Exactly what + how much (one day ≈ 3,040 kcal · ≈ 170 g protein)
| Meal | What | kcal | Protein |
|---|---|---|---|
| **Breakfast** | 100 g oats · 300 ml milk · 1 banana · 20 g peanut butter | ~790 | ~29 g |
| **Lunch** | 125 g rice (dry) · 200 g chicken breast · 200 g frozen veg · 1 tbsp olive oil | ~830 | ~59 g |
| **Snack** | 250 g Magertopfen · 1 tbsp honey · 1 apple | ~315 | ~30 g |
| **Dinner** | 400 g potatoes · 150 g beef mince (20% fat) · 200 g veg | ~750 | ~38 g |
| **Evening** | 300 ml milk · 2 slices wholegrain bread | ~355 | ~16 g |
| **Total** | | **~3,040** | **~172 g** |

*Values are typical label numbers, rounded. Protein above target is fine. If the scale doesn't go up in 3 weeks, add 1 snack (≈ +250–300 kcal).*

**Swaps (same role):** chicken ↔ turkey · eggs (3 eggs ≈ 19 g protein) · tuna · lentils. Rice ↔ pasta ↔ potatoes. Topfen ↔ skyr ↔ Greek yogurt.
**Training days:** eat a carb-heavy meal 1–3 h before the gym, and protein after.

## 🛒 Weekly shopping list (matches the day plan × 7)
| Item | Amount / week | Price € |
|---|---|---|
| Oats | 700 g | 2.1 |
| Milk | 4.2 l | 5.4 |
| Bananas | 7 | 2.0 |
| Apples | 7 | 2.5 |
| Peanut butter | 140 g (1 jar lasts ~2–3 weeks) | 1.5 |
| Rice | 875 g | 1.9 |
| Chicken breast | 1.4 kg | 15.9 |
| Beef mince | 1.05 kg | 9.4 |
| Potatoes | 2.8 kg | 3.2 |
| Frozen vegetables | 2.8 kg | 7.6 |
| Magertopfen | 1.75 kg (7 × 250 g) | 5.3 |
| Wholegrain bread | 1 loaf (14 slices) | 2.3 |
| Olive oil, honey | refill when empty |  |
| **Total** | | **target ≤ €60** |

*If it's over €60, swap beef mince for more chicken/eggs/lentils first.*

## 💡 Money levers
- Discount stores for basics
- Cook 2–3 bigger batches per week instead of daily
- Eating out has its own category (🍔 Eating out), not the groceries budget

---

## ✅ To-dos
