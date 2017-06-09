import { FieldSchema, TableSchema } from "./schema";
import { SessionModel, RecordModel, RecordSet, TableModel } from "./models";
export const createDatabase = (name, schema) => {
    const tableSchemas = Object.keys(schema).map(tableName => {
        const tableDef = schema[tableName];
        const fields = Object.keys(tableDef.fields).map(fieldName => new FieldSchema(fieldName, tableDef[fieldName]));
        return new TableSchema(tableName, fields);
    });
    return new Database(name, tableSchemas);
};
const combineSchemaReducers = (db, reducers) => {
    return (state, action) => {
        const _state = state[db.name] || {};
        const session = new SessionModel(state, db);
        reducers.forEach(reducer => {
            reducer(session, action);
        });
    };
};
export class Database {
    constructor(name, tables) {
        this.name = name;
        this.tables = tables;
    }
    combineReducers(...reducers) {
        return combineSchemaReducers(this, reducers);
    }
}
export { RecordModel as Record, RecordSet, TableModel as Table, combineSchemaReducers as combineReducers };
