
export interface BoundModel<T extends BoundModel<T>> {
    all(): QuerySet<T>;

    get(id: string | number): T | null;
    exists(id: string | number): boolean;

    insert(model: any): T;
    upsert(model: any): T;
    delete(): void;

    model: any;
}

export interface QuerySet<T extends BoundModel<T>> {
    toArray(): T[];

    add(model: any): void;
    remove(model: any): void;
    delete(): void;
}

export interface SchemaDDL {
    [key: string]: TableDDL;
}

export interface FieldDDL {
    type: FieldType;
    references?: string;
}

export interface TableDDL {
    [key: string]: FieldDDL;
}

export type FieldType = "PK" | "FK" | "M2M" | "O2O";

export class DatabaseSchema {
    name: string;
    tables: TableSchema[];

    constructor(name: string, tables: TableSchema[]) {
        this.name = name;
        this.tables = tables;
    }
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

    constructor(name: string, schema: FieldDDL) {
        this.name = name;
        this.type = schema.type;
        this.references = schema.references;
    }
}