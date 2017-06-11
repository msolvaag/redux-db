import * as utils from "./utils";
const PK = "PK", FK = "FK", NONE = "NONE";
export class TableSchema {
    constructor(name, schema) {
        this.relations = [];
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));
        this._primaryKeyFields = this.fields.filter(f => f.constraint === PK).map(f => f.name);
        this._foreignKeyFields = this.fields.filter(f => f.constraint === FK).map(f => f.name);
    }
    connect(schemas) {
        schemas.forEach(schema => {
            this.relations = this.relations.concat(schema.fields.filter(f => f.references === this.name));
        });
    }
    normalize(data, output = {}) {
        if (!utils.isPlainObject(data) && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        if (output[this.name])
            throw new Error("Failed to normalize data. Circular reference detected.");
        output[this.name] = { ids: [], byId: {} };
        output[this.name].ids = utils.ensureArray(data).map(obj => {
            const pk = this.getPrimaryKey(data);
            output[this.name].byId[pk] = obj;
            const relations = {};
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
    getPrimaryKey(record) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        let pk;
        if (lookup.length === 1)
            pk = record[lookup[0]];
        else
            pk = lookup.reduce((p, n) => {
                const k = record[n];
                return p && k ? (p + "_" + k) : k;
            });
        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of type \"${this.name}\".`);
        return pk;
    }
}
export class FieldSchema {
    constructor(table, name, schema) {
        this.table = table;
        this.name = name;
        this.type = schema.type || "any";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
}
