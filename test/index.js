var test = require('tape');
var reduxDB = require("../dist/cjs");
var schema = require("./schema");
var data = require("./data");

let state = {};

const db = reduxDB.createDatabase(schema.default);

test('insert records', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const recordModel = BlogPost.insertMany(data.blogPosts);

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.ids, ["1", "2"], "State ids array is updated");
    t.deepEqual(newTableState.byId["1"], {
        id: 1,
        author: "user1",
        body: "......"
    }, "State is updated with the inserted data");
});

test('insert record', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const record = {
        id: 3,
        author: {
            username: "user1"
        },
        body: "test"
    };
    const recordModel = BlogPost.insert(record);

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.byId["3"], {
        id: 3,
        author: "user1",
        body: "test"
    }, "State is updated with the inserted record");
    t.throws(() => BlogPost.insert(record), "Inserting a duplicate record violates PK");
});


test('update record', function (t) {
    t.plan(3);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const recordModel = BlogPost.update({
        id: 1,
        body: "updated"
    });

    t.assert(recordModel.value.body === "updated", "Record is updated");

    recordModel.update({
        body: "updated again"
    });

    t.assert(recordModel.value.body === "updated again", "Record is updated using partial updates");

    state = session.commit();
    const newTableState = state["BlogPost"];

    t.deepEqual(newTableState.byId["1"], {
        id: 1,
        author: "user1",
        body: "updated again"
    }, "State is updated with the given data");
});

test('update non-modified record', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const recordModel = BlogPost.update({
        id: 1,
        body: "updated again"
    });

    const newState = session.commit();
    t.equal(state, newState, "State remains unmodified when applying update with same data");
});

test('add/remove record relation', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const recordModel = BlogPost.get(1);
    const numComments = recordModel.comments.length;

    recordModel.comments.add({
        id: 6,
        author: "user3",
        comment: ".....",
    });
    t.assert(recordModel.comments.length === numComments + 1, "Added relation is reflected immediatly");

    recordModel.comments.remove({
        id: 6
    });
    t.assert(recordModel.comments.length === numComments, "Removed relation is reflected immediatly");
});

test('computed property', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;
    const recordModel = BlogPost.get(1);

    t.equal(recordModel.computed.value, "User 1", "computed property exists");
});

test('get by foreign key', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const {
        Comment,
        BlogPost
    } = session.tables;
    const post = BlogPost.get(1);
    const commentsByPost = Comment.getByFk("post", 1);

    t.deepEqual(commentsByPost.value, post.comments.value, "getByFk is equivalent to get by owner property");
});

test('record model has dynamic properties', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        Comment,
        BlogPost,
        User
    } = session.tables;
    const post = BlogPost.get(1);

    post.update({
        author: "user10"
    });

    t.assert(!post.author, "Updating a record FK to an non existing record clears the value");
    User.insert({
        username: "user10"
    });
    t.assert(post.author.value.username === "user10", "Inserting the missing record is reflected immediately");
});

test('add one 2 one relationship', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost,
        Unique
    } = session.tables;

    const uq = Unique.insert(data.uniqueData);
    t.assert(uq.post && uq.post.value && uq.post.value.id === 1, "Referencing record has foreign property");

    const post = BlogPost.get(1);
    t.assert(post.unique && post.unique.value && post.unique.value.id === 1, "Referenced record has unique property");
});

test('add one 2 one relationship through PK', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost,
        Unique2
    } = session.tables;

    const uq = Unique2.insert(data.uniqueData);
    t.assert(uq.post && uq.post.value && uq.post.value.id === 1, "Referencing record has foreign property");

    const post = BlogPost.get(1);
    t.assert(post.unique2 && post.unique2.value && post.unique2.value.id === 1, "Referenced record has unique property");
});

test('violate one 2 one relationship', function (t) {
    t.plan(1);

    const session = db.createSession(state);
    const {
        Unique
    } = session.tables;

    t.throws(() => Unique.insert({
        id: 3,
        postID: 1
    }), "Update/insert record with existing unique fk, throws an exception");
});


test('delete cascade', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost,
        Comment
    } = session.tables;

    let commentsByPost = Comment.getByFk("post", 1);
    t.assert(commentsByPost.length > 1, "Relations exists before delete.");

    BlogPost.delete(1);
    commentsByPost = Comment.getByFk("post", 1);

    t.assert(commentsByPost.length === 0, "Relations marked with 'cascade' is deleted when the referenced entity is deleted.");
});

test('inserting invalid data is handled', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;

    t.throws(() => BlogPost.insert([false, 1, "test"]), "Insert record of primitives throws an exception.");
    t.throws(() => BlogPost.insert({}), "Insert record with empty data throws an exception.");
    // t.throws(() => BlogPost.insert({
    //     id: 4,
    //     autor: "user1" // misstyped
    // }), "Insert record with invalid field throws an exception.");
});

test('inserting data without PK. Using the PK hook.', function (t) {
    t.plan(4);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;

    let seq = 0;
    db.onMissingPk = (record, schema) => {
        return "injected_" + (seq++);
    };

    const post1 = BlogPost.insert({ body: "some text" });
    const post2 = BlogPost.insert({ body: "some text" });

    t.assert(post1.id === "injected_0", "Missing PK's is generated by the general hook.");
    t.assert(post2.id === "injected_1", "Missing PK's is generated by the general hook.");
    t.assert(post1.value.id === "injected_0", "Missing PK's is set on the value also.");
    t.assert(post2.value.id === "injected_1", "Missing PK's is set on the value also.");
});


test('updating data without PK.', function (t) {
    t.plan(2);

    const session = db.createSession(state);
    const {
        BlogPost
    } = session.tables;

    let seq = 0;
    db.onMissingPk = (record, schema) => {
        return "injected_" + (seq++);
    };

    t.throws(() => {
        const recordModel = BlogPost.update({
            body: "updated"
        });
    }, "Updating a record without a valid ID fails even if the onMissingPk hook is defined.");

    t.assert( seq===0, "The onMissingPk hook is never called during updates.");
});
