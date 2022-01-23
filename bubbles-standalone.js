(async () => {
    let data = await d3.csv('https://raw.githubusercontent.com/neil-oliver/Forbes-Ignite-Public/main/data/Forbes%20Wrangled%20Individual%20Data.csv')

    let step = 'pymetrics';
    let selector = '#bubbles';
    let groupGridTimeout;

    const metrics = [
        {
            name: 'Generosity',
            left: 'Sharing',
            right: 'Frugal'
        },
        {
            name: 'Learning',
            left: 'Adaptive',
            right: 'Consistent'
        },
        {
            name: 'Attention',
            left: 'Methodical',
            right: 'Action-biased'
        },
        {
            name: 'Emotion',
            left: 'Expression-oriented',
            right: 'Context-oriented'
        },
        {
            name: 'Risk Tolerance',
            left: 'Adventurous',
            right: 'Cautious'
        },
        {
            name: 'Decision Making',
            left: 'Deliberative',
            right: 'Instinctive'
        },
        {
            name: 'Effort',
            left: 'Hard-working',
            right: 'Outcome-driven'
        },
        {
            name: 'Fairness',
            left: 'Accepting',
            right: 'Critical'
        },
        {
            name: 'Focus',
            left: 'Focused',
            right: 'Multi-tasking'
        },
    ]

    var body = d3.select(selector)
    body.html("")

    // margins for SVG
    const margin = {
        left: 10,
        right: 10,
        top: 70,
        bottom: 50
    }

    // responsive width & height
    const svgWidth = 500
    const svgHeight = svgWidth

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right


    // add SVG

    d3.select(`${selector} svg`).remove();

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
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
        group_grid[d] = { x: Math.floor(i / 5) / 4, y: (i % 5) / 4 }
    })

    data.forEach(d => {
        d.group_grid = group_grid[d['Group Name']]
    })

    const yScale = d3.scalePoint()
        .range([1, 0])
        .domain(metrics.map(m => m.name))

    const xScale = d3.scaleLinear()
        .range([0, 1])
        .domain([-4, 4])

    let wrangled = []
    metrics.forEach((metric, index) => {
        data.forEach(d => {
            wrangled.push({ ...d, pymetrics: { x: xScale(d[metric.name]), y: yScale(metric.name) }, i: index })
        })
    })

    data = wrangled

    console.log(data)

    ////////////////////////////////////
    //////////////globals///////////////
    ////////////////////////////////////
    const radius = 3
    const group = 'PCA Group'

    ////////////////////////////////////
    //////////////scales////////////////
    ////////////////////////////////////

    // left axis 
    const yLeft = d3.scalePoint()
        .range([0, height])
        .domain(metrics.map(m => m.left))

    // right axis
    const yRight = d3.scalePoint()
        .range([0, height])
        .domain(metrics.map(m => m.right))

    const xGridScale = d3.scaleLinear()
        .range([0, width])
        .domain([0, 1])

    const yGridScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1])


    // colour scales for all lines and legend
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d[group]))
        .range(['#FDA700', '#55BDB9', '#BD5CE9'])

    ////////////////////////////////////
    /////////simulation setup///////////
    ////////////////////////////////////   

    data.forEach(d => {
        d.y = yGridScale(0.5)
        d.x = xGridScale(0.5)
    })

    function tick() {
        d3.selectAll('.balls')
            .attr("cx", function (d) { return d.x })
            .attr("cy", function (d) { return d.y });
    }

    let lines = svg.selectAll('.lines')
        .data(yLeft.domain())
        .join('line')
        .attr('y1', d => yLeft(d))
        .attr('y2', d => yLeft(d))
        .attr('x1', 0)
        .attr('x2', width)
        .attr('stroke', '#E1E1E1')
        .attr('class', 'lines')


    let balls = svg.selectAll('.balls')
        .data(data)
        .join('circle')
        .attr('r', radius)
        .attr('fill', d => colorScale(d[group]))
        .attr('cy', d => yGridScale(d[step]))
        .attr('cx', d => xGridScale(d[step]))
        .attr('class', 'balls')

    let text = svg.selectAll('.trait-text')
        .data(metrics)
        .join('text')
        .attr('y', d => yLeft(d.left) - 20)
        .attr('x', width / 2)
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr('class', 'trait-text')

        let title = svg.selectAll('.trait-title')
        .data([0])
        .join('text')
        .attr('y', -50)
        .attr('x', width / 2)
        .text("Pymetrics traits distribution for all study participants")
        .attr("text-anchor", "middle")
        .attr('class', 'trait-title')


    var simulation = d3.forceSimulation(data)
        .force('y', d3.forceY(d =>
            yGridScale(d[step].y)
        ).strength(0.5)
        )
        .force('x', d3.forceX(d =>
            xGridScale(d[step].x)
        ).strength(0.5)
        )
        .force('collide', d3.forceCollide(d => step != 'pymetrics' && d.i != 0 ? 0 : radius * 1.1))
        .alphaDecay(0.01)
        .alpha(0.15)
        .on('tick', tick)

    // optional time out
    var init_decay;
    init_decay = setTimeout(function () {
        simulation.alphaDecay(0.1);
    }, 8000);

    ////////////////////////////////////
    ///////////////axis/////////////////
    ////////////////////////////////////


    // Left axis
    const yAxisLeft = d3.axisLeft(yLeft).tickSize(0)

    // Left Labels
    const leftAxisLabels = svg.append("g")
        .attr("class", 'grid')
        .attr("id", "y-axis-left")


    // Right axis
    const yAxisRight = d3.axisRight(yRight).tickSize(0)

    // Right Labels
    const rightAxisLabels = svg.append("g")
        .attr("class", 'grid')
        .attr("id", "y-axis-right")


    update()

    const cognitiveAssessment = document.querySelector('#cognitive-assessment');

    const cognitiveObserver = new IntersectionObserver((entry, observer) => {

        if (entry[0].isIntersecting == true && step !== 'pymetrics') {
            step = 'pymetrics'
            update()
        }
    });

    cognitiveObserver.observe(cognitiveAssessment);

    const groupAssignment = document.querySelector('#group-assignment');

    const groupObserver = new IntersectionObserver((entry, observer) => {

        if (entry[0].isIntersecting == true && step == 'pymetrics') {
            step = 'random'
            update()
        }
    });

    groupObserver.observe(groupAssignment);

    function update(val) {

        clearTimeout(groupGridTimeout);

        if (val) step = val.target.value;

        text.attr('opacity', d => step != 'pymetrics' ? 0 : 1)
        title.attr('opacity', d => step != 'pymetrics' ? 0 : 1)

        balls
            .attr('opacity', d => step != 'pymetrics' && d.i != 0 ? 0 : 1)
            .attr('r', d => step != 'pymetrics' && d.i != 0 ? 0 : radius)

        simulation.force('collide', d3.forceCollide(d => step != 'pymetrics' && d.i != 0 ? 0 : radius * 1.1))

        if (step == 'pymetrics') {
            lines.attr('opacity', 1)

            leftAxisLabels
                .call(yAxisLeft)
                .call(g => g.select(".domain").remove())
                .selectAll('text')
                .attr('text-anchor', 'start')
                .attr('dy', '-1em')
                .attr('font-size', '1.2em')

            rightAxisLabels
                .call(yAxisRight)
                .call(g => g.select(".domain").remove())
                .selectAll('text')
                .attr("transform", "translate(" + width + ",0)")
                .attr('text-anchor', 'end')
                .attr('dy', '-1em')
                .attr('font-size', '1.2em')
        } else {
            leftAxisLabels.html(null)
            rightAxisLabels.html(null)
            lines.attr('opacity', 0)
        }

        if (step == 'random') {

            groupGridTimeout = setTimeout(() => {
                step = 'group_grid'
                update()
            }, 2000);

        }


        simulation.force('x', d3.forceX(function (d) {
            return xGridScale(d[step].x)
        }))

        simulation.force('y', d3.forceY(function (d) {
            return yGridScale(d[step].y)
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

})()
