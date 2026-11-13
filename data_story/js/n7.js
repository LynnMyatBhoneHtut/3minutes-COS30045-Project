// N7 – Lynn. First Nations vs non-Indigenous hospitalisations over time, indexed (2011 = 100).
// Indexing lets two groups of very different size share one scale. First Nations = red (the finding).
// Follows the Year filter (vertical marker); click a point to choose a year.
DATA.then(data => {
  const GROUPS = ["First Nations people", "Non-Indigenous"];
  function draw() {
    const c = C(), colour = { "First Nations people": c.red, "Non-Indigenous": c.mid };
    const series = GROUPS.map(name => {
      const byYear = d3.rollup(data.firstNations.filter(d => d.indigenous_status === name), v => d3.sum(v, d => d.hosp), d => d.year);
      const base = byYear.get(2011) || 1;
      const values = d3.range(2011, 2022).map(year => ({ name, year, hosp: byYear.get(year) || 0, index: (byYear.get(year) || 0) / base * 100 }));
      return { name, values, change: values[values.length - 1].index - 100 };
    });

    const { g, w, h } = frame("n7", { t: 24, r: 150, b: 26, l: 44 });
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
    const all = series.flatMap(s => s.values.map(v => v.index));
    const y = d3.scaleLinear().domain([Math.min(90, d3.min(all)), d3.max(all) + 10]).nice().range([h, 0]);

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickSize(-w)).call(a => a.select(".domain").remove());
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(11).tickFormat(d3.format("d")));
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", c.muted).attr("stroke-dasharray", "4 4");
    g.append("line").attr("x1", x(FILTER.year)).attr("x2", x(FILTER.year)).attr("y1", 0).attr("y2", h).attr("stroke", c.muted).attr("stroke-width", 1);

    const line = d3.line().x(d => x(d.year)).y(d => y(d.index));
    g.selectAll(".ln").data(series).join("path").attr("fill", "none").attr("stroke", d => colour[d.name])
      .attr("stroke-width", d => d.name === GROUPS[0] ? 3 : 2).attr("d", d => line(d.values));
    g.selectAll(".pts").data(series).join("g").attr("fill", d => colour[d.name])
      .selectAll("circle").data(d => d.values).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.index)).attr("r", d => d.year === FILTER.year ? 5 : 3).style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${d.name}, ${d.year}</b><br>${fmt(d.hosp)} hospitalisations<br>Index ${d.index.toFixed(0)} (2011 = 100)`))
      .on("mouseleave", hideTip)
      .on("click", (e, d) => setFilter("year", d.year));
    g.selectAll(".end").data(series).join("text")
      .attr("x", w + 8).attr("y", d => y(d.values[d.values.length - 1].index) + 4).attr("font-size", 12).attr("font-weight", 700)
      .attr("fill", d => colour[d.name]).text(d => `${d.name.replace(" people", "")} ${d.change >= 0 ? "+" : ""}${Math.round(d.change)}%`);
    g.append("text").attr("y", -10).attr("font-size", 11).attr("fill", c.muted)
      .text("Each line starts at 100 in 2011 · dashed line = no change · counts, not rates");
  }
  onDraw(draw);
  onFilter("n7", draw);
});
