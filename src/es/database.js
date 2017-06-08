import { FieldSchema, TableSchema, DatabaseSchema } from "./schema";
import { DbTransaction } from "./transaction";
export class ReduxDB {
    createSchema(name, schema) {
        const tableSchemas = Object.keys(schema).map(tableName => {
            const tableDef = schema[tableName];
            const fields = Object.keys(tableDef.fields).map(fieldName => new FieldSchema(fieldName, tableDef[fieldName]));
            return new TableSchema(tableName, fields);
        });
        return new DatabaseSchema(name, tableSchemas);
    }
    createReducer(schema, ...reducers) {
        return (state, action) => {
            const tx = new DbTransaction(state, schema);
            tx.reduce(reducers, action);
            return tx.commit();
        };
    }
}
