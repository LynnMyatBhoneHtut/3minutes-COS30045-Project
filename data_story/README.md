# Dashboard (Stand-up 2)

One-screen D3 dashboard: no scrolling, no extra pages. All charts use one file: `data/3minutes_hospitalisations_clean.csv`.

## Who edits which file
| Chart | File | Panel id | Owner | Interaction |
|---|---|---|---|---|
| Q1 annotated line + context chart | `js/q1.js` | `q1` | Yati | Brushing, focus + context, tooltips |
| Q2 indexed multi-line | `js/q2.js` | `q2` | Lynn | Filter / highlight buttons, tooltips |
| Q3 heatmap age group × year | `js/q3.js` | `q3` | Nyi Nyi | Sex toggle (dynamic filter), details on demand |
| Q4 choropleth % change by state + linked line | `js/q4map.js` | `q4` | Nyi Nyi | Year slider, click a state, tooltips |
| Q4 First Nations 100% stacked bar | `js/q4fn.js` | `q5` | Yati | Toggle % / counts |

Filter bar (Year, Road user, Sex, Age group, Reset) – `index.html` + end of `js/common.js` – Yati. To make your chart follow it: use `filtered(data.national)` for national rows, `FILTER.year` for the year, and add `onFilter("yourname", draw)`.

**Only edit your own file.** Shared helpers are in `js/common.js`:
- `DATA` – promise with `{ national, states, firstNations }` (rows split by the `source` column)
- `frame(id, margins)` – makes an SVG that fills the panel, returns `{ g, w, h }`
- `onDraw(fn)` – runs your draw function and redraws on window resize
- `showTip(event, html)` / `hideTip()` – tooltip
- Put buttons, toggles or sliders in the `<div id="qX-controls">` above your chart.

Template for your file:
```js
DATA.then(data => {
  onDraw(() => {
    const { g, w, h } = frame("q3");
    // your D3 code
  });
});
```

Run locally with VS Code Live Server and open `index.html` (d3.csv needs a server).

## Colours (Swinburne theme)
- Red `#cc2131` – main highlight colour
- Black `#000000` – titles and header
- Light grey `#d6d6d6` – dimmed / not selected
Use red for the thing you want people to notice, grey for everything else.
