import { ALL } from "../constants";
import errors from "../errors";
import {
    DatabaseOptions,
    DatabaseSchema,
    DatabaseState,
    MapOf,
    ModelFactory,
    RecordFactory,
    Reducer,
    Schema,
    Session,
    SessionOptions,
    TableMap,
    TableSchema
} from "../types";
import { ensureArray, ensureParamObject, isEqual, toObject } from "../utils";

const defaultOptions: DatabaseOptions = {
    cascadeAsDefault: false
};

const getMappedFunction = <T extends Function>(map: MapOf<T> | T | undefined, key: string, defaultFn?: T) => {
    if (!map) return defaultFn;
    if (typeof map === "function")
        return map;
    else if (map[key])
        return map[key];
    else if (map[ALL])
        return map[ALL];
    return defaultFn;
};

export default class Database<T extends TableMap> implements DatabaseSchema {
    schema: Schema;
    tables: TableSchema[];
    options: DatabaseOptions;
    factory: ModelFactory & RecordFactory;
    tableMap: MapOf<TableSchema>;

    constructor(schema: Schema, factory: ModelFactory & RecordFactory, options?: DatabaseOptions) {
        this.schema = ensureParamObject("schema", schema);
        this.factory = ensureParamObject("factory", factory);
        this.options = { ...defaultOptions, ...options };

        this.tables = Object.keys(schema).map(tableName =>
            this.factory.newTableSchema(this, tableName, schema[tableName]));
        this.tableMap = toObject(this.tables, table => table.name);
        this.tables.forEach(table => table.connect(this.tableMap));
    }

    getRecordNormalizer = (schemaName: string) =>
        getMappedFunction(this.options.onNormalize, schemaName)
    getPkGenerator = (schemaName: string) =>
        getMappedFunction(this.options.onGeneratePK, schemaName)
    getRecordComparer = (schemaName: string) =>
        getMappedFunction(this.options.onRecordCompare, schemaName, isEqual)
    getRecordMerger = (schemaName: string) =>
        getMappedFunction(this.options.onRecordMerge, schemaName)

    combineReducers(...reducers: Reducer[]) {
        return (state: any = {}, action: any) => this.reduce(state, action, reducers);
    }

    reduce(state: DatabaseState = {}, action?: any, reducers?: Reducer | Reducer[], ...args: any[]) {
        const session = this.createSession(state);
        ensureArray(reducers).forEach(reducer =>
            reducer.apply(this, [session.tables, action, ...args]));
        return session.commit();
    }

    createSession(state: DatabaseState = {}, options?: SessionOptions) {
        return this.factory.newSession(this, state, { readOnly: false, ...options }) as Session<T>;
    }

    getTableSchema(name: string) {
        return this.tableMap[name];
    }

    selectTables(state: any) {
        const tableSchemas = Object.keys(state)
            .filter(tableName => this.tableMap[tableName])
            .map(tableName => this.tableMap[tableName]);

        const session = this.createSession(state, {
            readOnly: true,
            tableSchemas
        });

        return session.tables;
    }

    selectTable(tableState: any, schemaName?: string) {
        const { name = schemaName } = tableState;
        if (!name)
            throw new Error(errors.unknownTableState());

        return this.selectTables({
            [name]: tableState,
        })[name];
    }
}
