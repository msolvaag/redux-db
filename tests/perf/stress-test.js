"use strict";
exports.__esModule = true;
// tslint:disable:no-console
var lodash_1 = require("lodash");
var schema_1 = require("../schema");
var utils = require("./utils");
var NUM_POSTS = 1000;
var NUM_SAMPLES = 100;
var posts = lodash_1.range(0, NUM_POSTS).map(function (id) { return ({ id: id, body: "data" }); });
var samples = [];
lodash_1.range(0, NUM_SAMPLES).forEach(function () {
    var tstart = utils.timer();
    schema_1.session(function (_a) {
        var BlogPost = _a.BlogPost;
        return BlogPost.insert(posts);
    });
    var elapsed = utils.timer(tstart);
    samples.push(elapsed);
});
var average = lodash_1.sum(samples) / samples.length;
var median = utils.median(samples);
console.log("average insert: " + average);
console.log("insert median: " + median);
