import errors from "../errors";
import {
    DatabaseSchema,
    DatabaseState,
    NormalizeContext,
    Session,
    SessionOptions,
    TableMap
} from "../types";
import { toObject } from "../utils";

export default class DatabaseSession implements Session {
    db: DatabaseSchema;
    tables: TableMap;
    state: DatabaseState;
    options: SessionOptions;

    constructor(state: DatabaseState = {}, db: DatabaseSchema, options: SessionOptions) {
        this.state = state;
        this.db = db;
        this.options = options;

        const tableSchemas = options.tableSchemas || db.tables;

        this.tables = toObject(
            tableSchemas.map(tableSchema =>
                this.db.factory.newTableModel(this, tableSchema, state[tableSchema.name])), t => t.schema.name);
    }

    upsert(ctx: NormalizeContext) {
        if (this.options.readOnly) throw new Error(errors.sessionReadonly());

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
        if (this.options.readOnly) throw new Error(errors.sessionReadonly());

        Object.keys(this.tables).forEach(table => {
            const oldState = this.state[table];
            const newState = this.tables[table].state;

            if (oldState !== newState)
                this.state = { ...this.state, [table]: newState };
        });
        return this.state as any;
    }
}
