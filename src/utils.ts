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
};

export const toObject = <T>(a: T[], key: (a: T) => string) => {
    return a.reduce<Record<string, T>>((o, v) => { o[key(v)] = v; return o; }, {});
};

export const arrayMerge = (a: string[], b: string[]) => {
    var hash: { [key: string]: boolean } = {}, i;
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
export const isEqual = (a: any, b: any) => {

    if (a === b)
        return true;

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
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

const arrayIsShallowEqual = (a: any[], b: any[]) => {
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
