// tslint:disable:object-literal-sort-keys
// tslint:disable:no-empty
import { uniq } from "lodash";
import { initialState, TYPE_PK } from "../../constants";
import errors from "../../errors";
import { TableState } from "../../types";
import Database from "../Database";
import TableModel from "../TableModel";

const TABLE1 = "table1";
const invalidIds = [null, undefined, {}, [], NaN, Date, () => { }];
const mergeState = (...states: TableState[]) =>
    states.reduce(({ byId, ids, indexes, name }, s) => ({
        byId: {
            ...byId,
            ...s.byId
        },
        ids: uniq([...ids, ...s.ids]),
        indexes: {
            ...indexes,
            ...s.indexes
        },
        name
    }), initialState(TABLE1));

const createTable = (state: TableState = initialState(TABLE1)) => {
    const schema: any = {
        [TABLE1]: {
            id: { type: TYPE_PK }
        }
    };
    const tableState = mergeState({
        byId: {
            1: { data: "original" }
        },
        ids: ["1"],
        indexes: {},
        name: TABLE1
    }, state);

    const db = new Database(schema);
    const session = db.createSession({
        [TABLE1]: tableState,
    });
    const tableSchema = db.getTableSchema(TABLE1);

    return new TableModel(session, tableSchema, tableState) as any;
};

describe("constructor", () => {

    test("throws if no session given", () => {
        const model = TableModel as any;
        expect(() => new model())
            .toThrow(errors.argument("session", "object"));
    });

    test("throws if no schema given", () => {
        const model = TableModel as any;
        expect(() => new model({}))
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if invalid state given", () => {
        const model = TableModel as any;
        expect(() => new model({}, {}, 1))
            .toThrow(errors.argument("state", "object"));

        const name = "test";
        expect(() => new model({}, { name }, {}))
            .toThrow(errors.tableInvalidState(name));
    });
});

describe("length", () => {
    const session: any = {};
    const schema: any = {};
    const state: any = {
        byId: {},
        ids: ["1", "2", "3"],
        indexes: {}
    };
    const table = new TableModel(session, schema, state);
    test("returns number of records in table", () =>
        expect(table.length).toEqual(3));
});

describe("all", () => {
    const record = {};
    const factory = {
        newRecordModel: jest.fn().mockReturnValue(record)
    };
    const session: any = {};
    const schema: any = { db: { factory } };
    const state: any = {
        byId: {},
        ids: ["1", "2", "3"],
        indexes: {}
    };
    const table = new TableModel(session, schema, state);
    test("returns an array of all records in table", () =>
        expect(table.all()).toEqual([
            record, record, record
        ]));
});

describe("values", () => {
    const record = {};
    const session: any = {};
    const schema: any = {};
    const state: any = {
        byId: { 1: record, 2: record, 3: record },
        ids: ["1", "2", "3"],
        indexes: {}
    };
    const table = new TableModel(session, schema, state);
    test("returns an array of all record values in table", () =>
        expect(table.values()).toEqual([
            record, record, record
        ]));
});

describe("exists", () => {
    const record = {};
    const session: any = {};
    const schema: any = {};
    const state: any = {
        byId: { 1: record, 2: record, 3: record },
        ids: ["1", "2", "3"],
        indexes: {}
    };
    const table: any = new TableModel(session, schema, state);
    test("returns true if record exists in table", () =>
        expect(table.exists(1)).toEqual(true));
    test("returns false if record doesn't exist in table", () =>
        expect(table.exists(0)).toEqual(false));
    test("returns false if invalid id given", () =>
        invalidIds.forEach(id =>
            expect(table.exists(id)).toEqual(false)));
});

