const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoNaturalEarth1()
  .scale(width / 6.5)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(data => {

  // Map layer
  svg.append("g")
    .selectAll("path")
    .data(data.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#b8b8b8")
    .attr("stroke", "#333");
});