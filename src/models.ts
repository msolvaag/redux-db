import {
    DatabaseSchema,
    TableSchema,
    FieldSchema,
    DatabaseState,
    TableState,
    TableIndex,
    NormalizedState,
    NormalizeContext,
    Table,
    TableRecord,
    TableRecordSet,
    Session
} from "./schema";
import * as utils from "./utils";


export class TableModel<R extends TableRecord<T> = TableRecord, T=any> implements Table<R, T> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<T>;
    dirty = false;

    constructor(session: Session, state: TableState<T> = { ids: [], byId: {}, indexes: {} }, schema: TableSchema) {
        this.session = utils.ensureParam("session", session);
        this.state = utils.ensureParam("state", state);
        this.schema = utils.ensureParam("schema", schema);

        if (!this.state.name)
            this.state.name = schema.name;
    }

    all(): R[] {
        return this.state.ids.map(id => ModelFactory.default.newRecord<R, T>(id, this));
    }

    get length() {
        return this.state.ids.length;
    }

    get values() {
        return this.all().map(r => r.value);
    }

    filter(predicate: (record: R, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    index(name: string, fk: string): string[] {
        utils.ensureParamString("value", name);
        utils.ensureParamString("fk", fk);

        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    }

    get(id: number | string): R {
        if (typeof id === "number") id = id.toString();

        if (!this.exists(id))
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return ModelFactory.default.newRecord<R, T>(id, this);
    }

    getOrDefault(id: number | string) {
        return this.exists(id) ? this.get(id) : null;
    }

    getByFk(fieldName: string, value: number | string): RecordSet<R, T> {
        utils.ensureParam("fieldName", fieldName);
        utils.ensureParam("value", value);

        const field = this.schema.fields.filter(f => f.isForeignKey && f.name === fieldName)[0];
        if (!field) throw new Error(`No foreign key named: ${fieldName} in the schema: "${this.schema.name}".`);
        return new RecordSet<R, T>(this, field, { id: value.toString() });
    }

    value(id: number | string) {
        utils.ensureParam("id", id);
        if (typeof id === "number") id = id.toString();

        return this.state.byId[id];
    }

    exists(id: number | string) {
        utils.ensureParam("id", id);
        if (typeof id === "number") id = id.toString();

        return this.state.byId[id] !== undefined;
    }

    insert(data: T | T[]): R {
        return this.insertMany(data)[0];
    }

    insertMany(data: T | T[]): R[] {
        return this._normalizedAction(data, this.insertNormalized);
    }

    update(data: Partial<T> | Partial<T>[]): R {
        return this.updateMany(data)[0];
    }

    updateMany(data: Partial<T> | Partial<T>[]): R[] {
        return this._normalizedAction(data, this.updateNormalized);
    }

    upsert(data: Partial<T> | Partial<T>[]) {
        return this._normalizedAction(data, this.upsertNormalized)[0];
    }

    delete(id: string | number) {
        utils.ensureParam("id", id);

        if (typeof id === "number") id = id.toString();
        if (!this.exists(id)) return false;

        this._deleteCascade(id);

        const byId = { ...this.state.byId },
            ids = this.state.ids.slice(),
            indexes = { ...this.state.indexes },
            record = byId[id];

        delete byId[id];
        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);

        if (record)
            this._cleanIndexes(id, record, indexes);

        this.dirty = true;
        this.state = { ...this.state, byId: byId, ids: ids, indexes: indexes };

        return true;
    }

    deleteAll() {
        if (this.length)
            this.all().forEach(d => d.delete());
    }

    insertNormalized(table: TableState<T>) {
        utils.ensureParam("table", table);

        this.dirty = true;
        this.state = {
            ...this.state,
            ids: utils.mergeIds(this.state.ids, table.ids, true),
            byId: { ...this.state.byId, ...table.byId }
        };
        this._updateIndexes(table);

        return table.ids.map(id => ModelFactory.default.newRecord<R, T>(id, this));
    }

    updateNormalized(table: TableState<T>) {
        utils.ensureParam("table", table);

        let state = { ... this.state }, dirty = false;
        const records = Object.keys(table.byId).map(id => {
            if (!this.state.byId[id])
                throw new Error(`Failed to apply update. No \"${this.schema.name}\" record with id: ${id} exists.`);

            const oldRecord = state.byId[id] as {};
            const newRecord = { ...oldRecord, ...table.byId[id] as {} } as T;

            const isModified = this.schema.isModified(oldRecord, newRecord);

            if (isModified) {
                state.byId[id] = newRecord;
                dirty = true;
            }

            return ModelFactory.default.newRecord<R, T>(id, this);
        });

        if (dirty) {
            this.dirty = true;
            this.state = state;
            this._updateIndexes(table);
        }

        return records;
    }

    upsertNormalized(norm: TableState<T>): R[] {
        utils.ensureParam("table", norm);

        const toUpdate: TableState<T> = { ids: [], byId: {}, indexes: {} };
        const toInsert: TableState<T> = { ids: [], byId: {}, indexes: {} };

        norm.ids.forEach(id => {
            if (this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            } else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });

        const refs = (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat(
            (toInsert.ids.length ? this.insertNormalized(toInsert) : []));

        this._updateIndexes(norm);

        return refs;
    }

    private _normalizedAction(data: Partial<T> | Partial<T>[], action: (norm: TableState) => R[]): R[] {
        utils.ensureParam("data", data);
        utils.ensureParam("action", action);

        const norm = new NormalizeContext(this.schema);
        this.schema.normalize(data, norm);

        const table = norm.output[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(norm);
        return records;
    }

    private _updateIndexes(table: TableState) {

        Object.keys(table.indexes).forEach(key => {
            const idx = this.state.indexes[key] || (this.state.indexes[key] = { unique: table.indexes[key].unique, values: {} });

            Object.keys(table.indexes[key].values).forEach(fk => {
                const idxBucket = idx.values[fk] || (idx.values[fk] = []);

                const modifiedBucket = utils.mergeIds(idxBucket, table.indexes[key].values[fk], false);

                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error(`The insert/update operation violates the unique foreign key "${this.schema.name}.${key}".`);

                idx.values[fk] = modifiedBucket;
            });
        });
    }

    private _cleanIndexes(id: string, record: any, indexes: TableIndex) {
        const fks = this.schema.getForeignKeys(record);

        fks.forEach(fk => {
            let fkIdx = -1;
            if (fk.value && indexes[fk.name] && indexes[fk.name].values[fk.value])
                fkIdx = indexes[fk.name].values[fk.value].indexOf(id);

            if (fkIdx >= 0) {
                const idxBucket = indexes[fk.name].values[fk.value].slice();
                idxBucket.splice(fkIdx, 1);

                indexes[fk.name].values[fk.value] = idxBucket;
            } else if (indexes[fk.name]) {
                delete indexes[fk.name].values[id];
                if (Object.keys(indexes[fk.name].values).length === 0)
                    delete indexes[fk.name];
            }
        });
    }

    private _deleteCascade(id: string) {
        const cascade = this.schema.relations.filter(rel => rel.relationName && rel.cascade);
        if (cascade.length) {
            const model = this.get(id) as any;

            model && cascade.forEach(schema => {
                model[schema.relationName as string].delete();
            });
        }
    }
}

export class RecordModel<T> implements TableRecord<T> {
    table: Table;
    id: string;


    constructor(id: string, table: Table) {
        this.id = utils.ensureParam("id", id);
        this.table = utils.ensureParam("table", table);
    }

    get value(): T {
        return this.table.value(this.id);
    }

    delete() {
        this.table.delete(this.id);
    }

    update(data: Partial<T>) {
        this.table.update(data);
        return this;
    }
}

export class RecordField<T> {
    readonly record: TableRecord<T>;
    readonly schema: FieldSchema;
    readonly name: string;

    constructor(schema: FieldSchema, record: TableRecord<T>) {
        this.schema = utils.ensureParam("schema", schema);
        this.record = utils.ensureParam("record", record);
        this.name = utils.ensureParamString("schema.name", schema.name);
    }

    get value() {
        return this.schema.getRecordValue(this.record);
    }
}

export class RecordSet<R extends TableRecord<T>, T=any> implements TableRecordSet<R, T> {

    readonly table: Table<R, T>;
    readonly schema: FieldSchema;
    readonly owner: { id: string };

    constructor(table: Table<R, T>, schema: FieldSchema, owner: { id: string }) {
        this.table = utils.ensureParam("table", table);
        this.schema = utils.ensureParam("schema", schema);
        this.owner = utils.ensureParam("owner", owner);
    }

    get value() {
        return this.map(r => r.value);
    }

    get ids() {
        return this.table.index(this.schema.name, this.owner.id);
    }

    get length() {
        return this.ids.length;
    }

    all() {
        return this.ids.map(id => ModelFactory.default.newRecord<R, T>(id, this.table));
    }

    map<M>(callback: (record: R) => M) {
        return this.all().map(callback);
    }

    add(data: T | T[]) {
        this.table.insert(this._normalize(data));
    }

    remove(data: Partial<T> | Partial<T>[]) {
        this._normalize(data).forEach(obj => {
            const pk = this.table.schema.getPrimaryKey(obj);
            this.table.delete(pk);
        });
    }

    update(data: Partial<T> | Partial<T>[]) {
        this.table.update(this._normalize(data));
        return this;
    }

    delete() {
        this.ids.forEach(id => this.table.delete(id));
    }

    private _normalize(data: Partial<T> | Partial<T>[]) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    }
}

class ModelFactory {
    private _recordClass: { [key: string]: any } = {};

    static default: ModelFactory = new ModelFactory();

    newRecord<R extends TableRecord<T>, T>(id: string, table: Table<R, T>): R {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass<T>(table.schema)))(id, table);
    }

    newRecordField(schema: FieldSchema, record: TableRecord) {
        if (!schema.isForeignKey)
            return new RecordField(schema, record);

        const refTable = schema.references && record.table.session.tables[schema.references] as Table;
        if (!refTable)
            throw new Error(`The foreign key: "${schema.name}" references an unregistered table: "${schema.references}" in the current session.`);

        return refTable.getOrDefault(schema.getRecordValue(record));
    }

    newRecordSet(schema: FieldSchema, record: TableRecord) {
        const refTable = record.table.session.tables[schema.table.name] as Table;
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        return new RecordSet(refTable, schema, record);
    }

    newRecordRelation(schema: FieldSchema, record: TableRecord) {
        const refTable = record.table.session.tables[schema.table.name] as Table;
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        const id = refTable.index(schema.name, record.id)[0];
        if (id === undefined) return null;
        else return ModelFactory.default.newRecord(id, refTable);
    }

    protected _createRecordModelClass<T>(schema: TableSchema) {

        class Record extends RecordModel<T> {
            table: Table;
            _fields: { [key: string]: any } = {};

            constructor(id: string, table: Table) {
                super(id, table);
            }
        }

        const defineProperty = (name: string, field: FieldSchema, factory: (f: FieldSchema, ref: Record) => any, cache = true) => {
            if (name === "id") throw new Error(`The property "${field.table.name}.id" is a reserved name. Please specify another name using the "propName" definition.`);
            Object.defineProperty(Record.prototype, name, {
                get: function (this: Record) {
                    return cache ? (this._fields[name] || (this._fields[name] = factory(field, this))) : factory(field, this);
                }
            });
        };

        schema.fields.forEach(f => (f.isForeignKey || !f.isPrimaryKey) && defineProperty(f.propName, f, ModelFactory.default.newRecordField));
        schema.relations.forEach(f => f.relationName && defineProperty(f.relationName, f, f.unique ? ModelFactory.default.newRecordRelation : ModelFactory.default.newRecordSet, !f.unique));

        return Record;
    }
}