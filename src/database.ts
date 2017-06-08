import { SchemaDDL, FieldSchema, TableSchema, DatabaseSchema } from "./schema";
import { DbTransaction, Reducer } from "./transaction";

export class ReduxDB {

    createSchema(name: string, schema: SchemaDDL) {
        const tableSchemas = Object.keys(schema).map(tableName => {

            const tableDef = schema[tableName];
            const fields = Object.keys(tableDef.fields).map(fieldName => new FieldSchema(fieldName, tableDef[fieldName]));

            return new TableSchema(tableName, fields);
        });

        return new DatabaseSchema(name, tableSchemas);
    }

    createReducer(schema: DatabaseSchema, ...reducers: Reducer[]) {
        return (state: any, action: any) => {
            const tx = new DbTransaction(state, schema);
            tx.reduce(reducers, action);

            return tx.commit();
        };
    }
}
