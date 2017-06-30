============
Defining your schema
============

To make redux-db normalize your nested data, you must define a schema.
Given the following data:

.. code-block:: js

    const blogPosts = [
        {
            id : "post1",
            author : {username : "user1", name : "User 1"},
            body : "......",
            comments : [
                {
                    id : "comment1",
                    author : {username : "user2", name : "User 2"},
                    comment : ".....",
                },
                {
                    id : "comment2",
                    author : {username : "user3", name : "User 3"},
                    comment : ".....",
                }
            ]    
        },
        {
            id : "post2",
            author : {username : "user2", name : "User 2"},
            body : "......",
            comments : [
                {
                    id : "comment3",
                    author : {username : "user3", name : "User 3"},
                    comment : ".....",
                },
                {
                    id : "comment4",
                    author : {username : "user1", name : "User 1"},
                    comment : ".....",
                },
                {
                    id : "comment5",
                    author : {username : "user3", name : "User 3"},
                    comment : ".....",
                }
            ]    
        }
    ]

You would define a schema like so:

.. code-block:: js

    /// schema.js

    import * as ReduxDB from "redux-db";

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
    
    export const db = ReduxDB.createDatabase( schema );

Note you only define foreign and primary keys. The data fields like "User.name" and "Comment.comment" are not needed in the schema.

``Tip. you do not have to specify type: "FK" when using the "references" property.``

Using this schema definition, the example data would be normalized out in the following manner:

.. code-block:: js
    {
        User: {
            ids: [ "user1", "user2", "user3" ],
            byId: {
                "user1": {
                    username: "user1",
                    name: "User 1"
                },
                "user2": {
                    username: "user2",
                    name: "User 2"
                },
                "user3": {
                    username: "user3",
                    name: "User 3"
                }
            }
        },
        BlogPost: {
            ids: [ "post1", "post2" ],
            byId: {
                "post1": {
                    id: "post1",
                    author: "user1",
                    body: "....."
                },
                "post2": {
                    id: "post2",
                    author: "user2",
                    body: "....."
                }
            }
        },
        Comment: {
            ids: [ "comment1", ..., "comment3", ... ],
            byId: {
                "comment1": {
                    id: "comment1",
                    post: "post1",
                    author: "user2",
                    comment: "....."
                },
                ...
                "comment3": {
                    id: "comment3",
                    post: "post2",
                    author: "user3",
                    comment: "....."
                },
                ...
            }
        }
    }
