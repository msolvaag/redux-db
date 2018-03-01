import { Session, Table, TableRecord, TableRecordSet, DatabaseSchema, TableSchema, FieldSchema, TableState, TableDDL, ModelFactory } from "./def";
import { TableModel, RecordFieldModel, RecordSetModel, RecordModel } from "./models";
import { TableSchemaModel, FieldSchemaModel } from "./schema";
import * as utils from "./utils";

export interface RecordClass {
    new(id: string, table: Table): TableRecord;
}

export interface ExtendedRecordModel extends TableRecord {
    __fields: { [key: string]: any };
}

const createRecordModelClass = (BaseClass: RecordClass) => {
    return class ExtendedRecordModel extends BaseClass implements ExtendedRecordModel {
        __fields: { [key: string]: any } = {};

        constructor(id: string, table: Table) {
            super(id, table);
        }
    }
};

export class DefaultModelFactory implements ModelFactory {
    private _recordClass: { [key: string]: RecordClass } = {};

    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema {
        return new TableSchemaModel(db, name, schema);
    }

    newTableModel(session: Session, state: TableState, schema: TableSchema): Table {
        return new TableModel(session, state, schema);
    }

    newRecordModel(id: string, table: Table): TableRecord {
        return new (this._createRecordModel(table.schema))(id, table);
    }

    protected newRecordField(schema: FieldSchema, record: TableRecord) {
        if (!schema.isForeignKey)
            return new RecordFieldModel(schema, record);

        const refTable = schema.references && record.table.session.tables[schema.references];
        if (!refTable)
            throw new Error(`The foreign key: "${schema.name}" references an unregistered table: "${schema.references}" in the current session.`);

        const recordId = schema.getRecordValue(record);
        if (recordId === undefined) return null;
        return refTable.getOrDefault(recordId);
    }

    protected newRecordSet(schema: FieldSchema, record: TableRecord): TableRecordSet {
        const refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        return new RecordSetModel(refTable, schema, record);
    }

    protected newRecordRelation(schema: FieldSchema, record: TableRecord): TableRecord | null {
        const refTable = record.table.session.tables[schema.table.name];
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        let id = refTable.index(schema.name, record.id)[0];
        if (id === undefined) return null;
        return this.newRecordModel(id, refTable);
    }

    protected getRecordBaseClass(schema: TableSchema) {
        return RecordModel;
    }

    private _createRecordModel(schema: TableSchema) {
        if (this._recordClass[schema.name])
            return this._recordClass[schema.name];
        else {
            const ExtendedRecordModel = createRecordModelClass(this.getRecordBaseClass(schema));

            const defineProperty = (name: string, field: FieldSchema, factory: (f: FieldSchema, ref: ExtendedRecordModel) => any, cache = true) => {
                if (name === "id") throw new Error(`The property "${field.table.name}.id" is a reserved name. Please specify another name using the "propName" definition.`);
                Object.defineProperty(ExtendedRecordModel.prototype, name, {
                    get: function (this: ExtendedRecordModel) {
                        // TODO: Improve the instance cache mechanism. Invalidate when the field value changes..
                        return cache ? (this.__fields[name] || (this.__fields[name] = factory(field, this))) : factory(field, this);
                    }
                });
            };

            schema.fields.forEach(f => (f.isForeignKey || !f.isPrimaryKey) && defineProperty(f.propName, f, this.newRecordField.bind(this), false));
            schema.relations.forEach(f => f.relationName && defineProperty(f.relationName, f, f.unique ? this.newRecordRelation.bind(this) : this.newRecordSet.bind(this), !f.unique));

            return this._recordClass[schema.name] = ExtendedRecordModel;
        }
    }
}