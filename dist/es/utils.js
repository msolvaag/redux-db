export var toArray = function (obj) {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else if (typeof obj === 'object')
        return Object.keys(obj).map(function (key) { return obj[key]; });
    else
        return [];
};
export var ensureArray = function (obj) {
    if (!obj)
        return [];
    if (Array.isArray(obj))
        return obj;
    else
        return [obj];
};
export var ensureParam = function (name, value) {
    if (value === undefined)
        throw new Error("Missing a valid value for the argument \"" + name + "\"");
    return value;
};
export var ensureParamString = function (name, value) {
    if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
        throw new Error("Missing a valid string for the argument \"" + name + "\"");
    return value;
};
export var ensureID = function (id) {
    if (!isValidID(id))
        throw new Error("The given value is not a valid \"id\". An \"id\" must be a non-empty string or a number.");
    return asID(id);
};
// A valid id must be a non-empty string or a number.
export var isValidID = function (id) {
    return id !== null && id !== undefined && ((typeof id === "string" && id.length > 0) || typeof id === "number");
};
// Ensures that the given id is a string
export var asID = function (id) {
    return typeof id === "string" ? id : id.toString();
};
export var toObject = function (a, key) {
    return a.reduce(function (o, v) { o[key(v)] = v; return o; }, {});
};
export var mergeIds = function (source, second, unique) {
    var hash = {};
    var i;
    for (i = 0; i < source.length; i++) {
        hash[source[i]] = true;
    }
    for (i = 0; i < second.length; i++) {
        if (unique && hash[second[i]])
            throw new Error("Id merge operation violates unique constraint for id: \"" + second[i] + "\"");
        hash[second[i]] = true;
    }
    return Object.keys(hash);
};
// Compares two objects for simple equality. 
// Arrays are compared only at first level.
export var isEqual = function (a, b) {
    if (a === b)
        return true;
    var aKeys = Object.keys(a), bKeys = Object.keys(b), len = aKeys.length;
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
var arrayIsShallowEqual = function (a, b) {
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
