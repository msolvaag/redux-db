import {
    DatabaseSchema,
    MapOf,
    NormalizeContext,
    Table,
    TableSchema,
    TableState
} from "../types";
import { ensureParamObject } from "../utils";

export default class DbNormalizeContext implements NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: MapOf<TableState> = {};
    emits: { [key: string]: any[] } = {};
    normalizePKs: boolean;
    argument?: any;

    constructor(schema: TableSchema, normalizePKs: boolean, arg?: any) {
        this.schema = ensureParamObject("schema", schema, "db");
        this.db = ensureParamObject("schema.db", this.schema.db);
        this.normalizePKs = normalizePKs;
        this.argument = arg;
    }

    emit(tableName: string, record: any) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    }
}
