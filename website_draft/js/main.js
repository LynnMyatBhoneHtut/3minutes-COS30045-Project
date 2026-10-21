const W = 700, H = 350, M = { top: 20, right: 120, bottom: 30, left: 60 };
const w = W - M.left - M.right, h = H - M.top - M.bottom;

function chart(id) {
  return d3.select(id).append("svg").attr("viewBox", `0 0 ${W} ${H}`)
    .append("g").attr("transform", `translate(${M.left},${M.top})`);
}

// Q1: line chart with a 2020 label
d3.csv("data/year.csv", d => ({ year: +d.year, hosp: +d.hosp })).then(data => {
  const svg = chart("#q1");
  const x = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
  const y = d3.scaleLinear().domain([30000, 42000]).range([h, 0]);

  svg.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").call(d3.axisLeft(y));

  svg.append("path").datum(data).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2)
    .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.hosp)));

  svg.selectAll("circle").data(data).join("circle")
    .attr("cx", d => x(d.year)).attr("cy", d => y(d.hosp)).attr("r", 4)
    .attr("fill", d => d.year === 2020 ? "orange" : "steelblue")
    .append("title").text(d => `${d.year}: ${d.hosp}`);

  const d2020 = data.find(d => d.year === 2020);
  svg.append("text").attr("x", x(2020)).attr("y", y(d2020.hosp) + 20).attr("text-anchor", "middle")
    .attr("font-size", 12).text("2020: COVID dip");
});

// Q2: indexed lines (2011 = 100)
const groups = ["Pedal cyclist", "Motorcyclist", "Car driver", "Pedestrian"];
const color = d3.scaleOrdinal(groups, ["#d55e00", "#0072b2", "#888888", "#009e73"]);

d3.csv("data/year_roaduser.csv", d => ({ year: +d.year, user: d.road_user, hosp: +d.hosp })).then(data => {
  const svg = chart("#q2");
  const series = groups.map(g => {
    const rows = data.filter(d => d.user === g);
    const base = rows.find(d => d.year === 2011).hosp;
    return { name: g, values: rows.map(d => ({ year: d.year, index: d.hosp / base * 100 })) };
  });

  const x = d3.scaleLinear().domain([2011, 2021]).range([0, w]);
  const y = d3.scaleLinear().domain([70, 160]).range([h, 0]);

  svg.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").call(d3.axisLeft(y));

  const line = d3.line().x(d => x(d.year)).y(d => y(d.index));
  svg.selectAll(".line").data(series).join("path").attr("fill", "none").attr("stroke-width", 2)
    .attr("stroke", d => color(d.name)).attr("d", d => line(d.values));

  svg.selectAll(".label").data(series).join("text")
    .attr("x", w + 5).attr("y", d => y(d.values[d.values.length - 1].index) + 4)
    .attr("fill", d => color(d.name)).attr("font-size", 12).text(d => d.name);
});
