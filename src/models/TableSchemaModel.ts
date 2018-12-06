import errors from "../errors";
import {
    DatabaseSchema,
    FieldSchema,
    MapOf,
    NormalizeContext,
    SchemaNormalizer,
    TableDefinition,
    TableRecord,
    TableSchema
} from "../types";
import * as utils from "../utils";

export default class TableSchemaModel implements TableSchema {
    readonly db: DatabaseSchema;
    readonly name: string;
    readonly fields: FieldSchema[];

    private _normalizer: SchemaNormalizer;
    private _relations: FieldSchema[] = [];
    private _primaryKeyFields: FieldSchema[];
    private _foreignKeyFields: FieldSchema[];
    private _stampFields: FieldSchema[];

    constructor(db: DatabaseSchema, name: string, definition: TableDefinition) {
        this.db = utils.ensureParamObject("db", db);
        this.name = utils.ensureParamString("name", name);
        utils.ensureParamObject("definition", definition);

        this.fields = Object.keys(definition)
            .map(fieldName =>
                db.factory.newFieldSchema(this,
                    fieldName,
                    definition[fieldName]));

        this._normalizer = db.factory.newSchemaNormalizer(this);
        this._primaryKeyFields = this.fields.filter(f => f.isPrimaryKey);
        this._foreignKeyFields = this.fields.filter(f => f.isForeignKey);
        this._stampFields = this.fields.filter(f => f.isStamp);
    }

    get relations() { return this._relations; }
    get primaryKeys() { return this._primaryKeyFields; }

    connect(tableMap: MapOf<TableSchema>) {
        utils.ensureParamObject("tableMap", tableMap);
        Object.keys(tableMap).forEach(schema =>
            this._relations = this._relations.concat(
                tableMap[schema].fields.filter(f => f.references === this.name)
            ));
        this._foreignKeyFields.forEach(fk => fk.connect(tableMap));
    }

    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[] {
        if (!rel.isForeignKey) return data;

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

    normalize(data: any, context: NormalizeContext) {
        return this._normalizer.normalize(data, context);
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

    ensurePrimaryKey(record: any) {
        const pk = this.getPrimaryKey(record);

        if (!pk)
            throw new Error(errors.pkNotFound(this.name));

        return pk;
    }

    getPrimaryKey(record: any) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);

        const combinedPk = lookup.reduce((p, n) => {
            const k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null as string | null | undefined | number);

        return utils.isValidID(combinedPk) && utils.asID(combinedPk);
    }

    getForeignKeys(record: any) {
        return this._foreignKeyFields.map(fk => {
            if (!fk.references || !fk.refTable)
                throw new Error(errors.fkInvalid(this.name, fk.name));

            return {
                name: fk.name,
                notNull: fk.notNull,
                references: fk.references,
                refTable: fk.refTable,
                unique: fk.unique === true,
                value: record[fk.name]
            };
        });
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

    mergeRecord(oldRecord: any, newRecord: any): any {
        const merger = this.db.getRecordMerger(this.name);
        if (merger)
            return merger(oldRecord, newRecord, this);
        return { ...oldRecord, ...newRecord };
    }
}
