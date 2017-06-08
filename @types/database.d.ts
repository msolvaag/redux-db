import { SchemaDDL, DatabaseSchema } from "./schema";
import { Reducer } from "./transaction";
export declare class ReduxDB {
    createSchema(name: string, schema: SchemaDDL): DatabaseSchema;
    createReducer(schema: DatabaseSchema, ...reducers: Reducer[]): (state: any, action: any) => void;
}
