// N5 – Nyi Nyi. Men and women over time: one line for males and one for females, 2011–2021.
// Male = dark (ink), Female = grey (mid), the same as Lynn's N3, so they also work for colour-blind readers.
// The red label shows the male share in the chosen year. Follows the Road user and Age group filters;
// the Sex filter fades the other line. Click a point to change the Year for every chart.
//
// AI use summary: I asked Claude (Anthropic) to "write the d3 for my 3 charts (N4, N5, N6)".
// Claude wrote the first version of this file using our shared helpers in common.js;
// I reviewed, tested and edited it.

var N5_YEARS = d3.range(2011, 2022);
var N5_SEXES = ["Male", "Female"];

DATA.then(function(data) {

  function draw() {
    var c = C();
    var colour = { Male: c.ink, Female: c.mid };

    // rows that match the Road user and Age group filters
    var rows = data.national.filter(function(d) {
      var groupOk = FILTER.group === "All" || d.group === FILTER.group;
      var ageOk = FILTER.age_group === "All" || d.age_group === FILTER.age_group;
      return groupOk && ageOk;
    });

    // one line for each sex: total per year
    var lines = N5_SEXES.map(function(sex) {
      var values = N5_YEARS.map(function(year) {
        var total = d3.sum(rows, function(d) { return d.sex === sex && d.year === year ? d.hosp : 0; });
        return { sex: sex, year: year, hosp: total };
      });
      var first = values[0].hosp, last = values[values.length - 1].hosp;
      return { sex: sex, values: values, change: first > 0 ? (last - first) / first : 0 };
    });

    // male share in the chosen year
    var maleNow = lines[0].values.find(function(d) { return d.year === FILTER.year; }).hosp;
    var femaleNow = lines[1].values.find(function(d) { return d.year === FILTER.year; }).hosp;
    var maleShare = maleNow / ((maleNow + femaleNow) || 1);

    var chart = frame("n5", { t: 24, r: 110, b: 28, l: 48 });
    var g = chart.g, w = chart.w, h = chart.h;

    var x = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
    var maxY = d3.max(lines, function(l) { return d3.max(l.values, function(d) { return d.hosp; }); });
    var y = d3.scaleLinear().domain([0, maxY || 1]).nice().range([h, 0]);

    // light gridlines and axes
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(d3.format("~s")))
      .call(function(a) { a.select(".domain").remove(); })
      .call(function(a) { a.selectAll(".tick line").attr("stroke", c.grid); });
    g.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x)
        .tickValues(w > 450 ? N5_YEARS : [2011, 2013, 2015, 2017, 2019, 2021])   // every year if there is room
        .tickFormat(d3.format("d")))
      .call(function(a) { a.select(".domain").attr("stroke", c.muted); });

    // dashed line at the chosen year
    g.append("line")
      .attr("x1", x(FILTER.year)).attr("x2", x(FILTER.year))
      .attr("y1", 0).attr("y2", h)
      .attr("stroke", c.muted)
      .attr("stroke-dasharray", "3,3");

    // the Sex filter fades the line that is not selected
    function opacity(sex) { return FILTER.sex === "All" || FILTER.sex === sex ? 1 : 0.25; }

    var lineMaker = d3.line()
      .x(function(d) { return x(d.year); })
      .y(function(d) { return y(d.hosp); });

    lines.forEach(function(l) {
      g.append("path")
        .datum(l.values)
        .attr("fill", "none")
        .attr("stroke", colour[l.sex])
        .attr("stroke-width", 2.5)
        .attr("opacity", opacity(l.sex))
        .attr("d", lineMaker);

      // points: the chosen year is bigger
      g.selectAll(".pt-" + l.sex)
        .data(l.values)
        .join("circle")
        .attr("cx", function(d) { return x(d.year); })
        .attr("cy", function(d) { return y(d.hosp); })
        .attr("r", function(d) { return d.year === FILTER.year ? 5 : 3; })
        .attr("fill", colour[l.sex])
        .attr("opacity", opacity(l.sex))
        .style("cursor", "pointer")
        .on("mousemove", function(event, d) {
          showTip(event, "<b>" + d.sex + ", " + d.year + "</b><br>" + fmt(d.hosp) + " hospitalisations");
        })
        .on("mouseleave", hideTip)
        .on("click", function(event, d) { setFilter("year", d.year); });

      // label at the end of each line (direct labels, so no legend is needed)
      var end = l.values[l.values.length - 1];
      g.append("text")
        .attr("x", x(2021) + 8)
        .attr("y", y(end.hosp) + 4)
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .attr("fill", colour[l.sex])
        .attr("opacity", opacity(l.sex))
        .text(l.sex + " " + d3.format("+.0%")(l.change));
    });

    // red note: the main finding for the chosen year
    g.append("text")
      .attr("y", -10)
      .attr("font-size", 11)
      .attr("fill", c.red)
      .attr("font-weight", 700)
      .text(d3.format(".0%")(maleShare) + " of patients were male in " + FILTER.year);
    g.append("text")
      .attr("x", w + 8)
      .attr("y", -10)
      .attr("font-size", 11)
      .attr("fill", c.muted)
      .text("2011 → 2021");
  }

  onDraw(draw);
  onFilter("n5", draw);
});
