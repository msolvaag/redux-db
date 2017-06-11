export const toArray = (obj) => {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === 'object')
        return Object.keys(obj).map(key => obj[key]);
    else
        return [];
};
export const ensureArray = (obj) => {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};
export const toObject = (a, key) => {
    return a.reduce((o, v) => { o[key(v)] = v; return o; }, {});
};
export const isObject = (val) => {
    return val != null
        && typeof val === 'object'
        && Array.isArray(val) === false;
};
const isObjectObject = (o) => {
    return isObject(o)
        && Object.prototype.toString.call(o) === '[object Object]';
};
export const isPlainObject = (o) => {
    let ctor, prot;
    return isObjectObject(o)
        && typeof (ctor = o.constructor) !== "function"
        && isObjectObject(prot = ctor.prototype)
        && prot.hasOwnProperty("isPrototypeOf");
};
