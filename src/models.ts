import { DatabaseSchema, TableSchema, FieldSchema } from "./schema";



export interface Transaction<T extends Record<string, TableModel>> {
    tables: T;
}

export interface TableState {
    byId: { [key: string]: any };
    ids: string[];
}

class FieldModel {
    constructor(state: any, schema: FieldSchema) {

    }
}

const createPrototype = (schema: TableSchema) => {

    class ModelClass extends RecordModel {
        constructor(state: any, schema: TableSchema) {
            super(state, schema);
        }
    }

    schema.fields.forEach(field => {
        Object.defineProperty(ModelClass, field.name, {});
    });

    return ModelClass;
}

export class SessionModel {
    tables: any;

    constructor(state: any, schema: DatabaseSchema) {
        this.tables = schema.tables.map(t => new TableModel(state[t.name], t));
    }
}

export class TableModel<T extends RecordModel = RecordModel> {
    state: TableState;
    schema: TableSchema;

    RecordClass: any;

    constructor(state: TableState, schema: TableSchema) {
        this.state = state;
        this.schema = schema;

        this.RecordClass = createPrototype(schema);
    }

    all(): T[] {
        const records = this.state.ids.map(id => this.state.byId[id]);
        return records.map(r => new this.RecordClass(r, this.schema));
    }

    filter(predicate: (record: T, index: number) => boolean) {
        return this.all().filter(predicate);
    }

    get(id: number | string): T {
        const record = this.state.byId[id];
        if (!record)
            throw new Error(`No \"${this.schema.name}\" record with id: ${id} exists.`);

        return new this.RecordClass(record, this.schema);
    }

    exists(id: number | string) {
        return this.state.byId[id] !== undefined;
    }
}

export class RecordModel {
    state: TableState;
    schema: TableSchema;

    constructor(state: any, schema: TableSchema) {
        this.state = state;
        this.schema = schema;
    }

    delete() {

    }

    update(data: any) {

    }
}

export class RecordSet<T extends RecordModel = RecordModel> {
    insert(data: any) {

    }
}