import * as ReduxDB from "../../src/index";


// Given the schema
export const schema: ReduxDB.Schema = {
    "Project": {
        "id": { type: "PK" }
    },
    "Task": {
        "id": { type: "PK" },
        "projectId": { propName: "project", references: "Project", relationName: "tasks" },
        "ownerId": { propName: "owner", references: "User", relationName: "tasks" }
    },
    "User": {
        "id": { type: "PK" }
    },
    "Comment": {
        "id": { type: "PK" },
        "taskId": { propName: "task", references: "Task", relationName: "comments" },
        "author": { propName: "author", references: "User", relationName: "comments" }
    }
}

// Data models
export interface User {
    id: number;
    name: string;
}
export interface Project {
    id: number,
    title: string;
}
export interface Task {
    id: number;
    projectId: number;
    title: string;
}
export interface Comment {
    id: number;
    taskId: number;
    value: string;
    authorId: number;
}

// Schema models
export interface ProjectRecord extends ReduxDB.TableRecord<Project> {
    tasks: ReduxDB.TableRecordSet<TaskRecord>;
}

export interface UserRecord extends ReduxDB.TableRecord<User> {

}

export interface TaskRecord extends ReduxDB.TableRecord<Task> {
    project: ProjectRecord;
    comments: ReduxDB.TableRecordSet<CommentRecord>;
    owner: UserRecord;
}

export interface CommentRecord extends ReduxDB.TableRecord<Comment> {
    task: TaskRecord;
    author: UserRecord;
}

export interface Session extends ReduxDB.TableMap {
    Project: ReduxDB.Table<Project, ProjectRecord>;
    Task: ReduxDB.Table<Task, TaskRecord>;
    Comment: ReduxDB.Table<Comment, CommentRecord>;
}

export const dbInstance = ReduxDB.createDatabase(schema);