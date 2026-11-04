// Nyi Nyi – Q3 heatmap: age group × year, with a sex toggle (dynamic filter) and details on demand
// Connected to the filter bar: Road user and Sex filter the cells, the selected Year column and
// Age group row are outlined, and clicking a cell sets the Year and Age group for every chart.
//
// AI use summary: I asked Claude (Anthropic) to "check the dashboard and add my heatmap and
// choropleth map, and connect them to the filter". Claude wrote the first version of this file
// using our shared helpers in common.js; I reviewed, tested and edited it.

var Q3_AGES = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];   // "Unknown" is left out
var Q3_YEARS = d3.range(2011, 2022);
var Q3_SEX_OPTIONS = ["All", "Female", "Male"];

DATA.then(function(data) {

  // sex toggle buttons: they change the shared Sex filter, so the other charts follow too
  d3.select("#q3-controls").selectAll("button")
    .data(Q3_SEX_OPTIONS)
    .join("button")
    .text(function(d) { return d === "All" ? "All sexes" : d; })
    .on("click", function(event, d) {
      setFilter("sex", d);
    });

  function draw() {

    d3.select("#q3-controls").selectAll("button")
      .classed("on", function(d) { return d === FILTER.sex; });

    // rows that match the Road user and Sex filters (the Age filter only highlights a row)
    var rows = data.national.filter(function(d) {
      var groupOk = FILTER.group === "All" || d.group === FILTER.group;
      var sexOk = FILTER.sex === "All" || d.sex === FILTER.sex;
      return groupOk && sexOk;
    });

    // one cell for every age group and year
    var cells = [];
    Q3_AGES.forEach(function(age) {
      var ageRows = rows.filter(function(d) { return d.age_group === age; });
      var base = d3.sum(ageRows, function(d) { return d.year === 2011 ? d.hosp : 0; });
      Q3_YEARS.forEach(function(year) {
        var total = d3.sum(ageRows, function(d) { return d.year === year ? d.hosp : 0; });
        cells.push({ age: age, year: year, hosp: total, base: base });
      });
    });

    var chart = frame("q3", { t: 8, r: 10, b: 44, l: 44 });
    var g = chart.g, w = chart.w, h = chart.h;

    var x = d3.scaleBand().domain(Q3_YEARS).range([0, w]).padding(0.04);
    var y = d3.scaleBand().domain(Q3_AGES).range([0, h]).padding(0.04);

    // light to dark red: more people = darker (Swinburne red theme)
    var color = d3.scaleSequential(d3.interpolateReds)
      .domain([0, d3.max(cells, function(d) { return d.hosp; }) || 1]);

    g.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x).tickSize(0).tickFormat(function(d) { return "'" + String(d).slice(2); }))
      .select(".domain").remove();

    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).tickSize(0))
      .call(function(a) { a.select(".domain").remove(); })
      .selectAll("text")
      .attr("fill", function(d) { return d === FILTER.age_group ? "#cc2131" : "#555"; })
      .attr("font-weight", function(d) { return d === FILTER.age_group ? 700 : 400; });

    g.selectAll(".q3-cell")
      .data(cells)
      .join("rect")
      .attr("class", "q3-cell")
      .attr("x", function(d) { return x(d.year); })
      .attr("y", function(d) { return y(d.age); })
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", function(d) { return color(d.hosp); })
      .style("cursor", "pointer")
      .on("mousemove", function(event, d) {
        var change = d.base > 0 ? (d.hosp - d.base) / d.base * 100 : 0;
        var changeText = d.base >= 50 ? (change >= 0 ? "+" : "") + Math.round(change) + "% since 2011" : "too few to compare";
        showTip(event, "<b>Age " + d.age + ", " + d.year + "</b><br>" + fmt(d.hosp) + " hospitalisations<br>" +
          changeText + "<br><i>Click to select this year and age</i>");
      })
      .on("mouseleave", hideTip)
      .on("click", function(event, d) {
        // set both filters, then tell every chart once
        FILTER.age_group = d.age;
        setFilter("year", d.year);
      });

    // outline the selected year (column) and age group (row)
    g.append("rect")
      .attr("x", x(FILTER.year))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", h)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .style("pointer-events", "none");

    if (FILTER.age_group !== "All" && FILTER.age_group !== "Unknown") {
      g.append("rect")
        .attr("x", 0)
        .attr("y", y(FILTER.age_group))
        .attr("width", w)
        .attr("height", y.bandwidth())
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .style("pointer-events", "none");
    }

    // small colour legend under the chart
    var legendW = Math.min(140, w / 2);
    var legend = g.append("g").attr("transform", "translate(0," + (h + 24) + ")");
    var steps = d3.range(0, 1.01, 0.1);

    legend.selectAll("rect")
      .data(steps)
      .join("rect")
      .attr("x", function(d, i) { return i * legendW / steps.length; })
      .attr("width", legendW / steps.length + 1)
      .attr("height", 8)
      .attr("fill", function(d) { return d3.interpolateReds(d); });

    legend.append("text").attr("x", 0).attr("y", 18).attr("font-size", 10).attr("fill", "#666").text("0");
    legend.append("text").attr("x", legendW).attr("y", 18).attr("font-size", 10).attr("fill", "#666")
      .attr("text-anchor", "end").text(fmt(color.domain()[1]));
    legend.append("text").attr("x", legendW + 8).attr("y", 8).attr("font-size", 10).attr("fill", "#666")
      .text((FILTER.group === "All" ? "All road users" : FILTER.group) + " · " + (FILTER.sex === "All" ? "all sexes" : FILTER.sex));
  }

  onDraw(draw);
  onFilter("q3", draw);
});
