import * as ReduxDB from "../../../src"; // "redux-db"

export const TABLE_TASK = "Task";
export const TABLE_USER = "User";
export const TABLE_COMMENT = "Comment";
export const TABLE_TASK_LABEL = "TaskLabel";
export const TABLE_LABEL = "Label";

// the schema
export const schema: ReduxDB.Schema = {
    [TABLE_TASK]: {
        id: { pk: true },
        owner: { references: TABLE_USER, relationName: "tasks" }
    },
    [TABLE_USER]: {
        id: { type: "PK" }
    },
    [TABLE_COMMENT]: {
        id: { type: "PK" },
        task: { fieldName: "taskId", references: TABLE_TASK, relationName: "comments" },
        author: { references: TABLE_USER, relationName: "comments" }
    },
    [TABLE_TASK_LABEL]: {
        labelId: { propName: "label", references: "Label", relationName: "tasks" },
        taskId: { propName: "task", references: "Task", relationName: "labels" }
    },
    [TABLE_LABEL]: {
        id: { type: "PK" },
        mod: { type: "PK", value: r => r.id + r.type }
    }
};

// create db instance
export const dbInstance = ReduxDB.createDatabase(schema, {
    onNormalize: {
        TaskLabel: (record, ctx) => {
            const { id, name, taskId } = record;

            ctx.emit("Label", { id, name });

            return { labelId: id, taskId };
        }
    }
});

// Schema models
export interface UserRecord extends ReduxDB.TableRecord<TodoApp.User> {
    tasks: ReduxDB.TableRecordSet<TaskRecord>;
    comments: ReduxDB.TableRecordSet<CommentRecord>;
}

export interface TaskRecord extends ReduxDB.TableRecord<TodoApp.Task> {
    comments: ReduxDB.TableRecordSet<CommentRecord>;
    labels: ReduxDB.TableRecordSet<LabelRecord>;
    owner: UserRecord;
}

export interface CommentRecord extends ReduxDB.TableRecord<TodoApp.Comment> {
    task: TaskRecord;
    author: UserRecord;
}

export interface LabelRecord extends ReduxDB.TableRecord<TodoApp.Label> {
    tasks: ReduxDB.TableRecordSet<TaskRecord>;
}

export type TaskTable = ReduxDB.Table<TaskRecord>;
export type UserTable = ReduxDB.Table<UserRecord>;
export type CommentTable = ReduxDB.Table<CommentRecord>;
export type LabelTable = ReduxDB.Table<LabelRecord>;

export interface Session {
    Task: TaskTable;
    Comment: CommentTable;
    User: UserTable;
    Label: LabelTable;
}
