import { fk, many, Model, ORM } from "redux-orm";

export class BlogPost extends Model {
    static modelName = "BlogPost";
    static fields = {
        user: fk("User", "posts"),
        comments: many("Comment", "post")
    };
}

export class Comment extends Model {
    static modelName = "Comment";
    static options = {
        idAttribute: "name"
    };
}

export class User extends Model {
    static modelName = "User";
}

export const orm = new ORM();
orm.register(BlogPost, Comment, User);

export const session = (fn: (tables: any) => void, state = orm.getEmptyState()) => {
    const session = orm.session(state);
    fn(session);
    return session.state;
};
