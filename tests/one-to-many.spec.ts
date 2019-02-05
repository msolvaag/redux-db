import * as ReduxDB from "../dist/cjs";
import * as data from "./data";

const schema = {
    User: {
        username: { pk: true }
    },
    BlogPost: {
        id: { pk: true },
        author: { references: "User", relationName: "posts" }
    },
    Comment: {
        id: { pk: true },
        post: { references: "BlogPost", relationName: "comments" },
        author: { references: "User", relationName: "comments" }
    }
};

export interface BlogPost {
    id: number;
    body: string;
}
export interface Comment {
    id: number;
    post: number;
}

interface User {
    username: string;
    name: string;
}

// Schema models
interface UserRecord extends ReduxDB.TableRecord<User> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
}

interface BlogPostRecord extends ReduxDB.TableRecord<BlogPost> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
    author: UserRecord;
}

interface CommentRecord extends ReduxDB.TableRecord<Comment> {
    post: BlogPostRecord;
    author: UserRecord;
}

interface MyTables extends ReduxDB.TableMap {
    BlogPost: ReduxDB.Table<BlogPostRecord>;
    Task: ReduxDB.Table<CommentRecord>;
    User: ReduxDB.Table<UserRecord>;
}

const db = ReduxDB.createDatabase<MyTables>(schema);

const session = (fn: (tables: MyTables) => void, state = {}) => {
    const session = db.createSession(state);
    fn(session.tables);
    return session.commit();
};

describe("one to many", () => {
    const state = session(({ BlogPost }) => BlogPost.insert(data.blogPosts));

    test("state is normalized", () =>
        expect(state).toMatchSnapshot());

    const tables = db.selectTables(state);

    const [originalPost] = data.blogPosts;
    const post = tables.BlogPost.get(originalPost.id);

    test("model", () => expect({
        ...post.value,
        comments: post.comments.all().map(c => ({
            ...c.value,
            author: c.author.value
        })),
        author: post.author.value
    }).toMatchObject(originalPost));
});
