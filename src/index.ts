import { SchemaDDL, DatabaseSchema, TableSchema, Table, TableRecord, TableRecordSet, DatabaseOptions, SessionOptions, Session, ModelFactory, TableMap, DatabaseState, NormalizeContext, Normalizer, MissingKeyHook, Reducer } from "./def";
import * as utils from "./utils";
import { DefaultModelFactory } from "./factory";
export * from "./models";

const defaultOptions: DatabaseOptions = {
    cascadeAsDefault: false
};

export const createDatabase = (schema: SchemaDDL, options?: DatabaseOptions) => new Database(schema, options);

export class Database implements DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks: { [key: string]: Normalizer };
    onMissingPk?: MissingKeyHook;
    factory: ModelFactory;

    constructor(schema: SchemaDDL, options?: DatabaseOptions) {
        utils.ensureParam("schema", schema);

        this.options = { ...defaultOptions, ...options };
        this.normalizeHooks = this.options.onNormalize || {};
        this.factory = this.options.factory || new DefaultModelFactory();
        this.onMissingPk = this.options.onMissingPk || undefined;

        this.tables = Object.keys(schema).map(tableName => this.factory.newTableSchema(this, tableName, schema[tableName]));
        this.tables.forEach(table => table.connect(this.tables));
    }

    combineReducers(...reducers: Reducer[]) {
        return (state: any = {}, action: any) => this.reduce(state, action, reducers);
    }

    reduce(state: any, action: any, reducers: Reducer | Reducer[], arg?: any) {
        const session = this.createSession(state);

        utils.ensureArray(reducers).forEach(reducer => reducer(session.tables, action, arg));

        return session.commit();
    }

    createSession(state: any, options?: SessionOptions) {
        return new DatabaseSession(state, this, { readOnly: false, ...options });
    }

    selectTables<T extends TableMap = any>(state: any) {
        const tableSchemas = Object.keys(state).map(tableName => {

            const tableSchema = this.tables.filter(s => s.name === tableName)[0];
            if (!tableSchema)
                throw new Error(`Could not select table. The table "${tableName}" is not defined in schema.`);

            return tableSchema;
        });

        return DatabaseSession.Partial<T>(state, tableSchemas, this);
    }

    selectTable<T extends Table = any>(tableState: any, schemaName?: string) {
        const name = schemaName || tableState["name"];
        if (!name)
            throw new Error("Failed to select table. Could not identify table schema.");

        return this.selectTables({ [name]: tableState })[name] as T;
    }
}

export class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: TableMap;
    state: DatabaseState;
    options: SessionOptions;

    constructor(state: DatabaseState = {}, schema: DatabaseSchema, options: SessionOptions) {
        this.state = state;
        this.db = schema;
        this.options = options;
        this.tables = utils.toObject(
            schema.tables.map(t => this.db.factory.newTableModel(this, state[t.name], t)), t => t.schema.name);
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

    static Partial<T extends TableMap = any>(state: any, tableSchemas: TableSchema[], db: Database) {
        return new DatabaseSession(state, {
            tables: tableSchemas,
            options: db.options,
            factory: db.factory,
            normalizeHooks: db.normalizeHooks
        }, { readOnly: true }).tables as T;
    }
}

export { Table, TableRecord, TableRecordSet, TableMap, Reducer, SchemaDDL as Schema, DefaultModelFactory };
