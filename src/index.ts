import createModelFactory from "./ModelFactory";
import {
    Database,
    DatabaseSession,
    FieldSchemaModel,
    RecordFieldModel,
    RecordModel,
    RecordSetModel,
    TableModel,
    TableSchemaModel
} from "./models";
import SchemaNormalizer from "./Normalizer";
import { DatabaseCreateOptions, ModelFactory, RecordClass, Schema, TableMap } from "./types";

const defaultFactory: ModelFactory = {
    newTableSchema: (db, name, schema) => new TableSchemaModel(db, name, schema),
    newFieldSchema: (table, name, schema) => new FieldSchemaModel(table, name, schema),
    newTableModel: (session, schema, state) => new TableModel(session, schema, state),
    newRecordSetModel: (table, schema, owner) => new RecordSetModel(table, schema, owner),
    newRecordFieldModel: (schema, record) => new RecordFieldModel(schema, record),
    newSchemaNormalizer: (schema) => new SchemaNormalizer(schema),
    newSession: (db, state, options) => new DatabaseSession(db, state, options)
};

export const createFactory = (factory?: Partial<ModelFactory>, recordModelClass?: RecordClass) =>
    createModelFactory({
        ...defaultFactory,
        ...factory
    }, recordModelClass || RecordModel);

export const createDatabase = <T extends TableMap>(schema: Schema, options: DatabaseCreateOptions = {}) => {
    const { factory = {}, recordModelClass = RecordModel, ...dbOptions } = options;
    const modelFactory = createFactory(factory, recordModelClass);

    return new Database<T>(schema, modelFactory, dbOptions);
};

export * from "./constants";
export * from "./models";
export * from "./ModelFactory";
export * from "./types";
import * as utils from "./utils";
export { utils };
