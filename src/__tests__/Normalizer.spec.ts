import { createDatabase } from "..";
import errors from "../errors";
import DbNormalizeContext from "../models/NormalizeContext";
import SchemaNormalizer from "../Normalizer";

describe("Constructor", () => {

    test("throws if no schema given", () => {
        const Normalizer = SchemaNormalizer as any;
        expect(() => new Normalizer())
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if invalid schema given", () => {
        const Normalizer = SchemaNormalizer as any;
        expect(() => new Normalizer({}))
            .toThrow(errors.argumentShape("schema", ["db"]));
    });
});

describe("normalize", () => {

    const TABLE1 = "TABLE1";
    const TABLE2 = "TABLE2";

    const schema = {
        [TABLE1]: {
            pkField: { pk: true, fieldName: "id" }
        },
        [TABLE2]: {
            id: { pk: true },
            fkField: { references: TABLE1, relationName: "entries" }
        }
    };

    const db = createDatabase(schema);
    const tableSchema = db.getTableSchema(TABLE1);

    const normalizer = new SchemaNormalizer(tableSchema);
    const context = new DbNormalizeContext(tableSchema, {
        normalizePKs: false
    });

    const entry1 = { id: 1, value: "e1" };
    const entry2 = { id: 2, value: "e2" };
    normalizer.normalize({
        id: 1,
        body: "data",
        entries: [
            entry1,
            entry2
        ]
    }, context);

    test("normalizes given data", () => {
        expect(context.output[TABLE1].byId).toEqual({
            1: { id: 1, body: "data" }
        });
        expect(context.output[TABLE2].byId).toEqual({
            [entry1.id]: { ...entry1, fkField: "1" },
            [entry2.id]: { ...entry2, fkField: "1" }
        });
    });
});
