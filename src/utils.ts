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

export const ensureParam = <T=any>(name: string, value: T) => {
    if (value === undefined)
        throw new Error(`Missing a valid value for the argument "${name}"`);
    return value;
};
export const ensureParamString = (name: string, value: any) => {
    if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
        throw new Error(`Missing a valid string for the argument "${name}"`);
    return value;
};

export const ensureID = (id: string | number) => {
    if (!isValidID(id))
        throw new Error(`The given value is not a valid "id". An "id" must be a non-empty string or a number.`);
    return asID(id);
};

// A valid id must be a non-empty string or a number.
export const isValidID = (id: any) => {
    return id !== null && id !== undefined && ((typeof id === "string" && id.length > 0) || typeof id === "number");
};

// Ensures that the given id is a string
export const asID = (id: string | number) => {
    return typeof id === "string" ? id : id.toString();
}

export const toObject = <T>(a: T[], key: (a: T) => string) => {
    return a.reduce<Record<string, T>>((o, v) => { o[key(v)] = v; return o; }, {});
};

export const mergeIds = (source: string[], second: string[], unique: boolean) => {
    const hash: { [key: string]: boolean } = {};
    let i;
    for (i = 0; i < source.length; i++) {
        hash[source[i]] = true;
    }
    for (i = 0; i < second.length; i++) {
        if (unique && hash[second[i]])
            throw new Error(`Id merge operation violates unique constraint for id: "${second[i]}"`);
        hash[second[i]] = true;
    }
    return Object.keys(hash);
};

// Compares two objects for simple equality. 
// Arrays are compared only at first level.
export const isEqual = (a: any, b: any) => {

    if (a === b)
        return true;

    const aKeys = Object.keys(a),
        bKeys = Object.keys(b),
        len = aKeys.length;

    if (bKeys.length !== len) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        const key = aKeys[i];

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

    const len = a.length;

    if (b.length !== len) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};