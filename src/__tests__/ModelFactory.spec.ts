import { createFactory, Database, RecordModel } from "..";
import { initialState } from "../constants";
import * as ModelFactory from "../ModelFactory";

describe("RecordModelFactory", () => {

    jest.spyOn(ModelFactory, "createRecordModelClass");

    class RecordBaseClass extends RecordModel<any> { }

    const modelFactory = createFactory();
    const recordFactory = new ModelFactory.RecordModelFactory(RecordBaseClass, modelFactory);
    const TABLE1 = "table1";
    const TABLE2 = "table2";

    const schema = {
        [TABLE1]: {
            id: { pk: true }
        },
        [TABLE2]: {
            id: { pk: true },
            fk: { references: TABLE1, relationName: "refs" }
        }
    };

    const db = new Database(schema, modelFactory);
    const state = db.reduce();
    const { [TABLE1]: Table1, [TABLE2]: Table2 } = db.selectTables(state);

    describe("newRecordModel", () => {

        const record1 = recordFactory.newRecordModel("1", Table1);
        const record2 = recordFactory.newRecordModel("2", Table1);

        test("returns new model", () =>
            expect(record1).toBeInstanceOf(RecordBaseClass));

        test("class is cached", () =>
            expect(ModelFactory.createRecordModelClass).toHaveBeenCalledTimes(1));
    });
});
