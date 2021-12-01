(async () => {
    let data = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Ignite%20Project%20Regression.csv')

    let step = 'perfect';
    let selector = '#scatter';

    let steps = [
        { text: 'Perfect', value: 'perfect' },
        { text: 'Demographic', value: 'demographic' },
        { text: 'Cognitive Traits', value: 'cognitive-traits' },
        { text: 'Cognitive Diversity', value: 'cognitive-diversity' },
        { text: 'Perception', value: 'perception' },
        { text: 'Qualitative', value: 'qualitative' }
    ]

    var body = d3.select(selector)
    body.html("")

    var span = body.append('span')
        .text('Select Option: ')
    var input = body.append('select')
        .attr('id', 'optionSelect')
        .on('change', update)
        .selectAll('option')
        .data(steps)
        .enter()
        .append('option')
        .attr('value', function (d) { return d.value })
        .text(function (d) { return d.text; })
    body.append('br')

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
    //////////////globals///////////////
    ////////////////////////////////////
    const radius = 4

    ////////////////////////////////////
    //////////////scales////////////////
    ////////////////////////////////////

    const xScale = d3.scaleLinear()
        .range([0, width])
        .domain([1, 4])

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([1, 4])


    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.model))
        .range(['grey', ...d3.schemeTableau10])

    ////////////////////////////////////
    //////////////wrangle///////////////
    ////////////////////////////////////

    const linearRegression = d3.regressionLinear()
        .x(d => d.actual)
        .y(d => d.predicted)
        .domain([1, 4]);

    let regressionLines = []

    let models = colorScale.domain()

    for (let model of models) {
        regressionLines.push(linearRegression(data.filter(d => d.model == model)))
    }

    ////////////////////////////////////
    ///////////// axis /////////////////
    ////////////////////////////////////   

    const xAxisGrid = d3.axisBottom(xScale).tickSize(-height).ticks(3)
    const yAxisGrid = d3.axisLeft(yScale).tickSize(-width).ticks(3)

    svg.append('g')
        .attr('class', 'x axis-grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxisGrid);

    svg.append('g')
        .attr('class', 'y axis-grid')
        .call(yAxisGrid);

    ////////////////////////////////////
    /////////// data points ////////////
    ////////////////////////////////////  

    let lines = svg.selectAll('.lines')
        .data(regressionLines)
        .join("line")
        .attr("class", "regression")
        .attr("x1", d => xScale(d[0][0]))
        .attr("x2", d => xScale(d[1][0]))
        .attr("y1", d => yScale(d[0][1]))
        .attr("y2", d => yScale(d[1][1]))
        .attr("stroke", (d, i) => colorScale(models[i]))
        .attr('stroke-opacity', (d, i) => models[i] == step || models[i] == 'perfect' ? 1 : 0.2)

    let points = svg.selectAll('.points')
        .data(data)
        .join('circle')
        .attr('r', radius)
        .attr('fill', d => colorScale(d.model))
        .attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        .attr('cy', d => yScale(d.predicted))
        .attr('cx', d => xScale(d.actual))
        .attr('class', 'points')


    function update(val) {

        step = val.target.value;

        points.attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        lines.attr('stroke-opacity', (d, i) => models[i] == step || models[i] == 'perfect' ? 1 : 0.2)

        return step
    }

})()
