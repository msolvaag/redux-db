import * as utils from "./utils";
export class Session {
    constructor(state = {}, schema) {
        this.state = state;
        this.tables = utils.toObject(schema.tables.map(t => new TableModel(this, state[t.name], t)), t => t.schema.name);
    }
    upsert(state, from) {
        Object.keys(state).forEach(name => {
            if (!from || name !== from.schema.name) {
                this.tables[name].upsertNormalized(state[name]);
            }
        });
    }
    commit() {
        Object.keys(this.tables).forEach(table => {
            const oldState = this.state[table];
            const newState = this.tables[table].state;
            if (oldState !== newState)
                this.state = Object.assign({}, this.state, { [table]: newState });
        });
        return this.state;
    }
}
export class TableModel {
    constructor(session, state = { ids: [], byId: {} }, schema) {
        this.session = session;
        this.state = state;
        this.schema = schema;
    }
    all() {
        return this.state.ids.map(id => ModelFactory.default.newRecord(id, this));
    }
    filter(predicate) {
        return this.all().filter(predicate);
    }
    get(id) {
        id = id.toString();
        if (!this.exists(id))
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);
        return ModelFactory.default.newRecord(id, this);
    }
    getOrDefault(id) {
        return this.exists(id) ? this.get(id) : null;
    }
    exists(id) {
        return this.state.byId[id] !== undefined;
    }
    insert(data) {
        return this.insertMany(data)[0];
    }
    insertMany(data) {
        return this._normalizedAction(data, this.insertNormalized);
    }
    update(data) {
        return this.updateMany(data)[0];
    }
    updateMany(data) {
        return this._normalizedAction(data, this.updateNormalized);
    }
    upsert(data) {
        return this._normalizedAction(data, this.upsertNormalized)[0];
    }
    delete(id) {
        const byId = Object.assign({}, this.state.byId), ids = this.state.ids.slice();
        delete byId[id];
        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);
        this.state = Object.assign({}, this.state, { byId: byId, ids: ids });
    }
    insertNormalized(table) {
        this.state = { ids: this.state.ids.concat(table.ids), byId: Object.assign({}, this.state.byId, table.byId) };
        return table.ids.map(id => ModelFactory.default.newRecord(id, this));
    }
    updateNormalized(table) {
        let state = Object.assign({}, this.state), dirty = false;
        const records = Object.keys(table.byId).map(id => {
            if (!this.state.byId[id])
                throw new Error(`Failed to apply update. No \"${this.schema.name}\" record with id: ${id} exists.`);
            const newRecord = table.byId[id];
            const oldRecord = state.byId[id];
            const isModified = this.schema.isModified(oldRecord, newRecord);
            if (isModified) {
                state.byId[id] = Object.assign({}, oldRecord, newRecord);
                dirty = true;
            }
            return ModelFactory.default.newRecord(id, this);
        });
        if (dirty)
            this.state = state;
        return records;
    }
    upsertNormalized(norm) {
        const toUpdate = { ids: [], byId: {} };
        const toInsert = { ids: [], byId: {} };
        norm.ids.forEach(id => {
            if (this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            }
            else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });
        return (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat((toInsert.ids.length ? this.insertNormalized(toInsert) : []));
    }
    _normalizedAction(data, action) {
        const norm = this.schema.normalize(data);
        const table = norm[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(norm, this);
        return records;
    }
}
export class RecordModel {
    constructor(id, table) {
        this.id = id;
        this.table = table;
    }
    get value() {
        return this.table.state.byId[this.id];
    }
    delete() {
        this.table.delete(this.id);
    }
    update(data) {
        this.table.update(data);
        return this;
    }
}
export class RecordField {
    constructor(schema, record) {
        this.name = schema.name;
        this.schema = schema;
        this.record = record;
    }
    get value() {
        return this.record.value[this.name];
    }
}
export class RecordSet {
    constructor(table, schema, owner) {
        this.table = table;
        this.schema = schema;
        this.owner = owner;
    }
    all() {
        return this.table.filter(r => {
            const refId = r.value[this.schema.name];
            return refId && refId.toString() === this.owner.id;
        });
    }
    get value() {
        return this.map(r => r.value);
    }
    get length() {
        return this.all().length;
    }
    map(callback) {
        return this.all().map(callback);
    }
    add(data) {
        this.table.insert(this._normalize(data));
    }
    remove(data) {
        this._normalize(data).forEach(obj => {
            const pk = this.table.schema.getPrimaryKey(obj);
            this.table.delete(pk);
        });
    }
    update(data) {
        this.table.update(this._normalize(data));
    }
    delete() {
        this.all().forEach(obj => this.table.delete(obj.id));
    }
    _normalize(data) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    }
}
class ModelFactory {
    constructor() {
        this._recordClass = {};
    }
    newRecord(id, table) {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass(table.schema)))(id, table);
    }
    newRecordField(schema, record) {
        if (schema.constraint === "FK" && schema.table === record.table.schema && schema.references) {
            const refTable = record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error(`The foreign key ${schema.name} references an unregistered table: ${schema.table.name}`);
            return refTable.getOrDefault(record.value[schema.name]);
        }
        else if (schema.constraint === "FK" && schema.table !== record.table.schema && schema.relationName) {
            const refTable = record.table.session.tables[schema.table.name];
            return new RecordSet(refTable, schema, record);
        }
        else
            return new RecordField(schema, record);
    }
    _createRecordModelClass(schema) {
        class Record extends RecordModel {
            constructor(id, table) {
                super(id, table);
                this._fields = {};
            }
        }
        schema.fields.concat(schema.relations).forEach(field => {
            if (field.constraint == "FK") {
                const name = field.table !== schema ? field.relationName : field.propName;
                if (name)
                    Object.defineProperty(Record.prototype, name, {
                        get: function () {
                            return this._fields[name] || (this._fields[name] = ModelFactory.default.newRecordField(field, this));
                        }
                    });
            }
        });
        return Record;
    }
}
ModelFactory.default = new ModelFactory();
