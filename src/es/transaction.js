class DbTable {
    constructor(tx, schema) {
    }
}
class DbSession {
    constructor() {
        this.tables = {};
    }
    static create(tx) {
        const snapshot = new DbSession();
        tx.schema.tables.forEach(table => {
            snapshot.tables[table.name] = new DbTable(tx, table);
        });
        Object.freeze && Object.freeze(snapshot);
        return snapshot;
    }
}
export class DbTransaction {
    constructor(state, schema) {
        this._state = state[schema.name] || {};
        this.schema = schema;
    }
    reduce(reducers, action) {
        const session = DbSession.create(this);
        reducers.forEach(reducer => {
            reducer(session, action);
        });
    }
    commit() {
    }
}
