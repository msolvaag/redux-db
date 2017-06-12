"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var utils = require("./utils");
var Session = (function () {
    function Session(state, schema) {
        if (state === void 0) { state = {}; }
        var _this = this;
        this.state = state;
        this.tables = utils.toObject(schema.tables.map(function (t) { return new TableModel(_this, state[t.name], t); }), function (t) { return t.schema.name; });
    }
    Session.prototype.upsert = function (state, from) {
        var _this = this;
        Object.keys(state).forEach(function (name) {
            if (!from || name !== from.schema.name) {
                _this.tables[name].upsertNormalized(state[name]);
            }
        });
    };
    Session.prototype.commit = function () {
        var _this = this;
        Object.keys(this.tables).forEach(function (table) {
            var oldState = _this.state[table];
            var newState = _this.tables[table].state;
            if (oldState !== newState)
                _this.state = tslib_1.__assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
            var _a;
        });
        return this.state;
    };
    return Session;
}());
exports.Session = Session;
var TableModel = (function () {
    function TableModel(session, state, schema) {
        if (state === void 0) { state = { ids: [], byId: {} }; }
        this.session = session;
        this.state = state;
        this.schema = schema;
    }
    TableModel.prototype.all = function () {
        var _this = this;
        return this.state.ids.map(function (id) { return ModelFactory.default.newRecordModel(id, _this); });
    };
    TableModel.prototype.filter = function (predicate) {
        return this.all().filter(predicate);
    };
    TableModel.prototype.get = function (id) {
        id = id.toString();
        if (!this.exists(id))
            throw new Error("No \"" + this.schema.name + "\" record with id: " + id + " exists.");
        return ModelFactory.default.newRecordModel(id, this);
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
        var byId = tslib_1.__assign({}, this.state.byId), ids = this.state.ids.slice();
        delete byId[id];
        var idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);
        this.state = tslib_1.__assign({}, this.state, { byId: byId, ids: ids });
    };
    TableModel.prototype.insertNormalized = function (table) {
        var _this = this;
        this.state = { ids: this.state.ids.concat(table.ids), byId: tslib_1.__assign({}, this.state.byId, table.byId) };
        return table.ids.map(function (id) { return ModelFactory.default.newRecordModel(id, _this); });
    };
    TableModel.prototype.updateNormalized = function (table) {
        var _this = this;
        var state = tslib_1.__assign({}, this.state), dirty = false;
        var records = Object.keys(table.byId).map(function (id) {
            if (!_this.state.byId[id])
                throw new Error("Failed to apply update. No \"" + _this.schema.name + "\" record with id: " + id + " exists.");
            var newRecord = table.byId[id];
            var oldRecord = state.byId[id];
            var isModified = _this.schema.isModified(oldRecord, newRecord);
            if (isModified) {
                state.byId[id] = tslib_1.__assign({}, oldRecord, newRecord);
                dirty = true;
            }
            return ModelFactory.default.newRecordModel(id, _this);
        });
        if (dirty)
            this.state = state;
        return records;
    };
    TableModel.prototype.upsertNormalized = function (norm) {
        var _this = this;
        var toUpdate = { ids: [], byId: {} };
        var toInsert = { ids: [], byId: {} };
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
        return (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat((toInsert.ids.length ? this.insertNormalized(toInsert) : []));
    };
    TableModel.prototype._normalizedAction = function (data, action) {
        var norm = this.schema.normalize(data);
        var table = norm[this.schema.name];
        var records = table ? action.call(this, table) : [];
        this.session.upsert(norm, this);
        return records;
    };
    return TableModel;
}());
exports.TableModel = TableModel;
var RecordModel = (function () {
    function RecordModel(id, table) {
        this.id = id;
        this.table = table;
    }
    Object.defineProperty(RecordModel.prototype, "value", {
        get: function () {
            return this.table.state.byId[this.id];
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
var RecordField = (function () {
    function RecordField(schema, record) {
        this.name = schema.name;
        this.schema = schema;
        this.record = record;
    }
    Object.defineProperty(RecordField.prototype, "value", {
        get: function () {
            return this.record.value[this.name];
        },
        enumerable: true,
        configurable: true
    });
    return RecordField;
}());
exports.RecordField = RecordField;
var RecordSet = (function () {
    function RecordSet(records, table, referencedFrom) {
        this.records = records;
        this.table = table;
        this.referencedFrom = referencedFrom;
    }
    RecordSet.prototype.map = function (callback) {
        return this.records.map(callback);
    };
    RecordSet.prototype.insert = function (data) { };
    RecordSet.prototype.update = function (data) { };
    return RecordSet;
}());
exports.RecordSet = RecordSet;
var ModelFactory = (function () {
    function ModelFactory() {
        this._recordClass = {};
    }
    ModelFactory.prototype.newRecordModel = function (id, table) {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this._createRecordModelClass(table.schema)))(id, table);
    };
    ModelFactory.prototype.newRecordField = function (schema, record) {
        if (schema.constraint === "FK" && schema.table === record.table.schema && schema.references) {
            var refTable = record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error("The foreign key " + schema.name + " references an unregistered table: " + schema.table.name);
            var refId = record.value[schema.name];
            return refTable.getOrDefault(refId);
        }
        else if (schema.constraint === "FK" && schema.table !== record.table.schema && schema.relationName) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error("The foreign key " + schema.name + " references an unregistered table: " + schema.table.name);
            var refRecords = refTable.filter(function (r) {
                var refId = r.value[schema.name];
                return refId && refId.toString() === record.id;
            });
            return new RecordSet(refRecords, refTable, new RecordField(schema, record));
        }
        else
            return new RecordField(schema, record);
    };
    ModelFactory.prototype._createRecordModelClass = function (schema) {
        var Record = (function (_super) {
            tslib_1.__extends(Record, _super);
            function Record(id, table) {
                return _super.call(this, id, table) || this;
            }
            return Record;
        }(RecordModel));
        schema.fields.forEach(function (field) {
            if (field.constraint == "FK")
                Object.defineProperty(Record.prototype, field.propName, {
                    get: function () {
                        return ModelFactory.default.newRecordField(field, this);
                    },
                    set: function (value) {
                        return this.update((_a = {}, _a[field.name] = value, _a));
                        var _a;
                    }
                });
        });
        schema.relations.forEach(function (field) {
            if (field.relationName)
                Object.defineProperty(Record.prototype, field.relationName, {
                    get: function () {
                        return ModelFactory.default.newRecordField(field, this);
                    },
                    set: function (value) {
                        throw new Error("Invalid attempt to set an foreign table relation field.");
                    }
                });
        });
        return Record;
    };
    return ModelFactory;
}());
ModelFactory.default = new ModelFactory();
