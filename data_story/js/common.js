// Shared helpers for every chart. Load data once, then each qX.js uses DATA.
//
// AI use summary (Lynn): for Stand-up 2 I used Claude (Anthropic) to help build the dashboard frame and these
// shared helpers; for Stand-up 3 I used it to help build the tab bar, full-screen buttons and light / dark mode.
// I reviewed, tested and edited the code myself. Yati's parts (filter bar, error handling, story line,
// no-data message, accessibility labels) have their own AI summary at the end of this file.
const fmt = d3.format(",");

// Road user groups used across charts (12 BITRE types -> 7)
const USER_GROUP = {
  "Car driver": "Car driver", "Car passenger": "Car passenger", "Car unknown position": "Car passenger",
  "Motorcyclist": "Motorcyclist", "Pedal cyclist": "Pedal cyclist", "Pedestrian": "Pedestrian",
  "Heavy transport driver": "Truck, van or bus", "Heavy transport passenger": "Truck, van or bus",
  "Heavy transport unknown position": "Truck, van or bus", "Pick-up truck or van occupant": "Truck, van or bus",
  "Bus occupant": "Truck, van or bus", "Other or unknown": "Other or unknown"
};

// DATA = { national, states, firstNations }  (split by the "source" column)
const DATA = d3.csv("data/3minutes_hospitalisations_clean.csv", d3.autoType).then(rows => ({
  national: rows.filter(d => d.source === "national").map(d => ({ ...d, group: USER_GROUP[d.road_user] || "Other or unknown" })),
  states: rows.filter(d => d.source === "state"),
  firstNations: rows.filter(d => d.source === "first_nations")
}));

// Error handling (Yati; code drafted with Claude, see AI note at the end of this file):
// if the CSV cannot be loaded (wrong path, file missing, opened without a local server),
// show a clear message on the page instead of empty charts.
DATA.catch(err => {
  console.error("Could not load the data file:", err);
  const box = document.createElement("div");
  box.className = "load-error"; box.setAttribute("role", "alert");
  box.textContent = "Sorry, the data could not be loaded. Open the site through a web server " +
    "(e.g. VS Code Live Server) and check that data/3minutes_hospitalisations_clean.csv exists.";
  document.body.appendChild(box);
});

// Tooltip
const tip = d3.select("#tooltip");
function showTip(e, html) {
  tip.style("opacity", 1).html(html)
    .style("left", Math.min(e.clientX + 12, window.innerWidth - 270) + "px").style("top", (e.clientY - 34) + "px");
}
function hideTip() { tip.style("opacity", 0); }
d3.selectAll(".info").on("mousemove", function (e) { showTip(e, this.dataset.tip); }).on("mouseleave", hideTip);

// Make an SVG that fills a panel. Returns { svg, g, w, h }.
function frame(id, m = { t: 10, r: 10, b: 24, l: 44 }) {
  const el = document.getElementById(id);
  el.querySelectorAll(".todo").forEach(n => n.remove());
  const W = el.clientWidth, H = el.clientHeight;
  const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("width", W).attr("height", H);
  // Accessibility (Yati, drafted with Claude): screen readers announce each chart as one image named
  // after its panel title (the finding), instead of reading out hundreds of SVG shapes.
  const title = el.closest(".panel") && el.closest(".panel").querySelector("h2");
  const name = title ? [...title.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(" ").trim() : id;
  svg.attr("role", "img").attr("aria-label", "Chart: " + name);
  svg.selectAll("*").remove();
  const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
  return { svg, g, w: Math.max(10, W - m.l - m.r), h: Math.max(10, H - m.t - m.b) };
}

// Run a draw function now and again when the window is resized
function onDraw(draw) { draw(); window.addEventListener("resize", draw); }

// Filter bar (Yati). Charts call onFilter(name, draw) to redraw when a filter changes.
const FILTER = { year: 2021, group: "All", sex: "All", age_group: "All" };
const filterEvents = d3.dispatch("change");
function onFilter(name, fn) { filterEvents.on("change." + name, fn); }
function setFilter(key, value) { FILTER[key] = value; filterEvents.call("change"); }

// National rows that match the Road user, Sex and Age group filters
function filtered(rows) {
  return rows.filter(d => ["group", "sex", "age_group"].every(k => FILTER[k] === "All" || d[k] === FILTER[k]));
}

const AGE_ORDER = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+", "Unknown"];

DATA.then(data => {
  const options = {
    year: d3.range(2021, 2010, -1),
    group: ["All", ...new Set(data.national.map(d => d.group))].sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)),
    sex: ["All", "Female", "Male", "Unknown"],
    age_group: ["All", ...AGE_ORDER]
  };
  Object.entries(options).forEach(([key, values]) => {
    d3.select("#f-" + key).on("change", function () { setFilter(key, key === "year" ? +this.value : this.value); })
      .selectAll("option").data(values).join("option").attr("value", d => d).text(d => d);
  });
  const sync = () => Object.keys(FILTER).forEach(k => d3.select("#f-" + k).property("value", FILTER[k]));
  d3.select("#f-reset").on("click", () => { Object.assign(FILTER, { year: 2021, group: "All", sex: "All", age_group: "All" }); sync(); filterEvents.call("change"); });
  onFilter("sync", sync);
  sync();
});

