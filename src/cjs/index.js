"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("./schema");
const models_1 = require("./models");
exports.Record = models_1.RecordModel;
exports.RecordSet = models_1.RecordSet;
exports.Table = models_1.TableModel;
const defaultOptions = {};
exports.createDatabase = (schema, options) => {
    return new Database(schema, options || defaultOptions);
};
class Database {
    constructor(schema, options) {
        this.options = options;
        this.tables = Object.keys(schema).map(tableName => new schema_1.TableSchema(tableName, schema[tableName]));
        this.tables.forEach(table => table.connect(this.tables));
    }
    combineReducers(...reducers) {
        return (state = {}, action) => {
            const session = this.createSession(state);
            reducers.forEach(reducer => {
                reducer(session.tables, action);
            });
            return session.commit();
        };
    }
    createSession(state) {
        return new models_1.Session(state, this);
    }
}
exports.Database = Database;
