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
