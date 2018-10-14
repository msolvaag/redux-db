import { RESERVED_PROPERTIES } from "./constants";
import errors from "./errors";
import RecordFieldModel from "./models/RecordFieldModel";
import RecordModel from "./models/RecordModel";
import RecordSetModel from "./models/RecordSetModel";
import TableModel from "./models/TableModel";
import TableSchemaModel from "./models/TableSchemaModel";
import {
    DatabaseSchema,
    ExtendedRecord,
    FieldSchema,
    ModelFactory,
    RecordClass,
    RecordValue,
    Session,
    Table,
    TableDefinition,
    TableRecord,
    TableRecordSet,
    TableSchema,
    TableState
} from "./types";

const createRecordModelClass = (Base: RecordClass) => {
    return class ExtendedRecordModel extends Base implements ExtendedRecord {
        _fields: { [key: string]: any } = {};

        constructor(id: string, table: Table) {
            super(id, table);
        }
    };
};

export default class DefaultModelFactory implements ModelFactory {
    private _recordClass: { [key: string]: RecordClass } = {};

    newTableSchema(db: DatabaseSchema, name: string, schema: TableDefinition) {
        return new TableSchemaModel(db, name, schema);
    }

    newTableModel(session: Session, schema: TableSchema, state: TableState) {
        return new TableModel(session, schema, state);
    }

    newRecordModel(id: string, table: Table) {
        const model = this.createRecordModel(table.schema);
        return new model(id, table) as TableRecord;
    }

    newRecordSetModel(table: Table, schema: FieldSchema, owner: TableRecord) {
        return new RecordSetModel(table, schema, owner);
    }

    protected getRecordBaseClass(schema: TableSchema) {
        return RecordModel;
    }

    protected createRecordModel(schema: TableSchema) {
        if (this._recordClass[schema.name])
            return this._recordClass[schema.name];
        else {
            const model = createRecordModelClass(this.getRecordBaseClass(schema));

            schema.fields.forEach(f =>
                (f.isForeignKey || !f.isPrimaryKey)
                && this._defineProperty(model, f.propName, f, this._newRecordField.bind(this), false));

            schema.relations.forEach(f =>
                f.relationName && this._defineProperty(model, f.relationName, f,
                    f.unique
                        ? this._newRecordRelation.bind(this)
                        : this._newRecordSet.bind(this), !f.unique));

            return this._recordClass[schema.name] = model;
        }
    }

    private _newRecordField(schema: FieldSchema, record: TableRecord) {
        if (!schema.isForeignKey)
            return new RecordFieldModel(schema, record);

        const refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error(errors.fkReferenceNotInSession(schema.name, schema.references));

        const recordId = schema.getRecordValue(record);
        if (recordId === undefined) return null;
        return refTable.get(recordId);
    }

    private _newRecordSet(schema: FieldSchema, record: TableRecord): TableRecordSet {
        const refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(errors.tableNotInSession(schema.table.name));

        return this.newRecordSetModel(refTable, schema, record);
    }

    private _newRecordRelation(schema: FieldSchema, record: TableRecord): TableRecord | null {
        const refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(errors.tableNotInSession(schema.table.name));

        const [id] = refTable.getIndex(schema.name, record.id);
        if (id === undefined) return null;

        return this.newRecordModel(id, refTable);
    }

    private _defineProperty = (
        model: RecordClass,
        name: string,
        field: FieldSchema,
        factory: (f: FieldSchema, ref: ExtendedRecord) => any,
        cache = true
    ) => {
        if (RESERVED_PROPERTIES.indexOf(name) >= 0)
            throw new Error(errors.reservedProperty(field.table.name, name));

        Object.defineProperty(model.prototype, name, {
            get(this: ExtendedRecord) {
                // TODO: Improve the instance cache mechanism. Invalidate when the field value changes..
                return cache
                    ? (this._fields[name] || (this._fields[name] = factory(field, this)))
                    : factory(field, this);
            }
        });
    }
}
