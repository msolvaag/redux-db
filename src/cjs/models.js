"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var FieldModel = (function () {
    function FieldModel(state, schema) {
    }
    return FieldModel;
}());
var SessionModel = (function () {
    function SessionModel(state, schema) {
        if (state === void 0) { state = {}; }
        this.state = state;
        this.tables = schema.tables.map(function (t) { return new TableModel(state[t.name], t); });
    }
    SessionModel.prototype.update = function (data) {
    };
    return SessionModel;
}());
exports.SessionModel = SessionModel;
var TableModel = (function () {
    function TableModel(state, schema) {
        if (state === void 0) { state = { ids: [], byId: {} }; }
        this._records = [];
        this.stateRef = { state: state };
        this.schema = schema;
        this.RecordClass = createPrototype(schema);
    }
    TableModel.prototype.all = function () {
        var _this = this;
        var records = this.stateRef.state.ids.map(function (id) { return _this.stateRef.state.byId[id]; });
        return this._records = records.map(function (r) { return new _this.RecordClass(r, _this.schema); });
    };
    TableModel.prototype.filter = function (predicate) {
        return this.all().filter(predicate);
    };
    TableModel.prototype.get = function (id) {
        var record = this.stateRef.state.byId[id];
        if (!record)
            throw new Error("No \"" + this.schema.name + "\" record with id: " + id + " exists.");
        return new this.RecordClass(record, this.schema);
    };
    TableModel.prototype.exists = function (id) {
        return this.stateRef.state.byId[id] !== undefined;
    };
    TableModel.prototype.insert = function (data) {
        var record = this.schema.normalize(data);
        var pk = this.schema.getPrimaryKey(record);
        var _a = this.stateRef.state, byId = _a.byId, ids = _a.ids;
        this.stateRef.state = { byId: tslib_1.__assign({}, byId, (_b = {}, _b[pk] = record, _b)), ids: ids.concat([pk]) };
        return new this.RecordClass(record, this.schema);
        var _b;
    };
    TableModel.prototype.update = function (data) {
    };
    TableModel.prototype.upsert = function (data) {
    };
    return TableModel;
}());
exports.TableModel = TableModel;
var RecordModel = (function () {
    function RecordModel(state, schema) {
        this.state = state;
        this.schema = schema;
    }
    RecordModel.prototype.delete = function () {
    };
    RecordModel.prototype.update = function (data) {
        this.state = tslib_1.__assign({}, this.state, data);
    };
    return RecordModel;
}());
exports.RecordModel = RecordModel;
var RecordSet = (function () {
    function RecordSet() {
    }
    RecordSet.prototype.insert = function (data) {
    };
    return RecordSet;
}());
exports.RecordSet = RecordSet;
var createPrototype = function (schema) {
    var ModelClass = (function (_super) {
        tslib_1.__extends(ModelClass, _super);
        function ModelClass(state, schema) {
            return _super.call(this, state, schema) || this;
        }
        return ModelClass;
    }(RecordModel));
    schema.fields.forEach(function (field) {
        Object.defineProperty(ModelClass, field.name, {});
    });
    return ModelClass;
};
