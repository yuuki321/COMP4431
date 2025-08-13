function Graph(data) {
    this.getDataPoints = function getDataPoints() {
        return data
    }

    this.switchMode = function switchMode() {
        if ($("#adsr-use-multistage").prop("checked")) {
            $("#adsr-multistage-points").prop("disabled", false);
            const numOfPoints = parseInt($("#adsr-multistage-points").val())

            let temp = [{ x: 0, y: 0 }]
            for (let i = 1; i <= numOfPoints - 2; ++i) {
                temp.push({ x: i * 100 / (numOfPoints - 1), y: 0.5 });
            }
            temp.push({ x: 100, y: 0 });
            data = temp
        } else { 
            $("#adsr-multistage-points").prop("disabled", true);
            data = [
                { x: 0, y: 0 },   // Start point
                { x: 10, y: 0.8 }, // Attack peak
                { x: 15, y: 0.8 }, // Hold level
                { x: 20, y: 0.5 }, // Decay and sustain level
                { x: 90, y: 0.5 }, // Sustain
                { x: 100, y: 0 },  // Release back to 0
            ];
        }

        // Clear the old graph elements
        graph.selectAll(".line").remove();
        graph.selectAll(".point").remove();

        // Re-create the line path
        linePath = graph.append("path") // Re-append the line path
            .datum(data)
            .attr("class", "line")
            .attr("d", line) // Use the updated data to regenerate the line
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        // Re-create the points
        points = graph.selectAll(".point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 6)
            .attr("fill", "orange")
            .style("cursor", "pointer")
            .call(
                d3.drag()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded)
            );
    }

    const width = 800;
    const height = 400;
    const margin = 50;

    // Create scales for x (percentage) and y (range 0 to 1)
    const xScale = d3.scaleLinear().domain([0, 100]).range([margin, width - margin]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height - margin, margin]);

    // Create the SVG container
    const svg = d3.select("#adsr")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a group for the graph elements
    const graph = svg.append("g").attr("class", "graph-elements");

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d.toFixed(1)}%`);
    const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d.toFixed(2)}`);

    // Append x-axis
    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin})`)
        .call(xAxis);

    // Append y-axis
    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin}, 0)`)
        .call(yAxis);

    // Add a clipping path
    svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin)
        .attr("y", margin)
        .attr("width", width - 2 * margin)
        .attr("height", height - 2 * margin);

    // Apply the clipping path to the graph elements
    graph.attr("clip-path", "url(#clip)");

    // Create a line generator
    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    // Add the line path
    let linePath = graph.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Add draggable points
    let points = graph.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 6)
        .attr("fill", "orange")
        .style("cursor", "pointer")
        .call(
            d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded)
        );

    // Drag event functions
    function dragStarted(event, d) {
        d3.select(this).raise().attr("stroke", "black");
    }

    function dragged(event, d) {
        // console.log("\n");
        // console.log(`event x & y: ${event.x}, ${event.y}`)
        // console.log(`d x & y: ${d.x}, ${d.y}`)
        // console.log(`scale x & y: ${xScale.invert(d3.select(this).attr("cx"))}, ${yScale.invert(d3.select(this).attr("cy"))}`)

        const transform = d3.zoomTransform(svg.node()); // Get the current zoom transform

        // Use the rescaled scales
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        // Convert pixel delta to data space delta
        const deltaX = newXScale.invert(newXScale(0) + event.dx) - newXScale.invert(newXScale(0));
        const deltaY = newYScale.invert(newYScale(0) + event.dy) - newYScale.invert(newYScale(0));

        // Determine the index of the current point in the data array
        const index = data.indexOf(d);

        // Normal mode, fixed start and end
        if (index === 0 || index === data.length - 1) return;

        // Get the x-coordinates of the neighboring points
        const minX = index > 0 ? data[index - 1].x : 0; // Previous point's x or 0
        const maxX = index < data.length - 1 ? data[index + 1].x : 100; // Next point's x or 100

        // Update the x-coordinate and clamp to the range [minX, maxX]
        const newX = Math.max(minX, Math.min(d.x + deltaX, maxX));
        const newY = Math.max(0, Math.min(d.y + deltaY, 1)); // Clamp y between 0 and 1
        d.x = newX; 
        d.y = newY; 

        // Normal mode, fixed hold/sustain level
        if (!$("#adsr-use-multistage").prop("checked")) {
            if (index === 1) data[2].y = d.y;
            else if (index === 2) data[1].y = d.y;
            else if (index === 3) data[4].y = d.y;
            else if (index === 4) data[3].y = d.y;
        }

        // Update the positions of all points (reflect changes visually)
        points
            .data(data)
            .attr("cx", d => newXScale(d.x))
            .attr("cy", d => newYScale(d.y));

        // Update the line path
        linePath.attr("d", line);

        // Update the displayed positions
        // updatePointPositionsDisplay(data);
    }

    function dragEnded(event, d) {
        d3.select(this).attr("stroke", null);

        $("#savelink").addClass("disabled");
        document.querySelector("#audioController").generateWaveform();
        $("#savelink").removeClass("disabled");
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 4]) // Zoom scale range
        .extent([[margin, margin], [width - margin, height - margin]])
        .translateExtent([[margin, margin], [width - margin, height - margin]]) // Limit panning
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const transform = event.transform;

        // Rescale the axes
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        // Update the axes
        xAxisGroup.call(xAxis.scale(newXScale));
        yAxisGroup.call(yAxis.scale(newYScale));

        // Update the line and points with the new scales
        linePath.attr("d", line.x(d => newXScale(d.x)).y(d => newYScale(d.y)));
        points.attr("cx", d => newXScale(d.x)).attr("cy", d => newYScale(d.y));
    }
}