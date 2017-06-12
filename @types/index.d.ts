import { SchemaDDL, DatabaseSchema, TableSchema } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";
export interface Reducer {
    (session: any, action: any): void;
}
export declare const createDatabase: (name: string, schema: SchemaDDL) => Database;
declare const combineSchemaReducers: (db: Database, reducers: Reducer[]) => (state: any, action: any) => any;
export declare class Database implements DatabaseSchema {
    name: string;
    tables: TableSchema[];
    constructor(name: string, tables: TableSchema[]);
    combineReducers(...reducers: Reducer[]): (state: any, action: any) => any;
    createSession(state: any): Session;
}
export { RecordModel as Record, RecordSet, TableModel as Table, combineSchemaReducers as combineReducers };
