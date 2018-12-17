import { createFactory, Database, RecordModel } from "..";
import { initialState } from "../constants";
import { RecordModelFactory } from "../ModelFactory";

describe("RecordModelFactory", () => {

    class RecordBaseClass extends RecordModel<any> { }

    const modelFactory = createFactory();
    const recordFactory = new RecordModelFactory(RecordBaseClass, modelFactory);
    const table1 = "table1";

    const schema = {
        [table1]: {
            id: { pk: true }
        }
    };

    const db = new Database(schema, modelFactory);
    const state = initialState(table1);
    const table = db.selectTable(state, table1);

    describe("newRecordModel", () => {

        const record = recordFactory.newRecordModel("1", table);

        test("returns new model", () =>
            expect(record).toBeInstanceOf(RecordBaseClass));
    });
});
