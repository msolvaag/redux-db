# redux-db

redux-db provides a normalized [redux](http://redux.js.org) store and easy object management. Inspired by libraries such as [normalizr](https://www.npmjs.com/package/normalizr) and [redux-orm](https://www.npmjs.com/package/redux-orm), redux-db will give a similiar workflow with a smaller footprint (at the moment only ~10k minified).

**NB! Current release is in BETA dev.**

### How to install
#### node npm
```
npm install redux-db --save
```
#### yarn
```
yarn add redux-db
```
#### bower
```
bower install redux-db
```

### Usage
#### example many to many
```
import ReduxDB from "redux-db";

const db = ReduxDB.createDatabase( {
    "user": {
        "id": { constraint: "PK" }
    },
    "task": {
        "id": { constraint: "PK" },
        "createdBy": { constraint: "FK", references: "user" }
    },
    "userTask":{
        "user": { constraint: "FK", references: "user", relationName: "tasks" },
        "task": { constraint: "FK", references: "task", relationName: "users"}
    }
});

const reducer = db.combineReducers(
    (session, action) => {
        const { task, userTask, user } = session;

        switch( action.type ){
            case "ADD_TASK":
                task.insert(action.payload);
                break;        
            case "FETCH_TASKS_FULFILLED":
            case "FETCH_TASK_FULFILLED":
                // Payload may include nested data. 
                // Nested relations will automatically be normalized and upserted to the correct schema table.
                /* eg. [{
                    id: 1,
                    title: "Task one",
                    users: [
                        { id: 1, name: "Ola" },
                        { id: 2, name: "Kari }
                    ]
                }]*/

                task.upsert(action.payload);
                break;
            case "ADD_TASK_USER":
                const {taskId, userId} = action.payload;
                task.get(taskId).users.add(userId);
                // or
                // user.get(userId).tasks.add(taskId);
                // taskUser.insert({task:taskId,user:userId});
                break;
            case "REMOVE_TASK_USER":
                const {taskId, userId} = action.payload;
                task.get(taskId).users.remove(userId);
                // or
                // user.get(userId).tasks.remove(taskId);
                // taskUser.get({task:taskId,user:userId}).delete();
                break;
            case "CLEAR_TASK_USERS":
                const {taskId} = action.payload;
                task.get(taskId).users.delete();
                break;

        }
    } //, (session,action)=>{}, ... other reducers
);
```

### Dependencies
* none