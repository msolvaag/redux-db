"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var errors_1 = tslib_1.__importDefault(require("./errors"));
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
    if (obj === undefined || obj == null)
        return [];
    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};
exports.isObject = function (value) {
    return value !== null && !Array.isArray(value) && typeof value === "object";
};
exports.isPlainObject = function (value) {
    if (exports.isObject(value)) {
        if (typeof Object.getPrototypeOf === "function") {
            var proto = Object.getPrototypeOf(value);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(value) === "[object Object]";
    }
    return false;
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
    var props = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        props[_i - 2] = arguments[_i];
    }
    if (!value || !exports.isObject(value))
        throw new Error(errors_1.default.argument(name, "object"));
    if (props) {
        var missing = props.filter(function (p) { return value[p] === undefined; });
        if (missing.length)
            throw new Error(errors_1.default.argumentShape(name, missing));
    }
    return value;
};
exports.ensureParamFunction = function (name, value) {
    if (!value || typeof value !== "function")
        throw new Error(errors_1.default.argument(name, "function"));
    return value;
};
function optionalParamString(name, val, fallback) {
    return val !== undefined
        ? exports.ensureParamString(name, val) : fallback;
}
exports.optionalParamString = optionalParamString;
exports.ensureID = function (id) {
    if (!exports.isValidID(id))
        throw new Error(errors_1.default.invalidId());
    return exports.asID(id);
};
// A valid id must be a non-empty string or a number.
exports.isValidID = function (id) {
    return id !== null
        && id !== undefined
        && ((typeof id === "string" && id.length > 0) || typeof id === "number");
};
// Ensures that the given id is a string
exports.asID = function (id) {
    return (typeof id === "string" ? id : id.toString());
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
            throw new Error(errors_1.default.uniqueConstraintViolation(second[i]));
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
