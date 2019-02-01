import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import { combineEpics, createEpicMiddleware } from "redux-observable";

import { addComment, appLoad, createTask, deleteComment, deleteTask, updateTask } from "./epics";
import { dbReducer, uiReducer } from "./reducer";

const epicMiddleware = createEpicMiddleware(
    combineEpics(appLoad, createTask, deleteTask, updateTask, addComment, deleteComment)
);
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
    combineReducers({
        db: dbReducer,
        ui: uiReducer as any
    }),
    composeEnhancers(
        applyMiddleware(epicMiddleware)
    )
);
