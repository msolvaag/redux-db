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
var DefaultModelFactory = /** @class */ (function () {
    function DefaultModelFactory() {
        this._recordClass = {};
    }
    DefaultModelFactory.prototype.newTableSchema = function (db, name, schema) {
        return new schema_1.TableSchemaModel(db, name, schema);
    };
    DefaultModelFactory.prototype.newTableModel = function (session, state, schema) {
        return new models_1.TableModel(session, state, schema);
    };
    DefaultModelFactory.prototype.newRecord = function (id, table) {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this.createRecordModelClass(table.schema)))(id, table);
    };
    DefaultModelFactory.prototype.newRecordField = function (schema, record) {
        if (!schema.isForeignKey)
            return new models_1.RecordFieldModel(schema, record);
        var refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error("The foreign key: \"" + schema.name + "\" references an unregistered table: \"" + schema.references + "\" in the current session.");
        return refTable.getOrDefault(schema.getRecordValue(record));
    };
    DefaultModelFactory.prototype.newRecordSet = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
        return new models_1.TableRecordSetModel(refTable, schema, record);
    };
    DefaultModelFactory.prototype.newRecordRelation = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
        var id = refTable.index(schema.name, record.id)[0];
        if (id === undefined)
            return null;
        else
            return this.newRecord(id, refTable);
    };
    DefaultModelFactory.prototype.createRecordModelClass = function (schema) {
        var _this = this;
        var Record = /** @class */ (function (_super) {
            __extends(Record, _super);
            function Record(id, table) {
                var _this = _super.call(this, id, table) || this;
                _this._fields = {};
                return _this;
            }
            return Record;
        }(models_1.TableRecordModel));
        var defineProperty = function (name, field, factory, cache) {
            if (cache === void 0) { cache = true; }
            if (name === "id")
                throw new Error("The property \"" + field.table.name + ".id\" is a reserved name. Please specify another name using the \"propName\" definition.");
            Object.defineProperty(Record.prototype, name, {
                get: function () {
                    return cache ? (this._fields[name] || (this._fields[name] = factory(field, this))) : factory(field, this);
                }
            });
        };
        schema.fields.forEach(function (f) { return (f.isForeignKey || !f.isPrimaryKey) && defineProperty(f.propName, f, _this.newRecordField.bind(_this)); });
        schema.relations.forEach(function (f) { return f.relationName && defineProperty(f.relationName, f, f.unique ? _this.newRecordRelation.bind(_this) : _this.newRecordSet.bind(_this), !f.unique); });
        return Record;
    };
    return DefaultModelFactory;
}());
exports.DefaultModelFactory = DefaultModelFactory;
