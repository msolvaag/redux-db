import {
    DatabaseSchema,
    MapOf,
    NormalizeContext,
    TableSchema,
    TableState
} from "../types";

export default class DbNormalizeContext implements NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: MapOf<TableState> = {};
    emits: { [key: string]: any[] } = {};
    normalizePKs: boolean;

    constructor(schema: TableSchema, normalizePKs: boolean) {
        this.schema = schema;
        this.db = schema.db;
        this.normalizePKs = normalizePKs;
    }

    emit(tableName: string, record: any) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    }
}
