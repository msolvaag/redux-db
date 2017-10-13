import { TableSchema, FieldSchema, TableState, Table, TableRecord, TableRecordSet, Session } from "./schema";
export declare class TableModel<T extends TableRecord<V>, V = {}> implements Table<V> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<V>;
    dirty: boolean;
    constructor(session: Session, state: TableState<V> | undefined, schema: TableSchema);
    all(): T[];
    readonly length: number;
    readonly values: V[];
    filter(predicate: (record: T, index: number) => boolean): T[];
    index(name: string, fk: string): string[];
    get(id: number | string): T;
    getOrDefault(id: number | string): T | null;
    getByFk(fieldName: string, value: number | string): RecordSet<T, V>;
    value(id: number | string): V;
    exists(id: number | string): boolean;
    insert(data: V | V[]): T;
    insertMany(data: V | V[]): T[];
    update(data: Partial<V> | Partial<V>[]): T;
    updateMany(data: Partial<V> | Partial<V>[]): T[];
    upsert(data: Partial<V> | Partial<V>[]): T;
    delete(id: string | number): boolean;
    insertNormalized(table: TableState<V>): T[];
    updateNormalized(table: TableState<V>): T[];
    upsertNormalized(norm: TableState): T[];
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
export declare class RecordField {
    readonly record: TableRecord;
    readonly schema: FieldSchema;
    readonly name: string;
    constructor(schema: FieldSchema, record: TableRecord);
    readonly value: any;
}
export declare class RecordSet<T extends TableRecord<V>, V = {}> implements TableRecordSet<V> {
    readonly table: Table<V>;
    readonly schema: FieldSchema;
    readonly owner: {
        id: string;
    };
    constructor(table: Table<V>, schema: FieldSchema, owner: {
        id: string;
    });
    readonly value: V[];
    readonly ids: string[];
    readonly length: number;
    all(): T[];
    map<M>(callback: (record: T) => M): M[];
    add(data: V | V[]): void;
    remove(data: Partial<V> | Partial<V>[]): void;
    update(data: Partial<V> | Partial<V>[]): this;
    delete(): void;
    private _normalize(data);
}
