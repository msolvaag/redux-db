import { ActionsObservable, Epic } from "redux-observable";
import { Observable } from 'rxjs/Observable';
import { ajax } from 'rxjs/observable/dom/ajax';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/concat';

import { APP_LOAD, APP_LOAD_DONE, APP_ERROR, LOAD_TASKS_DONE, LOAD_USERS_DONE, DELETE_TASK, DELETE_TASK_DONE, UPDATE_TASK, UPDATE_TASK_DONE, ADD_COMMENT, ADD_COMMENT_DONE, DELETE_COMMENT, DELETE_COMMENT_DONE } from "./actions";

const headers = { "Content-Type": "application/json" };

export const appLoad = (action$: ActionsObservable<any>) =>
    action$.ofType(APP_LOAD)
        .switchMap(action =>
            Observable.concat(
                Observable.merge(
                    ajax.get("http://localhost:3000/tasks?_embed=comments").map(e => ({ type: LOAD_TASKS_DONE, payload: e.response })),
                    ajax.get("http://localhost:3000/users").map(e => ({ type: LOAD_USERS_DONE, payload: e.response }))
                ),
                Observable.of({ type: APP_LOAD_DONE })
            ).catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );

export const deleteTask = (action$: ActionsObservable<any>) =>
    action$.ofType(DELETE_TASK)
        .switchMap(action =>
            ajax.delete("http://localhost:3000/tasks/" + action.payload, headers)
                .map(e => ({ type: DELETE_TASK_DONE, payload: action.payload }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );

export const updateTask = (action$: ActionsObservable<any>) =>
    action$.ofType(UPDATE_TASK)
        .switchMap(action =>
            ajax.patch(`http://localhost:3000/tasks/${action.payload.id}`, action.payload, headers)
                .map(e => ({ type: UPDATE_TASK_DONE, payload: action.payload }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );


export const addComment = (action$: ActionsObservable<any>) =>
    action$.ofType(ADD_COMMENT)
        .switchMap(action =>
            ajax.post(`http://localhost:3000/comments`, action.payload, headers)
                .map(e => ({ type: ADD_COMMENT_DONE, payload: e.response }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );
export const deleteComment = (action$: ActionsObservable<any>) =>
    action$.ofType(DELETE_COMMENT)
        .switchMap(action =>
            ajax.delete(`http://localhost:3000/comments/${action.payload}`, headers)
                .map(e => ({ type: DELETE_COMMENT_DONE, payload: action.payload }))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );