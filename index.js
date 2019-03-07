(function() {
  var location;
  var rotation;
  var legends;
  var range, ranges;

  var airports = {
    copenhagen: {
      coords: [12.5683, 55.6761],
      rotation: [-10, -60, 0]
    },
    hongkong: {
      coords: [114.1095, 22.3964],
      rotation: [-114, -25, 0]
    },
    newyork: {
      coords: [-74.006, 40.7128],
      rotation: [74, -40, 0]
    }
  };

  document.querySelector('select').addEventListener('change', updateLocation);

  function updateLocation(e) {
    location = airports[e.target.value].coords;
    rotation = airports[e.target.value].rotation;

    update(flightTimes, location, rotation);
  }

  function render() {
    var width = Math.min(960, window.innerWidth);
    var height = Math.min(600, window.innerHeight);
    var margin = 25;
    projection.fitExtent(
      [[margin, margin], [width - margin, height - margin]],
      {
        type: 'Sphere'
      }
    );
    svg.attr('width', width).attr('height', height);
    svg.selectAll('path').attr('d', path);
  }

  var projection = d3.geoOrthographic().clipAngle(90);

  var path = d3.geoPath().projection(projection);

  var svg = d3.select('svg');

  var sphere = svg
    .append('path')
    .attr('class', 'outline')
    .attr('style', 'filter:url(#dropshadow)')
    .datum({ type: 'Sphere' });

  svg
    .append('path')
    .datum(d3.geoGraticule())
    .attr('fill', 'none')
    .attr('stroke-width', 0.5)
    .attr('stroke', '#ddd');

  var countries = svg.append('path').attr('id', 'countries');

  d3.queue()
    .defer(d3.json, 'countries.geojson')
    .await((err, world) => {
      countries
        .datum(d3.geoStitch(world))
        .attr('opacity', 0.01)
        .transition()
        .duration(500)
        .attr('opacity', 0.6);

      render();
    });

  function update(flightTimes, location, rotation) {
    if (legends) legends.classed('hover', false);
    d3.select('.ranges').remove();
    d3.select('.location')
      .transition(250)
      .style('opacity', 0)
      .remove();

    flightTimes.forEach(data => {
      var time = +data.name.split(' ')[0];
      var range = 545.267756 * time - 189.306421;
      data.range = range;
      return (data.l = ((range / (6371 * 0.62137)) * 180) / Math.PI);
    });

    flightTimes = flightTimes.sort((a, b) => a - b);

    ranges = svg
      .append('g')
      .classed('ranges', true)
      .selectAll('path')
      .data(
        flightTimes.map(d => {
          var c = d3
            .geoCircle()
            .center(location)
            .radius(d.l)();
          c.properties = d;
          return c;
        })
      );

    range = ranges
      .enter()
      .append('path')
      .attr('id', (d, i) => 'd' + i);

    ranges.exit().remove();

    svg
      .append('path')
      .classed('location', true)
      .datum({ type: 'Point', coordinates: location });

    projection.rotate(rotation);
    projection.translate([550, 250]);
  }

  location = [12.5683, 55.6761];
  rotation = [-12, -55, 0];
  var flightTimes = d3.csvParse(`name
16 hours
12 hours
6 hours
3 hours
2 hours
1 hour`);

  update(flightTimes, location, rotation);

  var hover;

  // legend code
  legends = svg
    .append('g')
    .attr('id', 'legend')
    .selectAll('g')
    .data(flightTimes.map(d => ((d.properties = d), d)))
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(${[0, i * 20 + 60]})`)
    .on('mouseover click', d => {
      hover = d.properties.name;
      range.classed('hover', d => d.properties.name == hover);
      legends.classed('hover', d => d.properties.name == hover);
    });

  legends
    .append('rect')
    .attr('width', 200)
    .attr('height', 20)
    .attr('y', -15);

  var f = d3.formatLocale({ thousands: ',', grouping: [3] }).format(' >6,.2r');
  legends.append('text').text(d => `${f(d.range)} miles - ${d.name}`);

  d3.geoInertiaDrag(svg, render, projection);
  d3.interval(render, 500);
})();
