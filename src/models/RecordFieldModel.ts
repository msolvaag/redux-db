import { FieldSchema, TableRecord, TableRecordField } from "../types";
import { ensureParamObject, ensureParamString } from "../utils";

export default class RecordFieldModel<T> implements TableRecordField {
    readonly record: TableRecord<T>;
    readonly schema: FieldSchema;
    readonly name: string;

    constructor(schema: FieldSchema, record: TableRecord<T>) {
        this.schema = ensureParamObject("schema", schema);
        this.name = ensureParamString("schema.name", schema.name);
        this.record = ensureParamObject("record", record);
    }

    get value() {
        return this.schema.getRecordValue(this.record);
    }
}
