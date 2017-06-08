import { ReduxDB } from "./database";

const db = new ReduxDB();
const schema = db.createSchema("orm", {
    "user": {
        "id": { type: "PK" }
    },
    "project": {
        "id": { type: "PK" },
        "createdByID": { type: "FK", references: "user" }
    },
    "projectUser": {
        "project": { type: "FK", references: "project" },
        "user": { type: "FK", references: "user" }
    }
});

db.createReducer(schema,
    (db, action) => {
        const { project } = db.tables;

        switch (action.type) {
            case "TEST":
                project.get(1).name("test");
                break;
        }
    }
);