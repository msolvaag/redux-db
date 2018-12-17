import {
    DatabaseSchema,
    MapOf,
    NormalizeContext,
    NormalizeContextOptions,
    Table,
    TableSchema,
    TableState
} from "../types";
import { ensureParamObject } from "../utils";

export default class DbNormalizeContext implements NormalizeContext {
    table?: Table;
    schema: TableSchema;
    db: DatabaseSchema;
    output: MapOf<TableState> = {};
    emits: { [key: string]: any[] } = {};
    normalizePKs: boolean;
    argument?: any;

    constructor(schema: TableSchema, options: NormalizeContextOptions) {
        this.schema = ensureParamObject("schema", schema, "db");
        this.db = ensureParamObject("schema.db", this.schema.db);

        this.table = options.table;
        this.normalizePKs = options.normalizePKs === true;
        this.argument = options.argument;
    }

    emit(tableName: string, record: any) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    }
}
