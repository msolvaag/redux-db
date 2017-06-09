"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("./schema");
var models_1 = require("./models");
exports.Record = models_1.RecordModel;
exports.RecordSet = models_1.RecordSet;
exports.Table = models_1.TableModel;
exports.createDatabase = function (name, schema) {
    var tableSchemas = Object.keys(schema).map(function (tableName) {
        var tableDef = schema[tableName];
        var fields = Object.keys(tableDef.fields).map(function (fieldName) { return new schema_1.FieldSchema(fieldName, tableDef[fieldName]); });
        return new schema_1.TableSchema(tableName, fields);
    });
    return new Database(name, tableSchemas);
};
var combineSchemaReducers = function (db, reducers) {
    return function (state, action) {
        var _state = state[db.name] || {};
        var session = new models_1.SessionModel(state, db);
        reducers.forEach(function (reducer) {
            reducer(session, action);
        });
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
    return Database;
}());
exports.Database = Database;
