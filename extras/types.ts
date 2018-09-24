import { RecordValue, Table, TableRecord, TableRecordSet } from "redux-db";

export interface ExtendedTable<
    T extends RecordValue = RecordValue,
    R extends TableRecord<T> = TableRecord<T>
    > extends Table<T, R> {
    /// Gets multiple records by ids.
    getMany(id: (string | number)[]): R[];

    /// Gets a set of records referenced by a given field.
    getByFk(fieldName: string, id: string | number): TableRecordSet<R, T>;

    /// Gets the value of a given field.
    getFieldValue<F extends keyof T>(id: string | number, field: F): T[F] | undefined;
}
