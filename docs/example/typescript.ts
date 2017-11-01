import * as ReduxDB from "redux-db";

// Given the schema
export const schema = {
    "Project": {
        "id": { type: "PK" }
    },
    "Task": {
        "id": { type: "PK" },
        "projectId": { propName: "project", references: "Project", relationName: "tasks" }
    }
}

// Data models
export interface Project {
    id: number,
    title: string;
}
export interface Task {
    id: number;
    projectId: number;
}

// Schema models
export interface ProjectRecord extends ReduxDB.TableRecord<Project> {
    tasks: ReduxDB.TableRecordSet<TaskRecord>;
}

export interface TaskRecord extends ReduxDB.TableRecord<Task> {
    project: ProjectRecord;
}

export interface Session {
    Project: ReduxDB.Table<Project, ProjectRecord>;
    Task: ReduxDB.Table<Task, TaskRecord>;
}

// Reducer
export const dbReducer = (session: Session, action: { type: string, payload: any }) => {
    const { Project, Task } = session;

    switch (action.type) {
        case "SOME_ACTION": {
            const project = Project.get(action.payload);
            // project.tasks === typeof RecordSet<TaskRecord>
            // project.tasks.map( t=> t.value === typeof Task )
            break;
        }
    }
}