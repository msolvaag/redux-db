import { Session, dbInstance } from "./schema";
import { DONE, APP_LOAD, APP_ERROR, UI_SET_TASK_FILTER, LOAD_TASKS, LOAD_USERS, DELETE_TASK, UPDATE_TASK, ADD_COMMENT, DELETE_COMMENT, CREATE_TASK } from "./actions";
import { Reducer } from 'redux';

// db reducer
export const dbReducer = dbInstance.combineReducers(
    (session: Session, action: Action) => {
        const { Task, Comment, User } = session;

        switch (action.type) {
            case DONE(LOAD_TASKS):
            case DONE(CREATE_TASK):
                Task.upsert(action.payload);
                break;

            case DONE(LOAD_USERS):
                User.upsert(action.payload);
                break;

            case DONE(DELETE_TASK):
                Task.delete(action.payload);
                break;

            case DONE(UPDATE_TASK):
                Task.update(action.payload);
                break;

            case DONE(ADD_COMMENT):
                Comment.insert(action.payload);
                break;

            case DONE(DELETE_COMMENT):
                Comment.delete(action.payload);
                break;
        }
    }
);

// ui reducer
export const uiReducer: Reducer<TodoApp.UIState> = (state = { loading: false, error: null, taskFilter: "open" }, action) => {
    switch (action.type) {

        case APP_LOAD:
            return { ...state, loading: true };
        case DONE(APP_LOAD):
            return { ...state, loading: false };
        case APP_ERROR:
            return { ...state, error: action.payload };

        case UI_SET_TASK_FILTER:
            return { ...state, taskFilter: action.payload };
        default:
            return state;
    }
};