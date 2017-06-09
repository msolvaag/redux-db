import { Session } from "./session";

export interface SchemaDDL {
    [key: string]: TableDDL;
}

export interface FieldDDL {
    type?: FieldType,
    constraint?: ConstraintType;
    references?: string;
    relationName?: string;
}

export interface TableDDL {
    [key: string]: FieldDDL;
}

const PK = "PK", FK = "FK", NONE = "NONE";

export type ConstraintType = "PK" | "FK" | "NONE";
export type FieldType = "string" | "number" | "any";

export interface RelationLookup {
    [key: string]: FieldSchema;
}

export interface DatabaseSchema {
    name: string;
    tables: TableSchema[];
}

export class TableSchema {
    readonly name: string;
    readonly fields: FieldSchema[];

    private _relations: FieldSchema[] = [];
    private _primaryKeyFields: string[];
    private _foreignKeyFields: string[];

    constructor(name: string, schema: TableDDL) {
        this.name = name;
        this.fields = Object.keys(schema.fields).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));

        this._primaryKeyFields = this.fields.filter(f => f.constraint === PK).map(f => f.name);
        this._foreignKeyFields = this.fields.filter(f => f.constraint === FK).map(f => f.name);
    }

    connect(schemas: TableSchema[]) {
        schemas.forEach(schema => {
            this._relations = this._relations.concat(schema.fields.filter(f => f.references === this.name));
        })
    }

    normalize(data: any) {

        return data;
    }

    getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        const pk = lookup.reduce((p, n) => {
            const k = record[n];
            return p && k ? (p + "_" + k) : k;
        });

        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of \"${this.name}\".`);

        return pk;
    }
}

export class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;

    readonly type: FieldType;
    readonly constraint: ConstraintType;

    readonly references?: string;
    readonly relationName?: string;

    constructor(table: TableSchema, name: string, schema: FieldDDL) {
        this.table = table;
        this.name = name;
        this.type = schema.type || "any";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
    }

    getValue(session: Session) {
        return session.tables[this.table.name][this.name];
    }

    setValue(session: Session, value: any) {

    }
}