import {
    DatabaseSchema,
    TableSchema,
    FieldSchema,
    DatabaseState,
    TableState,
    NormalizedState,
    Table,
    TableRecord,
    Session
} from "./schema";
import * as utils from "./utils";

export class TableModel<T extends TableRecord> implements Table {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState;

    constructor(session: Session, state: TableState = { ids: [], byId: {}, indexes: {} }, schema: TableSchema) {
        this.session = session;
        this.state = state;
        this.schema = schema;
    }

    all(): T[] {
        return this.state.ids.map(id => ModelFactory.default.newRecord<T>(id, this));
    }

    get length() {
        return this.state.ids.length;
    }

    filter(predicate: (record: T, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    index(name: string, fk: string): string[] {
        if (this.state.indexes[name] && this.state.indexes[name][fk])
            return this.state.indexes[name][fk];
        else
            return [];
    }

    get(id: number | string): T {
        id = id.toString();
        if (!this.exists(id))
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return ModelFactory.default.newRecord<T>(id, this);
    }

    value(id: number | string) {
        if (typeof id === "number")
            id = id.toString();
        return this.state.byId[id];
    }

    getOrDefault(id: number | string) {
        return this.exists(id) ? this.get(id) : null;
    }

    exists(id: number | string) {
        return this.state.byId[id] !== undefined;
    }

    insert(data: any): T {
        return this.insertMany(data)[0];
    }

    insertMany(data: any): T[] {
        return this._normalizedAction(data, this.insertNormalized);
    }

    update(data: any): T {
        return this.updateMany(data)[0];
    }

    updateMany(data: any): T[] {
        return this._normalizedAction(data, this.updateNormalized);
    }

    upsert(data: any) {
        return this._normalizedAction(data, this.upsertNormalized)[0];
    }

    delete(id: string) {
        const byId = { ...this.state.byId },
            ids = this.state.ids.slice(),
            indexes = { ...this.state.indexes },
            ref = byId[id];
        delete byId[id];
        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);

        if (ref) {
            const fks = this.schema.getForeignKeys(ref);
            fks.forEach(fk => {
                const fkIdx = indexes[fk.name][fk.value].indexOf(id);
                if (fkIdx >= 0) {
                    const idxBucket = indexes[fk.name][fk.value].slice();
                    idxBucket.splice(fkIdx, 1);

                    indexes[fk.name][fk.value] = idxBucket;
                }
            });
        }

        this.state = { ...this.state, byId: byId, ids: ids, indexes: indexes };
    }

    insertNormalized(table: TableState) {
        this.state = {
            ...this.state,
            ids: utils.arrayMerge(this.state.ids, table.ids),
            byId: { ...this.state.byId, ...table.byId }
        };
        this._updateIndexes(table);

        return table.ids.map(id => ModelFactory.default.newRecord<T>(id, this));
    }

    updateNormalized(table: TableState) {
        let state = { ... this.state }, dirty = false;
        const records = Object.keys(table.byId).map(id => {
            if (!this.state.byId[id])
                throw new Error(`Failed to apply update. No \"${this.schema.name}\" record with id: ${id} exists.`);

            const newRecord = table.byId[id];
            const oldRecord = state.byId[id];
            const isModified = this.schema.isModified(oldRecord, newRecord);

            if (isModified) {
                state.byId[id] = { ...oldRecord, ...newRecord };
                dirty = true;
            }

            return ModelFactory.default.newRecord<T>(id, this);
        });

        if (dirty) {
            this.state = state;
            this._updateIndexes(table);
        }

        return records;
    }

    upsertNormalized(norm: TableState): T[] {
        const toUpdate: TableState = { ids: [], byId: {}, indexes: {} };
        const toInsert: TableState = { ids: [], byId: {}, indexes: {} };

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

    private _normalizedAction(data: any, action: (norm: TableState) => T[]): T[] {
        const norm = this.schema.normalize(data);
        const table = norm.output[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(norm);
        return records;
    }

    private _updateIndexes(table: TableState) {
        Object.keys(table.indexes).forEach(key => {
            const idx = this.state.indexes[key] || (this.state.indexes[key] = {});

            Object.keys(table.indexes[key]).forEach(fk => {
                const idxBucket = idx[fk] || (idx[fk] = []);
                idx[fk] = utils.arrayMerge(idxBucket, table.indexes[key][fk]);
            });
        });
    }
}

export class RecordModel<T> implements TableRecord {
    table: Table;
    id: string;

    constructor(id: string, table: Table) {
        this.id = id;
        this.table = table;
    }

    get value(): T {
        return this.table.value(this.id);
    }

    delete() {
        this.table.delete(this.id);
    }

    update(data: any) {
        this.table.update(data);
        return this;
    }
}

export class RecordField {
    readonly record: TableRecord;
    readonly schema: FieldSchema;
    readonly name: string;

    constructor(schema: FieldSchema, record: TableRecord) {
        this.name = schema.name;
        this.schema = schema;
        this.record = record;
    }

    get value() {
        return this.schema.getRecordValue(this.record);
    }
}

export class RecordSet<T extends TableRecord> {

    readonly table: Table;
    readonly schema: FieldSchema;
    readonly owner: TableRecord;
    readonly key: string;

    constructor(table: Table, schema: FieldSchema, owner: TableRecord) {

        this.table = table;
        this.schema = schema;
        this.owner = owner;
        this.key = this.schema.table.name + "." + this.schema.name + "." + this.owner.id;
    }

    get value() {
        return this.map(r => r.value);
    }

    get ids() {
        return this.table.index(this.schema.name, this.owner.id);
    }

    get length() {
        return this.all().length;
    }

    all() {
        return this.ids.map(id => ModelFactory.default.newRecord<T>(id, this.table));
    }

    map<M>(callback: (record: T) => M) {
        return this.all().map(callback);
    }

    add(data: any) {
        this.table.insert(this._normalize(data));
    }

    remove(data: any) {
        this._normalize(data).forEach(obj => {
            const pk = this.table.schema.getPrimaryKey(obj);
            this.table.delete(pk);
        });
    }

    update(data: any) {
        this.table.update(this._normalize(data));
    }

    delete() {
        this.all().forEach(obj => this.table.delete(obj.id));
    }

    private _normalize(data: any) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    }
}

class ModelFactory {
    private _recordClass: { [key: string]: any } = {};

    static default: ModelFactory = new ModelFactory();

    newRecord<T extends TableRecord>(id: string, table: Table): T {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass(table.schema)))(id, table);
    }

