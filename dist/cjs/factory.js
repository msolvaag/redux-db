"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var models_1 = require("./models");
var schema_1 = require("./schema");
var createRecordModelClass = function (BaseClass) {
    return /** @class */ (function (_super) {
        __extends(ExtendedRecordModel, _super);
        function ExtendedRecordModel(id, table) {
            var _this = _super.call(this, id, table) || this;
            _this.__fields = {};
            return _this;
        }
        return ExtendedRecordModel;
    }(BaseClass));
};
var DefaultModelFactory = /** @class */ (function () {
    function DefaultModelFactory() {
        this._recordClass = {};
    }
    DefaultModelFactory.prototype.newTableSchema = function (db, name, schema) {
        return new schema_1.TableSchemaModel(db, name, schema);
    };
    DefaultModelFactory.prototype.newTableModel = function (session, schema, state) {
        return new models_1.TableModel(session, schema, state);
    };
    DefaultModelFactory.prototype.newRecordModel = function (id, table) {
        return new (this._createRecordModel(table.schema))(id, table);
    };
    DefaultModelFactory.prototype.newRecordField = function (schema, record) {
        if (!schema.isForeignKey)
            return new models_1.RecordFieldModel(schema, record);
        var refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error("The foreign key: \"" + schema.name + "\" references an unregistered table: \"" + schema.references + "\" in the current session.");
        var recordId = schema.getRecordValue(record);
        if (recordId === undefined)
            return null;
        return refTable.getOrDefault(recordId);
    };
    DefaultModelFactory.prototype.newRecordSet = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
        return new models_1.RecordSetModel(refTable, schema, record);
    };
    DefaultModelFactory.prototype.newRecordRelation = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
        var id = refTable.index(schema.name, record.id)[0];
        if (id === undefined)
            return null;
        return this.newRecordModel(id, refTable);
    };
    DefaultModelFactory.prototype.getRecordBaseClass = function (schema) {
        return models_1.RecordModel;
    };
    DefaultModelFactory.prototype._createRecordModel = function (schema) {
        var _this = this;
        if (this._recordClass[schema.name])
            return this._recordClass[schema.name];
        else {
            var ExtendedRecordModel_1 = createRecordModelClass(this.getRecordBaseClass(schema));
            var defineProperty_1 = function (name, field, factory, cache) {
                if (cache === void 0) { cache = true; }
                if (name === "id")
                    throw new Error("The property \"" + field.table.name + ".id\" is a reserved name. Please specify another name using the \"propName\" definition.");
                Object.defineProperty(ExtendedRecordModel_1.prototype, name, {
                    get: function () {
                        // TODO: Improve the instance cache mechanism. Invalidate when the field value changes..
                        return cache ? (this.__fields[name] || (this.__fields[name] = factory(field, this))) : factory(field, this);
                    }
                });
            };
            schema.fields.forEach(function (f) { return (f.isForeignKey || !f.isPrimaryKey) && defineProperty_1(f.propName, f, _this.newRecordField.bind(_this), false); });
            schema.relations.forEach(function (f) { return f.relationName && defineProperty_1(f.relationName, f, f.unique ? _this.newRecordRelation.bind(_this) : _this.newRecordSet.bind(_this), !f.unique); });
            return this._recordClass[schema.name] = ExtendedRecordModel_1;
        }
    };
    return DefaultModelFactory;
}());
exports.DefaultModelFactory = DefaultModelFactory;
