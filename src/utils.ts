export const toArray = (obj: any) => {
    if (!obj)
        return [];

    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === 'object')
        return Object.keys(obj).map(key => obj[key]);
    else
        return [];
};

export const ensureArray = (obj: any) => {
    if (!obj)
        return [];

    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
}

export const toObject = <T>(a: T[], key: (a: T) => string) => {
    return a.reduce<Record<string, T>>((o, v) => { o[key(v)] = v; return o; }, {});
}


export const isObject = (val: any) => {
    return val != null
        && typeof val === 'object'
        && Array.isArray(val) === false;
};

const isObjectObject = (o: any) => {
    return isObject(o)
        && Object.prototype.toString.call(o) === '[object Object]';
}

export const isPlainObject = (o: any) => {
    let ctor, prot;
    return isObjectObject(o)
        && typeof (ctor = o.constructor) !== "function"
        && isObjectObject(prot = ctor.prototype)
        && prot.hasOwnProperty("isPrototypeOf");
};