/* ===================== Stand-up 3: shared features (Lynn) ===================== */

// ---- Colour palette: ONE place for every colour ----
// Colours live in css/style.css as CSS variables, with a light and a dark set.
// C() reads the current set, so charts get the right colours in both themes.
function C() {
  const s = getComputedStyle(document.documentElement);
  const v = name => s.getPropertyValue(name).trim();
  return {
    ink: v("--ink"),       // main text, main line
    muted: v("--muted"),   // labels, notes, reference lines
    grid: v("--grid"),     // gridlines
    dim: v("--dim"),       // faded / not selected / context
    mid: v("--mid"),       // second grey (e.g. Regional)
    red: v("--red"),       // the finding (Swinburne red)
    panel: v("--panel"),   // panel background (used for borders and hollow points)
    blue: v("--blue"),     // "went down" side of the diverging map scale
    catA: v("--cat-a"),    // first grey category (e.g. Major Cities)
    catB: v("--cat-b")     // second grey category (e.g. Regional)
  };
}
const isDark = () => document.documentElement.dataset.theme === "dark";

// Sequential scale (Q3 heatmap): more = stronger. Dark mode goes dark -> bright red.
function seqRed(t) {
  return isDark() ? d3.interpolateRgb("#2b2b2b", "#ff6b78")(t) : d3.interpolateReds(t);
}
// Diverging scale (Q4 map): 0 = blue (fewer), 0.5 = no change, 1 = red (more).
function divRB(t) {
  return isDark() ? d3.piecewise(d3.interpolateRgb, ["#6aaed6", "#3a3a3a", "#ff6b78"])(t)
                  : d3.interpolateRdBu(1 - t);
}

// Redraw every chart (each chart already redraws on window resize via onDraw)
function redrawAll() { window.dispatchEvent(new Event("resize")); }

// ---- Light / dark mode ----
// Accessibility: the toggle is a real <button> (keyboard and screen-reader friendly); aria-pressed tells
// screen readers whether dark mode is on. The choice is remembered in localStorage when allowed.
(function theme() {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) { /* storage blocked: use light */ }
  root.dataset.theme = saved === "dark" ? "dark" : "light";
  const btn = document.getElementById("theme-toggle");
  const label = () => { btn.textContent = isDark() ? "☀ Light mode" : "☾ Dark mode"; btn.setAttribute("aria-pressed", isDark()); };
  label();
  btn.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { }
    label(); redrawAll();
  });
})();

// ---- Tab bar: switch between screens without scrolling ----
// Accessibility: uses the ARIA tabs pattern (role=tab / tabpanel, aria-selected, roving tabindex)
// and the Left / Right arrow keys, so the tabs work with a keyboard and a screen reader.
(function tabs() {
  const tabs = document.querySelectorAll('[role="tab"]');
  function show(id) {
    tabs.forEach(t => {
      const on = t.dataset.tab === id;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      document.getElementById("screen-" + t.dataset.tab).hidden = !on;
    });
    history.replaceState(null, "", "#" + id);
    redrawAll();   // hidden charts had no size, so draw them now
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(t.dataset.tab));
    t.addEventListener("keydown", e => {   // arrow keys move between tabs
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus(); show(next.dataset.tab);
    });
  });
  const start = location.hash.slice(1);
  show([...tabs].some(t => t.dataset.tab === start) ? start : tabs[0].dataset.tab);
})();

