import { initialState } from "../constants";
import errors from "../errors";
import tableState from "../state";
import {
    DatabaseSchema,
    MapOf,
    NormalizeOptions,
    PartialValue,
    PartialValues,
    PkType,
    Session,
    Table,
    TableIndex,
    TableRecord,
    TableRecordSet,
    TableSchema,
    TableState,
    Values,
    ValueType
} from "../types";
import * as utils from "../utils";
import NormalizeContext from "./NormalizeContext";

export default class TableModel<R extends TableRecord> implements Table<R> {
    readonly session: Session;
    readonly schema: TableSchema;
    readonly db: DatabaseSchema;
    state: TableState<ValueType<R>>;
    dirty = false;

    constructor(session: Session, schema: TableSchema, state?: TableState) {
        this.session = utils.ensureParamObject("session", session);
        this.schema = utils.ensureParamObject("schema", schema);
        this.state = utils.ensureParamObject("state", state || initialState(this.schema.name));
        this.db = this.schema.db;

        const { ids, byId, indexes, meta, name } = this.state;
        if (!ids || !byId || !indexes) throw new Error(errors.tableInvalidState(schema.name));
        if (!name) this.state.name = name;
        if (!meta) this.state.meta = {};
    }

    get length() {
        return this.state.ids.length;
    }

    all(): R[] {
        return this.state.ids.map(id => this.db.factory.newRecordModel(id, this) as R);
    }

    values() {
        return this.state.ids.map(id => this.state.byId[id]);
    }

    exists(id: PkType) {
        if (!utils.isValidID(id)) return false;
        return this.state.byId[utils.asID(id)] !== undefined;
    }

    get(id: PkType): R {
        if (!this.exists(id))
            throw new Error(errors.recordNotFound(this.schema.name, id));
        return this.db.factory.newRecordModel(utils.asID(id), this) as R;
    }

    getOrDefault(id: PkType): R | undefined {
        if (!this.exists(id))
            return undefined;
        return this.db.factory.newRecordModel(utils.asID(id), this) as R;
    }

    getValue(id: PkType) {
        if (utils.isValidID(id))
            return this.state.byId[id];
        else
            return undefined;
    }

    getValues() {
        return this.values();
    }

    getMetadata(id: PkType) {
        return this.state.meta[id] || {};
    }

    setMetadata(ids: PkType | PkType[], metadata: {}) {
        const meta = utils.ensureArray(ids).reduce((map, id) => ({ ...map, [id]: metadata }), {});

        this.state = tableState.merge(this.state, { meta });
    }

    getIndex(name: string, fk: string) {
        utils.ensureParamString("name", name);
        utils.ensureParamString("fk", fk);

        if (this.state.indexes[name] && this.state.indexes[name].values[fk])
            return this.state.indexes[name].values[fk];
        else
            return [];
    }

    insert(data: Values<R>, argument?: any) {
        return this._normalizedAction(
            data, this.insertNormalized, { normalizePKs: true, argument });
    }

    update(data: PartialValues<R>, argument?: any) {
        return this._normalizedAction(
            data, this.updateNormalized, { argument });
    }

    upsert(data: PartialValues<R>, argument?: any) {
        return this._normalizedAction(
            data, this.upsertNormalized, { normalizePKs: true, argument });
    }

    delete(data: PkType | PartialValue<R> | (PkType | PartialValue<R>)[]) {
        utils.ensureParam("data", data);

        const idsToDelete = utils.ensureArray(data).map(subject =>
            utils.isObject(subject)
                ? this.schema.ensurePrimaryKey(subject)
                : utils.ensureID(subject));

        if (!idsToDelete.length) return 0;

        this._deleteCascade(idsToDelete);

        const {
            deleted,
            state
        } = tableState.splice(this.state, idsToDelete);

        deleted.forEach(({ id, record }) =>
            this._cleanIndexes(id, record, state.indexes));

        this.dirty = true;
        this.state = state;

        return deleted.length;
    }

    deleteAll() {
        if (this.length) {
            this._deleteCascade(this.state.ids);
            this.state = initialState(this.schema.name);
        }
    }

    upsertNormalized(norm: TableState<ValueType<R>>) {
        utils.ensureParamObject("table", norm);

        const toUpdate = initialState<ValueType<R>>(this.schema.name);
        const toInsert = initialState<ValueType<R>>(this.schema.name);

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

    insertNormalized(table: TableState<ValueType<R>>, updateIndexes = true) {
        utils.ensureParamObject("table", table);

        this.state = tableState.merge(this.state, table);
        this.dirty = true;

        if (updateIndexes)
            this._updateIndexes(table);
    }

    updateNormalized(table: TableState<ValueType<R>>, updateIndexes = true) {
        utils.ensureParamObject("table", table);

        const byId = table.ids.reduce((map, id) => {
            if (!this.exists(id))
                throw new Error(errors.recordUpdateViolation(this.schema.name, id));

            const oldRecord = this.state.byId[id];
            const newRecord = this.schema.mergeRecord(oldRecord, table.byId[id]) as ValueType<R>;

            const isModified = this.schema.isModified(oldRecord, newRecord);

            if (isModified)
                if (map) map[id] = newRecord;
                else return { [id]: newRecord };

            return map;
        }, null as MapOf<any> | null);

        if (byId) {
            this.dirty = true;
            this.state = tableState.merge(this.state, { byId });

            if (updateIndexes)
                this._updateIndexes(table);
        }
    }

    normalize(data: PartialValues<R>, options?: NormalizeOptions): NormalizeContext {
        utils.ensureParam("data", data);
        const ctx = new NormalizeContext(this.schema, {
            table: this,
            normalizePKs: true,
            ...options
        });
        this.schema.normalize(data, ctx);
        return ctx;
    }

    private _normalizedAction(
        data: PartialValues<R>,
        action: (norm: TableState) => void,
        options: NormalizeOptions
    ) {
        utils.ensureParam("data", data);
        utils.ensureParamFunction("action", action);

        const ctx = this.normalize(data, options);

        const table = ctx.output[this.schema.name];
        if (table) action.call(this, table);
        this.session.upsert(ctx);
        return table.ids;
    }

    private _cleanIndexes(id: string, record: any, indexes: MapOf<TableIndex>) {
        const fks = this.schema.getForeignKeys(record);
        tableState.cleanIndexes(fks, id, indexes);
    }

    private _updateIndexes(table: TableState) {
        tableState.updateIndexes(this.schema.name, this.state, table);
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
