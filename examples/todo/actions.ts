export const APP_ERROR = "APP_ERROR";
export const APP_LOAD = "APP_LOAD";
export const APP_LOAD_DONE = "APP_LOAD_DONE";

export const LOAD_TASKS_DONE = "LOAD_TASKS_DONE";
export const LOAD_USERS_DONE = "LOAD_USERS_DONE";

export const CREATE_TASK = "CREATE_TASK";
export const CREATE_TASK_DONE = "CREATE_TASK_DONE";
export const DELETE_TASK = "DELETE_TASK";
export const DELETE_TASK_DONE = "DELETE_TASK_DONE";
export const UPDATE_TASK = "UPDATE_TASK";
export const UPDATE_TASK_DONE = "UPDATE_TASK_DONE";

export const ADD_COMMENT = "ADD_COMMENT";
export const ADD_COMMENT_DONE = "ADD_COMMENT_DONE";
export const DELETE_COMMENT = "DELETE_COMMENT";
export const DELETE_COMMENT_DONE = "DELETE_COMMENT_DONE";

export const UI_SET_TASK_FILTER = "UI_SET_TASK_FILTER";

export const appError = (error: Error) => ({ type: APP_ERROR, payload: error });
export const deleteTask = (id: number) => ({ type: DELETE_TASK, payload: id });
export const updateTask = (model: Partial<TodoApp.Task>) => ({ type: UPDATE_TASK, payload: model });

export const addComment = (model: Partial<TodoApp.Comment>) => ({ type: ADD_COMMENT, payload: model });
export const deleteComment = (id: number) => ({ type: DELETE_COMMENT, payload: id });

export const setTaskFilter = (status: string) => ({ type: UI_SET_TASK_FILTER, payload: status });