var yearSlider = document.getElementById("yearRange");
var topYearDisplay = document.getElementById("topYearDisplay");
var currentYear = 1998;
var currentMonth = 0;
// array of month names for display purposes
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var currentWeek = 1;

// timeline slider constants: 1998-01-01 (week 1) to 2004-12-31 (week 4)
var TIMELINE_START_YEAR = 1998;
var TIMELINE_END_YEAR = 2005;
var WEEKS_PER_MONTH = 4;
var MONTHS_PER_YEAR = 12;

// calculate total weeks from start to end
function calculateTotalWeeks() {
    var yearDiff = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
    return (yearDiff * MONTHS_PER_YEAR * WEEKS_PER_MONTH) + WEEKS_PER_MONTH;
}

// convert linear week index (0 = 1998 Jan week 1) to {year, month, week}
function getDateFromWeekIndex(weekIndex) {
    var totalWeeks = calculateTotalWeeks();
    weekIndex = Math.max(0, Math.min(weekIndex, totalWeeks - 1));
    
    var year = TIMELINE_START_YEAR + Math.floor(weekIndex / (MONTHS_PER_YEAR * WEEKS_PER_MONTH));
    var remaining = weekIndex % (MONTHS_PER_YEAR * WEEKS_PER_MONTH);
    var month = Math.floor(remaining / WEEKS_PER_MONTH);
    var week = (remaining % WEEKS_PER_MONTH) + 1;
    
    return { year: year, month: month, week: week };
}

// convert {year, month, week} to linear week index
function getWeekIndexFromDate(year, month, week) {
    var yearOffset = (year - TIMELINE_START_YEAR) * MONTHS_PER_YEAR * WEEKS_PER_MONTH;
    var monthOffset = month * WEEKS_PER_MONTH;
    var weekOffset = (week - 1);
    return yearOffset + monthOffset + weekOffset;
}

// reports data will be loaded from reports.json
var reportsData = null;
var timelineSlider = document.getElementById("timelineSlider");
var histogramContainer = document.getElementById("histogramContainer");

// initialize timeline slider max value
var totalWeeks = calculateTotalWeeks();
timelineSlider.max = totalWeeks - 1;

fetch('reports.json').then(function(resp){
    return resp.json();
}).then(function(data){
    reportsData = data;
    console.log('reports.json loaded, reports:', reportsData.length);
    // build histogram after data loads
    buildHistogram();
}).catch(function(err){
    console.warn('Could not load reports.json:', err);
});

