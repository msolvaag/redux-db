import errors from "../errors";
import { FieldSchema, PartialValues, Table, TableRecord, TableRecordSet, Values } from "../types";
import { ensureParamObject } from "../utils";

export default class RecordSetModel<R extends TableRecord> implements TableRecordSet<R> {
    readonly table: Table<R>;
    readonly schema: FieldSchema;
    readonly owner: {
        id: string;
    };

    constructor(table: Table<R>, schema: FieldSchema, owner: { id: string; }) {
        this.table = ensureParamObject("table", table);
        this.schema = ensureParamObject("schema", schema);
        this.owner = ensureParamObject("owner", owner, "id");
    }

    get ids() {
        return this.table.getIndex(this.schema.name, this.owner.id);
    }

    get length() {
        return this.ids.length;
    }

    all() {
        return this.ids.map(id => this.table.get(id));
    }

    values() {
        return this.ids.map(id => {
            const value = this.table.getValue(id);
            if (!value) throw new Error(errors.recordNotFound(this.table.schema.name, id));
            return value;
        });
    }

    add(data: Values<R>) {
        return this.table.insert(this._normalize(data));
    }

    remove(data: PartialValues<R>) {
        const ids = this._normalize(data).map(obj =>
            this.table.schema.ensurePrimaryKey(obj));
        return this.table.delete(ids);
    }

    update(data: PartialValues<R>) {
        return this.table.update(this._normalize(data));
    }

    delete() {
        this.table.delete(this.ids);
    }

    private _normalize(data: PartialValues<R>) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    }
}
