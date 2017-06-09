import * as ReduxDB from "../src/index";
const db = ReduxDB.createDatabase("orm", {
    "user": {
        "id": { type: "PK" }
    },
    "project": {
        "id": { type: "PK" },
        "createdByID": { type: "FK", references: "user" }
    },
    "projectUser": {
        "project": { type: "FK", references: "project", relationName: "members" },
        "user": { type: "FK", references: "user", relationName: "memberships" }
    }
});
db.combineReducers((session, action) => {
    const { project } = session.tables;
    switch (action.type) {
        case "PROJECT_UPDATE":
            project.get(1).update(action.payload);
            break;
        case "PROJECT_ADD_USER":
            project.get(1).members.insert(action.payload);
            break;
    }
});