// build histogram showing report count per week
function buildHistogram() {
    if (!reportsData) return;
    
    // count reports per week
    var weekCounts = new Array(totalWeeks).fill(0);
    reportsData.forEach(function(report){
        if (!report.DATES || !Array.isArray(report.DATES)) return;
        report.DATES.forEach(function(dateStr){
            if (!dateStr || typeof dateStr !== 'string') return;
            var m = dateStr.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
            if (!m) return;
            var mm = parseInt(m[1], 10) - 1;
            var dd = parseInt(m[2], 10);
            var yy = parseInt(m[3], 10);
            if (yy >= TIMELINE_START_YEAR && yy <= TIMELINE_END_YEAR){
                var weekIndex = getWeekIndexFromDate(yy, mm, Math.ceil(dd / 7));
                if (weekIndex >= 0 && weekIndex < totalWeeks){
                    weekCounts[weekIndex]++;
                }
            }
        });
    });
    
    var maxCount = Math.max.apply(null, weekCounts);
    
    // create SVG histogram
    var svg = d3.select('#histogramContainer').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('display', 'block');
    
    var margin = { top: 5, right: 10, bottom: 20, left: 40 };
    var width = histogramContainer.clientWidth - margin.left - margin.right;
    var height = histogramContainer.clientHeight - margin.top - margin.bottom;
    
    var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    // scale for x (weeks) and y (count)
    var xScale = d3.scaleLinear()
        .domain([0, totalWeeks - 1])
        .range([0, width]);
    
    var yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([height, 0]);
    
    var barWidth = width / totalWeeks;
    
    // draw bars
    g.selectAll('.bar')
        .data(weekCounts)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', function(d, i){ return xScale(i); })
        .attr('y', function(d){ return yScale(d); })
        .attr('width', barWidth)
        .attr('height', function(d){ return height - yScale(d); })
        .attr('fill', '#4CAF50')
        .on('mouseover', function(event, d){ d3.select(this).attr('fill', '#aedfafff');})
        .on('mouseout', function(event, d){ d3.select(this).attr('fill', '#4CAF50');})


        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('click', function(event, d, i){
            // get the index of the clicked bar
            var barIndex = d3.select(this).data().index || weekCounts.indexOf(d);
            // find actual index from data binding
            var allBars = g.selectAll('.bar');
            var clickedIndex = -1;
            allBars.each(function(datum, idx){
                if (this === event.target){
                    clickedIndex = idx;
                }
            });
            // set timeline slider to this week
            if (clickedIndex >= 0){
                timelineSlider.value = clickedIndex;
                timelineSlider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    
    // draw x axis (weeks)
    g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale).ticks(10))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Week Index');
    
    // draw y axis (count)
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .attr('fill', 'black')
        .text('Report Count');
}

// timeline slider handler
timelineSlider.oninput = function(){
    d3.select('#map').selectAll('g.detail-box').remove();
    var date = getDateFromWeekIndex(Number(this.value));
    currentYear = date.year;
    currentMonth = date.month;
    currentWeek = date.week;
    
    var allReportsFeaturingDate = getReportsByDate(currentYear, currentMonth, currentWeek);
    
    if (allReportsFeaturingDate.length > 0)
        drawMapCircles(allReportsFeaturingDate);
    
    topYearDisplay.textContent = "Year: " + currentYear + " Month: " + monthNames[currentMonth] + " Week: " + currentWeek;
}

function getReportsByDate(year, month, week) {
    var reports = [];
    if (!reportsData) {
        console.warn('reportsData not loaded yet');
        return reports;
    }

    // week is 1..4 -> map to day ranges: 1:1-7, 2:8-14, 3:15-21, 4:22-31
    var wk = Number(week) || 1;
    var startDay = (wk - 1) * 7 + 1;
    var endDay = (wk === 4) ? 31 : wk * 7;

    reportsData.forEach(function(r){
        if (!r.DATES || !Array.isArray(r.DATES)) return;
        for (var i = 0; i < r.DATES.length; i++){
            var ds = r.DATES[i];
            if (!ds || typeof ds !== 'string') continue;
            // match MM/DD/YYYY or M/D/YYYY patterns
            var m = ds.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
            if (!m) continue;
            var mm = parseInt(m[1], 10) - 1; // zero-based month
            var dd = parseInt(m[2], 10);
            var yy = parseInt(m[3], 10);
            if (yy === Number(year) && mm === Number(month) && dd >= startDay && dd <= endDay){
                reports.push(r);
                break; // one match in this report is enough
            }
        }
    });
    return reports;
}

function drawMapCircles(allReportsFeaturingDate) {
    // create a color scale for unique reports
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    var reportColors = {};
    
    // assign a color to each report
    allReportsFeaturingDate.forEach(function(report, idx){
        reportColors[report.ID] = colorScale(idx);
    });
    
    // assemble a flat list of point objects with coordinates, report ID, and color
    var points = [];
    allReportsFeaturingDate.forEach(function(report){
        // Using GEOCODE attributes
        if (report.GEOCODES && Array.isArray(report.GEOCODES) && report.GEOCODES.length){
            report.GEOCODES.forEach(function(g){
                if (!g) return;
                var lat = Number(g.lat || g.latitude || g.Lat || g.Latitude);
                var lon = Number(g.lon || g.longitude || g.Lon || g.Longitude);
                if (!isNaN(lat) && !isNaN(lon)){
                    points.push({ 
                        coords: [lon, lat], 
                        name: report.ID || '',
                        color: reportColors[report.ID] || '#FF0000'
                    });
                }
            });
        }
    });

    // bind points to circle elements on the SVG and update positions
    var sel = d3.select('svg').selectAll('circle.report-point').data(points, function(d,i){ return d.name + '::' + i; });

    sel.join(
        function(enter){
            return enter.append('circle')
                .attr('class','report-point')
                .attr('r', 5)
                .attr('fill', function(d){ return d.color; })
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('cursor', 'pointer')
                .attr('cx', function(d){ return projection(d.coords)[0]; })
                .attr('cy', function(d){ return projection(d.coords)[1]; })
                .classed('selected', false)
                .on('mouseover', function(event, d){ 
                    var origColor = d3.select(this).attr('fill');
                    d3.select(this).attr('data-orig-color', origColor).attr('fill', 'orange');
                })
                .on('mouseout', function(event, d){
                    // if the circle is not selected, revert to its report color
                    if (!d3.select(this).classed('selected')){
                        d3.select(this).attr('fill', d.color);
                    }
                })
                .on('click', onClickReportCircle)
                .append('title').text(function(d){ return d.name; });
        },
        function(update){
            return update
        },
        function(exit){ return exit.remove(); }
    );
}

function geocodePlace(place, report) {
    if (!place || !reportsData) return null;
    for (var i = 0; i < reportsData.length; i++) {
        var rep = reportsData[i];
        if (!rep.GEOCODES || !Array.isArray(rep.GEOCODES)) continue;
        for (var j = 0; j < rep.GEOCODES.length; j++) {
            var geo = rep.GEOCODES[j];
            if (geo.PLACE === place) {
                return { lat: geo.LATITUDE, lon: geo.LONGITUDE };
            }
        }
    }
}

function onClickReportCircle(event, d) {
    console.log('Clicked on report:', d.name);
    
    // find the full report object by ID
    var fullReport = null;
    if (reportsData){
        for (var i = 0; i < reportsData.length; i++){
            if (reportsData[i].ID === d.name){
                fullReport = reportsData[i];
                break;
            }
        }
    }
    if (!fullReport){
        console.warn('Could not find full report for ID:', d.name);
        return;
    }
    
    // reset circle color to red immediately
    d3.select(this).attr('fill', 'red');
    
    // get the circle's position on screen
    var circleX = Number(d3.select(this).attr('cx'));
    var circleY = Number(d3.select(this).attr('cy'));
    
    // remove any existing detail box
    d3.select('#map').selectAll('g.detail-box').remove();
    
    // create a group for the detail box with pointer-events:
    var detailGroup = d3.select('#map').append('g')
        .attr('class', 'detail-box')
        .style('pointer-events', 'none');
    
    // append background rectangle
    detailGroup.append('rect')
        .attr('x', circleX + 15)
        .attr('y', circleY - 150)
        .attr('width', 300)
        .attr('height', 250)
        .attr('fill', 'lightgrey')
        .attr('stroke', 'black')
        .attr('stroke-width', 2);
    
    // append title with report ID
    detailGroup.append('text')
        .attr('x', circleX + 25)
        .attr('y', circleY - 125)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('Report: ' + fullReport.ID);

    // append report date
    detailGroup.append('text')
        .attr('x', circleX + 25)
        .attr('y', circleY - 105)
        .attr('font-size', '12px')
        .text('Date: ' + (fullReport.REPORTDATE || 'N/A'));
    
    // append report source
    detailGroup.append('text')
        .attr('x', circleX + 25)
        .attr('y', circleY - 85)
        .attr('font-size', '12px')
        .text('Source: ' + (fullReport.REPORTSOURCE || 'N/A'));
    
    // append persons (first 2)
    var personsText = (fullReport.PERSONS && fullReport.PERSONS.length) 
        ? fullReport.PERSONS.slice(0, 2).join(', ') 
        : 'N/A';
    detailGroup.append('text')
        .attr('x', circleX + 25)
        .attr('y', circleY - 65)
        .attr('font-size', '12px')
        .text('Persons: ' + personsText);
    
    // append organizations (first 2)
    var orgsText = (fullReport.ORGANIZATIONS && fullReport.ORGANIZATIONS.length) 
        ? fullReport.ORGANIZATIONS.slice(0, 2).join(', ') 
        : 'N/A';
    detailGroup.append('text')
        .attr('x', circleX + 25)
        .attr('y', circleY - 45)
        .attr('font-size', '12px')
        .text('Orgs: ' + orgsText);
    
    // append scrollable description using foreignObject
    var desc = fullReport.REPORTDESCRIPTION || 'No description available';
    var foreignObject = detailGroup.append('foreignObject')
        .attr('x', circleX + 15)
        .attr('y', circleY - 30)
        .attr('width', 300)
        .attr('height', 150)
        .style('pointer-events', 'auto')
        .style('overflow', 'hidden');
    
    var descDiv = foreignObject.append('xhtml:div')
        .style('width', '100%')
        .style('height', '85%')
        .style('overflow-y', 'scroll')
        .style('padding', '8px')
        .style('box-sizing', 'border-box')
        .style('font-size', '11px')
        .style('font-family', 'Arial, sans-serif')
        .style('line-height', '1.4');
    
    descDiv.append('xhtml:strong').text('Description:');
    descDiv.append('xhtml:p')
        .style('margin', '4px 0 0 0')
        .style('white-space', 'pre-wrap')
        .style('word-wrap', 'break-word')
        .text(desc);
    
    // log full report to console for inspection
    console.log('Full report:', fullReport);
    
    // append close button (X) on the detail box with pointer-events: auto so it's clickable
    detailGroup.append('text')
        .attr('x', circleX + 305)
        .attr('y', circleY - 135)
        .attr('font-size', '18px')
        .attr('cursor', 'pointer')
        .style('pointer-events', 'auto')
        .text('×')
        .on('click', function(){
            d3.select('#map').selectAll('g.detail-box').remove();
        });
}