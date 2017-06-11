import * as ReduxDB from "../src/index";

const db = ReduxDB.createDatabase("orm", {
    "user": {
        "id": { constraint: "PK" },
        "name": { type: "string" }
    },
    "project": {
        "id": { constraint: "PK" },
        "createdBy": { constraint: "FK", references: "user" }
    },
    "projectUser": {
        "project": { constraint: "FK", references: "project", relationName: "members" },
        "user": { constraint: "FK", references: "user", relationName: "memberships" }
    }
});

interface User extends ReduxDB.Record {
    memberships: ReduxDB.RecordSet<ProjectUser>;
}

interface Project extends ReduxDB.Record {
    members: ReduxDB.RecordSet<ProjectUser>;
    createdBy: User;
}

interface ProjectUser extends ReduxDB.Record { }

interface Tables {
    project: ReduxDB.Table<Project>;
    projectUser: ReduxDB.Table<ProjectUser>;
}

db.combineReducers((session, action) => {
    const { project } = (session.tables as any) as Tables;

    switch (action.type) {
        case "PROJECT_UPDATE":
            project.get(1).update(action.payload);
            break;
        case "PROJECT_ADD_USER":
            project.get(1).members.insert(action.payload);
            project.get(1).createdBy.memberships.update({});
            break;
    }
});