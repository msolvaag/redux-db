"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
const PK = "PK", FK = "FK", NONE = "NONE";
class TableSchema {
    constructor(name, schema) {
        this.relations = [];
        this.name = name;
        this.fields = Object.keys(schema).map(fieldName => new FieldSchema(this, fieldName, schema[fieldName]));
        this._primaryKeyFields = this.fields.filter(f => f.constraint === PK).map(f => f.name);
        this._foreignKeyFields = this.fields.filter(f => f.constraint === FK).map(f => f.name);
        this._stampFields = this.fields.filter(f => f.type === "MODIFIED").map(f => f.name);
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
        output[this.name] = { ids: [], byId: {} };
        output[this.name].ids = utils.ensureArray(data).map(obj => {
            const pk = this.getPrimaryKey(obj);
            output[this.name].byId[pk] = obj;
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
        let pk = null;
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
    isModified(x, y) {
        if (this._stampFields.length === 1)
            return x[this._stampFields[0]] !== y[this._stampFields[0]];
        else if (this._stampFields.length > 1) {
            return this._stampFields.reduce((p, n) => {
                return p + (x[this._stampFields[0]] !== y[this._stampFields[0]] ? 1 : 0);
            }, 0) !== this._stampFields.length;
        }
        else
            return true;
    }
}
exports.TableSchema = TableSchema;
class FieldSchema {
    constructor(table, name, schema) {
        this.table = table;
        this.name = name;
        this.propName = schema.name || name;
        this.type = schema.type || "ATTR";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
}
exports.FieldSchema = FieldSchema;
