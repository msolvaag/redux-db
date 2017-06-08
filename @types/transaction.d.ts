import { DatabaseSchema } from "./schema";
export interface Transaction {
}
export interface Session {
    tables: any;
}
export interface Reducer<T = Session> {
    (session: T, action: any): void;
}
export declare class DbTransaction implements Transaction {
    private _state;
    schema: DatabaseSchema;
    constructor(state: any, schema: DatabaseSchema);
    reduce(reducers: Reducer[], action: any): void;
    commit(): void;
}
