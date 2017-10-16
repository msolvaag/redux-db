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
        this.fields = Object.keys(schema).map(function (fieldName) { return new FieldSchema(_this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true); });
        this.fieldsByName = utils.toObject(this.fields, function (f) { return f.name; });
        this._primaryKeyFields = this.fields.filter(function (f) { return f.isPrimaryKey; });
        this._foreignKeyFields = this.fields.filter(function (f) { return f.isForeignKey; });
        this._stampFields = this.fields.filter(function (f) { return f.type === "MODIFIED"; });
    }
    /// Connects this schema's fields with other tables.
    /// Used internally in the setup of the schema object model.
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
        // temp holder to validate PK constraint
        //const pks: { [key: string]: number } = {};
        return utils.ensureArray(data).map(function (obj) {
            if (typeof obj !== "object")
                throw new Error("Failed to normalize data. Given record is not a plain object.");
            var normalizeHook = _this.db.normalizeHooks ? _this.db.normalizeHooks[_this.name] : null;
            if (normalizeHook)
                obj = normalizeHook(obj, ctx);
            var pk = _this.getPrimaryKey(obj);
            //if (pks[pk]++) throw new Error(`Multiple records with the same PK: "${this.name}.${pk}". Check your schema definition.`);
            var fks = _this.getForeignKeys(obj);
            var tbl = ctx.output[_this.name];
            if (!tbl.byId[pk])
                tbl.ids.push(pk);
            var record = tbl.byId[pk] = __assign({}, obj);
            fks.forEach(function (fk) {
                // if the FK is an object, then normalize it and replace object with it's PK.
                if (typeof fk.value === "object" && fk.refTable) {
                    var fkPks = fk.refTable.normalize(fk.value, ctx);
                    if (fkPks.length > 1)
                        throw new Error("Invalid schema definition. The field \"" + _this.name + "." + fk.name + "\" is referencing table \"" + fk.refTable.name + "\", but the given data is an array.");
                    record[fk.name] = fk.value = fkPks[0];
                }
                // all FK's are auto indexed
                if (utils.isValidID(fk.value)) {
                    var fkId = utils.asID(fk.value); // ensure string id
                    var idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });
                    if (!idx.values[fkId])
                        idx.values[fkId] = [];
                    if (idx.unique && idx.values.length)
                        throw new Error("The insert/update operation violates the unique foreign key \"" + _this.name + "." + fk.name + "\".");
                    idx.values[fkId].push(pk);
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
        var otherFks = rel.table.fields.filter(function (f) { return f.isForeignKey && f !== rel; });
        return utils.ensureArray(data).map(function (obj) {
            if (typeof obj === "number" || typeof obj === "string") {
                if (otherFks.length === 1) {
                    obj = (_a = {}, _a[otherFks[0].name] = obj, _a);
                }
                else {
                    obj = { id: obj }; // TODO: this might be quite wrong..
                }
            }
            return __assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
            var _a, _b;
        });
    };
    /// Gets the value of the PK for the given record.
    TableSchema.prototype.getPrimaryKey = function (record) {
        var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
        var combinedPk = lookup.reduce(function (p, n) {
            var k = n.getValue(record);
            return p && k ? (p + "_" + k) : k;
        }, null);
        var pk = utils.isValidID(combinedPk) && utils.asID(combinedPk);
        if (!pk)
            throw new Error("Failed to get primary key for record of type \"" + this.name + "\".");
        return pk;
    };
    /// Gets the values of the FK's for the given record.
    TableSchema.prototype.getForeignKeys = function (record) {
        return this._foreignKeyFields.map(function (fk) { return ({ name: fk.name, value: record[fk.name], refTable: fk.refTable, unique: fk.unique, notNull: fk.notNull }); });
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
    function FieldSchema(table, name, schema, cascadeAsDefault) {
        this.table = table;
        this.type = schema.type || "ATTR";
        this.name = name;
        this.propName = schema.propName || name;
        this._valueFactory = schema.value ? schema.value.bind(this) : null;
        this.isPrimaryKey = schema.type === "PK";
        this.isForeignKey = schema.references !== null && schema.references !== undefined;
        if (this.isPrimaryKey || this.isForeignKey) {
            this.references = schema.references;
            this.relationName = schema.relationName;
            this.cascade = schema.cascade === undefined ? cascadeAsDefault : schema.cascade === true;
            this.unique = schema.unique === true;
            // not null is default true, for PK's and FK's
            this.notNull = schema.notNull === undefined ? true : schema.notNull === true;
        }
        else {
            this.cascade = false;
            this.unique = false;
            this.notNull = schema.notNull === true;
        }
    }
    FieldSchema.prototype.getValue = function (data, record) {
        return this._valueFactory ? this._valueFactory(data, {
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
