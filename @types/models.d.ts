import { DatabaseSchema, TableSchema, FieldSchema, DatabaseState, TableState, NormalizedState } from "./schema";
export interface Table {
    session: Session;
    schema: TableSchema;
    state: TableState;
    upsert: (data: any) => RecordModel;
    get: (id: string | number) => RecordModel;
    getOrDefault: (id: string | number) => RecordModel | null;
    all(): RecordModel[];
    filter: (callback: (record: RecordModel) => boolean) => RecordModel[];
    exists: (id: string | number) => boolean;
    update: (data: any) => RecordModel;
    updateMany: (data: any) => RecordModel[];
    delete: (id: string | number) => void;
}
export declare class Session {
    tables: Record<string, Table>;
    state: DatabaseState;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema);
    upsert(state: NormalizedState, from?: Table): void;
    commit(): any;
}
export declare class TableModel<T extends RecordModel> implements Table {
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
}
export declare class RecordModel {
    table: Table;
    id: string;
    constructor(id: string, table: Table);
    readonly value: any;
    delete(): void;
    update(data: any): this;
}
export declare class RecordField {
    readonly record: RecordModel;
    readonly schema: FieldSchema;
    readonly name: string;
    constructor(schema: FieldSchema, record: RecordModel);
    readonly value: any;
}
export declare class RecordSet<T extends RecordModel> {
    readonly records: T[];
    readonly table: Table;
    readonly referencedFrom: RecordField;
    constructor(records: T[], table: Table, referencedFrom: RecordField);
    map<M>(callback: (record: T) => M): M[];
    insert(data: any): void;
    update(data: any): void;
}
