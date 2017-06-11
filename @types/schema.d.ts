export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface FieldDDL {
    type?: FieldType;
    constraint?: ConstraintType;
    references?: string;
    relationName?: string;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export declare type ConstraintType = "PK" | "FK" | "NONE";
export declare type FieldType = "string" | "number" | "any";
export interface DatabaseSchema {
    name: string;
    tables: TableSchema[];
}
export interface DatabaseState {
    [key: string]: TableState;
}
export interface TableState {
    byId: {
        [key: string]: any;
    };
    ids: string[];
}
export interface RecordState {
    id: string;
    state: any;
}
export interface Schema {
    name: string;
    getPrimaryKey: (state: any) => string;
}
export interface Session {
    name: string;
    state: DatabaseState;
}
export interface NormalizedState {
    [key: string]: {
        ids: string[];
        byId: {
            [key: string]: any;
        };
    };
}
export declare class TableSchema {
    readonly name: string;
    readonly fields: FieldSchema[];
    relations: FieldSchema[];
    private _primaryKeyFields;
    private _foreignKeyFields;
    constructor(name: string, schema: TableDDL);
    connect(schemas: TableSchema[]): void;
    normalize(data: any, output?: NormalizedState): NormalizedState;
    getPrimaryKey(record: any): string;
}
export declare class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly type: FieldType;
    readonly constraint: ConstraintType;
    readonly references?: string;
    readonly relationName?: string;
    constructor(table: TableSchema, name: string, schema: FieldDDL);
}
