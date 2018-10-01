export const APP_ERROR = "APP_ERROR";
export const APP_LOAD = "APP_LOAD";

export const LOAD_TASKS = "LOAD_TASKS";
export const LOAD_USERS = "LOAD_USERS";

export const CREATE_TASK = "CREATE_TASK";
export const DELETE_TASK = "DELETE_TASK";
export const UPDATE_TASK = "UPDATE_TASK";

export const ADD_COMMENT = "ADD_COMMENT";
export const DELETE_COMMENT = "DELETE_COMMENT";

export const UI_SET_TASK_FILTER = "UI_SET_TASK_FILTER";

export const appError = (error: Error | null) => ({ type: APP_ERROR, payload: error });

export const createTask = (model: Partial<TodoApp.Task>) => ({ type: CREATE_TASK, payload: model });
export const deleteTask = (id: number) => ({ type: DELETE_TASK, payload: id });
export const updateTask = (model: Partial<TodoApp.Task>) => ({ type: UPDATE_TASK, payload: model });

export const addComment = (model: Partial<TodoApp.Comment>) => ({ type: ADD_COMMENT, payload: model });
export const deleteComment = (id: number) => ({ type: DELETE_COMMENT, payload: id });

export const setTaskFilter = (status: string) => ({ type: UI_SET_TASK_FILTER, payload: status });

export const DONE = (action: string) => `${action}_DONE`;
