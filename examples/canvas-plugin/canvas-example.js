// Copyright (c) 2015 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {PropTypes, Component} from 'react';
import MapGL, {autobind} from 'react-map-gl';

import Immutable from 'immutable';
import window from 'global/window';
import document from 'global/document';

// San Francisco
import SF_FEATURE from './../data/feature-example-sf.json';
import CITIES from './../data/cities.json';
const location = CITIES[0];

let canvas;
let context;
let width;
let height;
let emitter;
let points = [];
let numPoints = 100;
let gravity = 0.1;
let i;

function initPoint(p) {
  p.x = emitter.x;
  p.y = emitter.y;
  p.vx = Math.random() * 5 - 2;
  p.vy = Math.random() * -6 - 3;
  p.radius = Math.random() * 4 + 1;
}

function update() {
  var i, point, len = points.length;
  for(i = 0; i < len; i += 1) {
    point = points[i];
    point.vy += gravity;
    point.x += point.vx;
    point.y += point.vy;
    if(point.x > width ||
     point.x < 0 ||
     point.y > height ||
     point.y < 0) {
      initPoint(point);
    }
  }
}

function draw() {
  var i, point, len = points.length;
  context.clearRect(0, 0, width, height);
  for(i = 0; i < len; i += 1) {
    point = points[i];
    context.beginPath();
    context.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
    context.fillStyle = "#f00";
    context.fill();
  }
}

function loop() {
  window.requestAnimationFrame(loop);
  addPoint();
  update();
  draw();
}

function addPoint() {
  var point;
  if(points.length < numPoints) {
    point = {};
    initPoint(point);
    points.push(point);
  }
}

function buildStyle() {
  return Immutable.fromJS({
    version: 8,
    name: 'Example raster tile source',
    sources: {
      mapbox: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v6'
      },
      canvas: {
        type: 'canvas',
        canvas: 'canvas',
        coordinates: [
          [-81.490, 46.437],
          [-72.582, 46.437],
          [-72.582, 38.907],
          [-81.490, 38.907]
        ],
        dimensions: [0, 0, 400, 400]
      }
    },
    sprite: 'mapbox://sprites/mapbox/dark-v9',
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    "layers": [
      {
        "id": "background",
        "type": "background",
        "paint": {"background-color": "#111"}
      },
      {
        "id": "water",
        "source": "mapbox",
        "source-layer": "water",
        "type": "fill",
        "paint": {"fill-color": "#2c2c2c"}
      },
      {
        "id": "boundaries",
        "source": "mapbox",
        "source-layer": "admin",
        "type": "line",
        "paint": {"line-color": "#797979", "line-dasharray": [2, 2, 6, 2]},
        "filter": ["all", ["==", "maritime", 0]]
      },
      {
        "id": "canvas",
        "source": "canvas",
        "type": "raster",
        "paint": {"raster-opacity": 0.85}
      },
      {
        "id": "cities",
        "source": "mapbox",
        "source-layer": "place_label",
        "type": "symbol",
        "layout": {
          "text-field": "{name_en}",
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": {"stops": [[4, 9], [6, 12]]}
        },
        "paint": {
          "text-color": "#969696",
          "text-halo-width": 2,
          "text-halo-color": "rgba(0, 0, 0, 0.85)"
        }
      },
      {
        "id": "states",
        "source": "mapbox",
        "source-layer": "state_label",
        "type": "symbol",
        "layout": {
          "text-transform": "uppercase",
          "text-field": "{name_en}",
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-letter-spacing": 0.15,
          "text-max-width": 7,
          "text-size": {"stops": [[4, 10], [6, 14]]}
        },
        "filter": [">=", "area", 80000],
        "paint": {
          "text-color": "#969696",
          "text-halo-width": 2,
          "text-halo-color": "rgba(0, 0, 0, 0.85)"
        }
      }
    ]
  });
}

const propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};

export default class CanvasExmaple extends Component {

  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: 41.874,
        longitude: -75.789,
        zoom: 5,
        bearing: 180,
        pitch: 60,
        startDragLngLat: null,
        isDragging: false
      },
      mapStyle: buildStyle()
    };
    autobind(this);
  }

  componentDidMount() {
    canvas = this.canvas;
    width = canvas.width;
    height = canvas.height;
    context = canvas.getContext('2d');
    emitter = {
      x: width / 2,
      y: height
    };
    loop();
  }

  // componentWillMount() {
  //   const colors = ['red', 'green', 'blue'];
  //   let i = 0;
  //   window.setInterval(function interval() {
  //     this.setState({
  //       mapStyle: buildStyle({
  //         stroke: colors[i % colors.length],
  //         fill: colors[(i + 1) % colors.length]
  //       })
  //     });
  //     i = i + 1;
  //   }.bind(this), 2000);
  // }

  _onChangeViewport(opt) {
    this.setState({viewport: opt});
  }

  // @autobind
  // _onClickFeatures(features) {
  //   window.console.log(features);
  // }

  render() {
    const viewport = {
      // mapStyle: this.state.mapStyle,
      ...this.props,
      ...this.state.viewport,
      mapStyle: this.state.mapStyle
    };
    return (
      <div>
        <canvas
          id="canvas"
          ref={c => {
            this.canvas = c;
          }}
          width={400}
          height={400}
          style={{display: 'none'}} />
        <MapGL
          {...viewport}
          onChangeViewport={ this._onChangeViewport }
          onClickFeatures={ this._onClickFeatures }
          perspectiveEnabled={ true }
          // setting to `true` should cause the map to flicker because all
          // sources and layers need to be reloaded without diffing enabled.
          preventStyleDiffing={ false }/>
      </div>
    );
  }
}

CanvasExmaple.propTypes = propTypes;
