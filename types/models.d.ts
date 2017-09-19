import { TableSchema, FieldSchema, TableState, Table, TableRecord, Session } from "./schema";
export declare class TableModel<T extends TableRecord> implements Table {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState;
    constructor(session: Session, state: TableState | undefined, schema: TableSchema);
    all(): T[];
    readonly length: number;
    readonly values: any[];
    filter(predicate: (record: T, index: number) => boolean): T[];
    index(name: string, fk: string): string[];
    get(id: number | string): T;
    value(id: number | string): any;
    getOrDefault(id: number | string): T | null;
    exists(id: number | string): boolean;
    insert(data: any): T;
    insertMany(data: any): T[];
    update(data: any): T;
    updateMany(data: any): T[];
    upsert(data: any): T;
    delete(id: string | number): void;
    insertNormalized(table: TableState): T[];
    updateNormalized(table: TableState): T[];
    upsertNormalized(norm: TableState): T[];
    private _normalizedAction(data, action);
    private _updateIndexes(table);
}
export declare class RecordModel<T> implements TableRecord {
    table: Table;
    id: string;
    constructor(id: string, table: Table);
    readonly value: T;
    delete(): void;
    update(data: any): this;
}
export declare class RecordField {
    readonly record: TableRecord;
    readonly schema: FieldSchema;
    readonly name: string;
    constructor(schema: FieldSchema, record: TableRecord);
    readonly value: any;
}
export declare class RecordSet<T extends TableRecord> {
    readonly table: Table;
    readonly schema: FieldSchema;
    readonly owner: TableRecord;
    constructor(table: Table, schema: FieldSchema, owner: TableRecord);
    readonly value: any[];
    readonly ids: string[];
    readonly length: number;
    all(): T[];
    map<M>(callback: (record: T) => M): M[];
    add(data: any): void;
    remove(data: any): void;
    update(data: any): this;
    delete(): void;
    private _normalize(data);
}
