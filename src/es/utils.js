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
export const arrayMerge = (a, b) => {
    var hash = {}, i;
    for (i = 0; i < a.length; i++) {
        hash[a[i]] = true;
    }
    for (i = 0; i < b.length; i++) {
        hash[b[i]] = true;
    }
    return Object.keys(hash);
};
