// N4 – Nyi Nyi. Which age groups are hurt most: one bar per age group for the chosen year.
// Red = the selected age group (or the largest group when Age group is "All"), grey = the rest.
// Follows the Year, Road user and Sex filters. Click a bar to filter every chart by that age group.
//
// AI use summary: I asked Claude (Anthropic) to "write the d3 for my 3 charts (N4, N5, N6)".
// Claude wrote the first version of this file using our shared helpers in common.js;
// I reviewed, tested and edited it.

var N4_AGES = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];   // "Unknown" is left out

DATA.then(function(data) {

  function draw() {
    var c = C();

    // rows for the chosen year that match the Road user and Sex filters
    var rows = data.national.filter(function(d) {
      var yearOk = d.year === FILTER.year;
      var groupOk = FILTER.group === "All" || d.group === FILTER.group;
      var sexOk = FILTER.sex === "All" || d.sex === FILTER.sex;
      return yearOk && groupOk && sexOk;
    });

    // total for each age group
    var bars = N4_AGES.map(function(age) {
      var total = d3.sum(rows, function(d) { return d.age_group === age ? d.hosp : 0; });
      return { age: age, hosp: total };
    });
    var allTotal = d3.sum(bars, function(d) { return d.hosp; }) || 1;

    // the bar to highlight in red
    var biggest = d3.greatest(bars, function(d) { return d.hosp; });
    var focus = FILTER.age_group !== "All" ? FILTER.age_group : biggest.age;

    var chart = frame("n4", { t: 24, r: 10, b: 28, l: 48 });
    var g = chart.g, w = chart.w, h = chart.h;

    var x = d3.scaleBand().domain(N4_AGES).range([0, w]).padding(0.25);
    var y = d3.scaleLinear().domain([0, d3.max(bars, function(d) { return d.hosp; }) || 1]).nice().range([h, 0]);

    // light gridlines and axes
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(d3.format("~s")))
      .call(function(a) { a.select(".domain").remove(); })
      .call(function(a) { a.selectAll(".tick line").attr("stroke", c.grid); });
    g.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x).tickSize(0))
      .call(function(a) { a.select(".domain").attr("stroke", c.muted); })
      .selectAll("text").attr("dy", "1.1em").attr("font-size", 12);

    // bars
    g.selectAll(".bar")
      .data(bars)
      .join("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.age); })
      .attr("y", function(d) { return y(d.hosp); })
      .attr("width", x.bandwidth())
      .attr("height", function(d) { return h - y(d.hosp); })
      .attr("fill", function(d) { return d.age === focus ? c.red : c.dim; })
      .style("cursor", "pointer")
      .on("mousemove", function(event, d) {
        showTip(event, "<b>Age " + d.age + ", " + FILTER.year + "</b><br>" +
          fmt(d.hosp) + " hospitalisations<br>" + d3.format(".1%")(d.hosp / allTotal) + " of all ages");
      })
      .on("mouseleave", hideTip)
      .on("click", function(event, d) {
        // click again to go back to "All"
        setFilter("age_group", FILTER.age_group === d.age ? "All" : d.age);
      });

    // % label on top of each bar
    g.selectAll(".lbl")
      .data(bars)
      .join("text")
      .attr("class", "lbl")
      .attr("x", function(d) { return x(d.age) + x.bandwidth() / 2; })
      .attr("y", function(d) { return y(d.hosp) - 5; })
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", function(d) { return d.age === focus ? c.red : c.ink; })
      .attr("font-weight", function(d) { return d.age === focus ? 700 : 400; })
      .text(function(d) { return d3.format(".0%")(d.hosp / allTotal); });

    // note above the chart
    g.append("text")
      .attr("y", -10)
      .attr("font-size", 11)
      .attr("fill", c.muted)
      .text("Year " + FILTER.year + " · age groups are different widths · click a bar to filter every chart");
  }

  onDraw(draw);
  onFilter("n4", draw);
});
