var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("dist/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TYPE_PK = "PK";
    exports.TYPE_ATTR = "ATTR";
    exports.TYPE_MODIFIED = "MODIFIED";
    exports.RESERVED_PROPERTIES = ["id", "table", "value", "_fields"];
    exports.initialState = function (name) {
        return ({ ids: [], byId: {}, indexes: {}, name: name });
    };
});
// tslint:disable:max-line-length
define("src/errors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        argument: function (name, type) { return "Missing a valid " + type + " for the argument \"" + name + "\""; },
        argumentShape: function (name, props) { return "Argument \"" + name + "\" has an invalid shape. Missing required props: \"" + props.join(", ") + "\""; },
        fkInvalid: function (table, key) { return "The foreign key " + table + "." + key + " is invalid"; },
        fkInvalidReference: function (table, key, reference) { return "The field schema \"" + table + "." + key + "\" has an invalid reference to unknown table \"" + reference + "\"."; },
        fkReferenceNotInSession: function (key, references) { return "The foreign key: \"" + key + "\" references an unregistered table: \"" + references + "\" in the current session."; },
        fkUndefined: function (table, key) { return "No foreign key named: " + key + " in the schema: \"" + table + "\"."; },
        fkViolation: function (table, key) { return "The insert/update operation violates the unique foreign key \"" + table + "." + key + "\"."; },
        invalidId: function () { return 'The given value is not a valid "id". An "id" must be a non-empty string or a number.'; },
        pkNotFound: function (table) { return "Failed to get primary key for record of type \"" + table + "\"."; },
        recordNotFound: function (table, id) { return "No \"" + table + "\" record with id: " + id + " exists."; },
        recordUpdateViolation: function (table, id) { return "Failed to apply update. No \"" + table + "\" record with id: " + id + " exists."; },
        reservedProperty: function (name, prop) { return "The property \"" + name + "." + prop + "\" is a reserved name. Please specify another name using the \"propName\" definition."; },
        sessionReadonly: function () { return "Invalid attempt to alter a readonly session."; },
        stateTableUndefined: function () { return "Failed to select table. Could not identify table schema."; },
        tableInvalidState: function (table) { return "The table \"" + table + "\" has an invalid state."; },
        tableNotInSession: function (table) { return "The table: \"" + table + "\" does not exist in the current session."; },
        uniqueConstraintViolation: function (id) { return "Operation violates unique constraint for id: \"" + id + "\""; },
    };
});
define("src/models/DatabaseSession", ["require", "exports", "src/errors", "src/utils"], function (require, exports, errors_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DatabaseSession = /** @class */ (function () {
        function DatabaseSession(state, db, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            this.state = utils_1.ensureParamObject("state", state);
            this.db = utils_1.ensureParamObject("db", db);
            var _a = options.readOnly, readOnly = _a === void 0 ? false : _a, _b = options.tableSchemas, tableSchemas = _b === void 0 ? db.tables : _b;
            this.readOnly = readOnly;
            this.tables = utils_1.toObject(tableSchemas.map(function (tableSchema) {
                return _this.db.factory.newTableModel(_this, tableSchema, state[tableSchema.name]);
            }), function (t) { return t.schema.name; });
        }
        DatabaseSession.prototype.getTable = function (name) {
            return this.tables[name];
        };
        DatabaseSession.prototype.upsert = function (ctx) {
            var _this = this;
            if (this.readOnly)
                throw new Error(errors_1.default.sessionReadonly());
            Object.keys(ctx.output).forEach(function (name) {
                if (name !== ctx.schema.name)
                    _this.tables[name].upsertNormalized(ctx.output[name]);
            });
            Object.keys(ctx.emits).forEach(function (name) {
                if (name !== ctx.schema.name)
                    _this.tables[name].upsert(ctx.emits[name]);
            });
        };
        DatabaseSession.prototype.commit = function () {
            var _this = this;
            if (this.readOnly)
                throw new Error(errors_1.default.sessionReadonly());
            Object.keys(this.tables).forEach(function (table) {
                var _a;
                var oldState = _this.state[table];
                var newState = _this.tables[table].state;
                if (oldState !== newState)
                    _this.state = __assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
            });
            return this.state;
        };
        return DatabaseSession;
    }());
    exports.default = DatabaseSession;
});
define("src/models/Database", ["require", "exports", "src/DefaultModelFactory", "src/utils", "src/models/DatabaseSession"], function (require, exports, DefaultModelFactory_1, utils_2, DatabaseSession_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultOptions = {
        cascadeAsDefault: false
    };
    var getMappedFunction = function (map, key, defaultFn) {
        if (!map)
            return defaultFn;
        if (typeof map === "function")
            return map;
        else if (map[key])
            return map[key];
        return defaultFn;
    };
    var Database = /** @class */ (function () {
        function Database(schema, options) {
            var _this = this;
            this.getNormalizer = function (schemaName) {
                return getMappedFunction(_this.options.onNormalize, schemaName);
            };
            this.getPkGenerator = function (schemaName) {
                return getMappedFunction(_this.options.onGeneratePK, schemaName);
            };
            this.getRecordComparer = function (schemaName) {
                return getMappedFunction(_this.options.onRecordCompare, schemaName, utils_2.isEqual);
            };
            utils_2.ensureParamObject("schema", schema);
            this.schema = schema;
            this.options = __assign({}, defaultOptions, options);
            this.factory = this.options.factory || new DefaultModelFactory_1.default();
            this.tables = Object.keys(schema).map(function (tableName) {
                return _this.factory.newTableSchema(_this, tableName, schema[tableName]);
            });
            this.tableMap = utils_2.toObject(this.tables, function (t) { return t.name; });
            this.tables.forEach(function (table) { return table.connect(_this.tableMap); });
        }
        Database.prototype.combineReducers = function () {
            var _this = this;
            var reducers = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                reducers[_i] = arguments[_i];
            }
            return function (state, action) {
                if (state === void 0) { state = {}; }
                return _this.reduce(state, action, reducers);
            };
        };
        Database.prototype.reduce = function (state, action, reducers) {
            var _this = this;
            if (state === void 0) { state = {}; }
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            var session = this.createSession(state);
            utils_2.ensureArray(reducers).forEach(function (reducer) {
                return reducer.apply(_this, [session.tables, action].concat(args));
            });
            return session.commit();
        };
        Database.prototype.createSession = function (state, options) {
            if (state === void 0) { state = {}; }
            return new DatabaseSession_1.default(state, this, __assign({ readOnly: false }, options));
        };
        Database.prototype.getTableSchema = function (name) {
            return this.tableMap[name];
        };
        Database.prototype.wrapTables = function (state) {
            var _this = this;
            var tableSchemas = Object.keys(state)
                .filter(function (tableName) { return _this.tableMap[tableName]; })
                .map(function (tableName) { return _this.tableMap[tableName]; });
            var session = this.createSession(state, {
                readOnly: true,
                tableSchemas: tableSchemas
            });
            return session.tables;
        };
        Database.prototype.selectTables = function (state) {
            return this.wrapTables(state);
        };
        return Database;
    }());
    exports.default = Database;
});
define("src/models/RecordModel", ["require", "exports", "src/utils"], function (require, exports, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordModel = /** @class */ (function () {
        function RecordModel(id, table) {
            this.id = utils_3.ensureParamString("id", id);
            this.table = utils_3.ensureParamObject("table", table);
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
    exports.default = RecordModel;
});
define("src/models/RecordSetModel", ["require", "exports", "src/errors", "src/utils"], function (require, exports, errors_2, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordSetModel = /** @class */ (function () {
        function RecordSetModel(table, schema, owner) {
            this.table = utils_4.ensureParamObject("table", table);
            this.schema = utils_4.ensureParamObject("schema", schema);
            this.owner = utils_4.ensureParamObject("owner", owner, "id");
        }
        Object.defineProperty(RecordSetModel.prototype, "ids", {
            get: function () {
                return this.table.getIndex(this.schema.name, this.owner.id);
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
            return this.ids.map(function (id) {
                return _this.table.schema.db.factory.newRecordModel(id, _this.table);
            });
        };
        RecordSetModel.prototype.values = function () {
            var _this = this;
            return this.ids.map(function (id) {
                var value = _this.table.getValue(id);
                if (!value)
                    throw new Error(errors_2.default.recordNotFound(_this.table.schema.name, id));
                return value;
            });
        };
        RecordSetModel.prototype.add = function (data) {
            return this.table.insert(this._normalize(data));
        };
        RecordSetModel.prototype.remove = function (data) {
            var _this = this;
            var ids = this._normalize(data).map(function (obj) {
                return _this.table.schema.getPrimaryKey(obj);
            });
            return this.table.delete(ids);
        };
        RecordSetModel.prototype.update = function (data) {
            return this.table.update(this._normalize(data));
        };
        RecordSetModel.prototype.delete = function () {
            this.table.delete(this.ids);
        };
        RecordSetModel.prototype._normalize = function (data) {
            return this.table.schema.inferRelations(data, this.schema, this.owner.id);
        };
        return RecordSetModel;
    }());
    exports.default = RecordSetModel;
});
define("src/models/NormalizeContext", ["require", "exports", "src/utils"], function (require, exports, utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DbNormalizeContext = /** @class */ (function () {
        function DbNormalizeContext(schema, normalizePKs) {
            this.output = {};
            this.emits = {};
            this.schema = utils_5.ensureParamObject("schema", schema, "db");
            this.db = schema.db;
            this.normalizePKs = normalizePKs;
        }
        DbNormalizeContext.prototype.emit = function (tableName, record) {
            this.emits[tableName] = this.emits[tableName] || [];
            this.emits[tableName].push(record);
        };
        return DbNormalizeContext;
    }());
    exports.default = DbNormalizeContext;
});
define("src/models/TableState", ["require", "exports", "src/errors", "src/utils"], function (require, exports, errors_3, utils_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = function (original, modified) {
        var ids = modified.ids
            ? utils_6.mergeIds(original.ids, modified.ids, true)
            : original.ids;
        var byId = modified.byId
            ? __assign({}, original.byId, modified.byId) :
            original.byId;
        return __assign({}, original, { byId: byId,
            ids: ids });
    };
    exports.splice = function (original, idsToDelete) {
        var byId = __assign({}, original.byId);
        var ids = original.ids.slice();
        var indexes = __assign({}, original.indexes);
        var deleted = idsToDelete.reduce(function (n, id) {
            var record = byId[id];
            delete byId[id];
            var idx = ids.indexOf(id);
            if (idx >= 0)
                ids.splice(idx, 1);
            if (record)
                return n.concat([{ id: id, record: record }]);
            return n;
        }, []);
        return {
            deleted: deleted,
            state: __assign({}, original, { byId: byId, ids: ids, indexes: indexes })
        };
    };
    exports.updateIndexes = function (name, original, modified) {
        Object.keys(modified.indexes).forEach(function (key) {
            var idx = original.indexes[key]
                || (original.indexes[key] = { unique: modified.indexes[key].unique, values: {} });
            Object.keys(modified.indexes[key].values).forEach(function (fk) {
                var idxBucket = idx.values[fk] || (idx.values[fk] = []);
                var modifiedBucket = utils_6.mergeIds(idxBucket, modified.indexes[key].values[fk], false);
                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error(errors_3.default.fkViolation(name, key));
                idx.values[fk] = modifiedBucket;
            });
        });
    };
    exports.cleanIndexes = function (keys, id, indexes) {
        keys.forEach(function (fk) {
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
    exports.default = {
        cleanIndexes: exports.cleanIndexes,
        merge: exports.merge,
        splice: exports.splice,
        updateIndexes: exports.updateIndexes
    };
});
define("src/models/TableModel", ["require", "exports", "src/constants", "src/errors", "src/utils", "src/models/NormalizeContext", "src/models/TableState"], function (require, exports, constants_1, errors_4, utils, NormalizeContext_1, TableState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableModel = /** @class */ (function () {
        function TableModel(session, schema, state) {
            this.dirty = false;
            this.session = utils.ensureParamObject("session", session);
            this.schema = utils.ensureParamObject("schema", schema);
            this.state = utils.ensureParamObject("state", state || constants_1.initialState(this.schema.name));
            var _a = this.state, ids = _a.ids, byId = _a.byId, indexes = _a.indexes, name = _a.name;
            if (!ids || !byId || !indexes)
                throw new Error(errors_4.default.tableInvalidState(schema.name));
            if (!name)
                this.state.name = name;
        }
        Object.defineProperty(TableModel.prototype, "length", {
            get: function () {
                return this.state.ids.length;
            },
            enumerable: true,
            configurable: true
        });
        TableModel.prototype.all = function () {
            var _this = this;
            return this.state.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
        };
        TableModel.prototype.values = function () {
            var _this = this;
            return this.state.ids.map(function (id) { return _this.state.byId[id]; });
        };
        TableModel.prototype.exists = function (id) {
            if (!utils.isValidID(id))
                return false;
            return this.state.byId[utils.asID(id)] !== undefined;
        };
        TableModel.prototype.get = function (id) {
            if (!this.exists(id))
                return undefined;
            return this.schema.db.factory.newRecordModel(utils.asID(id), this);
        };
        TableModel.prototype.getValue = function (id) {
            if (utils.isValidID(id))
                return this.state.byId[id];
            else
                return undefined;
        };
        TableModel.prototype.getIndex = function (name, fk) {
            utils.ensureParamString("name", name);
            utils.ensureParamString("fk", fk);
            if (this.state.indexes[name] && this.state.indexes[name].values[fk])
                return this.state.indexes[name].values[fk];
            else
                return [];
        };
        TableModel.prototype.insert = function (data) {
            return this._normalizedAction(data, this.insertNormalized, true);
        };
        TableModel.prototype.update = function (data) {
            return this._normalizedAction(data, this.updateNormalized, false);
        };
        TableModel.prototype.upsert = function (data) {
            return this._normalizedAction(data, this.upsertNormalized, true);
        };
        TableModel.prototype.delete = function (data) {
            var _this = this;
            utils.ensureParam("data", data);
            var idsToDelete = utils.ensureArray(data).map(function (subject) {
                return utils.isObject(subject)
                    ? _this.schema.getPrimaryKey(subject)
                    : utils.ensureID(subject);
            });
            if (!idsToDelete.length)
                return 0;
            this._deleteCascade(idsToDelete);
            var _a = TableState_1.default.splice(this.state, idsToDelete), deleted = _a.deleted, state = _a.state;
            deleted.forEach(function (_a) {
                var id = _a.id, record = _a.record;
                return _this._cleanIndexes(id, record, state.indexes);
            });
            this.dirty = true;
            this.state = state;
            return deleted.length;
        };
        TableModel.prototype.deleteAll = function () {
            if (this.length) {
                this._deleteCascade(this.state.ids);
                this.state = constants_1.initialState(this.schema.name);
            }
        };
        TableModel.prototype.upsertNormalized = function (norm) {
            var _this = this;
            utils.ensureParamObject("table", norm);
            var toUpdate = constants_1.initialState(this.schema.name);
            var toInsert = constants_1.initialState(this.schema.name);
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
            if (toInsert.ids.length)
                this.insertNormalized(toInsert, false);
            if (toUpdate.ids.length)
                this.updateNormalized(toUpdate, false);
            this._updateIndexes(norm);
        };
        TableModel.prototype.insertNormalized = function (table, updateIndexes) {
            if (updateIndexes === void 0) { updateIndexes = true; }
            utils.ensureParamObject("table", table);
            this.state = TableState_1.default.merge(this.state, table);
            this.dirty = true;
            if (updateIndexes)
                this._updateIndexes(table);
        };
        TableModel.prototype.updateNormalized = function (table, updateIndexes) {
            var _this = this;
            if (updateIndexes === void 0) { updateIndexes = true; }
            utils.ensureParamObject("table", table);
            var byId = table.ids.reduce(function (map, id) {
                var _a;
                if (!_this.exists(id))
                    throw new Error(errors_4.default.recordUpdateViolation(_this.schema.name, id));
                var oldRecord = _this.state.byId[id];
                var newRecord = __assign({}, oldRecord, table.byId[id]);
                var isModified = _this.schema.isModified(oldRecord, newRecord);
                if (isModified)
                    if (map)
                        map[id] = newRecord;
                    else
                        return _a = {}, _a[id] = newRecord, _a;
                return map;
            }, null);
            if (byId) {
                this.dirty = true;
                this.state = TableState_1.default.merge(this.state, { byId: byId });
                if (updateIndexes)
                    this._updateIndexes(table);
            }
        };
        TableModel.prototype._normalizedAction = function (data, action, normalizePKs) {
            utils.ensureParam("data", data);
            utils.ensureParamFunction("action", action);
            var ctx = new NormalizeContext_1.default(this.schema, normalizePKs);
            this.schema.normalize(data, ctx);
            var table = ctx.output[this.schema.name];
            if (table)
                action.call(this, table);
            this.session.upsert(ctx);
            return table.ids;
        };
        TableModel.prototype._cleanIndexes = function (id, record, indexes) {
            var fks = this.schema.getForeignKeys(record);
            TableState_1.default.cleanIndexes(fks, id, indexes);
        };
        TableModel.prototype._updateIndexes = function (table) {
            TableState_1.default.updateIndexes(this.schema.name, this.state, table);
        };
        TableModel.prototype._deleteCascade = function (ids) {
            var _this = this;
            var cascade = this.schema.relations.filter(function (rel) { return rel.relationName && rel.cascade; });
            if (cascade.length)
                ids.forEach(function (id) {
                    var model = _this.get(id);
                    if (model)
                        cascade.forEach(function (schema) {
                            var relation = schema.relationName && model[schema.relationName];
                            if (relation)
                                relation.delete();
                        });
                });
        };
        return TableModel;
    }());
    exports.default = TableModel;
});
define("src/models/FieldSchemaModel", ["require", "exports", "src/constants", "src/errors", "src/utils"], function (require, exports, constants_2, errors_5, utils_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FieldSchemaModel = /** @class */ (function () {
        function FieldSchemaModel(table, name, schema, cascadeAsDefault) {
            if (cascadeAsDefault === void 0) { cascadeAsDefault = false; }
            this.table = utils_7.ensureParamObject("table", table);
            utils_7.ensureParamString("name", name);
            utils_7.ensureParamObject("schema", schema);
            this.type = schema.type || constants_2.TYPE_ATTR;
            this.name = utils_7.optionalParamString("schema.fieldName", schema.fieldName, name);
            this.propName = utils_7.optionalParamString("schema.propName", schema.propName, name);
            this.references = utils_7.optionalParamString("schema.references", schema.references);
            this.isPrimaryKey = schema.pk === true || schema.type === constants_2.TYPE_PK;
            this.isForeignKey = !!this.references;
            this.isStamp = schema.stamp === true || schema.type === constants_2.TYPE_MODIFIED;
            this._valueFactory = schema.value !== undefined
                ? utils_7.ensureParamFunction("schema.value", schema.value).bind(this)
                : undefined;
            if (this.isPrimaryKey || this.isForeignKey) {
                if (this.isForeignKey)
                    this.relationName = utils_7.optionalParamString("schema.relationName", schema.relationName);
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
        Object.defineProperty(FieldSchemaModel.prototype, "refTable", {
            get: function () { return this._refTable; },
            enumerable: true,
            configurable: true
        });
        FieldSchemaModel.prototype.connect = function (schemas) {
            if (this.references) {
                this._refTable = schemas[this.references];
                if (!this._refTable)
                    throw new Error(errors_5.default.fkInvalidReference(this.table.name, this.name, this.references));
            }
        };
        FieldSchemaModel.prototype.getValue = function (data, record) {
            return this._valueFactory ? this._valueFactory(data, {
                record: record,
                schema: this
            }) : data[this.name];
        };
        FieldSchemaModel.prototype.getRecordValue = function (record) {
            return this.getValue(record.value, record);
        };
        return FieldSchemaModel;
    }());
    exports.default = FieldSchemaModel;
});
define("src/models/TableSchemaModel", ["require", "exports", "src/constants", "src/errors", "src/utils", "src/models/FieldSchemaModel"], function (require, exports, constants_3, errors_6, utils, FieldSchemaModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableSchemaModel = /** @class */ (function () {
        function TableSchemaModel(db, name, schema) {
            var _this = this;
            this._relations = [];
            this.db = utils.ensureParam("db", db);
            this.name = utils.ensureParamString("name", name);
            utils.ensureParamObject("schema", schema);
            this.fields = Object.keys(schema)
                .map(function (fieldName) {
                return new FieldSchemaModel_1.default(_this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true);
            });
            this._primaryKeyFields = this.fields.filter(function (f) { return f.isPrimaryKey; });
            this._foreignKeyFields = this.fields.filter(function (f) { return f.isForeignKey; });
            this._stampFields = this.fields.filter(function (f) { return f.isStamp; });
        }
        Object.defineProperty(TableSchemaModel.prototype, "relations", {
            get: function () { return this._relations; },
            enumerable: true,
            configurable: true
        });
        TableSchemaModel.prototype.connect = function (schemas) {
            var _this = this;
            Object.keys(schemas).forEach(function (schema) {
                return _this._relations = _this._relations.concat(schemas[schema].fields.filter(function (f) { return f.references === _this.name; }));
            });
            this._foreignKeyFields.forEach(function (fk) { return fk.connect(schemas); });
        };
        TableSchemaModel.prototype.normalize = function (data, context) {
            var _this = this;
            if (!utils.isObject(data) && !Array.isArray(data))
                throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
            var ctx = utils.ensureParam("context", context);
            if (!ctx.output[this.name])
                ctx.output[this.name] = constants_3.initialState(this.name);
            return utils.ensureArray(data).map(function (obj) {
                if (!utils.isObject(obj))
                    throw new Error("Failed to normalize data. Given record is not a plain object.");
                var subject = obj;
                var normalizer = _this.db.getNormalizer(_this.name);
                if (normalizer)
                    subject = normalizer(subject, ctx);
                var pk = ctx.normalizePKs ? _this._normalizePrimaryKey(subject) : _this._getPrimaryKey(subject);
                if (!pk)
                    throw new Error("Failed to normalize primary key for record of type \"" + _this.name + "\"."
                        + " Make sure record(s) have a primary key value before trying to insert or update a table.");
                var fks = _this.getForeignKeys(subject);
                var tbl = ctx.output[_this.name];
                if (!tbl.byId[pk])
                    tbl.ids.push(pk);
                var record = tbl.byId[pk] = __assign({}, subject);
                fks.forEach(function (fk) {
                    // if the FK is an object, then normalize it and replace object with it's PK.
                    if (typeof fk.value === "object") {
                        var fkPks = fk.refTable.normalize(fk.value, ctx);
                        if (fkPks.length > 1)
                            throw new Error("Invalid schema definition. The field \"" + _this.name + "." + fk.name + "\""
                                + (" is referencing table \"" + fk.refTable.name + "\", but the given data is an array."));
                        record[fk.name] = fk.value = fkPks[0];
                    }
                    // all FK's are auto indexed
                    if (utils.isValidID(fk.value)) {
                        var fkId = utils.asID(fk.value); // ensure string id
                        var idx = tbl.indexes[fk.name] || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });
                        if (!idx.values[fkId])
                            idx.values[fkId] = [];
                        if (idx.unique && idx.values.length)
                            throw new Error("The insert/update operation violates"
                                + (" the unique foreign key \"" + _this.name + "." + fk.name + "\"."));
                        idx.values[fkId].push(pk);
                    }
                });
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
        TableSchemaModel.prototype.inferRelations = function (data, rel, ownerId) {
            if (!rel.isForeignKey)
                return data;
            var otherFks = rel.table.fields.filter(function (f) { return f.isForeignKey && f !== rel; });
            return utils.ensureArray(data).map(function (obj) {
                var _a, _b;
                if (typeof obj === "number" || typeof obj === "string")
                    if (otherFks.length === 1)
                        obj = (_a = {}, _a[otherFks[0].name] = obj, _a);
                    else
                        obj = { id: obj }; // TODO: this might be quite wrong..
                return __assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
            });
        };
        TableSchemaModel.prototype.injectKeys = function (data, record) {
            if (!data || typeof data !== "object")
                return data;
            // inject primary or foreign keys
            var keys = this._primaryKeyFields;
            if (!keys.length)
                keys = this._foreignKeyFields;
            keys.forEach(function (key) {
                if (data[key.name] === undefined)
                    data[key.name] = key.getRecordValue(record);
            });
        };
        TableSchemaModel.prototype.getPrimaryKey = function (record) {
            var pk = this._getPrimaryKey(record);
            if (!pk)
                throw new Error(errors_6.default.pkNotFound(this.name));
            return pk;
        };
        TableSchemaModel.prototype.getForeignKeys = function (record) {
            var _this = this;
            return this._foreignKeyFields.map(function (fk) {
                if (!fk.references || !fk.refTable)
                    throw new Error(errors_6.default.fkInvalid(_this.name, fk.name));
                return {
                    name: fk.name,
                    notNull: fk.notNull,
                    references: fk.references,
                    refTable: fk.refTable,
                    unique: fk.unique === true,
                    value: record[fk.name]
                };
            });
        };
        TableSchemaModel.prototype.isModified = function (x, y) {
            if (this._stampFields.length > 0)
                return this._stampFields.reduce(function (p, n) {
                    return p + (n.getValue(x) === n.getValue(y) ? 1 : 0);
                }, 0) !== this._stampFields.length;
            else {
                var comparer = this.db.getRecordComparer(this.name);
                if (comparer)
                    return !comparer(x, y, this);
                return x === y;
            }
        };
        /// Gets the value of the PK for the given record. Does not throw if none found.
        TableSchemaModel.prototype._getPrimaryKey = function (record) {
            var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
            var combinedPk = lookup.reduce(function (p, n) {
                var k = n.getValue(record);
                return p && k ? (p + "_" + k) : k;
            }, null);
            return utils.isValidID(combinedPk) && utils.asID(combinedPk);
        };
        /// Normalizes the given record with a primary key field. Returns the key value.
        TableSchemaModel.prototype._normalizePrimaryKey = function (record) {
            var pk = this._getPrimaryKey(record);
            if (pk)
                return pk;
            // Invoke the "onGeneratePK" hook if PK not found.
            var generator = this.db.getPkGenerator(this.name);
            if (!generator)
                return undefined;
            var generatedPk = generator(record, this);
            if (generatedPk)
                // if the PK is generated and we have a single PK field definition, then inject it into the record.
                if (this._primaryKeyFields.length === 1)
                    record[this._primaryKeyFields[0].propName] = generatedPk;
            // Handling multiple PK field defs:
            // We may need the "onGeneratePK" hook to return an object defining each key value.
            // BUT this seems like a rare scenario..
            // So for now; don't populate record.
            return generatedPk;
        };
        return TableSchemaModel;
    }());
    exports.default = TableSchemaModel;
});
define("src/models/index", ["require", "exports", "src/models/RecordFieldModel", "src/models/RecordModel", "src/models/RecordSetModel", "src/models/TableModel", "src/models/TableSchemaModel"], function (require, exports, RecordFieldModel_1, RecordModel_1, RecordSetModel_1, TableModel_1, TableSchemaModel_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(RecordFieldModel_1);
    __export(RecordModel_1);
    __export(RecordSetModel_1);
    __export(TableModel_1);
    __export(TableSchemaModel_1);
});
define("src/index", ["require", "exports", "src/models/Database", "src/constants", "src/DefaultModelFactory", "src/utils"], function (require, exports, Database_1, constants_4, DefaultModelFactory_2, utils) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Creates a database instance with given schema.
     *
     * @param {Schema} schema
     * @param {DatabaseOptions} [options]
     */
    exports.createDatabase = function (schema, options) { return new Database_1.default(schema, options); };
    __export(constants_4);
    __export(DefaultModelFactory_2);
    exports.utils = utils;
});
define("src/utils", ["require", "exports", "src/errors"], function (require, exports, errors_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toArray = function (obj) {
        if (!obj)
            return [];
        if (Array.isArray(obj))
            return obj;
        else if (typeof obj === "object")
            return Object.keys(obj).map(function (key) { return obj[key]; });
        else
            return [];
    };
    exports.ensureArray = function (obj) {
        if (obj === undefined || obj == null)
            return [];
        if (Array.isArray(obj))
            return obj;
        else
            return [obj];
    };
    exports.isObject = function (value) {
        return value !== null && !Array.isArray(value) && typeof value === "object";
    };
    exports.ensureParam = function (name, value) {
        if (value === undefined)
            throw new Error(errors_7.default.argument(name, "value"));
        return value;
    };
    exports.ensureParamString = function (name, value) {
        if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
            throw new Error(errors_7.default.argument(name, "string"));
        return value;
    };
    exports.ensureParamObject = function (name, value) {
        var props = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            props[_i - 2] = arguments[_i];
        }
        if (!value || !exports.isObject(value))
            throw new Error(errors_7.default.argument(name, "object"));
        if (props) {
            var missing = props.filter(function (p) { return value[p] === undefined; });
            if (missing.length)
                throw new Error(errors_7.default.argumentShape(name, missing));
        }
        return value;
    };
    exports.ensureParamFunction = function (name, value) {
        if (!value || typeof value !== "function")
            throw new Error(errors_7.default.argument(name, "function"));
        return value;
    };
    function optionalParamString(name, val, fallback) {
        return val !== undefined
            ? exports.ensureParamString(name, val) : fallback;
    }
    exports.optionalParamString = optionalParamString;
    exports.ensureID = function (id) {
        if (!exports.isValidID(id))
            throw new Error(errors_7.default.invalidId());
        return exports.asID(id);
    };
    // A valid id must be a non-empty string or a number.
    exports.isValidID = function (id) {
        return id !== null
            && id !== undefined
            && !isNaN(id)
            && ((typeof id === "string" && id.length > 0) || typeof id === "number");
    };
    // Ensures that the given id is a string
    exports.asID = function (id) {
        return typeof id === "string" ? id : id.toString();
    };
    exports.toObject = function (a, key) {
        return a.reduce(function (o, v) { o[key(v)] = v; return o; }, {});
    };
    exports.mergeIds = function (source, second, unique) {
        var hash = {};
        var i;
        for (i = 0; i < source.length; i++)
            hash[source[i]] = true;
        for (i = 0; i < second.length; i++) {
            if (unique && hash[second[i]])
                throw new Error(errors_7.default.uniqueConstraintViolation(second[i]));
            hash[second[i]] = true;
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
        if (bKeys.length !== len)
            return false;
        for (var i = 0; i < len; i++) {
            var key = aKeys[i];
            if (Array.isArray(a[key]) && Array.isArray(b[key]) && arrayIsShallowEqual(a[key], b[key]))
                continue;
            if (a[key] !== b[key])
                return false;
        }
        return true;
    };
    var arrayIsShallowEqual = function (a, b) {
        if (a === b)
            return true;
        var len = a.length;
        if (b.length !== len)
            return false;
        for (var i = 0; i < len; i++)
            if (a[i] !== b[i])
                return false;
        return true;
    };
});
define("src/models/RecordFieldModel", ["require", "exports", "src/utils"], function (require, exports, utils_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordFieldModel = /** @class */ (function () {
        function RecordFieldModel(schema, record) {
            this.schema = utils_8.ensureParamObject("schema", schema);
            this.name = utils_8.ensureParamString("schema.name", schema.name);
            this.record = utils_8.ensureParamObject("record", record);
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
    exports.default = RecordFieldModel;
});
define("src/DefaultModelFactory", ["require", "exports", "src/constants", "src/errors", "src/models/RecordFieldModel", "src/models/RecordModel", "src/models/RecordSetModel", "src/models/TableModel", "src/models/TableSchemaModel"], function (require, exports, constants_5, errors_8, RecordFieldModel_2, RecordModel_2, RecordSetModel_2, TableModel_2, TableSchemaModel_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var createRecordModelClass = function (Base) {
        return /** @class */ (function (_super) {
            __extends(ExtendedRecordModel, _super);
            function ExtendedRecordModel(id, table) {
                var _this = _super.call(this, id, table) || this;
                _this._fields = {};
                return _this;
            }
            return ExtendedRecordModel;
        }(Base));
    };
    var DefaultModelFactory = /** @class */ (function () {
        function DefaultModelFactory() {
            this._recordClass = {};
            this._defineProperty = function (model, name, field, factory, cache) {
                if (cache === void 0) { cache = true; }
                if (constants_5.RESERVED_PROPERTIES.indexOf(name) >= 0)
                    throw new Error(errors_8.default.reservedProperty(field.table.name, name));
                Object.defineProperty(model.prototype, name, {
                    get: function () {
                        // TODO: Improve the instance cache mechanism. Invalidate when the field value changes..
                        return cache
                            ? (this._fields[name] || (this._fields[name] = factory(field, this)))
                            : factory(field, this);
                    }
                });
            };
        }
        DefaultModelFactory.prototype.newTableSchema = function (db, name, schema) {
            return new TableSchemaModel_2.default(db, name, schema);
        };
        DefaultModelFactory.prototype.newTableModel = function (session, schema, state) {
            return new TableModel_2.default(session, schema, state);
        };
        DefaultModelFactory.prototype.newRecordModel = function (id, table) {
            var model = this.createRecordModel(table.schema);
            return new model(id, table);
        };
        DefaultModelFactory.prototype.newRecordSetModel = function (table, schema, owner) {
            return new RecordSetModel_2.default(table, schema, owner);
        };
        DefaultModelFactory.prototype.getRecordBaseClass = function (schema) {
            return RecordModel_2.default;
        };
        DefaultModelFactory.prototype.createRecordModel = function (schema) {
            var _this = this;
            if (this._recordClass[schema.name])
                return this._recordClass[schema.name];
            else {
                var model_1 = createRecordModelClass(this.getRecordBaseClass(schema));
                schema.fields.forEach(function (f) {
                    return (f.isForeignKey || !f.isPrimaryKey)
                        && _this._defineProperty(model_1, f.propName, f, _this._newRecordField.bind(_this), false);
                });
                schema.relations.forEach(function (f) {
                    return f.relationName && _this._defineProperty(model_1, f.relationName, f, f.unique
                        ? _this._newRecordRelation.bind(_this)
                        : _this._newRecordSet.bind(_this), !f.unique);
                });
                return this._recordClass[schema.name] = model_1;
            }
        };
        DefaultModelFactory.prototype._newRecordField = function (schema, record) {
            if (!schema.isForeignKey)
                return new RecordFieldModel_2.default(schema, record);
            var refTable = schema.references && record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error(errors_8.default.fkReferenceNotInSession(schema.name, schema.references));
            var recordId = schema.getRecordValue(record);
            if (recordId === undefined)
                return null;
            return refTable.get(recordId);
        };
        DefaultModelFactory.prototype._newRecordSet = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_8.default.tableNotInSession(schema.table.name));
            return this.newRecordSetModel(refTable, schema, record);
        };
        DefaultModelFactory.prototype._newRecordRelation = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_8.default.tableNotInSession(schema.table.name));
            var id = refTable.getIndex(schema.name, record.id)[0];
            if (id === undefined)
                return null;
            return this.newRecordModel(id, refTable);
        };
        return DefaultModelFactory;
    }());
    exports.default = DefaultModelFactory;
});
