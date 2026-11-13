// N1 – Lynn. Change from the previous year (% up or down), one bar per year.
// Up = red, down = blue (same meaning as the state map). Follows Road user, Sex and Age filters.
DATA.then(data => {
  function draw() {
    const c = C();
    const totals = d3.rollup(filtered(data.national), v => d3.sum(v, d => d.hosp), d => d.year);
    const rows = d3.range(2012, 2022).map(year => {
      const prev = totals.get(year - 1) || 0, now = totals.get(year) || 0;
      return { year, prev, now, change: prev ? (now - prev) / prev : 0 };
    });

    const { g, w, h } = frame("n1", { t: 24, r: 16, b: 30, l: 48 });
    const x = d3.scaleBand().domain(rows.map(d => d.year)).range([0, w]).padding(0.3);
    const lim = Math.max(0.02, d3.max(rows, d => Math.abs(d.change)));
    const y = d3.scaleLinear().domain([-lim, lim]).nice().range([h, 0]);
    const pct = v => d3.format(Math.abs(v) < 0.0005 ? "+.2%" : "+.1%")(v);   // tiny changes get 2 decimals, so nothing shows as "−0.0%"

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("+.0%")).tickSize(-w))
      .call(a => a.select(".domain").remove());
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0))
      .call(a => a.select(".domain").remove());
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", c.muted);

    g.selectAll(".bar").data(rows).join("rect")
      .attr("x", d => x(d.year)).attr("width", x.bandwidth())
      .attr("y", d => y(Math.max(0, d.change))).attr("height", d => Math.abs(y(d.change) - y(0)))
      .attr("fill", d => d.change >= 0 ? c.red : c.blue)
      .attr("stroke", d => d.year === FILTER.year ? c.ink : "none").attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mousemove", (e, d) => showTip(e, `<b>${d.year - 1} → ${d.year}</b><br>${fmt(d.prev)} → ${fmt(d.now)}<br>${pct(d.change)}`))
      .on("mouseleave", hideTip)
      .on("click", (e, d) => setFilter("year", d.year));

    // value label on every bar (above for up, below for down)
    g.selectAll(".lbl").data(rows).join("text")
      .attr("x", d => x(d.year) + x.bandwidth() / 2).attr("text-anchor", "middle").attr("font-size", 11)
      .attr("y", d => d.change >= 0 ? y(d.change) - 4 : y(d.change) + 12)
      .attr("fill", c.ink).text(d => pct(d.change));

    g.append("text").attr("y", -10).attr("font-size", 11).attr("fill", c.muted)
      .text("Red = more than the year before · Blue = fewer · click a bar to choose that year");
  }
  onDraw(draw);
  onFilter("n1", draw);
});
