// tslint:disable:object-literal-sort-keys
// tslint:disable:no-empty

import { TYPE_PK } from "../../constants";
import errors from "../../errors";
import Database from "../Database";
import RecordModel from "../RecordModel";
import TableModel from "../TableModel";

const invalidIds = [null, undefined, {}, [], NaN, Date, () => { }];

const createTable = () => {
    const tableName = "table";
    const schema: any = {
        [tableName]: { id: { type: TYPE_PK } }
    };
    const tableState = {
        byId: { 1: { data: "original" } },
        ids: ["1"],
        indexes: {}
    };
    const db = new Database(schema);
    const session = db.createSession({
        [tableName]: tableState
    });
    const [tableSchema] = db.tables;

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
        expect(() => new model({}, {}, null))
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
        let inserted: any;

        beforeAll(() => {
            jest.spyOn(table, "insertNormalized");
            jest.spyOn(table.schema, "normalize");
            jest.spyOn(table.session, "upsert");

            inserted = table.insert(value);
        });

        test("calls schema.normalize", () =>
            expect(table.schema.normalize).toHaveBeenCalledTimes(1));

        test("calls insertNormalized with normalized data", () => {
            expect(table.insertNormalized).toHaveBeenCalledWith({
                byId: { [id]: value },
                ids: [id],
                indexes: {}
            });
        });

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of inserted records", () => {
            expect(inserted[0]).toEqual(id);
            expect(inserted.length).toEqual(1);
        });
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
            expect(table.updateNormalized).toHaveBeenCalledWith({
                byId: { [id]: value },
                ids: [id],
                indexes: {}
            });
        });

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of updated records", () => {
            expect(updated[0]).toEqual(id);
            expect(updated.length).toEqual(1);
        });
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
            expect(table.updateNormalized).toHaveBeenCalledWith({
                byId: { [id1]: toUpdate },
                ids: [id1],
                indexes: {}
            }, false);
        });

        test("calls insertNormalized with normalized data", () => {
            expect(table.insertNormalized).toHaveBeenCalledWith({
                byId: { [id2]: toInsert },
                ids: [id2],
                indexes: {}
            }, false);
        });

        test("calls session upsert", () =>
            expect(table.session.upsert).toHaveBeenCalledTimes(1));

        test("returns an array of upserted records", () => {
            expect(upserted[0]).toEqual(id2);
            expect(upserted[1]).toEqual(id1);

            expect(upserted.length).toEqual(2);
        });
    });
});

describe("delete", () => {
    const table = createTable();

    test("throws if no data given", () =>
        expect(() => table.delete()).toThrow(errors.argument("data", "value")));
    test("throws if invalid data given", () =>
        [{}, () => { }].forEach(data =>
            expect(() => table.delete(data)).toThrow()));
    test("returns zero for unknown id", () =>
        expect(table.delete(0)).toEqual(0));

    describe("with valid data", () => {

        const result = table.delete(1);

        test("returns number of deleted", () =>
            expect(result).toEqual(1));
    });
});
