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

interface Project extends ReduxDB.Record {
    members: ReduxDB.RecordSet<ProjectUser>;
}

interface ProjectUser extends ReduxDB.Record { }

interface Tables {
    project: ReduxDB.Table<Project>;
    projectUser: ReduxDB.Table<ProjectUser>;
}

db.combineReducers((session, action) => {
    const { project } = session.tables as Tables;

    switch (action.type) {
        case "PROJECT_UPDATE":
            project.get(1).update(action.payload);
            break;
        case "PROJECT_ADD_USER":
            project.get(1).members.insert(action.payload);
            break;
    }
});