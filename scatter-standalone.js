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

    // create a tooltip
    var tooltip = body
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("pointer-events", "none")
        .attr("class", "tooltip")


    // create a dropdown
    var span = body.append('span')
        .text('Select Option: ')
        .on("mouseover", () => {
            tooltip
                .text("tooltip text")
                .style("visibility", "visible")
        })
        .on("mousemove", (event) => {
            tooltip
                .style("top", (event.pageY - 50) + "px")
                .style("left", (event.pageX) + "px")
        })
        .on("mouseout", () => {
            tooltip
                .style("visibility", "hidden")
        });

    var input = body.append('select')
        .attr('id', 'optionSelect')
        .on('change', update)
        .selectAll('option')
        .data(steps)
        .join('option')
        .attr('value', d => d.value)
        .text(d => d.text)

    body.append('br')
    
    // add simulation button
    var button = body.append("button")
    .text("Demo")
    .attr("id", "buttonCentre")
    .attr("class", "button")
    .attr("background-color", "#ccc")
    .on('click', simulate);

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

    svg.append('text')
    .text('Actual Score')
    .attr('x', width / 2)
    .attr('y', height + (margin.bottom / 2))
    .attr('text-anchor',"middle")
    .attr('fill', 'white')

    svg.append('text')
    .text('Predicted Score')
    .attr('text-anchor',"middle")
    .attr('fill', 'white')
    .attr('transform', `translate(${-(margin.left/2)},${height /2})  rotate(-90)`)

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
        .attr("pointer-events", (d, i) => models[i] == step || models[i] == 'perfect' ? "auto" : "none")
        .on("mouseover", () => {
            tooltip
                .text("line text")
                .style("visibility", "visible")

        })
        .on("mousemove", (event) => {
            tooltip
                .style("top", (event.pageY - 50) + "px")
                .style("left", (event.pageX) + "px")
        })
        .on("mouseout", () => {
            tooltip
                .style("visibility", "hidden")
        });

    let points = svg.selectAll('.points')
        .data(data)
        .join('circle')
        .attr('r', radius)
        .attr('fill', d => colorScale(d.model))
        .attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        .attr("pointer-events", d => d.model == step || d.model == 'perfect' ? "auto" : "none")
        .attr('cy', d => yScale(d.predicted))
        .attr('cx', d => xScale(d.actual))
        .attr('class', 'points')
        .on("mouseover", () => {
            tooltip
                .text("point text")
                .style("visibility", "visible")
        })
        .on("mousemove", (event) => {
            tooltip
                .style("top", (event.pageY - 50) + "px")
                .style("left", (event.pageX) + "px")
        })
        .on("mouseout", () => {
            tooltip
                .style("visibility", "hidden")
        });


    function update(val) {

        if (val) step = val.target.value;

        points.attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        points.attr("pointer-events", d => d.model == step || d.model == 'perfect' ? "auto" : "none")

        lines.attr("pointer-events", (d, i) => models[i] == step || models[i] == 'perfect' ? "auto" : "none")
        lines.attr('stroke-opacity', (d, i) => models[i] == step || models[i] == 'perfect' ? 1 : 0.2)

        return step
    }

    function simulate(){

        const sim_time = 1000
        window.clearTimeout()

        step = steps[0].value
        update()
        span.dispatch("mouseover")

        setTimeout(() => {
            points.dispatch("mouseover")
        }, sim_time);

        setTimeout(() => {
            lines.dispatch("mouseover")
        }, sim_time * 2);

        setTimeout(() => {
            step = steps[1].value
            update()
        }, sim_time * 3);

        setTimeout(() => {
            step = steps[0].value
            update()
            span.dispatch("mouseout")
        }, sim_time * 4);
    }

})()
