import { createDatabase } from "../..";
import errors from "../../errors";
import NormalizeContext from "../NormalizeContext";

const TABLE1 = "TABLE1";
const TABLE2 = "TABLE2";
const TABLE3 = "TABLE3";

describe("constructor", () => {

    test("throws if no schema given", () => {
        const context = NormalizeContext as any;
        expect(() => new context())
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if invalid schema given", () => {
        const context = NormalizeContext as any;
        expect(() => new context({}))
            .toThrow(errors.argumentShape("schema", ["db"]));
    });

    test("normalizePKs is set", () => {
        const db = createDatabase({ [TABLE1]: {} });
        const table = db.getTableSchema(TABLE1);
        const normalizePKs = true;

        const context = new NormalizeContext(table, normalizePKs);
        expect(context.normalizePKs).toEqual(normalizePKs);
    });
});

describe("emit", () => {
    const db = createDatabase({ [TABLE1]: {} });
    const table = db.getTableSchema(TABLE1);
    const normalizePKs = true;

    const context = new NormalizeContext(table, normalizePKs);
    const record1 = { data: "test1" };
    const record2 = { data: "test2" };

    context.emit(TABLE2, record1);
    context.emit(TABLE2, record2);
    context.emit(TABLE3, record2);

    test("registers emitted records by table name", () => {
        expect(context.emits).toEqual({
            [TABLE2]: [record1, record2],
            [TABLE3]: [record2]
        });
    });
});
