import { DatabaseSchema, TableSchema } from "./schema";
export interface DatabaseState {
    [key: string]: TableState;
}
export interface TableState {
    byId: {
        [key: string]: any;
    };
    ids: string[];
}
export declare class SessionModel {
    tables: any;
    state: DatabaseState;
    constructor(state: DatabaseState | undefined, schema: DatabaseSchema);
    update(data: any): void;
}
export declare class TableModel<T extends RecordModel = RecordModel> {
    stateRef: {
        state: TableState;
    };
    schema: TableSchema;
    RecordClass: any;
    _records: RecordModel[];
    constructor(state: TableState | undefined, schema: TableSchema);
    all(): T[];
    filter(predicate: (record: T, index: number) => boolean): T[];
    get(id: number | string): T;
    exists(id: number | string): boolean;
    insert(data: any): any;
    update(data: any): void;
    upsert(data: any): void;
}
export declare class RecordModel {
    state: TableState;
    schema: TableSchema;
    constructor(state: any, schema: TableSchema);
    delete(): void;
    update(data: any): void;
}
export declare class RecordSet<T extends RecordModel = RecordModel> {
    insert(data: any): void;
}
