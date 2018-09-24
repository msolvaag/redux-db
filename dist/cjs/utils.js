"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
exports.toArray = function (obj) {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === "object")
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
exports.isObject = function (value) {
    return value !== null && !Array.isArray(value) && typeof value === "object";
};
exports.ensureParam = function (name, value) {
    if (value === undefined)
        throw new Error(errors_1.default.argument(name, "value"));
    return value;
};
exports.ensureParamString = function (name, value) {
    if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
        throw new Error(errors_1.default.argument(name, "string"));
    return value;
};
exports.ensureParamObject = function (name, value) {
    if (!value || !exports.isObject(value))
        throw new Error(errors_1.default.argument(name, "object"));
    return value;
};
exports.ensureID = function (id) {
    if (!exports.isValidID(id))
        throw new Error("The given value is not a valid \"id\". An \"id\" must be a non-empty string or a number.");
    return exports.asID(id);
};
// A valid id must be a non-empty string or a number.
exports.isValidID = function (id) {
    return id !== null && id !== undefined && ((typeof id === "string" && id.length > 0) || typeof id === "number");
};
// Ensures that the given id is a string
exports.asID = function (id) {
    return typeof id === "string" ? id : id.toString();
};
exports.toObject = function (a, key) {
    return a.reduce(function (o, v) { o[key(v)] = v; return o; }, {});
};
exports.mergeIds = function (source, second, unique) {
    var hash = {};
    var i;
    for (i = 0; i < source.length; i++)
        hash[source[i]] = true;
    for (i = 0; i < second.length; i++) {
        if (unique && hash[second[i]])
            throw new Error("Id merge operation violates unique constraint for id: \"" + second[i] + "\"");
        hash[second[i]] = true;
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
    if (bKeys.length !== len)
        return false;
    for (var i = 0; i < len; i++) {
        var key = aKeys[i];
        if (Array.isArray(a[key]) && Array.isArray(b[key]) && arrayIsShallowEqual(a[key], b[key]))
            continue;
        if (a[key] !== b[key])
            return false;
    }
    return true;
};
var arrayIsShallowEqual = function (a, b) {
    if (a === b)
        return true;
    var len = a.length;
    if (b.length !== len)
        return false;
    for (var i = 0; i < len; i++)
        if (a[i] !== b[i])
            return false;
    return true;
};
