import { RecordValue, Table, TableRecord } from "../types";
import { ensureParam } from "../utils";

export default class RecordModel<T extends RecordValue> implements TableRecord<T> {
    table: Table<RecordModel<T>>;
    id: string;

    constructor(id: string, table: Table) {
        this.id = ensureParam("id", id);
        this.table = ensureParam("table", table as Table<RecordModel<T>>);
    }

    get value() {
        return this.table.getValue(this.id) || ({} as T);
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
