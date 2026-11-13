// Lynn – Q2 indexed multi-line (2011 = 100), filter / highlight buttons
const Q2_GROUPS = ["Pedal cyclist", "Motorcyclist", "Car driver", "Car passenger", "Pedestrian", "Truck, van or bus"];
// Colour-blind-safe categorical colours (Okabe-Ito). Cyclists = Swinburne red because they are the finding.
// Dark mode uses lighter versions so the lines stay readable on a dark background.
const Q2_LIGHT = { "Motorcyclist": "#0072b2", "Car passenger": "#cc79a7", "Pedestrian": "#009e73", "Truck, van or bus": "#e69f00" };
const Q2_DARK  = { "Motorcyclist": "#56b4e9", "Car passenger": "#e8a6cc", "Pedestrian": "#2fc79b", "Truck, van or bus": "#f0b93a" };
function q2Color(name) {
  if (name === "Pedal cyclist") return C().red;
  if (name === "Car driver") return C().ink;
  return (isDark() ? Q2_DARK : Q2_LIGHT)[name];
}
const q2Selected = new Set();   // empty = show all lines normally

DATA.then(data => {
  // total per group per year (after the Sex and Age filters), then index each group to its 2011 value
  function makeSeries() {
    const rows = data.national.filter(d => ["sex", "age_group"].every(k => FILTER[k] === "All" || d[k] === FILTER[k]));
    const totals = d3.rollup(rows.filter(d => Q2_GROUPS.includes(d.group)), v => d3.sum(v, d => d.hosp), d => d.group, d => d.year);
    return Q2_GROUPS.map(name => {
      const byYear = totals.get(name) || new Map(), base = byYear.get(2011) || 1;
      const values = d3.range(2011, 2022).map(year => ({ year, hosp: byYear.get(year) || 0, index: (byYear.get(year) || 0) / base * 100 }));
      return { name, values, change: values[values.length - 1].index - 100 };
    });
  }

  // highlight buttons
  d3.select("#q2-controls").selectAll("button").data(Q2_GROUPS).join("button")
    .style("--c", d => q2Color(d)).text(d => d)
    .on("click", (e, d) => { q2Selected.has(d) ? q2Selected.delete(d) : q2Selected.add(d); draw(); });

  // Road user filter highlights one line; otherwise the buttons decide
  const isOn = d => FILTER.group !== "All" ? d.name === FILTER.group : (q2Selected.size === 0 || q2Selected.has(d.name));

  function draw() {
    const series = makeSeries();
    d3.select("#q2-controls").selectAll("button").classed("on", d => q2Selected.has(d)).style("--c", d => q2Color(d));
    const { g, w, h } = frame("q2", { t: 8, r: 46, b: 22, l: 36 });
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
    const all = series.flatMap(s => s.values.map(v => v.index));
    const y = d3.scaleLinear().domain([d3.min(all) - 5, d3.max(all) + 5]).nice().range([h, 0]);

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(w < 300 ? 5 : 10).tickFormat(d => "'" + String(d).slice(2)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(100)).attr("y2", y(100))
      .attr("stroke", C().muted).attr("stroke-dasharray", "4 4");

    // dimmed lines first, highlighted lines on top
    const ordered = [...series].sort((a, b) => isOn(a) - isOn(b));
    const line = d3.line().x(d => x(d.year)).y(d => y(d.index));
    g.selectAll(".q2-line").data(ordered).join("path").attr("class", "q2-line")
      .attr("fill", "none").attr("stroke", d => isOn(d) ? q2Color(d.name) : C().dim)
      .attr("stroke-width", d => q2Selected.has(d.name) ? 3 : 2).attr("d", d => line(d.values));

    // hover points (details on demand)
    g.selectAll(".q2-pts").data(ordered.filter(isOn)).join("g").attr("class", "q2-pts")
      .attr("fill", d => q2Color(d.name))
      .selectAll("circle").data(d => d.values.map(v => ({ ...v, name: d.name }))).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.index)).attr("r", 3).style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${d.name}, ${d.year}</b><br>${fmt(d.hosp)} hospitalisations<br>Index ${d.index.toFixed(0)}`))
      .on("mouseleave", hideTip);

    // % change labels at the end of highlighted lines
    g.selectAll(".q2-end").data(ordered.filter(isOn)).join("text").attr("class", "q2-end")
      .attr("x", w + 4).attr("y", d => y(d.values[d.values.length - 1].index) + 4)
      .attr("fill", d => q2Color(d.name)).attr("font-size", 11).attr("font-weight", 700)
      .text(d => `${d.change >= 0 ? "+" : ""}${Math.round(d.change)}%`);
  }

  onDraw(draw);
  onFilter("q2", draw);
});
