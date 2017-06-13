import { SchemaDDL, DatabaseSchema, FieldSchema, TableSchema, DatabaseOptions } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";

export interface Reducer {
    (session: any, action: any): void;
}

const defaultOptions = {
};

export const createDatabase = (schema: SchemaDDL, options?: DatabaseOptions) => {
    return new Database(schema, options || defaultOptions);
};

export class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;

    constructor(schema: SchemaDDL, options: DatabaseOptions) {
        this.options = options;
        this.tables = Object.keys(schema).map(tableName => new TableSchema(tableName, schema[tableName]));
        this.tables.forEach(table => table.connect(this.tables));
    }

    combineReducers(...reducers: Reducer[]) {
        return (state: any = {}, action: any) => {
            const session = this.createSession(state);

            reducers.forEach(reducer => {
                reducer(session.tables, action);
            });

            return session.commit();
        };
    }

    createSession(state: any) {
        return new Session(state, this);
    }
}

export { RecordModel as Record, RecordSet, TableModel as Table };
