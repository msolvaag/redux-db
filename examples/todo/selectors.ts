import { createSelector, createStructuredSelector } from 'reselect';
import { dbInstance as db, Session, Task } from "./schema";

export interface TaskViewModel extends Task {
    owner: string;
    numComments: number;
}

const taskSelector = createStructuredSelector({
    Task: (db: any) => db.Task,
    User: (db: any) => db.User,
    Comment: (db: any) => db.Comment
});

export const selectTasks = createSelector(
    taskSelector,
    (tables) => db.selectTables<Session>(tables).Task.all().map(t => ({
        ...t.value,
        owner: t.owner.value.name,
        numComments: t.comments.length
    }) as TaskViewModel)
)