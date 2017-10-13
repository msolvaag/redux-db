/// schema.js

import * as ReduxDB from "redux-db";

const schema = {
    User: {
        username: { type: "PK" }
    },
    BlogPost: {
        id: { type: "PK" },
        author: { references: "User", relationName: "posts" }
    },
    Comment: {
        id: { type: "PK" },
        post: { references: "BlogPost", relationName: "comments" },
        author: { references: "User", relationName: "comments" }
    }
};

export const db = ReduxDB.createDatabase(schema);