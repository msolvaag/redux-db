export const APP_ERROR = "APP_ERROR";
export const APP_LOAD = "APP_LOAD";
export const APP_LOAD_DONE = "APP_LOAD_DONE";
export const DELETE_TASK = "DELETE_TASK";
export const DELETE_TASK_DONE = "DELETE_TASK_DONE";

export const appError = (error: Error) => ({ type: APP_ERROR, payload: error });
export const deleteTask = (id: number) => ({ type: DELETE_TASK, payload: id });