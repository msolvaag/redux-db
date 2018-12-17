import * as tslib_1 from "tslib";
import createModelFactory from "./ModelFactory";
import { Database, DatabaseSession, FieldSchemaModel, RecordFieldModel, RecordModel, RecordSetModel, TableModel, TableSchemaModel } from "./models";
import SchemaNormalizer from "./Normalizer";
var defaultFactory = {
    newTableSchema: function (db, name, schema) { return new TableSchemaModel(db, name, schema); },
    newFieldSchema: function (table, name, schema) { return new FieldSchemaModel(table, name, schema); },
    newTableModel: function (session, schema, state) { return new TableModel(session, schema, state); },
    newRecordSetModel: function (table, schema, owner) { return new RecordSetModel(table, schema, owner); },
    newRecordFieldModel: function (schema, record) { return new RecordFieldModel(schema, record); },
    newSchemaNormalizer: function (schema) { return new SchemaNormalizer(schema); },
    newSession: function (db, state, options) { return new DatabaseSession(db, state, options); }
};
export var createFactory = function (factory, recordModelClass) {
    return createModelFactory(tslib_1.__assign({}, defaultFactory, factory), recordModelClass || RecordModel);
};
export var createDatabase = function (schema, options) {
    if (options === void 0) { options = {}; }
    var _a = options.factory, factory = _a === void 0 ? {} : _a, _b = options.recordModelClass, recordModelClass = _b === void 0 ? RecordModel : _b, dbOptions = tslib_1.__rest(options, ["factory", "recordModelClass"]);
    var modelFactory = createFactory(factory, recordModelClass);
    return new Database(schema, modelFactory, dbOptions);
};
export * from "./constants";
export * from "./models";
export * from "./ModelFactory";
import * as utils from "./utils";
export { utils };
