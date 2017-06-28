import { SchemaDDL, DatabaseSchema, FieldSchema, TableSchema, Table, DatabaseOptions, SessionOptions, Session, DatabaseState, NormalizeContext, NormalizedState, Normalizer } from "./schema";
import { RecordModel, RecordSet, TableModel } from "./models";
import * as utils from "./utils";

export interface Reducer {
    (session: any, action: any): void;
}

const defaultOptions = {
};

export const createDatabase = (schema: SchemaDDL, options?: DatabaseOptions) => {
    return new Database(schema, { ...defaultOptions, ...options });
};

export class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks: { [key: string]: Normalizer };

    private _cache: any = {};

    constructor(schema: SchemaDDL, options: DatabaseOptions) {
        this.options = options;
        this.normalizeHooks = options.onNormalize || {};
        this.tables = Object.keys(schema).map(tableName => new TableSchema(this, tableName, schema[tableName]));
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
        return new DatabaseSession(state, this, { readOnly: false, ...options });
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

    upsert(ctx: NormalizeContext) {
        if (this.options.readOnly) throw new Error("Invalid attempt to alter a readonly session.");

        Object.keys(ctx.output).forEach(name => {
            if (name !== ctx.schema.name) {
                this.tables[name].upsertNormalized(ctx.output[name]);
            }
        });
        Object.keys(ctx.emits).forEach(name => {
            if (name !== ctx.schema.name) {
                this.tables[name].upsert(ctx.emits[name]);
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
