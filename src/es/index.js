import { TableSchema } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";
export const createDatabase = (name, schema) => {
    const tableSchemas = Object.keys(schema).map(tableName => new TableSchema(tableName, schema[tableName]));
    // connect
    tableSchemas.forEach(table => table.connect(tableSchemas));
    return new Database(name, tableSchemas);
};
const combineSchemaReducers = (db, reducers) => {
    return (state = {}, action) => {
        const session = db.createSession(state);
        reducers.forEach(reducer => {
            reducer(session, action);
        });
        return session.commit();
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
    createSession(state) {
        return new Session(state, this);
    }
}
export { RecordModel as Record, RecordSet, TableModel as Table, combineSchemaReducers as combineReducers, Session };
