import { DatabaseSchema, TableSchema, FieldSchema, DatabaseState, TableState, RecordState, NormalizedState } from "./schema";
import * as utils from "./utils";

export interface RecordClass<T=RecordModel> {
    new (id: string, table: TableModel): T;
}

export class Session {
    tables: Record<string, TableModel>;
    state: DatabaseState;

    constructor(state: DatabaseState = {}, schema: DatabaseSchema) {
        this.state = state;
        this.tables = utils.toObject(
            schema.tables.map(t => new TableModel(this, state[t.name], t)), t => t.schema.name);
    }

    upsert(state: NormalizedState, from?: TableModel) {
        Object.keys(state).forEach(name => {
            if (!from || name !== from.schema.name)
                this.tables[name].upsert(state[name]);
        });
    }
}

export class TableModel<T extends RecordModel = RecordModel> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState;

    constructor(session: Session, state: TableState = { ids: [], byId: {} }, schema: TableSchema) {
        this.session = session;
        this.state = state;
        this.schema = schema;
    }

    all(): T[] {
        return this.state.ids.map(id => ModelFactory.default.newRecordModel<T>(id, this));
    }

    filter(predicate: (record: T, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    get(id: number | string): T {
        id = id.toString();
        if (!this.exists(id))
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return ModelFactory.default.newRecordModel<T>(id, this);
    }

    exists(id: number | string) {
        return this.state.byId[id] !== undefined;
    }

    insert(data: any): T {
        return this.insertMany(data)[0];
    }

    insertMany(data: any): T[] {
        const norm = this.schema.normalize(data);
        const table = norm[this.schema.name];

        this.state = { ids: this.state.ids.concat(table.ids), byId: { ...this.state.byId, ...table.byId } };
        this.session.upsert(norm, this);

        return table.ids.map(id => ModelFactory.default.newRecordModel<T>(id, this));
    }

    update(data: any): T {
        return this.updateMany(data)[0];
    }

    updateMany(data: any): T[] {
        const norm = this.schema.normalize(data);
        const table = norm[this.schema.name];

        let state = { ... this.state };
        const records = Object.keys(table.byId).map(id => {
            if (!this.state.byId[id])
                throw new Error(`Failed to apply update. No \"${this.schema.name}\" record with id: ${id} exists.`);

            state.byId[id] = { ...state.byId[id], ...table.byId[id] };
            return ModelFactory.default.newRecordModel<T>(id, this);
        });

        this.state = state;
        this.session.upsert(norm, this);

        return records;
    }

    upsert(data: any): T {
        const pk = this.schema.getPrimaryKey(data);

        if (this.exists(pk))
            return this.get(pk).update(data);
        else
            return this.insert(data);
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
}

export class RecordModel {
    table: TableModel;
    id: string;

    constructor(id: string, table: TableModel) {
        this.id = id;
        this.table = table;
    }

    get value() {
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
    record: RecordModel;
    schema: FieldSchema;
    name: string;

    constructor(schema: FieldSchema, record: RecordModel) {
        this.name = schema.name;
        this.schema = schema;
        this.record = record;
    }

    get value() {
        return this.record.value[this.name];
    }
}

export class RecordSet<T extends RecordModel> {
    insert(data: any) { }
    update(data: any) { }
}

class ModelFactory {
    private _recordClass: { [key: string]: any } = {};

    static default: ModelFactory;

    newRecordModel<T extends RecordModel>(id: string, table: TableModel): T {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass(table.schema)))(id, table);
    }

    newRecordField(schema: FieldSchema, record: RecordModel) {
        if (schema.constraint === "FK" && schema.table === record.table.schema) {
            const refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(`The foreign key ${schema.name} references an unregistered table: ${schema.table.name}`);

            const refId = record.value[schema.name];
            if (refId)
                return this.newRecordModel(refId, record.table);
            else
                return null;
        } else if (schema.constraint === "FK" && schema.table !== record.table.schema) {
            const refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(`The foreign key ${schema.name} references an unregistered table: ${schema.table.name}`);

            const refId = record.value[schema.name];
            if (refId)
                return this.newRecordModel(refId, record.table);
            else
                return null;
        } else
            return new RecordField(schema, record);

    }

    protected _createRecordModelClass(schema: TableSchema) {

        class Record extends RecordModel {
            table: TableModel;

            constructor(id: string, table: TableModel) {
                super(id, table);
            }
        }

        schema.fields.forEach(field => {
            Object.defineProperty(Record.prototype, field.name, {
                get: function (this: Record) {
                    return ModelFactory.default.newRecordField(field, this);
                },
                set: function (this: Record, value: any) {
                    return this.update({ [field.name]: value });
                }
            });
        });

        schema.relations.forEach(field => {
            Object.defineProperty(Record.prototype, field.name, {
                get: function (this: Record) {
                    return ModelFactory.default.newRecordField(field, this);
                },
                set: function (this: Record, value: any) {
                    throw new Error("Invalid attempt to set an foreign table relation field.");
                }
            });
        });

        return Record;
    }
}