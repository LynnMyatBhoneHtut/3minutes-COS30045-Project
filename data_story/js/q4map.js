// Nyi Nyi – Q4 choropleth: % change in hospitalisations by state since 2011, with a linked line chart
// Interaction: year slider (shared Year filter), click a state to show its line and open the big detail view, tooltips.
// Connected to the filter bar: the slider and the Year menu stay in sync, and clicking a year point
// on the line also changes the Year for every chart.
// Note: the state file only has totals, so the Road user / Sex / Age filters do not apply here.
//
// AI use summary: I asked Claude (Anthropic) to "check the dashboard and add my heatmap and
// choropleth map, and connect them to the filter". Claude wrote the first version of this file
// using our shared helpers in common.js; I reviewed, tested and edited it.

var Q4_YEARS = d3.range(2011, 2022);
var q4Selected = "NSW";   // the state shown in the line chart (NSW has the most people)

// series breaks from the BITRE state file (the counting method changed in these years)
var Q4_BREAK_NOTE = {
  NSW: "NSW changed its counting method in 2017 – compare with care.",
  Vic: "Vic changed its counting method in 2012 – compare with care."
};

Promise.all([DATA, d3.json("data/aus_states.geojson")]).then(function(results) {
  var data = results[0];
  var geo = results[1];

  // look up a state's count in one year
  function count(state, year) {
    var row = data.states.find(function(d) { return d.state === state && d.year === year; });
    return row ? row.hosp : 0;
  }

  // % change from 2011 to a year
  function change(state, year) {
    var base = count(state, 2011);
    return base > 0 ? (count(state, year) - base) / base : 0;
  }

  // the biggest change in any year, so the colours do not jump when the slider moves
  var maxChange = d3.max(data.states, function(d) { return Math.abs(change(d.state, d.year)); });

  // blue = fewer than 2011, white = same, red = more than 2011
  var color = d3.scaleDiverging()
    .domain([-maxChange, 0, maxChange])
    .interpolator(function(t) { return divRB(t); });

  var pct = d3.format("+.0%");

  // year slider: it changes the shared Year filter, so the other charts follow too
  var controls = d3.select("#q4-controls");
  controls.append("label").attr("for", "q4-year").style("font-size", "0.75rem").text("Year");
  controls.append("input")
    .attr("id", "q4-year")
    .attr("type", "range")
    .attr("min", 2011)
    .attr("max", 2021)
    .attr("step", 1)
    .style("accent-color", "var(--red)")   // Swinburne red slider
    .on("input", function() { setFilter("year", +this.value); });
  controls.append("span").attr("id", "q4-year-text").style("font-size", "0.75rem");

  function draw() {
    var year = FILTER.year;
    d3.select("#q4-year").property("value", year);
    d3.select("#q4-year-text").text(year === 2011 ? "2011 (base year)" : "2011 → " + year);

    var chart = frame("q4", { t: 4, r: 8, b: 20, l: 4 });
    var g = chart.g, w = chart.w, h = chart.h;

    // ---------- left: the map (about 55% of the width) ----------
    var mapW = Math.round(w * 0.55);
    var mapH = h - 22;   // room for the legend under the map
    var projection = d3.geoMercator().fitSize([mapW, mapH], geo);
    var path = d3.geoPath(projection);

    var map = g.append("g");

    map.selectAll("path")
      .data(geo.features)
      .join("path")
      .attr("d", path)
      .attr("fill", function(d) { return color(change(d.properties.code, year)); })
      .attr("stroke", function(d) { return d.properties.code === q4Selected ? C().ink : C().panel; })
      .attr("stroke-width", function(d) { return d.properties.code === q4Selected ? 2 : 0.8; })
      .style("cursor", "pointer")
      .on("mousemove", function(event, d) {
        var code = d.properties.code;
        var html = "<b>" + d.properties.name + "</b><br>" +
          "2011: " + fmt(count(code, 2011)) + "<br>" +
          year + ": " + fmt(count(code, year)) + "<br>" +
          "Change: " + pct(change(code, year));
        if (Q4_BREAK_NOTE[code]) { html = html + "<br><i>" + Q4_BREAK_NOTE[code] + "</i>"; }
        showTip(event, html + "<br><small>Click for full details</small>");
      })
      .on("mouseleave", hideTip)
      .on("click", function(event, d) {
        q4Selected = d.properties.code;
        draw();
        if (window.openStateDetail) openStateDetail(q4Selected);   // big detail view (statedetail.js, Lynn)
      });

    // put the selected state on top so its black outline is not hidden
    map.selectAll("path").filter(function(d) { return d.properties.code === q4Selected; }).raise();

    // state codes (ACT is tiny, so its label sits to the right of it)
    map.selectAll("text")
      .data(geo.features)
      .join("text")
      .attr("x", function(d) { return path.centroid(d)[0] + (d.properties.code === "ACT" ? 14 : 0); })
      .attr("y", function(d) { return path.centroid(d)[1]; })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .text(function(d) { return d.properties.code; });

    // legend under the map
    var legendW = Math.min(150, mapW - 10);
    var legend = g.append("g").attr("transform", "translate(4," + (mapH + 6) + ")");
    var gradient = legend.append("defs").append("linearGradient").attr("id", "q4-grad");
    [0, 0.25, 0.5, 0.75, 1].forEach(function(t) {
      gradient.append("stop")
        .attr("offset", (t * 100) + "%")
        .attr("stop-color", color(-maxChange + t * 2 * maxChange));
    });
    legend.append("rect").attr("width", legendW).attr("height", 8).attr("fill", "url(#q4-grad)");
    legend.append("text").attr("y", 18).style("font-size", "9px").text(pct(-maxChange));
    legend.append("text").attr("x", legendW / 2).attr("y", 18).attr("text-anchor", "middle").style("font-size", "9px").text("0%");
    legend.append("text").attr("x", legendW).attr("y", 18).attr("text-anchor", "end").style("font-size", "9px").text(pct(maxChange));

    // ---------- right: line chart for the selected state ----------
    var lineLeft = mapW + 40;
    var lineW = w - lineLeft;
    var lineTop = 18;
    var lineH = h - lineTop;
    var line = g.append("g").attr("transform", "translate(" + lineLeft + "," + lineTop + ")");

    var points = Q4_YEARS.map(function(y) {
      var row = data.states.find(function(d) { return d.state === q4Selected && d.year === y; });
      return { year: y, hosp: row ? row.hosp : 0, brk: row ? row.series_break === 1 : false };
    });

    var x = d3.scaleLinear().domain([2011, 2021]).range([0, lineW]);
    var y = d3.scaleLinear().domain([0, d3.max(points, function(d) { return d.hosp; })]).nice().range([lineH, 0]);

    g.append("text")
      .attr("x", lineLeft - 30)
      .attr("y", 10)
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(q4Selected + " per year" + (Q4_BREAK_NOTE[q4Selected] ? " · ○ = series break" : ""));

    line.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + lineH + ")")
      .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")));
    line.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("~s")));

    // grey dashed line at the year chosen with the slider
    line.append("line")
      .attr("x1", x(year)).attr("x2", x(year))
      .attr("y1", 0).attr("y2", lineH)
      .attr("stroke", C().muted)
      .attr("stroke-dasharray", "3,3");

    line.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", C().red)
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.hosp); }));

    // points: hollow circles mark series-break years, the selected year is bigger
    line.selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", function(d) { return x(d.year); })
      .attr("cy", function(d) { return y(d.hosp); })
      .attr("r", function(d) { return d.year === year ? 5 : 3; })
      .attr("fill", function(d) { return d.brk ? C().panel : C().red; })
      .attr("stroke", C().red)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mousemove", function(event, d) {
        var html = "<b>" + q4Selected + " " + d.year + "</b><br>" + fmt(d.hosp) + " hospitalisations";
        if (d.brk) { html = html + "<br><i>Series break: new counting method</i>"; }
        showTip(event, html);
      })
      .on("mouseleave", hideTip)
      .on("click", function(event, d) { setFilter("year", d.year); });
  }

  onDraw(draw);
  onFilter("q4map", draw);
});
