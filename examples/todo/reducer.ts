import { Session, dbInstance } from "./schema";
import { APP_LOAD, APP_LOAD_DONE, APP_ERROR, DELETE_TASK_DONE } from "./actions";

export interface Action {
    type: string;
    payload: any;
}

// db reducer
export const dbReducer = dbInstance.combineReducers(
    (session: Session, action: Action) => {
        const { Project, Task } = session;

        switch (action.type) {
            case APP_LOAD_DONE: {
                Task.upsert(action.payload);
                break;
            }

            case DELETE_TASK_DONE: {
                Task.delete(action.payload);
                break;
            }
        }
    }
);


export interface AppState {
    loading: boolean;
    error: string | null;
}

// app reducer
export const appReducer = (state: AppState = { loading: false, error: null }, action: Action) => {
    switch (action.type) {

        case APP_LOAD:
            return { ...state, loading: true };
        case APP_LOAD_DONE:
            return { ...state, loading: false };
        case APP_ERROR:
            return { ...state, error: action.payload };
        default:
            return state;
    }
};