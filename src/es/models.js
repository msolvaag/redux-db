class FieldModel {
    constructor(state, schema) {
    }
}
export class SessionModel {
    constructor(state = {}, schema) {
        this.state = state;
        this.tables = schema.tables.map(t => new TableModel(state[t.name], t));
    }
    update(data) {
    }
}
export class TableModel {
    constructor(state = { ids: [], byId: {} }, schema) {
        this._records = [];
        this.stateRef = { state: state };
        this.schema = schema;
        this.RecordClass = createPrototype(schema);
    }
    all() {
        const records = this.stateRef.state.ids.map(id => this.stateRef.state.byId[id]);
        return this._records = records.map(r => new this.RecordClass(r, this.schema));
    }
    filter(predicate) {
        return this.all().filter(predicate);
    }
    get(id) {
        const record = this.stateRef.state.byId[id];
        if (!record)
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);
        return new this.RecordClass(record, this.schema);
    }
    exists(id) {
        return this.stateRef.state.byId[id] !== undefined;
    }
    insert(data) {
        const record = this.schema.normalize(data);
        const pk = this.schema.getPrimaryKey(record);
        const { byId, ids } = this.stateRef.state;
        this.stateRef.state = { byId: Object.assign({}, byId, { [pk]: record }), ids: [...ids, pk] };
        return new this.RecordClass(record, this.schema);
    }
    update(data) {
    }
    upsert(data) {
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
        this.state = Object.assign({}, this.state, data);
    }
}
export class RecordSet {
    insert(data) {
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
