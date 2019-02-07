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
    exports.ALL = "*";
    exports.RESERVED_PROPERTIES = ["id", "table", "value", "_fields", "delete", "update"];
    exports.initialState = function (name) {
        return ({ ids: [], byId: {}, indexes: {}, meta: {}, name: name });
    };
});
// tslint:disable:max-line-length
define("errors", ["require", "exports"], function (require, exports) {
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
        normalizeInvalidData: function () { return "Failed to normalize data. Given argument is not a plain object nor an array."; },
        normalizeInvalidFk: function (table, key, refTable) { return "Invalid schema definition. The field \"" + table + "." + key + "\" is referencing table \"" + refTable + "\", but the given data is an array."; },
        normalizePk: function (name) { return "Failed to normalize primary key for record of type \"" + name + "\". Make sure record(s) have a primary key value before trying to insert or update a table."; },
        normalizeFkViolation: function (table, key) { return "The insert/update operation violates the unique foreign key \"" + table + "." + key + "\"."; },
        pkNotFound: function (table) { return "Failed to get primary key for record of type \"" + table + "\"."; },
        recordNotFound: function (table, id) { return "No \"" + table + "\" record with id: " + id + " exists."; },
        recordUpdateViolation: function (table, id) { return "Failed to apply update. No \"" + table + "\" record with id: " + id + " exists."; },
        reservedProperty: function (name, prop) { return "The property \"" + name + "." + prop + "\" is a reserved name. Please specify another name using the \"propName\" definition."; },
        sessionReadonly: function () { return "Invalid attempt to alter a readonly session."; },
        stateTableUndefined: function () { return "Failed to select table. Could not identify table schema."; },
        tableInvalidState: function (table) { return "The table \"" + table + "\" has an invalid state."; },
        tableNotInSession: function (table) { return "The table: \"" + table + "\" does not exist in the current session."; },
        uniqueConstraintViolation: function (id) { return "Operation violates unique constraint for id: \"" + id + "\""; },
        unknownTableState: function () { return "Failed to identifiy table state."; }
    };
});
define("utils", ["require", "exports", "tslib", "errors"], function (require, exports, tslib_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_1 = tslib_1.__importDefault(errors_1);
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
    exports.isPlainObject = function (value) {
        if (exports.isObject(value)) {
            if (typeof Object.getPrototypeOf === "function") {
                var proto = Object.getPrototypeOf(value);
                return proto === Object.prototype || proto === null;
            }
            return Object.prototype.toString.call(value) === "[object Object]";
        }
        return false;
    };
    exports.ensureParam = function (name, value) {
        if (value === undefined)
            throw new Error(errors_1.default.argument(name, "value"));
        return value;
    };
    exports.ensureParamString = function (name, value) {
        if (value === undefined || value === null || typeof value !== "string" || value.length === 0)
            throw new Error(errors_1.default.argument(name, "string"));
        return value;
    };
    exports.ensureParamObject = function (name, value) {
        var props = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            props[_i - 2] = arguments[_i];
        }
        if (!value || !exports.isObject(value))
            throw new Error(errors_1.default.argument(name, "object"));
        if (props) {
            var missing = props.filter(function (p) { return value[p] === undefined; });
            if (missing.length)
                throw new Error(errors_1.default.argumentShape(name, missing));
        }
        return value;
    };
    exports.ensureParamFunction = function (name, value) {
        if (!value || typeof value !== "function")
            throw new Error(errors_1.default.argument(name, "function"));
        return value;
    };
    function optionalParamString(name, val, fallback) {
        return val !== undefined
            ? exports.ensureParamString(name, val) : fallback;
    }
    exports.optionalParamString = optionalParamString;
    exports.ensureID = function (id) {
        if (!exports.isValidID(id))
            throw new Error(errors_1.default.invalidId());
        return exports.asID(id);
    };
    // A valid id must be a non-empty string or a number.
    exports.isValidID = function (id) {
        return id !== null
            && id !== undefined
            && ((typeof id === "string" && id.length > 0) || typeof id === "number");
    };
    // Ensures that the given id is a string
    exports.asID = function (id) {
        return (typeof id === "string" ? id : id.toString());
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
                throw new Error(errors_1.default.uniqueConstraintViolation(second[i]));
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
define("ModelFactory", ["require", "exports", "tslib", "constants", "errors", "utils"], function (require, exports, tslib_2, constants_1, errors_2, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_2 = tslib_2.__importDefault(errors_2);
    utils = tslib_2.__importStar(utils);
    exports.createRecordModelClass = function (Base) {
        return /** @class */ (function (_super) {
            tslib_2.__extends(ExtendedRecordModel, _super);
            function ExtendedRecordModel(id, table) {
                var _this = _super.call(this, id, table) || this;
                _this._fields = {};
                return _this;
            }
            return ExtendedRecordModel;
        }(Base));
    };
    var RecordModelFactory = /** @class */ (function () {
        function RecordModelFactory(recordBaseType, factory) {
            this._recordClass = {};
            this._defineProperty = function (model, name, field, factory, cache) {
                if (cache === void 0) { cache = true; }
                if (constants_1.RESERVED_PROPERTIES.indexOf(name) >= 0)
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
            this._recordBaseType = recordBaseType;
            this._factory = factory;
        }
        RecordModelFactory.prototype.newRecordModel = function (id, table) {
            utils.ensureParamString("id", id);
            utils.ensureParamObject("table", table);
            var model = this.createRecordModel(table.schema);
            return new model(id, table);
        };
        RecordModelFactory.prototype.createRecordModel = function (schema) {
            var _this = this;
            if (this._recordClass[schema.name])
                return this._recordClass[schema.name];
            else {
                var model_1 = exports.createRecordModelClass(this._recordBaseType);
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
        RecordModelFactory.prototype._newRecordField = function (schema, record) {
            if (!schema.isForeignKey)
                return this._factory.newRecordFieldModel(schema, record);
            var refTable = schema.references && record.table.session.tables[schema.references];
            if (!refTable)
                throw new Error(errors_2.default.fkReferenceNotInSession(schema.name, schema.references));
            var recordId = schema.getRecordValue(record);
            if (recordId === undefined)
                return null;
            return refTable.get(recordId);
        };
        RecordModelFactory.prototype._newRecordSet = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_2.default.tableNotInSession(schema.table.name));
            return this._factory.newRecordSetModel(refTable, schema, record);
        };
        RecordModelFactory.prototype._newRecordRelation = function (schema, record) {
            var refTable = record.table.session.tables[schema.table.name];
            if (!refTable)
                throw new Error(errors_2.default.tableNotInSession(schema.table.name));
            var id = refTable.getIndex(schema.name, record.id)[0];
            if (id === undefined)
                return null;
            return this.newRecordModel(id, refTable);
        };
        return RecordModelFactory;
    }());
    exports.RecordModelFactory = RecordModelFactory;
    var createModelFactory = function (factory, RecordModel) {
        var recordFactory = new RecordModelFactory(RecordModel, factory);
        return tslib_2.__assign({}, factory, { newRecordModel: function (id, table) { return recordFactory.newRecordModel(id, table); } });
    };
    exports.default = createModelFactory;
});
define("Normalizer", ["require", "exports", "tslib", "constants", "errors", "utils"], function (require, exports, tslib_3, constants_2, errors_3, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_3 = tslib_3.__importDefault(errors_3);
    utils = tslib_3.__importStar(utils);
    var SchemaNormalizer = /** @class */ (function () {
        function SchemaNormalizer(schema) {
            this.schema = utils.ensureParamObject("schema", schema, "db");
            this.db = schema.db;
        }
        SchemaNormalizer.prototype.normalize = function (data, context) {
            var _this = this;
            if (!utils.isPlainObject(data) && !Array.isArray(data))
                throw new Error(errors_3.default.normalizeInvalidData());
            utils.ensureParamObject("context", context);
            utils.ensureParamObject("context.output", context.output);
            context.currentSchema = this.schema;
            if (!context.output[this.schema.name])
                context.output[this.schema.name] = constants_2.initialState(this.schema.name);
            return utils.ensureArray(data).map(function (obj) {
                if (!utils.isPlainObject(obj))
                    throw new Error(errors_3.default.normalizeInvalidData());
                var subject = obj;
                var normalizer = _this.db.getRecordNormalizer(_this.schema.name);
                if (normalizer)
                    subject = normalizer(subject, context);
                var pk = context.normalizePKs
                    ? _this._normalizePrimaryKey(subject)
                    : _this.schema.getPrimaryKey(subject);
                if (!pk)
                    throw new Error(errors_3.default.normalizePk(_this.schema.name));
                var tbl = context.output[_this.schema.name];
                if (!tbl.byId[pk])
                    tbl.ids.push(pk);
                var record = tbl.byId[pk] = tslib_3.__assign({}, subject);
                var fks = _this.schema.getForeignKeys(subject);
                fks.forEach(function (fk) {
                    _this._normalizeForeignKey(fk, record, context);
                    _this._indexForeignKey(fk, tbl, pk);
                });
                _this.schema.relations.forEach(function (rel) {
                    return _this._normalizeRelations(rel, record, pk, context);
                });
                return pk;
            });
        };
        SchemaNormalizer.prototype._normalizePrimaryKey = function (record) {
            var pk = this.schema.getPrimaryKey(record);
            if (pk)
                return pk;
            // Invoke the "onMissingPK" hook if PK not found.
            var generator = this.db.getMissingPkHandler(this.schema.name);
            if (!generator)
                return undefined;
            var generatedPk = generator(record, this.schema);
            if (generatedPk)
                // if the PK is generated and we have a single PK field definition, then inject it into the record.
                if (this.schema.primaryKeys.length === 1)
                    record[this.schema.primaryKeys[0].propName] = generatedPk;
            // Handling multiple PK field defs:
            // We may need the "onMissingPK" hook to return an object defining each key value.
            // BUT this seems like a rare scenario..
            // So for now; don't populate record.
            return generatedPk;
        };
        SchemaNormalizer.prototype._normalizeRelations = function (rel, record, pk, context) {
            // Normalize foreign relations, FKs from other tables referencing this table.
            // Then remove the nested relations from the record.
            if (rel.relationName && record[rel.relationName]) {
                var normalizedRels = this.schema.inferRelations(record[rel.relationName], rel, pk);
                rel.table.normalize(normalizedRels, context);
                delete record[rel.relationName];
            }
        };
        SchemaNormalizer.prototype._normalizeForeignKey = function (fk, record, context) {
            // if the FK is an object, then normalize it and replace object with it's PK.
            if (typeof fk.value !== "object")
                return;
            var fkPks = fk.refTable.normalize(fk.value, context);
            if (fkPks.length > 1)
                throw new Error(errors_3.default.normalizeInvalidFk(this.schema.name, fk.name, fk.refTable.name));
            record[fk.name] = fk.value = fkPks[0];
        };
        SchemaNormalizer.prototype._indexForeignKey = function (fk, tbl, pk) {
            if (!utils.isValidID(fk.value))
                return;
            var fkId = utils.asID(fk.value);
            var idx = tbl.indexes[fk.name]
                || (tbl.indexes[fk.name] = { unique: fk.unique, values: {} });
            if (!idx.values[fkId])
                idx.values[fkId] = [];
            if (idx.unique && idx.values.length)
                throw new Error(errors_3.default.normalizeFkViolation(this.schema.name, fk.name));
            idx.values[fkId].push(pk);
        };
        return SchemaNormalizer;
    }());
    exports.default = SchemaNormalizer;
});
define("models/Database", ["require", "exports", "tslib", "constants", "errors", "utils"], function (require, exports, tslib_4, constants_3, errors_4, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_4 = tslib_4.__importDefault(errors_4);
    var KEY_SEPARATOR = "_";
    var defaultOptions = {
        cascadeAsDefault: false,
        keySeparator: KEY_SEPARATOR
    };
    var getMappedFunction = function (map, key, defaultFn) {
        if (!map)
            return defaultFn;
        if (typeof map === "function")
            return map;
        else if (map[key])
            return map[key];
        else if (map[constants_3.ALL])
            return map[constants_3.ALL];
        return defaultFn;
    };
    var Database = /** @class */ (function () {
        function Database(schema, factory, options) {
            var _this = this;
            this.getRecordNormalizer = function (schemaName) {
                return getMappedFunction(_this.options.onNormalize, schemaName);
            };
            this.getPkGenerator = function (schemaName) {
                return getMappedFunction(_this.options.onGeneratePK, schemaName);
            };
            this.getRecordComparer = function (schemaName) {
                return getMappedFunction(_this.options.onRecordCompare, schemaName, utils_1.isEqual);
            };
            this.getRecordMerger = function (schemaName) {
                return getMappedFunction(_this.options.onRecordMerge, schemaName);
            };
            this.getMissingPkHandler = function (schemaName) {
                return getMappedFunction(_this.options.onMissingPK, schemaName);
            };
            this.schema = utils_1.ensureParamObject("schema", schema);
            this.factory = utils_1.ensureParamObject("factory", factory);
            this.options = tslib_4.__assign({}, defaultOptions, options);
            this.keySeparator = this.options.keySeparator || "";
            this.tables = Object.keys(schema).map(function (tableName) {
                return _this.factory.newTableSchema(_this, tableName, schema[tableName]);
            });
            this.tableMap = utils_1.toObject(this.tables, function (table) { return table.name; });
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
            utils_1.ensureArray(reducers).forEach(function (reducer) {
                return reducer.apply(_this, [session.tables, action].concat(args));
            });
            return session.commit();
        };
        Database.prototype.createSession = function (state, options) {
            if (state === void 0) { state = {}; }
            return this.factory.newSession(this, state, tslib_4.__assign({ readOnly: false }, options));
        };
        Database.prototype.getTableSchema = function (name) {
            return this.tableMap[name];
        };
        Database.prototype.selectTables = function (state) {
            var _this = this;
            utils_1.ensureParamObject("state", state);
            var tableSchemas = Object.keys(state)
                .filter(function (tableName) { return _this.tableMap[tableName]; })
                .map(function (tableName) { return _this.tableMap[tableName]; });
            var session = this.createSession(state, {
                readOnly: true,
                tableSchemas: tableSchemas
            });
            return session.tables;
        };
        Database.prototype.selectTable = function (tableState, schemaName) {
            var _a;
            utils_1.ensureParamObject("tableState", tableState);
            var _b = tableState.name, name = _b === void 0 ? schemaName : _b;
            if (!name)
                throw new Error(errors_4.default.unknownTableState());
            return this.selectTables((_a = {},
                _a[name] = tableState,
                _a))[name];
        };
        return Database;
    }());
    exports.default = Database;
});
define("models/DatabaseSession", ["require", "exports", "tslib", "errors", "utils"], function (require, exports, tslib_5, errors_5, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_5 = tslib_5.__importDefault(errors_5);
    var DatabaseSession = /** @class */ (function () {
        function DatabaseSession(db, state, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            this.db = utils_2.ensureParamObject("db", db);
            this.state = utils_2.ensureParamObject("state", state);
            var _a = options.readOnly, readOnly = _a === void 0 ? false : _a, _b = options.tableSchemas, tableSchemas = _b === void 0 ? db.tables : _b;
            this.readOnly = readOnly;
            this.tables = utils_2.toObject(tableSchemas.map(function (tableSchema) {
                return _this.db.factory.newTableModel(_this, tableSchema, state[tableSchema.name]);
            }), function (t) { return t.schema.name; });
        }
        DatabaseSession.prototype.getTable = function (name) {
            return this.tables[name];
        };
        DatabaseSession.prototype.upsert = function (ctx) {
            var _this = this;
            if (this.readOnly)
                throw new Error(errors_5.default.sessionReadonly());
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
                throw new Error(errors_5.default.sessionReadonly());
            Object.keys(this.tables).forEach(function (table) {
                var _a;
                var oldState = _this.state[table];
                var newState = _this.tables[table].state;
                if (oldState !== newState)
                    _this.state = tslib_5.__assign({}, _this.state, (_a = {}, _a[table] = newState, _a));
            });
            return this.state;
        };
        return DatabaseSession;
    }());
    exports.default = DatabaseSession;
});
define("models/FieldSchemaModel", ["require", "exports", "tslib", "constants", "errors", "utils"], function (require, exports, tslib_6, constants_4, errors_6, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_6 = tslib_6.__importDefault(errors_6);
    var FieldSchemaModel = /** @class */ (function () {
        function FieldSchemaModel(table, name, schema, cascadeAsDefault) {
            if (cascadeAsDefault === void 0) { cascadeAsDefault = false; }
            this.table = utils_3.ensureParamObject("table", table);
            utils_3.ensureParamString("name", name);
            utils_3.ensureParamObject("schema", schema);
            this.type = schema.type || constants_4.TYPE_ATTR;
            this.name = utils_3.optionalParamString("schema.fieldName", schema.fieldName, name);
            this.propName = utils_3.optionalParamString("schema.propName", schema.propName, name);
            this.references = utils_3.optionalParamString("schema.references", schema.references);
            this.order = schema.order || 0;
            this.isPrimaryKey = schema.pk === true || schema.type === constants_4.TYPE_PK;
            this.isForeignKey = !!this.references;
            this.isStamp = schema.stamp === true || schema.type === constants_4.TYPE_MODIFIED;
            this._valueFactory = schema.value !== undefined
                ? utils_3.ensureParamFunction("schema.value", schema.value).bind(this)
                : undefined;
            if (this.isPrimaryKey || this.isForeignKey) {
                if (this.isForeignKey)
                    this.relationName = utils_3.optionalParamString("schema.relationName", schema.relationName);
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
                    throw new Error(errors_6.default.fkInvalidReference(this.table.name, this.name, this.references));
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
define("models/RecordFieldModel", ["require", "exports", "utils"], function (require, exports, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordFieldModel = /** @class */ (function () {
        function RecordFieldModel(schema, record) {
            this.schema = utils_4.ensureParamObject("schema", schema);
            this.name = utils_4.ensureParamString("schema.name", schema.name);
            this.record = utils_4.ensureParamObject("record", record);
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
define("models/RecordModel", ["require", "exports", "tslib", "utils"], function (require, exports, tslib_7, utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RecordModel = /** @class */ (function () {
        function RecordModel(id, table) {
            this.id = utils_5.ensureParamString("id", id);
            this.table = utils_5.ensureParamObject("table", table);
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
        Object.defineProperty(RecordModel.prototype, "metadata", {
            get: function () {
                return this.table.getMetadata(this.id);
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
        RecordModel.prototype.setMetadata = function (data) {
            this.table.setMetadata(this.id, tslib_7.__assign({}, this.metadata, data));
        };
        return RecordModel;
    }());
    exports.default = RecordModel;
});
define("models/RecordSetModel", ["require", "exports", "tslib", "errors", "utils"], function (require, exports, tslib_8, errors_7, utils_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_7 = tslib_8.__importDefault(errors_7);
    var RecordSetModel = /** @class */ (function () {
        function RecordSetModel(table, schema, owner) {
            this.table = utils_6.ensureParamObject("table", table);
            this.schema = utils_6.ensureParamObject("schema", schema);
            this.owner = utils_6.ensureParamObject("owner", owner, "id");
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
            return this.ids.map(function (id) { return _this.table.get(id); });
        };
        RecordSetModel.prototype.values = function () {
            var _this = this;
            return this.ids.map(function (id) {
                var value = _this.table.getValue(id);
                if (!value)
                    throw new Error(errors_7.default.recordNotFound(_this.table.schema.name, id));
                return value;
            });
        };
        RecordSetModel.prototype.add = function (data) {
            return this.table.insert(this._normalize(data));
        };
        RecordSetModel.prototype.remove = function (data) {
            var _this = this;
            var ids = this._normalize(data).map(function (obj) {
                return _this.table.schema.ensurePrimaryKey(obj);
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
define("state", ["require", "exports", "tslib", "errors", "utils"], function (require, exports, tslib_9, errors_8, utils_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_8 = tslib_9.__importDefault(errors_8);
    exports.merge = function (original, modified) {
        var ids = modified.ids
            ? utils_7.mergeIds(original.ids, modified.ids, true)
            : original.ids;
        var byId = modified.byId
            ? tslib_9.__assign({}, original.byId, modified.byId) : original.byId;
        var meta = modified.meta
            ? tslib_9.__assign({}, original.meta, modified.meta) : original.meta;
        return tslib_9.__assign({}, original, { byId: byId,
            ids: ids,
            meta: meta });
    };
    exports.splice = function (original, idsToDelete) {
        var byId = tslib_9.__assign({}, original.byId);
        var ids = original.ids.slice();
        var indexes = tslib_9.__assign({}, original.indexes);
        var meta = tslib_9.__assign({}, original.meta);
        var deleted = idsToDelete.reduce(function (n, id) {
            var record = byId[id];
            delete byId[id];
            delete meta[id];
            var idx = ids.indexOf(id);
            if (idx >= 0)
                ids.splice(idx, 1);
            if (record)
                return n.concat([{ id: id, record: record }]);
            return n;
        }, []);
        return {
            deleted: deleted,
            state: tslib_9.__assign({}, original, { byId: byId, ids: ids, indexes: indexes, meta: meta })
        };
    };
    exports.updateIndexes = function (name, original, modified) {
        Object.keys(modified.indexes).forEach(function (key) {
            var idx = original.indexes[key]
                || (original.indexes[key] = { unique: modified.indexes[key].unique, values: {} });
            Object.keys(modified.indexes[key].values).forEach(function (fk) {
                var idxBucket = idx.values[fk] || (idx.values[fk] = []);
                var modifiedBucket = utils_7.mergeIds(idxBucket, modified.indexes[key].values[fk], false);
                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error(errors_8.default.fkViolation(name, key));
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
define("models/NormalizeContext", ["require", "exports", "utils"], function (require, exports, utils_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DbNormalizeContext = /** @class */ (function () {
        function DbNormalizeContext(schema, options) {
            this.output = {};
            this.emits = {};
            this.schema = utils_8.ensureParamObject("schema", schema, "db");
            this.db = utils_8.ensureParamObject("schema.db", this.schema.db);
            this.table = options.table;
            this.normalizePKs = options.normalizePKs === true;
            this.argument = options.argument;
            this.currentSchema = schema;
        }
        DbNormalizeContext.prototype.emit = function (tableName, record) {
            this.emits[tableName] = this.emits[tableName] || [];
            this.emits[tableName].push(record);
        };
        return DbNormalizeContext;
    }());
    exports.default = DbNormalizeContext;
});
define("models/TableModel", ["require", "exports", "tslib", "constants", "errors", "state", "utils", "models/NormalizeContext"], function (require, exports, tslib_10, constants_5, errors_9, state_1, utils, NormalizeContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_9 = tslib_10.__importDefault(errors_9);
    state_1 = tslib_10.__importDefault(state_1);
    utils = tslib_10.__importStar(utils);
    NormalizeContext_1 = tslib_10.__importDefault(NormalizeContext_1);
    var TableModel = /** @class */ (function () {
        function TableModel(session, schema, state) {
            this.dirty = false;
            this.session = utils.ensureParamObject("session", session);
            this.schema = utils.ensureParamObject("schema", schema);
            this.state = utils.ensureParamObject("state", state || constants_5.initialState(this.schema.name));
            this.db = this.schema.db;
            var _a = this.state, ids = _a.ids, byId = _a.byId, indexes = _a.indexes, meta = _a.meta, name = _a.name;
            if (!ids || !byId || !indexes)
                throw new Error(errors_9.default.tableInvalidState(schema.name));
            if (!name)
                this.state.name = name;
            if (!meta)
                this.state.meta = {};
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
            return this.state.ids.map(function (id) { return _this.db.factory.newRecordModel(id, _this); });
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
                throw new Error(errors_9.default.recordNotFound(this.schema.name, id));
            return this.db.factory.newRecordModel(utils.asID(id), this);
        };
        TableModel.prototype.getOrDefault = function (id) {
            if (!this.exists(id))
                return undefined;
            return this.db.factory.newRecordModel(utils.asID(id), this);
        };
        TableModel.prototype.getValue = function (id) {
            if (utils.isValidID(id))
                return this.state.byId[id];
            else
                return undefined;
        };
        TableModel.prototype.getValues = function () {
            return this.values();
        };
        TableModel.prototype.getMetadata = function (id) {
            return this.state.meta[id] || {};
        };
        TableModel.prototype.setMetadata = function (ids, metadata) {
            var meta = utils.ensureArray(ids).reduce(function (map, id) {
                var _a;
                return (tslib_10.__assign({}, map, (_a = {}, _a[id] = metadata, _a)));
            }, {});
            this.state = state_1.default.merge(this.state, { meta: meta });
        };
        TableModel.prototype.getIndex = function (name, fk) {
            utils.ensureParamString("name", name);
            utils.ensureParamString("fk", fk);
            if (this.state.indexes[name] && this.state.indexes[name].values[fk])
                return this.state.indexes[name].values[fk];
            else
                return [];
        };
        TableModel.prototype.insert = function (data, argument) {
            return this._normalizedAction(data, this.insertNormalized, { normalizePKs: true, argument: argument });
        };
        TableModel.prototype.update = function (data, argument) {
            return this._normalizedAction(data, this.updateNormalized, { argument: argument });
        };
        TableModel.prototype.upsert = function (data, argument) {
            return this._normalizedAction(data, this.upsertNormalized, { normalizePKs: true, argument: argument });
        };
        TableModel.prototype.delete = function (data) {
            var _this = this;
            utils.ensureParam("data", data);
            var idsToDelete = utils.ensureArray(data).map(function (subject) {
                return utils.isObject(subject)
                    ? _this.schema.ensurePrimaryKey(subject)
                    : utils.ensureID(subject);
            });
            if (!idsToDelete.length)
                return 0;
            this._deleteCascade(idsToDelete);
            var _a = state_1.default.splice(this.state, idsToDelete), deleted = _a.deleted, state = _a.state;
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
                this.state = constants_5.initialState(this.schema.name);
            }
        };
        TableModel.prototype.upsertNormalized = function (norm) {
            var _this = this;
            utils.ensureParamObject("table", norm);
            var toUpdate = constants_5.initialState(this.schema.name);
            var toInsert = constants_5.initialState(this.schema.name);
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
            this.state = state_1.default.merge(this.state, table);
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
                    throw new Error(errors_9.default.recordUpdateViolation(_this.schema.name, id));
                var oldRecord = _this.state.byId[id];
                var newRecord = _this.schema.mergeRecord(oldRecord, table.byId[id]);
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
                this.state = state_1.default.merge(this.state, { byId: byId });
                if (updateIndexes)
                    this._updateIndexes(table);
            }
        };
        TableModel.prototype.normalize = function (data, options) {
            utils.ensureParam("data", data);
            var ctx = new NormalizeContext_1.default(this.schema, tslib_10.__assign({ table: this, normalizePKs: true }, options));
            this.schema.normalize(data, ctx);
            return ctx;
        };
        TableModel.prototype._normalizedAction = function (data, action, options) {
            utils.ensureParam("data", data);
            utils.ensureParamFunction("action", action);
            var ctx = this.normalize(data, options);
            var table = ctx.output[this.schema.name];
            if (table)
                action.call(this, table);
            this.session.upsert(ctx);
            return table.ids;
        };
        TableModel.prototype._cleanIndexes = function (id, record, indexes) {
            var fks = this.schema.getForeignKeys(record);
            state_1.default.cleanIndexes(fks, id, indexes);
        };
        TableModel.prototype._updateIndexes = function (table) {
            state_1.default.updateIndexes(this.schema.name, this.state, table);
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
define("models/TableSchemaModel", ["require", "exports", "tslib", "errors", "utils"], function (require, exports, tslib_11, errors_10, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    errors_10 = tslib_11.__importDefault(errors_10);
    utils = tslib_11.__importStar(utils);
    var TableSchemaModel = /** @class */ (function () {
        function TableSchemaModel(db, name, definition) {
            var _this = this;
            this._relations = [];
            this.db = utils.ensureParamObject("db", db);
            this.name = utils.ensureParamString("name", name);
            utils.ensureParamObject("definition", definition);
            this.fields = Object.keys(definition)
                .map(function (fieldName, order) {
                return db.factory.newFieldSchema(_this, fieldName, tslib_11.__assign({ order: order }, definition[fieldName]));
            });
            this.fields.sort(function (a, b) { return a.order - b.order; });
            this._normalizer = db.factory.newSchemaNormalizer(this);
            this._primaryKeyFields = this.fields.filter(function (f) { return f.isPrimaryKey; });
            this._foreignKeyFields = this.fields.filter(function (f) { return f.isForeignKey; });
            this._stampFields = this.fields.filter(function (f) { return f.isStamp; });
        }
        Object.defineProperty(TableSchemaModel.prototype, "relations", {
            get: function () { return this._relations; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TableSchemaModel.prototype, "primaryKeys", {
            get: function () { return this._primaryKeyFields; },
            enumerable: true,
            configurable: true
        });
        TableSchemaModel.prototype.connect = function (tableMap) {
            var _this = this;
            utils.ensureParamObject("tableMap", tableMap);
            Object.keys(tableMap).forEach(function (schema) {
                return _this._relations = _this._relations.concat(tableMap[schema].fields.filter(function (f) { return f.references === _this.name; }));
            });
            this._foreignKeyFields.forEach(function (fk) { return fk.connect(tableMap); });
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
                return tslib_11.__assign({}, obj, (_b = {}, _b[rel.name] = ownerId, _b));
            });
        };
        TableSchemaModel.prototype.normalize = function (data, context) {
            return this._normalizer.normalize(data, context);
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
        TableSchemaModel.prototype.ensurePrimaryKey = function (record) {
            var pk = this.getPrimaryKey(record);
            if (!pk)
                throw new Error(errors_10.default.pkNotFound(this.name));
            return pk;
        };
        TableSchemaModel.prototype.composePrimaryKey = function (parts) {
            if (Array.isArray(parts))
                return parts.join(this.db.keySeparator);
            return parts;
        };
        TableSchemaModel.prototype.getPrimaryKey = function (record) {
            var _this = this;
            var generator = this.db.getPkGenerator(this.name);
            if (generator)
                return generator(record, this);
            var lookup = (this._primaryKeyFields.length ? this._primaryKeyFields : this._foreignKeyFields);
            var combinedPk = lookup.reduce(function (pk, field) {
                var key = field.getValue(record);
                return pk && key ? (pk + _this.db.keySeparator + key) : key;
            }, null);
            if (utils.isValidID(combinedPk))
                return utils.asID(combinedPk);
            else
                return undefined;
        };
        TableSchemaModel.prototype.getForeignKeys = function (record) {
            var _this = this;
            return this._foreignKeyFields.map(function (fk) {
                if (!fk.references || !fk.refTable)
                    throw new Error(errors_10.default.fkInvalid(_this.name, fk.name));
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
        TableSchemaModel.prototype.mergeRecord = function (oldRecord, newRecord) {
            var merger = this.db.getRecordMerger(this.name);
            if (merger)
                return merger(oldRecord, newRecord, this);
            return tslib_11.__assign({}, oldRecord, newRecord);
        };
        return TableSchemaModel;
    }());
    exports.default = TableSchemaModel;
});
define("models/index", ["require", "exports", "tslib", "models/Database", "models/DatabaseSession", "models/FieldSchemaModel", "models/RecordFieldModel", "models/RecordModel", "models/RecordSetModel", "models/TableModel", "models/TableSchemaModel"], function (require, exports, tslib_12, Database_1, DatabaseSession_1, FieldSchemaModel_1, RecordFieldModel_1, RecordModel_1, RecordSetModel_1, TableModel_1, TableSchemaModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Database_1 = tslib_12.__importDefault(Database_1);
    DatabaseSession_1 = tslib_12.__importDefault(DatabaseSession_1);
    FieldSchemaModel_1 = tslib_12.__importDefault(FieldSchemaModel_1);
    RecordFieldModel_1 = tslib_12.__importDefault(RecordFieldModel_1);
    RecordModel_1 = tslib_12.__importDefault(RecordModel_1);
    RecordSetModel_1 = tslib_12.__importDefault(RecordSetModel_1);
    TableModel_1 = tslib_12.__importDefault(TableModel_1);
    TableSchemaModel_1 = tslib_12.__importDefault(TableSchemaModel_1);
    exports.Database = Database_1.default;
    exports.DatabaseSession = DatabaseSession_1.default;
    exports.FieldSchemaModel = FieldSchemaModel_1.default;
    exports.RecordFieldModel = RecordFieldModel_1.default;
    exports.RecordModel = RecordModel_1.default;
    exports.RecordSetModel = RecordSetModel_1.default;
    exports.TableModel = TableModel_1.default;
    exports.TableSchemaModel = TableSchemaModel_1.default;
});
define("index", ["require", "exports", "tslib", "ModelFactory", "models/index", "Normalizer", "constants", "models/index", "ModelFactory", "utils"], function (require, exports, tslib_13, ModelFactory_1, models_1, Normalizer_1, constants_6, models_2, ModelFactory_2, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ModelFactory_1 = tslib_13.__importDefault(ModelFactory_1);
    Normalizer_1 = tslib_13.__importDefault(Normalizer_1);
    utils = tslib_13.__importStar(utils);
    var defaultFactory = {
        newTableSchema: function (db, name, schema) { return new models_1.TableSchemaModel(db, name, schema); },
        newFieldSchema: function (table, name, schema) { return new models_1.FieldSchemaModel(table, name, schema); },
        newTableModel: function (session, schema, state) { return new models_1.TableModel(session, schema, state); },
        newRecordSetModel: function (table, schema, owner) { return new models_1.RecordSetModel(table, schema, owner); },
        newRecordFieldModel: function (schema, record) { return new models_1.RecordFieldModel(schema, record); },
        newSchemaNormalizer: function (schema) { return new Normalizer_1.default(schema); },
        newSession: function (db, state, options) { return new models_1.DatabaseSession(db, state, options); }
    };
    exports.createFactory = function (factory, recordModelClass) {
        return ModelFactory_1.default(tslib_13.__assign({}, defaultFactory, factory), recordModelClass || models_1.RecordModel);
    };
    exports.createDatabase = function (schema, options) {
        if (options === void 0) { options = {}; }
        var _a = options.factory, factory = _a === void 0 ? {} : _a, _b = options.recordModelClass, recordModelClass = _b === void 0 ? models_1.RecordModel : _b, dbOptions = tslib_13.__rest(options, ["factory", "recordModelClass"]);
        var modelFactory = exports.createFactory(factory, recordModelClass);
        return new models_1.Database(schema, modelFactory, dbOptions);
    };
    tslib_13.__exportStar(constants_6, exports);
    tslib_13.__exportStar(models_2, exports);
    tslib_13.__exportStar(ModelFactory_2, exports);
    exports.utils = utils;
});
