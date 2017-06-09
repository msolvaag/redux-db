class FieldModel {
    constructor(state, schema) {
    }
}
const createPrototype = (schema) => {
    class ModelClass extends RecordModel {
        constructor(state, schema) {
            super(state, schema);
        }
    }
    schema.fields.forEach(field => {
        Object.defineProperty(ModelClass, field.name, {});
    });
    return ModelClass;
};
export class SessionModel {
    constructor(state, schema) {
        this.tables = schema.tables.map(t => new TableModel(state[t.name], t));
    }
}
export class TableModel {
    constructor(state, schema) {
        this.state = state;
        this.schema = schema;
        this.RecordClass = createPrototype(schema);
    }
    all() {
        const records = this.state.ids.map(id => this.state.byId[id]);
        return records.map(r => new this.RecordClass(r, this.schema));
    }
    filter(predicate) {
        return this.all().filter(predicate);
    }
    get(id) {
        const record = this.state.byId[id];
        if (!record)
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);
        return new this.RecordClass(record, this.schema);
    }
    exists(id) {
        return this.state.byId[id] !== undefined;
    }
}
export class RecordModel {
    constructor(state, schema) {
        this.state = state;
        this.schema = schema;
    }
    delete() {
    }
    update(data) {
    }
}
export class RecordSet {
    insert(data) {
    }
}
