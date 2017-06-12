import { SchemaDDL, DatabaseSchema, FieldSchema, TableSchema } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";

export interface Reducer {
    (session: any, action: any): void;
}

export const createDatabase = (name: string, schema: SchemaDDL) => {
    const tableSchemas = Object.keys(schema).map(tableName => new TableSchema(tableName, schema[tableName]));

    // connect
    tableSchemas.forEach(table => table.connect(tableSchemas));

    return new Database(name, tableSchemas);
};

const combineSchemaReducers = (db: Database, reducers: Reducer[]) => {
    return (state: any = {}, action: any) => {
        const session = db.createSession(state);

        reducers.forEach(reducer => {
            reducer(session.tables, action);
        });

        return session.commit();
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

    createSession(state: any) {
        return new Session(state, this);
    }
}

export { RecordModel as Record, RecordSet, TableModel as Table, combineSchemaReducers as combineReducers };