describe("get", () => {
    const record = {};
    const factory = {
        newRecordModel: jest.fn().mockReturnValue(record)
    };
    const session: any = {};
    const name = "table";
    const schema: any = { name, db: { factory } };
    const state: any = {
        byId: { 1: record, 2: record, 3: record },
        ids: ["1", "2", "3"],
        indexes: {}
    };
    const table: any = new TableModel(session, schema, state);
    test("returns a single record id", () =>
        expect(table.get(1)).toEqual(record));
    test("returns undefined if not in table", () =>
        expect(table.get(0)).toBeUndefined());
    test("returns undefined if invalid id given", () =>
        invalidIds.forEach(id =>
            expect(table.get(id)).toBeUndefined()));
});

describe("getValue", () => {
    const value = {};
    const session: any = {};
    const schema: any = {};
    const state = {
        byId: { 1: value, 2: value },
        ids: ["1", "2"],
        indexes: {}
    };
    const table: any = new TableModel(session, schema, state);
    test("returns the value of a single record by id", () =>
        expect(table.getValue(1)).toEqual(value));
    test("returns undefined if not in table", () =>
        expect(table.getValue(0)).toBeUndefined());
    test("returns undefined if invalid id given", () =>
        invalidIds.forEach(id =>
            expect(table.getValue(id)).toBeUndefined()));
});

describe("getIndex", () => {
    const value = {};
    const session: any = {};
    const schema: any = {};
    const name = "table";
    const fk = "fkey";
    const index = ["1", "2", "3"];
    const state = {
        byId: { 1: value, 2: value },
        ids: ["1", "2"],
        indexes: {
            [name]: {
                values: {
                    [fk]: index
                },
                unique: false
            }
        }
    };
    const table: any = new TableModel(session, schema, state);
    test("throws if missing args", () => {
        expect(() => table.getIndex()).toThrow(errors.argument("name", "string"));
        expect(() => table.getIndex(name)).toThrow(errors.argument("fk", "string"));
    });
    test("returns the index for a foreign key", () =>
        expect(table.getIndex(name, fk)).toEqual(index));
    test("returns empty array if no matching index", () => {
        expect(table.getIndex("unknown", fk)).toEqual([]);
        expect(table.getIndex(name, "unknown")).toEqual([]);
    });
});

describe("insert", () => {
    const table = createTable();

    test("throws if no data given", () =>
        expect(() => table.insert()).toThrow(errors.argument("data", "value")));
    test("throws if invalid data given", () =>
        [1, NaN, "", {}, () => { }].forEach(data =>
            expect(() => table.insert(data)).toThrow()));
    test("does not throw if empty array given", () =>
        expect(() => table.insert([])).not.toThrow());

    describe("with valid data", () => {
        const id = "2";
        const value = { id, data: {} };
        const insertedState = {
            byId: { [id]: value },
            ids: [id],
            indexes: {},
            name: TABLE1
        };
        let inserted: any;

        beforeAll(() => {
            jest.spyOn(table, "insertNormalized");
            jest.spyOn(table.schema, "normalize");
            jest.spyOn(table.session, "upsert");

            inserted = table.insert(value);
        });

        test("calls schema.normalize", () =>
            expect(table.schema.normalize).toHaveBeenCalledTimes(1));

        test("calls insertNormalized with normalized data", () =>
            expect(table.insertNormalized).toHaveBeenCalledWith(insertedState));

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of inserted records", () => {
            expect(inserted[0]).toEqual(id);
            expect(inserted.length).toEqual(1);
        });

        test("table state is mutated", () =>
            expect(table.state).toEqual(mergeState(table.state, insertedState)));
    });

    describe("with existing data", () => {

        test("throws", () =>
            expect(() => table.insert({ id: 1 }))
                .toThrow(errors.uniqueConstraintViolation("1")));
    });
});

