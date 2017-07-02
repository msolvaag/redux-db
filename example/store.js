/// store.js

import { createStore, combineReducers } from "redux";
import dbReducer from "./reducer";

export const store = createStore(
    combineReducers({
        db: dbReducer
        /* other reducers */
    })
);