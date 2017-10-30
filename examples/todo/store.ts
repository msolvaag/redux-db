import { createStore, combineReducers, compose, applyMiddleware } from "redux";
import { createEpicMiddleware, combineEpics } from "redux-observable";

import { dbReducer, appReducer } from "./reducer";
import { appLoad, deleteTask } from "./epics";

const epicMiddleware = createEpicMiddleware(
    combineEpics(appLoad, deleteTask)
);
const composeEnhancers = (window as any)["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] || compose;

export const store = createStore(
    combineReducers({
        db: dbReducer,
        app: appReducer
    }),
    composeEnhancers(
        applyMiddleware(epicMiddleware)
    )
);