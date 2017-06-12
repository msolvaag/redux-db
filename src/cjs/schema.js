"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("./utils");
var PK = "PK", FK = "FK", NONE = "NONE";
var TableSchema = (function () {
    function TableSchema(name, schema) {
        var _this = this;
        this.relations = [];
        this.name = name;
        this.fields = Object.keys(schema).map(function (fieldName) { return new FieldSchema(_this, fieldName, schema[fieldName]); });
        this._primaryKeyFields = this.fields.filter(function (f) { return f.constraint === PK; }).map(function (f) { return f.name; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.constraint === FK; }).map(function (f) { return f.name; });
        this._stampFields = this.fields.filter(function (f) { return f.type === "MODIFIED"; }).map(function (f) { return f.name; });
    }
    TableSchema.prototype.connect = function (schemas) {
        var _this = this;
        schemas.forEach(function (schema) {
            _this.relations = _this.relations.concat(schema.fields.filter(function (f) { return f.references === _this.name; }));
        });
    };
    TableSchema.prototype.normalize = function (data, output) {
        var _this = this;
        if (output === void 0) { output = {}; }
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        if (output[this.name])
            throw new Error("Failed to normalize data. Circular reference detected.");
        output[this.name] = { ids: [], byId: {} };
        output[this.name].ids = utils.ensureArray(data).map(function (obj) {
            var pk = _this.getPrimaryKey(data);
            output[_this.name].byId[pk] = obj;
            var relations = {};
            _this.relations.forEach(function (rel) {
                if (rel.relationName && data[rel.relationName]) {
                    rel.table.normalize(data[rel.relationName], output);
                    delete data[rel.relationName];
                }
            });
            return pk;
        });
        return output;
    };
    TableSchema.prototype.getPrimaryKey = function (record) {
        var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        var pk = null;
        if (lookup.length === 1)
            pk = record[lookup[0]];
        else if (lookup.length > 1)
            pk = lookup.reduce(function (p, n) {
                var k = record[n];
                return p && k ? (p + "_" + k) : k;
            }, null);
        if (pk !== null && pk !== undefined && typeof (pk) !== "string")
            pk = pk.toString();
        if (!pk || pk.length === 0)
            throw new Error("Failed to get primary key for record of type \"" + this.name + "\".");
        return pk;
    };
    TableSchema.prototype.isModified = function (x, y) {
        var _this = this;
        if (this._stampFields.length === 1)
            return x[this._stampFields[0]] === y[this._stampFields[0]];
        else if (this._stampFields.length > 1) {
            return this._stampFields.reduce(function (p, n) {
                return p + (x[_this._stampFields[0]] === y[_this._stampFields[0]] ? 1 : 0);
            }, 0) !== this._stampFields.length;
        }
        else
            return true;
    };
    return TableSchema;
}());
exports.TableSchema = TableSchema;
var FieldSchema = (function () {
    function FieldSchema(table, name, schema) {
        this.table = table;
        this.name = name;
        this.propName = schema.name || name;
        this.type = schema.type || "ATTR";
        this.constraint = schema.constraint || "NONE";
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
    return FieldSchema;
}());
exports.FieldSchema = FieldSchema;
