var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import * as utils from "./utils";
var PK = "PK", FK = "FK", NONE = "NONE";
var NormalizeContext = (function () {
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
export { NormalizeContext };
var TableSchema = (function () {
    function TableSchema(db, name, schema) {
        var _this = this;
        this.relations = [];
        this.db = db;
        this.name = name;
        this.fields = Object.keys(schema).map(function (fieldName) { return new FieldSchema(_this, fieldName, schema[fieldName]); });
        this._primaryKeyFields = this.fields.filter(function (f) { return f.constraint === PK; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.constraint === FK; });
        this._stampFields = this.fields.filter(function (f) { return f.type === "MODIFIED"; });
    }
    TableSchema.prototype.connect = function (schemas) {
        var _this = this;
        schemas.forEach(function (schema) {
            _this.relations = _this.relations.concat(schema.fields.filter(function (f) { return f.references === _this.name; }));
        });
    };
    TableSchema.prototype.normalize = function (data, context) {
        var _this = this;
        if (typeof (data) !== "object" && !Array.isArray(data))
            throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
        var ctx = context || new NormalizeContext(this);
        if (ctx.output[this.name])
            throw new Error("Failed to normalize data. Circular reference detected.");
        ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };
        ctx.output[this.name].ids = utils.ensureArray(data).map(function (obj) {
            var normalizeHook = _this.db.normalizeHooks[_this.name];
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);
            var pk = _this.getPrimaryKey(obj);
            var fks = _this.getForeignKeys(obj);
            var tbl = ctx.output[_this.name];
            var record = tbl.byId[pk] = __assign({}, obj);
            fks.forEach(function (fk) {
                if (!tbl.indexes[fk.name])
                    tbl.indexes[fk.name] = {};
                if (!tbl.indexes[fk.name][fk.value])
                    tbl.indexes[fk.name][fk.value] = [];
                tbl.indexes[fk.name][fk.value].push(pk);
            });
            var relations = {};
            _this.relations.forEach(function (rel) {
                if (rel.relationName && record[rel.relationName]) {
                    var normalizedRels = _this.inferRelations(record[rel.relationName], rel, pk);
                    rel.table.normalize(normalizedRels, ctx);
                    delete record[rel.relationName];
                }
            });
            return pk;
        });
        return ctx;
    };
    TableSchema.prototype.inferRelations = function (data, rel, ownerId) {
        if (!rel.relationName)
            return data;
        var otherFks = rel.table.fields.filter(function (f) { return f.constraint === FK && f !== rel; });
        return utils.ensureArray(data).map(function (obj) {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = (_a = {}, _a[otherFks[0].name] = obj, _a);
                }
                else {
                    obj = { id: obj };
                }
            }
            return __assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
            var _a, _b;
        });
    };
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
    TableSchema.prototype.getForeignKeys = function (record) {
        return this._foreignKeyFields.map(function (fk) { return ({ name: fk.name, value: record[fk.name] }); });
    };
    TableSchema.prototype.isModified = function (x, y) {
        if (this._stampFields.length > 0)
            return this._stampFields.reduce(function (p, n) { return p + (n.getValue(x) === n.getValue(y) ? 1 : 0); }, 0) !== this._stampFields.length;
        else
            return true;
    };
    return TableSchema;
}());
export { TableSchema };
var FieldSchema = (function () {
    function FieldSchema(table, name, schema) {
        this.table = table;
        this.name = name;
        this.propName = schema.propName || name;
        this.type = schema.type || "ATTR";
        this.constraint = schema.constraint || "NONE";
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
export { FieldSchema };
