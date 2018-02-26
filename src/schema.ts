import * as utils from "./utils";
import { DatabaseSchema, TableSchema, FieldSchema, NormalizedState, TableDDL, FieldDDL, NormalizeContext, ComputeContext, FieldType } from "./def";
import { TableRecord } from "./index";

// Holds the schema definition for a table.
export class TableSchemaModel implements TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];

    private _relations: FieldSchema[] = [];
    private _primaryKeyFields: FieldSchema[];
    private _foreignKeyFields: FieldSchema[];
    private _stampFields: FieldSchema[];

    constructor(db: DatabaseSchema, name: string, schema: TableDDL) {
        this.db = utils.ensureParam("db", db);
        this.name = utils.ensureParamString("name", name);
        this.fields = Object.keys(utils.ensureParam("schema", schema))
            .map(fieldName => new FieldSchemaModel(this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true));

        this._primaryKeyFields = this.fields.filter(f => f.isPrimaryKey);
        this._foreignKeyFields = this.fields.filter(f => f.isForeignKey);
        this._stampFields = this.fields.filter(f => f.type === "MODIFIED");
    }

    /// Gets the FK's that references this table.
    get relations() { return this._relations; }

    /// Connects this schema's fields with other tables.
    /// Used internally in the setup of the schema object model.
    connect(schemas: TableSchema[]) {
        schemas.forEach(schema => this._relations = this._relations.concat(schema.fields.filter(f => f.references === this.name)));
        this._foreignKeyFields.forEach(fk => fk.connect(schemas));
    }

    /// Normalizes the given data and outputs to context.
    /// Returns the PKs for the normalized records.
    normalize(data: any, context: NormalizeContext) {
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");

        const ctx = utils.ensureParam("context", context);

        if (!ctx.output[this.name])
            ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };

        return utils.ensureArray(data).map(obj => {
            if (typeof obj !== "object")
                throw new Error("Failed to normalize data. Given record is not a plain object.");

            const normalizeHook = this.db.normalizeHooks ? this.db.normalizeHooks[this.name] : null;
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);

            const pk = ctx.normalizePKs ? this._normalizePrimaryKey(obj) : this._getPrimaryKey(obj);

            if (!pk)
                throw new Error(`Failed to normalize primary key for record of type \"${this.name}\". Make sure record(s) have a primary key value before trying to insert or update a table.`);

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
                if (utils.isValidID(fk.value)) {
                    const fkId = utils.asID(fk.value); // ensure string id
                    const idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });

                    if (!idx.values[fkId])
                        idx.values[fkId] = [];
                    if (idx.unique && idx.values.length)
                        throw new Error(`The insert/update operation violates the unique foreign key "${this.name}.${fk.name}".`)

                    idx.values[fkId].push(pk);
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

    injectKeys(data: any, record: TableRecord) {
        if (!data || typeof data !== "object") return data;

        // inject primary or foreign keys
        let keys = this._primaryKeyFields;
        if (!keys.length) keys = this._foreignKeyFields;

        keys.forEach(key => {
            if (data[key.name] === undefined)
                data[key.name] = key.getRecordValue(record);
        });
    }

    /// Gets the value of the PK for the given record.
    getPrimaryKey(record: any) {
        const pk = this._getPrimaryKey(record);

        if (!pk)
            throw new Error(`Failed to get primary key for record of type \"${this.name}\".`);

        return pk;
    }

    /// Gets the value of the PK for the given record. Does not throw if none found.
    private _getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);

        const combinedPk = lookup.reduce((p, n) => {
            const k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, <string | null | undefined | number>null);

        return utils.isValidID(combinedPk) && utils.asID(combinedPk);
    }

    /// Normalizes the given record with a primary key field. Returns the key value.
    private _normalizePrimaryKey(record: any) {
        let pk = this._getPrimaryKey(record);

        // Invoke the "onMissingPk" hook if PK not found.
        if (!pk && this.db.onMissingPk) {
            const generatedPk = this.db.onMissingPk(record, this);

            if (generatedPk) {
                // if the PK is generated and we have a single PK field definition, then inject it into the record.
                if (this._primaryKeyFields.length === 1) record[this._primaryKeyFields[0].propName] = generatedPk;
                // TODO: Handle multiple PK field defs. We may need the "onMissingPK" hook to return an object defining each key value. BUT this seems like a rare scenario..

                pk = generatedPk;
            }
        }
        return pk;
    }

    /// Gets the values of the FK's for the given record.
    getForeignKeys(record: any) {
        return this._foreignKeyFields.map(fk => ({ name: fk.name, value: record[fk.name], refTable: fk.refTable, unique: fk.unique, notNull: fk.notNull }));
    }

    /// Determines whether two records are equal, not modified.
    isModified(x: any, y: any) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce((p, n) => p + (n.getValue(x) === n.getValue(y) ? 1 : 0), 0) !== this._stampFields.length;
        else
            return !utils.isEqual(x, y); // TODO: make this customizable
    }
}

// Holds the schema definition for a table field (column)
export class FieldSchemaModel implements FieldSchema {
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

    private _refTable?: TableSchema;
    private _valueFactory?: <T, M>(record: T, context?: ComputeContext<T>) => M;

    constructor(table: TableSchema, name: string, schema: FieldDDL, cascadeAsDefault: boolean) {
        this.table = utils.ensureParam("table", table);

        this.type = schema.type || "ATTR";
        this.name = name;
        this.propName = schema.propName || name;
        this._valueFactory = schema.value ? schema.value.bind(this) : null;
        this.isPrimaryKey = schema.type === "PK";
        this.isForeignKey = schema.references !== null && schema.references !== undefined;

        if (this.isPrimaryKey || this.isForeignKey) {
            this.references = schema.references;
            this.relationName = schema.relationName;
            this.cascade = schema.cascade === undefined ? cascadeAsDefault : schema.cascade === true;
            this.unique = schema.unique === true;

            // not null is default true, for PK's and FK's
            this.notNull = schema.notNull === undefined ? true : schema.notNull === true;
        } else {
            this.cascade = false;
            this.unique = false;
            this.notNull = schema.notNull === true;
        }
    }

    /// Gets the table schema this field references.
    get refTable() { return this._refTable; }

    /// Connects this schema with the referenced table.
    /// Used internally in the setup of the schema object model.
    connect(schemas: TableSchema[]) {
        if (this.references) {
            this._refTable = schemas.filter(tbl => tbl.name === this.references)[0];
            if (!this._refTable)
                throw new Error(`The field schema "${this.table.name}.${this.name}" has an invalid reference to unknown table "${this.references}".`);
        }
    }

    /// Gets the value of the field for the given data.
    getValue(data: any, record?: any): any {
        return this._valueFactory ? this._valueFactory(data, {
            schema: this,
            record: record
        }) : data[this.name];
    }

    /// Gets the value of the field for a given table record.
    getRecordValue(record: { value: any }) {
        return this.getValue(record.value, record);
    }
}
