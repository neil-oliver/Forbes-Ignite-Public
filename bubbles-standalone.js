let data = await d3.csv('../data/Forbes Wrangled Individual Data.csv')

let step = 'random';
let selector = '#bubbles';

users = data.map(d => { return { text: d['User ID'] } })

var span = body.append('span')
    .text('Select User: ')
var input = body.append('select')
    .attr('id', 'userSelect')
    .on('change', update)
    .selectAll('option')
    .data(users)
    .enter()
    .append('option')
    .attr('value', function (d) { return d.text })
    .text(function (d) { return d.text; })
body.append('br')

var body = d3.select(selector)
body.html("")

// margins for SVG
const margin = {
    left: 100,
    right: 100,
    top: 100,
    bottom: 100
}

// responsive width & height
const svgWidth = parseInt(d3.select(selector).style('width'), 10) / 2
const svgHeight = svgWidth

// helper calculated variables for inner width & height
const height = svgHeight - margin.top - margin.bottom
const width = svgWidth - margin.left - margin.right


// add SVG

d3.select(`${selector} svg`).remove();

const svg = d3.select(selector)
    .append('svg')
    .attr('height', svgHeight)
    .attr('width', svgWidth)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

////////////////////////////////////
//////////////wrangle///////////////
////////////////////////////////////

data = data.filter(d => d.Completed == 'TRUE')

data.forEach(d => {
    d.start = { x: 0.5, y: 0.5 }
    d.random = { x: Math.random(), y: Math.random() }
});


let group_grid = {}
Array.from(new Set(data.map(d => d['Group Name']))).forEach((d, i) => {
    group_grid[d] = { x: Math.floor(i / 5) / 5, y: (i % 5) / 5 }
})

data.forEach(d => {
    d.group_grid = group_grid[d['Group Name']]
})

console.log(group_grid)

console.log(data)

////////////////////////////////////
//////////////globals///////////////
////////////////////////////////////
const radius = 5
const group = 'PCA Group'

////////////////////////////////////
//////////////scales////////////////
////////////////////////////////////

// time scale for X axis
const xScale = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1])

// abritrary Y scale for health metrics
const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 1])


// colour scales for all lines and legend
const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d[group]))
    .range(d3.schemeTableau10)

////////////////////////////////////
/////////simulation setup///////////
////////////////////////////////////   

data.forEach(d => {
    d.y = yScale(0.5)
    d.x = xScale(0.5)
})

function tick() {
    d3.selectAll('.balls')
        .attr("cx", function (d) { return d.x })
        .attr("cy", function (d) { return d.y });
}


let balls = svg.selectAll('.balls')
    .data(data)
    .join('circle')
    .attr('r', radius)
    .attr('fill', d => colorScale(d[group]))
    .attr('cy', d => yScale(d[step]))
    .attr('cx', d => xScale(d[step]))
    .attr('class', 'balls')


var simulation = d3.forceSimulation(data)
    .force('y', d3.forceY(d =>
        yScale(d[step].y)
    ).strength(0.5)
    )
    .force('x', d3.forceX(d =>
        xScale(d[step].x)
    ).strength(0.5)
    )
    .force('collide', d3.forceCollide(radius * 1.1))
    .alphaDecay(0.01)
    .alpha(0.15)
    .on('tick', tick)

// optional time out
var init_decay;
init_decay = setTimeout(function () {
    simulation.alphaDecay(0.1);
}, 8000);

function update(val) {

    step = val;

    simulation.force('x', d3.forceX(function (d) {
        return xScale(d[step].x)
    }))

    simulation.force('y', d3.forceY(function (d) {
        return yScale(d[step].y)
    }))


    simulation
        .alphaDecay(0.01)
        .alpha(0.5)
        .restart()

    //optional time out
    clearTimeout(init_decay);
    init_decay = setTimeout(function () {
        console.log('init alpha decay');
        simulation.alphaDecay(0.1);
    }, 8000);

    return step
}
