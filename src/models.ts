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
    Session,
    RecordValue
} from "./def";
import * as utils from "./utils";

/// Holds context state when normalizing data
export class DbNormalizeContext implements NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState = {};
    emits: { [key: string]: any[] } = {};
    normalizePKs: boolean;

    constructor(schema: TableSchema, normalizePKs: boolean) {
        this.schema = schema;
        this.db = schema.db;
        this.normalizePKs = normalizePKs;
    }

    /// Emits data for further normalization
    emit(tableName: string, record: any) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    }
}

export class TableModel<T extends RecordValue, R extends TableRecord<T>> implements Table<T, R> {
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
        return this.state.ids.map(id => this.schema.db.factory.newRecordModel(id, this) as R);
    }

    get length() {
        return this.state.ids.length;
    }

    getValues() {
        return this.state.ids.map(id => this.state.byId[id]);
    }

    filter(predicate: (record: R, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    map<M>(mapFn: (record: R, index: number) => M): M[] {
        return this.all().map(mapFn);
    }

    index(name: string, fk: string) {
        utils.ensureParamString("value", name);
        utils.ensureParamString("fk", fk);

        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    }

    get(id: number | string): R {
        if (!this.exists(id))
            throw new Error(`No "${this.schema.name}" record with id: ${id} exists.`);

        return this.schema.db.factory.newRecordModel(utils.asID(id), this) as R;
    }

    getOrDefault(id: number | string) {
        return this.exists(id) ? this.get(id) : null;
    }

    getByFk(fieldName: string, id: number | string): RecordSetModel<R, T> {
        utils.ensureParam("fieldName", fieldName);
        id = utils.ensureID(id);

        const field = this.schema.fields.filter(f => f.isForeignKey && f.name === fieldName)[0];
        if (!field) throw new Error(`No foreign key named: ${fieldName} in the schema: "${this.schema.name}".`);
        return new RecordSetModel<R, T>(this, field, { id: id });
    }

    getFieldValue(id: string | number, field: keyof T) {
        const record = this.getOrDefault(id);
        if (record)
            return record.value[field];
        else
            return undefined;
    }

    getValue(id: number | string) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    }

    exists(id: number | string) {
        if (!utils.isValidID(id)) return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    }

    insert(data: T | T[]) {
        return this.insertMany(data)[0];
    }

    insertMany(data: T | T[]) {
        return this._normalizedAction(data, this.insertNormalized, true);
    }

    update(data: Partial<T> | Partial<T>[]) {
        return this.updateMany(data)[0];
    }

    updateMany(data: Partial<T> | Partial<T>[]) {
        return this._normalizedAction(data, this.updateNormalized, false);
    }

    upsert(data: Partial<T> | Partial<T>[]) {
        return this._normalizedAction(data, this.upsertNormalized, true)[0];
    }

    upsertRaw(data: any) {
        return this._normalizedAction(data, this.upsertNormalized, true);
    }

    delete(id: string | number | Partial<T>) {
        if (typeof id !== "string" && typeof id !== "number")
            id = this.schema.getPrimaryKey(id);

        if (!this.exists(id)) return false;
        id = utils.asID(id);

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

    insertNormalized(table: TableState<T>): R[] {
        utils.ensureParam("table", table);

        this.dirty = true;
        this.state = {
            ...this.state,
            ids: utils.mergeIds(this.state.ids, table.ids, true),
            byId: { ...this.state.byId, ...table.byId }
        };
        this._updateIndexes(table);

        return table.ids.map(id => this.schema.db.factory.newRecordModel(id, this) as R);
    }

    updateNormalized(table: TableState<T>): R[] {
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

            return this.schema.db.factory.newRecordModel(id, this) as R;
        });

        if (dirty) {
            this.dirty = true;
            this.state = state;
            this._updateIndexes(table);
        }

        return records;
    }

    upsertNormalized(norm: TableState<T>) {
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

    private _normalizedAction(data: Partial<T> | Partial<T>[], action: (norm: TableState) => R[], normalizePKs: boolean): R[] {
        utils.ensureParam("data", data);
        utils.ensureParam("action", action);

        const ctx = new DbNormalizeContext(this.schema, normalizePKs);
        this.schema.normalize(data, ctx);

        const table = ctx.output[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(ctx);
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
                const relation = model[schema.relationName as string];
                if (relation) {
                    relation.delete();
                }
            });
        }
    }
}

export class RecordModel<T extends RecordValue> implements TableRecord<T> {
    table: Table<T>;
    id: string;

    constructor(id: string, table: Table<T>) {
        this.id = utils.ensureParam("id", id);
        this.table = utils.ensureParam("table", table);
    }

    get value() {
        return this.table.getValue(this.id) || <T>{};
    }

    set value(data: T) {
        this.update(data);
    }

    delete() {
        this.table.delete(this.id);
    }

    update(data: Partial<T>) {
        this.table.schema.injectKeys(data, this);
        this.table.update(data);
        return this;
    }
}

export class RecordFieldModel<T> {
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

export class RecordSetModel<R extends TableRecord<T>, T=any> implements TableRecordSet<R, T> {

    readonly table: Table<T, R>;
    readonly schema: FieldSchema;
    readonly owner: { id: string };

    constructor(table: Table<T, R>, schema: FieldSchema, owner: { id: string }) {
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
        return this.ids.map(id => this.table.schema.db.factory.newRecordModel(id, this.table) as R);
    }

    map<M>(callback: (record: R) => M) {
        return this.all().map(callback);
    }

    filter(callback: (record: R) => boolean) {
        return this.all().filter(callback);
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