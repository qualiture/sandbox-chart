sap.ui.define([
	"sap/ui/core/Control"
], (Control) => {
	"use strict";
	return Control.extend("nl.qualiture.spc.sandbox.sandboxchart.custom.D3Chart", {
 		metadata: {
			properties: {
                width: {
                    type: "int", 
                    defaultValue: 600
                },
                height: {
                    type: "int", 
                    defaultValue: 500
                },
                data: {
                    type: "array",
                    defaultValue: []
                }
            },
			events: {}
		},

 		init() { } ,

 		renderer(rm, control) {
			rm.openStart("div", control).class("d3").openEnd();
			rm.close("div");
		},

 		onAfterRendering() {
            // https://d3-graph-gallery.com/
            // https://www.freecodecamp.org/news/d3js-tutorial-data-visualization-for-beginners/
            
            const data = this.getMappedData(this.getData());
            const yAxisRange = this.getDefaultYAxisRange(this.getData());

            const $control = $(`div[id="${this.getId()}"]`);
            const controlSize = {
                width: $control.parent().width(),
                height: 900
            }

            console.log("[D3Chart]", data);

            const margin = {top: 10, right: 30, bottom: 80, left: 60},
                width = controlSize.width - margin.left - margin.right,
                height = controlSize.height - margin.top - margin.bottom;

            // SVG viewport
            const svg = d3.select(`div[id="${this.getId()}"]`)
                .append("svg")
                .attr("width", controlSize.width)
                .attr("height", controlSize.height)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // X-axis
            const x = d3.scalePoint()
                .domain(data.map(o => o.MachineNumber))       // This is what is written on the Axis: from 0 to 100
                .range([0, width])                            // This is where the axis is placed: from 100 px to 800px
                .padding([0.5]);                              // Goes between 0 and 1. Default is 0

            const xAxis = svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end");

            // Y-axis
            const y = d3.scaleLinear()
                .domain([0, yAxisRange.axisRange[0]])         // This is what is written on the Axis: from 0 to 100
                .range([height, 0]);

            const yAxis = svg.append("g")
                .call(d3.axisLeft(y).tickSize(-width * 1.3).ticks(7)); // adding lines

            svg.selectAll(".tick line").attr("stroke", "#DDD")

            // Add X axis label:
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", height + margin.top + 60)
                .text("Products");

            // Y axis label:
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left+20)
                .attr("x", -margin.top)
                .text("DYPE Standstill: POB LOS MSD Y");

            // Add a clipPath: everything out of this area won't be drawn.
            const clip = svg.append("defs")
                .append("SVG:clipPath")
                .attr("id", "clip")
                .append("SVG:rect")
                .attr("width", width )
                .attr("height", height )
                .attr("x", 0)
                .attr("y", 0);

            const layer = svg.append("g")
                .attr("clip-path", "url(#clip)");

            // Add the line
            layer.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                .x(d => x(d.MachineNumber))
                .y(d => y(d.CommittedValue))
            );

            // Add the points
            layer.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", (d => x(d.MachineNumber)))
                .attr("cy", (d => y(d.CommittedValue)))
                .attr("r", 5)
                .attr("fill", "#69b3a2");

            // Add UCL, LCL, etc
            const ucl = layer.append("line")
                .attr("class", "mean-line")
                .attr("x1", 0)
                .attr("y1", y(0.15))
                .attr("x2", width)
                .attr("y2", y(0.15))
                .attr("stroke", "#F00");

            // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
            const zoom = d3.zoom()
                .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
                .extent([[0, 0], [width, height]])
                // .on("zoom", updateChart).bind(y);
                .on("zoom", (event) => {
                    // if (event.sourceEvent.type === "dblclick") {
                    //     setTimeout(null, 350);
                    //     y.domain([0, yAxisRange.axisRange[0]]);
                    // }

                    // recover the new scale
                    var newY = event.transform.rescaleY(y);

                    // update axes with these new boundaries
                    yAxis.call(d3.axisLeft(newY).tickSize(-width * 1.3).ticks(7));
                    svg.selectAll(".tick line").attr("stroke", "#DDD");

                    // update line position
                    layer.selectAll("path")
                    .attr('d', d3.line()
                        .x(d => x(d.MachineNumber))
                        .y(d => newY(d.CommittedValue))
                    );

                    // update point position
                    layer.selectAll("circle")
                        .attr('cx', (d => x(d.MachineNumber)))
                        .attr('cy', (d => newY(d.CommittedValue)));

                    ucl
                        .attr("y1", newY(0.15))
                        .attr("y2", newY(0.15))    
                });

            // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom
            svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .call(zoom);
        },

        getMappedData(data) {
            return data.filter(o => o.CommittedValue !== null).map((o) => { 
                return { 
                    MachineNumber: o.MachineNumber, 
                    CommittedValue: o.CommittedValue || 0
                }
            });
        },

        getDefaultYAxisRange(data) {
            const committedValues = data.map(obj => obj.CommittedValue);

            const lVal = Math.min(...committedValues);
            const uVal = Math.max(...committedValues);

            const lcl = Math.min(...data.map(obj => obj.LCL));
            const ucl = Math.max(...data.map(obj => obj.UCL));

            const lBound = lVal < lcl ? lVal : lcl;
            const uBound = uVal > ucl ? uVal : ucl;

            const range = uBound - lBound;

            const axisRange = [ uBound + (0.1 * range), lBound - (0.1 * range) ];

            return { lVal, uVal, lcl, ucl, axisRange };
        }

    });
});
