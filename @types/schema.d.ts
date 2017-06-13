export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface FieldDDL {
    type?: FieldType;
    constraint?: ConstraintType;
    references?: string;
    relationName?: string;
    name?: string;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export declare type ConstraintType = "PK" | "FK" | "NONE";
export declare type FieldType = "ATTR" | "MODIFIED";
export interface DatabaseSchema {
    tables: TableSchema[];
}
export interface DatabaseOptions {
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
    private _stampFields;
    constructor(name: string, schema: TableDDL);
    connect(schemas: TableSchema[]): void;
    normalize(data: any, output?: NormalizedState): NormalizedState;
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    getPrimaryKey(record: any): string;
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
    constructor(table: TableSchema, name: string, schema: FieldDDL);
}
