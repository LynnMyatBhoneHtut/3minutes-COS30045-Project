// Yati – Q4 First Nations 100% stacked bar, toggle % / counts
// Where injured people live (remoteness), First Nations vs non-Indigenous, for the year in the filter bar.
const FN_GROUPS = ["First Nations people", "Non-Indigenous"];
const FN_AREAS = ["Major Cities", "Regional", "Remote"];
// colours come from the shared palette, so they follow light / dark mode
const FN_COLORS = { get "Major Cities"() { return C().dim; }, get "Regional"() { return C().mid; }, get "Remote"() { return C().red; } };
let fnMode = "share";

DATA.then(data => {
  d3.select("#q5-controls").selectAll("button").data([["share", "%"], ["count", "Count"]]).join("button")
    .text(d => d[1]).on("click", (e, d) => { fnMode = d[0]; draw(); });

  function draw() {
    d3.select("#q5-controls").selectAll("button").classed("on", d => d[0] === fnMode);
    const year = FILTER.year;

    // One row per group with the count and share for each remoteness area
    const rows = FN_GROUPS.map(status => {
      const r = data.firstNations.filter(d => d.year === year && d.indigenous_status === status);
      const total = d3.sum(r, d => d.hosp);
      const row = { status, total };
      FN_AREAS.forEach(a => {
        const n = d3.sum(r.filter(d => d.remoteness === a), d => d.hosp);
        row[a + "_n"] = n;
        row[a] = fnMode === "share" ? n / total : n;
      });
      return row;
    });

    const { svg, g, w, h } = frame("q5", { t: 22, r: 14, b: 40, l: 120 });
    const x = d3.scaleLinear().domain([0, fnMode === "share" ? 1 : d3.max(rows, d => d.total)]).nice().range([0, w]);
    const y = d3.scaleBand().domain(FN_GROUPS).range([0, h]).padding(0.35);

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(fnMode === "share" ? d3.format(".0%") : d3.format("~s")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    g.selectAll(".layer").data(d3.stack().keys(FN_AREAS)(rows)).join("g").attr("fill", d => FN_COLORS[d.key])
      .selectAll("rect").data(d => d.map(v => ({ ...v, key: d.key }))).join("rect")
      .attr("x", d => x(d[0])).attr("width", d => Math.max(0, x(d[1]) - x(d[0])))
      .attr("y", d => y(d.data.status)).attr("height", y.bandwidth())
      .on("mousemove", (e, d) => {
        const n = d.data[d.key + "_n"];
        showTip(e, `<b>${d.data.status}, ${year}</b><br>${d.key}: ${fmt(n)} (${d3.format(".0%")(n / d.data.total)})`);
      })
      .on("mouseleave", hideTip);

    // Label the remote share on each bar, because that is the main finding
    if (fnMode === "share") {
      g.selectAll(".fn-label").data(rows).join("text").attr("class", "fn-label")
        .attr("x", w).attr("y", d => y(d.status) - 4).attr("text-anchor", "end").attr("font-size", 11).attr("font-weight", 700)
        .attr("fill", C().red).text(d => `${d3.format(".0%")(d.Remote)} remote`);
    }

    svg.append("text").attr("x", 120).attr("y", 13).attr("font-size", 11).attr("fill", C().muted).text(`Year ${year} · by place of residence`);
    const legend = svg.append("g").attr("transform", `translate(120,${h + 22 + 34})`);
    FN_AREAS.forEach((a, i) => {
      const lg = legend.append("g").attr("transform", `translate(${i * 100},0)`);
      lg.append("rect").attr("y", -9).attr("width", 10).attr("height", 10).attr("fill", FN_COLORS[a]);
      lg.append("text").attr("x", 14).attr("font-size", 11).attr("fill", C().muted).text(a);
    });
  }

  onDraw(draw);
  onFilter("q4fn", draw);
});
