import { DatabaseSchema, TableSchema, FieldSchema, DatabaseState, TableState, NormalizedState } from "./schema";
export declare class Session {
    tables: Record<string, TableModel>;
    state: DatabaseState;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema);
    upsert(state: NormalizedState, from?: TableModel): void;
}
export declare class TableModel<T extends RecordModel = RecordModel> {
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
    table: TableModel;
    id: string;
    constructor(id: string, table: TableModel);
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
    readonly table: TableModel;
    readonly referencedFrom: RecordField;
    constructor(records: T[], table: TableModel, referencedFrom: RecordField);
    map<M>(callback: (record: T) => M): M[];
    insert(data: any): void;
    update(data: any): void;
}
