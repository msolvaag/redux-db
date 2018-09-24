import { FieldSchema, Table, TableRecord, TableRecordSet } from "../types";
import { ensureParam } from "../utils";

export default class RecordSetModel<R extends TableRecord<T>, T = any> implements TableRecordSet<R, T> {
    readonly table: Table<T, R>;
    readonly schema: FieldSchema;
    readonly owner: {
        id: string;
    };

    constructor(table: Table<T, R>, schema: FieldSchema, owner: {
        id: string;
    }) {
        this.table = ensureParam("table", table);
        this.schema = ensureParam("schema", schema);
        this.owner = ensureParam("owner", owner);
    }

    get ids() {
        return this.table.getIndex(this.schema.name, this.owner.id);
    }

    get length() {
        return this.ids.length;
    }

    all() {
        return this.ids.map(id => this.table.schema.db.factory.newRecordModel(id, this.table) as R);
    }

    getValue() {
        return this.all().map(r => r.value);
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
        this.table.delete(this.ids);
    }

    private _normalize(data: Partial<T> | Partial<T>[]) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    }
}
