import { DatabaseSchema, TableSchema } from "./schema";


export interface Transaction {

}

export interface Session {
    tables: any;
}

export interface Reducer<T=Session> {
    (session: T, action: any): void;
}

class DbTable {
    constructor(tx: DbTransaction, schema: TableSchema) {


    }
}

class DbSession implements Session {
    tables: any;

    constructor() {
        this.tables = {};
    }

    static create(tx: DbTransaction) {
        const snapshot = new DbSession();

        tx.schema.tables.forEach(table => {
            snapshot.tables[table.name] = new DbTable(tx, table);
        });

        Object.freeze && Object.freeze(snapshot);

        return snapshot;
    }
}


export class DbTransaction implements Transaction {
    private _state: any;
    schema: DatabaseSchema;

    constructor(state: any, schema: DatabaseSchema) {
        this._state = state[schema.name] || {};
        this.schema = schema;
    }

    reduce(reducers: Reducer[], action: any) {

        const session = DbSession.create(this);

        reducers.forEach(reducer => {
            reducer(session, action);
        })
    }

    commit() {

    }
}