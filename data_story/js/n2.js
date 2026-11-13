// N2 – Lynn. Who gets hurt most: road user groups for the chosen year, largest first.
// Red = the selected road user (or the largest group when Road user is "All"). Follows Year, Sex and Age.
DATA.then(data => {
  function draw() {
    const c = C();
    const rows = data.national.filter(d => d.year === FILTER.year &&
      ["sex", "age_group"].every(k => FILTER[k] === "All" || d[k] === FILTER[k]));
    const sums = d3.rollups(rows, v => d3.sum(v, d => d.hosp), d => d.group)
      .map(([group, hosp]) => ({ group, hosp })).sort((a, b) => b.hosp - a.hosp);
    const total = d3.sum(sums, d => d.hosp) || 1;
    const focus = FILTER.group !== "All" ? FILTER.group : sums[0] && sums[0].group;

    const { g, w, h } = frame("n2", { t: 22, r: 90, b: 6, l: 118 });
    const y = d3.scaleBand().domain(sums.map(d => d.group)).range([0, h]).padding(0.25);
    const x = d3.scaleLinear().domain([0, d3.max(sums, d => d.hosp) || 1]).range([0, w]);

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).call(a => a.select(".domain").remove())
      .selectAll("text").attr("font-size", 12);
    g.selectAll(".bar").data(sums).join("rect")
      .attr("y", d => y(d.group)).attr("height", y.bandwidth()).attr("width", d => x(d.hosp))
      .attr("fill", d => d.group === focus ? c.red : c.mid).style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${d.group}, ${FILTER.year}</b><br>${fmt(d.hosp)} hospitalisations<br>${d3.format(".1%")(d.hosp / total)} of all`))
      .on("mouseleave", hideTip)
      .on("click", (e, d) => setFilter("group", FILTER.group === d.group ? "All" : d.group));
    g.selectAll(".lbl").data(sums).join("text")
      .attr("x", d => x(d.hosp) + 6).attr("y", d => y(d.group) + y.bandwidth() / 2 + 4).attr("font-size", 11)
      .attr("fill", d => d.group === focus ? c.red : c.ink).attr("font-weight", d => d.group === focus ? 700 : 400)
      .text(d => `${fmt(d.hosp)} (${d3.format(".0%")(d.hosp / total)})`);
    g.append("text").attr("y", -8).attr("font-size", 11).attr("fill", c.muted)
      .text(`Year ${FILTER.year} · click a bar to filter every chart by that road user`);
  }
  onDraw(draw);
  onFilter("n2", draw);
});
