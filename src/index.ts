import { SchemaDDL, DatabaseSchema, FieldSchema, TableSchema } from "./schema";
import { SessionModel, RecordModel, RecordSet, TableModel } from "./models";

export interface Reducer {
    (session: SessionModel, action: any): void;
}

export const createDatabase = (name: string, schema: SchemaDDL) => {
    const tableSchemas = Object.keys(schema).map(tableName => {

        const tableDef = schema[tableName];
        const fields = Object.keys(tableDef.fields).map(fieldName => new FieldSchema(fieldName, tableDef[fieldName]));

        return new TableSchema(tableName, fields);
    });

    return new Database(name, tableSchemas);
};

const combineSchemaReducers = (db: Database, reducers: Reducer[]) => {
    return (state: any, action: any) => {

        const _state = state[db.name] || {};
        const session = new SessionModel(state, db);

        reducers.forEach(reducer => {
            reducer(session, action);
        });
    };
}

export class Database implements DatabaseSchema {
    name: string;
    tables: TableSchema[];

    constructor(name: string, tables: TableSchema[]) {
        this.name = name;
        this.tables = tables;
    }

    combineReducers(...reducers: Reducer[]) {
        return combineSchemaReducers(this, reducers);
    }
}


export { RecordModel as Record, RecordSet, TableModel as Table, combineSchemaReducers as combineReducers };
