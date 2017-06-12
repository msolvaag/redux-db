import { DatabaseSchema, TableSchema, FieldSchema, DatabaseState, TableState, NormalizedState } from "./schema";
export interface Table {
    session: Session;
    schema: TableSchema;
    state: TableState;
    upsert: (data: any) => TableRecord;
    get: (id: string | number) => TableRecord;
    getOrDefault: (id: string | number) => TableRecord | null;
    all(): TableRecord[];
    filter: (callback: (record: TableRecord) => boolean) => TableRecord[];
    exists: (id: string | number) => boolean;
    update: (data: any) => TableRecord;
    updateMany: (data: any) => TableRecord[];
    delete: (id: string | number) => void;
}
export interface TableRecord {
    id: string;
    table: Table;
    value: any;
    update(data: any): TableRecord;
    delete(): void;
}
export declare class Session {
    tables: any;
    state: DatabaseState;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema);
    upsert(state: NormalizedState, from?: Table): void;
    commit(): any;
}
export declare class TableModel<T extends TableRecord> implements Table {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState;
    constructor(session: Session, state: TableState | undefined, schema: TableSchema);
    all(): T[];
    filter(predicate: (record: T, index: number) => boolean): T[];
    get(id: number | string): T;
    getOrDefault(id: number | string): T | null;
    exists(id: number | string): boolean;
    insert(data: any): T;
    insertMany(data: any): T[];
    update(data: any): T;
    updateMany(data: any): T[];
    upsert(data: any): T;
    delete(id: string): void;
    insertNormalized(table: TableState): T[];
    updateNormalized(table: TableState): T[];
    upsertNormalized(norm: TableState): T[];
    private _normalizedAction(data, action);
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
    readonly records: T[];
    readonly table: Table;
    readonly referencedFrom: RecordField;
    constructor(records: T[], table: Table, referencedFrom: RecordField);
    map<M>(callback: (record: T) => M): M[];
    insert(data: any): void;
    update(data: any): void;
}
