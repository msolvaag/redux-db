import { Session, Table, TableRecord, TableRecordSet, DatabaseSchema, TableSchema, FieldSchema, TableState, TableDDL, ModelFactory } from "./def";
import { TableModel, RecordFieldModel, TableRecordSetModel, TableRecordModel } from "./models";
import { TableSchemaModel, FieldSchemaModel } from "./schema";
import * as utils from "./utils";

export class DefaultModelFactory implements ModelFactory {
    private _recordClass: { [key: string]: any } = {};

    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema {
        return new TableSchemaModel(db, name, schema);
    }

    newTableModel(session: Session, state: TableState, schema: TableSchema): Table {
        return new TableModel(session, state, schema);
    }

    newRecord(id: string, table: Table): TableRecord {
        return new (this._recordClass[table.schema.name] || (this._recordClass[table.schema.name] = this.createRecordModelClass(table.schema)))(id, table);
    }

    protected newRecordField(schema: FieldSchema, record: TableRecord) {
        if (!schema.isForeignKey)
            return new RecordFieldModel(schema, record);

        const refTable = schema.references && record.table.session.tables[schema.references] as Table;
        if (!refTable)
            throw new Error(`The foreign key: "${schema.name}" references an unregistered table: "${schema.references}" in the current session.`);

        return refTable.getOrDefault(schema.getRecordValue(record));
    }

    protected newRecordSet(schema: FieldSchema, record: TableRecord): TableRecordSet {
        const refTable = record.table.session.tables[schema.table.name] as Table;
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        return new TableRecordSetModel(refTable, schema, record);
    }

    protected newRecordRelation(schema: FieldSchema, record: TableRecord): TableRecord | null {
        const refTable = record.table.session.tables[schema.table.name] as Table;
        if (!refTable)
            throw new Error(`The table: "${schema.table.name}" does not exist in the current session.`);

        const id = refTable.index(schema.name, record.id)[0];
        if (id === undefined) return null;
        else return this.newRecord(id, refTable);
    }

    protected createRecordModelClass(schema: TableSchema): { new(id: string, table: Table): TableRecord } {
        class Record extends TableRecordModel<any> {
            _fields: { [key: string]: any } = {};

            constructor(id: string, table: Table) {
                super(id, table);
            }
        }

        const defineProperty = (name: string, field: FieldSchema, factory: (f: FieldSchema, ref: Record) => any, cache = true) => {
            if (name === "id") throw new Error(`The property "${field.table.name}.id" is a reserved name. Please specify another name using the "propName" definition.`);
            Object.defineProperty(Record.prototype, name, {
                get: function (this: Record) {
                    return cache ? (this._fields[name] || (this._fields[name] = factory(field, this))) : factory(field, this);
                }
            });
        };

        schema.fields.forEach(f => (f.isForeignKey || !f.isPrimaryKey) && defineProperty(f.propName, f, this.newRecordField.bind(this)));
        schema.relations.forEach(f => f.relationName && defineProperty(f.relationName, f, f.unique ? this.newRecordRelation.bind(this) : this.newRecordSet.bind(this), !f.unique));

        return Record;
    }
}