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
define("utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toArray = function (obj) {
        if (!obj)
            return [];
        if (Array.isArray(obj))
            return obj;
        else if (typeof obj === 'object')
            return Object.keys(obj).map(function (key) { return obj[key]; });
        else
            return [];
    };
    exports.ensureArray = function (obj) {
        if (!obj)
            return [];
        if (Array.isArray(obj))
            return obj;
        else
            return [obj];
    };
    exports.toObject = function (a, key) {
        return a.reduce(function (o, v) { o[key(v)] = v; return o; }, {});
    };
    exports.isObject = function (val) {
        return val != null
            && typeof val === 'object'
            && Array.isArray(val) === false;
    };
    var isObjectObject = function (o) {
        return exports.isObject(o)
            && Object.prototype.toString.call(o) === '[object Object]';
    };
    exports.isPlainObject = function (o) {
        var ctor, prot;
        return isObjectObject(o)
            && typeof (ctor = o.constructor) !== "function"
            && isObjectObject(prot = ctor.prototype)
            && prot.hasOwnProperty("isPrototypeOf");
    };
});
define("schema", ["require", "exports", "utils"], function (require, exports, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                var pk = _this.getPrimaryKey(obj);
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
                return x[this._stampFields[0]] !== y[this._stampFields[0]];
            else if (this._stampFields.length > 1) {
                return this._stampFields.reduce(function (p, n) {
                    return p + (x[_this._stampFields[0]] !== y[_this._stampFields[0]] ? 1 : 0);
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
});
define("models", ["require", "exports", "utils"], function (require, exports, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                    _this.state = __assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
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
            var byId = __assign({}, this.state.byId), ids = this.state.ids.slice();
            delete byId[id];
            var idx = ids.indexOf(id);
            if (idx >= 0)
                ids.splice(idx, 1);
            this.state = __assign({}, this.state, { byId: byId, ids: ids });
        };
        TableModel.prototype.insertNormalized = function (table) {
            var _this = this;
            this.state = { ids: this.state.ids.concat(table.ids), byId: __assign({}, this.state.byId, table.byId) };
            return table.ids.map(function (id) { return ModelFactory.default.newRecordModel(id, _this); });
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
                __extends(Record, _super);
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
});
define("index", ["require", "exports", "schema", "models"], function (require, exports, schema_1, models_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Record = models_1.RecordModel;
    exports.RecordSet = models_1.RecordSet;
    exports.Table = models_1.TableModel;
    exports.createDatabase = function (name, schema) {
        var tableSchemas = Object.keys(schema).map(function (tableName) { return new schema_1.TableSchema(tableName, schema[tableName]); });
        // connect
        tableSchemas.forEach(function (table) { return table.connect(tableSchemas); });
        return new Database(name, tableSchemas);
    };
    var combineSchemaReducers = function (db, reducers) {
        return function (state, action) {
            if (state === void 0) { state = {}; }
            var session = db.createSession(state);
            reducers.forEach(function (reducer) {
                reducer(session.tables, action);
            });
            return session.commit();
        };
    };
    exports.combineReducers = combineSchemaReducers;
    var Database = (function () {
        function Database(name, tables) {
            this.name = name;
            this.tables = tables;
        }
        Database.prototype.combineReducers = function () {
            var reducers = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                reducers[_i] = arguments[_i];
            }
            return combineSchemaReducers(this, reducers);
        };
        Database.prototype.createSession = function (state) {
            return new models_1.Session(state, this);
        };
        return Database;
    }());
    exports.Database = Database;
});
