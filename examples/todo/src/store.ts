import { createStore, combineReducers, compose, applyMiddleware, Reducer } from "redux";
import { createEpicMiddleware, combineEpics } from "redux-observable";

import { dbReducer, uiReducer } from "./reducer";
import { appLoad, createTask, deleteTask, updateTask, addComment, deleteComment } from "./epics";

const epicMiddleware = createEpicMiddleware(
    combineEpics(appLoad, createTask, deleteTask, updateTask, addComment, deleteComment)
);
const composeEnhancers = (window as any)["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] || compose;

export const store = createStore(
    combineReducers({
        db: dbReducer,
        ui: uiReducer
    }),
    composeEnhancers(
        applyMiddleware(epicMiddleware)
    )
);