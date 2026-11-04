// Shared helpers for every chart. Load data once, then each qX.js uses DATA.
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
