export declare type FieldType = "ATTR" | "MODIFIED" | "PK";
export interface Table<T = {}> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;
    get: (id: string | number) => TableRecord<T>;
    getOrDefault: (id: string | number) => TableRecord<T> | null;
    getByFk: (fieldName: string, id: string | number) => TableRecordSet<T>;
    all(): TableRecord<T>[];
    filter: (callback: (record: TableRecord<T>) => boolean) => TableRecord<T>[];
    exists: (id: string | number) => boolean;
    index: (name: string, fk: string) => string[];
    value: (id: string | number) => T;
    upsert: (data: Partial<T> | Partial<T>[]) => TableRecord<T>;
    insert: (data: T | T[]) => TableRecord<T>;
    insertMany: (data: T | T[]) => TableRecord<T>[];
    update: (data: Partial<T> | Partial<T>[]) => TableRecord<T>;
    updateMany: (data: Partial<T> | Partial<T>[]) => TableRecord<T>[];
    delete: (id: string | number) => void;
}
export interface TableRecord<T = {}> {
    id: string;
    table: Table;
    value: T;
    update(data: T): TableRecord<T>;
    delete(): void;
}
export interface TableRecordSet<T> {
    value: T[];
    ids: string[];
    length: number;
    all(): TableRecord<T>[];
    add(data: T | T[]): void;
    remove(data: Partial<T>): void;
    update(data: Partial<T> | Partial<T>[]): TableRecordSet<T>;
    delete(): void;
    map<M>(callback: (record: TableRecord<T>) => M): M[];
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
    value?: (record: any, context?: ComputeContext) => any;
}
export interface ComputeContext {
    schema: FieldSchema;
    record?: TableRecord;
}
export interface DatabaseSchema {
    tables: TableSchema[];
    normalizeHooks?: {
        [key: string]: Normalizer;
    };
}
export interface DatabaseOptions {
    onNormalize?: {
        [key: string]: Normalizer;
    };
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
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: any;
    upsert(ctx: NormalizeContext): void;
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
    normalize(data: any, context: NormalizeContext): any[];
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    getPrimaryKey(record: any): any;
    getForeignKeys(record: any): {
        name: string;
        value: any;
        refTable: TableSchema | undefined;
        unique: boolean;
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
    readonly isPrimaryKey: boolean;
    readonly isForeignKey: boolean;
    refTable?: TableSchema;
    private _valueFactory?;
    constructor(table: TableSchema, name: string, schema: FieldDDL);
    getValue(data: any, record?: TableRecord): any;
    getRecordValue(record: TableRecord): any;
}
