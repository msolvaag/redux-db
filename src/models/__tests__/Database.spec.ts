// tslint:disable:object-literal-sort-keys
import { createFactory } from "../..";
import { initialState, TYPE_PK } from "../../constants";
import errors from "../../errors";
import { TableSchema } from "../../types";
import { isEqual } from "../../utils";
import Database from "../Database";
import DatabaseSession from "../DatabaseSession";
import TableModel from "../TableModel";

describe("constructor", () => {

    test("throws if no schema given", () => {
        const db = Database as any;
        expect(() => new db())
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if invalid schema given", () => {
        const db = Database as any;
        expect(() => new db([]))
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if no factory given", () => {
        const db = Database as any;
        expect(() => new db({}))
            .toThrow(errors.argument("factory", "object"));
    });

    test("creates table schemas", () => {
        const db = Database as any;
        const factory = createFactory();

        expect(new db({
            table1: {},
            table2: {}
        }, factory).tables).toHaveLength(2);
    });

    describe("with custom model factory", () => {
        const mockSchema = {
            connect: jest.fn()
        };
        const factory = createFactory({
            newTableSchema: jest.fn().mockReturnValue(mockSchema)
        });

        const db = new Database({ table1: {} }, factory);

        test("applies the custom factory", () =>
            expect(db.factory).toStrictEqual(factory));

        test("calls factory.newTableSchema", () =>
            expect(factory.newTableSchema).toHaveBeenCalled());

        test("calls connect on new table schema", () =>
            expect(mockSchema.connect).toHaveBeenCalled());
    });
});

describe("getNormalizer", () => {
    const normalizer = jest.fn((val: any) => val);
    const tableName = "test";
    const factory = createFactory();

    test("returns undefined as default", () =>
        expect(new Database({}, factory)
            .getRecordNormalizer(tableName)).toBeUndefined());

    test("returns general normalizer", () =>
        expect(new Database({}, factory, { onNormalize: normalizer })
            .getRecordNormalizer(tableName)).toStrictEqual(normalizer));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, factory, { onNormalize: { [tableName]: normalizer } })
            .getRecordNormalizer(tableName)).toStrictEqual(normalizer));
});

describe("getPkGenerator", () => {
    const generator = jest.fn((val: any) => val);
    const tableName = "test";
    const factory = createFactory();

    test("returns undefined as default", () =>
        expect(new Database({}, factory)
            .getPkGenerator(tableName)).toBeUndefined());

    test("returns general normalizer", () =>
        expect(new Database({}, factory, { onGeneratePK: generator })
            .getPkGenerator(tableName)).toStrictEqual(generator));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, factory, { onGeneratePK: { [tableName]: generator } })
            .getPkGenerator(tableName)).toStrictEqual(generator));
});

describe("getRecordComparer", () => {
    const comparer = jest.fn((val: any) => val);
    const tableName = "test";
    const factory = createFactory();

    test("returns isEqual as default", () =>
        expect(new Database({}, factory)
            .getRecordComparer(tableName)).toStrictEqual(isEqual));

    test("returns general normalizer", () =>
        expect(new Database({}, factory, { onRecordCompare: comparer })
            .getRecordComparer(tableName)).toStrictEqual(comparer));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, factory, { onRecordCompare: { [tableName]: comparer } })
            .getRecordComparer(tableName)).toStrictEqual(comparer));
});

describe("combineReducers", () => {
    const factory = createFactory();
    const db = new Database({}, factory);
    const reducer1 = jest.fn();
    const reducer2 = jest.fn();

    const reducer = db.combineReducers(
        reducer1,
        reducer2
    );

    test("returns a single reducer function", () =>
        expect(reducer).toBeInstanceOf(Function));

    describe("when returned reducer is invoked", () => {
        reducer({}, {});

        test("calls combined reducers", () => {
            expect(reducer1).toHaveBeenCalled();
            expect(reducer2).toHaveBeenCalled();
        });
    });
});

describe("reduce", () => {
    const factory = createFactory();
    const db = new Database({
        table1: { id: { type: TYPE_PK } },
        table2: {}
    }, factory);

    describe("when called without args", () => {
        const state = db.reduce();

        test("returns initial state", () =>
            expect(state).toEqual({
                table1: initialState("table1"),
                table2: initialState("table2")
            }));
    });

    describe("when called with args", () => {
        const action = { type: "ACTION" };
        const reducer = jest.fn(({ table1 }) => {
            table1.insert({ id: 1 });
        });

        test("invokes given reducers", () => {
            db.reduce({}, action, reducer);
            db.reduce({}, action, [reducer]);

            expect(reducer).toBeCalledTimes(2);
        });

        test("returns modified state", () => {
            const state = db.reduce({}, action, reducer);

            expect(state).not.toEqual({
                table1: initialState,
                table2: initialState
            });
        });
    });
});

describe("createSession", () => {
    const factory = createFactory();
    const db = new Database({}, factory);
    const session = db.createSession({});

    test("returns a immutable session instance", () =>
        expect(session).toBeInstanceOf(DatabaseSession));

    test("readOnly is false as default", () =>
        expect(session.readOnly).toEqual(false));

    test("options are propagated", () => {
        const options = { readOnly: true, tableSchemas: [] };
        const session = db.createSession({}, options);

        expect(session.readOnly).toEqual(options.readOnly);
        expect(session.tables).toEqual({});
    });
});

describe("wrapTables [selectTables]", () => {
    const factory = createFactory();
    const db = new Database({
        table1: { id: { type: TYPE_PK } },
        table2: {}
    }, factory);
    const state = db.reduce();
    const tables = db.wrapTables(state);

    test("returns an map of table models", () => {
        expect(tables.table1).toBeInstanceOf(TableModel);
        expect(tables.table2).toBeInstanceOf(TableModel);
    });

    test("tables are in readonly mode", () =>
        expect(() => tables.table1.insert({ id: 1 }))
            .toThrow(errors.sessionReadonly()));
});
