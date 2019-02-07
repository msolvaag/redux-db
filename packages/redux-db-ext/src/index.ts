import { createDatabase as originalCreateDb, createFactory } from "redux-db";
import ExtendedTableModel from "./ExtendedTableModel";

export const extendedFactory = createFactory({
    newTableModel: (session, schema, state) => new ExtendedTableModel(session, schema, state),
});

export const createDatabase: typeof originalCreateDb = (schema, options = {}) => {
    const { factory = {} } = options;

    return originalCreateDb(schema, {
        factory: {
            ...extendedFactory,
            ...factory
        }, ...options
    });
};

export * from "./types";
export { ExtendedTableModel };
