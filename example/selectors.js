/// selectors.js

import { db as myDb } from './schema';
import { createSelector, createStructuredSelector } from 'reselect';

// Single table, all records, no relations
export const selectAllPosts = createSelector(
    ({ db }) => db.BlogPost,
    (table) => {
        return reduxDb.selectTable(table).values;
    }
);

// using a structured selector, makes us select only the tables we want
const blogPostAndRels = createStructuredSelector({
    posts: ({ db }) => db.BlogPost,
    comments: ({ db }) => db.Comment,
    users: ({ db }) => db.User
});

// multiple complex models
export const selectAllPosts = createSelector(
    blogPostAndRels,
    (tables) => {
        // get the TableModel
        const { BlogPost } = reduxDb.selectTables(tables);

        return BlogPost.all().map(_serializePost);
    }
);

// single complex model by id
export const selectPost = createSelector(
    blogPostAndRels,
    (state, props) => props.postId,
    (tables, id) => {
        // get the TableModel
        const { BlogPost } = reduxDb.selectTables(tables);

        // get the Record by id
        const postModel = BlogPost.get(id);

        return postModel && _serializePost(postModel);
    }
);

const _serializePost = (post) => {
    return {
        ...post.value,
        numComments: post.comments.length,
        author: post.author.value.name
    };
};