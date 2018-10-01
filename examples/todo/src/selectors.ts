import { createSelector, createStructuredSelector } from "reselect";
import { dbInstance as db, DbState, Session, schema } from "./schema";
import { TableState, DatabaseState } from '../../../src';

export interface TaskViewModel extends TodoApp.Task {
    ownerName: string;
    numComments: number;
    comments: CommentViewModel[];
}

export interface CommentViewModel extends TodoApp.Comment {
    authorName: string;
}

export interface UserViewModel extends TodoApp.User { }

const taskSelector = createStructuredSelector({
    Task: (state: any) => state.db.Task,
    User: (state: any) => state.db.User,
    Comment: (state: any) => state.db.Comment
});

export const selectFilteredTasks = createSelector(
    taskSelector,
    (state: any) => state.ui.taskFilter,
    (tables, filter) => db.selectTables(tables)
        .Task.all().filter(t => t.value.status === filter || filter === null).map(t => ({
            ...t.value,
            ownerName: t.owner.value.name,
            numComments: t.comments.length
        }) as TaskViewModel)
);

export const selectTask = createSelector(
    taskSelector,
    (state: any, id: any) => id,
    (tables, id) => {
        const t = db.selectTables<Session>(tables).Task.get(id);

        return {
            ...t.value,
            ownerName: t.owner.value.name,
            numComments: t.comments.length,
            comments: t.comments.map(c => ({
                ...c.value,
                authorName: c.author.value.name
            }) as CommentViewModel)
        } as TaskViewModel;
    }
);


export const selectUsers = createSelector(
    (state: any) => state.db,
    (dbState) => {
        const tables = db.wrapTables(dbState);
    }
);

export const selectTaskStats = createSelector(
    (state: any) => state.db.Task,
    (table) => {
        const Task = db.selectTable<TaskTable>(table);

        return {
            numOpen: Task.filter(t => t.value.status === "open").length,
            numClosed: Task.filter(t => t.value.status === "closed").length
        };
    }
);