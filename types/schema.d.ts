import { DatabaseSchema, TableSchema, FieldSchema, TableDDL, FieldDDL, TableRecord, NormalizeContext, FieldType } from "./def";
export declare class TableSchemaModel implements TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];
    private _relations;
    private _primaryKeyFields;
    private _foreignKeyFields;
    private _stampFields;
    constructor(db: DatabaseSchema, name: string, schema: TableDDL);
    readonly relations: FieldSchema[];
    connect(schemas: TableSchema[]): void;
    normalize(data: any, context: NormalizeContext): string[];
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    injectKeys(data: any, record: TableRecord): any;
    getPrimaryKey(record: any): string;
    private _getPrimaryKey(record);
    private _normalizePrimaryKey(record);
    getForeignKeys(record: any): {
        name: string;
        value: any;
        refTable: TableSchema | undefined;
        unique: boolean;
        notNull: boolean;
    }[];
    isModified(x: any, y: any): boolean;
}
export declare class FieldSchemaModel implements FieldSchema {
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
    private _refTable?;
    private _valueFactory?;
    constructor(table: TableSchema, name: string, schema: FieldDDL, cascadeAsDefault: boolean);
    readonly refTable: TableSchema | undefined;
    connect(schemas: TableSchema[]): void;
    getValue(data: any, record?: any): any;
    getRecordValue(record: {
        value: any;
    }): any;
}
