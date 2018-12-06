import { initialState } from "./constants";
import errors from "./errors";
import { DatabaseSchema, FieldSchema, ForeignKey, NormalizeContext, TableSchema, TableState } from "./types";
import * as utils from "./utils";

export default class SchemaNormalizer {
    schema: TableSchema;
    db: DatabaseSchema;

    constructor(schema: TableSchema) {
        this.schema = schema;
        this.db = schema.db;
    }

    normalize(data: any, context: NormalizeContext) {
        if (!utils.isPlainObject(data) && !Array.isArray(data))
            throw new Error(errors.normalizeInvalidData());
        utils.ensureParamObject("context", context);
        utils.ensureParamObject("context.output", context.output);

        if (!context.output[this.schema.name])
            context.output[this.schema.name] = initialState(this.schema.name);

        return utils.ensureArray(data).map(obj => {
            if (!utils.isPlainObject(obj))
                throw new Error(errors.normalizeInvalidData());

            let subject = obj;

            const normalizer = this.db.getRecordNormalizer(this.schema.name);
            if (normalizer)
                subject = normalizer(subject, context);

            const pk = context.normalizePKs
                ? this._normalizePrimaryKey(subject)
                : this.schema.getPrimaryKey(subject);

            if (!pk)
                throw new Error(errors.normalizePk(this.schema.name));

            const tbl = context.output[this.schema.name];

            if (!tbl.byId[pk])
                tbl.ids.push(pk);

            const record = tbl.byId[pk] = { ...subject };

            const fks = this.schema.getForeignKeys(subject);
            fks.forEach(fk => {
                this._normalizeForeignKey(fk, record, context);
                this._indexForeignKey(fk, tbl, pk);
            });

            this.schema.relations.forEach(rel =>
                this._normalizeRelations(rel, record, pk, context));

            return pk;
        });
    }

    protected _normalizePrimaryKey(record: any) {
        const pk = this.schema.getPrimaryKey(record);
        if (pk) return pk;

        // Invoke the "onGeneratePK" hook if PK not found.
        const generator = this.db.getPkGenerator(this.schema.name);
        if (!generator) return undefined;

        const generatedPk = generator(record, this.schema);
        if (generatedPk)
            // if the PK is generated and we have a single PK field definition, then inject it into the record.
            if (this.schema.primaryKeys.length === 1)
                record[this.schema.primaryKeys[0].propName] = generatedPk;

        // Handling multiple PK field defs:
        // We may need the "onGeneratePK" hook to return an object defining each key value.
        // BUT this seems like a rare scenario..
        // So for now; don't populate record.

        return generatedPk;
    }

    protected _normalizeRelations(rel: FieldSchema, record: any, pk: string, context: NormalizeContext) {
        // Normalize foreign relations, FKs from other tables referencing this table.
        // Then remove the nested relations from the record.
        if (rel.relationName && record[rel.relationName]) {
            const normalizedRels = this.schema.inferRelations(record[rel.relationName], rel, pk);

            rel.table.normalize(normalizedRels, context);
            delete record[rel.relationName];
        }
    }

    protected _normalizeForeignKey(fk: ForeignKey, record: any, context: NormalizeContext) {
        // if the FK is an object, then normalize it and replace object with it's PK.
        if (typeof fk.value !== "object") return;

        const fkPks = fk.refTable.normalize(fk.value, context);
        if (fkPks.length > 1)
            throw new Error(errors.normalizeInvalidFk(this.schema.name, fk.name, fk.refTable.name));

        record[fk.name] = fk.value = fkPks[0];
    }

    protected _indexForeignKey(fk: ForeignKey, tbl: TableState, pk: string) {
        if (!utils.isValidID(fk.value)) return;

        const fkId = utils.asID(fk.value);
        const idx = tbl.indexes[fk.name]
            || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });

        if (!idx.values[fkId])
            idx.values[fkId] = [];

        if (idx.unique && idx.values.length)
            throw new Error(errors.normalizeFkViolation(this.schema.name, fk.name));

        idx.values[fkId].push(pk);
    }
}
