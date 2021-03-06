import errors from "./errors";

export const toArray = (obj: any) => {
    if (!obj)
        return [];

    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === "object")
        return Object.keys(obj).map(key => obj[key]);
    else
        return [];
};

export const ensureArray = (obj: any) => {
    if (obj === undefined || obj == null)
        return [];

    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};

export const isObject = (value: any) => {
    return value !== null && !Array.isArray(value) && typeof value === "object";
};

export const isPlainObject = (value: any) => {
    if (isObject(value)) {
        if (typeof Object.getPrototypeOf === "function") {
            const proto = Object.getPrototypeOf(value);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(value) === "[object Object]";
    }
    return false;
};

export const ensureParam = <T= any>(name: string, value: T) => {
    if (value === undefined)
        throw new Error(errors.argument(name, "value"));
    return value;
};

export const ensureParamString = (name: string, value: any) => {
    if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
        throw new Error(errors.argument(name, "string"));
    return value;
};

export const ensureParamObject = (name: string, value: any, ...props: string[]) => {
    if (!value || !isObject(value))
        throw new Error(errors.argument(name, "object"));
    if (props) {
        const missing = props.filter(p => value[p] === undefined);
        if (missing.length)
            throw new Error(errors.argumentShape(name, missing));
    }
    return value;
};

export const ensureParamFunction = (name: string, value: any) => {
    if (!value || typeof value !== "function")
        throw new Error(errors.argument(name, "function"));
    return value as Function;
};

export function optionalParamString(name: string, val: any, fallback: string): string;
export function optionalParamString(name: string, val: any): string | undefined;
export function optionalParamString(name: string, val: any, fallback?: string) {
    return val !== undefined
        ? ensureParamString(name, val) : fallback;
}

export const ensureID = (id: any) => {
    if (!isValidID(id))
        throw new Error(errors.invalidId());
    return asID(id);
};

// A valid id must be a non-empty string or a number.
export const isValidID = (id: any) => {
    return id !== null
        && id !== undefined
        && ((typeof id === "string" && id.length > 0) || typeof id === "number");
};

// Ensures that the given id is a string
export const asID = (id: any) => {
    return (typeof id === "string" ? id : id.toString()) as string;
};

export const toObject = <T>(a: T[], key: (a: T) => string) => {
    return a.reduce<Record<string, T>>((o, v) => { o[key(v)] = v; return o; }, {});
};

export const mergeIds = (source: string[], second: string[], unique: boolean) => {
    const hash: { [key: string]: boolean } = {};
    let i;
    for (i = 0; i < source.length; i++)
        hash[source[i]] = true;

    for (i = 0; i < second.length; i++) {
        if (unique && hash[second[i]])
            throw new Error(errors.uniqueConstraintViolation(second[i]));
        hash[second[i]] = true;
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
    const len = aKeys.length;

    if (bKeys.length !== len)
        return false;

    for (let i = 0; i < len; i++) {
        const key = aKeys[i];

        if (Array.isArray(a[key]) && Array.isArray(b[key]) && arrayIsShallowEqual(a[key], b[key]))
            continue;

        if (a[key] !== b[key])
            return false;
    }

    return true;
};

const arrayIsShallowEqual = (a: any[], b: any[]) => {
    if (a === b)
        return true;

    const len = a.length;

    if (b.length !== len)
        return false;

    for (let i = 0; i < len; i++)
        if (a[i] !== b[i])
            return false;

    return true;
};
