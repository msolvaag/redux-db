import { TableRecord, TableRecordSet, utils } from "redux-db";
import errors from "./errors";

export default class ExtendedTableModel<T, R extends TableRecord<T>> extends TableModel<T, R> {

    getMany(ids: (number | string)[]): R[] {
        if (!this.exists(id)) return undefined;
        return this.schema.db.factory.newRecordModel(utils.asID(id), this) as R;
    }
    
    getByFk(fieldName: string, id: number | string): TableRecordSet<R, T> {
        utils.ensureParam("fieldName", fieldName);
        id = utils.ensureID(id);

        const field = this.schema.fields.filter(f => f.isForeignKey && f.name === fieldName)[0];
        if (!field) throw new Error(errors.fkUndefined(this.schema.name, fieldName));

        return this.schema.db.factory.newRecordSetModel(this, field, { id });
    }

    getFieldValue(id: string | number, field: keyof T) {
        const record = this.get(id);
        if (record)
            return record.value[field];
        else
            return undefined;
    }
}