// ---- Full-screen button on every chart panel ----
// Accessibility: each button has an aria-label, and Esc closes the full-screen view.
(function fullScreen() {
  function close() {
    const open = document.querySelector(".panel.is-full");
    if (!open) return;
    open.classList.remove("is-full");
    open.querySelector(".fs-btn").textContent = "⛶";
    open.querySelector(".fs-btn").setAttribute("aria-label", "Show chart full screen");
    document.body.classList.remove("has-full");
    redrawAll();
  }
  document.querySelectorAll(".screen .panel h2").forEach(h2 => {   // not the state pop-up
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "fs-btn"; btn.textContent = "⛶";
    btn.setAttribute("aria-label", "Show chart full screen"); btn.title = "Full screen (Esc to close)";
    btn.addEventListener("click", () => {
      const panel = h2.closest(".panel");
      if (panel.classList.contains("is-full")) return close();
      close();
      panel.classList.add("is-full"); document.body.classList.add("has-full");
      btn.textContent = "✕"; btn.setAttribute("aria-label", "Close full screen");
      redrawAll();
    });
    h2.appendChild(btn);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();


/* ===================== Final submission additions (Yati) ===================== */

// ---- Story line: one takeaway per tab + a link to the next tab ----
// This turns the five tabs into one data story: each tab states its finding in plain words, then
// leads the reader on. Order: overview -> trend -> who -> age and sex -> where.
// Accessibility: aria-live="polite" so screen readers read the new takeaway when the tab changes.
const STORY = {
  overview:  { text: "About 100 people a day end up in hospital after a road crash, and the number keeps rising.", next: "trend", label: "See the trend" },
  trend:     { text: "Cases rose almost every year; only 2020 (COVID-19) broke the pattern.", next: "roadusers", label: "Who gets hurt?" },
  roadusers: { text: "Car drivers are the largest group, but cyclists grew fastest (+51%).", next: "people", label: "Which ages?" },
  people:    { text: "40–64s are hurt most, 65–74s are rising fastest, and about 2 in 3 patients are men.", next: "place", label: "Where do they live?" },
  place:     { text: "Vic, Qld and NSW have 78% of cases, and First Nations cases nearly doubled (+89%).", next: "overview", label: "Back to the overview" }
};
(function storyLine() {
  const box = document.getElementById("story");
  if (!box) return;
  const textEl = box.querySelector(".story-text"), nextBtn = box.querySelector(".story-next");
  function update() {
    const on = document.querySelector('[role="tab"][aria-selected="true"]');
    const s = on && STORY[on.dataset.tab];
    if (!s) return;
    textEl.textContent = s.text;
    nextBtn.textContent = s.label + " →";
    nextBtn.dataset.next = s.next;
  }
  // clicking "next" simply clicks the next tab, so the tab bar logic above stays in one place
  nextBtn.addEventListener("click", () => document.querySelector(`[data-tab="${nextBtn.dataset.next}"]`).click());
  document.querySelectorAll('[role="tab"]').forEach(t => {
    t.addEventListener("click", update);
    t.addEventListener("keydown", () => setTimeout(update, 0));   // after the arrow-key tab change
  });
  update();
})();

// ---- "No data" message (edge case) ----
// Some filter combinations match no hospitalisations (e.g. Other or unknown + Unknown sex + 0-7).
// Instead of flat lines and odd axes, each affected chart shows a short message.
// Each panel lists the filters its chart actually uses, so only charts that are really empty are covered.
const PANEL_FILTERS = {
  p1: ["group", "sex", "age_group"],            // Q1 trend
  p2: ["sex", "age_group"],                     // Q2 indexed lines (Road user only highlights)
  p3: ["group", "sex"],                         // Q3 heatmap (Age only highlights a row)
  pn1: ["group", "sex", "age_group"],           // N1 change from previous year
  pn2: ["year", "sex", "age_group"],            // N2 road users in the chosen year
  pn3: ["year", "age_group"],                   // N3 male vs female by road user
  pn4: ["year", "group", "sex"],                // N4 age groups in the chosen year
  pn5: ["group", "age_group"]                   // N5 men and women over time
};
DATA.then(data => {
  function checkEmpty() {
    Object.entries(PANEL_FILTERS).forEach(([id, keys]) => {
      const total = d3.sum(data.national.filter(d => keys.every(k => FILTER[k] === "All" || d[k] === FILTER[k])), d => d.hosp);
      const panel = document.getElementById(id);
      if (panel) panel.classList.toggle("no-data", total === 0);
    });
  }
  onFilter("empty", checkEmpty);
  checkEmpty();
}).catch(() => { /* load error already shown above */ });

// AI use summary (Yati): for the final submission I asked Claude (Anthropic) to "fix the website for the
// HD criteria: add accessibility labels, error handling for missing data, a story line with next-tab links,
// and a no-data message". Claude drafted the error handling, the aria-labels in frame(), the accessibility
// comments, the story line and the no-data check above; I reviewed, tested and edited them.
// For Stand-up 2 I also asked Claude to "add a filter bar that updates every chart": it drafted the filter bar
// (FILTER, setFilter, onFilter, filtered and the select menus); I reviewed and tested it.
// (Lynn adds her own AI summary for the shared features she wrote in this file.)
