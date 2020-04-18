//Mapping of indicator id to label - used for UI
mappingIndicatorId = {"200101": "Population", "40055": "Enrollment in Early Childhood Education (Both Sexes)"}
//Mapping of indicator id to document id - used for DB call
mappingDocumentId = {"200101": "DEM_DATA_NATIONAL", "40055": "EDUN_DATA_NATIONAL_1"}
var legend = null
var legendText = []
var color = null
var cLog = null
var legend = null
var format = null
function createWorldMap(dataSet) {
  format = d3.format(',');

  // Set tooltips
  const tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(d => `<strong>Country: </strong><span class='details'>${d.properties.name}<br></span><strong>${mappingIndicatorId[$("#factor").val()]}: </strong><span class='details'>${format(d.data)}</span>`);
    $("#region").hide();
    $("#country").hide();
  const margin = {top: 0, right: 0, bottom: 0, left: 0};
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  var svg = d3.select('#worldMap')
    .append('svg')
      .attr('class','myMap')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('class', 'map');

  const projection = d3.geoRobinson()
    .scale(170)
    .rotate([352, 0, 0])
    .translate( [width / 2, height / 2.1]);

  const path = d3.geoPath().projection(projection);

  svg.call(tip);
  queue()
  .defer(d3.json, 'data/world_countries.json')
  .await(ready);

  function ready(error, country_map) {
    const dataById = {};
    color = d3.scaleThreshold()
          .domain(d3.range(0, 8))
          .range(d3.schemeBlues[9]);
    cLog = d3.scaleLog().range([0,8]).domain([
        Math.min.apply(Math, dataSet.map(function(o) { return o["VALUE"]; })),
        Math.max.apply(Math, dataSet.map(function(o) { return o["VALUE"]; }))
    ]);

    createLegend(dataSet);
    dataSet.forEach(d => { dataById[d['COUNTRY_ID']] = + d["VALUE"]; });
    country_map.features.forEach(function(d) {
        d.data = !isNaN(dataById[d.id]) ? dataById[d.id] : "Not available"
    });

    svg.append('g')
      .attr('class', 'map')
      .selectAll('.countries')
      .data(country_map.features)
      .enter().append('path')
        .attr('class', 'country')
        .attr('d', path)
        .style('fill', function(d) {
            return dataById[d.id] != undefined ? color(cLog(dataById[d.id])) : "#DCDCDC"
        })
        .style('stroke', 'white')
        .style('opacity', 0.8)
        .style('stroke-width', 0.3)
        // tooltips
        .on('mouseover',function(d){
            console.log('t1')
            tip.show(d);
          //console.log(d)
          d3.select(this)
            .style('opacity', 1)
            .style('stroke-width', 3);
        })
        .on('mouseout', function(d){
          tip.hide(d);
          d3.select(this)
            .style('opacity', 0.8)
            .style('stroke-width',0.3);
        });

    svg.append('path')
      .datum(topojson.mesh(country_map.features, (a, b) => a.id !== b.id))
      .attr('class', 'names')
      .attr('d', path);
  }
}

/**
 * When new factor is chosen, then the colors, tooltips, and legend works
 */
function updateWorldMap() {

    let year = $("#year").val();
    let indicator_id = $("#factor").val();
    let document_id = mappingDocumentId[$("#factor").val()];
    const dataById = {};
    console.log(indicator_id)
    console.log(document_id)
    genericDBCall(year, indicator_id, document_id).then(dataSet => {
        console.log(dataSet)
        $("#worldMap").empty();
        $(".legend").empty();

        createWorldMap(dataSet);
    });
}


function createLegend(data) {

    legendText = [0,1,2,3,4,5,6,7,8]

    //Instantiate svg
    var margin = {top: 20,
            right: 90,
            bottom: 30,
            left: 60},
        width = 440 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
    legend = d3.select(".innerContainer").append("svg")
        .attr("class", "legend")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    g = legend.selectAll("g")
        .data(legendText)
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(" + margin.left + "," + ((i * 20) + margin.top) + ")";
        })

    g.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    g.append("text")
        .data(legendText)
        .attr("x", 24)
        .attr("y", 5)
        .attr("class", "legendNums")
        .attr("dy", ".30em")
        .text(function (d, i) {
            return format(Math.round(cLog.invert(i)));
        });

}