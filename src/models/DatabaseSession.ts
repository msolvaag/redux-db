import errors from "../errors";
import {
    DatabaseSchema,
    DatabaseState,
    NormalizeContext,
    Session,
    SessionOptions,
    TableMap
} from "../types";
import { ensureParamObject, toObject } from "../utils";

export default class DatabaseSession implements Session {
    readonly db: DatabaseSchema;
    readonly tables: TableMap;
    state: DatabaseState;
    readOnly: boolean;

    constructor(db: DatabaseSchema, state: DatabaseState, options: SessionOptions = {}) {
        this.db = ensureParamObject("db", db);
        this.state = ensureParamObject("state", state);

        const { readOnly = false, tableSchemas = db.tables } = options;
        this.readOnly = readOnly;
        this.tables = toObject(
            tableSchemas.map(tableSchema =>
                this.db.factory.newTableModel(this, tableSchema, state[tableSchema.name])), t => t.schema.name);
    }

    getTable(name: string) {
        return this.tables[name];
    }

    upsert(ctx: NormalizeContext) {
        if (this.readOnly) throw new Error(errors.sessionReadonly());

        Object.keys(ctx.output).forEach(name => {
            if (name !== ctx.schema.name)
                this.tables[name].upsertNormalized(ctx.output[name]);
        });
        Object.keys(ctx.emits).forEach(name => {
            if (name !== ctx.schema.name)
                this.tables[name].upsert(ctx.emits[name]);
        });
    }

    commit() {
        if (this.readOnly) throw new Error(errors.sessionReadonly());

        Object.keys(this.tables).forEach(table => {
            const oldState = this.state[table];
            const newState = this.tables[table].state;

            if (oldState !== newState)
                this.state = { ...this.state, [table]: newState };
        });
        return this.state;
    }
}
