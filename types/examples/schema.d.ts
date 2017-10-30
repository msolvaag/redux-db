import * as ReduxDB from "../src/index";
export declare const schema: {
    "Project": {
        "id": {
            type: string;
        };
    };
    "Task": {
        "id": {
            type: string;
        };
        "projectId": {
            propName: string;
            references: string;
            relationName: string;
        };
    };
};
export interface Project {
    id: number;
    title: string;
}
export interface Task {
    id: number;
    projectId: number;
}
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
export declare const dbReducer: (session: Session, action: {
    type: string;
    payload: any;
}) => void;
