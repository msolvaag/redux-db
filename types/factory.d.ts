import { Session, Table, TableRecord, TableRecordSet, DatabaseSchema, TableSchema, FieldSchema, TableState, TableDDL, ModelFactory } from "./def";
import { RecordFieldModel, RecordModel } from "./models";
export interface RecordClass {
    new (id: string, table: Table): TableRecord;
}
export interface ExtendedRecordModel extends TableRecord {
    __fields: {
        [key: string]: any;
    };
}
export declare class DefaultModelFactory implements ModelFactory {
    private _recordClass;
    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema;
    newTableModel(session: Session, schema: TableSchema, state: TableState): Table;
    newRecordModel(id: string, table: Table): TableRecord;
    protected newRecordField(schema: FieldSchema, record: TableRecord): TableRecord<Record<string, any>> | RecordFieldModel<Record<string, any>> | null;
    protected newRecordSet(schema: FieldSchema, record: TableRecord): TableRecordSet;
    protected newRecordRelation(schema: FieldSchema, record: TableRecord): TableRecord | null;
    protected getRecordBaseClass(schema: TableSchema): typeof RecordModel;
    private _createRecordModel(schema);
}
