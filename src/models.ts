import { DatabaseSchema, TableSchema, FieldSchema } from "./schema";
import { Session, TableState } from "./session";


export class TableModel<T extends RecordModel = RecordModel> {
    stateRef: { state: TableState };
    schema: TableSchema;

    RecordClass: any;

    _records: RecordModel[] = [];

    constructor(state: TableState = { ids: [], byId: {} }, schema: TableSchema) {
        this.stateRef = { state: state };
        this.schema = schema;
    }

    all(): T[] {
        const records = this.stateRef.state.ids.map(id => this.stateRef.state.byId[id]);
        return this._records = records.map(r => new this.RecordClass(r, this.schema));
    }

    filter(predicate: (record: T, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    get(id: number | string): T {
        const record = this.stateRef.state.byId[id];
        if (!record)
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return new this.RecordClass(record, this.schema);
    }

    exists(id: number | string) {
        return this.stateRef.state.byId[id] !== undefined;
    }

    insert(data: any) {
        const record = this.schema.normalize(data);
        const pk = this.schema.getPrimaryKey(record);

        const { byId, ids } = this.stateRef.state;
        this.stateRef.state = { byId: { ...byId, [pk]: record }, ids: [...ids, pk] };

        return new this.RecordClass(record, this.schema);
    }

    update(data: any) {

    }

    upsert(data: any) {

    }
}

export class RecordModel {
    state: any;
    schema: TableSchema;
    session: Session;

    constructor(state: any, schema: TableSchema) {
        this.state = state;
        this.schema = schema;
    }

    get id() {
        return this.schema.getPrimaryKey(this.state);
    }

    delete() {

    }

    update(data: any) {
        this.state = { ...this.state, ...data };
    }
}

export class RecordSet<T extends RecordModel = RecordModel> {

    insert(data: any) {

    }

    update(data: any) {

    }
}


class FieldModel {
    session: Session;
    schema: FieldSchema;

    constructor(session: Session, schema: FieldSchema) {
        this.session = session;
        this.schema = schema;
    }

    get value() {
        return this.schema.getValue(this.session);
    }
}