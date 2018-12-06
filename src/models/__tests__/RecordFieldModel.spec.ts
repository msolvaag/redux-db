import errors from "../../errors";
import RecordFieldModel from "../RecordFieldModel";

describe("constructor", () => {

    test("throws if no field schema given", () => {
        const field = RecordFieldModel as any;
        expect(() => new field())
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if invalid schema given", () => {
        const field = RecordFieldModel as any;
        expect(() => new field({}))
            .toThrow(errors.argument("schema.name", "string"));
    });

    test("throws if no record given", () => {
        const field = RecordFieldModel as any;
        expect(() => new field({ name: "test" }))
            .toThrow(errors.argument("record", "object"));
    });
});

describe("value", () => {
    const Model = RecordFieldModel as any;
    const fieldValue = "value";
    const fieldName = "test";
    const getRecordValue = jest.fn(d => d[fieldName]);
    const record = { test: fieldValue };

    const field = new Model({ name: fieldName, getRecordValue }, record);

    test("returns value of record field", () =>
        expect(field.value).toEqual(fieldValue));
    test("invokes schema getRecordValue", () =>
        expect(getRecordValue).toHaveBeenCalledWith(record));
});
