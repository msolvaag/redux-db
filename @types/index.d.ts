import { SchemaDDL, DatabaseSchema, TableSchema, Table, DatabaseOptions, SessionOptions, Session, DatabaseState, NormalizedState } from "./schema";
import { RecordModel, RecordSet, TableModel } from "./models";
export interface Reducer {
    (session: any, action: any): void;
}
export declare const createDatabase: (schema: SchemaDDL, options?: DatabaseOptions | undefined) => Database;
export declare class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    private _cache;
    constructor(schema: SchemaDDL, options: DatabaseOptions);
    combineReducers(...reducers: Reducer[]): (state: any, action: any) => any;
    createSession(state: any, options?: SessionOptions): DatabaseSession;
    createSelector(dbName: string, selector: (session: any, props: any) => any): (state: any, props: any) => any;
    cache<T>(key: string, valueFn?: () => T): T;
    clearCache(key: string): void;
}
export declare class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: any;
    state: DatabaseState;
    options: SessionOptions;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema, options: SessionOptions);
    upsert(state: NormalizedState, from?: Table): void;
    commit(): any;
}
export { RecordModel as Record, RecordSet, TableModel as Table };
