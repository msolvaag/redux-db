import { SchemaDDL, DatabaseSchema, TableSchema, Table, TableRecord, DatabaseOptions, SessionOptions, Session, TableMap, DatabaseState, NormalizeContext, Normalizer } from "./schema";
import { RecordSet } from "./models";
export interface Reducer {
    (session: any, action: any, arg?: any): void;
}
export declare const createDatabase: (schema: SchemaDDL, options?: DatabaseOptions | undefined) => Database;
export declare class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks: {
        [key: string]: Normalizer;
    };
    constructor(schema: SchemaDDL, options: DatabaseOptions);
    combineReducers(...reducers: Reducer[]): (state: any, action: any) => any;
    reduce(state: any, action: any, reducers: Reducer | Reducer[], arg?: any): any;
    createSession(state: any, options?: SessionOptions): DatabaseSession;
    selectTables<T extends TableMap = any>(state: any): T;
    selectTable<T extends Table = any>(tableState: any, schemaName?: string): T;
}
export declare class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: TableMap;
    state: DatabaseState;
    options: SessionOptions;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema, options: SessionOptions);
    upsert(ctx: NormalizeContext): void;
    commit(): any;
}
export { TableRecord as Record, RecordSet, Table, TableMap };
