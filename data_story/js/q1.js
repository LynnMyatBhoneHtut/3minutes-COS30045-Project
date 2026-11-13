// Yati – Q1 annotated line + context chart (brushing, focus + context, tooltips)
// Main chart = selected years. Small chart underneath = all years; drag on it to zoom the main chart.
const Q1_EVENTS = [
  { year: 2012, label: "Vic break" },
  { year: 2017, label: "NSW break" },
  { year: 2020, label: "COVID-19" }
];
let q1Range = [2011, 2021];

DATA.then(data => {
  function draw() {
    // Total hospitalisations and bed days per year, after the filter bar
    const rows = filtered(data.national);
    const years = d3.range(2011, 2022).map(year => {
      const r = rows.filter(d => d.year === year);
      return { year, hosp: d3.sum(r, d => d.hosp), bed_days: d3.sum(r, d => d.bed_days) };
    });
    const shown = years.filter(d => d.year >= q1Range[0] && d.year <= q1Range[1]);

    const { svg, g, w, h } = frame("q1", { t: 14, r: 20, b: 22, l: 50 });
    const ctxH = 30, gap = 38;
    const mainH = h - ctxH - gap;

    // Main chart
    const x = d3.scaleLinear().domain(q1Range).range([0, w]);
    const y = d3.scaleLinear().domain([0, (d3.max(shown, d => d.hosp) || 1) * 1.1]).nice().range([mainH, 0]);
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(d3.format("~s")))
      .call(a => a.selectAll(".tick line").attr("stroke", C().grid));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${mainH})`)
      .call(d3.axisBottom(x).ticks(q1Range[1] - q1Range[0]).tickFormat(d3.format("d")));

    // Event markers explain the jumps (series breaks and COVID)
    Q1_EVENTS.filter(e => e.year >= q1Range[0] && e.year <= q1Range[1]).forEach(e => {
      const nearEnd = x(e.year) > w - 60;
      g.append("line").attr("x1", x(e.year)).attr("x2", x(e.year)).attr("y1", 0).attr("y2", mainH)
        .attr("stroke", C().muted).attr("stroke-dasharray", "3 3");
      g.append("text").attr("x", x(e.year) + (nearEnd ? -4 : 4)).attr("y", 8).attr("text-anchor", nearEnd ? "end" : "start")
        .attr("font-size", 10).attr("fill", C().muted).text(e.label);
    });

    g.append("path").datum(shown).attr("fill", "none").attr("stroke", C().ink).attr("stroke-width", 2.5)
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.hosp)));

    // Points: hover for details, click to choose the year for the other charts
    g.selectAll(".q1-pt").data(shown).join("circle").attr("class", "q1-pt")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.hosp))
      .attr("r", d => d.year === FILTER.year ? 6 : 4)
      .attr("fill", d => d.year === FILTER.year ? C().red : C().ink).style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${d.year}</b><br>${fmt(d.hosp)} hospitalisations<br>${fmt(d.bed_days)} bed days<br><i>Click to select this year</i>`))
      .on("mouseleave", hideTip)
      .on("click", (e, d) => { d3.select("#f-year").property("value", d.year); setFilter("year", d.year); });

    // Context chart with brush (always all years)
    const cg = g.append("g").attr("transform", `translate(0,${mainH + gap})`);
    const xc = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
    const yc = d3.scaleLinear().domain([0, d3.max(years, d => d.hosp) || 1]).range([ctxH, 0]);
    cg.append("path").datum(years).attr("fill", C().dim)
      .attr("d", d3.area().x(d => xc(d.year)).y0(ctxH).y1(d => yc(d.hosp)));
    cg.append("g").attr("class", "axis").attr("transform", `translate(0,${ctxH})`)
      .call(d3.axisBottom(xc).ticks(10).tickFormat(d3.format("d")));
    cg.append("text").attr("y", -4).attr("font-size", 10).attr("fill", C().muted).text("Drag here to zoom");

    const brush = d3.brushX().extent([[0, 0], [w, ctxH]]).on("end", ({ selection, sourceEvent }) => {
      if (!sourceEvent) return; // only react to the user, not to code
      if (!selection) { q1Range = [2011, 2021]; draw(); return; }
      let [a, b] = selection.map(xc.invert).map(Math.round);
      if (b - a < 2) { b = Math.min(a + 2, 2021); a = b - 2; }
      q1Range = [a, b];
      draw();
    });
    const bg = cg.append("g").call(brush);
    bg.select(".selection").attr("fill", C().red).attr("fill-opacity", 0.2).attr("stroke", C().red);
    if (q1Range[0] !== 2011 || q1Range[1] !== 2021) bg.call(brush.move, [xc(q1Range[0]), xc(q1Range[1])]);
  }

  onDraw(draw);
  onFilter("q1", draw);
});
