// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 315;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let svg1 = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

let countRef = svg1.append("g");

let svg2 = d3.select("#graph2")
    .append("svg")
    .attr('width', graph_2_width)
    .attr('height', graph_2_height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top + 20})`);

let svg3 = d3.select("#graph3")
    .append("svg")
    .attr('width', graph_3_width)     // HINT: width
    .attr('height', graph_3_height)     // HINT: height
    .append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`); 

let tooltip = d3.select("#graph3")     // HINT: div id for div containing scatterplot
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let x_3 = d3.scaleLinear()
    .range([0, graph_3_width - margin.left - margin.right]);

let y_3 = d3.scaleBand()
    .range([0, graph_3_height - margin.top - margin.bottom])
    .padding(0.1);

let countRef3 = svg3.append("g");
let y_axis_label = svg3.append("g");
let startIndex = 0
let endIndex = 10
let worldCupData = null


d3.csv("../data/football.csv").then(function(data) {
    data = cleanData(data);
    yearCounts = d3.nest().key(function(d) { return d.year;}).rollup(function(v) { return v.length}).entries(data)
    year_num_examples = 10
    yearCounts = yearCounts.slice(yearCounts.length - year_num_examples - 1, yearCounts.length - 1) // For last 10 full years
    createFirstGraph(yearCounts)
    footballData = findWinningPercentages(data)
    footballData.sort(function(a, b) {
        return b.percentWin - a.percentWin
    })
    win_num_examples = 10
    slicedWinData = footballData.slice(0, 10)
    worldCupData = footballData
    d3.csv("../data/countries.csv").then(function(countryData) {
        createSecondGraph(slicedWinData, countryData)
    });

    findWinningPercentagesInLast2Cups(footballData)
    worldCupData.sort(function(a, b) {
        return b.worldCupPercentWin - a.worldCupPercentWin
    })
    createThirdGraph()
    setThirdGraphData(null)






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

    svg1.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2}, -20)`)      
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Football Matches by Year");

}

function createSecondGraph (footballData, countryData) {
    countryMap = new Map()
    countryNames = new Set()
    footballData.forEach((country) => {
        countryMap.set(country.key, country.percentWin)
        countryNames.add(country.key)
        for (i = 0; i < countryData.length; i++) {
            if (countryData[i].name === country.key) {
                country.lat = parseFloat(countryData[i].latitude)
                country.long = parseFloat(countryData[i].longitude)
            }
        }
    });

    let getFromMap = (countryName) => {
        percentage = countryMap.get(countryName)
        return percentage != undefined ? `Win Percentage: <span style="color: blue;">${percentage}` : `<span style="color: blue;"> Not in Top 10`
    }

    let mouseover = function(d) {
        let html = `
                <span style="color: blue;">${d.properties.name}</span><br/>
                ${getFromMap(d.properties.name)}</span>`;       

        tooltip.html(html)
            .style("left", `${(d3.event.pageX) - 700}px`)
            .style("top", `${(d3.event.pageY) - 70}px`)
            .style("box-shadow", `2px 2px 5px blue`)    
            .transition()
            .duration(200)
            .style("opacity", 0.9)
    };

    let mouseout = function(d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    };

    let projection = d3.geoNaturalEarth()
        .scale(graph_2_width / 1.8 / Math.PI)
        .translate([graph_2_width / 2 - 200, graph_2_height / 2])

    // Load external data and boot
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(data){

        // Draw the map
        svg2.append("g")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
                .attr("fill", function(d) {
                    if (countryNames.has(d.properties.name)) {
                        return "blue"
                    } else {
                        return "#69b3a2"
                    }
                })
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .attr("title" , "anan")
                .style("stroke", "#fff")
                .on("mouseover", mouseover) // HINT: Pass in the mouseover and mouseout functions here
                .on("mouseout", mouseout);
        
            
        svg2.append("text")
        .attr("transform", `translate(${(graph_1_width - margin.right - margin.left) / 2}, -30)`)      
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("10 Nations with Highest Win Percentages All Time");
    });
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
        });
        percentWin = winCount / d.values.length
        if (d.values.length >= 100) {
            d.percentWin = (percentWin * 100).toFixed(2)
            res.push(d)
        }
    })
    return res
}

function findWinningPercentagesInLast2Cups(data) {
    const startDate = Date.parse("2011-06-01")
    const endDate = Date.parse("2018-08-01")

    data.forEach((d) => {
        winCount = 0
        gameCount = 0
        d.values.forEach((game) => {
            if (game.tournament.includes("FIFA World Cup") && game.date >= startDate  && game.date <= endDate) {
                gameCount++;
                if (d.key === game.home_team) {
                    if (game.home_score > game.away_score) {
                        winCount++;
                    }
                } else {
                    if (game.home_score < game.away_score) {
                        winCount++;
                    }
                }
            }
        });
        percentWin = gameCount > 0  ? winCount / gameCount : 0
        d.worldCupPercentWin = (percentWin * 100).toFixed(2)
    });
}

function createThirdGraph() {
    
    svg3.append("text")
        .attr("transform", `translate(${(graph_3_width - margin.right - margin.left) / 2 }, ${graph_3_height - margin.bottom - 20})`) 
        .style("text-anchor", "middle")
        .text("Winning Percentage");

    svg3.append("text")
        .attr("transform", `translate(${-70}, ${(graph_3_height - margin.top - margin.bottom) / 2})`)       
        .style("text-anchor", "middle")
        .text("Country");

    // TODO: Add chart title
    svg3.append("text")
        .attr("transform", `translate(${(graph_3_width - margin.right - margin.left) / 2}, -20)`)      
        .style("text-anchor", "middle")
        .style("font-size", 15)
        .text("Winning Percentage in Last 2 World Cups");

}

function setThirdGraphData(increment) {
    slicedData = null
    if (increment != null) {
        if (increment) {
            if (endIndex + 10 < footballData.length) {
                startIndex += 10
                endIndex += 10
            }
        } else {
            if (startIndex >= 10) {
                startIndex -= 10
                endIndex -= 10
            } 
        }
    } 
    slicedData = worldCupData.slice(startIndex, endIndex)
    


    x_3.domain([0, 100]);

    y_3.domain(slicedData.map((d) => d.key));
    let y_axis = d3.axisLeft(y_3).tickSize(0).tickPadding(10); //maybe this is wrong
    y_axis_label.call(y_axis);
    let bars = svg3.selectAll("rect").data(slicedData);

    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", x_3(0))
        .attr("y", function(d) { return y_3(d.key)})               
        .attr("width", function(d) { return x_3(d.worldCupPercentWin)})
        .attr("height",  y_3.bandwidth())
        .attr("fill", "#69b3a2");     

    /*
        In lieu of x-axis labels, we are going to display the count of the artist next to its bar on the
        bar plot. We will be creating these in the same manner as the bars.
     */
    let counts = countRef3.selectAll("text").data(slicedData);

    // TODO: Render the text elements on the DOM
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d) {return x_3(d.worldCupPercentWin) + 10})       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
        .attr("y", function(d) {return y_3(d.key) + 10})       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
        .style("text-anchor", "start")
        .text(function(d) {return d.worldCupPercentWin});           // HINT: Get the count of the artist

    // Remove elements not in use if fewer groups in new dataset
    bars.exit().remove();
    counts.exit().remove();
 


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
        d.year = parseInt(d.date.slice(0, 4))
        d.date = Date.parse(d.date)
        d.neutral = d.neutral == "FALSE" ? false : true
    })
    return data
}
