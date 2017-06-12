# redux-db

redux-db provides a normalized [redux](http://redux.js.org) store and easy object management. Inspired by great libraries such as [normalizr](https://www.npmjs.com/package/normalizr) and [redux-orm](https://www.npmjs.com/package/redux-orm), redux-db will give a similiar workflow with a smaller footprint.

**NB! Current release is in BETA dev.**

### How to install
#### node npm
```
npm install redux-db --save
```

### Usage
#### example in typescript
```
import * as ReduxDB from "redux-db";

const db = ReduxDB.createDatabase( "db", {
    "user": {
        "id": { constraint: "PK" }
    },
    "task": {
        "id": { constraint: "PK" },
        "createdBy": { constraint: "FK", references: "user" }
    },
    "userTasks":{
        "user": { constraint: "FK", references: "user", relationName: "tasks" },
        "task": { constraint: "FK", references: "task", relationName: "users"}
    }
});

const reducer = db.combineReducers(
    (session, action) => {
        const { task } = session;

        switch( action.type ){
            case "ADD_TASK":
                project.insert(action.payload);
                break;        
            case "FETCH_TASKS":
            case "FETCH_TASK":
                project.upsert(action.payload);
        }
    }
);
```

### Dependencies
* [tslib](https://www.npmjs.com/package/tslib)