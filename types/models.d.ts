import { DatabaseSchema, TableSchema, FieldSchema, TableState, NormalizedState, NormalizeContext, Table, TableRecord, TableRecordSet, Session, RecordValue } from "./def";
export declare class DbNormalizeContext implements NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState;
    emits: {
        [key: string]: any[];
    };
    normalizePKs: boolean;
    constructor(schema: TableSchema, normalizePKs: boolean);
    emit(tableName: string, record: any): void;
}
export declare class TableModel<T extends RecordValue, R extends TableRecord<T>> implements Table<T, R> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<T>;
    dirty: boolean;
    constructor(session: Session, schema: TableSchema, state?: TableState<T>);
    all(): R[];
    readonly length: number;
    getValues(): T[];
    filter(predicate: (record: R, index: number) => boolean): R[];
    map<M>(mapFn: (record: R, index: number) => M): M[];
    index(name: string, fk: string): string[];
    get(id: number | string): R;
    getOrDefault(id: number | string): R | null;
    getByFk(fieldName: string, id: number | string): RecordSetModel<R, T>;
    getFieldValue(id: string | number, field: keyof T): T[keyof T];
    getValue(id: number | string): T | undefined;
    exists(id: number | string): boolean;
    insert(data: T | T[]): R;
    insertMany(data: T | T[]): R[];
    update(data: Partial<T> | Partial<T>[]): R;
    updateMany(data: Partial<T> | Partial<T>[]): R[];
    upsert(data: Partial<T> | Partial<T>[]): R;
    upsertRaw(data: any): R[];
    delete(id: string | number | Partial<T>): boolean;
    deleteAll(): void;
    insertNormalized(table: TableState<T>): R[];
    updateNormalized(table: TableState<T>): R[];
    upsertNormalized(norm: TableState<T>): R[];
    private _normalizedAction(data, action, normalizePKs);
    private _updateIndexes(table);
    private _cleanIndexes(id, record, indexes);
    private _deleteCascade(id);
}
export declare class RecordModel<T extends RecordValue> implements TableRecord<T> {
    table: Table<T>;
    id: string;
    constructor(id: string, table: Table<T>);
    value: T;
    delete(): void;
    update(data: Partial<T>): this;
}
export declare class RecordFieldModel<T> {
    readonly record: TableRecord<T>;
    readonly schema: FieldSchema;
    readonly name: string;
    constructor(schema: FieldSchema, record: TableRecord<T>);
    readonly value: any;
}
export declare class RecordSetModel<R extends TableRecord<T>, T = any> implements TableRecordSet<R, T> {
    readonly table: Table<T, R>;
    readonly schema: FieldSchema;
    readonly owner: {
        id: string;
    };
    constructor(table: Table<T, R>, schema: FieldSchema, owner: {
        id: string;
    });
    readonly value: T[];
    readonly ids: string[];
    readonly length: number;
    all(): R[];
    map<M>(callback: (record: R) => M): M[];
    filter(callback: (record: R) => boolean): R[];
    add(data: T | T[]): void;
    remove(data: Partial<T> | Partial<T>[]): void;
    update(data: Partial<T> | Partial<T>[]): this;
    delete(): void;
    private _normalize(data);
}
