import { initialState } from "../constants";
import errors from "../errors";
import {
    MapOf,
    PartialValue,
    PartialValues,
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
import tableState from "./TableState";

export default class TableModel<R extends TableRecord> implements Table<R> {
    readonly session: Session;
    readonly schema: TableSchema;
    state: TableState<ValueType<R>>;
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

    insert(data: Values<R>) {
        return this._normalizedAction(data, this.insertNormalized, true);
    }

    update(data: PartialValues<R>) {
        return this._normalizedAction(data, this.updateNormalized, false);
    }

    upsert(data: PartialValues<R>) {
        return this._normalizedAction(data, this.upsertNormalized, true);
    }

    delete(data: string | number | PartialValue<R> | (string | number | PartialValue<R>)[]) {
        utils.ensureParam("data", data);

        const idsToDelete = utils.ensureArray(data).map(subject =>
            utils.isObject(subject)
                ? this.schema.getPrimaryKey(subject)
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
            this.state = initialState();
        }
    }

    upsertNormalized(norm: TableState<ValueType<R>>) {
        utils.ensureParamObject("table", norm);

        const toUpdate = initialState<ValueType<R>>();
        const toInsert = initialState<ValueType<R>>();

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

            const oldRecord = this.state.byId[id] as {};
            const newRecord = { ...oldRecord, ...table.byId[id] as {} } as ValueType<R>;

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

    private _normalizedAction(
        data: PartialValues<R>,
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
