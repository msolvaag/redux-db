import { SchemaDDL, DatabaseSchema, TableSchema, DatabaseOptions, SessionOptions, Session, DatabaseState, NormalizeContext, Normalizer } from "./schema";
import { RecordModel, RecordSet, TableModel } from "./models";
export interface Reducer {
    (session: any, action: any): void;
}
export declare const createDatabase: (schema: SchemaDDL, options?: DatabaseOptions | undefined) => Database;
export declare class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks: {
        [key: string]: Normalizer;
    };
    private _cache;
    constructor(schema: SchemaDDL, options: DatabaseOptions);
    combineReducers(...reducers: Reducer[]): (state: any, action: any) => any;
    createSession(state: any, options?: SessionOptions): DatabaseSession;
    selectTables(state: DatabaseState): any;
    selectTable(name: string, tableState: any): any;
    cache<T>(key: string, valueFn?: () => T): T;
    clearCache(key: string): void;
}
export declare class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: any;
    state: DatabaseState;
    options: SessionOptions;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema, options: SessionOptions);
    upsert(ctx: NormalizeContext): void;
    commit(): any;
}
export { RecordModel as Record, RecordSet, TableModel as Table };
