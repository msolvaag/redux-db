import * as utils from "./utils";
const PK = "PK", FK = "FK", NONE = "NONE";
export class TableSchema {
    constructor(name, schema) {
        this.relations = [];
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));
        this._primaryKeyFields = this.fields.filter(f => f.constraint === PK);
        this._foreignKeyFields = this.fields.filter(f => f.constraint === FK);
        this._stampFields = this.fields.filter(f => f.type === "MODIFIED");
    }
    connect(schemas) {
        schemas.forEach(schema => {
            this.relations = this.relations.concat(schema.fields.filter(f => f.references === this.name));
        });
    }
    normalize(data, output = {}) {
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        if (output[this.name])
            throw new Error("Failed to normalize data. Circular reference detected.");
        output[this.name] = { ids: [], byId: {}, indexes: {} };
        output[this.name].ids = utils.ensureArray(data).map(obj => {
            const pk = this.getPrimaryKey(obj);
            const fks = this.getForeignKeys(obj);
            const tbl = output[this.name];
            tbl.byId[pk] = obj;
            fks.forEach(fk => {
                if (!tbl.indexes[fk.name])
                    tbl.indexes[fk.name] = {};
                if (!tbl.indexes[fk.name][pk])
                    tbl.indexes[fk.name][pk] = [];
                tbl.indexes[fk.name][pk].push(fk.value);
            });
            const relations = {};
            this.relations.forEach(rel => {
                if (rel.relationName && data[rel.relationName]) {
                    const normalizedRels = this.inferRelations(data[rel.relationName], rel, pk);
                    rel.table.normalize(normalizedRels, output);
                    delete data[rel.relationName];
                }
            });
            return pk;
        });
        return output;
    }
    inferRelations(data, rel, ownerId) {
        if (!rel.relationName)
            return data;
        const otherFks = rel.table.fields.filter(f => f.constraint === FK && f !== rel);
        return utils.ensureArray(data).map(obj => {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = { [otherFks[0].name]: obj };
                }
                else {
                    obj = { id: obj };
                }
            }
            return Object.assign({}, obj, { [rel.name]: ownerId });
        });
    }
    getPrimaryKey(record) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        let pk = lookup.reduce((p, n) => {
            const k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null);
        if (pk !== null && pk !== undefined && typeof (pk) !== "string")
            pk = pk.toString();
        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of type \"${this.name}\".`);
        return pk;
    }
    getForeignKeys(record) {
        return this._foreignKeyFields.map(fk => ({ name: fk.name, value: record[fk.name] }));
    }
    isModified(x, y) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce((p, n) => p + (n.getValue(x) === n.getValue(y) ? 1 : 0), 0) !== this._stampFields.length;
        else
            return true;
    }
}
export class FieldSchema {
    constructor(table, name, schema) {
        this.table = table;
        this.name = name;
        this.propName = schema.propName || name;
        this.type = schema.type || "ATTR";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
        this._valueFn = schema.value ? schema.value.bind(this) : null;
    }
    getValue(data, record) {
        return this._valueFn ? this._valueFn(data, {
            schema: this,
            record: record
        }) : data[this.name];
    }
    getRecordValue(record) {
        return this.getValue(record.value, record);
    }
}
