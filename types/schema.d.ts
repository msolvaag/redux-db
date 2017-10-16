export declare type FieldType = "ATTR" | "MODIFIED" | "PK";
export interface Table<R extends TableRecord<T> = TableRecord, T = any> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;
    get(id: string | number): R;
    getOrDefault(id: string | number): R | null;
    getByFk(fieldName: string, id: string | number): TableRecordSet<R, T>;
    all(): R[];
    filter(callback: (record: R) => boolean): R[];
    exists(id: string | number): boolean;
    index(name: string, fk: string): string[];
    value(id: string | number): T;
    upsert(data: Partial<T> | Partial<T>[]): R;
    insert(data: T | T[]): R;
    insertMany(data: T | T[]): R[];
    update(data: Partial<T> | Partial<T>[]): R;
    updateMany(data: Partial<T> | Partial<T>[]): R[];
    delete(id: string | number): boolean;
    deleteAll(): void;
    upsertNormalized(table: TableState<T>): void;
}
export interface TableRecord<T = any> {
    id: string;
    table: Table;
    value: T;
    update(data: Partial<T>): TableRecord<T>;
    delete(): void;
}
export interface TableRecordSet<R extends TableRecord<T>, T> {
    value: T[];
    ids: string[];
    length: number;
    all(): R[];
    add(data: T | T[]): void;
    remove(data: Partial<T>): void;
    update(data: Partial<T> | Partial<T>[]): TableRecordSet<R, T>;
    delete(): void;
    map<M>(callback: (record: R) => M): M[];
}
export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export interface FieldDDL {
    type?: FieldType;
    propName?: string;
    references?: string;
    relationName?: string;
    cascade?: boolean;
    unique?: boolean;
    notNull?: boolean;
    value?: <T, V>(record: T, context?: ComputeContext<T>) => V;
}
export interface ComputeContext<T> {
    schema: FieldSchema;
    record?: TableRecord<T>;
}
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks?: {
        [key: string]: Normalizer;
    };
}
export interface DatabaseOptions {
    onNormalize?: {
        [key: string]: Normalizer;
    };
    cascadeAsDefault?: boolean;
}
export interface SessionOptions {
    readOnly: boolean;
}
export interface DatabaseState {
    [key: string]: TableState;
}
export interface TableState<T = any> {
    name?: string;
    byId: {
        [key: string]: T;
    };
    ids: string[];
    indexes: TableIndex;
}
export interface TableIndex {
    [key: string]: {
        unique: boolean;
        values: {
            [key: string]: string[];
        };
    };
}
export interface RecordState {
    id: string;
    state: any;
}
export interface Normalizer {
    (record: any, context: NormalizeContext): any;
}
export interface Schema {
    name: string;
    getPrimaryKey: (state: any) => string;
}
export interface TableMap {
    [key: string]: Table;
}
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: TableMap;
    upsert(ctx: NormalizeContext): void;
    commit(): DatabaseState;
}
export interface NormalizedState {
    [key: string]: {
        ids: string[];
        byId: {
            [key: string]: any;
        };
        indexes: TableIndex;
    };
}
export declare class NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState;
    emits: {
        [key: string]: any[];
    };
    constructor(schema: TableSchema);
    emit(tableName: string, record: any): void;
}
export declare class TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];
    relations: FieldSchema[];
    readonly fieldsByName: {
        [key: string]: FieldSchema;
    };
    private _primaryKeyFields;
    private _foreignKeyFields;
    private _stampFields;
    constructor(db: DatabaseSchema, name: string, schema: TableDDL);
    connect(schemas: TableSchema[]): void;
    normalize(data: any, context: NormalizeContext): string[];
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    getPrimaryKey(record: any): string;
    getForeignKeys(record: any): {
        name: string;
        value: any;
        refTable: TableSchema | undefined;
        unique: boolean;
        notNull: boolean;
    }[];
    isModified(x: any, y: any): boolean;
}
export declare class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly propName: string;
    readonly type: FieldType;
    readonly references?: string;
    readonly relationName?: string;
    readonly cascade: boolean;
    readonly unique: boolean;
    readonly notNull: boolean;
    readonly isPrimaryKey: boolean;
    readonly isForeignKey: boolean;
    refTable?: TableSchema;
    private _valueFactory?;
    constructor(table: TableSchema, name: string, schema: FieldDDL, cascadeAsDefault: boolean);
    getValue(data: any, record?: any): any;
    getRecordValue(record: {
        value: any;
    }): any;
}
