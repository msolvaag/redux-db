"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("./utils");
var PK = "PK", FK = "FK", NONE = "NONE";
var NormalizeContext = /** @class */ (function () {
    function NormalizeContext(schema) {
        this.output = {};
        this.emits = {};
        this.schema = schema;
        this.db = schema.db;
    }
    NormalizeContext.prototype.emit = function (tableName, record) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    };
    return NormalizeContext;
}());
exports.NormalizeContext = NormalizeContext;
var TableSchema = /** @class */ (function () {
    function TableSchema(db, name, schema) {
        var _this = this;
        this.relations = [];
        this.db = db;
        this.name = name;
        this.fields = Object.keys(schema).map(function (fieldName) { return new FieldSchema(_this, fieldName, schema[fieldName]); });
        this._primaryKeyFields = this.fields.filter(function (f) { return f.type === PK; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.type === FK; });
        this._stampFields = this.fields.filter(function (f) { return f.type === "MODIFIED"; });
    }
    /// Connects this schema's fields with other tables.
    TableSchema.prototype.connect = function (schemas) {
        var _this = this;
        schemas.forEach(function (schema) {
            _this.relations = _this.relations.concat(schema.fields.filter(function (f) { return f.references === _this.name; }));
        });
        this._foreignKeyFields.forEach(function (fk) {
            if (fk.references) {
                fk.refTable = schemas.filter(function (tbl) { return tbl.name === fk.references; })[0];
            }
        });
    };
    /// Normalizes the given data and outputs to context.
    /// Returns the PKs for the normalized records.
    TableSchema.prototype.normalize = function (data, context) {
        var _this = this;
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        var ctx = context || new NormalizeContext(this);
        if (!ctx.output[this.name])
            ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };
        return utils.ensureArray(data).map(function (obj) {
            var normalizeHook = _this.db.normalizeHooks ? _this.db.normalizeHooks[_this.name] : null;
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);
            var pk = _this.getPrimaryKey(obj);
            var fks = _this.getForeignKeys(obj);
            var tbl = ctx.output[_this.name];
            var record = tbl.byId[pk] = __assign({}, obj);
            tbl.ids.push(pk);
            fks.forEach(function (fk) {
                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    var fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error("Invalid schema definition. The field \"" + _this.name + "." + fk.name + "\" is referencing table \"" + fk.refTable.name + "\", but the given data is an array.");
                    record[fk.name] = fk.value = fkPks[0];
                }
                // all FK's are auto indexed
                if (fk.value !== null && fk.value !== undefined) {
                    if (!tbl.indexes[fk.name])
                        tbl.indexes[fk.name] = {};
                    if (!tbl.indexes[fk.name][fk.value])
                        tbl.indexes[fk.name][fk.value] = [];
                    tbl.indexes[fk.name][fk.value].push(pk);
                }
            });
            var relations = {};
            // Normalize foreign relations, FKs from other tables referencing this table.
            // Then remove the nested relations from the record.
            _this.relations.forEach(function (rel) {
                if (rel.relationName && record[rel.relationName]) {
                    var normalizedRels = _this.inferRelations(record[rel.relationName], rel, pk);
                    rel.table.normalize(normalizedRels, ctx);
                    delete record[rel.relationName];
                }
            });
            return pk;
        });
    };
    /// Infers the owner PK into the given nested relations
    TableSchema.prototype.inferRelations = function (data, rel, ownerId) {
        if (!rel.relationName)
            return data;
        var otherFks = rel.table.fields.filter(function (f) { return f.type === FK && f !== rel; });
        return utils.ensureArray(data).map(function (obj) {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = (_a = {}, _a[otherFks[0].name] = obj, _a);
                }
                else {
                    obj = { id: obj }; // TODO: this may be quite wrong..
                }
            }
            return __assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
            var _a, _b;
        });
    };
    /// Gets the value of the PK for the given record.
    TableSchema.prototype.getPrimaryKey = function (record) {
        var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        var pk = lookup.reduce(function (p, n) {
            var k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null);
        if (pk !== null && pk !== undefined && typeof (pk) !== "string")
            pk = pk.toString();
        if (!pk || pk.length === 0)
            throw new Error("Failed to get primary key for record of type \"" + this.name + "\".");
        return pk;
    };
    /// Gets the values of the FK's for the given record.
    TableSchema.prototype.getForeignKeys = function (record) {
        return this._foreignKeyFields.map(function (fk) { return ({ name: fk.name, value: record[fk.name], refTable: fk.refTable }); });
    };
    /// Determines wether two records are equal, not modified.
    TableSchema.prototype.isModified = function (x, y) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce(function (p, n) { return p + (n.getValue(x) === n.getValue(y) ? 1 : 0); }, 0) !== this._stampFields.length;
        else
            return !utils.isEqual(x, y); // TODO: make this customizable
    };
    return TableSchema;
}());
exports.TableSchema = TableSchema;
var FieldSchema = /** @class */ (function () {
    function FieldSchema(table, name, schema) {
        this.table = table;
        this.name = name;
        this.propName = schema.propName || name;
        this.type = schema.type || schema.constraint || (schema.references ? "FK" : "ATTR");
        this.references = schema.references;
        this.relationName = schema.relationName;
        this._valueFn = schema.value ? schema.value.bind(this) : null;
    }
    FieldSchema.prototype.getValue = function (data, record) {
        return this._valueFn ? this._valueFn(data, {
            schema: this,
            record: record
        }) : data[this.name];
    };
    FieldSchema.prototype.getRecordValue = function (record) {
        return this.getValue(record.value, record);
    };
    return FieldSchema;
}());
exports.FieldSchema = FieldSchema;
