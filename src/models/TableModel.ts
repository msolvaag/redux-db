import { initialState } from "../constants";
import errors from "../errors";
import {
    MapOf,
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
import NormalizeContext from "./NormalizeContext";

export default class TableModel<T extends RecordValue, R extends TableRecord<T>> implements Table<T, R> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<T>;
    dirty = false;

    constructor(session: Session, schema: TableSchema, state = initialState()) {
        this.session = utils.ensureParamObject("session", session);
        this.schema = utils.ensureParamObject("schema", schema);
        this.state = utils.ensureParamObject("state", state);

        const { ids, byId, indexes } = this.state;
        if (!ids || !byId || !indexes) throw new Error(errors.tableInvalidState(schema.name));
    }

    get length() {
        return this.state.ids.length;
    }

    all(): R[] {
        return this.state.ids.map(id => this.schema.db.factory.newRecordModel(id, this) as R);
    }

    values() {
        return this.state.ids.map(id => this.state.byId[id]);
    }

    exists(id: number | string) {
        if (!utils.isValidID(id)) return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    }

    get(id: number | string): R | undefined {
        if (!this.exists(id)) return undefined;
        return this.schema.db.factory.newRecordModel(utils.asID(id), this) as R;
    }

    getValue(id: number | string) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    }

    getIndex(name: string, fk: string) {
        utils.ensureParamString("name", name);
        utils.ensureParamString("fk", fk);

        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
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

    delete(data: string | number | Partial<T> | (string | number | Partial<T>)[]) {
        utils.ensureParam("data", data);

        const idsToDelete = utils.ensureArray(data).map(subject =>
            utils.isObject(subject)
                ? this.schema.getPrimaryKey(subject)
                : utils.ensureID(subject));

        if (!idsToDelete.length) return 0;

        this._deleteCascade(idsToDelete);

        const byId = { ...this.state.byId };
        const ids = this.state.ids.slice();
        const indexes = { ...this.state.indexes };

        const numDeleted = idsToDelete.reduce((n, id) => {
            const record = byId[id];
            delete byId[id];
            const idx = ids.indexOf(id);
            if (idx >= 0)
                ids.splice(idx, 1);

            if (record) {
                this._cleanIndexes(id, record, indexes);
                return n + 1;
            }
            return n;
        }, 0);

        this.dirty = true;
        this.state = { ...this.state, byId, ids, indexes };

        return numDeleted;
    }

    deleteAll() {
        if (this.length) {
            this._deleteCascade(this.state.ids);
            this.state = initialState();
        }
    }

    upsertNormalized(norm: TableState<T>) {
        utils.ensureParam("table", norm);

        const toUpdate = initialState<T>();
        const toInsert = initialState<T>();

        norm.ids.forEach(id => {
            if (this.exists(id)) {
                toUpdate.ids.push(id);
                toUpdate.byId[id] = norm.byId[id];
            } else {
                toInsert.ids.push(id);
                toInsert.byId[id] = norm.byId[id];
            }
        });

        if (toInsert.ids.length) this.insertNormalized(toInsert, false);
        if (toUpdate.ids.length) this.updateNormalized(toUpdate, false);

        this._updateIndexes(norm);
    }

    insertNormalized(table: TableState<T>, updateIndexes = true) {
        utils.ensureParamObject("table", table);

        const ids = utils.mergeIds(this.state.ids, table.ids, true);

        this.dirty = true;
        this.state = {
            ...this.state,
            byId: { ...this.state.byId, ...table.byId },
            ids
        };

        if (updateIndexes)
            this._updateIndexes(table);
    }

    updateNormalized(table: TableState<T>, updateIndexes = true) {
        utils.ensureParamObject("table", table);

        const byId = table.ids.reduce((map, id) => {
            if (!this.exists(id))
                throw new Error(errors.recordUpdateViolation(this.schema.name, id));

            const oldRecord = this.state.byId[id] as {};
            const newRecord = { ...oldRecord, ...table.byId[id] as {} } as T;

            const isModified = this.schema.isModified(oldRecord, newRecord);

            if (isModified)
                if (map) map[id] = newRecord;
                else return { [id]: newRecord };

            return map;
        }, null as MapOf<any> | null);

        if (byId) {
            this.dirty = true;
            this.state = {
                ...this.state,
                byId: { ...this.state.byId, ...byId }
            };

            if (updateIndexes)
                this._updateIndexes(table);
        }
    }

    private _normalizedAction(
        data: Partial<T> | Partial<T>[],
        action: (norm: TableState) => void,
        normalizePKs: boolean
    ) {
        utils.ensureParam("data", data);
        utils.ensureParamFunction("action", action);

        const ctx = new NormalizeContext(this.schema, normalizePKs);
        this.schema.normalize(data, ctx);

        const table = ctx.output[this.schema.name];
        if (table) action.call(this, table);
        this.session.upsert(ctx);
        return table.ids;
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

    private _deleteCascade(ids: string[]) {
        const cascade = this.schema.relations.filter(rel => rel.relationName && rel.cascade);
        if (cascade.length)
            ids.forEach(id => {
                const model = this.get(id) as MapOf<any>;

                if (model)
                    cascade.forEach(schema => {
                        const relation: TableRecordSet = schema.relationName && model[schema.relationName];
                        if (relation)
                            relation.delete();
                    });
            });
    }
}
