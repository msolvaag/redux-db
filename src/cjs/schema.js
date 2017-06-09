"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TableSchema = (function () {
    function TableSchema(name, fields) {
        this.name = name;
        this.fields = fields;
        this._primaryKeyFields = this.fields.filter(function (f) { return f.type === "PK"; }).map(function (f) { return f.name; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.type === "FK"; }).map(function (f) { return f.name; });
    }
    TableSchema.prototype.normalize = function (data) {
        return data;
    };
    TableSchema.prototype.getPrimaryKey = function (record) {
        var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        var pk = lookup.reduce(function (p, n) {
            var k = record[n];
            return p && k ? (p + "_" + k) : k;
        });
        if (!pk || pk.length === 0)
            throw new Error("Failed to get primary key for record of \"" + this.name + "\".");
        return pk;
    };
    return TableSchema;
}());
exports.TableSchema = TableSchema;
var FieldSchema = (function () {
    function FieldSchema(name, schema) {
        this.name = name;
        this.type = schema.type;
        this.references = schema.references;
        this.relationName = schema.relationName;
    }
    return FieldSchema;
}());
exports.FieldSchema = FieldSchema;
