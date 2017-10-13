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
exports.ensureParam = function (name, value) {
    if (value === undefined)
        throw new Error("Missing a valid value for the argument \"" + name + "\"");
    return value;
};
exports.ensureParamString = function (name, value) {
    if (value === undefined || value === null || value.length === 0)
        throw new Error("Missing a valid string for the argument \"" + name + "\"");
    return value;
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
// Compares two objects for simple equality. 
// Arrays are compared only at first level.
exports.isEqual = function (a, b) {
    if (a === b)
        return true;
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    var len = aKeys.length;
    if (bKeys.length !== len) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var key = aKeys[i];
        if (Array.isArray(a[key]) && Array.isArray(b[key]) && arrayIsShallowEqual(a[key], b[key]))
            continue;
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
};
var arrayIsShallowEqual = function (a, b) {
    if (a === b) {
        return true;
    }
    var len = a.length;
    if (b.length !== len) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};
