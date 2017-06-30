var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { TableSchema } from "./schema";
import { RecordModel, RecordSet, TableModel } from "./models";
import * as utils from "./utils";
var defaultOptions = {};
export var createDatabase = function (schema, options) {
    return new Database(schema, __assign({}, defaultOptions, options));
};
var Database = (function () {
    function Database(schema, options) {
        var _this = this;
        this._cache = {};
        this.options = options;
        this.normalizeHooks = options.onNormalize || {};
        this.tables = Object.keys(schema).map(function (tableName) { return new TableSchema(_this, tableName, schema[tableName]); });
        this.tables.forEach(function (table) { return table.connect(_this.tables); });
    }
    Database.prototype.combineReducers = function () {
        var _this = this;
        var reducers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            reducers[_i] = arguments[_i];
        }
        return function (state, action) {
            if (state === void 0) { state = {}; }
            var session = _this.createSession(state);
            reducers.forEach(function (reducer) {
                reducer(session.tables, action);
            });
            return session.commit();
        };
    };
    Database.prototype.createSession = function (state, options) {
        return new DatabaseSession(state, this, __assign({ readOnly: false }, options));
    };
    Database.prototype.cache = function (key, valueFn) {
        return (this._cache[key] || (valueFn && (this._cache[key] = valueFn())));
    };
    Database.prototype.clearCache = function (key) {
        delete this._cache[key];
    };
    return Database;
}());
export { Database };
var DatabaseSession = (function () {
    function DatabaseSession(state, schema, options) {
        if (state === void 0) { state = {}; }
        var _this = this;
        this.state = state;
        this.db = schema;
        this.options = options;
        this.tables = utils.toObject(schema.tables.map(function (t) { return new TableModel(_this, state[t.name], t); }), function (t) { return t.schema.name; });
    }
    DatabaseSession.prototype.upsert = function (ctx) {
        var _this = this;
        if (this.options.readOnly)
            throw new Error("Invalid attempt to alter a readonly session.");
        Object.keys(ctx.output).forEach(function (name) {
            if (name !== ctx.schema.name) {
                _this.tables[name].upsertNormalized(ctx.output[name]);
            }
        });
        Object.keys(ctx.emits).forEach(function (name) {
            if (name !== ctx.schema.name) {
                _this.tables[name].upsert(ctx.emits[name]);
            }
        });
    };
    DatabaseSession.prototype.commit = function () {
        var _this = this;
        if (this.options.readOnly)
            throw new Error("Invalid attempt to alter a readonly session.");
        Object.keys(this.tables).forEach(function (table) {
            var oldState = _this.state[table];
            var newState = _this.tables[table].state;
            if (oldState !== newState)
                _this.state = __assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
            var _a;
        });
        return this.state;
    };
    return DatabaseSession;
}());
export { DatabaseSession };
export { RecordModel as Record, RecordSet, TableModel as Table };
