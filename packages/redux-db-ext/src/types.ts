import { Table, TableRecord, TableRecordSet, ValueType } from "redux-db";

export interface ExtendedTable<R extends TableRecord> extends Table<R> {
    getMany(id: (string | number)[]): R[];

    /// Gets a set of records referenced by a given field.
    getByFk(fieldName: string, id: string | number): TableRecordSet<R>;

    /// Gets the value of a given field.
    getFieldValue<F extends keyof ValueType<R>>(id: string | number, field: F): ValueType<R>[F] | undefined;
}
