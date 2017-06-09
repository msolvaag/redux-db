export class TableSchema {
    constructor(name, fields) {
        this.name = name;
        this.fields = fields;
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
