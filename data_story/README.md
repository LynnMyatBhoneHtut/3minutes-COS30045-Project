# Data story (Stand-up 3)

One-screen dashboard with a **tab bar**: Overview · Q1 Trend · Q2 Road users · Q3 Age & sex · Q4 Place.
Every tab fits one screen, no scrolling. All charts read one file: `data/3minutes_hospitalisations_clean.csv`.

## Who edits which file
| Tab | Chart | File | Panel id | Owner |
|---|---|---|---|---|
| Overview | Q1 trend + brush | `js/q1.js` | `q1` | Yati |
| Overview | Q2 indexed lines | `js/q2.js` | `q2` | Lynn |
| Overview | Q3 heatmap | `js/q3.js` | `q3` | Nyi Nyi |
| Overview | Q4 map | `js/q4map.js` | `q4` | Nyi Nyi |
| Overview | Q4 First Nations bar | `js/q4fn.js` | `q5` | Yati |
| Q1 Trend | N1 % change from the previous year (bars) | `js/n1.js` | `n1` | Lynn |
| Q2 Road users | N2 road users, sorted bars | `js/n2.js` | `n2` | Lynn |
| Q2 Road users | N3 male vs female by road user | `js/n3.js` | `n3` | Lynn |
| Q3 Age & sex | N4 bars by age group | `js/n4.js` | `n4` | Nyi Nyi |
| Q3 Age & sex | N5 male vs female over time | `js/n5.js` | `n5` | Nyi Nyi |
| Q4 Place | N6 states, sorted bars | `js/n6.js` | `n6` | Nyi Nyi |
| Q4 Place | N7 First Nations vs non-Indigenous over time | `js/n7.js` | `n7` | Lynn |

The chart ideas for N1–N7 are suggestions: keep them **simple and familiar** (bar, line). Change the title in
`index.html` to your chart's main finding. **Only edit your own file.**

## Shared features (Lynn, in `js/common.js` + `css/style.css`)
- **Tab bar** – click or use the arrow keys. The URL changes (e.g. `#people`) so a tab can be linked directly.
- **Full screen** – every panel gets a ⛶ button automatically. Esc or ✕ closes it. Your chart redraws by itself.
- **Light / dark mode** – button in the header. **Never type colour codes in your chart.** Use the palette:

| Use | Code | Light | Dark |
|---|---|---|---|
| The finding (highlight) | `C().red` | #cc2131 | #ff6b78 |
| Everything else / not selected | `C().dim` | #d6d6d6 | #4a4a4a |
| Second grey | `C().mid` | #8c8c8c | #8c8c8c |
| Text, main line | `C().ink` | #1a1a1a | #ececec |
| Labels, notes, reference lines | `C().muted` | #595959 | #b3b3b3 |
| Gridlines | `C().grid` | #e6e6e6 | #333333 |
| "Went down" (diverging) | `C().blue` | #2166ac | #6aaed6 |

Read `C()` **inside** your draw function so colours update when the theme changes. Use `seqRed(t)` for a
light-to-dark scale and `divRB(t)` for a blue–white–red scale.

Template:
```js
DATA.then(data => {
  function draw() {
    const { g, w, h } = frame("n4", { t: 10, r: 10, b: 30, l: 50 });
    const c = C();
    // your D3 code, e.g. .attr("fill", d => d.age === FILTER.age_group ? c.red : c.dim)
  }
  onDraw(draw);          // redraws on resize, tab change, full screen and theme change
  onFilter("n4", draw);  // redraws when the filter bar changes
});
```
Run locally with VS Code Live Server and open `index.html`.
