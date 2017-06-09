
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

export type FieldType = "PK" | "FK" | "M2M" | "O2O";

export interface DatabaseSchema {
    name: string;
    tables: TableSchema[];
}

export class TableSchema {
    name: string;
    fields: FieldSchema[];

    constructor(name: string, fields: FieldSchema[]) {
        this.name = name;
        this.fields = fields;
    }
}

export class FieldSchema {
    name: string;
    type: FieldType;
    references?: string;
    relationName?: string;

    constructor(name: string, schema: FieldDDL) {
        this.name = name;
        this.type = schema.type;
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
}