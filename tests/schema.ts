import * as ReduxDB from "../src";

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

export interface User {
    username: string;
    name: string;
}

// Schema models
export interface UserRecord extends ReduxDB.TableRecord<User> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
}

export interface BlogPostRecord extends ReduxDB.TableRecord<BlogPost> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
    author: UserRecord;
}

export interface CommentRecord extends ReduxDB.TableRecord<Comment> {
    post: BlogPostRecord;
    author: UserRecord;
}

export interface MyTables extends ReduxDB.TableMap {
    BlogPost: ReduxDB.Table<BlogPostRecord>;
    Task: ReduxDB.Table<CommentRecord>;
    User: ReduxDB.Table<UserRecord>;
}

export const db = ReduxDB.createDatabase<MyTables>(schema);

export const session = (fn: (tables: MyTables) => void, state = {}) => {
    const session = db.createSession(state);
    fn(session.tables);
    return session.commit();
};
