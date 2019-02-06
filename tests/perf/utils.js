"use strict";
exports.__esModule = true;
exports.timer = function (start) {
    if (!start)
        return process.hrtime();
    var end = process.hrtime(start);
    return Math.round((end[0] * 1000) + (end[1] / 1000000));
};
exports.median = function (numbers) {
    var sorted = numbers.slice().sort();
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0)
        return (sorted[middle - 1] + sorted[middle]) / 2;
    return sorted[middle];
};
