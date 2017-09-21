var test = require('tape');
var reduxDB = require("../src/cjs");

let state = {};
const blogPosts = [
    {
        id: 1,
        author: { username: "user1", name: "User 1" },
        body: "......",
        comments: [
            {
                id: 1,
                author: { username: "user2", name: "User 2" },
                comment: ".....",
            },
            {
                id: 2,
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            }
        ]
    },
    {
        id: 2,
        author: { username: "user2", name: "User 2" },
        body: "......",
        comments: [
            {
                id: 3,
                author: { username: "user3", name: "User 3" },
                comment: ".....",
            },
            {
                id: 4,
                author: { username: "user1", name: "User 1" },
                comment: ".....",
            },
            {
                id: 5,
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
        author: { type: "FK", references: "User", relationName: "posts" },
        computed: { value: (val,ctx) => ctx.record.author.value.name }
    },
    Comment: {
        id: { type: "PK" },
        post: { type: "FK", references: "BlogPost", relationName: "comments", cascadeOnDelete: true },
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

    t.deepEqual(newTableState.ids, ["1","2"], "State ids array is updated");
    t.deepEqual(newTableState.byId["1"], { id: 1, author: "user1", body: "......" }, "State is updated with the inserted data");
});

test('insert record', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.insert(
        { id: 3, author: { username: "user1" }, body: "test" }
    );

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.byId["3"], { id: 3, author:"user1", body: "test" }, "State is updated with the inserted record");
});


test('update record', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.update(
        { id: 1, body: "updated" }
    );

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.byId["1"], { id: 1, author:"user1", body: "updated" }, "State is updated with the given data");
});

test('update non-modified record', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.update(
        { id: 1, body: "updated" }
    );

    const newState = session.commit();
    t.equal(state, newState, "State remains unmodified when applying update with same data");
});

test('add/remove record relation', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.get(1);
    const numComments = recordModel.comments.length;

    recordModel.comments.add({
        id: 6,
        author: "user3",
        comment: ".....",
    });
    t.assert(recordModel.comments.length === numComments + 1, "Added relation is reflected immediatly");

    recordModel.comments.remove( { id: 6 } );
    t.assert(recordModel.comments.length === numComments, "Removed relation is reflected immediatly");
});

test('computed property', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const { BlogPost } = session.tables;
    const recordModel = BlogPost.get(1);

    t.equal(recordModel.computed.value, "User 1", "computed property exists");
});