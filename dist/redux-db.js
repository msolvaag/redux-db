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
// tslint:disable:max-line-length
define("errors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        fkInvalidReference: function (key) { return "The foreign key: \"" + key + "\" does not define a valid referenced table."; },
        fkReferenceNotInSession: function (key, references) { return "The foreign key: \"" + key + "\" references an unregistered table: \"" + references + "\" in the current session."; },
        fkUndefined: function (table, key) { return "No foreign key named: " + key + " in the schema: \"" + table + "\"."; },
        fkViolation: function (table, key) { return "The insert/update operation violates the unique foreign key \"" + table + "." + key + "\"."; },
        recordNotFound: function (table, id) { return "No \"" + table + "\" record with id: " + id + " exists."; },
        recordUpdateNotFound: function (table, id) { return "Failed to apply update. No \"" + table + "\" record with id: " + id + " exists."; },
        reservedProperty: function (name, prop) { return "The property \"" + name + "." + prop + "\" is a reserved name. Please specify another name using the \"propName\" definition."; },
        sessionReadonly: function () { return "Invalid attempt to alter a readonly session."; },
        stateTableUndefined: function () { return "Failed to select table. Could not identify table schema."; },
        tableInvalidState: function (table) { return "The table \"" + table + "\" has an invalid state."; },
        tableNotInSession: function (table) { return "The table: \"" + table + "\" does not exist in the current session."; }
    };
});
define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TYPE_PK = "PK";
    exports.TYPE_ATTR = "ATTR";
    exports.TYPE_MODIFIED = "MODIFIED";
    exports.RESERVED_PROPERTIES = ["id", "table", "value", "_fields"];
});
define("models/RecordFieldModel", ["require", "exports", "utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordFieldModel = /** @class */ (function () {
        function RecordFieldModel(schema, record) {
            this.schema = utils_1.ensureParam("schema", schema);
            this.record = utils_1.ensureParam("record", record);
            this.name = utils_1.ensureParamString("schema.name", schema.name);
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
define("models/RecordModel", ["require", "exports", "utils"], function (require, exports, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordModel = /** @class */ (function () {
        function RecordModel(id, table) {
            this.id = utils_2.ensureParam("id", id);
            this.table = utils_2.ensureParam("table", table);
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
define("models/RecordSetModel", ["require", "exports", "utils"], function (require, exports, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordSetModel = /** @class */ (function () {
        function RecordSetModel(table, schema, owner) {
            this.table = utils_3.ensureParam("table", table);
            this.schema = utils_3.ensureParam("schema", schema);
            this.owner = utils_3.ensureParam("owner", owner);
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
            return this.ids.map(function (id) { return _this.table.schema.db.factory.newRecordModel(id, _this.table); });
        };
        RecordSetModel.prototype.getValue = function () {
            return this.all().map(function (r) { return r.value; });
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
    exports.default = RecordSetModel;
});
define("models/NormalizeContext", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DbNormalizeContext = /** @class */ (function () {
        function DbNormalizeContext(schema, normalizePKs) {
            this.output = {};
            this.emits = {};
            this.schema = schema;
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
define("models/TableModel", ["require", "exports", "errors", "utils", "models/NormalizeContext"], function (require, exports, errors_1, utils, NormalizeContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableModel = /** @class */ (function () {
        function TableModel(session, schema, state) {
            if (state === void 0) { state = { ids: [], byId: {}, indexes: {} }; }
            this.dirty = false;
            this.session = utils.ensureParam("session", session);
            this.schema = utils.ensureParam("schema", schema);
            this.state = utils.ensureParam("state", state);
            var _a = this.state, ids = _a.ids, byId = _a.byId, indexes = _a.indexes;
            if (!ids || !byId || !indexes)
                throw new Error(errors_1.default.tableInvalidState(schema.name));
            if (!this.state.name)
                this.state.name = schema.name;
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
        TableModel.prototype.getValues = function () {
            var _this = this;
            return this.state.ids.map(function (id) { return _this.state.byId[id]; });
        };
        TableModel.prototype.get = function (id) {
            if (!this.exists(id))
                throw new Error(errors_1.default.recordNotFound(this.schema.name, id));
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
                throw new Error(errors_1.default.fkUndefined(this.schema.name, fieldName));
            return this.schema.db.factory.newRecordSetModel(this, field, { id: id });
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
        TableModel.prototype.getIndex = function (name, fk) {
            utils.ensureParamString("value", name);
            utils.ensureParamString("fk", fk);
            if (this.state.indexes[name] && this.state.indexes[name].values[fk])
                return this.state.indexes[name].values[fk];
            else
                return [];
        };
        TableModel.prototype.exists = function (id) {
            if (!utils.isValidID(id))
                return false;
            return this.state.byId[utils.asID(id)] !== undefined;
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
        TableModel.prototype.delete = function (id) {
            if (typeof id !== "string" && typeof id !== "number")
                id = this.schema.getPrimaryKey(id);
            if (!this.exists(id))
                return false;
            id = utils.asID(id);
            this._deleteCascade(id);
            var byId = __assign({}, this.state.byId);
            var ids = this.state.ids.slice();
            var indexes = __assign({}, this.state.indexes);
            var record = byId[id];
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
            this.state = __assign({}, this.state, { byId: __assign({}, this.state.byId, table.byId), ids: utils.mergeIds(this.state.ids, table.ids, true) });
            this._updateIndexes(table);
            return table.ids.map(function (id) { return _this.schema.db.factory.newRecordModel(id, _this); });
        };
        TableModel.prototype.updateNormalized = function (table) {
            var _this = this;
            utils.ensureParam("table", table);
            var state = __assign({}, this.state);
            var dirty = false;
            var records = Object.keys(table.byId).map(function (id) {
                if (!_this.state.byId[id])
                    throw new Error(errors_1.default.recordUpdateNotFound(_this.schema.name, id));
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
            var ctx = new NormalizeContext_1.default(this.schema, normalizePKs);
            this.schema.normalize(data, ctx);
            var table = ctx.output[this.schema.name];
            var records = table ? action.call(this, table) : [];
            this.session.upsert(ctx);
            return records;
        };
        TableModel.prototype._updateIndexes = function (table) {
            var _this = this;
            Object.keys(table.indexes).forEach(function (key) {
                var idx = _this.state.indexes[key]
                    || (_this.state.indexes[key] = { unique: table.indexes[key].unique, values: {} });
                Object.keys(table.indexes[key].values).forEach(function (fk) {
                    var idxBucket = idx.values[fk] || (idx.values[fk] = []);
                    var modifiedBucket = utils.mergeIds(idxBucket, table.indexes[key].values[fk], false);
                    if (idx.unique && modifiedBucket.length > 1)
                        throw new Error(errors_1.default.fkViolation(_this.schema.name, key));
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
                if (model_1)
                    cascade.forEach(function (schema) {
                        var relation = model_1[schema.relationName];
                        if (relation)
                            relation.delete();
                    });
            }
        };
        return TableModel;
    }());
    exports.default = TableModel;
});
define("models/FieldSchemaModel", ["require", "exports", "constants", "utils"], function (require, exports, constants_1, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FieldSchemaModel = /** @class */ (function () {
        function FieldSchemaModel(table, name, schema, cascadeAsDefault) {
            this.table = utils_4.ensureParam("table", table);
            this.type = schema.type || constants_1.TYPE_ATTR;
            this.name = name;
            this.propName = schema.propName || name;
            this._valueFactory = schema.value ? schema.value.bind(this) : null;
            this.isPrimaryKey = schema.type === constants_1.TYPE_PK;
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
        Object.defineProperty(FieldSchemaModel.prototype, "refTable", {
            get: function () { return this._refTable; },
            enumerable: true,
            configurable: true
        });
        FieldSchemaModel.prototype.connect = function (schemas) {
            var _this = this;
            if (this.references) {
                this._refTable = schemas.filter(function (tbl) { return tbl.name === _this.references; })[0];
                if (!this._refTable)
                    throw new Error("The field schema \"" + this.table.name + "." + this.name + "\" "
                        + ("has an invalid reference to unknown table \"" + this.references + "\"."));
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
define("models/TableSchemaModel", ["require", "exports", "constants", "utils", "models/FieldSchemaModel"], function (require, exports, constants_2, utils, FieldSchemaModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableSchemaModel = /** @class */ (function () {
        function TableSchemaModel(db, name, schema) {
            var _this = this;
            this._relations = [];
            this.db = utils.ensureParam("db", db);
            this.name = utils.ensureParamString("name", name);
            this.fields = Object.keys(utils.ensureParam("schema", schema))
                .map(function (fieldName) {
                return new FieldSchemaModel_1.default(_this, fieldName, schema[fieldName], db.options.cascadeAsDefault === true);
            });
            this._primaryKeyFields = this.fields.filter(function (f) { return f.isPrimaryKey; });
            this._foreignKeyFields = this.fields.filter(function (f) { return f.isForeignKey; });
            this._stampFields = this.fields.filter(function (f) { return f.type === constants_2.TYPE_MODIFIED; });
        }
        Object.defineProperty(TableSchemaModel.prototype, "relations", {
            /// Gets the FK's that references this table.
            get: function () { return this._relations; },
            enumerable: true,
            configurable: true
        });
        TableSchemaModel.prototype.connect = function (schemas) {
            var _this = this;
            schemas.forEach(function (schema) {
                return _this._relations = _this._relations.concat(schema.fields.filter(function (f) { return f.references === _this.name; }));
            });
            this._foreignKeyFields.forEach(function (fk) { return fk.connect(schemas); });
        };
        TableSchemaModel.prototype.normalize = function (data, context) {
            var _this = this;
            if (typeof (data) !== "object" && !Array.isArray(data))
                throw new Error("Failed to normalize data. Given argument is not a plain object nor an array.");
            var ctx = utils.ensureParam("context", context);
            if (!ctx.output[this.name])
                ctx.output[this.name] = { ids: [], byId: {}, indexes: {} };
            return utils.ensureArray(data).map(function (obj) {
                if (typeof obj !== "object")
                    throw new Error("Failed to normalize data. Given record is not a plain object.");
                var normalizeHook = _this.db.getNormalizer(_this.name);
                if (normalizeHook)
                    obj = normalizeHook(obj, ctx);
                var pk = ctx.normalizePKs ? _this._normalizePrimaryKey(obj) : _this._getPrimaryKey(obj);
                if (!pk)
                    throw new Error("Failed to normalize primary key for record of type \"" + _this.name + "\"."
                        + " Make sure record(s) have a primary key value before trying to insert or update a table.");
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
            if (!rel.relationName)
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
                throw new Error("Failed to get primary key for record of type \"" + this.name + "\".");
            return pk;
        };
        TableSchemaModel.prototype.getForeignKeys = function (record) {
            return this._foreignKeyFields.map(function (fk) { return ({
                name: fk.name,
                notNull: fk.notNull,
                refTable: fk.refTable,
                unique: fk.unique,
                value: record[fk.name]
            }); });
        };
        TableSchemaModel.prototype.isModified = function (x, y) {
            if (this._stampFields.length > 0)
                return this._stampFields.reduce(function (p, n) {
                    return p + (n.getValue(x) === n.getValue(y) ? 1 : 0);
                }, 0) !== this._stampFields.length;
            else
                return !this.db.getRecordComparer(this.name)(x, y, this);
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
            // Invoke the "onMissingPk" hook if PK not found.
            if (!pk) {
                var generatedPk = this.db.getPkGenerator(this.name)(record, this);
                if (generatedPk) {
                    // if the PK is generated and we have a single PK field definition, then inject it into the record.
                    if (this._primaryKeyFields.length === 1)
                        record[this._primaryKeyFields[0].propName] = generatedPk;
                    // TODO: Handle multiple PK field defs.
                    // We may need the "onMissingPK" hook to return an object defining each key value.
                    // BUT this seems like a rare scenario..
                    pk = generatedPk;
                }
            }
            return pk;
        };
        return TableSchemaModel;
    }());
    exports.default = TableSchemaModel;
});
define("models/index", ["require", "exports", "models/RecordFieldModel", "models/RecordModel", "models/RecordSetModel", "models/TableModel", "models/TableSchemaModel"], function (require, exports, RecordFieldModel_1, RecordModel_1, RecordSetModel_1, TableModel_1, TableSchemaModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        RecordFieldModel: RecordFieldModel_1.default,
        RecordModel: RecordModel_1.default,
        RecordSetModel: RecordSetModel_1.default,
        TableModel: TableModel_1.default,
        TableSchemaModel: TableSchemaModel_1.default
    };
});
define("DefaultModelFactory", ["require", "exports", "constants", "errors", "models/RecordFieldModel", "models/RecordModel", "models/RecordSetModel", "models/TableModel", "models/TableSchemaModel"], function (require, exports, constants_3, errors_2, RecordFieldModel_2, RecordModel_2, RecordSetModel_2, TableModel_2, TableSchemaModel_2) {
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
                if (constants_3.RESERVED_PROPERTIES.indexOf(name) >= 0)
                    throw new Error(errors_2.default.reservedProperty(field.table.name, name));
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
                var model_2 = createRecordModelClass(this.getRecordBaseClass(schema));
                schema.fields.forEach(function (f) {
                    return (f.isForeignKey || !f.isPrimaryKey)
                        && _this._defineProperty(model_2, f.propName, f, _this._newRecordField.bind(_this), false);
                });
                schema.relations.forEach(function (f) {
                    return f.relationName && _this._defineProperty(model_2, f.relationName, f, f.unique
                        ? _this._newRecordRelation.bind(_this)
                        : _this._newRecordSet.bind(_this), !f.unique);
                });
                return this._recordClass[schema.name] = model_2;
            }
        };
        DefaultModelFactory.prototype._newRecordField = function (schema, record) {
            if (!schema.isForeignKey)
                return new RecordFieldModel_2.default(schema, record);
            if (!schema.references)
                throw new Error(errors_2.default.fkInvalidReference(schema.name));
            var refTable = schema.references && record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error(errors_2.default.fkReferenceNotInSession(schema.name, schema.references));
            var recordId = schema.getRecordValue(record);
            if (recordId === undefined)
                return null;
            return refTable.getOrDefault(recordId);
        };
        DefaultModelFactory.prototype._newRecordSet = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_2.default.tableNotInSession(schema.table.name));
            return this.newRecordSetModel(refTable, schema, record);
        };
        DefaultModelFactory.prototype._newRecordRelation = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_2.default.tableNotInSession(schema.table.name));
            var id = refTable.getIndex(schema.name, record.id)[0];
            if (id === undefined)
                return null;
            return this.newRecordModel(id, refTable);
        };
        return DefaultModelFactory;
    }());
    exports.default = DefaultModelFactory;
});
define("index", ["require", "exports", "Database", "constants", "models/index", "DefaultModelFactory"], function (require, exports, Database_1, constants_4, models_1, DefaultModelFactory_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDatabase = function (schema, options) { return new Database_1.default(schema, options); };
    __export(constants_4);
    __export(models_1);
    __export(DefaultModelFactory_1);
});
define("utils", ["require", "exports"], function (require, exports) {
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
        if (!obj)
            return [];
        if (Array.isArray(obj))
            return obj;
        else
            return [obj];
    };
    exports.ensureParam = function (name, value) {
        if (value === undefined)
            throw new Error("Missing a valid value for the argument \"" + name + "\"");
        return value;
    };
    exports.ensureParamString = function (name, value) {
        if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
            throw new Error("Missing a valid string for the argument \"" + name + "\"");
        return value;
    };
    exports.ensureID = function (id) {
        if (!exports.isValidID(id))
            throw new Error("The given value is not a valid \"id\". An \"id\" must be a non-empty string or a number.");
        return exports.asID(id);
    };
    // A valid id must be a non-empty string or a number.
    exports.isValidID = function (id) {
        return id !== null && id !== undefined && ((typeof id === "string" && id.length > 0) || typeof id === "number");
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
                throw new Error("Id merge operation violates unique constraint for id: \"" + second[i] + "\"");
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
define("DatabaseSession", ["require", "exports", "errors", "utils"], function (require, exports, errors_3, utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DatabaseSession = /** @class */ (function () {
        function DatabaseSession(state, db, options) {
            if (state === void 0) { state = {}; }
            var _this = this;
            this.state = state;
            this.db = db;
            this.options = options;
            var tableSchemas = options.tableSchemas || db.tables;
            this.tables = utils_5.toObject(tableSchemas.map(function (tableSchema) {
                return _this.db.factory.newTableModel(_this, tableSchema, state[tableSchema.name]);
            }), function (t) { return t.schema.name; });
        }
        DatabaseSession.prototype.upsert = function (ctx) {
            var _this = this;
            if (this.options.readOnly)
                throw new Error(errors_3.default.sessionReadonly());
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
            if (this.options.readOnly)
                throw new Error(errors_3.default.sessionReadonly());
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
define("Database", ["require", "exports", "DatabaseSession", "DefaultModelFactory", "errors", "utils"], function (require, exports, DatabaseSession_1, DefaultModelFactory_2, errors_4, utils_6) {
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
                return getMappedFunction(_this.options.onNormalize, schemaName, function (obj) { return obj; });
            };
            this.getPkGenerator = function (schemaName) {
                return getMappedFunction(_this.options.onGeneratePK, schemaName, function () { return undefined; });
            };
            this.getRecordComparer = function (schemaName) {
                return getMappedFunction(_this.options.onRecordCompare, schemaName, utils_6.isEqual);
            };
            utils_6.ensureParam("schema", schema);
            this.options = __assign({}, defaultOptions, options);
            this.factory = this.options.factory || new DefaultModelFactory_2.default();
            this.tables = Object.keys(schema).map(function (tableName) {
                return _this.factory.newTableSchema(_this, tableName, schema[tableName]);
            });
            this.tables.forEach(function (table) { return table.connect(_this.tables); });
            this._tableLookup = utils_6.toObject(this.tables, function (t) { return t.name; });
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
        Database.prototype.reduce = function (state, action, reducers, arg) {
            var session = this.createSession(state);
            utils_6.ensureArray(reducers).forEach(function (reducer) { return reducer(session.tables, action, arg); });
            return session.commit();
        };
        Database.prototype.createSession = function (state, options) {
            return new DatabaseSession_1.default(state, this, __assign({ readOnly: false }, options));
        };
        Database.prototype.selectTables = function (state) {
            var _this = this;
            var tableSchemas = Object.keys(state)
                .filter(function (tableName) { return _this._tableLookup[tableName]; })
                .map(function (tableName) { return _this._tableLookup[tableName]; });
            var session = this.createSession(state, {
                readOnly: true,
                tableSchemas: tableSchemas
            });
            return session.tables;
        };
        Database.prototype.selectTable = function (tableState, schemaName) {
            var _a;
            var name = schemaName || tableState.name;
            if (!name)
                throw new Error(errors_4.default.stateTableUndefined());
            return this.selectTables((_a = {}, _a[name] = tableState, _a))[name];
        };
        return Database;
    }());
    exports.default = Database;
});
