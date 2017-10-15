import { TableSchema, FieldSchema, TableState, Table, TableRecord, TableRecordSet, Session } from "./schema";
export declare class TableModel<R extends TableRecord<T>, T = any> implements Table<T> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<T>;
    dirty: boolean;
    constructor(session: Session, state: TableState<T> | undefined, schema: TableSchema);
    all(): R[];
    readonly length: number;
    readonly values: T[];
    filter(predicate: (record: R, index: number) => boolean): R[];
    index(name: string, fk: string): string[];
    get(id: number | string): R;
    getOrDefault(id: number | string): R | null;
    getByFk(fieldName: string, value: number | string): RecordSet<R, T>;
    value(id: number | string): T;
    exists(id: number | string): boolean;
    insert(data: T | T[]): R;
    insertMany(data: T | T[]): R[];
    update(data: Partial<T> | Partial<T>[]): R;
    updateMany(data: Partial<T> | Partial<T>[]): R[];
    upsert(data: Partial<T> | Partial<T>[]): R;
    delete(id: string | number): boolean;
    insertNormalized(table: TableState<T>): R[];
    updateNormalized(table: TableState<T>): R[];
    upsertNormalized(norm: TableState): R[];
    private _normalizedAction(data, action);
    private _updateIndexes(table);
    private _cleanIndexes(id, record, indexes);
    private _deleteCascade(id);
}
export declare class RecordModel<T> implements TableRecord<T> {
    table: Table<T>;
    id: string;
    constructor(id: string, table: Table<T>);
    readonly value: T;
    delete(): void;
    update(data: Partial<T>): this;
}
export declare class RecordField<T> {
    readonly record: TableRecord<T>;
    readonly schema: FieldSchema;
    readonly name: string;
    constructor(schema: FieldSchema, record: TableRecord<T>);
    readonly value: any;
}
export declare class RecordSet<R extends TableRecord<T>, T = any> implements TableRecordSet<T> {
    readonly table: Table<T>;
    readonly schema: FieldSchema;
    readonly owner: {
        id: string;
    };
    constructor(table: Table<T>, schema: FieldSchema, owner: {
        id: string;
    });
    readonly value: T[];
    readonly ids: string[];
    readonly length: number;
    all(): R[];
    map<M>(callback: (record: R) => M): M[];
    add(data: T | T[]): void;
    remove(data: Partial<T> | Partial<T>[]): void;
    update(data: Partial<T> | Partial<T>[]): this;
    delete(): void;
    private _normalize(data);
}
