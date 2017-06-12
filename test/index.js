var test = require('tape');
var reduxDB = require("../src/cjs");

let state = {};
const db = reduxDB.createDatabase("db", {
    "testTable": {
        "id": { constraint: "PK" },
        "modified": { type: "MODIFIED" }
    },
    "testRef": {
        "id": { constraint: "PK" },
        "test": { constraint: "FK", references: "testTable", relationName: "refs" }
    }
});

test('insert record', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.insert(
        { id: 1, name: "test", modified: "1234" }
    );

    state = session.commit();
    const newTableState = state["testTable"];

    t.deepEqual(newTableState.ids, ["1"], "State ids array is updated");
    t.deepEqual(newTableState.byId["1"], { id: 1, name: "test", modified: "1234" }, "State is updated with the inserted data");
});


test('update record', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.update(
        { id: 1, name: "test updated", modified: "12345" }
    );

    state = session.commit();
    const newTableState = state["testTable"];

    t.deepEqual(newTableState.ids, ["1"], "State ids array is not updated");
    t.deepEqual(newTableState.byId["1"], { id: 1, name: "test updated", modified: "12345" }, "State is updated with the given data");
});

test('update non-modified record', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.update(
        { id: 1, name: "test updated", modified: "12345" }
    );

    const newState = session.commit();
    t.equal(state, newState, "State remains unmodified when applying update with same data");
});

test('insert nested data', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.insert({
        id: 2, name: "test nested", modified: "1", refs: [
            { id: 1, test: 2, prop: "val" }
        ]
    });

    t.assert(recordModel.refs, "Foreign relations are reflected through properties");
});