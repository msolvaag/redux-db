import { FieldSchema, TableRecord } from "../types";
import { ensureParam, ensureParamString } from "../utils";

export default class RecordFieldModel<T> {
    readonly record: TableRecord<T>;
    readonly schema: FieldSchema;
    readonly name: string;

    constructor(schema: FieldSchema, record: TableRecord<T>) {
        this.schema = ensureParam("schema", schema);
        this.record = ensureParam("record", record);
        this.name = ensureParamString("schema.name", schema.name);
    }

    get value() {
        return this.schema.getRecordValue(this.record);
    }
}
