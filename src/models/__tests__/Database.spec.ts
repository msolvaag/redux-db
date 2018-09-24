// tslint:disable:object-literal-sort-keys
import { initialState, TYPE_PK } from "../../constants";
import errors from "../../errors";
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

    test("creates table schemas", () =>
        expect(new Database({
            table1: {},
            table2: {}
        }).tables).toHaveLength(2));

    describe("with custom model factory", () => {
        const mockSchema = {
            connect: jest.fn()
        };
        const factory = {
            newTableSchema: jest.fn().mockReturnValue(mockSchema),
            newTableModel: jest.fn(),
            newRecordModel: jest.fn(),
            newRecordSetModel: jest.fn()
        };

        const db = new Database({ table1: {} }, { factory });

        test("calls factory.newTableSchema", () =>
            expect(factory.newTableSchema).toHaveBeenCalled());

        test("calls connect on new table schema", () =>
            expect(mockSchema.connect).toHaveBeenCalled());
    });
});

describe("getNormalizer", () => {
    const normalizer = jest.fn((val: any) => val);
    const tableName = "test";

    test("returns undefined as default", () =>
        expect(new Database({})
            .getNormalizer(tableName)).toBeUndefined());

    test("returns general normalizer", () =>
        expect(new Database({}, { onNormalize: normalizer })
            .getNormalizer(tableName)).toStrictEqual(normalizer));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, { onNormalize: { [tableName]: normalizer } })
            .getNormalizer(tableName)).toStrictEqual(normalizer));
});

describe("getPkGenerator", () => {
    const generator = jest.fn((val: any) => val);
    const tableName = "test";

    test("returns undefined as default", () =>
        expect(new Database({})
            .getPkGenerator(tableName)).toBeUndefined());

    test("returns general normalizer", () =>
        expect(new Database({}, { onGeneratePK: generator })
            .getPkGenerator(tableName)).toStrictEqual(generator));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, { onGeneratePK: { [tableName]: generator } })
            .getPkGenerator(tableName)).toStrictEqual(generator));
});

describe("getRecordComparer", () => {
    const comparer = jest.fn((val: any) => val);
    const tableName = "test";

    test("returns isEqual as default", () =>
        expect(new Database({})
            .getRecordComparer(tableName)).toStrictEqual(isEqual));

    test("returns general normalizer", () =>
        expect(new Database({}, { onRecordCompare: comparer })
            .getRecordComparer(tableName)).toStrictEqual(comparer));

    test("returns normalizer specific to schema", () =>
        expect(new Database({}, { onRecordCompare: { [tableName]: comparer } })
            .getRecordComparer(tableName)).toStrictEqual(comparer));
});

describe("combineReducers", () => {
    const db = new Database({});
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
    const db = new Database({
        table1: { id: { type: TYPE_PK } },
        table2: {}
    });

    describe("when called without args", () => {
        const state = db.reduce();

        test("returns initial state", () =>
            expect(state).toEqual({
                table1: initialState(),
                table2: initialState()
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
    const db = new Database({});
    const session = db.createSession({});

    test("returns a immutable session instance", () =>
        expect(session).toBeInstanceOf(DatabaseSession));

    test("readOnly is false as default", () =>
        expect(session.options.readOnly).toEqual(false));

    test("options are propagated", () => {
        const options = { readOnly: true, tableSchemas: [] };
        expect(db.createSession({}, options).options).toEqual(options);
    });
});

describe("selectTables", () => {
    const db = new Database({
        table1: { id: { type: TYPE_PK } },
        table2: {}
    });
    const state = db.reduce();
    const tables = db.selectTables(state);

    test("returns an map of table models", () => {
        expect(tables.table1).toBeInstanceOf(TableModel);
        expect(tables.table2).toBeInstanceOf(TableModel);
    });

    test("tables are in readonly mode", () =>
        expect(() => tables.table1.insert({ id: 1 }))
            .toThrow(errors.sessionReadonly()));
});
