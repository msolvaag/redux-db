"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("./schema");
var models_1 = require("./models");
exports.RecordSet = models_1.RecordSet;
var utils = require("./utils");
var defaultOptions = {};
exports.createDatabase = function (schema, options) {
    return new Database(schema, __assign({}, defaultOptions, options));
};
var Database = /** @class */ (function () {
    function Database(schema, options) {
        var _this = this;
        this.options = options;
        this.normalizeHooks = options.onNormalize || {};
        this.tables = Object.keys(schema).map(function (tableName) { return new schema_1.TableSchema(_this, tableName, schema[tableName]); });
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
            return _this.reduce(state, action, reducers);
        };
    };
    Database.prototype.reduce = function (state, action, reducers, arg) {
        var session = this.createSession(state);
        utils.ensureArray(reducers).forEach(function (reducer) {
            reducer(session.tables, action, arg);
        });
        return session.commit();
    };
    Database.prototype.createSession = function (state, options) {
        return new DatabaseSession(state, this, __assign({ readOnly: false }, options));
    };
    Database.prototype.selectTables = function (state) {
        var _this = this;
        var tableSchemas = Object.keys(state).map(function (tableName) {
            var tableSchema = _this.tables.filter(function (s) { return s.name === tableName; })[0];
            if (!tableSchema)
                throw new Error("Cloud not select table. The schema with name: " + tableName + " is not defined.");
            return tableSchema;
        });
        var partialSession = new DatabaseSession(state, { tables: tableSchemas }, { readOnly: true });
        return partialSession.tables;
    };
    Database.prototype.selectTable = function (tableState, schemaName) {
        var name = schemaName || tableState["name"];
        if (!name)
            throw new Error("Failed to select table. Could not identify table schema.");
        return this.selectTables((_a = {}, _a[name] = tableState, _a))[name];
        var _a;
    };
    return Database;
}());
exports.Database = Database;
var DatabaseSession = /** @class */ (function () {
    function DatabaseSession(state, schema, options) {
        if (state === void 0) { state = {}; }
        var _this = this;
        this.state = state;
        this.db = schema;
        this.options = options;
        this.tables = utils.toObject(schema.tables.map(function (t) { return new models_1.TableModel(_this, state[t.name], t); }), function (t) { return t.schema.name; });
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
exports.DatabaseSession = DatabaseSession;
