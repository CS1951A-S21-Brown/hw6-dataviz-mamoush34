// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let svg1 = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

let countRef = svg1.append("g");

d3.csv("../data/football.csv").then(function(data) {
    data = cleanData(data);
    yearCounts = d3.nest().key(function(d) { return d.year;}).rollup(function(v) { return v.length}).entries(data)
    year_num_examples = 5
    yearCounts = yearCounts.slice(yearCounts.length - year_num_examples - 1, yearCounts.length - 1)
    console.log(yearCounts)

    let x = d3.scaleLinear()
        .domain([0, d3.max(yearCounts, function(d){
            return d.value
        })])
        .range([0, graph_1_width - margin.left - margin.right]);
   
    let y = d3.scaleBand()
        .domain(yearCounts.map((d) => d.key))
        .range([0, graph_1_height - margin.top - margin.bottom]) 
        .padding(0.1);  // Improves readability
    
    let y_axis = d3.axisLeft(y).tickSize(0).tickPadding(10);
    svg1.append("g")
        .call(y_axis);
    /*
        This next line does the following:
            1. Select all desired elements in the DOM
            2. Count and parse the data values
            3. Create new, data-bound elements for each data value
     */
    let bars = svg1.selectAll("rect").data(yearCounts);

    // OPTIONAL: Define color scale
    let color = d3.scaleOrdinal()
        .domain(yearCounts.map(function(d) { return d.key }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), year_num_examples));

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function(d) { return color(d.key) }) // Here, we are using functin(d) { ... } to return fill colors based on the data point d
        .attr("x", x(0))
        .attr("y", function(d) { return y(d.key)})               // HINT: Use function(d) { return ...; } to apply styles based on the data point (d)
        .attr("width", function(d) { return x(d.value)})
        .attr("height",  y.bandwidth());        // HINT: y.bandwidth() makes a reasonable display height
    
    let counts = countRef.selectAll("text").data(yearCounts);

    // TODO: Render the text elements on the DOM
    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function(d) {return x(d.value) + 10})       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
        .attr("y", function(d) {return y(d.key) + 10})       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
        .style("text-anchor", "start")
        .text(function(d) { return d.value});           // HINT: Get the count of the artist


    // TODO: Add x-axis label
    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2}, ${graph_1_height - margin.bottom - 30})`)       // HINT: Place this at the bottom middle edge of the graph - use translate(x, y) that we discussed earlier
        .style("text-anchor", "middle")
        .text("Count");

    // TODO: Add y-axis label
    svg1.append("text")
        .attr("transform", `translate(${-100}, ${(graph_1_height - margin.top - margin.bottom) / 2})`)       // HINT: Place this at the center left edge of the graph - use translate(x, y) that we discussed earlier
        .style("text-anchor", "middle")
        .text("Year");

    // TODO: Add chart title
    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2}, -10)`)       // HINT: Place this at the top middle edge of the graph - use translate(x, y) that we discussed earlier
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Football Matches by Year");

});

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
 function cleanData(data) {
    // TODO: sort and return the given data with the comparator (extracting the desired number of examples)
    data.forEach((d) => { 
        d.home_score = parseInt(d.home_score) 
        d.away_score = parseInt(d.away_score)
        // d.date = Date.parse(d.date)
        d.year = parseInt(d.date.slice(0, 4))
        d.neutral = d.neutral == "FALSE" ? false : true
    })
    return data
}
