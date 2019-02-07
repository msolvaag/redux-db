import * as ReduxDB from "redux-db";
import errors from "./errors";

export default class ExtendedTableModel<R extends ReduxDB.TableRecord> extends ReduxDB.TableModel<R> {

    getMany(ids: (number | string)[]): R[] {
        return ids.map(id => this.db.factory.newRecordModel(ReduxDB.utils.asID(id), this) as R);
    }

    getByFk(fieldName: string, id: number | string): ReduxDB.TableRecordSet<R> {
        ReduxDB.utils.ensureParam("fieldName", fieldName);
        const pk = ReduxDB.utils.asID(
            ReduxDB.utils.ensureID(id));

        const [field] = this.schema.fields.filter(f => f.isForeignKey && f.name === fieldName);
        if (!field) throw new Error(errors.fkUndefined(this.schema.name, fieldName));

        return this.db.factory.newRecordSetModel(this, field, { id: pk }) as ReduxDB.TableRecordSet<R>;
    }

    getFieldValue<F>(id: string | number, field: keyof ReduxDB.ValueType<R>) {
        const record = this.get(id);
        if (record)
            return record.value[field as string];
        else
            return undefined;
    }
}
