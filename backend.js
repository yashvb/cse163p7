// set width and height for the svg element
var width = 1000,
    height = 600;

// initialize svg element
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// the color scale we will be using
var color = d3.scaleThreshold()
    .domain([0.0, 0.5, 1.0, 2.0, 5.0, 10.0, 25.0, 70.0])
    .range(d3.schemeOrRd[9]);
// scale for the legend
var x = d3.scaleSqrt()
    .domain([0, 100])
    .range([440, 950]);


// places the density scale in the right place
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,570)");



// creates the legend and sets the density for each
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

// title for the legend
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population Density per County");




// sets the values for the legend
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
    .select(".domain")
    .remove();


d3.json("counties-10m.json", function(error, counties) {
    if (error) return error;
    
    //get the specific countries from the .csv for Montana only with the id
    var countylist = topojson.feature(counties, counties.objects.counties).features.filter((d) => parseInt(d.id) >= 30000 && parseInt(d.id) <= 30999);

    var geojson = {"type":"FeatureCollection", "features": countylist};
    // https://bl.ocks.org/mbostock/3711652

    // draws a mercator projection of montana and the counties
    // fitsize takes in the all the counties and sets/scales them correctly
    var projection = d3.geoMercator().scale(1).fitSize([width, height], geojson);

    // creates a geopath function from the projection
    //https://www.sohamkamani.com/javascript/d3-geo-projections/
    var path = d3.geoPath().projection(projection);

    

    d3.csv("Population-Density By County.csv", function(error, population) {
        
        //Filtering the density data for just North Dakota
        var montanapopulation = population.filter((d) => d["GEO.display-label"] === "Montana");
   
        //Putting the filter data in objects
        const densitylist = {};
        const allcounties = {};

        // get for that specific column
        montanapopulation.forEach(d => (densitylist[d["GCT_STUB.display-label"]] = d["Density per square mile of land area"]));
        countylist.forEach(d => (allcounties[d.properties.name] = d));

        
        //When mouse over tooltip appears
        svg.selectAll("path")
            .data(countylist)
            .enter().append("path")
            // draws the counties
            .style("fill", function(d) {return color(densitylist[d.properties.name + " County"]);})
            .attr("d", path)
            .on("mouseover", function(d) {
                // the location of the tooltip relative to mousehover
                d3.select("#tooltip")
                    .style("left", (d3.event.clientX +20) + "px")
                    .style("top", (d3.event.clientY - 20) + "px");
                // display the county name
                d3.select(".title")
                    .text(d.properties.name);
                // displays the population for that specific county
                d3.select("#population")
                    .text(densitylist[d.properties.name + " County"]);
                // makes the tooltip visible 
                d3.select("#tooltip").classed("hidden", false);
            })
            // removes tooltip if not hovering over county
            .on("mouseout", function() {
                d3.select("#tooltip").classed("hidden", true);
            });;
        


            
        // highlights the border when we click the boundary button
        var boundarybutton = document.querySelector('#tcb');
        var y = 0
        boundarybutton.addEventListener('click', function () {
            if (y == 0) {
                // fills the lines
                svg.selectAll("path").attr("stroke", "#111");
                y = 1
            } else {
                // erases the lines
                svg.selectAll("path").attr("stroke", "none");
                y = 0
            }
        });
        
        // changes the color when button is blicked
        var colorbutton = document.querySelector('#dc');
        var x = 0
        colorbutton.addEventListener('click', function () {
            if (x == 0) {
                color.range(d3.schemeBuGn[9]);
                // fills the map with the accurate color densities
                svg.selectAll("path").style("fill", function(d) { return color(densitylist[d.properties.name + " County"]);})
                // fills the legend color density
                g.selectAll("rect").attr("fill", function(d) { return color(d[0]); });
                x = 1
            } else {
                color.range(d3.schemeOrRd[9])
                // fills the map with the accurate color densities
                svg.selectAll("path").style("fill", function(d) { return color(densitylist[d.properties.name + " County"]);})
                // fills the legend color density
                g.selectAll("rect").attr("fill", function(d) { return color(d[0]); });
                x = 0
            }
        });

    });
});
