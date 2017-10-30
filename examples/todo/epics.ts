import { ActionsObservable, Epic } from "redux-observable";
import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

import { APP_LOAD, APP_LOAD_DONE, APP_ERROR, DELETE_TASK, DELETE_TASK_DONE } from "./actions";

export const appLoad = (action$: ActionsObservable<any>) =>
    action$.ofType(APP_LOAD)
        .switchMap(action =>
            ajax.get("http://localhost:3000/tasks")
                .map(e => ({ type: APP_LOAD_DONE, payload: e.response }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );

export const deleteTask = (action$: ActionsObservable<any>) =>
    action$.ofType(DELETE_TASK)
        .switchMap(action =>
            ajax.delete("http://localhost:3000/tasks/" + action.payload)
                .map(e => ({ type: DELETE_TASK_DONE, payload: action.payload }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );