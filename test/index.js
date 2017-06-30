var test = require('tape');
var reduxDB = require("../src/cjs");

let state = {};
const blogPosts = [
    {
        id: "post1",
        author: { username: "user1", name: "User 1" },
        body: "......",
        comments: [
            {
                id: "comment1",
                author: { username: "user2", name: "User 2" },
                comment: ".....",
            },
            {
                id: "comment2",
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            }
        ]
    },
    {
        id: "post2",
        author: { username: "user2", name: "User 2" },
        body: "......",
        comments: [
            {
                id: "comment3",
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            },
            {
                id: "comment4",
                author: { username: "user1", name: "User 1" },
                comment: ".....",
            },
            {
                id: "comment5",
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            }
        ]
    }
];

const schema = {
    User: {
        username: { type: "PK" }
    },
    BlogPost: {
        id: { type: "PK" },
        author: { type: "FK", references: "User", relationName: "posts" }
    },
    Comment: {
        id: { type: "PK" },
        post: { type: "FK", references: "BlogPost", relationName: "comments" },
        author: { type: "FK", references: "User", relationName: "comments" }
    }
};

const db = reduxDB.createDatabase(schema);

test('insert records', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.insertMany( blogPosts );

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.ids, ["post1","post2"], "State ids array is updated");
    t.deepEqual(newTableState.byId["post1"], { id: "post1", body: "......", author: "user1" }, "State is updated with the inserted data");
});
/*
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
        id: 2, name: "test nested", modified: "1", refs: [1]
    });

    t.assert(recordModel.refs.length === 1, "Foreign relations are reflected through properties");
});

test('add/remove record relation', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.get(1);

    recordModel.refs.add(1);
    t.assert(recordModel.refs.length === 1, "Added relation is reflected immediatly");

    recordModel.refs.remove(1);
    t.assert(recordModel.refs.length === 0, "Removed relation is reflected immediatly");
});

test('computed property', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { testTable } = session.tables;
    const recordModel = testTable.get(1);

    t.equal(recordModel.computed.value, "1test", "computed property exists");
});*/