import { SchemaDDL, DatabaseSchema, TableSchema, DatabaseOptions } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";
export interface Reducer {
    (session: any, action: any): void;
}
export declare const createDatabase: (schema: SchemaDDL, options?: DatabaseOptions | undefined) => Database;
export declare class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    constructor(schema: SchemaDDL, options: DatabaseOptions);
    combineReducers(...reducers: Reducer[]): (state: any, action: any) => any;
    createSession(state: any): Session;
}
export { RecordModel as Record, RecordSet, TableModel as Table };
