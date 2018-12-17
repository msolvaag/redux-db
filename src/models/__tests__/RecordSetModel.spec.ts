import errors from "../../errors";
import RecordSetModel from "../RecordSetModel";

const Model = RecordSetModel as any;

describe("constructor", () => {

    test("throws if no table given", () => {
        expect(() => new Model())
            .toThrow(errors.argument("table", "object"));
    });

    test("throws if no field schema given", () => {
        expect(() => new Model({}))
            .toThrow(errors.argument("schema", "object"));
    });

    test("throws if no owner given", () => {
        expect(() => new Model({}, {}))
            .toThrow(errors.argument("owner", "object"));
    });

    test("throws if invalid owner given", () => {
        expect(() => new Model({}, {}, {}))
            .toThrow(errors.argumentShape("owner", ["id"]));
    });
});

describe("ids", () => {
    const ids = ["2", "3"];
    const table = { getIndex: jest.fn(() => ids) };
    const fieldSchema = { name: "field" };
    const owner = { id: "1" };

    const model = new Model(table, fieldSchema, owner);

    test("returns an array of ids included in set", () =>
        expect(model.ids).toEqual(ids));
    test("invokes table.getIndex", () =>
        expect(table.getIndex).toHaveBeenCalledWith(fieldSchema.name, owner.id));
});

describe("length", () => {
    const ids = ["2", "3"];

    const model = new Model({
        getIndex: () => ids
    }, {}, { id: "1" });

    test("returns the number of ids in set", () =>
        expect(model.length).toEqual(ids.length));
});

describe("all()", () => {
    const ids = ["2", "3"];
    const model = new Model({
        getIndex: () => ids,
        get: jest.fn((id) => ({ id }))
    }, {}, { id: "1" });

    test("returns all records in set", () =>
        expect(model.all()).toEqual(ids.map(id => ({ id }))));
});

describe("values()", () => {
    const ids = ["2", "3"];
    const model = new Model({
        getIndex: () => ids,
        getValue: (id: any) => ({ id })
    }, {}, { id: "1" });

    test("returns all record values in set", () =>
        expect(model.values()).toEqual(ids.map(id => ({ id }))));
});
