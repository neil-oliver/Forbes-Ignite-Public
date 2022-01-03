(async () => {
    let data = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Ignite%20Project%20Regression.csv')
    let info = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Ignite%20Project%20Regression%20Info.csv')

    let selector = 'scatter';
    let visSelector = `#${selector}-vis`

    document.getElementById(selector).innerHTML = `
    <div class="row">
        <div id="${selector}-vis" class="column"></div>
        <div id="${selector}-info" class="column">
            <div class="inner-container">
                <div id="${selector}-demo-button"></div>
                <div><h2 id="model-title">Perfect Model</h2></div>
                <div id="${selector}-dropdown"></div>
                <div id="variance-container">
                    <div id="variance"></div>
                    <div id="variance-label">
                    Variance<br>
                    explained<br>
                    by model
                    </div>
                </div>
                <div id="table"></div>
                <div class="tooltip" id="scatter-tooltip"></div>
            </div>
        </div>
    </div>
    `;

    let steps = [
        { text: 'Perfect', value: 'perfect' },
        { text: 'Demographic', value: 'demographic' },
        { text: 'Cognitive Traits', value: 'cognitive-traits' },
        { text: 'Cognitive Diversity', value: 'cognitive-diversity' },
        { text: 'Perception', value: 'perception' },
        { text: 'Qualitative', value: 'qualitative' }
    ]

    let step = steps[0].value;

    var body = d3.select(visSelector)
    body.html("")

    // create a tooltip
    var tooltip = d3.select("#scatter-tooltip")

    var input = d3.select(`#${selector}-dropdown`)
        .append('select')
        .attr('id', 'optionSelect')
        .on('change', update)
        .selectAll('option')
        .data(steps)
        .join('option')
        .attr('value', d => d.value)
        .text(d => d.text)

    body.append('br')

    // add simulation button
    var button = d3.select(`#${selector}-demo-button`)
        .append("button")
        .text("How do i interpret this graph?")
        .attr("id", "buttonCentre")
        .attr("class", "button")
        .attr("background-color", "#ccc")
        .on('click', simulate);

    // margins for SVG
    const margin = {
        left: 50,
        right: 50,
        top: 50,
        bottom: 50
    }

    // responsive width & height
    const svgWidth = 700
    const svgHeight = svgWidth

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right


    // add SVG

    d3.select(`${visSelector} svg`).remove();

    const svg = d3.select(visSelector)
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
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
        regressionLines[regressionLines.length - 1].model = model
    }

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
        .attr("stroke", (d, i) => colorScale(d.model))
        .attr('stroke-width', (d, i) => d.model == step || d.model == 'perfect' ? 2 : 3)
        .attr('stroke-opacity', (d, i) => d.model == step || d.model == 'perfect' ? 1 : 0.2)
        .attr("pointer-events", (d, i) => d.model == step || d.model == 'perfect' ? "auto" : "none")
        .on("mouseover", (event) => {

            let data = regressionLines.find(d => d.model == step)

            svg.selectAll('.selected-line-stroke')
                .data([data])
                .join('line')
                .attr("class", "selected-line-stroke")
                .attr("x1", d => xScale(d[0][0]))
                .attr("x2", d => xScale(d[1][0]))
                .attr("y1", d => yScale(d[0][1]))
                .attr("y2", d => yScale(d[1][1]))
                .attr("stroke", (d, i) => 'white')
                .attr('stroke-width', 5)
                .attr("pointer-events", "none");

            lines
                .filter(d => d.model == step)
                .raise();

            tooltip
                .text("line text")
                .style("visibility", "visible")

        })
        .on("mouseout", (event, d) => {

            svg.selectAll('.selected-line-stroke').remove();

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
        .attr("stroke", "white")
        .attr("stroke-width", 0)
        .attr('cy', d => yScale(d.predicted))
        .attr('cx', d => xScale(d.actual))
        .attr('class', 'points')
        .on("mouseover", (event) => {

            d3.select(event.currentTarget)
                .attr('stroke-width', d => d.model == step ? 1 : 0);

            points
                .filter(d => d.model == step)
                .raise();

            tooltip
                .text("point text")
                .style("visibility", "visible")
        })
        .on("mouseout", (event) => {

            d3.select(event.currentTarget)
                .attr('stroke-width', 0);

            tooltip
                .style("visibility", "hidden")

        });

    let columns = ['variables', 'direction', 'p value']

    var table = d3.select('#table').append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()));

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
        .text('Actual vs. Predicted Study Team Champion Scores')
        .attr('x', width / 2)
        .attr('y', -(margin.top / 2))
        .attr('text-anchor', "middle")
        .attr('fill', 'white')
        .attr('font-style', 'italic')

    svg.append('text')
        .text('Actual Score')
        .attr('x', width / 2)
        .attr('y', height + (margin.bottom / 2))
        .attr('text-anchor', "middle")
        .attr('fill', 'white')

    svg.append('text')
        .text('Predicted Score')
        .attr('text-anchor', "middle")
        .attr('fill', 'white')
        .attr('transform', `translate(${-(margin.left / 2)},${height / 2})  rotate(-90)`)


    ////////////////////////////////////
    /////////// legend /////////////////
    ////////////////////////////////////   

    let legendX = 20
    let legendY = 20

    let legendBox = svg.append('rect')
        .attr("x", legendX - 10)
        .attr("y", legendY - 10)
        .attr("width", 260)
        .attr("height", 100)
        .attr("fill", 'rgba(100,100,100,0.2)')

    svg.append('text')
        .attr("x", legendX + 10)
        .attr("y", legendY + 10)
        .text("LEGEND")
        .attr("fill", "grey")

    let regressionLine = svg.append('line')
        .attr("x1", legendX + 10)
        .attr("x2", legendX + 30)
        .attr("y1", legendY + 50)
        .attr("y2", legendY + 50)
        .attr("stroke", colorScale(step))
        .attr("stroke-width", 3)

    svg.append('text')
        .attr("x", legendX + 40)
        .attr("y", legendY + 50)
        .text("Model Regression")
        .attr("fill", "grey")
        .attr("dominant-baseline", "middle")

    let perfectLine = svg.append('line')
        .attr("x1", legendX + 10)
        .attr("x2", legendX + 30)
        .attr("y1", legendY + 70)
        .attr("y2", legendY + 70)
        .attr("stroke", colorScale(steps[0].value))
        .attr("stroke-width", 2)

    svg.append('text')
        .attr("x", legendX + 40)
        .attr("y", legendY + 70)
        .text("Perfect Prediction")
        .attr("fill", "grey")
        .attr("dominant-baseline", "middle")

    let teamPoint = svg.append('circle')
        .attr('r', radius)
        .attr('fill', colorScale(step))
        .attr('cx', legendX + 20)
        .attr('cy', legendY + 30)

    let modelText = svg.append('text')
        .attr("x", legendX + 40)
        .attr("y", legendY + 30)
        .text("Perfect Score")
        .attr("fill", "grey")
        .attr("dominant-baseline", "middle")

    function update(val) {

        if (val) step = val.target.value;

        if (step == 'perfect') {
            d3.select('#table').style('visibility', 'hidden')
        } else {
            d3.select('#table').style('visibility', 'visible')
        }

        modelText.text(steps.find(d => d.value == step).text + " Score")

        regressionLine.attr("stroke", colorScale(step))
        teamPoint.attr('fill', colorScale(step))

        points.attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        points.attr("pointer-events", d => d.model == step || d.model == 'perfect' ? "auto" : "none")

        lines.attr("pointer-events", (d, i) => d.model == step || d.model == 'perfect' ? "auto" : "none")
        lines.attr('stroke-opacity', (d, i) => d.model == step || d.model == 'perfect' ? 1 : 0.2)

        d3.select('#model-title').text(steps.find(d => d.value == step).text + ' Model')

        d3.select('#variance')
            .data(regressionLines.filter((d, i) => d.model == step))
            .join("span")
            .text(d => parseInt(d.rSquared * 100) + '%')
            .style('color', (d, i) => colorScale(step))

        var rows = tbody.selectAll("tr")
            .data(info.filter(d => d.model == step))
            .join("tr");

        var cells = rows.selectAll("td")
            .data(function (row) {
                return columns.map(function (column) {
                    return { value: row[column] };
                });
            })
            .join("td")
            .text(d => d.value);

        return step
    }

    update()


    function simulate() {

        const sim_time = 3000
        window.clearTimeout()

        step = steps[0].value
        update()

        points.dispatch("mouseover")

        setTimeout(() => {
            points.dispatch("mouseout")
            lines.dispatch("mouseover")
        }, sim_time);

        setTimeout(() => {
            lines.dispatch("mouseout")
            step = steps[1].value
            update()
            lines.dispatch("mouseover")
            points.dispatch("mouseover")
        }, sim_time * 2);

        setTimeout(() => {
            points.dispatch("mouseout")
            lines.dispatch("mouseout")
            step = steps[0].value
            update()
        }, sim_time * 3);
    }

})()
