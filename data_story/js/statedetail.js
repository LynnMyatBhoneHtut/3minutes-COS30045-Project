// State detail pop-up – Lynn.
// Click a state on the map -> a big view of that state with all its numbers:
// the state shape, key numbers, and a large line chart (counts, or compared with all states).
// Close with ✕, Esc, or by clicking outside. Follows the Year filter and light / dark mode.

let sdState = null;          // state code shown, e.g. "Qld"
let sdMode = "count";        // "count" or "index" (compared with all states, 2011 = 100)
let sdReturnFocus = null;    // element to focus again after closing

Promise.all([DATA, d3.json("data/aus_states.geojson")]).then(([data, geo]) => {
  const modal = document.getElementById("state-detail");
  const YEARS = d3.range(2011, 2022);
  const BREAK = { NSW: 2017, Vic: 2012 };   // first year of the new counting method
  const row = (st, yr) => data.states.find(d => d.state === st && d.year === yr) || { hosp: 0, bed_days: 0 };
  const allStates = yr => d3.sum(data.states.filter(d => d.year === yr), d => d.hosp);
  const change = (st, yr) => row(st, 2011).hosp ? row(st, yr).hosp / row(st, 2011).hosp - 1 : 0;
  const maxChange = d3.max(data.states, d => Math.abs(change(d.state, d.year)));
  const pct = d3.format("+.0%");

  // buttons: Count / Compared with all states, and Previous / Next state
  const codes = geo.features.map(f => f.properties.code);
  const ctl = d3.select("#sd-controls");
  ctl.selectAll("button.mode").data([["count", "Count per year"], ["index", "Compared with all states (2011 = 100)"]])
    .join("button").attr("class", "mode").text(d => d[1]).on("click", (e, d) => { sdMode = d[0]; draw(); });
  ctl.append("button").attr("class", "nav").text("‹ Previous state")
    .on("click", () => open(codes[(codes.indexOf(sdState) + codes.length - 1) % codes.length]));
  ctl.append("button").attr("class", "nav").text("Next state ›")
    .on("click", () => open(codes[(codes.indexOf(sdState) + 1) % codes.length]));

  function open(code) {
    if (!sdReturnFocus) sdReturnFocus = document.activeElement;
    sdState = code; modal.hidden = false; hideTip();
    draw(); document.getElementById("sd-close").focus();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    if (sdReturnFocus) sdReturnFocus.focus();
    sdReturnFocus = null;
  }
  window.openStateDetail = open;    // the map (q4map.js) calls this when a state is clicked
  document.getElementById("sd-close").addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  function draw() {
    if (modal.hidden || !sdState) return;
    const c = C(), year = FILTER.year;
    const feature = geo.features.find(f => f.properties.code === sdState);
    const r11 = row(sdState, 2011), rY = row(sdState, year);
    ctl.selectAll("button.mode").classed("on", d => d[0] === sdMode);
    document.getElementById("sd-title").textContent = `${feature.properties.name} (${sdState}) · 2011 → ${year}`;

    // ---- key numbers ----
    const ranked = codes.map(s => ({ s, ch: change(s, year) })).sort((a, b) => b.ch - a.ch);
    const stats = [
      [fmt(r11.hosp), "Hospitalised in 2011"],
      [fmt(rY.hosp), `Hospitalised in ${year}`],
      [pct(change(sdState, year)), "Change since 2011"],
      [`${ranked.findIndex(d => d.s === sdState) + 1} of 8`, "Rank by growth"],
      [d3.format(".1%")(rY.hosp / (allStates(year) || 1)), `Share of all states, ${year}`],
      [rY.hosp ? (rY.bed_days / rY.hosp).toFixed(1) + " days" : "–", `Average stay, ${year}`]
    ];
    d3.select("#sd-stats").selectAll("div").data(stats).join("div")
      .html(d => `<strong>${d[0]}</strong><span>${d[1]}</span>`);
    document.getElementById("sd-note").textContent = BREAK[sdState]
      ? `Series break: from ${BREAK[sdState]} ${sdState} stopped counting patients treated only in the emergency department, so part of the change is a counting change, not fewer injuries. Hollow points mark these years.`
      : "";

    // ---- big state shape, coloured like the map ----
    const shape = frame("sd-shape", { t: 4, r: 4, b: 4, l: 4 });
    // size the shape to its largest piece of land, so tiny far-off islands (e.g. Lord Howe for NSW) don't shrink it
    let fitTo = feature;
    if (feature.geometry.type === "MultiPolygon") {
      const parts = feature.geometry.coordinates.map(c => ({ type: "Feature", geometry: { type: "Polygon", coordinates: c } }));
      fitTo = d3.greatest(parts, d3.geoArea);
    }
    const proj = d3.geoMercator().fitSize([shape.w, shape.h], fitTo);
    const colour = d3.scaleDiverging().domain([-maxChange, 0, maxChange]).interpolator(divRB);
    shape.svg.append("defs").append("clipPath").attr("id", "sd-clip").append("rect").attr("width", shape.w + 8).attr("height", shape.h + 8);
    shape.g.attr("clip-path", "url(#sd-clip)").append("path").datum(feature).attr("d", d3.geoPath(proj))
      .attr("fill", colour(change(sdState, year))).attr("stroke", c.ink).attr("stroke-width", 1.5);

    // ---- big line chart ----
    const pts = YEARS.map(yr => {
      const v = row(sdState, yr).hosp;
      return { year: yr, v, index: v / (r11.hosp || 1) * 100, aus: allStates(yr) / allStates(2011) * 100,
               brk: BREAK[sdState] !== undefined && yr >= BREAK[sdState] };
    });
    const key = sdMode === "count" ? "v" : "index";
    const L = frame("sd-line", { t: 30, r: 120, b: 30, l: 56 });
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, L.w]);
    const vals = sdMode === "count" ? pts.map(d => d.v) : pts.flatMap(d => [d.index, d.aus]);
    const y = d3.scaleLinear().domain(sdMode === "count" ? [0, d3.max(vals) * 1.1] : [Math.min(80, d3.min(vals) - 5), d3.max(vals) + 10])
      .nice().range([L.h, 0]);

    L.g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6).tickSize(-L.w).tickFormat(sdMode === "count" ? d3.format(",") : d => d))
      .call(a => a.select(".domain").remove());
    L.g.append("g").attr("class", "axis").attr("transform", `translate(0,${L.h})`).call(d3.axisBottom(x).ticks(11).tickFormat(d3.format("d")));
    L.g.append("text").attr("y", -14).attr("font-size", 12).attr("fill", c.muted)
      .text(sdMode === "count" ? `Hospitalisations per year, ${sdState}` : `${sdState} vs all states combined (2011 = 100) · dashed line = no change`);
    L.g.append("line").attr("x1", x(year)).attr("x2", x(year)).attr("y1", 0).attr("y2", L.h).attr("stroke", c.muted).attr("stroke-dasharray", "3 3");
    if (BREAK[sdState]) {
      L.g.append("line").attr("x1", x(BREAK[sdState] - 0.5)).attr("x2", x(BREAK[sdState] - 0.5)).attr("y1", 0).attr("y2", L.h)
        .attr("stroke", c.muted).attr("stroke-dasharray", "1 3");
      L.g.append("text").attr("x", x(BREAK[sdState] - 0.5) + 4).attr("y", 12).attr("font-size", 11).attr("fill", c.muted).text("series break");
    }
    if (sdMode === "index") {
      L.g.append("line").attr("x1", 0).attr("x2", L.w).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", c.muted).attr("stroke-dasharray", "4 4");
      L.g.append("path").datum(pts).attr("fill", "none").attr("stroke", c.mid).attr("stroke-width", 2)
        .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.aus)));
      const last = pts[pts.length - 1];
      L.g.append("text").attr("x", L.w + 8).attr("y", y(last.aus) + 4).attr("font-size", 12).attr("fill", c.mid)
        .text(`All states ${pct(last.aus / 100 - 1)}`);
    }
    L.g.append("path").datum(pts).attr("fill", "none").attr("stroke", c.red).attr("stroke-width", 3)
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d[key])));
    L.g.selectAll("circle").data(pts).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d[key])).attr("r", d => d.year === year ? 6 : 4)
      .attr("fill", d => d.brk ? c.panel : c.red).attr("stroke", c.red).attr("stroke-width", 2).style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${sdState} ${d.year}</b><br>${fmt(d.v)} hospitalisations<br>Index ${d.index.toFixed(0)} (2011 = 100)` + (d.brk ? "<br><i>New counting method</i>" : "")))
      .on("mouseleave", hideTip)
      .on("click", (e, d) => setFilter("year", d.year));
    if (sdMode === "count") {   // label every point with its value
      L.g.selectAll(".val").data(pts).join("text").attr("x", d => x(d.year)).attr("y", d => y(d.v) - 10)
        .attr("text-anchor", "middle").attr("font-size", 10).attr("fill", c.ink).text(d => fmt(d.v));
    } else {
      const last = pts[pts.length - 1];
      L.g.append("text").attr("x", L.w + 8).attr("y", y(last.index) + 4).attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", c.red).text(`${sdState} ${pct(last.index / 100 - 1)}`);
    }
  }

  onDraw(draw);
  onFilter("statedetail", draw);
});
