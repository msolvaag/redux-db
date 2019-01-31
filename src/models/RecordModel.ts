import { Table, TableRecord } from "../types";
import { ensureParamObject, ensureParamString } from "../utils";

export default class RecordModel<T> implements TableRecord<T> {
    table: Table<RecordModel<T>>;
    id: string;

    constructor(id: string, table: Table) {
        this.id = ensureParamString("id", id);
        this.table = ensureParamObject("table", table as Table<RecordModel<T>>);
    }

    get value() {
        return this.table.getValue(this.id) || ({} as T);
    }

    set value(data: T) {
        this.update(data);
    }

    get metadata() {
        return this.table.getMetadata(this.id);
    }

    delete() {
        this.table.delete(this.id);
    }

    update(data: Partial<T>) {
        this.table.schema.injectKeys(data, this);
        this.table.update(data);
        return this;
    }

    setMetadata(data: {}) {
        this.table.setMetadata(this.id, { ...this.metadata, ...data });
    }
}
