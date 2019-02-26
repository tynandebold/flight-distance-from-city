(function () {
  var location;
  var rotation;
  var ranges;
  var path;
  var projection = d3.geoOrthographic();

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
      coords: [-74.0060, 40.7128],
      rotation: [74, -40, 0]
    }
  };

  document.querySelector('select').addEventListener('change', updateLocation);

  function updateLocation(e) {
    location = airports[e.target.value].coords;
    rotation = airports[e.target.value].rotation;

    addDetails();
  }

  var svg = d3.select("svg");

  var map = svg.select('#map');

  map.append('path')
    .datum({ type: "Sphere" })
    .attr('fill', '#eee')
    .attr('stroke', '#111');

  map.append('path')
    .datum(d3.geoGraticule())
    .attr('fill', 'none')
    .attr('stroke', '#999');

  var countries = map.append('path')
    .attr('id', 'countries');

  d3.json('countries.geojson', function (err, json) {
    countries.datum(d3.geoStitch(json));
    addDetails();
    render();
  });

  location = [12.5683, 55.6761];
  rotation = [-10, -60, 0];

  var flightTimes = d3.csvParse(`name
16 hours
12 hours
6 hours
3 hours
2 hours
1 hour`);

  flightTimes.forEach(d => {
    var time = +d.name.split(' ')[0];
    var range = (545.267756 * time) - 189.306421;
    d.range = range;
    return d.l = range / (6371 * 0.62137) * 180 / Math.PI;
  });

  flightTimes = flightTimes.sort((a, b) => a - b);

  var hover = 0;

  var legends = svg.append('g')
    .attr('id', 'legend')
    .selectAll('g')
    .data(flightTimes.map(d => (d.properties = d, d)))
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(${[0, i * 20 + 60]})`)
    .on('mouseover click', d => {
      console.log(ranges);
      hover = d.properties.name;
      ranges.classed('hover', d => d.properties.name == hover);
      legends.classed('hover', d => d.properties.name == hover);
    });

  legends.append('rect')
    .attr('width', 250)
    .attr('height', 20)
    .attr('y', -15)

  var f = d3.formatLocale({ thousands: ",", grouping: [3] }).format(" >6,.2r");
  legends.append('text')
    .text(d => `${f(d.range)} miles - ${d.name}`)

  flightTimes = flightTimes.sort((a, b) => b.l - a.l)

  function addDetails() {
    d3.select('.ranges').transition(500).style('opacity', 0).remove();
    d3.select('.location').transition(500).style('opacity', 0).remove();

    ranges = map.append('g')
      .classed('ranges', true)
      .selectAll('path')
      .data(flightTimes.map(d => {
        var c = d3.geoCircle()
          .center(location)
          .radius(d.l)
          ();
        c.properties = d;
        return c;
      }))
      .enter()
      .append('path')
      .attr("id", (d, i) => "d" + i)

    map.append('path')
      .classed('location', true)
      .datum({ type: "Point", coordinates: location });

    if (projection.rotate) projection.rotate(rotation);
    projection.translate([550, 250]);
    path = d3.geoPath(projection);
  }

  // svg
  render = function () {
    var width = Math.min(960, window.innerWidth);
    var height = Math.min(600, window.innerHeight);
    var margin = 25;

    if (width < 400) {
      height += 100;
      margin = 10;
    }

    projection.fitExtent([[(width - height) / 2 - 2 * margin, margin * 2], [width - margin, height - margin]], {
      type: "Sphere"
    });
    svg.attr("width", width).attr("height", height);
    map.selectAll('path').attr('d', path);
  }

  d3.geoInertiaDrag(svg, render, projection);
  d3.interval(render, 500); // for window.resize
})();