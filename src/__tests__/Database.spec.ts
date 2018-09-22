// tslint:disable:object-literal-sort-keys

import { TYPE_PK } from "../constants";
import Database from "../Database";

describe("constructor", () => {

    test("throws if no schema given", () => {
        const db = Database as any;
        expect(() => new db()).toThrow();
    });

    test("throws if invalid schema given", () => {
        const db = Database as any;
        expect(() => new db([])).toThrow();
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

    const db = new Database({
        [tableName]: { id: { type: TYPE_PK } }
    }, { onNormalize: { [tableName]: normalizer } });

    const state = db.reduce();
    const { [tableName]: table } = db.createSession(state).tables;

    table.insert({ id: 1 });

    test("custom normalizer called", () =>
        expect(normalizer).toHaveBeenCalled());

});
