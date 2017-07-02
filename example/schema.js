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

export const db = ReduxDB.createDatabase(schema);