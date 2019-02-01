import * as actions from "./actions";
import { database, Session } from "./schema";

const { DONE } = actions;

// db reducer
export const dbReducer = database.combineReducers(
    (session: Session, action: Action) => {
        const { Task, Comment, User } = session;

        switch (action.type) {
            case DONE(actions.LOAD_TASKS):
            case DONE(actions.CREATE_TASK):
                Task.upsert(action.payload);
                break;

            case DONE(actions.LOAD_USERS):
                User.upsert(action.payload);
                break;

            case DONE(actions.DELETE_TASK):
                Task.delete(action.payload);
                break;

            case DONE(actions.UPDATE_TASK):
                Task.update(action.payload);
                break;

            case DONE(actions.ADD_COMMENT):
                Comment.insert(action.payload);
                break;

            case DONE(actions.DELETE_COMMENT):
                Comment.delete(action.payload);
                break;
        }
    }
);

// ui reducer
export const uiReducer = (state = { loading: false, error: null, taskFilter: "open" }, action: any) => {
    switch (action.type) {

        case actions.APP_LOAD:
            return { ...state, loading: true };
        case DONE(actions.APP_LOAD):
            return { ...state, loading: false };
        case actions.APP_ERROR:
            return { ...state, error: action.payload };

        case actions.UI_SET_TASK_FILTER:
            return { ...state, taskFilter: action.payload };
        default:
            return state;
    }
};
