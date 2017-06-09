import { DatabaseSchema, TableSchema } from "./schema";
export interface Transaction<T extends Record<string, TableModel>> {
    tables: T;
}
export interface TableState {
    byId: {
        [key: string]: any;
    };
    ids: string[];
}
export declare class SessionModel {
    tables: any;
    constructor(state: any, schema: DatabaseSchema);
}
export declare class TableModel<T extends RecordModel = RecordModel> {
    state: TableState;
    schema: TableSchema;
    RecordClass: any;
    constructor(state: TableState, schema: TableSchema);
    all(): T[];
    filter(predicate: (record: T, index: number) => boolean): T[];
    get(id: number | string): T;
    exists(id: number | string): boolean;
}
export declare class RecordModel {
    state: TableState;
    schema: TableSchema;
    constructor(state: any, schema: TableSchema);
    delete(): void;
    update(data: any): void;
}
export declare class RecordSet {
    insert(data: any): void;
}
