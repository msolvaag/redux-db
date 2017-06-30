# redux-db

redux-db provides a normalized [redux](http://redux.js.org) store and easy object management.

**NB! Current release is in BETA**

## How to install
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

## Usage
```js
import ReduxDB from "redux-db";

const db = ReduxDB.createDatabase( {
    "user": {
        "id": { type: "PK" }
    },
    "task": {
        "id": { type: "PK" },
        "createdBy": { references: "user" }
    },
    "userTask":{
        "user": { references: "user", relationName: "tasks" },
        "task": { references: "task", relationName: "users"}
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
                // userTask.insert({task:taskId,user:userId});
                break;
            case "REMOVE_TASK_USER":
                const {taskId, userId} = action.payload;
                task.get(taskId).users.remove(userId);
                // or
                // user.get(userId).tasks.remove(taskId);
                // userTask.get({task:taskId,user:userId}).delete();
                break;
            case "CLEAR_TASK_USERS":
                const {taskId} = action.payload;
                task.get(taskId).users.delete();
                break;

        }
    } //, (session,action)=>{}, ... other reducers
);
```

## Why
Having a normalized state is a good strategy if your data is nested in different ways. The redux documentation has a nice explanation [here](http://redux.js.org/docs/recipes/reducers/NormalizingStateShape.html).

## Documentation
Head over to [http://redux-db.readthedocs.io](http://redux-db.readthedocs.io/en/latest/).

## Contact / feedback
Feel free to create issues and PR's. You may also comment/ask questions on the gitter channel: [https://gitter.im/redux-db](https://gitter.im/redux-db).

## Dependencies
* none

## Credits
This project is greatly inspired by libraries such as [normalizr](https://www.npmjs.com/package/normalizr) and [redux-orm](https://www.npmjs.com/package/redux-orm). redux-db is however a completly rewrite and only lends it's basic consepts.