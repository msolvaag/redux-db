import { SchemaDDL, DatabaseSchema, FieldSchema, TableSchema, Table, DatabaseOptions, SessionOptions, Session, DatabaseState, NormalizedState } from "./schema";
import { RecordModel, RecordSet, TableModel } from "./models";
import * as utils from "./utils";

export interface Reducer {
    (session: any, action: any): void;
}

const defaultOptions = {
};

export const createDatabase = (schema: SchemaDDL, options?: DatabaseOptions) => {
    return new Database(schema, options || defaultOptions);
};

export class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;

    private _cache: any = {};

    constructor(schema: SchemaDDL, options: DatabaseOptions) {
        this.options = options;
        this.tables = Object.keys(schema).map(tableName => new TableSchema(tableName, schema[tableName], options.onNormalize ? options.onNormalize[tableName] : undefined));
        this.tables.forEach(table => table.connect(this.tables));
    }

    combineReducers(...reducers: Reducer[]) {
        return (state: any = {}, action: any) => {
            const session = this.createSession(state);

            reducers.forEach(reducer => {
                reducer(session.tables, action);
            });

            return session.commit();
        };
    }

    createSession(state: any, options?: SessionOptions) {
        return new DatabaseSession(state, this, options || { readOnly: false });
    }

    createSelector(dbName: string, selector: (session: any, props: any) => any) {
        return (state: any, props: any) => {
            const session = this.createSession(state[dbName], { readOnly: true });
            return selector(session.tables, props);
        };
    }

    cache<T>(key: string, valueFn?: () => T) {
        return (this._cache[key] || (valueFn && (this._cache[key] = valueFn()))) as T;
    }

    clearCache(key: string) {
        delete this._cache[key];
    }
}

export class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: any;
    state: DatabaseState;
    options: SessionOptions;

    constructor(state: DatabaseState = {}, schema: DatabaseSchema, options: SessionOptions) {
        this.state = state;
        this.db = schema;
        this.options = options;
        this.tables = utils.toObject(
            schema.tables.map(t => new TableModel(this, state[t.name], t)), t => t.schema.name);
    }

    upsert(state: NormalizedState, from?: Table) {
        if (this.options.readOnly) throw new Error("Invalid attempt to alter a readonly session.");

        Object.keys(state).forEach(name => {
            if (!from || name !== from.schema.name) {
                this.tables[name].upsertNormalized(state[name]);
            }
        });
    }

    commit() {
        if (this.options.readOnly) throw new Error("Invalid attempt to alter a readonly session.");

        Object.keys(this.tables).forEach(table => {
            const oldState = this.state[table];
            const newState = this.tables[table].state;

            if (oldState !== newState)
                this.state = { ...this.state, [table]: newState };
        });
        return this.state as any;
    }

}

export { RecordModel as Record, RecordSet, TableModel as Table };
