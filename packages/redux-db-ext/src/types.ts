import { Table, TableRecord, TableRecordSet, ValueType } from "redux-db";

/**
 * Adds additional functionality to the base TableModel class.
 *
 * @export
 * @interface ExtendedTable
 * @extends {Table<R>}
 * @template R
 */
export interface ExtendedTable<R extends TableRecord> extends Table<R> {
    /**
     * Gets an array of records matched by multiple ids.
     *
     * @param {((string | number)[])} ids
     * @returns {R[]}
     * @memberof ExtendedTable
     */
    getMany(ids: (string | number)[]): R[];

    /**
     * Gets a set of records referenced by a given field.
     *
     * @param {string} fieldName
     * @param {(string | number)} id
     * @returns {TableRecordSet<R>}
     * @memberof ExtendedTable
     */
    getByFk(fieldName: string, id: string | number): TableRecordSet<R>;

    /**
     * Gets the value of a given field.
     *
     * @template F
     * @param {(string | number)} id
     * @param {F} field
     * @returns {(ValueType<R>[F] | undefined)}
     * @memberof ExtendedTable
     */
    getFieldValue<F extends keyof ValueType<R>>(id: string | number, field: F): ValueType<R>[F] | undefined;
}
