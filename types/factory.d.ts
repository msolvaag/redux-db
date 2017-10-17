import { Session, Table, TableRecord, TableRecordSet, DatabaseSchema, TableSchema, FieldSchema, TableState, TableDDL, ModelFactory } from "./def";
import { RecordFieldModel } from "./models";
export declare class DefaultModelFactory implements ModelFactory {
    private _recordClass;
    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema;
    newTableModel(session: Session, state: TableState, schema: TableSchema): Table;
    newRecord<T>(id: string, table: Table): TableRecord<T>;
    protected newRecordField(schema: FieldSchema, record: TableRecord): TableRecord<any> | RecordFieldModel<any> | null;
    protected newRecordSet(schema: FieldSchema, record: TableRecord): TableRecordSet;
    protected newRecordRelation(schema: FieldSchema, record: TableRecord): TableRecord | null;
    protected createRecordModelClass<T>(schema: TableSchema): {
        new (id: string, table: Table): TableRecord<T>;
    };
}
