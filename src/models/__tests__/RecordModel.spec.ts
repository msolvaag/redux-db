import errors from "../../errors";
import RecordModel from "../RecordModel";

describe("constructor", () => {

    test("throws if no id given", () => {
        const field = RecordModel as any;
        expect(() => new field())
            .toThrow(errors.argument("id", "string"));
    });

    test("throws if no table schema given", () => {
        const field = RecordModel as any;
        expect(() => new field("1"))
            .toThrow(errors.argument("table", "object"));
    });
});

describe("value", () => {
    const Model = RecordModel as any;
    const id = "1";
    const value = { test: "test" };

    describe("get", () => {
        const values: Record<string, any> = {
            [id]: value
        };
        const getValue = jest.fn(d => values[d]);
        const model = new Model(id, { getValue });

        test("returns value of record", () =>
            expect(model.value).toEqual(value));
        test("invokes table.getValue", () =>
            expect(getValue).toHaveBeenCalledWith(id));
        test("returns empty object if not found", () => {
            const unknown = new Model("0", { getValue });
            expect(unknown.value).toEqual({});
        });
    });

    describe("set", () => {
        const values: Record<string, any> = {
            [id]: value
        };
        const getValue = jest.fn(d => values[d]);
        const update = jest.fn(data => values[data.id] = data);
        const injectKeys = jest.fn((data, r) => data.id = r.id);
        const model = new Model(id, { getValue, update, schema: { injectKeys } });
        const newValue = { test: "new" };

        model.value = newValue;

        test("updates value of record", () =>
            expect(model.value).toEqual(newValue));
        test("invokes table.schema.injectKeys", () =>
            expect(injectKeys).toHaveBeenCalledWith(newValue, model));
        test("invokes table.update", () =>
            expect(update).toHaveBeenCalledWith(newValue));
    });
});

describe("delete", () => {
    const Model = RecordModel as any;

    const deleteFn = jest.fn();
    const id = "1";
    const model = new Model(id, { delete: deleteFn });

    model.delete();

    test("invokes table.delete", () =>
        expect(deleteFn).toHaveBeenCalledWith(id));
});

describe("update", () => {
    const Model = RecordModel as any;
    const id = "1";
    const value = { test: "test" };
    const values: Record<string, any> = {
        [id]: value
    };
    const getValue = jest.fn(d => values[d]);
    const update = jest.fn(data => values[data.id] = data);
    const injectKeys = jest.fn((data, r) => data.id = r.id);
    const model = new Model(id, { getValue, update, schema: { injectKeys } });
    const newValue = { test: "new" };

    model.update(newValue);

    test("updates value of record", () =>
        expect(model.value).toEqual(newValue));
    test("invokes table.schema.injectKeys", () =>
        expect(injectKeys).toHaveBeenCalledWith(newValue, model));
    test("invokes table.update", () =>
        expect(update).toHaveBeenCalledWith(newValue));
});
