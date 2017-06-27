export interface Table {
    session: Session;
    schema: TableSchema;
    state: TableState;
    get: (id: string | number) => TableRecord;
    getOrDefault: (id: string | number) => TableRecord | null;
    all(): TableRecord[];
    filter: (callback: (record: TableRecord) => boolean) => TableRecord[];
    exists: (id: string | number) => boolean;
    index: (name: string, fk: string) => string[];
    value: (id: string | number) => any;
    upsert: (data: any) => TableRecord;
    insert: (data: any) => TableRecord;
    insertMany: (data: any) => TableRecord[];
    update: (data: any) => TableRecord;
    updateMany: (data: any) => TableRecord[];
    delete: (id: string | number) => void;
}
export interface TableRecord {
    id: string;
    table: Table;
    value: any;
    update(data: any): TableRecord;
    delete(): void;
}
export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface FieldDDL {
    type?: FieldType;
    constraint?: ConstraintType;
    references?: string;
    relationName?: string;
    propName?: string;
    value?: (record: any, context?: ComputeContext) => any;
}
export interface ComputeContext {
    schema: FieldSchema;
    record?: TableRecord;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export declare type ConstraintType = "PK" | "FK" | "NONE";
export declare type FieldType = "ATTR" | "MODIFIED";
export interface DatabaseSchema {
    tables: TableSchema[];
    cache<T>(key: string, valueFn?: () => T): T;
    clearCache(key: string): void;
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
export interface TableState {
    byId: {
        [key: string]: any;
    };
    ids: string[];
    indexes: {
        [key: string]: {
            [key: string]: string[];
        };
    };
}
export interface RecordState {
    id: string;
    state: any;
}
export interface Normalizer {
    (schema: TableSchema, record: any, context: NormalizedState): void;
}
export interface Schema {
    name: string;
    getPrimaryKey: (state: any) => string;
}
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: any;
    upsert(state: DatabaseState, from: Table): void;
}
export interface NormalizedState {
    [key: string]: {
        ids: string[];
        byId: {
            [key: string]: any;
        };
        indexes: {
            [key: string]: {
                [key: string]: string[];
            };
        };
    };
}
export declare class TableSchema {
    readonly name: string;
    readonly fields: FieldSchema[];
    relations: FieldSchema[];
    private _primaryKeyFields;
    private _foreignKeyFields;
    private _stampFields;
    private _normalizer;
    constructor(name: string, schema: TableDDL, normalizer?: Normalizer);
    connect(schemas: TableSchema[]): void;
    normalize(data: any, output?: NormalizedState): NormalizedState;
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    getPrimaryKey(record: any): string;
    getForeignKeys(record: any): {
        name: string;
        value: any;
    }[];
    isModified(x: any, y: any): boolean;
}
export declare class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly propName: string;
    readonly type: FieldType;
    readonly constraint: ConstraintType;
    readonly references?: string;
    readonly relationName?: string;
    private _valueFn?;
    constructor(table: TableSchema, name: string, schema: FieldDDL);
    getValue(data: any, record?: TableRecord): any;
    getRecordValue(record: TableRecord): any;
}
