import errors from "../errors";
import {
    RecordValue,
    Session,
    Table,
    TableIndex,
    TableRecord,
    TableRecordSet,
    TableSchema,
    TableState
} from "../types";
import * as utils from "../utils";
import DbNormalizeContext from "./NormalizeContext";
import { INITIAL_STATE } from "../constants";

export default class TableModel<T extends RecordValue, R extends TableRecord<T>> implements Table<T, R> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<T>;
    dirty = false;

    constructor(session: Session, schema: TableSchema, state: TableState<T> = INITIAL_STATE) {
        this.session = utils.ensureParam("session", session);
        this.schema = utils.ensureParam("schema", schema);
        this.state = utils.ensureParam("state", state);

        const { ids, byId, indexes } = this.state;
        if (!ids || !byId || !indexes) throw new Error(errors.tableInvalidState(schema.name));
    }

    get length() {
        return this.state.ids.length;
    }

    all(): R[] {
        return this.state.ids.map(id => this.schema.db.factory.newRecordModel(id, this) as R);
    }

    getValues() {
        return this.state.ids.map(id => this.state.byId[id]);
    }

    get(id: number | string): R {
        if (!this.exists(id))
            throw new Error(errors.recordNotFound(this.schema.name, id));

        return this.schema.db.factory.newRecordModel(utils.asID(id), this) as R;
    }

    getOrDefault(id: number | string) {
        return this.exists(id) ? this.get(id) : null;
    }

    getByFk(fieldName: string, id: number | string): TableRecordSet<R, T> {
        utils.ensureParam("fieldName", fieldName);
        id = utils.ensureID(id);

        const field = this.schema.fields.filter(f => f.isForeignKey && f.name === fieldName)[0];
        if (!field) throw new Error(errors.fkUndefined(this.schema.name, fieldName));

        return this.schema.db.factory.newRecordSetModel(this, field, { id });
    }

    getFieldValue(id: string | number, field: keyof T) {
        const record = this.getOrDefault(id);
        if (record)
            return record.value[field];
        else
            return undefined;
    }

    getValue(id: number | string) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    }

    getIndex(name: string, fk: string) {
        utils.ensureParamString("value", name);
        utils.ensureParamString("fk", fk);

        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    }

    exists(id: number | string) {
        if (!utils.isValidID(id)) return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    }

    insert(data: T | T[]) {
        return this._normalizedAction(data, this.insertNormalized, true);
    }

    update(data: Partial<T> | Partial<T>[]) {
        return this._normalizedAction(data, this.updateNormalized, false);
    }

    upsert(data: Partial<T> | Partial<T>[]) {
        return this._normalizedAction(data, this.upsertNormalized, true);
    }

    delete(id: string | number | Partial<T>) {
        if (typeof id !== "string" && typeof id !== "number")
            id = this.schema.getPrimaryKey(id);

        if (!this.exists(id)) return false;
        id = utils.asID(id);

        this._deleteCascade(id);

        const byId = { ...this.state.byId };
        const ids = this.state.ids.slice();
        const indexes = { ...this.state.indexes };
        const record = byId[id];

        delete byId[id];
        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);

        if (record)
            this._cleanIndexes(id, record, indexes);

        this.dirty = true;
        this.state = { ...this.state, byId, ids, indexes };

        return true;
    }

    deleteAll() {
        if (this.length)
            this.all().forEach(d => d.delete());
    }

    insertNormalized(table: TableState<T>): R[] {
        utils.ensureParam("table", table);

        this.dirty = true;
        this.state = {
            ...this.state,
            byId: { ...this.state.byId, ...table.byId },
            ids: utils.mergeIds(this.state.ids, table.ids, true)
        };
        this._updateIndexes(table);

        return table.ids.map(id => this.schema.db.factory.newRecordModel(id, this) as R);
    }

    updateNormalized(table: TableState<T>): R[] {
        utils.ensureParam("table", table);

        const state = { ... this.state };
        let dirty = false;

        const records = Object.keys(table.byId).map(id => {
            if (!this.state.byId[id])
                throw new Error(errors.recordUpdateNotFound(this.schema.name, id));

            const oldRecord = state.byId[id] as {};
            const newRecord = { ...oldRecord, ...table.byId[id] as {} } as T;

            const isModified = this.schema.isModified(oldRecord, newRecord);

            if (isModified) {
                state.byId[id] = newRecord;
                dirty = true;
            }

            return this.schema.db.factory.newRecordModel(id, this) as R;
        });

        if (dirty) {
            this.dirty = true;
            this.state = state;
            this._updateIndexes(table);
        }

        return records;
    }

    upsertNormalized(norm: TableState<T>) {
        utils.ensureParam("table", norm);

        const toUpdate: TableState<T> = { ids: [], byId: {}, indexes: {} };
        const toInsert: TableState<T> = { ids: [], byId: {}, indexes: {} };

        norm.ids.forEach(id => {
            if (this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            } else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });

        const refs = (toUpdate.ids.length ? this.updateNormalized(toUpdate) : []).concat(
            (toInsert.ids.length ? this.insertNormalized(toInsert) : []));

        this._updateIndexes(norm);

        return refs;
    }

    private _normalizedAction(
        data: Partial<T> | Partial<T>[],
        action: (norm: TableState) => R[],
        normalizePKs: boolean
    ): R[] {
        utils.ensureParam("data", data);
        utils.ensureParam("action", action);

        const ctx = new DbNormalizeContext(this.schema, normalizePKs);
        this.schema.normalize(data, ctx);

        const table = ctx.output[this.schema.name];
        const records = table ? action.call(this, table) : [];
        this.session.upsert(ctx);
        return records;
    }

    private _updateIndexes(table: TableState) {
        Object.keys(table.indexes).forEach(key => {
            const idx = this.state.indexes[key]
                || (this.state.indexes[key] = { unique: table.indexes[key].unique, values: {} });

            Object.keys(table.indexes[key].values).forEach(fk => {
                const idxBucket = idx.values[fk] || (idx.values[fk] = []);

                const modifiedBucket = utils.mergeIds(idxBucket, table.indexes[key].values[fk], false);

                if (idx.unique && modifiedBucket.length > 1)
                    throw new Error(errors.fkViolation(this.schema.name, key));

                idx.values[fk] = modifiedBucket;
            });
        });
    }

    private _cleanIndexes(id: string, record: any, indexes: TableIndex) {
        const fks = this.schema.getForeignKeys(record);

        fks.forEach(fk => {
            let fkIdx = -1;
            if (fk.value && indexes[fk.name] && indexes[fk.name].values[fk.value])
                fkIdx = indexes[fk.name].values[fk.value].indexOf(id);

            if (fkIdx >= 0) {
                const idxBucket = indexes[fk.name].values[fk.value].slice();
                idxBucket.splice(fkIdx, 1);

                indexes[fk.name].values[fk.value] = idxBucket;
            } else if (indexes[fk.name]) {
                delete indexes[fk.name].values[id];
                if (Object.keys(indexes[fk.name].values).length === 0)
                    delete indexes[fk.name];
            }
        });
    }

    private _deleteCascade(id: string) {
        const cascade = this.schema.relations.filter(rel => rel.relationName && rel.cascade);
        if (cascade.length) {
            const model = this.get(id) as any;

            if (model)
                cascade.forEach(schema => {
                    const relation = model[schema.relationName as string];
                    if (relation)
                        relation.delete();
                });
        }
    }
}
