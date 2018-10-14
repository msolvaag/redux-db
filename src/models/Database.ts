import DefaultModelFactory from "../DefaultModelFactory";
import {
    DatabaseOptions,
    DatabaseSchema,
    DatabaseState,
    MapOf,
    ModelFactory,
    Reducer,
    Schema,
    SessionOptions,
    TableSchema
} from "../types";
import { ensureArray, ensureParamObject, isEqual, toObject } from "../utils";
import DatabaseSession from "./DatabaseSession";

const defaultOptions: DatabaseOptions = {
    cascadeAsDefault: false
};

const getMappedFunction = <T extends Function>(map: MapOf<T> | T | undefined, key: string, defaultFn?: T) => {
    if (!map) return defaultFn;
    if (typeof map === "function")
        return map;
    else if (map[key])
        return map[key];
    return defaultFn;
};

export default class Database<T extends Schema> implements DatabaseSchema {
    schema: T;
    tables: TableSchema[];
    options: DatabaseOptions;
    factory: ModelFactory;

    tableMap: MapOf<TableSchema>;

    constructor(schema: T, options?: DatabaseOptions) {
        ensureParamObject("schema", schema);

        this.schema = schema;
        this.options = { ...defaultOptions, ...options };
        this.factory = this.options.factory || new DefaultModelFactory();
        this.tables = Object.keys(schema).map(tableName =>
            this.factory.newTableSchema(this, tableName, schema[tableName]));
        this.tableMap = toObject(this.tables, t => t.name);
        this.tables.forEach(table => table.connect(this.tableMap));
    }

    getNormalizer = (schemaName: string) =>
        getMappedFunction(this.options.onNormalize, schemaName)
    getPkGenerator = (schemaName: string) =>
        getMappedFunction(this.options.onGeneratePK, schemaName)
    getRecordComparer = (schemaName: string) =>
        getMappedFunction(this.options.onRecordCompare, schemaName, isEqual)

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
        return new DatabaseSession(state, this, { readOnly: false, ...options });
    }

    getTableSchema(name: string) {
        return this.tableMap[name];
    }

    wrapTables(state: any) {
        const tableSchemas = Object.keys(state)
            .filter(tableName => this.tableMap[tableName])
            .map(tableName => this.tableMap[tableName]);

        const session = this.createSession(state, {
            readOnly: true,
            tableSchemas
        });

        return session.tables;
    }

    selectTables(state: any) {
        return this.wrapTables(state);
    }
}
