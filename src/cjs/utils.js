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
exports.isObject = function (val) {
    return val != null
        && typeof val === 'object'
        && Array.isArray(val) === false;
};
var isObjectObject = function (o) {
    return exports.isObject(o)
        && Object.prototype.toString.call(o) === '[object Object]';
};
exports.isPlainObject = function (o) {
    var ctor, prot;
    return isObjectObject(o)
        && typeof (ctor = o.constructor) !== "function"
        && isObjectObject(prot = ctor.prototype)
        && prot.hasOwnProperty("isPrototypeOf");
};
