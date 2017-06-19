"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = function (obj) {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === 'object')
        return Object.keys(obj).map(function (key) { return obj[key]; });
    else
        return [];
};
exports.ensureArray = function (obj) {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};
exports.toObject = function (a, key) {
    return a.reduce(function (o, v) { o[key(v)] = v; return o; }, {});
};
exports.arrayMerge = function (a, b) {
    var hash = {}, i;
    for (i = 0; i < a.length; i++) {
        hash[a[i]] = true;
    }
    for (i = 0; i < b.length; i++) {
        hash[b[i]] = true;
    }
    return Object.keys(hash);
};
