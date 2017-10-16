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
    exports.ensureParamID = function (name, value) {
        if (!exports.isValidID(value))
            throw new Error("Missing a valid id for the argument \"" + name + "\"");
        return exports.asID(value);
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
        for (i = 0; i < source.length; i++) {
            hash[source[i]] = true;
        }
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
        var aKeys = Object.keys(a), bKeys = Object.keys(b), len = aKeys.length;
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
});
define("models", ["require", "exports", "schema", "utils"], function (require, exports, schema_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableModel = /** @class */ (function () {
        function TableModel(session, state, schema) {
            if (state === void 0) { state = { ids: [], byId: {}, indexes: {} }; }
            this.dirty = false;
            this.session = utils.ensureParam("session", session);
            this.state = utils.ensureParam("state", state);
            this.schema = utils.ensureParam("schema", schema);
            if (!this.state.name)
                this.state.name = schema.name;
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
        Object.defineProperty(TableModel.prototype, "values", {
            get: function () {
                return this.all().map(function (r) { return r.value; });
            },
            enumerable: true,
            configurable: true
        });
        TableModel.prototype.filter = function (predicate) {
            return this.all().filter(predicate);
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
            return ModelFactory.default.newRecord(utils.asID(id), this);
        };
        TableModel.prototype.getOrDefault = function (id) {
            return this.exists(id) ? this.get(id) : null;
        };
        TableModel.prototype.getByFk = function (fieldName, id) {
            utils.ensureParam("fieldName", fieldName);
            id = utils.ensureParamID("id", id);
            var field = this.schema.fields.filter(function (f) { return f.isForeignKey && f.name === fieldName; })[0];
            if (!field)
                throw new Error("No foreign key named: " + fieldName + " in the schema: \"" + this.schema.name + "\".");
            return new RecordSet(this, field, { id: id });
        };
        TableModel.prototype.value = function (id) {
            return this.state.byId[utils.ensureID(id)];
        };
        TableModel.prototype.exists = function (id) {
            return this.state.byId[utils.ensureID(id)] !== undefined;
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
            return table.ids.map(function (id) { return ModelFactory.default.newRecord(id, _this); });
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
                return ModelFactory.default.newRecord(id, _this);
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
        TableModel.prototype._normalizedAction = function (data, action) {
            utils.ensureParam("data", data);
            utils.ensureParam("action", action);
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
                    model_1[schema.relationName].delete();
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
            this.schema = utils.ensureParam("schema", schema);
            this.record = utils.ensureParam("record", record);
            this.name = utils.ensureParamString("schema.name", schema.name);
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
            this.table = utils.ensureParam("table", table);
            this.schema = utils.ensureParam("schema", schema);
            this.owner = utils.ensureParam("owner", owner);
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
            this.ids.forEach(function (id) { return _this.table.delete(id); });
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
            if (!schema.isForeignKey)
                return new RecordField(schema, record);
            var refTable = schema.references && record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error("The foreign key: \"" + schema.name + "\" references an unregistered table: \"" + schema.references + "\" in the current session.");
            return refTable.getOrDefault(schema.getRecordValue(record));
        };
        ModelFactory.prototype.newRecordSet = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
            return new RecordSet(refTable, schema, record);
        };
        ModelFactory.prototype.newRecordRelation = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error("The table: \"" + schema.table.name + "\" does not exist in the current session.");
            var id = refTable.index(schema.name, record.id)[0];
            if (id === undefined)
                return null;
            else
                return ModelFactory.default.newRecord(id, refTable);
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
            var defineProperty = function (name, field, factory, cache) {
                if (cache === void 0) { cache = true; }
                if (name === "id")
                    throw new Error("The property \"" + field.table.name + ".id\" is a reserved name. Please specify another name using the \"propName\" definition.");
                Object.defineProperty(Record.prototype, name, {
                    get: function () {
                        return cache ? (this._fields[name] || (this._fields[name] = factory(field, this))) : factory(field, this);
                    }
                });
            };
            schema.fields.forEach(function (f) { return (f.isForeignKey || !f.isPrimaryKey) && defineProperty(f.propName, f, ModelFactory.default.newRecordField); });
            schema.relations.forEach(function (f) { return f.relationName && defineProperty(f.relationName, f, f.unique ? ModelFactory.default.newRecordRelation : ModelFactory.default.newRecordSet, !f.unique); });
            return Record;
        };
        ModelFactory.default = new ModelFactory();
        return ModelFactory;
    }());
});
define("index", ["require", "exports", "schema", "models", "utils"], function (require, exports, schema_2, models_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RecordSet = models_1.RecordSet;
    var defaultOptions = {};
    exports.createDatabase = function (schema, options) {
        return new Database(schema, __assign({}, defaultOptions, options));
    };
    var Database = /** @class */ (function () {
        function Database(schema, options) {
            var _this = this;
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
                return _this.reduce(state, action, reducers);
            };
        };
        Database.prototype.reduce = function (state, action, reducers, arg) {
            var session = this.createSession(state);
            utils.ensureArray(reducers).forEach(function (reducer) {
                reducer(session.tables, action, arg);
            });
            return session.commit();
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
            var partialSession = new DatabaseSession(state, { tables: tableSchemas, options: {} }, { readOnly: true });
            return partialSession.tables;
        };
        Database.prototype.selectTable = function (tableState, schemaName) {
            var name = schemaName || tableState["name"];
            if (!name)
                throw new Error("Failed to select table. Could not identify table schema.");
            return this.selectTables((_a = {}, _a[name] = tableState, _a))[name];
            var _a;
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
