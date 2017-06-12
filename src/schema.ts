import * as utils from "./utils";

export interface SchemaDDL {
    [key: string]: TableDDL;
}

export interface FieldDDL {
    type?: FieldType,
    constraint?: ConstraintType;
    references?: string;
    relationName?: string;
    name?: string;
}

export interface TableDDL {
    [key: string]: FieldDDL;
}

const PK = "PK", FK = "FK", NONE = "NONE";

export type ConstraintType = "PK" | "FK" | "NONE";
export type FieldType = "string" | "number" | "any";

export interface DatabaseSchema {
    name: string;
    tables: TableSchema[];
}

export interface DatabaseState {
    [key: string]: TableState;
}

export interface TableState {
    byId: { [key: string]: any };
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
    [key: string]: { // schema name
        ids: string[],
        byId: {
            [key: string]: any
        }
    };
}

export class TableSchema {
    readonly name: string;
    readonly fields: FieldSchema[];

    relations: FieldSchema[] = [];
    private _primaryKeyFields: string[];
    private _foreignKeyFields: string[];

    constructor(name: string, schema: TableDDL) {
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));

        this._primaryKeyFields = this.fields.filter(f => f.constraint === PK).map(f => f.name);
        this._foreignKeyFields = this.fields.filter(f => f.constraint === FK).map(f => f.name);
    }

    connect(schemas: TableSchema[]) {
        schemas.forEach(schema => {
            this.relations = this.relations.concat(schema.fields.filter(f => f.references === this.name));
        })
    }

    normalize(data: any, output: NormalizedState = {}) {
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");

        if (output[this.name])
            throw new Error("Failed to normalize data. Circular reference detected.");

        output[this.name] = { ids: [], byId: {} };
        output[this.name].ids = utils.ensureArray(data).map(obj => {
            const pk = this.getPrimaryKey(data);
            output[this.name].byId[pk] = obj;

            const relations: Record<string, any> = {};
            this.relations.forEach(rel => {
                if (rel.relationName && data[rel.relationName]) {
                    rel.table.normalize(data[rel.relationName], output);
                    delete data[rel.relationName];
                }
            });

            return pk;
        });

        return output;
    }

    getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        let pk: string | number | null | undefined = null;

        if (lookup.length === 1)
            pk = record[lookup[0]];
        else if (lookup.length > 1)
            pk = lookup.reduce((p, n) => {
                const k = record[n];
                return p && k ? (p + "_" + k) : k;
            }, null);

        if (pk !== null && pk !== undefined && typeof (pk) !== "string")
            pk = pk.toString();

        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of type \"${this.name}\".`);

        return pk;
    }
}

export class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly propName: string;

    readonly type: FieldType;
    readonly constraint: ConstraintType;

    readonly references?: string;
    readonly relationName?: string;

    constructor(table: TableSchema, name: string, schema: FieldDDL) {
        this.table = table;
        this.name = name;
        this.propName = schema.name || name;
        this.type = schema.type || "any";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
}