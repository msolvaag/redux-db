import * as utils from "./utils";

export type FieldType = "ATTR" | "MODIFIED" | "PK";

export interface Table<T=any> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;

    get: (id: string | number) => TableRecord<T>;
    getOrDefault: (id: string | number) => TableRecord<T> | null;
    getByFk: (fieldName: string, id: string | number) => TableRecordSet<T>;
    all(): TableRecord<T>[];
    filter: (callback: (record: TableRecord<T>) => boolean) => TableRecord<T>[];
    exists: (id: string | number) => boolean;
    index: (name: string, fk: string) => string[];
    value: (id: string | number) => T;

    upsert: (data: Partial<T> | Partial<T>[]) => TableRecord<T>;
    insert: (data: T | T[]) => TableRecord<T>;
    insertMany: (data: T | T[]) => TableRecord<T>[];
    update: (data: Partial<T> | Partial<T>[]) => TableRecord<T>;
    updateMany: (data: Partial<T> | Partial<T>[]) => TableRecord<T>[];
    delete: (id: string | number) => void;
}

export interface TableRecord<T=any> {
    id: string;
    table: Table<T>;
    value: T;

    update(data: T): TableRecord<T>;
    delete(): void;
}

export interface TableRecordSet<T> {
    value: T[];
    ids: string[]
    length: number;

    all(): TableRecord<T>[];

    add(data: T | T[]): void;
    remove(data: Partial<T>): void;

    update(data: Partial<T> | Partial<T>[]): TableRecordSet<T>;
    delete(): void;

    map<M>(callback: (record: TableRecord<T>) => M): M[];
}

// Defines a database schema
export interface SchemaDDL {
    [key: string]: TableDDL;
}

// Defines a table schema
export interface TableDDL {
    [key: string]: FieldDDL;
}

// Defines a field (column) schema
export interface FieldDDL {

    // Defines the field type. 
    type?: FieldType,

    // Defines a custom property name for the field. Defaults to the field name.
    propName?: string;

    // Defines the foreign table this field references.
    references?: string;

    // Defines the relationship name, which'll be the property name on the foreign table.
    relationName?: string;

    // If set, causes the record to be deleted if the foreign table row is deleted.
    cascade?: boolean;

    // If set, declares that this relation is a one 2 one relationship.
    unique?: boolean;

    // Defines a custom value factory for each record.
    value?: <T, V>(record: T, context?: ComputeContext<T>) => V;
}

export interface ComputeContext<T> {
    schema: FieldSchema;
    record?: TableRecord<T>;
}

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

export interface TableState<T=any> {
    name?: string;
    byId: { [key: string]: T };
    ids: string[];
    indexes: TableIndex;
}

export interface TableIndex {
    [key: string]: {
        unique: boolean,
        values: { [key: string]: string[] }
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
        indexes: TableIndex;
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

    readonly fieldsByName: { [key: string]: FieldSchema };

    private _primaryKeyFields: FieldSchema[];
    private _foreignKeyFields: FieldSchema[];
    private _stampFields: FieldSchema[];

    constructor(db: DatabaseSchema, name: string, schema: TableDDL) {
        this.db = db;
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));
        this.fieldsByName = utils.toObject(this.fields, f => f.name);

        this._primaryKeyFields = this.fields.filter(f => f.isPrimaryKey);
        this._foreignKeyFields = this.fields.filter(f => f.isForeignKey);
        this._stampFields = this.fields.filter(f => f.type === "MODIFIED");
    }

    /// Connects this schema's fields with other tables.
    /// Used internally in the setup of the schema object model.
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

        // temp holder to validate PK constraint
        const pks: { [key: string]: boolean } = {};

        return utils.ensureArray(data).map(obj => {
            const normalizeHook = this.db.normalizeHooks ? this.db.normalizeHooks[this.name] : null;
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);

            const pk = this.getPrimaryKey(obj);
            if (pks[pk])
                throw new Error(`Multiple records with the same PK: "${this.name}.${pk}". Check your schema definition.`);

            const fks = this.getForeignKeys(obj);
            const tbl = ctx.output[this.name];

            if (!tbl.byId[pk])
                tbl.ids.push(pk);

            const record = tbl.byId[pk] = { ...obj };

            fks.forEach(fk => {

                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    const fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error(`Invalid schema definition. The field "${this.name}.${fk.name}" is referencing table "${fk.refTable.name}", but the given data is an array.`);

                    record[fk.name] = fk.value = fkPks[0];
                }

                // all FK's are auto indexed
                if (fk.value !== null && fk.value !== undefined) {
                    const idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });

                    if (!idx.values[fk.value])
                        idx.values[fk.value] = [];
                    if (idx.unique && idx.values.length)
                        throw new Error(`The insert/update operation violates the unique foreign key "${this.name}.${fk.name}".`)

                    idx.values[fk.value].push(pk);
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

        const otherFks = rel.table.fields.filter(f => f.isForeignKey && f !== rel);

        return utils.ensureArray(data).map(obj => {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = { [otherFks[0].name]: obj };
                } else {
                    obj = { id: obj }; // TODO: this might be quite wrong..
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
        return this._foreignKeyFields.map(fk => ({ name: fk.name, value: record[fk.name], refTable: fk.refTable, unique: fk.unique }));
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
    readonly cascade: boolean;
    readonly unique: boolean;

    readonly isPrimaryKey: boolean;
    readonly isForeignKey: boolean;

    refTable?: TableSchema;

    private _valueFactory?: <T, M>(record: T, context?: ComputeContext<T>) => M;

    constructor(table: TableSchema, name: string, schema: FieldDDL) {
        this.table = table;

        this.type = schema.type || "ATTR";
        this.name = name;
        this.propName = schema.propName || name;
        this._valueFactory = schema.value ? schema.value.bind(this) : null;
        this.isPrimaryKey = schema.type === "PK";
        this.isForeignKey = schema.references !== null && schema.references !== undefined;

        if (this.isPrimaryKey || this.isForeignKey) {
            this.references = schema.references;
            this.relationName = schema.relationName;
            this.cascade = schema.cascade === true;
            this.unique = schema.unique === true;
        } else {
            this.cascade = false;
            this.unique = false;
        }
    }

    getValue(data: any, record?: any) {
        return this._valueFactory ? this._valueFactory(data, {
            schema: this,
            record: record
        }) : data[this.name];
    }

    getRecordValue(record: { value: any }) {
        return this.getValue(record.value, record);
    }
}