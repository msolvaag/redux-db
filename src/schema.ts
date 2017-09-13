import * as utils from "./utils";

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
export interface TableDDL {
    [key: string]: FieldDDL;
}
export interface FieldDDL {
    type?: FieldType,
    references?: string;
    relationName?: string;
    propName?: string;
    value?: (record: any, context?: ComputeContext) => any;

    // deprecated. use type instead.
    constraint?: "PK" | "FK";
}

export interface ComputeContext {
    schema: FieldSchema;
    record?: TableRecord;
}

const PK = "PK", FK = "FK", NONE = "NONE";

export type FieldType = "PK" | "FK" | "ATTR" | "MODIFIED";

export interface DatabaseSchema {
    tables: TableSchema[];

    normalizeHooks?: { [key: string]: Normalizer };
}

export interface DatabaseOptions {
    onNormalize?: { [key: string]: Normalizer };
}
export interface SessionOptions {
    readOnly: boolean;
}

export interface DatabaseState {
    [key: string]: TableState;
}

export interface TableState {
    byId: { [key: string]: any };
    ids: string[];
    indexes: {
        [key: string]: {
            [key: string]: string[]
        }
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
    [key: string]: { // schema name
        ids: string[],
        byId: {
            [key: string]: any
        },
        indexes: {
            [key: string]: { [key: string]: string[] }
        }
    };
}

export class NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState = {};
    emits: { [key: string]: any[] } = {};

    constructor(schema: TableSchema) {
        this.schema = schema;
        this.db = schema.db;
    }

    emit(tableName: string, record: any) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    }
}

export class TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];

    relations: FieldSchema[] = [];

    private _primaryKeyFields: FieldSchema[];
    private _foreignKeyFields: FieldSchema[];
    private _stampFields: FieldSchema[];

    constructor(db: DatabaseSchema, name: string, schema: TableDDL) {
        this.db = db;
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));

        this._primaryKeyFields = this.fields.filter(f => f.type === PK);
        this._foreignKeyFields = this.fields.filter(f => f.type === FK);
        this._stampFields = this.fields.filter(f => f.type === "MODIFIED");
    }

    /// Connects this schema's fields with other tables.
    connect(schemas: TableSchema[]) {
        schemas.forEach(schema => {
            this.relations = this.relations.concat(schema.fields.filter(f => f.references === this.name));
        });
        this._foreignKeyFields.forEach(fk => {
            if (fk.references) {
                fk.refTable = schemas.filter(tbl => tbl.name === fk.references)[0];
            }
        });
    }

    /// Normalizes the given data and outputs to context.
    /// Returns the PKs for the normalized records.
    normalize(data: any, context: NormalizeContext) {
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");

        const ctx = context || new NormalizeContext(this);

        if (!ctx.output[this.name])
            ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };

        return utils.ensureArray(data).map(obj => {
            const normalizeHook = this.db.normalizeHooks ? this.db.normalizeHooks[this.name] : null;
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);

            const pk = this.getPrimaryKey(obj);
            const fks = this.getForeignKeys(obj);
            const tbl = ctx.output[this.name];

            const record = tbl.byId[pk] = { ...obj };
            tbl.ids.push(pk);

            fks.forEach(fk => {

                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    const fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error(`Invalid schema definition. The field "${this.name}.${fk.name}" is referencing table "${fk.refTable.name}", but the given data is an array.`);

                    record[fk.name] = fkPks[0];
                }

                // all FK's are auto indexed
                if (fk.value !== null && fk.value !== undefined) {
                    if (!tbl.indexes[fk.name])
                        tbl.indexes[fk.name] = {};
                    if (!tbl.indexes[fk.name][fk.value])
                        tbl.indexes[fk.name][fk.value] = [];
                    tbl.indexes[fk.name][fk.value].push(pk);
                }
            });

            const relations: Record<string, any> = {};
            // Normalize foreign relations, FKs from other tables referencing this table.
            // Then remove the nested relations from the record.
            this.relations.forEach(rel => {
                if (rel.relationName && record[rel.relationName]) {
                    const normalizedRels = this.inferRelations(record[rel.relationName], rel, pk);

                    rel.table.normalize(normalizedRels, ctx);
                    delete record[rel.relationName];
                }
            });

            return pk;
        });
    }

    /// Infers the owner PK into the given nested relations
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[] {
        if (!rel.relationName) return data;

        const otherFks = rel.table.fields.filter(f => f.type === FK && f !== rel);

        return utils.ensureArray(data).map(obj => {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = { [otherFks[0].name]: obj };
                } else {
                    obj = { id: obj }; // TODO: this may be quite wrong..
                }
            }
            return { ...obj, [rel.name]: ownerId };
        });
    }

    /// Gets the value of the PK for the given record.
    getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);

        let pk = lookup.reduce((p, n) => {
            const k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, <string | null | undefined | number>null);

        if (pk !== null && pk !== undefined && typeof (pk) !== "string")
            pk = pk.toString();

        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of type \"${this.name}\".`);

        return pk;
    }

    /// Gets the values of the FK's for the given record.
    getForeignKeys(record: any) {
        return this._foreignKeyFields.map(fk => ({ name: fk.name, value: record[fk.name], refTable: fk.refTable }));
    }

    /// Determines wether two records are equal, not modified.
    isModified(x: any, y: any) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce((p, n) => p + (n.getValue(x) === n.getValue(y) ? 1 : 0), 0) !== this._stampFields.length;
        else
            return !utils.isEqual(x, y); // TODO: make this customizable
    }
}

export class FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly propName: string;

    readonly type: FieldType;

    readonly references?: string;
    readonly relationName?: string;

    refTable?: TableSchema;

    private _valueFn?: (record: any, context?: ComputeContext) => any;

    constructor(table: TableSchema, name: string, schema: FieldDDL) {
        this.table = table;
        this.name = name;
        this.propName = schema.propName || name;
        this.type = schema.type || schema.constraint || (schema.references ? "FK" : "ATTR");
        this.references = schema.references;
        this.relationName = schema.relationName;
        this._valueFn = schema.value ? schema.value.bind(this) : null;
    }

    getValue(data: any, record?: TableRecord) {
        return this._valueFn ? this._valueFn(data, {
            schema: this,
            record: record
        }) : data[this.name];
    }

    getRecordValue(record: TableRecord) {
        return this.getValue(record.value, record);
    }
}