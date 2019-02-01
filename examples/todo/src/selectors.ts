import { createSelector, createStructuredSelector } from "reselect";
import { database, TaskTable, UserTable } from "./schema";

export interface TaskViewModel extends TodoApp.Task {
    ownerName: string;
    numComments: number;
    comments: CommentViewModel[];
}

export interface CommentViewModel extends TodoApp.Comment {
    authorName: string;
}

// tslint:disable-next-line:no-empty-interface
export interface UserViewModel extends TodoApp.User { }

const taskSelector = createStructuredSelector({
    Task: (state: any) => state.db.Task,
    User: (state: any) => state.db.User,
    Comment: (state: any) => state.db.Comment
});

export const selectFilteredTasks = createSelector(
    taskSelector,
    (state: any) => state.ui.taskFilter,
    (tables, filter) => database.selectTables(tables)
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
        const t = database.selectTables(tables).Task.get(id);

        return {
            ...t.value,
            ownerName: t.owner.value.name,
            numComments: t.comments.length,
            comments: t.comments.all().map(c => ({
                ...c.value,
                authorName: c.author.value.name
            }) as CommentViewModel)
        } as TaskViewModel;
    }
);

export const selectUsers = createSelector(
    (state: any) => state.db.User,
    (table) => {
        const User = database.selectTable(table) as UserTable;

        return User.values();
    }
);

export const selectTaskStats = createSelector(
    (state: any) => state.db.Task,
    (table) => {
        const Task = database.selectTable(table) as TaskTable;

        return {
            numOpen: Task.all().filter(t => t.value.status === "open").length,
            numClosed: Task.all().filter(t => t.value.status === "closed").length
        };
    }
);
