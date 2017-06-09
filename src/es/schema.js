export class TableSchema {
    constructor(name, fields) {
        this.name = name;
        this.fields = fields;
        this._primaryKeyFields = this.fields.filter(f => f.type === "PK").map(f => f.name);
        this._foreignKeyFields = this.fields.filter(f => f.type === "FK").map(f => f.name);
    }
    normalize(data) {
        return data;
    }
    getPrimaryKey(record) {
        const lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        const pk = lookup.reduce((p, n) => {
            const k = record[n];
            return p && k ? (p + "_" + k) : k;
        });
        if (!pk || pk.length === 0)
            throw new Error(`Failed to get primary key for record of \"${this.name}\".`);
        return pk;
    }
}
export class FieldSchema {
    constructor(name, schema) {
        this.name = name;
        this.type = schema.type;
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
}
