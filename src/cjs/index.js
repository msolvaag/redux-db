"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("./schema");
const models_1 = require("./models");
exports.Record = models_1.RecordModel;
exports.RecordSet = models_1.RecordSet;
exports.Table = models_1.TableModel;
const utils = require("./utils");
const defaultOptions = {};
exports.createDatabase = (schema, options) => {
    return new Database(schema, options || defaultOptions);
};
class Database {
    constructor(schema, options) {
        this._cache = {};
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
    createSession(state, options) {
        return new DatabaseSession(state, this, options || { readOnly: false });
    }
    createSelector(dbName, selector) {
        return (state, props) => {
            const session = this.createSession(state[dbName], { readOnly: true });
            return selector(session.tables, props);
        };
    }
    cache(key, valueFn) {
        return (this._cache[key] || (valueFn && (this._cache[key] = valueFn())));
    }
    clearCache(key) {
        delete this._cache[key];
    }
}
exports.Database = Database;
class DatabaseSession {
    constructor(state = {}, schema, options) {
        this.state = state;
        this.db = schema;
        this.options = options;
        this.tables = utils.toObject(schema.tables.map(t => new models_1.TableModel(this, state[t.name], t)), t => t.schema.name);
    }
    upsert(state, from) {
        if (this.options.readOnly)
            throw new Error("Invalid attempt to alter a readonly session.");
        Object.keys(state).forEach(name => {
            if (!from || name !== from.schema.name) {
                this.tables[name].upsertNormalized(state[name]);
            }
        });
    }
    commit() {
        if (this.options.readOnly)
            throw new Error("Invalid attempt to alter a readonly session.");
        Object.keys(this.tables).forEach(table => {
            const oldState = this.state[table];
            const newState = this.tables[table].state;
            if (oldState !== newState)
                this.state = Object.assign({}, this.state, { [table]: newState });
        });
        return this.state;
    }
}
exports.DatabaseSession = DatabaseSession;
