import { createDatabase } from "..";
import ExtendedTableModel from "../ExtendedTableModel";

const TABLE = "table";
const TABLE2 = "refTable";
const db = createDatabase({
    [TABLE]: {
        id: { pk: true },
        ref: { references: TABLE2, relationName: "refs" }
    },
    [TABLE2]: { id: { pk: true } }
});

const items = [
    { id: 1, ref: 1 },
    { id: 2, ref: 3 },
    { id: 3, ref: 2 },
    { id: 4, ref: 2 }
];

const refs = [
    { id: 1 },
    { id: 2 },
    { id: 3 }
];

const createModel = () => {
    const schema = db.getTableSchema(TABLE);
    const session = db.createSession();
    const {
        [TABLE]: { state },
        [TABLE2]: RefTable
    } = session.tables;

    RefTable.insert(refs);

    const model = new ExtendedTableModel(session, schema, state);
    model.insert(items);
    return model;
};

describe("getMany", () => {
    const model = createModel();
    const list = model.getMany(items.map(({ id }) => id));

    test("returns an array of table records", () =>
        expect(list.map(item => item.value)).toEqual(items));
});

describe("getByFk", () => {
    const model = createModel();

    const fkid = 2;
    const set = model.getByFk("ref", fkid);

    test("returns a set of matching records", () =>
        expect(set.values()).toEqual(items.filter(({ ref }) => ref === fkid)));

});

describe("getFieldValue", () => {
    const model = createModel();

    const [item] = items;
    const value = model.getFieldValue(item.id, "ref");

    test("returns value of field", () =>
        expect(value).toEqual(item.ref));
});