    newRecordField(schema: FieldSchema, record: TableRecord) {
        if (schema.constraint === "FK" && schema.table === record.table.schema && schema.references) {
            const refTable = record.table.session.tables[schema.references] as Table;
            if (!refTable)
                throw new Error(`The foreign key ${schema.name} references an unregistered table: ${schema.table.name}`);

            return refTable.getOrDefault(schema.getRecordValue(record));
        } else if (schema.constraint === "FK" && schema.table !== record.table.schema && schema.relationName) {
            const refTable = record.table.session.tables[schema.table.name] as Table;

            return new RecordSet(refTable, schema, record);
        } else
            return new RecordField(schema, record);
    }

    protected _createRecordModelClass(schema: TableSchema) {

        class Record extends RecordModel<any> {
            table: Table;
            _fields: { [key: string]: any } = {};

            constructor(id: string, table: Table) {
                super(id, table);
            }
        }

        schema.fields.concat(schema.relations).forEach(field => {
            if (field.constraint != "PK") {
                const name = field.table !== schema ? field.relationName : field.propName;
                if (name)
                    Object.defineProperty(Record.prototype, name, {
                        get: function (this: Record) {
                            return this._fields[name] || (this._fields[name] = ModelFactory.default.newRecordField(field, this));
                        }
                    });
            }
        });

        return Record;
    }
}