describe("update", () => {
    const table = createTable();

    test("throws if no data given", () =>
        expect(() => table.update()).toThrow(errors.argument("data", "value")));
    test("throws if invalid data given", () =>
        [1, NaN, "", {}, () => { }].forEach(data =>
            expect(() => table.update(data)).toThrow()));
    test("does not throw if empty array given", () =>
        expect(() => table.update([])).not.toThrow());

    describe("with valid data", () => {
        const id = "1";
        const value = { id, data: "updated" };
        const updatedState = {
            byId: { [id]: value },
            ids: [id],
            indexes: {},
            name: TABLE1
        };
        let updated: any;

        beforeAll(() => {
            jest.spyOn(table, "updateNormalized");
            jest.spyOn(table.schema, "normalize");
            jest.spyOn(table.session, "upsert");

            updated = table.update(value);
        });

        test("calls schema.normalize", () =>
            expect(table.schema.normalize).toHaveBeenCalledTimes(1));

        test("calls updateNormalized with normalized data", () => {
            expect(table.updateNormalized).toHaveBeenCalledWith(updatedState);
        });

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of updated records", () => {
            expect(updated[0]).toEqual(id);
            expect(updated.length).toEqual(1);
        });

        test("table state is mutated", () =>
            expect(table.state).toEqual(mergeState(table.state, updatedState)));
    });
});

describe("upsert", () => {
    const table = createTable();

    test("throws if no data given", () =>
        expect(() => table.upsert()).toThrow(errors.argument("data", "value")));
    test("throws if invalid data given", () =>
        [1, NaN, "", {}, () => { }].forEach(data =>
            expect(() => table.upsert(data)).toThrow()));
    test("does not throw if empty array given", () =>
        expect(() => table.upsert([])).not.toThrow());

    describe("with valid data", () => {
        const id1 = "1";
        const id2 = "2";
        const toUpdate = { id: id1, data: "updated" };
        const toInsert = { id: id2, data: "new" };
        const updatedState = {
            byId: { [id1]: toUpdate },
            ids: [id1],
            indexes: {},
            name: TABLE1
        };
        const insertedState = {
            byId: { [id2]: toInsert },
            ids: [id2],
            indexes: {},
            name: TABLE1
        };
        let upserted: any;

        beforeAll(() => {
            jest.spyOn(table, "insertNormalized");
            jest.spyOn(table, "updateNormalized");
            jest.spyOn(table.schema, "normalize");
            jest.spyOn(table.session, "upsert");

            upserted = table.upsert([toInsert, toUpdate]);
        });

        test("calls schema.normalize", () =>
            expect(table.schema.normalize).toHaveBeenCalledTimes(1));

        test("calls updateNormalized with normalized data", () => {
            expect(table.updateNormalized).toHaveBeenCalledWith(updatedState, false);
        });

        test("calls insertNormalized with normalized data", () => {
            expect(table.insertNormalized).toHaveBeenCalledWith(insertedState, false);
        });

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of upserted records", () => {
            expect(upserted[0]).toEqual(id2);
            expect(upserted[1]).toEqual(id1);

            expect(upserted.length).toEqual(2);
        });

        test("table state is mutated", () =>
            expect(table.state).toEqual(mergeState(updatedState, insertedState)));
    });
});

describe("delete", () => {
    const state = {
        byId: { 3: { data: "last" } },
        ids: ["3"],
        indexes: {},
        name: TABLE1
    };
    const table = createTable(state);

    test("throws if no data given", () =>
        expect(() => table.delete()).toThrow(errors.argument("data", "value")));
    test("throws if invalid data given", () =>
        [{}, () => { }, false, "", NaN].forEach(data =>
            expect(() => table.delete(data)).toThrow()));
    test("returns zero for unknown id", () =>
        expect(table.delete(0)).toEqual(0));
    test("returns zero for empty data", () =>
        [[]].forEach(data =>
            expect(table.delete(data)).toEqual(0)));

    describe("with valid data", () => {
        const result = table.delete(1);

        test("returns number of deleted", () =>
            expect(result).toEqual(1));
        test("table state is mutated", () =>
            expect(table.state).toEqual(state));
    });
});

describe("deleteAll", () => {
    const state = {
        byId: { 3: { data: "last" } },
        ids: ["3"],
        indexes: {},
        name: TABLE1
    };
    const table = createTable(state);
    table.deleteAll();

    test("table state is cleared", () =>
        expect(table.state).toEqual(initialState(TABLE1)));
});
