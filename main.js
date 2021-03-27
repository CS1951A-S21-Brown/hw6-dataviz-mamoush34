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
    year_num_examples = 10
    yearCounts = yearCounts.slice(yearCounts.length - year_num_examples - 1, yearCounts.length - 1) // For last 10 full years
    createFirstGraph(yearCounts)
    findWinningPercentages(data)

    


    

});

function createFirstGraph(yearCounts) {

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
    let bars = svg1.selectAll("rect").data(yearCounts);

    let color = d3.scaleOrdinal()
        .domain(yearCounts.map(function(d) { return d.key }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), year_num_examples));

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function(d) { return color(d.key) }) 
        .attr("x", x(0))
        .attr("y", function(d) { return y(d.key)})               
        .attr("width", function(d) { return x(d.value)})
        .attr("height",  y.bandwidth());        
    
    let counts = countRef.selectAll("text").data(yearCounts);

    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function(d) {return x(d.value) + 10})       
        .attr("y", function(d) {return y(d.key) + 10})      
        .style("text-anchor", "start")
        .text(function(d) { return d.value});          


    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2 }, ${graph_1_height - margin.bottom - 20})`) 
        .style("text-anchor", "middle")
        .text("Count");

    svg1.append("text")
        .attr("transform", `translate(${-70}, ${(graph_1_height - margin.top - margin.bottom) / 2})`)       
        .style("text-anchor", "middle")
        .text("Year");

    // TODO: Add chart title
    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2}, -20)`)      
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Football Matches by Year");

}

function findWinningPercentages(data) {
    let home_dict = d3.nest().key(function(d) { return d.home_team;}).entries(data)
    let away_dict = d3.nest().key(function(d) { return d.away_team;}).entries(data)
    let keySet = new Set()
    let res = []
    home_dict.forEach((pair) => {
        keySet.add(pair.key)
        for (i = 0; i < away_dict.length; i++) {
            if (pair.key == away_dict[i].key) {
                pair.values = pair.values.concat(away_dict[i].values)
            }
        }
    })
    console.log(home_dict)
    away_dict.forEach((pair) => {
        if (!(keySet.has(pair.key))) {
            home_dict.push(pair)
        }
    })
    home_dict.forEach((d) => {
        winCount = 0
        d.values.forEach((game) => {
            if (d.key === game.home_team) {
                if (game.home_score > game.away_score) {
                    winCount++;
                }
            } else {
                if (game.home_score < game.away_score) {
                    winCount++;
                }
            }
        })
        percentWin = winCount / d.values.length
        if (d.values.length >= 50) {
            d.percentWin = percentWin
            res.push(d)
        }
    })
    console.log(res)
}

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
