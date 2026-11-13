// N6 – Nyi Nyi. Hospitalisations by state for the chosen year, largest first.
// Red = the three biggest states (the finding), grey = the rest.
// States with a series break (the counting method changed) get a dashed outline and a * mark.
// Follows the Year filter only: the state file has totals, not road user, sex or age.
// Click a bar to open Lynn's state detail pop-up (statedetail.js).
//
// AI use summary: I asked Claude (Anthropic) to "write the d3 for my 3 charts (N4, N5, N6)".
// Claude wrote the first version of this file using our shared helpers in common.js;
// I reviewed, tested and edited it.

var N6_NAMES = {
  NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", SA: "South Australia",
  WA: "Western Australia", Tas: "Tasmania", NT: "Northern Territory", ACT: "ACT"
};

DATA.then(function(data) {

  function draw() {
    var c = C();

    // one bar per state for the chosen year, largest first
    var bars = data.states
      .filter(function(d) { return d.year === FILTER.year; })
      .map(function(d) { return { state: d.state, hosp: d.hosp, brk: d.series_break === 1 }; })
      .sort(function(a, b) { return b.hosp - a.hosp; });
    var total = d3.sum(bars, function(d) { return d.hosp; }) || 1;
    var top3 = bars.slice(0, 3).map(function(d) { return d.state; });
    var top3Share = d3.sum(bars.slice(0, 3), function(d) { return d.hosp; }) / total;
    var anyBreak = bars.some(function(d) { return d.brk; });

    var chart = frame("n6", { t: 24, r: 90, b: anyBreak ? 22 : 6, l: 130 });
    var g = chart.g, w = chart.w, h = chart.h;

    var y = d3.scaleBand().domain(bars.map(function(d) { return d.state; })).range([0, h]).padding(0.25);
    var x = d3.scaleLinear().domain([0, d3.max(bars, function(d) { return d.hosp; }) || 1]).range([0, w]);

    // state names on the left (* = series break)
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).tickSize(0).tickFormat(function(code) {
        var row = bars.find(function(d) { return d.state === code; });
        return N6_NAMES[code] + (row.brk ? " *" : "");
      }))
      .call(function(a) { a.select(".domain").remove(); })
      .selectAll("text").attr("font-size", 12);

    // bars
    g.selectAll(".bar")
      .data(bars)
      .join("rect")
      .attr("class", "bar")
      .attr("y", function(d) { return y(d.state); })
      .attr("height", y.bandwidth())
      .attr("width", function(d) { return x(d.hosp); })
      .attr("fill", function(d) { return top3.indexOf(d.state) >= 0 ? c.red : c.dim; })
      .attr("stroke", function(d) { return d.brk ? c.ink : "none"; })
      .attr("stroke-dasharray", "4,3")
      .style("cursor", "pointer")
      .on("mousemove", function(event, d) {
        var html = "<b>" + N6_NAMES[d.state] + ", " + FILTER.year + "</b><br>" +
          fmt(d.hosp) + " hospitalisations<br>" + d3.format(".1%")(d.hosp / total) + " of Australia";
        if (d.brk) { html = html + "<br><i>Series break: new counting method, compare with care</i>"; }
        showTip(event, html + "<br><small>Click for state details</small>");
      })
      .on("mouseleave", hideTip)
      .on("click", function(event, d) {
        if (window.openStateDetail) { openStateDetail(d.state); }
      });

    // count and % at the end of each bar
    g.selectAll(".lbl")
      .data(bars)
      .join("text")
      .attr("class", "lbl")
      .attr("x", function(d) { return x(d.hosp) + 6; })
      .attr("y", function(d) { return y(d.state) + y.bandwidth() / 2 + 4; })
      .attr("font-size", 11)
      .attr("fill", function(d) { return top3.indexOf(d.state) >= 0 ? c.red : c.ink; })
      .attr("font-weight", function(d) { return top3.indexOf(d.state) >= 0 ? 700 : 400; })
      .text(function(d) { return fmt(d.hosp) + " (" + d3.format(".0%")(d.hosp / total) + ")"; });

    // red note: the finding for the chosen year
    g.append("text")
      .attr("y", -10)
      .attr("font-size", 11)
      .attr("fill", c.red)
      .attr("font-weight", 700)
      .text("Top 3 states = " + d3.format(".0%")(top3Share) + " of cases in " + FILTER.year);

    // series break note under the chart
    if (anyBreak) {
      g.append("text")
        .attr("y", h + 18)
        .attr("font-size", 11)
        .attr("fill", c.muted)
        .text("* Series break: Vic counts changed from 2012, NSW from 2017. Counts, not rates.");
    }
  }

  onDraw(draw);
  onFilter("n6", draw);
});
