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
var printObject = function (o) {
    var cache = [];
    return JSON.stringify(o, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Duplicate reference found
                try {
                    // If this value does not reference a parent it can be deduped
                    return JSON.parse(JSON.stringify(value));
                }
                catch (error) {
                    // discard key if value cannot be deduped
                    return;
                }
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
};
/// Holds context state when normalizing data
var DbNormalizeContext = /** @class */ (function () {
    function DbNormalizeContext(schema, normalizePKs) {
        this.output = {};
        this.emits = {};
        this.schema = schema;
        this.db = schema.db;
        this.normalizePKs = normalizePKs;
    }
    /// Emits data for further normalization
    DbNormalizeContext.prototype.emit = function (tableName, record) {
        this.emits[tableName] = this.emits[tableName] || [];
        this.emits[tableName].push(record);
    };
    return DbNormalizeContext;
}());
exports.DbNormalizeContext = DbNormalizeContext;
var TableModel = /** @class */ (function () {
    function TableModel(session, schema, state) {
        if (state === void 0) { state = { ids: [], byId: {}, indexes: {} }; }
        this.dirty = false;
        this.session = utils.ensureParam("session", session);
        this.schema = utils.ensureParam("schema", schema);
        this.state = utils.ensureParam("state", state);
        var _a = this.state, ids = _a.ids, byId = _a.byId, indexes = _a.indexes;
        if (!ids || !byId || !indexes)
            throw new Error("The table \"" + this.schema.name + "\" has an invalid state: " + printObject(state));
        if (!this.state.name)
            this.state.name = schema.name;
    }
    TableModel.prototype.all = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
    };
    Object.defineProperty(TableModel.prototype, "length", {
        get: function () {
            return this.state.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    TableModel.prototype.getValues = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return _this.state.byId[id]; });
    };
    TableModel.prototype.filter = function (predicate) {
        return this.all().filter(predicate);
    };
    TableModel.prototype.map = function (mapFn) {
        return this.all().map(mapFn);
    };
    TableModel.prototype.index = function (name, fk) {
        utils.ensureParamString("value", name);
        utils.ensureParamString("fk", fk);
        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    };
    TableModel.prototype.get = function (id) {
        if (!this.exists(id))
            throw new Error("No \"" + this.schema.name + "\" record with id: " + id + " exists.");
        return this.schema.db.factory.newRecordModel(utils.asID(id), this);
    };
    TableModel.prototype.getOrDefault = function (id) {
        return this.exists(id) ? this.get(id) : null;
    };
    TableModel.prototype.getByFk = function (fieldName, id) {
        utils.ensureParam("fieldName", fieldName);
        id = utils.ensureID(id);
        var field = this.schema.fields.filter(function (f) { return f.isForeignKey && f.name === fieldName; })[0];
        if (!field)
            throw new Error("No foreign key named: " + fieldName + " in the schema: \"" + this.schema.name + "\".");
        return new RecordSetModel(this, field, { id: id });
    };
    TableModel.prototype.getFieldValue = function (id, field) {
        var record = this.getOrDefault(id);
        if (record)
            return record.value[field];
        else
            return undefined;
    };
    TableModel.prototype.getValue = function (id) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    };
    TableModel.prototype.exists = function (id) {
        if (!utils.isValidID(id))
            return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    };
    TableModel.prototype.insert = function (data) {
        return this.insertMany(data)[0];
    };
    TableModel.prototype.insertMany = function (data) {
        return this._normalizedAction(data, this.insertNormalized, true);
    };
    TableModel.prototype.update = function (data) {
        return this.updateMany(data)[0];
    };
    TableModel.prototype.updateMany = function (data) {
        return this._normalizedAction(data, this.updateNormalized, false);
    };
    TableModel.prototype.upsert = function (data) {
        return this._normalizedAction(data, this.upsertNormalized, true)[0];
    };
    TableModel.prototype.upsertRaw = function (data) {
        return this._normalizedAction(data, this.upsertNormalized, true);
    };
    TableModel.prototype.delete = function (id) {
        if (typeof id !== "string" && typeof id !== "number")
            id = this.schema.getPrimaryKey(id);
        if (!this.exists(id))
            return false;
        id = utils.asID(id);
        this._deleteCascade(id);
        var byId = __assign({}, this.state.byId), ids = this.state.ids.slice(), indexes = __assign({}, this.state.indexes), record = byId[id];
        delete byId[id];
        var idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);
        if (record)
            this._cleanIndexes(id, record, indexes);
        this.dirty = true;
        this.state = __assign({}, this.state, { byId: byId, ids: ids, indexes: indexes });
        return true;
    };
    TableModel.prototype.deleteAll = function () {
        if (this.length)
            this.all().forEach(function (d) { return d.delete(); });
    };
    TableModel.prototype.insertNormalized = function (table) {
        var _this = this;
        utils.ensureParam("table", table);
        this.dirty = true;
        this.state = __assign({}, this.state, { ids: utils.mergeIds(this.state.ids, table.ids, true), byId: __assign({}, this.state.byId, table.byId) });
        this._updateIndexes(table);
        return table.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
    };
    TableModel.prototype.updateNormalized = function (table) {
        var _this = this;
        utils.ensureParam("table", table);
        var state = __assign({}, this.state), dirty = false;
        var records = Object.keys(table.byId).map(function (id) {
            if (!_this.state.byId[id])
                throw new Error("Failed to apply update. No \"" + _this.schema.name + "\" record with id: " + id + " exists.");
            var oldRecord = state.byId[id];
            var newRecord = __assign({}, oldRecord, table.byId[id]);
            var isModified = _this.schema.isModified(oldRecord, newRecord);
            if (isModified) {
                state.byId[id] = newRecord;
                dirty = true;
            }
            return _this.schema.db.factory.newRecordModel(id, _this);
        });
        if (dirty) {
            this.dirty = true;
            this.state = state;
            this._updateIndexes(table);
        }
        return records;
    };
    TableModel.prototype.upsertNormalized = function (norm) {
        var _this = this;
        utils.ensureParam("table", norm);
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
    TableModel.prototype._normalizedAction = function (data, action, normalizePKs) {
        utils.ensureParam("data", data);
        utils.ensureParam("action", action);
        var ctx = new DbNormalizeContext(this.schema, normalizePKs);
        this.schema.normalize(data, ctx);
        var table = ctx.output[this.schema.name];
        var records = table ? action.call(this, table) : [];
        this.session.upsert(ctx);
        return records;
    };
    TableModel.prototype._updateIndexes = function (table) {
        var _this = this;
        Object.keys(table.indexes).forEach(function (key) {
            var idx = _this.state.indexes[key] || (_this.state.indexes[key] = { unique: table.indexes[key].unique, values: {} });
            Object.keys(table.indexes[key].values).forEach(function (fk) {
                var idxBucket = idx.values[fk] || (idx.values[fk] = []);
                var modifiedBucket = utils.mergeIds(idxBucket, table.indexes[key].values[fk], false);
                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error("The insert/update operation violates the unique foreign key \"" + _this.schema.name + "." + key + "\".");
                idx.values[fk] = modifiedBucket;
            });
        });
    };
    TableModel.prototype._cleanIndexes = function (id, record, indexes) {
        var fks = this.schema.getForeignKeys(record);
        fks.forEach(function (fk) {
            var fkIdx = -1;
            if (fk.value && indexes[fk.name] && indexes[fk.name].values[fk.value])
                fkIdx = indexes[fk.name].values[fk.value].indexOf(id);
            if (fkIdx >= 0) {
                var idxBucket = indexes[fk.name].values[fk.value].slice();
                idxBucket.splice(fkIdx, 1);
                indexes[fk.name].values[fk.value] = idxBucket;
            }
            else if (indexes[fk.name]) {
                delete indexes[fk.name].values[id];
                if (Object.keys(indexes[fk.name].values).length === 0)
                    delete indexes[fk.name];
            }
        });
    };
    TableModel.prototype._deleteCascade = function (id) {
        var cascade = this.schema.relations.filter(function (rel) { return rel.relationName && rel.cascade; });
        if (cascade.length) {
            var model_1 = this.get(id);
            model_1 && cascade.forEach(function (schema) {
                var relation = model_1[schema.relationName];
                if (relation) {
                    relation.delete();
                }
            });
        }
    };
    return TableModel;
}());
exports.TableModel = TableModel;
var RecordModel = /** @class */ (function () {
    function RecordModel(id, table) {
        this.id = utils.ensureParam("id", id);
        this.table = utils.ensureParam("table", table);
    }
    Object.defineProperty(RecordModel.prototype, "value", {
        get: function () {
            return this.table.getValue(this.id) || {};
        },
        set: function (data) {
            this.update(data);
        },
        enumerable: true,
        configurable: true
    });
    RecordModel.prototype.delete = function () {
        this.table.delete(this.id);
    };
    RecordModel.prototype.update = function (data) {
        this.table.schema.injectKeys(data, this);
        this.table.update(data);
        return this;
    };
    return RecordModel;
}());
exports.RecordModel = RecordModel;
var RecordFieldModel = /** @class */ (function () {
    function RecordFieldModel(schema, record) {
        this.schema = utils.ensureParam("schema", schema);
        this.record = utils.ensureParam("record", record);
        this.name = utils.ensureParamString("schema.name", schema.name);
    }
    Object.defineProperty(RecordFieldModel.prototype, "value", {
        get: function () {
            return this.schema.getRecordValue(this.record);
        },
        enumerable: true,
        configurable: true
    });
    return RecordFieldModel;
}());
exports.RecordFieldModel = RecordFieldModel;
var RecordSetModel = /** @class */ (function () {
    function RecordSetModel(table, schema, owner) {
        this.table = utils.ensureParam("table", table);
        this.schema = utils.ensureParam("schema", schema);
        this.owner = utils.ensureParam("owner", owner);
    }
    Object.defineProperty(RecordSetModel.prototype, "value", {
        get: function () {
            return this.map(function (r) { return r.value; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecordSetModel.prototype, "ids", {
        get: function () {
            return this.table.index(this.schema.name, this.owner.id);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecordSetModel.prototype, "length", {
        get: function () {
            return this.ids.length;
        },
        enumerable: true,
        configurable: true
    });
    RecordSetModel.prototype.all = function () {
        var _this = this;
        return this.ids.map(function (id) { return _this.table.schema.db.factory.newRecordModel(id, _this.table); });
    };
    RecordSetModel.prototype.map = function (callback) {
        return this.all().map(callback);
    };
    RecordSetModel.prototype.filter = function (callback) {
        return this.all().filter(callback);
    };
    RecordSetModel.prototype.add = function (data) {
        this.table.insert(this._normalize(data));
    };
    RecordSetModel.prototype.remove = function (data) {
        var _this = this;
        this._normalize(data).forEach(function (obj) {
            var pk = _this.table.schema.getPrimaryKey(obj);
            _this.table.delete(pk);
        });
    };
    RecordSetModel.prototype.update = function (data) {
        this.table.update(this._normalize(data));
        return this;
    };
    RecordSetModel.prototype.delete = function () {
        var _this = this;
        this.ids.forEach(function (id) { return _this.table.delete(id); });
    };
    RecordSetModel.prototype._normalize = function (data) {
        return this.table.schema.inferRelations(data, this.schema, this.owner.id);
    };
    return RecordSetModel;
}());
exports.RecordSetModel = RecordSetModel;
