"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("./schema");
var models_1 = require("./models");
exports.Session = models_1.Session;
exports.Record = models_1.RecordModel;
exports.RecordSet = models_1.RecordSet;
exports.Table = models_1.TableModel;
exports.createDatabase = function (name, schema) {
    var tableSchemas = Object.keys(schema).map(function (tableName) { return new schema_1.TableSchema(tableName, schema[tableName]); });
    // connect
    tableSchemas.forEach(function (table) { return table.connect(tableSchemas); });
    return new Database(name, tableSchemas);
};
var combineSchemaReducers = function (db, reducers) {
    return function (state, action) {
        if (state === void 0) { state = {}; }
        var session = db.createSession(state);
        reducers.forEach(function (reducer) {
            reducer(session, action);
        });
        return session.commit();
    };
};
exports.combineReducers = combineSchemaReducers;
var Database = (function () {
    function Database(name, tables) {
        this.name = name;
        this.tables = tables;
    }
    Database.prototype.combineReducers = function () {
        var reducers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            reducers[_i] = arguments[_i];
        }
        return combineSchemaReducers(this, reducers);
    };
    Database.prototype.createSession = function (state) {
        return new models_1.Session(state, this);
    };
    return Database;
}());
exports.Database = Database;
