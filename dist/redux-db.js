var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
    exports.arrayMerge = function (a, b) {
        var hash = {}, i;
        for (i = 0; i < a.length; i++) {
            hash[a[i]] = true;
        }
        for (i = 0; i < b.length; i++) {
            hash[b[i]] = true;
        }
        return Object.keys(hash);
    };
    // Compares two objects for simple equality. 
    // Arrays are compared only at first level.
    exports.isEqual = function (a, b) {
        if (a === b)
            return true;
        var aKeys = Object.keys(a);
        var bKeys = Object.keys(b);
        var len = aKeys.length;
        if (bKeys.length !== len) {
            return false;
        }
        for (var i = 0; i < len; i++) {
            var key = aKeys[i];
            if (Array.isArray(a[key]) && Array.isArray(b[key]) && arrayIsShallowEqual(a[key], b[key]))
                continue;
            if (a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    };
    var arrayIsShallowEqual = function (a, b) {
        if (a === b) {
            return true;
        }
        var len = a.length;
        if (b.length !== len) {
            return false;
        }
        for (var i = 0; i < len; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    };
});
define("schema", ["require", "exports", "utils"], function (require, exports, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                        record[fk.name] = fkPks[0];
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
});
define("models", ["require", "exports", "schema", "utils"], function (require, exports, schema_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                    else if (indexes[fk.name]) {
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
});
define("index", ["require", "exports", "schema", "models", "utils"], function (require, exports, schema_2, models_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Record = models_1.RecordModel;
    exports.RecordSet = models_1.RecordSet;
    exports.Table = models_1.TableModel;
    var defaultOptions = {};
    exports.createDatabase = function (schema, options) {
        return new Database(schema, __assign({}, defaultOptions, options));
    };
    var Database = /** @class */ (function () {
        function Database(schema, options) {
            var _this = this;
            this._cache = {};
            this.options = options;
            this.normalizeHooks = options.onNormalize || {};
            this.tables = Object.keys(schema).map(function (tableName) { return new schema_2.TableSchema(_this, tableName, schema[tableName]); });
            this.tables.forEach(function (table) { return table.connect(_this.tables); });
        }
        Database.prototype.combineReducers = function () {
            var _this = this;
            var reducers = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                reducers[_i] = arguments[_i];
            }
            return function (state, action) {
                if (state === void 0) { state = {}; }
                var session = _this.createSession(state);
                reducers.forEach(function (reducer) {
                    reducer(session.tables, action);
                });
                return session.commit();
            };
        };
        Database.prototype.createSession = function (state, options) {
            return new DatabaseSession(state, this, __assign({ readOnly: false }, options));
        };
        Database.prototype.selectTables = function (state) {
            var _this = this;
            var tableSchemas = Object.keys(state).map(function (tableName) {
                var tableSchema = _this.tables.filter(function (s) { return s.name === tableName; })[0];
                if (!tableSchema)
                    throw new Error("Cloud not select table. The schema with name: " + tableName + " is not defined.");
                return tableSchema;
            });
            var partialSession = new DatabaseSession(state, { tables: tableSchemas }, { readOnly: true });
            return partialSession.tables;
        };
        Database.prototype.selectTable = function (name, tableState) {
            return this.selectTables((_a = {}, _a[name] = tableState, _a))[name];
            var _a;
        };
        Database.prototype.cache = function (key, valueFn) {
            return (this._cache[key] || (valueFn && (this._cache[key] = valueFn())));
        };
        Database.prototype.clearCache = function (key) {
            delete this._cache[key];
        };
        return Database;
    }());
    exports.Database = Database;
    var DatabaseSession = /** @class */ (function () {
        function DatabaseSession(state, schema, options) {
            if (state === void 0) { state = {}; }
            var _this = this;
            this.state = state;
            this.db = schema;
            this.options = options;
            this.tables = utils.toObject(schema.tables.map(function (t) { return new models_1.TableModel(_this, state[t.name], t); }), function (t) { return t.schema.name; });
        }
        DatabaseSession.prototype.upsert = function (ctx) {
            var _this = this;
            if (this.options.readOnly)
                throw new Error("Invalid attempt to alter a readonly session.");
            Object.keys(ctx.output).forEach(function (name) {
                if (name !== ctx.schema.name) {
                    _this.tables[name].upsertNormalized(ctx.output[name]);
                }
            });
            Object.keys(ctx.emits).forEach(function (name) {
                if (name !== ctx.schema.name) {
                    _this.tables[name].upsert(ctx.emits[name]);
                }
            });
        };
        DatabaseSession.prototype.commit = function () {
            var _this = this;
            if (this.options.readOnly)
                throw new Error("Invalid attempt to alter a readonly session.");
            Object.keys(this.tables).forEach(function (table) {
                var oldState = _this.state[table];
                var newState = _this.tables[table].state;
                if (oldState !== newState)
                    _this.state = __assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
                var _a;
            });
            return this.state;
        };
        return DatabaseSession;
    }());
    exports.DatabaseSession = DatabaseSession;
});
