import { DatabaseSchema, TableSchema, FieldSchema, DatabaseState, TableState, NormalizedState } from "./schema";
import * as utils from "./utils";

export interface Table {
    session: Session;
    schema: TableSchema;
    state: TableState;

    get: (id: string | number) => TableRecord;
    getOrDefault: (id: string | number) => TableRecord | null;
    all(): TableRecord[];
    filter: (callback: (record: TableRecord) => boolean) => TableRecord[];
    exists: (id: string | number) => boolean;

    upsert: (data: any) => TableRecord;
    insert: (data: any) => TableRecord;
    insertMany: (data: any) => TableRecord[];
    update: (data: any) => TableRecord;
    updateMany: (data: any) => TableRecord[];
    delete: (id: string | number) => void;
}

export interface TableRecord {
    id: string;
    table: Table;
    value: any;

    update(data: any): TableRecord;
    delete(): void;
}

export class Session {
    tables: any;
    state: DatabaseState;

    constructor(state: DatabaseState = {}, schema: DatabaseSchema) {
        this.state = state;
        this.tables = utils.toObject(
            schema.tables.map(t => new TableModel(this, state[t.name], t)), t => t.schema.name);
    }

    upsert(state: NormalizedState, from?: Table) {
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
                this.state = { ...this.state, [table]: newState };
        });
        return this.state as any;
    }
}

export class TableModel<T extends TableRecord> implements Table {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState;

    constructor(session: Session, state: TableState = { ids: [], byId: {} }, schema: TableSchema) {
        this.session = session;
        this.state = state;
        this.schema = schema;
    }

    all(): T[] {
        return this.state.ids.map(id => ModelFactory.default.newRecord<T>(id, this));
    }

    filter(predicate: (record: T, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    get(id: number | string): T {
        id = id.toString();
        if (!this.exists(id))
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return ModelFactory.default.newRecord<T>(id, this);
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
            ids = this.state.ids.slice();
        delete byId[id];
        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);

        this.state = { ...this.state, byId: byId, ids: ids };
    }

    insertNormalized(table: TableState) {
        this.state = { ids: this.state.ids.concat(table.ids), byId: { ...this.state.byId, ...table.byId } };

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

        if (dirty)
            this.state = state;

        return records;
    }

    upsertNormalized(norm: TableState): T[] {
        const toUpdate: TableState = { ids: [], byId: {} };
        const toInsert: TableState = { ids: [], byId: {} };

        norm.ids.forEach(id => {
            if (this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            } else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });

        return (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat(
            (toInsert.ids.length ? this.insertNormalized(toInsert) : []));
    }

    private _normalizedAction(data: any, action: (norm: TableState) => T[]): T[] {
        const norm = this.schema.normalize(data);
        const table = norm[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(norm, this);
        return records;
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
        return this.table.state.byId[this.id];
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
        return this.record.value[this.name];
    }
}

export class RecordSet<T extends TableRecord> {

    readonly table: Table;
    readonly schema: FieldSchema;
    readonly owner: TableRecord;

    constructor(table: Table, schema: FieldSchema, owner: TableRecord) {

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

            return refTable.getOrDefault(record.value[schema.name]);
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
            if (field.constraint == "FK") {
                const name = field.relationName || field.propName;
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