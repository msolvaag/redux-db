"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = (obj) => {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === 'object')
        return Object.keys(obj).map(key => obj[key]);
    else
        return [];
};
exports.ensureArray = (obj) => {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};
exports.toObject = (a, key) => {
    return a.reduce((o, v) => { o[key(v)] = v; return o; }, {});
};
exports.isObject = (val) => {
    return val != null
        && typeof val === 'object'
        && Array.isArray(val) === false;
};
const isObjectObject = (o) => {
    return exports.isObject(o)
        && Object.prototype.toString.call(o) === '[object Object]';
};
exports.isPlainObject = (o) => {
    let ctor, prot;
    return isObjectObject(o)
        && typeof (ctor = o.constructor) !== "function"
        && isObjectObject(prot = ctor.prototype)
        && prot.hasOwnProperty("isPrototypeOf");
};
