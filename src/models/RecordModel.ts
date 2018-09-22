import { RecordValue, Table, TableRecord } from "../types";
import { ensureParam } from "../utils";

export default class RecordModel<T extends RecordValue> implements TableRecord<T> {
    table: Table<T>;
    id: string;

    constructor(id: string, table: Table<T>) {
        this.id = ensureParam("id", id);
        this.table = ensureParam("table", table);
    }

    get value() {
        return this.table.getValue(this.id) || {} as T;
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
