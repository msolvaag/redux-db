import { Session, dbInstance } from "./schema";
import { APP_LOAD, APP_LOAD_DONE, APP_ERROR, DELETE_TASK_DONE, UI_SET_TASK_FILTER, UPDATE_TASK_DONE, ADD_COMMENT_DONE, DELETE_COMMENT_DONE, LOAD_TASKS_DONE, LOAD_USERS_DONE } from "./actions";

export interface Action {
    type: string;
    payload: any;
}

// db reducer
export const dbReducer = dbInstance.combineReducers(
    (session: Session, action: Action) => {
        const { Task, Comment, User } = session;

        switch (action.type) {
            case LOAD_TASKS_DONE:
                Task.upsert(action.payload);
                break;

            case LOAD_USERS_DONE:
                User.upsert(action.payload);
                break;

            case DELETE_TASK_DONE: {
                Task.delete(action.payload);
                break;
            }

            case UPDATE_TASK_DONE:
                Task.update(action.payload);
                break;

            case ADD_COMMENT_DONE:
                Comment.insert(action.payload);
                break;

            case DELETE_COMMENT_DONE:
                Comment.delete(action.payload);
                break;
        }
    }
);

// ui reducer
export const uiReducer = (state: TodoApp.UIState = { loading: false, error: null, taskFilter: "open" }, action: Action) => {
    switch (action.type) {

        case APP_LOAD:
            return { ...state, loading: true } as TodoApp.UIState;
        case APP_LOAD_DONE:
            return { ...state, loading: false } as TodoApp.UIState;
        case APP_ERROR:
            return { ...state, error: action.payload } as TodoApp.UIState;

        case UI_SET_TASK_FILTER:
            return { ...state, taskFilter: action.payload } as TodoApp.UIState;
        default:
            return state;
    }
};