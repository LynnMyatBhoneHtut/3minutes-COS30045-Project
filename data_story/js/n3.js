// N3 – Lynn. Men and women by road user: two bars per group for the chosen year.
// Male = dark (ink), Female = grey (mid): they differ in lightness, so they work for colour-blind readers.
// The label shows % male; the most male-dominated group is in red. Follows Year and Age.
DATA.then(data => {
  function draw() {
    const c = C();
    const rows = data.national.filter(d => d.year === FILTER.year && (d.sex === "Male" || d.sex === "Female") &&
      (FILTER.age_group === "All" || d.age_group === FILTER.age_group));
    const groups = d3.rollups(rows, v => ({
      Male: d3.sum(v.filter(d => d.sex === "Male"), d => d.hosp),
      Female: d3.sum(v.filter(d => d.sex === "Female"), d => d.hosp)
    }), d => d.group).map(([group, s]) => ({ group, ...s, share: s.Male / ((s.Male + s.Female) || 1) }))
      .filter(d => d.group !== "Other or unknown").sort((a, b) => (b.Male + b.Female) - (a.Male + a.Female));
    const top = d3.greatest(groups, d => d.share);
    const sexes = ["Male", "Female"], colour = { Male: c.ink, Female: c.mid };

    const { g, w, h } = frame("n3", { t: 24, r: 70, b: 6, l: 118 });
    const y0 = d3.scaleBand().domain(groups.map(d => d.group)).range([0, h]).padding(0.25);
    const y1 = d3.scaleBand().domain(sexes).range([0, y0.bandwidth()]).padding(0.08);
    const x = d3.scaleLinear().domain([0, d3.max(groups, d => Math.max(d.Male, d.Female)) || 1]).range([0, w]);

    g.append("g").attr("class", "axis").call(d3.axisLeft(y0).tickSize(0)).call(a => a.select(".domain").remove())
      .selectAll("text").attr("font-size", 12);
    const row = g.selectAll(".grp").data(groups).join("g").attr("transform", d => `translate(0,${y0(d.group)})`);
    row.selectAll("rect").data(d => sexes.map(s => ({ s, v: d[s], group: d.group }))).join("rect")
      .attr("y", d => y1(d.s)).attr("height", y1.bandwidth()).attr("width", d => x(d.v))
      .attr("fill", d => colour[d.s]).attr("opacity", d => FILTER.sex === "All" || FILTER.sex === d.s ? 1 : 0.3)
      .on("mousemove", (e, d) => showTip(e, `<b>${d.group}, ${FILTER.year}</b><br>${d.s}: ${fmt(d.v)}`))
      .on("mouseleave", hideTip);
    row.append("text").attr("x", d => x(Math.max(d.Male, d.Female)) + 6).attr("y", y0.bandwidth() / 2 + 4)
      .attr("font-size", 11).attr("fill", d => d === top ? c.red : c.ink).attr("font-weight", d => d === top ? 700 : 400)
      .text(d => `${d3.format(".0%")(d.share)} male`);

    // legend
    const lg = g.append("g").attr("transform", "translate(0,-14)");
    sexes.forEach((s, i) => {
      lg.append("rect").attr("x", i * 70).attr("y", -9).attr("width", 10).attr("height", 10).attr("fill", colour[s]);
      lg.append("text").attr("x", i * 70 + 14).attr("font-size", 11).attr("fill", c.ink).text(s);
    });
    lg.append("text").attr("x", 150).attr("font-size", 11).attr("fill", c.muted).text(`Year ${FILTER.year}`);
  }
  onDraw(draw);
  onFilter("n3", draw);
});
