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
