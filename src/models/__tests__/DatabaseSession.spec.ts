import { createFactory } from "../..";
import { initialState } from "../../constants";
import errors from "../../errors";
import Database from "../Database";
import DatabaseSession from "../DatabaseSession";
import DbNormalizeContext from "../NormalizeContext";

const TABLE1 = "TABLE1";
const TABLE2 = "TABLE2";

const schema = {
    [TABLE1]: {
        id: { pk: true }
    },
    [TABLE2]: {
        ref: { pk: true, references: TABLE1 }
    }
};

const factory = createFactory();

describe("constructor", () => {
    test("throws if no database instance given", () => {
        const model = DatabaseSession as any;
        expect(() => new model())
            .toThrow(errors.argument("db", "object"));
    });

    test("throws if no state given", () => {
        const model = DatabaseSession as any;
        expect(() => new model({}))
            .toThrow(errors.argument("state", "object"));
    });

    test("options.tableSchemas are applied", () => {
        const db = new Database(schema, factory);
        const tableSchemas = [db.getTableSchema(TABLE1)];
        const session = new DatabaseSession(db, {}, { tableSchemas });

        const table = session.getTable(TABLE1);

        expect(table.schema).toEqual(tableSchemas[0]);
    });

    test("options.readOnly is applied", () => {
        const db = new Database(schema, factory);
        const readOnly = true;
        const session = new DatabaseSession(db, {}, { readOnly });

        expect(session.readOnly).toEqual(readOnly);
    });
});

describe("upsert", () => {
    const db = new Database(schema, factory);
    const tableSchema = db.getTableSchema(TABLE1);
    const context = new DbNormalizeContext(tableSchema, false);

    test("throws if session is read only", () => {
        const session = new DatabaseSession(db, {}, { readOnly: true });

        expect(() => session.upsert(context))
            .toThrow(errors.sessionReadonly());
    });

    describe("context has tables in output", () => {
        const session = new DatabaseSession(db, {});
        const table1 = session.getTable(TABLE1);
        const table2 = session.getTable(TABLE2);

        beforeAll(() => {
            jest.spyOn(table1, "upsertNormalized");
            jest.spyOn(table2, "upsertNormalized");

            context.output = {
                TABLE1: initialState(TABLE1),
                TABLE2: initialState(TABLE2)
            };
            session.upsert(context);
        });

        test("calls upsertNormalized on tables", () => {
            expect(table2.upsertNormalized).toHaveBeenCalled();
        });

        test("does not call upsertNormalized on source table", () => {
            expect(table1.upsertNormalized).not.toHaveBeenCalled();
        });
    });

    describe("context has registered emits", () => {
        const session = new DatabaseSession(db, {});
        const table1 = session.getTable(TABLE1);
        const table2 = session.getTable(TABLE2);

        beforeAll(() => {
            jest.spyOn(table1, "upsert");
            jest.spyOn(table2, "upsert");

            context.emits = {
                TABLE1: [],
                TABLE2: []
            };
            session.upsert(context);
        });

        test("calls upsert on tables", () => {
            expect(table2.upsert).toHaveBeenCalled();
        });

        test("does not call upsert on source table", () => {
            expect(table1.upsert).not.toHaveBeenCalled();
        });
    });

    describe("commit", () => {
        const db = new Database(schema, factory);

        test("throws if session is read only", () => {
            const session = new DatabaseSession(db, {}, { readOnly: true });

            expect(() => session.commit())
                .toThrow(errors.sessionReadonly());
        });

        describe("session not modified", () => {
            const state = db.reduce();
            const session = new DatabaseSession(db, state);

            test("returns original state", () =>
                expect(session.commit()).toStrictEqual(state));
        });

        describe("session modified", () => {
            const state = db.reduce();
            const session = new DatabaseSession(db, state);

            const { [TABLE1]: table } = session.tables;
            const item = { id: 1 };
            table.insert(item);

            test("returns updated state", () => {
                const mutated = session.commit();
                expect(mutated).toEqual({
                    ...state,
                    [TABLE1]: table.state
                });

                expect(mutated[TABLE1].ids).toEqual(["1"]);
                expect(mutated[TABLE1].byId["1"]).toStrictEqual(item);
            });
        });
    });
});
