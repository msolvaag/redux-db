import { SchemaDDL, DatabaseSchema, TableSchema, Table, TableRecord, TableRecordSet, DatabaseOptions, SessionOptions, Session, ModelFactory, TableMap, DatabaseState, NormalizeContext, Normalizer, MissingKeyHook, Reducer, FieldType } from "./def";
import { DefaultModelFactory } from "./factory";
export * from "./models";
export declare const createDatabase: (schema: SchemaDDL, options?: DatabaseOptions | undefined) => Database;
export declare class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks: {
        [key: string]: Normalizer;
    };
    onMissingPk?: MissingKeyHook;
    factory: ModelFactory;
    constructor(schema: SchemaDDL, options?: DatabaseOptions);
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
    static Partial<T extends TableMap = any>(state: any, tableSchemas: TableSchema[], db: Database): T;
}
export { Table, TableRecord, TableRecordSet, TableMap, Reducer, SchemaDDL as Schema, DefaultModelFactory, FieldType };
