export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface FieldDDL {
    type: FieldType;
    references?: string;
    relationName?: string;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export declare type FieldType = "PK" | "FK" | "M2M" | "O2O";
export interface DatabaseSchema {
    name: string;
    tables: TableSchema[];
}
export declare class TableSchema {
    name: string;
    fields: FieldSchema[];
    private _primaryKeyFields;
    private _foreignKeyFields;
    constructor(name: string, fields: FieldSchema[]);
    normalize(data: any): any;
    getPrimaryKey(record: any): string;
}
export declare class FieldSchema {
    name: string;
    type: FieldType;
    references?: string;
    relationName?: string;
    constructor(name: string, schema: FieldDDL);
}
