// tslint:disable:object-literal-sort-keys
// tslint:disable:no-empty
import { uniq } from "lodash";
import { createDatabase } from "../..";
import { initialState, TYPE_PK } from "../../constants";
import errors from "../../errors";
import { TableState } from "../../types";
import Database from "../Database";
import FieldSchemaModel from "../FieldSchemaModel";
import DbNormalizeContext from "../NormalizeContext";
import TableSchemaModel from "../TableSchemaModel";

const TABLE1 = "TABLE1";
const TABLE2 = "TABLE2";

const schema = {
    [TABLE1]: {
        pkField: { pk: true }
    },
    [TABLE2]: {
        fkField: { references: TABLE1 }
    }
};

describe("constructor", () => {

    test("throws if no db instance given", () => {
        const model = TableSchemaModel as any;
        expect(() => new model())
            .toThrow(errors.argument("db", "object"));
    });

    test("throws if no name given", () => {
        const model = TableSchemaModel as any;
        expect(() => new model({}))
            .toThrow(errors.argument("name", "string"));
    });

    test("throws if no definition given", () => {
        const model = TableSchemaModel as any;
        expect(() => new model({}, "test"))
            .toThrow(errors.argument("definition", "object"));
    });

    test("creates fields array", () => {
        const db = createDatabase(schema);
        const tableSchema = schema[TABLE1];
        const model = new TableSchemaModel(db, TABLE1, tableSchema);

        expect(model.fields.length).toEqual(Object.keys(tableSchema).length);
        model.fields.forEach(field =>
            expect(field).toBeInstanceOf(FieldSchemaModel));
    });

    test("creates normalizer", () => {
        const newSchemaNormalizer = jest.fn();
        const db = createDatabase(schema, {
            factory: {
                newSchemaNormalizer
            }
        });
        const tableSchema = schema[TABLE1];
        const model = new TableSchemaModel(db, TABLE1, tableSchema);

        expect(newSchemaNormalizer).toHaveBeenCalledWith(model);
    });
});

describe("connect", () => {
    const db = createDatabase(schema);
    const tableSchema = schema[TABLE1];
    const model = new TableSchemaModel(db, TABLE1, tableSchema);

    const fieldConnect = jest.fn();
    beforeAll(() => {
        jest.spyOn(FieldSchemaModel.prototype, "connect")
            .mockImplementation(fieldConnect);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    test("throws if no schema given", () =>
        expect(() => (model as any).connect())
            .toThrow(errors.argument("tableMap", "object")));

    test("populates relations with foreign table fields", () => {
        model.connect(db.tableMap);

        const refTable = db.getTableSchema(TABLE2);

        expect(model.relations).toEqual([
            refTable.fields[0]
        ]);
    });

    test("invokes connect on foreign key fields", () => {
        const refModel = new TableSchemaModel(db, TABLE2, schema[TABLE2]);

        refModel.connect(db.tableMap);

        expect(fieldConnect).toHaveBeenCalledWith(db.tableMap);
    });
});

describe("normalize", () => {
    const db = createDatabase(schema);
    const tableSchema = schema[TABLE1];
    const model = new TableSchemaModel(db, TABLE1, tableSchema);

    const invalidData = [
        ["undefined", undefined],
        ["string", ""],
        ["null", null],
        ["number", 1234],
        ["NaN", NaN],
        ["Date", new Date()],
        // tslint:disable-next-line:no-construct
        ["Number", new Number(1)],
        // tslint:disable-next-line:no-construct
        ["String", new String("123")]
    ];

    test.each(invalidData)("throws if invoked with invalid data: %s", (type, data) => {
        expect(() => (model as any).normalize(data))
            .toThrow(errors.normalizeInvalidData());
        expect(() => (model as any).normalize([data], { output: {} }))
            .toThrow(errors.normalizeInvalidData());
    });

    test("throws if no context given", () => {
        expect(() => (model as any).normalize({}))
            .toThrow(errors.argument("context", "object"));
    });

    test("throws if invalid context given", () => {
        expect(() => (model as any).normalize({}, {}))
            .toThrow(errors.argument("context.output", "object"));
    });

    test("throws if no primary key found", () => {
        const context = new DbNormalizeContext(model, true);

        expect(() => model.normalize({}, context))
            .toThrow(errors.normalizePk(TABLE1));
    });

    describe("single record", () => {
        test("normalizes given data", () => {
            const pk = "123";
            const data = { pkField: pk };
            const context = new DbNormalizeContext(model, true);
            model.normalize(data, context);

            expect(context.output).toEqual({
                [TABLE1]: {
                    ...initialState(TABLE1),
                    ids: [pk],
                    byId: {
                        [pk]: data
                    }
                }
            });
        });
    });
});
