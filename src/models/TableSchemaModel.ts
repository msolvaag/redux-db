import {
    TYPE_MODIFIED
} from "../constants";
import errors from "../errors";
import {
    DatabaseSchema,
    FieldSchema,
    NormalizeContext,
    TableDefinition,
    TableRecord,
    TableSchema
} from "../types";
import * as utils from "../utils";
import FieldSchemaModel from "./FieldSchemaModel";

export default class TableSchemaModel implements TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];

    private _relations: FieldSchema[] = [];
    private _primaryKeyFields: FieldSchema[];
    private _foreignKeyFields: FieldSchema[];
    private _stampFields: FieldSchema[];

    constructor(db: DatabaseSchema, name: string, schema: TableDefinition) {
        this.db = utils.ensureParam("db", db);
        this.name = utils.ensureParamString("name", name);

        this.fields = Object.keys(utils.ensureParam("schema", schema))
            .map(fieldName =>
                new FieldSchemaModel(this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true));

        this._primaryKeyFields = this.fields.filter(f => f.isPrimaryKey);
        this._foreignKeyFields = this.fields.filter(f => f.isForeignKey);
        this._stampFields = this.fields.filter(f => f.type === TYPE_MODIFIED);
    }

    /// Gets the FK's that references this table.
    get relations() { return this._relations; }

    connect(schemas: TableSchema[]) {
        schemas.forEach(schema =>
            this._relations = this._relations.concat(schema.fields.filter(f => f.references === this.name)));
        this._foreignKeyFields.forEach(fk => fk.connect(schemas));
    }

    normalize(data: any, context: NormalizeContext) {
        if (!utils.isObject(data) && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");

        const ctx = utils.ensureParam("context", context);

        if (!ctx.output[this.name])
            ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };

        return utils.ensureArray(data).map(obj => {
            if (!utils.isObject(obj))
                throw new Error("Failed to normalize data. Given record is not a plain object.");

            let subject = obj;

            const normalizer = this.db.getNormalizer(this.name);
            if (normalizer)
                subject = normalizer(subject, ctx);

            const pk = ctx.normalizePKs ? this._normalizePrimaryKey(subject) : this._getPrimaryKey(subject);

            if (!pk)
                throw new Error(`Failed to normalize primary key for record of type \"${this.name}\".`
                    + ` Make sure record(s) have a primary key value before trying to insert or update a table.`);

            const fks = this.getForeignKeys(subject);
            const tbl = ctx.output[this.name];

            if (!tbl.byId[pk])
                tbl.ids.push(pk);

            const record = tbl.byId[pk] = { ...subject };

            fks.forEach(fk => {

                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    const fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error(`Invalid schema definition. The field "${this.name}.${fk.name}"`
                            + ` is referencing table "${fk.refTable.name}", but the given data is an array.`);

                    record[fk.name] = fk.value = fkPks[0];
                }

                // all FK's are auto indexed
                if (utils.isValidID(fk.value)) {
                    const fkId = utils.asID(fk.value); // ensure string id
                    const idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });

                    if (!idx.values[fkId])
                        idx.values[fkId] = [];
                    if (idx.unique && idx.values.length)
                        throw new Error(`The insert/update operation violates`
                            + ` the unique foreign key "${this.name}.${fk.name}".`);

                    idx.values[fkId].push(pk);
                }
            });

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

    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[] {
        if (!rel.relationName) return data;

        const otherFks = rel.table.fields.filter(f => f.isForeignKey && f !== rel);

        return utils.ensureArray(data).map(obj => {
            if (typeof obj === "number" || typeof obj === "string")
                if (otherFks.length === 1)
                    obj = { [otherFks[0].name]: obj };
                else
                    obj = { id: obj }; // TODO: this might be quite wrong..

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

    getPrimaryKey(record: any) {
        const pk = this._getPrimaryKey(record);

        if (!pk)
            throw new Error(errors.pkNotFound(this.name));

        return pk;
    }

    getForeignKeys(record: any) {
        return this._foreignKeyFields.map(fk => ({
            name: fk.name,
            notNull: fk.notNull,
            refTable: fk.refTable,
            unique: fk.unique,
            value: record[fk.name]
        }));
    }

    isModified(x: any, y: any): boolean {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce((p, n) =>
                p + (n.getValue(x) === n.getValue(y) ? 1 : 0), 0
            ) !== this._stampFields.length;
        else {
            const comparer = this.db.getRecordComparer(this.name);
            if (comparer)
                return !comparer(x, y, this);
            return x === y;
        }
    }

    /// Gets the value of the PK for the given record. Does not throw if none found.
    private _getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);

        const combinedPk = lookup.reduce((p, n) => {
            const k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null as string | null | undefined | number);

        return utils.isValidID(combinedPk) && utils.asID(combinedPk);
    }

    /// Normalizes the given record with a primary key field. Returns the key value.
    private _normalizePrimaryKey(record: any) {
        const pk = this._getPrimaryKey(record);
        if (pk) return pk;

        // Invoke the "onGeneratePK" hook if PK not found.
        const generator = this.db.getPkGenerator(this.name);
        if (!generator) return undefined;

        const generatedPk = generator(record, this);
        if (generatedPk)
            // if the PK is generated and we have a single PK field definition, then inject it into the record.
            if (this._primaryKeyFields.length === 1)
                record[this._primaryKeyFields[0].propName] = generatedPk;

        // TODO: Handle multiple PK field defs.
        // We may need the "onGeneratePK" hook to return an object defining each key value.
        // BUT this seems like a rare scenario..

        return generatedPk;
    }
}
