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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("./schema");
var utils = require("./utils");
var TableModel = /** @class */ (function () {
    function TableModel(session, state, schema) {
        if (state === void 0) { state = { ids: [], byId: {}, indexes: {} }; }
        this.session = session;
        this.state = state;
        this.schema = schema;
    }
    TableModel.prototype.all = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return ModelFactory.default.newRecord(id, _this); });
    };
    Object.defineProperty(TableModel.prototype, "length", {
        get: function () {
            return this.state.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    TableModel.prototype.filter = function (predicate) {
        return this.all().filter(predicate);
    };
    TableModel.prototype.index = function (name, fk) {
        if (this.state.indexes[name] && this.state.indexes[name][fk])
            return this.state.indexes[name][fk];
        else
            return [];
    };
    TableModel.prototype.get = function (id) {
        id = id.toString();
        if (!this.exists(id))
            throw new Error("No \"" + this.schema.name + "\" record with id: " + id + " exists.");
        return ModelFactory.default.newRecord(id, this);
    };
    TableModel.prototype.value = function (id) {
        if (typeof id === "number")
            id = id.toString();
        return this.state.byId[id];
    };
    TableModel.prototype.getOrDefault = function (id) {
        return this.exists(id) ? this.get(id) : null;
    };
    TableModel.prototype.exists = function (id) {
        return this.state.byId[id] !== undefined;
    };
    TableModel.prototype.insert = function (data) {
        return this.insertMany(data)[0];
    };
    TableModel.prototype.insertMany = function (data) {
        return this._normalizedAction(data, this.insertNormalized);
    };
    TableModel.prototype.update = function (data) {
        return this.updateMany(data)[0];
    };
    TableModel.prototype.updateMany = function (data) {
        return this._normalizedAction(data, this.updateNormalized);
    };
    TableModel.prototype.upsert = function (data) {
        return this._normalizedAction(data, this.upsertNormalized)[0];
    };
    TableModel.prototype.delete = function (id) {
        var byId = __assign({}, this.state.byId), ids = this.state.ids.slice(), indexes = __assign({}, this.state.indexes), ref = byId[id];
        delete byId[id];
        var idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);
        if (ref) {
            var fks = this.schema.getForeignKeys(ref);
            fks.forEach(function (fk) {
                var fkIdx = fk.value && indexes[fk.name][fk.value].indexOf(id);
                if (fkIdx >= 0) {
                    var idxBucket = indexes[fk.name][fk.value].slice();
                    idxBucket.splice(fkIdx, 1);
                    indexes[fk.name][fk.value] = idxBucket;
                }
                else {
                    delete indexes[fk.name][id];
                    if (Object.keys(indexes[fk.name]).length === 0)
                        delete indexes[fk.name];
                }
            });
        }
        this.state = __assign({}, this.state, { byId: byId, ids: ids, indexes: indexes });
    };
    TableModel.prototype.insertNormalized = function (table) {
        var _this = this;
        this.state = __assign({}, this.state, { ids: utils.arrayMerge(this.state.ids, table.ids), byId: __assign({}, this.state.byId, table.byId) });
        this._updateIndexes(table);
        return table.ids.map(function (id) { return ModelFactory.default.newRecord(id, _this); });
    };
    TableModel.prototype.updateNormalized = function (table) {
        var _this = this;
        var state = __assign({}, this.state), dirty = false;
        var records = Object.keys(table.byId).map(function (id) {
            if (!_this.state.byId[id])
                throw new Error("Failed to apply update. No \"" + _this.schema.name + "\" record with id: " + id + " exists.");
            var newRecord = table.byId[id];
            var oldRecord = state.byId[id];
            var isModified = _this.schema.isModified(oldRecord, newRecord);
            if (isModified) {
                state.byId[id] = __assign({}, oldRecord, newRecord);
                dirty = true;
            }
            return ModelFactory.default.newRecord(id, _this);
        });
        if (dirty) {
            this.state = state;
            this._updateIndexes(table);
        }
        return records;
    };
    TableModel.prototype.upsertNormalized = function (norm) {
        var _this = this;
        var toUpdate = { ids: [], byId: {}, indexes: {} };
        var toInsert = { ids: [], byId: {}, indexes: {} };
        norm.ids.forEach(function (id) {
            if (_this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            }
            else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });
        var refs = (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat((toInsert.ids.length ? this.insertNormalized(toInsert) : []));
        this._updateIndexes(norm);
        return refs;
    };
    TableModel.prototype._normalizedAction = function (data, action) {
        var norm = new schema_1.NormalizeContext(this.schema);
        this.schema.normalize(data, norm);
        var table = norm.output[this.schema.name];
        var records = table ? action.call(this, table) : [];
        this.session.upsert(norm);
        return records;
    };
    TableModel.prototype._updateIndexes = function (table) {
        var _this = this;
        Object.keys(table.indexes).forEach(function (key) {
            var idx = _this.state.indexes[key] || (_this.state.indexes[key] = {});
            Object.keys(table.indexes[key]).forEach(function (fk) {
                var idxBucket = idx[fk] || (idx[fk] = []);
                idx[fk] = utils.arrayMerge(idxBucket, table.indexes[key][fk]);
            });
        });
    };
    return TableModel;
}());
exports.TableModel = TableModel;
var RecordModel = /** @class */ (function () {
    function RecordModel(id, table) {
        this.id = id;
        this.table = table;
    }
    Object.defineProperty(RecordModel.prototype, "value", {
        get: function () {
            return this.table.value(this.id);
        },
        enumerable: true,
        configurable: true
    });
    RecordModel.prototype.delete = function () {
        this.table.delete(this.id);
    };
    RecordModel.prototype.update = function (data) {
        this.table.update(data);
        return this;
    };
    return RecordModel;
}());
exports.RecordModel = RecordModel;
var RecordField = /** @class */ (function () {
    function RecordField(schema, record) {
        this.name = schema.name;
        this.schema = schema;
        this.record = record;
    }
    Object.defineProperty(RecordField.prototype, "value", {
        get: function () {
            return this.schema.getRecordValue(this.record);
        },
        enumerable: true,
        configurable: true
    });
    return RecordField;
}());
exports.RecordField = RecordField;
var RecordSet = /** @class */ (function () {
    function RecordSet(table, schema, owner) {
        this.table = table;
        this.schema = schema;
        this.owner = owner;
    }
    Object.defineProperty(RecordSet.prototype, "value", {
        get: function () {
            return this.map(function (r) { return r.value; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecordSet.prototype, "ids", {
        get: function () {
            return this.table.index(this.schema.name, this.owner.id);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecordSet.prototype, "length", {
        get: function () {
            return this.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    RecordSet.prototype.all = function () {
        var _this = this;
        return this.ids.map(function (id) { return ModelFactory.default.newRecord(id, _this.table); });
    };
    RecordSet.prototype.map = function (callback) {
        return this.all().map(callback);
    };
    RecordSet.prototype.add = function (data) {
        this.table.insert(this._normalize(data));
    };
    RecordSet.prototype.remove = function (data) {
        var _this = this;
        this._normalize(data).forEach(function (obj) {
            var pk = _this.table.schema.getPrimaryKey(obj);
            _this.table.delete(pk);
        });
    };
    RecordSet.prototype.update = function (data) {
        this.table.update(this._normalize(data));
        return this;
    };
    RecordSet.prototype.delete = function () {
        var _this = this;
        this.all().forEach(function (obj) { return _this.table.delete(obj.id); });
    };
    RecordSet.prototype._normalize = function (data) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    };
    return RecordSet;
}());
exports.RecordSet = RecordSet;
var ModelFactory = /** @class */ (function () {
    function ModelFactory() {
        this._recordClass = {};
    }
    ModelFactory.prototype.newRecord = function (id, table) {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass(table.schema)))(id, table);
    };
    ModelFactory.prototype.newRecordField = function (schema, record) {
        if (schema.type !== "FK")
            return new RecordField(schema, record);
        var refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error("The foreign key " + schema.name + " references an unregistered table: " + schema.table.name);
        return refTable.getOrDefault(schema.getRecordValue(record));
    };
    ModelFactory.prototype.newRecordSet = function (schema, record) {
        var refTable = record.table.session.tables[schema.table.name];
        return new RecordSet(refTable, schema, record);
    };
    ModelFactory.prototype._createRecordModelClass = function (schema) {
        var Record = /** @class */ (function (_super) {
            __extends(Record, _super);
            function Record(id, table) {
                var _this = _super.call(this, id, table) || this;
                _this._fields = {};
                return _this;
            }
            return Record;
        }(RecordModel));
        var defineProperty = function (name, field, factory) {
            Object.defineProperty(Record.prototype, name, {
                get: function () {
                    return this._fields[name] || (this._fields[name] = factory(field, this));
                }
            });
        };
        schema.fields.forEach(function (f) { return f.type !== "PK" && defineProperty(f.propName, f, ModelFactory.default.newRecordField); });
        schema.relations.forEach(function (f) { return f.relationName && defineProperty(f.relationName, f, ModelFactory.default.newRecordSet); });
        return Record;
    };
    ModelFactory.default = new ModelFactory();
    return ModelFactory;
}());
