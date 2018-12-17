"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ModelFactory_1 = tslib_1.__importDefault(require("./ModelFactory"));
var models_1 = require("./models");
var Normalizer_1 = tslib_1.__importDefault(require("./Normalizer"));
var defaultFactory = {
    newTableSchema: function (db, name, schema) { return new models_1.TableSchemaModel(db, name, schema); },
    newFieldSchema: function (table, name, schema) { return new models_1.FieldSchemaModel(table, name, schema); },
    newTableModel: function (session, schema, state) { return new models_1.TableModel(session, schema, state); },
    newRecordSetModel: function (table, schema, owner) { return new models_1.RecordSetModel(table, schema, owner); },
    newRecordFieldModel: function (schema, record) { return new models_1.RecordFieldModel(schema, record); },
    newSchemaNormalizer: function (schema) { return new Normalizer_1.default(schema); },
    newSession: function (db, state, options) { return new models_1.DatabaseSession(db, state, options); }
};
exports.createFactory = function (factory, recordModelClass) {
    return ModelFactory_1.default(tslib_1.__assign({}, defaultFactory, factory), recordModelClass || models_1.RecordModel);
};
exports.createDatabase = function (schema, options) {
    if (options === void 0) { options = {}; }
    var _a = options.factory, factory = _a === void 0 ? {} : _a, _b = options.recordModelClass, recordModelClass = _b === void 0 ? models_1.RecordModel : _b, dbOptions = tslib_1.__rest(options, ["factory", "recordModelClass"]);
    var modelFactory = exports.createFactory(factory, recordModelClass);
    return new models_1.Database(schema, modelFactory, dbOptions);
};
tslib_1.__exportStar(require("./constants"), exports);
tslib_1.__exportStar(require("./models"), exports);
tslib_1.__exportStar(require("./ModelFactory"), exports);
var utils = tslib_1.__importStar(require("./utils"));
exports.utils = utils;
