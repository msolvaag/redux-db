============
Configure the store
============

After defining your schema and setting up your reducer(s). You'll need to configure the redux store.

::

    /// store.js

    import { createStore, combineReducers } from "redux";
    import dbReducer from "./reducer";
    
    export const store = createStore(
        combineReducers( {
            db: dbReducer
            ... other reducers
        } )
    );

The name for the redux-db state tree is up to you, but "db" suits well.