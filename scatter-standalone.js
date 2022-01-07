(async () => {
    let data = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Ignite%20Project%20Regression.csv')
    let info = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Ignite%20Project%20Regression%20Info.csv')

    let selector = 'scatter';
    let visSelector = `#${selector}-vis`
    let stage = 0

    document.getElementById(selector).innerHTML = `
    <div class="row">
        <div id="${selector}-vis" class="column"></div>
        <div id="${selector}-info" class="column">
            <div class="inner-container">
                <div class="demo-buttons-container">
                    <div id="${selector}-demo-button" class="demo-btn"></div>
                    <div class="hidden" id="${selector}-stage-select"></div>
                </div>
                <div id="selector-model-overview-container">
                    <label for="optionSelect">Select model</label>
                    <div id="${selector}-dropdown">
                    </div>
                    <div id="${selector}-variance-container">
                        <div id="variance"></div>
                        <div id="variance-label">
                        Variance<br>
                        explained<br>
                        by model
                        </div>
                    </div>
                </div>
                <div id="${selector}-table"></div>
                <div class="tooltip" id="scatter-tooltip"></div>
            </div>
        </div>
    </div>
    `;

    let steps = [
        { text: 'Perfect Model', value: 'perfect' },
        { text: 'Demographic Model', value: 'demographic' },
        { text: 'Cognitive Traits Model', value: 'cognitive-traits' },
        { text: 'Cognitive Diversity Model', value: 'cognitive-diversity' },
        { text: 'Perception Model', value: 'perception' },
        { text: 'Qualitative Model', value: 'qualitative' }
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
        .html("ⓘ &nbsp; How do I interpret this graph?")
        .attr("id", "demoButton")
        .attr("class", "button")
        .attr("class", "demo-btn")
        .attr("background-color", "#ccc")
        .on('click', () => {
            if (stage > 0) {
                stage = 0
            } else {
                stage = 1
            }
            walkthrough()
        });

    d3.select(`#${selector}-stage-select`)
        .append("button")
        .text("<")
        .attr("class", "button")
        .attr("id", "backButton")
        .attr("background-color", "#ccc")
        .attr("disabled", stage < 2 ? true : null)
        .on('click', () => {
            if (stage >= 1) {
                stage = stage - 1
                walkthrough()
            }

        });

    d3.select(`#${selector}-stage-select`)
        .append("button")
        .text(">")
        .attr("class", "button")
        .attr("id", "forwardButton")
        .attr("background-color", "#ccc")
        .on('click', () => {
            if (stage <= 6) {
                stage = stage + 1
                walkthrough()
            } else {
                stage = 0
                walkthrough()
            }
        });

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
        .attr("pointer-events", (d, i) => d.model == step || d.model == 'perfect' ? "auto" : "none");

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
        .attr('class', 'points');


    let columns = ['variables', 'direction', 'p-value']

    var table = d3.select(`#${selector}-table`).append("table"),
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

    let xAxisLabel = svg.append('text')
        .text('Actual Score')
        .attr('x', width / 2)
        .attr('y', height + (margin.bottom / 2))
        .attr('text-anchor', "middle")
        .attr('fill', 'white')

    let yAxisLabel = svg.append('text')
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
        .attr("width", 300)
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
        .text("Selected model regression line")
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
        .text("Perfect model regression line")
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
        .text("Study group")
        .attr("fill", "grey")
        .attr("dominant-baseline", "middle")

    function update(val) {


        if (val) step = val.target.value;
        d3.select('#optionSelect').property('value', step);

        if (step == 'perfect') {
            d3.select(`#${selector}-table`).style('visibility', 'hidden')
        } else {
            d3.select(`#${selector}-table`).style('visibility', 'visible')
        }

        regressionLine.attr("stroke", colorScale(step))
        teamPoint.attr('fill', colorScale(step))

        points.attr('fill-opacity', d => d.model == step || d.model == 'perfect' ? 1 : 0)
        points.attr("pointer-events", d => d.model == step || d.model == 'perfect' ? "auto" : "none")

        lines.attr("pointer-events", (d, i) => d.model == step || d.model == 'perfect' ? "auto" : "none")
        lines.attr('stroke-opacity', (d, i) => d.model == step || d.model == 'perfect' ? 1 : 0.2)

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

    function pointsIn() {
        points
            .filter(d => d.model == step)
            .attr('stroke-width', d => d.model == step ? 1 : 0)
            .raise();
    }

    function pointsOut() {
        points.attr('stroke-width', 0);
    }

    function lineIn() {
        let selectedData = regressionLines.find(d => d.model == step)

        svg.selectAll('.selected-line-stroke')
            .data([selectedData])
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

    }

    function lineOut() {
        svg.selectAll('.selected-line-stroke').remove();
    }

    function walkthrough() {

        d3.select("#demoButton").html(stage == 0 ? "ⓘ &nbsp; How do I interpret this graph?" : "ⓧ &nbsp; Close graph walkthrough")
        d3.select("#backButton").attr("disabled", stage < 2 ? true : null)
        d3.select("#forwardButton").attr("disabled", stage > 7 ? true : null)
        d3.select(`#${selector}-stage-select`).classed('hidden', stage == 0 ? true : false)

        tooltip.style("visibility", "visible")

        if (stage == 0){
            step = steps[0].value
            d3.select("#demoButton").classed('demo-active', false)
            d3.select("#demoButton").classed('demo-btn', true)
            d3.select(`#${selector}-table`).classed('highlight', false)
            d3.select(`#${selector}-variance-container`).classed('highlight', false)
            update()
            lineOut()
            pointsOut()
            tooltip.style("visibility", "hidden")
            d3.select('#optionSelect').attr('disabled', null)
            d3.select('#selector-model-overview-container').style('display', 'block')
            d3.select('#scatter-table').style('display', 'block')
        } else if (stage == 1) {
            step = steps[0].value
            update()
            d3.select("#demoButton").classed('demo-btn', false)
            d3.select("#demoButton").classed('demo-active', true)
            d3.select('#selector-model-overview-container').style('display', 'none')
            d3.select('#scatter-table').style('display', 'none')
            d3.select('#optionSelect').attr('disabled', true)
            points.attr('cy', d => yScale(d.predicted))
            lines.attr('stroke-opacity', d => d.model == step ? 1 : 0)
            pointsOut()
            tooltip.text("We used linear regression models to predict the champion score for each study group. This graph visualizes the prediction results vs. the actual score of each group for five different models.")


        } else if (stage == 2) {

            lines.attr('stroke-opacity', 0)
            
            points.attr('cy', height)
            pointsIn()
            tooltip.text("The actual score of each study group is plotted along the x-axis.")


        } else if (stage == 3) {
            lineOut()
            d3.select('#selector-model-overview-container').style('display', 'none')
            points.transition().attr('cy', d => yScale(d.predicted))
            lines.attr('stroke-opacity', 0)
            tooltip.text("The predicted score of each study group is plotted along the y-axis.")

        } else if (stage == 4) {

            step = steps[0].value
            update()
            pointsOut()
            lineOut()
            d3.select('#selector-model-overview-container').style('display', null)
            lines.attr('stroke-opacity', (d, i) => d.model == step || d.model == 'perfect' ? 1 : 0.2)
            lineIn()
            pointsIn()
            tooltip.text("If a model were to perfectly predict the score of each group, the model’s regression line would form a 45 degree angle. For the purposes of this visualization we’ll call this the ‘perfect model’, and we’ll reference this line for comparison against all of the other models.")

        } else if (stage == 5) {

            step = steps[1].value
            update()
            pointsOut()
            lineOut()
            lineIn()
            pointsIn()
            d3.select(`#${selector}-table`).classed('highlight', false)
            d3.select('#scatter-table').style('display', 'none')
            tooltip.text("The ‘select model’ dropdown allows you to explore the results of different models.")

        } else if (stage == 6) {

            pointsOut()
            lineOut()
            d3.select(`#${selector}-variance-container`).classed('highlight', false)
            d3.select(`#${selector}-table`).classed('highlight', true)
            d3.select('#scatter-table').style('display', null)
            tooltip.text("Each model is comprised of multiple variables. The statistically significant variables are displayed in the table above.")

        } else if (stage == 7) {

            step = steps[1].value
            update()
            d3.select(`#${selector}-table`).classed('highlight', false)
            d3.select(`#${selector}-variance-container`).classed('highlight', true)
            tooltip.text("The variance explained by the model measures how well the model performed at predicting champion scores. The closer to 100%, the more accurate the model.")

        }

    }

})()
