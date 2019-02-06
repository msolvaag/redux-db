import * as data from "./data";
import { db, session } from "./schema";

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
