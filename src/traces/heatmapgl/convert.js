/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createHeatmap2D = require('gl-heatmap2d');

var maxRowLength = require('../heatmap/max_row_length');
var str2RGBArray = require('../../lib/str2rgbarray');

var AXES = ['xaxis', 'yaxis'];


function Heatmap(scene, uid) {
    this.scene = scene;
    this.uid = uid;

    this.name = '';
    this.hoverinfo = 'all';

    this.xData = [];
    this.yData = [];
    this.zData = [];
    this.textLabels = [];

    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.options = {
        z: [],
        x: [],
        y: [],
        shape: [0, 0],
        colorLevels: [0],
        colorValues: [0, 0, 0, 1]
    };

    this.heatmap = createHeatmap2D(scene.glplot, this.options);
    this.heatmap._trace = this;
}

var proto = Heatmap.prototype;

proto.handlePick = function(pickResult) {
    var index = this.idToIndex[pickResult.pointId];

//     console.log(pickResult.pointId)

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            this.xData[index],
            this.yData[index]
        ],
        textLabel: Array.isArray(this.textLabels) ?
            this.textLabels[index] :
            this.textLabels,
        color: Array.isArray(this.color) ?
            this.color[index] :
            this.color,
        name: this.name,
        hoverinfo: this.hoverinfo
    };
};

proto.update = function(fullTrace, calcTrace) {
    var calcPt = calcTrace[0];

    this.textLabels = fullTrace.text;
    this.name = fullTrace.name;
    this.hoverinfo = fullTrace.hoverinfo;

    // convert z from 2D -> 1D
    var z = calcPt.z;
    this.options.z = [].concat.apply([], z);

    var rowLen = z[0].length,
        colLen = z.length;
    this.options.shape = [rowLen, colLen];

    // don't use calc'ed bricks
    // maybe use xa.makeCalcdata() ???
    var x = fullTrace.x;
    if(x) {
        this.options.x = x;
        this.bounds[0] = x[0];
        this.bounds[2] = x[rowLen - 1];
    }
    else {
        this.options.x = null;
        this.bounds[0] = 0;
        this.bounds[2] = rowLen
    }

    var y = fullTrace.y;
    if(y) {
        this.options.y = y;
        this.bounds[1] = y[0];
        this.bounds[3] = y[colLen - 1];
    }
    else {
        this.options.y = null;
        this.bounds[1] = 0;
        this.bounds[3] = colLen
    }

    var colorOptions = convertColorscale(fullTrace);
    this.options.colorLevels = colorOptions.colorLevels;
    this.options.colorValues = colorOptions.colorValues;

    this.heatmap.update(this.options);
};

proto.dispose = function() {
    this.heatmap.dispose();
};

function convertColorscale(fullTrace) {
    var scl = fullTrace.colorscale,
        zmin = fullTrace.zmin,
        zmax = fullTrace.zmax;

    var N = scl.length,
        domain = new Array(N),
        range = new Array(4 * N);

    for(var i = 0; i < N; i++) {
        var si = scl[i];
        var color = str2RGBArray(si[1]);

        domain[i] = zmin + si[0] * (zmax - zmin);

        for(var j = 0; j < 4; j++) {
            range[(4 * i) + j] = color[j];
        }
    }

    return {
        colorLevels: domain,
        colorValues: range
    };
}

function createHeatmap(scene, fullTrace, calcTrace) {
    var plot = new Heatmap(scene, fullTrace.uid);
    plot.update(fullTrace, calcTrace);
    return plot;
}

module.exports = createHeatmap;
